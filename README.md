# dep-census

Count the strangers inside `node_modules` — who actually maintains the code your
app runs.

Every `npm install` pulls in packages you never chose, maintained by people you
have never heard of. dep-census reads your lockfile, asks the npm registry who
maintains each package in your tree, and ranks the accounts that can ship code
into the largest share of what you install.

```console
$ npm run build
$ node dist/cli.js ./my-app

1,214 packages · 587 strangers
  /home/you/my-app/package-lock.json

top strangers in your supply chain
  1. ljharb                      64 pkgs  (5.3%)
  2. sindresorhus                61 pkgs  (5.0%)
  3. jonschlinkert               58 pkgs  (4.8%)
  ...

  668 packages (55.0%) are maintained by a single person
  71 deprecated: @types/cookie, gauge, ...
  2 packages list no maintainer at all

the #1 stranger (ljharb) can ship code into 5.3% of your install.
```

## Usage

```console
$ node dist/cli.js                 # ./package-lock.json
$ node dist/cli.js ./my-app        # directory containing a lockfile
$ node dist/cli.js ./lock.json     # a specific lockfile
```

Flags:

- `--top <n>` — how many strangers to list (default 15)
- `--json` — print the whole census as JSON, ready for `jq`

Nested copies of the same package are counted once, so a tree where `react`
ships three times still shows up as one. The old npm 6 lockfile format
(`lockfileVersion: 1`) is rejected with a message rather than silently counted
wrong.

## What it counts

- **strangers** — unique npm accounts that can publish a release of something in your tree
- **solo-maintained** — packages where exactly one account has publish rights
- **deprecated** — packages the registry itself marks deprecated
- **top strangers** — the accounts that can ship code into the largest share of your install

A stranger with publish rights to 10% of your tree is not a footnote. That is
your supply chain.

## Limits

- npm lockfiles only (`package-lock.json`, `npm-shrinkwrap.json`). yarn and pnpm use different formats — not supported yet.
- Maintainer lists come from the registry's `latest` doc; a stale install can have different historical maintainers.
- No vulnerability data — this is a census, not a scanner. Pair it with `npm audit` for the other half of the picture.

## Testing

```console
$ npm run build && npm test
```

## License

MIT