#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseLock, census, type RegistryDoc } from "./census.js";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const names = parseLock(lock);

process.stderr.write(`fetching ${names.length} package docs...\n`);

// One request at a time. The registry is not in a hurry and neither are we.
const docs: RegistryDoc[] = [];
for (const name of names) {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
    headers: { "user-agent": "dep-census" },
  });
  if (!res.ok) continue;
  docs.push((await res.json()) as RegistryDoc);
}

const c = census(docs);
const people = new Set(c.accounts);

process.stdout.write(`${c.packages} packages · ${people.size} people can publish into them\n`);
if (c.deprecated.length > 0) {
  process.stdout.write(`${c.deprecated.length} deprecated: ${c.deprecated.join(", ")}\n`);
}
