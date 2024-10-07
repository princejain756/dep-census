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

## Testing

```console
$ npm run build && npm test
```

## License

MIT
