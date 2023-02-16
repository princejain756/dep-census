export interface RegistryDoc {
  name: string;
  deprecated?: string;
  maintainers?: { name: string; email?: string }[];
}

export interface Census {
  packages: number;
  accounts: string[];
  deprecated: string[];
}

// Pull every unique package name out of a package-lock.json or npm-shrinkwrap.json.
// v2/v3 lockfiles store the tree under "packages" as node_modules/<name> keys,
// possibly nested (node_modules/a/node_modules/b). We only need names.
export function parseLock(lock: unknown): string[] {
  const packages = (lock as { packages?: Record<string, unknown> }).packages;
  if (!packages || typeof packages !== "object") {
    const deps = (lock as { dependencies?: unknown }).dependencies;
    if (deps) {
      throw new Error(
        "lockfileVersion 1 lockfiles (npm 6) are not supported — regenerate with `npm install` on npm 7+",
      );
    }
    throw new Error("no packages found — is this a package-lock.json?");
  }
  const names = new Set<string>();
  for (const key of Object.keys(packages)) {
    const idx = key.lastIndexOf("node_modules/");
    if (idx === -1) continue; // "" root entry and non-package keys
    const name = key.slice(idx + "node_modules/".length);
    if (name && !name.startsWith(".")) names.add(name);
  }
  return [...names].sort();
}

// Every maintainer on every doc is one row saying "this account can publish this".
// The same account shows up on hundreds of packages, so dedupe on read and let
// the CLI decide how wide it is.
export function census(docs: RegistryDoc[]): Census {
  const accounts: string[] = [];
  const deprecated: string[] = [];
  for (const doc of docs) {
    if (doc.deprecated) deprecated.push(doc.name);
    for (const m of doc.maintainers ?? []) accounts.push(m.name);
  }
  return { packages: docs.length, accounts, deprecated };
}
