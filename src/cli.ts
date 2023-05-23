#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLock, census, type RegistryDoc } from "./census.js";

const LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json"];

function die(msg: string): never {
  process.stderr.write(`dep-census: ${msg}\n`);
  process.exit(1);
}

// Either a lockfile path or a directory that holds one.
function loadLockfile(input: string): { lock: unknown; label: string } {
  if (existsSync(input) && input.endsWith(".json")) {
    return { lock: JSON.parse(readFileSync(input, "utf8")), label: input };
  }
  const dir = resolve(input);
  for (const name of LOCKFILES) {
    const p = join(dir, name);
    if (existsSync(p)) return { lock: JSON.parse(readFileSync(p, "utf8")), label: p };
  }
  die(`no package-lock.json found at ${input}`);
}

const { lock, label } = loadLockfile(process.argv[2] ?? ".");
const names = parseLock(lock);
if (names.length === 0) die(`no dependencies in ${label}`);

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
process.stdout.write(`  ${label}\n`);
if (c.deprecated.length > 0) {
  process.stdout.write(`${c.deprecated.length} deprecated: ${c.deprecated.join(", ")}\n`);
}