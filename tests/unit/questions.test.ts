import { describe, expect, it } from 'vitest';
import {
  questions,
  screens,
  totalQuestions,
  questionsWithNotKnown,
  QUESTION_SET_VERSION,
} from '../../src/lib/snapshot/questions';

/**
 * The question set is the public half of a two-repository contract.
 * These tests guard the properties the Worker relies on.
 */

describe('question set', () => {
  it('has nine questions across five screens', () => {
    // qs-2.0 cut the set from fifteen. Sector, size and role were
    // removed: none created curiosity, built trust or moved the visitor
    // forward, and they were charged as a toll before any value.
    expect(totalQuestions).toBe(9);
    expect(screens).toHaveLength(5);
  });

  it('declares a question set version', () => {
    expect(QUESTION_SET_VERSION).toMatch(/^qs-\d+\.\d+$/);
  });

  it('has globally unique question ids', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique option values within each question', () => {
    for (const question of questions) {
      const values = question.options.map((o) => o.value);
      expect(new Set(values).size, `duplicate option value in ${question.id}`).toBe(
        values.length,
      );
    }
  });

  it('gives every option a non-empty semantic value and label', () => {
    for (const question of questions) {
      for (const option of question.options) {
        expect(option.value.trim(), `${question.id} option value`).not.toBe('');
        expect(option.label.trim(), `${question.id} option label`).not.toBe('');
        // Values must be semantic identifiers, never positional or numeric.
        expect(option.value, `${question.id}:${option.value}`).toMatch(/^[a-z0-9_]+$/);
        expect(option.value, `${question.id}:${option.value}`).not.toMatch(/^\d+$/);
      }
    }
  });

  it('assigns every question to a screen that exists', () => {
    const indices = screens.map((s) => s.index);
    for (const question of questions) {
      expect(indices).toContain(question.screen);
    }
  });

  /**
   * The area layout the Response Model normalises against. Decide
   * carries three questions and the others carry two, which is exactly
   * why the model takes a mean rather than a sum. If this shape changes,
   * the Worker's normalisation must change with it.
   */
  it('has the documented area shape: detect 1, escalate 1, decide 2, intervene 2', () => {
    const count = (area: string) => questions.filter((q) => q.area === area).length;
    expect(count('detect')).toBe(1);
    expect(count('escalate')).toBe(1);
    expect(count('decide')).toBe(2);
    expect(count('intervene')).toBe(2);
    expect(count('context')).toBe(2);
    expect(count('confidence')).toBe(1);
  });

  it('keeps every area question count an exact divisor of 6', () => {
    // The Worker scales by 6 / questionCount to reach a common integer
    // scale. A count that does not divide 6 would reintroduce floats.
    for (const area of ['detect', 'escalate', 'decide', 'intervene']) {
      const n = questions.filter((q) => q.area === area).length;
      expect(6 % n, `area ${area} has ${n} questions`).toBe(0);
    }
  });

  it('offers Not known on every question except the confidence question', () => {
    expect(questionsWithNotKnown).toHaveLength(8);
    expect(questionsWithNotKnown).not.toContain('q09_confidence');
  });

  it('keeps the questions that produce the realisation', () => {
    // These six are the page. If any is removed, say why in the commit.
    for (const id of [
      'q03_detect', 'q04_escalate', 'q05_authority',
      'q06_exercised', 'q07_capability', 'q08_tested',
    ]) {
      expect(questions.map((q) => q.id), `${id} was removed`).toContain(id);
    }
  });

  it('asks nothing that only serves data collection', () => {
    // Sector, size and role belong after the visitor has chosen to
    // engage, not before they have been given anything.
    const ids = questions.map((q) => q.id).join(' ');
    expect(ids).not.toMatch(/sector/);
    expect(ids).not.toMatch(/\bsize\b/);
    expect(ids).not.toMatch(/\brole\b/);
  });

  it('contains no ordinal, weight, threshold or band data', () => {
    // The public repository must not carry any part of the Response
    // Model. This asserts the shape of every question object.
    const allowedKeys = new Set(['id', 'screen', 'area', 'legend', 'helper', 'options']);
    for (const question of questions) {
      for (const key of Object.keys(question)) {
        expect(allowedKeys, `unexpected key "${key}" on ${question.id}`).toContain(key);
      }
      for (const option of question.options) {
        expect(Object.keys(option).sort()).toEqual(['label', 'value']);
      }
    }
  });
});
