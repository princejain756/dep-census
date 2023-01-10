# dep-census

Count the strangers inside `node_modules`.

Every `npm install` pulls in packages you never chose, maintained by people you
have never heard of. dep-census reads your lockfile, asks the npm registry who
maintains each package in your tree, and prints the number.

```console
$ npm run build
$ node dist/cli.js
812 packages · 402 people can publish into them
```

## License

MIT
