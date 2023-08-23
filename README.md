# dep-census

Count the strangers inside `node_modules`.

Every `npm install` pulls in packages you never chose, maintained by people you
have never heard of. dep-census reads your lockfile, asks the npm registry who
maintains each package in your tree, and prints the number.

```console
$ npm run build
$ node dist/cli.js ./my-app
1,214 packages · 587 people can publish into them
  /home/you/my-app/package-lock.json
```

It takes either a directory (where it looks for `package-lock.json` or
`npm-shrinkwrap.json`) or the lockfile itself. Nested copies of the same package
are counted once, so a tree where `react` ships three times shows up as one.

## License

MIT
