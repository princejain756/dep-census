# dep-census

**`npx dep-census` counts the strangers inside your `node_modules` — who actually maintains the code your app runs.**

Every `npm install` is an act of trust. You vetted the package you typed; you did not vet the 700 transitive packages that came with it, or the people who can publish the next version of each. dep-census reads your lockfile, asks the npm registry who maintains every package in your tree, and prints the number nobody thinks about.

```console
$ npx dep-census microsoft/vscode

1,187 packages · 431 strangers · 12 deprecated
  microsoft/vscode (main)

top strangers in your supply chain
  1. microsoft1es               91 pkgs  (13.2%)
  2. ljharb                     67 pkgs  (9.7%)
  3. jonschlinkert              52 pkgs  (7.5%)
  4. microsoft-oss-releases     46 pkgs  (6.7%)
  5. sindresorhus               45 pkgs  (6.5%)
  ...

  357 packages (51.7%) are maintained by a single person
  12 deprecated: @types/cookie, @sinonjs/text-encoding, ...

the #1 stranger (microsoft1es) can ship code into 13.2% of your install.
```

## Usage

```console
$ npx dep-census                 # ./package-lock.json
$ npx dep-census ./my-app        # directory containing a lockfile
$ npx dep-census ./lock.json     # a specific lockfile
$ npx dep-census owner/repo      # a GitHub repo's lockfile, fetched on the fly
```

Flags: `--top <n>` strangers listed, `--json` for piping.

## What it counts

- **strangers** — unique npm accounts that can publish a release of something in your tree
- **solo-maintained** — packages where exactly one account has publish rights
- **deprecated** — packages the registry itself marks deprecated
- **not on public npm** — lockfile entries that resolve nowhere public (private registries, git deps)
- **top strangers** — the accounts that can ship code into the largest share of your install

A stranger with publish rights to 10% of your tree is not a footnote. That is your supply chain.

## Limits

- npm lockfiles only (`package-lock.json`, `npm-shrinkwrap.json`). yarn and pnpm use different formats — not supported yet.
- Maintainer lists come from the registry's `latest` doc; a stale install can have different historical maintainers.
- No vulnerability data — this is a census, not a scanner. Pair it with `npm audit` for the other half of the picture.

## Why

The xz backdoor was one overworked maintainer with commit access to a package half the internet ran. npm's graph is the same shape, one level deeper. The first step to knowing your exposure is knowing the count — and the names.

## License

MIT
