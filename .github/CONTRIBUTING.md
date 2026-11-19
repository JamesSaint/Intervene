# Repository changes

This is the proprietary public website for Intervene. The existing [licence](../LICENSE) governs use of its contents.

## Authorship

James Saint is the author and creative authority for work undertaken under his direction. AI systems are tools and must not be recorded as authors, co-authors or owners.

Use James's configured Git identity for work performed on his behalf. Do not change that configuration, add AI co-author trailers, append tool session links or add AI credits to commits, pull requests, source files or documentation.

Preserve existing human authorship, copyright notices and third-party rights. Dependency-update automation remains identifiable as automation; its recorded activity must not be misrepresented as human authorship.

Pull-request checks reject AI author and committer identities, AI co-author trailers and AI credit lines in new commits and pull-request descriptions. These checks preserve legitimate dependency updates.

## Validation and publication

Use the Node version in `.nvmrc` and the npm version in `package.json`'s `packageManager` field. Keep `engine-strict=true`; do not bypass it to update the lockfile.

Run `npm ci --ignore-scripts`, `npm run content-check`, `npm test` and `npm run build`. Open a pull request and allow the required checks to pass. Merging to `main` publishes the site through GitHub Pages.

Private strategy, keys and environment files must remain outside this repository. See `scripts/check-private-paths.mjs` for the tracked-path checks.
