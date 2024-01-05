#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLock, aggregate, type RegistryDoc } from "./census.js";

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

const c = aggregate(docs);
const pct = (n: number) => `${((n / c.packages) * 100).toFixed(1)}%`;

const out: string[] = [];
out.push("");
out.push(`${c.packages} packages · ${c.strangers} strangers`);
out.push(`  ${label}`);
out.push("");
out.push("top strangers in your supply chain");
for (const [i, s] of c.top.slice(0, 15).entries()) {
  out.push(
    `${String(i + 1).padStart(3)}. ${s.name.padEnd(24)} ${String(s.packages.length).padStart(4)} pkgs  (${pct(s.packages.length)})`,
  );
}
out.push("");
if (c.soloMaintained > 0) {
  out.push(`  ${c.soloMaintained} packages (${pct(c.soloMaintained)}) are maintained by a single person`);
}
if (c.deprecated.length > 0) {
  out.push(`  ${c.deprecated.length} deprecated: ${c.deprecated.slice(0, 5).map((d) => d.name).join(", ")}`);