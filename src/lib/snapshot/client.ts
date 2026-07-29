/**
 * Snapshot client: state machine, validation, focus management.
 *
 * Reads the questionnaire from the DOM rather than importing the
 * question set, so question text ships once in the HTML rather than
 * twice. Keeps the bundle small and keeps this file free of copy.
 *
 * Phase 1: no network call. `Generate` reveals a result that was
 * rendered server side. Phase 2 replaces `generate()` with a POST and
 * populates the result slots from the response. Nothing else changes.
 *
 * Focus contract, one target per transition, announced once:
 *   screen change      -> screen heading
 *   validation failure -> error summary
 *   result generated   -> result headline
 *   benchmark accepted -> confirmation line
 *   follow-up opened   -> first field
 *   follow-up closed   -> the button that opened it
 */

import { track } from './analytics';
import { submitFollowUp, submitIndexContribution } from './submit';

const ANSWERS_KEY = 'intv-snapshot-answers';
const SCREEN_KEY = 'intv-snapshot-screen';

interface State {
  screen: number;
  answers: Record<string, string>;
  started: boolean;
  completed: boolean;
  lastOpener: HTMLElement | null;
}

export function initSnapshot(): void {
  const found = document.querySelector<HTMLElement>('[data-snapshot-flow]');
  if (!found) return;
  // Narrowed alias. Function declarations below are hoisted, so TypeScript
  // cannot prove the guard above ran before they are called.
  const flow: HTMLElement = found;

  const screens = Array.from(flow.querySelectorAll<HTMLElement>('[data-screen]'));
  if (screens.length === 0) return;

  const announce = flow.querySelector<HTMLElement>('[data-snapshot-announce]');
  const progressLabel = flow.querySelector<HTMLElement>('[data-progress-label]');
  const progressFill = flow.querySelector<HTMLElement>('[data-progress-fill]');
  const resultSection = document.querySelector<HTMLElement>('[data-snapshot-result]');
  const resultHeadline = document.querySelector<HTMLElement>('[data-result-headline]');
  const benchmark = document.querySelector<HTMLElement>('[data-benchmark]');
  const conversion = document.querySelector<HTMLElement>('[data-conversion]');
  const beginButton = document.querySelector<HTMLElement>('[data-snapshot-begin]');

  const allInputs = Array.from(
    flow.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  );
  const allInputNames = Array.from(new Set(allInputs.map((i) => i.name)));
  const totalQuestions = allInputNames.length;

  const state: State = {
    screen: 1,
    answers: {},
    started: false,
    completed: false,
    lastOpener: null,
  };

  /* ---------- persistence ---------- */

  function save(): void {
    try {
      sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(state.answers));
      sessionStorage.setItem(SCREEN_KEY, String(state.screen));
    } catch {
      /* a full or blocked sessionStorage must not break the flow */
    }
  }

  function restore(): void {
    try {
      const raw = sessionStorage.getItem(ANSWERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        Object.entries(parsed).forEach(([name, value]) => {
          const input = flow.querySelector<HTMLInputElement>(
            `input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`,
          );
          if (input) {
            input.checked = true;
            state.answers[name] = value;
          }
        });
      }
      const savedScreen = Number(sessionStorage.getItem(SCREEN_KEY));
      if (savedScreen >= 1 && savedScreen <= screens.length) {
        state.screen = savedScreen;
      }
    } catch {
      /* corrupt state is discarded silently; the visitor starts fresh */
    }
  }

  /* ---------- progress ---------- */

  function updateProgress(): void {
    const answered = Object.keys(state.answers).length;
    if (progressFill) {
      progressFill.style.width = `${Math.round((answered / totalQuestions) * 100)}%`;
    }
    if (!progressLabel) return;

    const current = screens[state.screen - 1];
    const names = Array.from(
      new Set(
        Array.from(current.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(
          (i) => i.name,
        ),
      ),
    );
    const positions = names.map((n) => allInputNames.indexOf(n) + 1);
    const first = Math.min(...positions);
    const last = Math.max(...positions);
    progressLabel.textContent =
      first === last
        ? `Question ${first} of ${totalQuestions}`
        : `Questions ${first} and ${last} of ${totalQuestions}`;
  }

  /* ---------- validation ---------- */

  function clearErrors(screen: HTMLElement): void {
    screen.querySelectorAll<HTMLElement>('[data-question-error]').forEach((el) => {
      el.textContent = '';
    });
    screen.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
      input.removeAttribute('aria-invalid');
    });
    const summary = screen.querySelector<HTMLElement>('[data-error-summary]');
    if (summary) summary.hidden = true;
  }

  function validate(screen: HTMLElement): boolean {
    clearErrors(screen);

    const unanswered = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-question]'),
    ).filter((fieldset) => {
      const name = fieldset.getAttribute('data-question');
      return name ? !state.answers[name] : false;
    });

    if (unanswered.length === 0) return true;

    const message =
      "Select an option to continue. If you are not sure, choose 'Not known'. That is a valid and useful answer.";

    unanswered.forEach((fieldset) => {
      const errorEl = fieldset.querySelector<HTMLElement>('[data-question-error]');
      if (errorEl) errorEl.textContent = message;
      fieldset
        .querySelectorAll<HTMLInputElement>('input[type="radio"]')
        .forEach((input) => input.setAttribute('aria-invalid', 'true'));
    });

    const summary = screen.querySelector<HTMLElement>('[data-error-summary]');
    const list = screen.querySelector<HTMLElement>('[data-error-list]');
    if (summary && list) {
      list.innerHTML = '';
      unanswered.forEach((fieldset) => {
        const legend = fieldset.querySelector('legend')?.textContent ?? 'This question';
        const firstInput = fieldset.querySelector<HTMLInputElement>('input[type="radio"]');
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = legend;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          firstInput?.focus();
        });
        li.appendChild(link);
        list.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
    }

    return false;
  }

  /* ---------- focus ---------- */

  /**
   * Moves focus to a target and brings it into view deterministically.
   *
   * `focus()` on its own would scroll, but the site sets
   * `scroll-behavior: smooth` globally, so the position is animated and
   * therefore indeterminate for however long the animation runs. That
   * matters here because hiding the question flow changes the document
   * height at the same moment, and the two can race.
   *
   * So: focus without scrolling, then scroll instantly. `scrollIntoView`
   * honours `scroll-margin-top`, which is what clears the sticky header.
   */
  function focusAndReveal(target: HTMLElement): void {
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
  }

  /* ---------- screen transitions ---------- */

  function showScreen(index: number, moveFocus = true): void {
    state.screen = index;
    screens.forEach((screen, i) => {
      screen.hidden = i !== index - 1;
    });
    updateProgress();
    save();

    const current = screens[index - 1];
    const heading = current.querySelector<HTMLElement>('[data-screen-heading]');
    const label = current.querySelector<HTMLElement>('.label')?.textContent?.trim() ?? '';

    if (moveFocus && heading) focusAndReveal(heading);
    if (announce) {
      announce.textContent = `${label}. ${progressLabel?.textContent ?? ''}`;
    }
  }

  /* ---------- generate ---------- */

  function generate(): void {
    const current = screens[state.screen - 1];
    if (!validate(current)) return;

    // Phase 1: the result is already rendered server side. Phase 2
    // replaces this block with a POST to /v1/snapshot and populates the
    // result slots from the response. No answers leave the browser here.
    state.completed = true;
    track('snapshot_completed');

    flow.hidden = true;
    if (resultSection) resultSection.hidden = false;
    if (benchmark) benchmark.hidden = false;
    if (conversion) conversion.hidden = false;

    track('result_generated', {
      least_confident_area: resultSection?.dataset.leastConfidentArea ?? 'unknown',
      confidence_basis: resultSection?.dataset.confidenceBasis ?? 'unknown',
    });

    if (resultHeadline) focusAndReveal(resultHeadline);
    if (announce) announce.textContent = 'Your Snapshot is ready.';
  }

  /* ---------- wiring ---------- */

  allInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state.answers[input.name] = input.value;
      const fieldset = input.closest<HTMLElement>('[data-question]');
      if (fieldset) {
        const errorEl = fieldset.querySelector<HTMLElement>('[data-question-error]');
        if (errorEl) errorEl.textContent = '';
        fieldset
          .querySelectorAll<HTMLInputElement>('input[type="radio"]')
          .forEach((i) => i.removeAttribute('aria-invalid'));
      }
      updateProgress();
      save();
    });
  });

  flow.querySelectorAll<HTMLElement>('[data-snapshot-next]').forEach((button) => {
    button.addEventListener('click', () => {
      const current = screens[state.screen - 1];
      if (!validate(current)) return;
      track('snapshot_step_completed', { step: state.screen });
      showScreen(state.screen + 1);
    });
  });

  flow.querySelectorAll<HTMLElement>('[data-snapshot-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.screen > 1) showScreen(state.screen - 1);
    });
  });

  flow.querySelectorAll<HTMLElement>('[data-snapshot-generate]').forEach((button) => {
    button.addEventListener('click', generate);
  });

  if (beginButton) {
    beginButton.addEventListener('click', (event) => {
      event.preventDefault();
      flow.hidden = false;
      state.started = true;
      track('snapshot_started');
      // showScreen focuses the screen heading, which scrolls it into
      // view with its scroll-margin-top applied.
      showScreen(state.screen);
    });
  }

  /* ---------- benchmark control ---------- */

  const benchmarkSubmit = document.querySelector<HTMLButtonElement>('[data-benchmark-submit]');
  const benchmarkConsent = document.querySelector<HTMLInputElement>('[data-benchmark-consent]');
  const benchmarkConfirmed = document.querySelector<HTMLElement>('[data-benchmark-confirmed]');
  const benchmarkError = document.querySelector<HTMLElement>('[data-benchmark-error]');

  if (benchmarkSubmit && benchmarkConsent && benchmarkConfirmed) {
    benchmarkSubmit.addEventListener('click', async () => {
      if (!benchmarkConsent.checked || benchmarkSubmit.disabled) return;

      const label = benchmarkSubmit.textContent ?? '';
      benchmarkSubmit.disabled = true;
      benchmarkSubmit.textContent = 'Sending…';

      // Answers only. No identity of any kind is assembled here, and
      // the submit helper drops anything that is not an answer key.
      const { ok } = await submitIndexContribution({
        answers: state.answers,
        question_set_version: resultSection?.dataset.questionSetVersion ?? '',
        copy_version: resultSection?.dataset.copyVersion ?? '',
      }).catch(() => ({ ok: false }));

      if (!ok) {
        benchmarkSubmit.disabled = false;
        benchmarkSubmit.textContent = label;
        if (benchmarkError) {
          benchmarkError.textContent =
            'That did not send, and nothing was recorded. Try again, or leave it.';
          benchmarkError.hidden = false;
        }
        return;
      }

      benchmarkConsent.closest('label')?.setAttribute('hidden', '');
      benchmarkSubmit.hidden = true;
      if (benchmarkError) benchmarkError.hidden = true;
      benchmarkConfirmed.hidden = false;
      benchmarkConfirmed.focus();
      track('benchmark_contributed');
    });
  }

  /* ---------- conversion actions ---------- */

  const followup = document.querySelector<HTMLElement>('[data-followup]');
  const followupHeading = document.querySelector<HTMLElement>('[data-followup-heading]');

  document.querySelectorAll<HTMLElement>('[data-action-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action-open') ?? '';
      state.lastOpener = button;
      track('follow_up_opened', { action });
      if (action === 'email_snapshot_and_sample') track('email_snapshot_requested');
      if (action === 'contact_intervene') track('contact_intervene_requested');

      if (!followup) return;
      followup.hidden = false;
      const firstField = followup.querySelector<HTMLInputElement>('input:not([disabled])');
      if (firstField) firstField.focus();
      else if (followupHeading) followupHeading.focus();
    });
  });

  document.querySelectorAll<HTMLElement>('[data-action-link]').forEach((link) => {
    link.addEventListener('click', () => track('learn_agda_clicked'));
  });

  const followupCancel = document.querySelector<HTMLElement>('[data-followup-cancel]');
  if (followupCancel && followup) {
    followupCancel.addEventListener('click', () => {
      followup.hidden = true;
      state.lastOpener?.focus();
    });
  }

  const followupForm = document.querySelector<HTMLFormElement>('[data-followup-form]');
  const followupSubmit = document.querySelector<HTMLButtonElement>('[data-followup-submit]');
  const followupStatus = document.querySelector<HTMLElement>('[data-followup-status]');

  const setFollowupStatus = (text: string, kind: 'ok' | 'err' | 'pending') => {
    if (!followupStatus) return;
    followupStatus.textContent = text;
    followupStatus.dataset.state = kind;
    followupStatus.hidden = false;
  };

  if (followupForm) {
    followupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const honey = followupForm.querySelector<HTMLInputElement>('input[name="_gotcha"]');
      if (honey && honey.value) return;
      if (!followupForm.reportValidity()) return;

      const data = new FormData(followupForm);
      const action = state.lastOpener?.getAttribute('data-action-open') ?? 'contact_intervene';

      if (followupSubmit) {
        followupSubmit.disabled = true;
        followupSubmit.dataset.label = followupSubmit.textContent ?? '';
        followupSubmit.textContent = 'Sending…';
      }
      setFollowupStatus('Sending.', 'pending');

      const { ok } = await submitFollowUp({
        name: String(data.get('name') ?? ''),
        business_email: String(data.get('business_email') ?? ''),
        organisation: String(data.get('organisation') ?? ''),
        role_title: String(data.get('role_title') ?? ''),
        requested_action: action,
        least_confident_area: resultSection?.dataset.leastConfidentArea ?? '',
        confidence_basis: resultSection?.dataset.confidenceBasis ?? '',
        headline: resultHeadline?.textContent?.trim() ?? '',
        question_set_version: resultSection?.dataset.questionSetVersion ?? '',
        copy_version: resultSection?.dataset.copyVersion ?? '',
      }).catch(() => ({ ok: false }));

      if (followupSubmit) {
        followupSubmit.disabled = false;
        followupSubmit.textContent = followupSubmit.dataset.label ?? 'Send';
      }

      if (!ok) {
        setFollowupStatus(
          'That did not send, and nothing was recorded. Try again, or use the contact form.',
          'err',
        );
        return;
      }

      followupForm.reset();
      setFollowupStatus(
        'Received. A person replies within two working days. We do not auto-reply.',
        'ok',
      );
      if (action === 'email_snapshot_and_sample') track('email_snapshot_requested');
      if (action === 'contact_intervene') track('contact_intervene_requested');
    });
  }

  /* ---------- abandonment and print ---------- */

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    if (!state.started || state.completed) return;
    track('snapshot_abandoned', { last_step: state.screen });
  });

  window.addEventListener('beforeprint', () => {
    if (state.completed) track('result_printed');
  });

  /* ---------- boot ---------- */

  restore();
  if (Object.keys(state.answers).length > 0) {
    flow.hidden = false;
    state.started = true;
    showScreen(state.screen, false);
  } else {
    updateProgress();
  }
  track('readiness_page_viewed');
}
