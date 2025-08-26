import { strict as assert } from "node:assert";
import { parseLock, aggregate } from "../dist/census.js";

const lock = {
  lockfileVersion: 3,
  packages: {
    "": { name: "my-app" },
    "node_modules/react": {},
    "node_modules/@scope/thing": {},
    "node_modules/a/node_modules/b": {},
    "node_modules/react-sub/node_modules/react": {},
    "node_modules/.bin/foo": {},
  },
};

assert.deepEqual(parseLock(lock), ["@scope/thing", "b", "react"]);
assert.throws(() => parseLock({ dependencies: { x: {} } }), /lockfileVersion 1/);
assert.throws(() => parseLock({}), /no packages found/);

const census = aggregate([
  { name: "react", maintainers: [{ name: "gaearon" }, { name: "sophiebits" }] },
  { name: "a", maintainers: [{ name: "sindresorhus" }] },
  { name: "b", maintainers: [{ name: "sindresorhus" }] },
  { name: "c", deprecated: "use d instead", maintainers: [{ name: "tj" }] },
]);

assert.equal(census.packages, 4);
assert.equal(census.strangers, 4);
assert.equal(census.top[0].name, "sindresorhus");
assert.equal(census.top[0].packages.length, 2);
assert.equal(census.soloMaintained, 3);
assert.equal(census.deprecated[0].name, "c");

console.log("all checks pass");
