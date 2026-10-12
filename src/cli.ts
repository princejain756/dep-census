#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLock, aggregate, type RegistryDoc } from "./census.js";

const USAGE = `dep-census — count the strangers inside node_modules

usage:
  npx dep-census                census the current directory's package-lock.json
  npx dep-census ./dir          directory containing package-lock.json
  npx dep-census ./lock.json    a package-lock.json or npm-shrinkwrap.json file
  npx dep-census owner/repo     census a GitHub repo's lockfile

flags:
  --top <n>     show n strangers (default 15)
  --json        machine-readable output
  --help        this
`;

const args = process.argv.slice(2);
let target = ".";
let topN = 15;
let asJson = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--help" || a === "-h") {
    process.stdout.write(USAGE);
    process.exit(0);
  } else if (a === "--json") {
    asJson = true;
  } else if (a === "--top") {
    topN = Number(args[++i]) || 15;
  } else if (!a.startsWith("-")) {
    target = a;
  }
}

function die(msg: string): never {
  process.stderr.write(`dep-census: ${msg}\n`);
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

async function loadLockfile(input: string): Promise<{ lock: unknown; label: string }> {
  // local file
  if (existsSync(input) && input.endsWith(".json")) {
    return { lock: JSON.parse(readFileSync(input, "utf8")), label: input };
  }
  // local directory
  const dir = resolve(input);
  for (const name of ["package-lock.json", "npm-shrinkwrap.json"]) {
    const p = join(dir, name);
    if (existsSync(p)) return { lock: JSON.parse(readFileSync(p, "utf8")), label: p };
  }
  // owner/repo on GitHub — try the two common default branches, no API call needed
  if (/^[\w.-]+\/[\w.-]+$/.test(input)) {
    for (const branch of ["main", "master"]) {
      for (const name of ["package-lock.json", "npm-shrinkwrap.json"]) {
        try {
          const doc = await fetchJson(
            `https://raw.githubusercontent.com/${input}/${branch}/${name}`,
          );
          return { lock: doc, label: `${input} (${branch})` };
        } catch {
          /* try next */
        }
      }
    }
    die(`no package-lock.json in ${input}@main|master — yarn/pnpm lockfiles aren't supported yet`);
  }
  die(`no package-lock.json found at ${input}`);
}

interface FetchResult {
  docs: RegistryDoc[];
  notOnNpm: string[];
  failed: string[];
}

async function fetchDocs(names: string[]): Promise<FetchResult> {
  const docs: RegistryDoc[] = [];
  const notOnNpm: string[] = [];
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
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 404) notOnNpm.push(name);
        else failed.push(name);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, names.length) }, worker));
  return { docs, notOnNpm, failed };
}

const { lock, label } = await loadLockfile(target);
const names = parseLock(lock);
if (names.length === 0) die(`no dependencies in ${label}`);

if (!asJson) process.stderr.write(`fetching ${names.length} package docs...\n`);
const { docs, notOnNpm, failed } = await fetchDocs(names);
if (failed.length > 0) {
  process.stderr.write(`dep-census: registry unreachable for ${failed.length} packages (rate-limited, skipped)\n`);
}
const c = aggregate(docs);

if (asJson) {
  process.stdout.write(JSON.stringify({ target: label, ...c }, null, 2) + "\n");
  process.exit(0);
}

const pct = (n: number) => `${((n / c.packages) * 100).toFixed(1)}%`;
const out: string[] = [];
out.push("");
out.push(`${c.packages.toLocaleString()} packages · ${c.strangers.toLocaleString()} strangers` +
  (c.deprecated.length ? ` · ${c.deprecated.length} deprecated` : ""));
out.push(`  ${label}`);
out.push("");
out.push("top strangers in your supply chain");
for (const [i, s] of c.top.slice(0, topN).entries()) {
  out.push(
    `${String(i + 1).padStart(3)}. ${s.name.padEnd(24)} ${String(s.packages.length).padStart(4)} pkgs  (${pct(s.packages.length)})`,
  );
}
out.push("");
const facts: string[] = [];
if (c.soloMaintained > 0)
  facts.push(`${c.soloMaintained} packages (${pct(c.soloMaintained)}) are maintained by a single person`);
if (c.deprecated.length > 0)
  facts.push(`${c.deprecated.length} deprecated: ${c.deprecated.slice(0, 5).map((d) => d.name).join(", ")}${c.deprecated.length > 5 ? `, +${c.deprecated.length - 5} more` : ""}`);
if (c.noMaintainerListed.length > 0)
  facts.push(`${c.noMaintainerListed.length} packages list no maintainer at all`);
if (notOnNpm.length > 0)
  facts.push(`${notOnNpm.length} packages aren't on public npm (private registry or git deps)`);
for (const f of facts) out.push(`  ${f}`);
if (c.top.length > 0) {
  out.push("");
  out.push(
    `the #1 stranger (${c.top[0].name}) can ship code into ${pct(c.top[0].packages.length)} of your install.`,
  );
}
out.push("");
process.stdout.write(out.join("\n"));
