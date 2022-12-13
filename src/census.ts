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

// A package-lock.json lists everything installed under "packages", keyed by its
// path inside node_modules. For a first pass the names are all we need.
export function parseLock(lock: unknown): string[] {
  const packages = (lock as { packages?: Record<string, unknown> }).packages;
  if (!packages || typeof packages !== "object") {
    throw new Error("no packages found — is this a package-lock.json?");
  }
  const names: string[] = [];
  for (const key of Object.keys(packages)) {
    if (!key.startsWith("node_modules/")) continue; // the "" root entry
    names.push(key.slice("node_modules/".length));
  }
  return names;
}

// Every maintainer on every doc is one row saying "this account can publish this".
export function census(docs: RegistryDoc[]): Census {
  const accounts: string[] = [];
  const deprecated: string[] = [];
  for (const doc of docs) {
    if (doc.deprecated) deprecated.push(doc.name);
    for (const m of doc.maintainers ?? []) accounts.push(m.name);
  }
  return { packages: docs.length, accounts, deprecated };
}
