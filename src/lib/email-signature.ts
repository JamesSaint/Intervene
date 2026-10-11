import { contactEmail, socialLinks } from './social';
import { emailWordmark, markAgdaEmail, type EmailArtworkTone } from './marks';

// Notices supplied by James. Keep these strings verbatim, including the space after each label.
export const signatureNotices = {
  confidentiality: 'NOTICE: This email and any attachments are confidential and may be legally privileged. They are intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error, please notify the sender immediately by return email, delete it from your system, and do not copy, distribute, disclose, or otherwise use its contents. Any views or opinions expressed are those of the author and do not necessarily represent those of Intervene Limited unless explicitly stated otherwise. Whilst reasonable precautions are taken, Intervene Limited does not warrant that this email or any attachments are free from viruses or other harmful components. Recipients should carry out their own virus checks before opening any attachment. No liability is accepted for any loss or damage arising from the receipt or use of this email.',
  ai: 'AI NOTICE: This email and any attachments may have been prepared, checked, summarised, translated or otherwise assisted by artificial intelligence tools. Where AI has been used, the content has been subject to human review and editorial control, and responsibility for the communication remains with the sender. Unless expressly stated otherwise, this email is not an automated decision, nor is it generated or sent by an autonomous AI system.',
  environment: '♲ Please consider the environment before printing this email.',
} as const;

export const signatureCompany = 'Intervene Limited, registered in England and Wales, company number 17317647.';
export const signatureTrademark = 'AGDA is a registered trade mark of Intervene Limited in the United Kingdom (UK00004416503).';
export const signaturePositioning = 'Assess the ability to intervene.';
export const signatureHeader = 'Intervention Readiness, assessed.';

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Mail needs a document-level opt-in as well as dark artwork. These declarations
// must travel with the copied fragment, not only the standalone preview's head.
export const signatureAppearanceMeta = '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">';
const signatureAppearanceCss = ':root{color-scheme:light dark;supported-color-schemes:light dark;}';

// Inherit the host message colour when CSS is stripped. Never force a canvas colour.
// Each brand has one image. Picture sources adapt where retained; one black PNG is
// the fallback where an email editor removes the source element.
export const signatureCss = `
.sig-root { color:#1a1a1a !important; }
.sig-root .sig-secondary { color:#4a4a4a !important; }
.sig-root .sig-link { color:#c9b694 !important; text-decoration:none !important; }
.sig-root .sig-environment { color:#7a6c55 !important; }
@media (prefers-color-scheme:dark) {
  .sig-root { color:#f0f0f0 !important; }
  .sig-root .sig-secondary { color:#c8c6c4 !important; }
  .sig-root .sig-environment { color:#c9b694 !important; }
}`;

// Mail freezes imported table column widths. Normal blocks let this single-column
// signature reflow when the compose window or recipient viewport changes.
const row = (content: string, style: string, className = '') => `<div${className ? ` class="${className}"` : ''} style="padding:${style};color:inherit;">${content}</div>`;
// Mail resolves conditional link colours when inserting a signature. Keep the
// established brand gold literal so the requested colour survives insertion.
const link = (href: string, text: string) => `<a class="sig-link" href="${escapeHtml(href)}" style="color:#c9b694;text-decoration:none;">${escapeHtml(text)}</a>`;

// Mail already supplies the message gutter. Extra horizontal padding would
// indent the signature farther than the body text.
const renderSignature = (tone: EmailArtworkTone = 'adaptive') => `<div class="sig-root" style="color-scheme:light dark;supported-color-schemes:light dark;padding:24px 0;background:transparent;color:inherit;font-family:Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif;text-align:left;">
<div class="sig-header" style="border-left:2px solid #c9b694;padding:4px 0 4px 14px;margin:0 0 20px;">
<a href="https://intervene.uk/" style="display:inline-block;color:inherit;text-decoration:none;">${emailWordmark('intervene', tone)}</a>
${row(`<span style="font-size:13px;line-height:20px;">${signatureHeader}</span>`, '4px 0 0', 'sig-secondary')}
</div>
${row('<span style="font-size:16px;line-height:22px;font-weight:600;letter-spacing:-0.25px;">James Saint</span>', '0 0 2px')}
${row('<span style="font-size:13px;line-height:20px;">Founder, Intervene Limited</span>', '0 0 20px', 'sig-secondary')}
${row(`<span style="font-size:13px;line-height:22px;">${link(`mailto:${contactEmail}`, contactEmail)} · ${link('https://intervene.uk/', 'intervene.uk')} · ${link(socialLinks.jamesSaintLinkedIn, 'LinkedIn')}</span>`, '0 0 20px')}
<div class="sig-band" style="border-top:1px solid #c9b694;border-bottom:1px solid #c9b694;padding:12px 0;margin:0 0 16px;font-size:12px;line-height:20px;">
<a href="https://intervene.uk/agda/" style="display:inline-block;color:inherit;text-decoration:none;">${markAgdaEmail('AGDA®', tone)}</a><br>
<span class="sig-secondary" style="display:inline-block;padding-top:2px;color:inherit;">${signaturePositioning}</span>
</div>
${row(`<span style="font-size:11px;line-height:17px;">${escapeHtml(signatureCompany)}<br>${escapeHtml(signatureTrademark)}</span>`, '0 0 12px', 'sig-secondary')}
${Object.entries(signatureNotices).map(([name, notice]) => {
  const content = name === 'environment' ? escapeHtml(notice).replace('♲', '<span style="color:#c9b694;">♲</span>') : escapeHtml(notice).replace(/^(NOTICE:|AI NOTICE:)/, '<strong style="font-weight:600;">$1</strong>');
  return `<div class="${name === 'environment' ? 'sig-environment' : 'sig-secondary'}" data-notice="${name}" style="padding:0 0 12px;color:inherit;font-size:11px;line-height:17px;">${content}</div>`;
}).join('\n')}
</div>`;

export const signatureFragment = `${signatureAppearanceMeta}${renderSignature()}`;
export const signatureHtml = `<style>${signatureCss}</style>${signatureFragment}`;
export const signatureText = [
  'Intervene', signatureHeader, '', 'James Saint', 'Founder, Intervene Limited', contactEmail,
  'https://intervene.uk/', socialLinks.jamesSaintLinkedIn,
  '', 'AGDA®', signaturePositioning, '', signatureCompany, signatureTrademark,
  '', ...Object.values(signatureNotices),
].join('\n');

/** A standalone document also used for previews; presentation colour never enters the clipboard. */
export function signatureDocument(theme?: 'light' | 'dark'): string {
  // A direct Mail installation must retain the document opt-in without importing
  // the previews' resolved colours or body margin. Mail supplies its own gutter.
  if (!theme) return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${signatureAppearanceMeta}<meta name="robots" content="noindex, nofollow"><title>James Saint · Intervene email signature</title><style>${signatureAppearanceCss}</style></head><body>${signatureAppearanceMeta}<style>${signatureAppearanceCss}</style>${renderSignature()}</body></html>`;
  const presentation = `<style>html{color-scheme:${theme};}.sig-root{color-scheme:${theme}!important;}body{background:${theme === 'dark' ? '#1a1a1a' : '#ffffff'};color:${theme === 'dark' ? '#f0f0f0' : '#1a1a1a'};}\n${theme === 'dark' ? '.sig-root{color:#f0f0f0!important}.sig-root .sig-secondary{color:#c8c6c4!important}' : '.sig-root{color:#1a1a1a!important}.sig-root .sig-secondary{color:#4a4a4a!important}'}</style>`;
  // Previews use the local public assets so they work before publishing. The actual
  // email document and clipboard fragment always retain absolute production URLs.
  // The preview wrapper supplies the site's gutter; Mail supplies its own.
  const themedHtml = `<style>${signatureCss}</style>${renderSignature(theme === 'dark' ? 'white' : 'black')}<style>.sig-root .sig-environment{color:${theme === 'dark' ? '#c9b694' : '#7a6c55'}!important;}</style>`;
  const html = themedHtml.replaceAll('https://intervene.uk/assets/', '/assets/');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="robots" content="noindex, nofollow"><title>James Saint · Intervene email signature</title><style>body{margin:0;}img{max-width:100%;}</style></head><body>${html}${presentation}</body></html>`;
}
