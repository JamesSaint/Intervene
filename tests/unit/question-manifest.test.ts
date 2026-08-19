/**
 * The question manifest is the contract between this repository and the
 * Worker, and CI enforces it by regenerating the file and failing on any
 * diff. That assertion is only worth having if generation is
 * deterministic.
 *
 * It was not. A `generated_at` field carried the wall-clock date, so the
 * committed file went stale at midnight and the first pull request
 * opened on a later day failed having changed nothing. The check had
 * become a calendar check.
 *
 * These tests hold both halves of the invariant. Generation must not
 * depend on the clock, and it must still depend on the question set.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  SOURCE,
  TARGET,
  buildManifest,
  serialiseManifest,
} from '../../scripts/generate-question-manifest.mjs';

const source = readFileSync(SOURCE, 'utf8');
const generate = () => serialiseManifest(buildManifest(source));

afterEach(() => vi.useRealTimers());

describe('determinism', () => {
  it('produces identical bytes on repeated runs', () => {
    expect(generate()).toBe(generate());
  });

  it('produces identical bytes on a different execution date', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-08-19T09:00:00Z'));
    const onTheDayItWasCommitted = generate();

    vi.setSystemTime(new Date('2027-03-01T23:59:59Z'));
    const monthsLater = generate();

    // The failure this file exists to prevent. If a clock-derived field
    // returns, these two differ and CI starts failing on the calendar.
    expect(monthsLater).toBe(onTheDayItWasCommitted);
  });

  it('carries no field that looks like a date or a timestamp', () => {
    const manifest = buildManifest(source);

    expect(Object.keys(manifest)).toEqual([
      'question_set_version',
      'question_count',
      'questions',
    ]);

    // Catches a timestamp reintroduced under any name, at any depth.
    expect(generate()).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('currentness', () => {
  it('matches the committed manifest exactly', () => {
    // The same comparison CI makes, run locally and on every push. A
    // question set change with an uncommitted manifest fails here first.
    expect(generate()).toBe(readFileSync(TARGET, 'utf8'));
  });
});

describe('the check still bites', () => {
  it('changes when a question set version changes', () => {
    const bumped = source.replace(/QUESTION_SET_VERSION\s*=\s*'[^']+'/, "QUESTION_SET_VERSION = 'qs-9.9'");
    expect(bumped).not.toBe(source);
    expect(serialiseManifest(buildManifest(bumped))).not.toBe(generate());
  });

  it('changes when an option value changes', () => {
    const before = buildManifest(source);
    const firstOption = before.questions[0].options[0];
    const edited = source.replace(`value: '${firstOption}'`, "value: 'changed_value'");
    expect(edited).not.toBe(source);

    const after = buildManifest(edited);
    expect(after.questions[0].options[0]).toBe('changed_value');
    expect(serialiseManifest(after)).not.toBe(generate());
  });

  it('refuses to build a manifest with no questions', () => {
    expect(() => buildManifest("export const QUESTION_SET_VERSION = 'qs-3.0';")).toThrow(
      /no questions parsed/,
    );
  });

  it('refuses to build a manifest with no version', () => {
    expect(() => buildManifest("id: 'q01_x' options: [ value: 'a' ]")).toThrow(
      /QUESTION_SET_VERSION not found/,
    );
  });
});
