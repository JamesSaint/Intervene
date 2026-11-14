# Release and rollback

How this site is released, and how a release is undone. The redesign was
released on 14 November 2026; the design decisions and wording changes
behind it are in `docs/redesign-record.md`.

## How a release happens

A push to `main` runs `.github/workflows/deploy.yml`, which checks, builds
and publishes to GitHub Pages at `https://intervene.uk`. There is no other
deployment path. The repository is public: anything pushed is published.

Before pushing to `main`, on the Node version in `.nvmrc`:

```
npm ci --ignore-scripts
npm run check-private-paths
npm run content-check
npm test
npm run typecheck
npm run build
npx playwright test
npx playwright test -c playwright-browsers.config.ts
```

The first five and the build are what the workflow itself runs. The two
browser suites are run locally against a preview of the build
(`node scripts/preview-foreground.mjs --host 127.0.0.1 --port 4173`, with
`PW_PORT=4173`).

Merge a branch into `main` with a merge commit (`git merge --no-ff`), so
that a release is one commit and can be undone as one.

## Rollback

The site before the redesign is `main` at commit `19e791c`. It stays in the
history; nothing about this release removes it.

To undo a release, revert its merge commit and push. Do not force-push.

```
git checkout main
git pull --ff-only
git revert -m 1 <merge commit>
git push origin main
```

`deploy.yml` then republishes the previous site. Everything a release
changes is in the repository, including the fonts, so the revert restores
all of it. DNS, the Pages settings and the workflows are not part of a
release and do not need to be touched.

After a rollback, check `https://intervene.uk/` loads the previous
homepage and that the workflow run for the revert commit succeeded.

## After a release

- Load the homepage and confirm the dial plays once and settles, and that
  its scenario control changes the chain beneath it.
- Confirm `/services/` shows the three fees and `/contact/` loads.
- `monitor.yml` checks the live site hourly and opens an issue on failure.

## Checks that are still manual

`docs/manual-test-procedures.md` holds two procedures that no automated
run covers: a VoiceOver review, and the email signature in real mail
clients. Record results there.
