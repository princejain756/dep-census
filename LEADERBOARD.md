# dep-census leaderboard

`npx dep-census <repo>` on the lockfiles of projects you probably have installed right now.

| repo | packages | strangers | top stranger | their share | deprecated |
|---|---:|---:|---|---:|---:|
| microsoft/vscode | 1,179 | 710 | ljharb | 10.3% | 28 |
| github/docs | 1,014 | 710 | ljharb | 11.1% | 6 |
| npm/cli | 851 | 450 | ljharb | 12.9% | 14 |
| microsoft/playwright | 632 | 390 | ljharb | 18.7% | 2 |
| microsoft/monaco-editor | 625 | 526 | devongovett | 14.4% | 8 |
| ionic-team/ionic-framework | 491 | 340 | sindresorhus | 21.2% | 81 |

Takeaways:

- npm's own CLI is maintained by 450 strangers. `ljharb` alone can ship into 12.9% of it — and is also the #1 stranger in VS Code (10.3%) and Playwright (18.7%). One account, three supply chains.
- Over half of every tree surveyed is maintained by exactly one person.
- Ionic's tree contains 81 deprecated packages — almost all legacy lerna plumbing.
- "stranger" doesn't mean hostile. It means unaudited-by-you. The point is you didn't know the number until just now.
