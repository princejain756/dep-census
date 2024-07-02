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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The registry answers 429 with a retry-after header when it has had enough of us.
async function fetchJson(url: string, retries = 3): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { "user-agent": "dep-census" } });
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < retries) {
      const wait = Number(res.headers.get("retry-after")) || 1 + attempt;
      await sleep(wait * 1000);
      continue;
    }
    throw Object.assign(new Error(`${res.status} ${url}`), { status: res.status });
  }
  throw new Error(`unreachable`);
}

interface FetchResult {
  docs: RegistryDoc[];
  failed: string[];
}

// A few hundred packages one request at a time takes minutes; eight in flight
// takes a coffee sip. The registry tolerates this fine.
async function fetchDocs(names: string[]): Promise<FetchResult> {
  const docs: RegistryDoc[] = [];
  const failed: string[] = [];
  let i = 0;
  const CONCURRENCY = 8;
  const worker = async () => {
    while (i < names.length) {
      const name = names[i++];
      try {
        docs.push(
          (await fetchJson(
            `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
          )) as RegistryDoc,
        );
      } catch {
        failed.push(name);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, names.length) }, worker));
  return { docs, failed };
}

const { lock, label } = loadLockfile(process.argv[2] ?? ".");
const names = parseLock(lock);
if (names.length === 0) die(`no dependencies in ${label}`);

process.stderr.write(`fetching ${names.length} package docs...\n`);
const { docs, failed } = await fetchDocs(names);
if (failed.length > 0) {
  process.stderr.write(`dep-census: registry unreachable for ${failed.length} packages (rate-limited, skipped)\n`);
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
}
if (c.top.length > 0) {
  out.push("");
  out.push(
    `the #1 stranger (${c.top[0].name}) can ship code into ${pct(c.top[0].packages.length)} of your install.`,
  );
}
out.push("");
process.stdout.write(out.join("\n"));
