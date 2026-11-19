/**
 * Rejects AI authorship metadata on new commits and pull-request descriptions.
 * Human identities and identifiable dependency automation are preserved.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const toolName = /^(?:claude(?:[- ]code| (?:opus|sonnet|haiku)(?: .*)?)?|chatgpt|codex|copilot|gemini|devin|aider|cursor|windsurf|codeium|tabnine)(?:\[bot\])?$/i;
const toolEmail = /^(?:noreply@anthropic\.com|codex@openai\.com)$/i;
const toolReference = /\b(?:claude|anthropic|chatgpt|openai|codex|copilot|gemini|devin|aider|cursor|windsurf|codeium|tabnine|gpt[- ]?\d)/i;

export function attributionProblems({ authorName = '', authorEmail = '', committerName = '', committerEmail = '', message = '' }) {
  const problems = [];
  if (toolName.test(authorName) || toolEmail.test(authorEmail)) problems.push('AI author identity');
  if (toolName.test(committerName) || toolEmail.test(committerEmail)) problems.push('AI committer identity');
  for (const line of message.split(/\r?\n/)) {
    const plain = line.replace(/^[\s_*\x60>]+/, '');
    if (/^co-authored-by\s*:/i.test(plain) && toolReference.test(plain)) problems.push('AI co-author trailer');
    if (/^(?:generated|created|written)\s+(?:with|by|using)\b/i.test(plain) && toolReference.test(plain)) problems.push('AI credit line');
    if (/^(?:claude|codex|ai)-session\s*:/i.test(plain) || /claude\.ai\/code\/session/i.test(plain)) problems.push('AI session attribution');
  }
  return [...new Set(problems)];
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trimEnd();
}

function check() {
  const head = process.env.AUTHORSHIP_HEAD || 'HEAD';
  const base = process.env.AUTHORSHIP_BASE;
  const revision = base && !/^0+$/.test(base) ? `${base}..${head}` : head;
  const commits = git('rev-list', ...(base && !/^0+$/.test(base) ? [] : ['-1']), revision).split('\n').filter(Boolean);
  const failures = [];
  for (const sha of commits) {
    const [authorName, authorEmail, committerName, committerEmail, message] =
      git('show', '-s', '--format=%an%x00%ae%x00%cn%x00%ce%x00%B', sha).split('\0');
    const problems = attributionProblems({ authorName, authorEmail, committerName, committerEmail, message });
    if (problems.length) failures.push(`${sha}: ${problems.join(', ')}`);
  }
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (event.pull_request) {
      const problems = attributionProblems({ message: event.pull_request.body || '' });
      if (problems.length) failures.push(`pull-request description: ${problems.join(', ')}`);
    }
  }
  if (failures.length) {
    console.error('check-authorship: remove AI attribution before merging:\n' + failures.map(x => '  ' + x).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`check-authorship: ${commits.length} new commit(s) checked; no AI attribution`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) check();
