/**
 * The published notes, newest first. The index, each note's footer and the
 * note header read from here so titles, dates and order cannot disagree.
 * Titles, deks and dates are those on each note's own page.
 */
export interface Insight { slug: string; title: string; dek: string; date: string; kicker: string }

export const insights: Insight[] = [
  {
    slug: 'accountability-theatre',
    title: 'Accountability theatre: the named SMF without halt authority',
    dek: 'A designated executive who cannot stop the system is a name on a chart, not a control. AGDA® measures the pairing.',
    date: '2026-05-28',
    kicker: 'Note',
  },
  {
    slug: 'coincidence-is-not-a-margin',
    title: 'Coincidence is not a margin',
    dek: 'An absence of incidents does not show that controls work. Quiet is not the same as safe.',
    date: '2026-05-14',
    kicker: 'Note',
  },
  {
    slug: 'the-thirty-six-hour-window',
    title: 'The 36-hour window, and why the board hears last',
    dek: 'Authority travels upward through people who cannot act. By the time it reaches the board, the cheap intervention has passed.',
    date: '2026-04-30',
    kicker: 'Note',
  },
];

export const insightHref = (i: Insight) => `/insights/${i.slug}/`;
export const insightDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
