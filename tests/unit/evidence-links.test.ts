import { describe, it, expect } from 'vitest';
import { evidence, controls, recordLinks, findingStages, stages } from '../../src/lib/sample-report';

describe('record-to-stage links in the constructed sample', () => {
  it('accounts for every record once', () => {
    expect(recordLinks.map((l) => l.id).sort()).toEqual(evidence.map((e) => e.id).sort());
  });

  it('calls a link stated only where the record\'s own register entry supports it', () => {
    const open = (id: string) => evidence.find((e) => e.id === id)!.open;
    expect(recordLinks.find((l) => l.id === 'E-02')!.support).toBe('stated');
    expect(open('E-02')).toMatch(/detection timing/);
    expect(recordLinks.find((l) => l.id === 'E-08')!.support).toBe('stated');
    expect(open('E-08')).toMatch(/quorum/);
    expect(findingStages.find((s) => s.key === 'decide')!.note).toMatch(/quorum/);
  });

  it('calls a link matched where a control describes the record without citing it', () => {
    const c01 = controls.find((c) => c.code === 'C-01')!.assessment;
    const c03 = controls.find((c) => c.code === 'C-03')!.assessment;
    expect(c01).toMatch(/2024 outage post-mortem/);
    expect(c01).not.toMatch(/E-01/);
    expect(c03).toMatch(/tabletop in 2024-Q4/);
    expect(c03).not.toMatch(/E-04/);
    for (const id of ['E-01', 'E-04']) {
      const link = recordLinks.find((l) => l.id === id)!;
      expect(link.support).toBe('matched');
      expect(link.basis).toMatch(/does not cite this record by its identifier/);
    }
  });

  it('leaves unattached the records the sample ties to no single stage, and gives Intervene none', () => {
    expect(recordLinks.filter((l) => l.stage === null).map((l) => [l.id, l.support])).toEqual([['E-12', 'none'], ['E-06', 'none']]);
    expect(recordLinks.some((l) => l.stage === 'intervene')).toBe(false);
  });

  it('states the Intervene figure the same way on the homepage finding and in the sample report', () => {
    const home = findingStages.find((s) => s.key === 'intervene')!;
    const report = stages.find((s) => s.stage === 'Intervene')!;
    expect(home.value).toBe('Not assessed');
    expect(home.note).toMatch(/assumes about six minutes to propagate a halt if instructed; no duration is assessed here/);
    expect(report.value).toBe('~6 min');
    expect(report.detail).toMatch(/assumed by the source to propagate a halt if instructed\. No duration is assessed for this stage\./);
  });
});
