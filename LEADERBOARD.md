# dep-census leaderboard

`npx dep-census <repo>` on the lockfiles of projects you probably have installed right now.

| repo | packages | strangers | top stranger | their share | deprecated |
|---|---:|---:|---|---:|---:|
| Kong/insomnia | 1,571 | 1,786 | ljharb | 8.3% | 20 |
| axios/axios | 1,416 | 809 | sindresorhus | 12.9% | 80 |
| microsoft/vscode | 1,179 | 710 | ljharb | 10.3% | 28 |
| github/docs | 1,014 | 710 | ljharb | 11.1% | 6 |
| npm/cli | 851 | 450 | ljharb | 12.9% | 14 |

Takeaways:

- Insomnia's tree has more strangers than packages: 1,786 people can ship code into an app that holds your API keys.
- npm's own CLI is maintained by 450 strangers. `ljharb` alone can ship into 12.9% of it.
- Over half of every tree surveyed is maintained by exactly one person.
