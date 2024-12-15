export interface RegistryDoc {
  name: string;
  version?: string;
  deprecated?: string;
  maintainers?: { name: string; email?: string }[];
  author?: string | { name?: string; email?: string };
  repository?: unknown;
  license?: unknown;
}

export interface Stranger {
  name: string;
  packages: string[];
}

export interface Census {
  packages: number;
  strangers: number;
  deprecated: { name: string; message: string }[];
  soloMaintained: number;
  noMaintainerListed: string[];
  top: Stranger[];
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

function maintainerNames(doc: RegistryDoc): string[] {
  const list = doc.maintainers?.map((m) => m.name).filter(Boolean) ?? [];
  if (list.length > 0) return list;
  // very old packages sometimes publish with no maintainers field; author is a weak proxy
  const a = doc.author;
  if (typeof a === "string" && a.trim()) return [a.trim().split(/[<({]/)[0].trim()];
  if (a && typeof a === "object" && typeof a.name === "string" && a.name.trim()) {
    return [a.name.trim()];
  }
  return [];
}

export function aggregate(docs: RegistryDoc[]): Census {
  const byMaintainer = new Map<string, string[]>();
  const deprecated: Census["deprecated"] = [];
  const noMaintainerListed: string[] = [];
  let soloMaintained = 0;

  for (const doc of docs) {
    if (doc.deprecated) deprecated.push({ name: doc.name, message: doc.deprecated });
    const names = maintainerNames(doc);
    if (names.length === 0) {
      noMaintainerListed.push(doc.name);
      continue;
    }
    if (names.length === 1) soloMaintained++;
    for (const n of names) {
      const arr = byMaintainer.get(n);
      if (arr) arr.push(doc.name);
      else byMaintainer.set(n, [doc.name]);
    }
  }

  const top = [...byMaintainer.entries()]
    .map(([name, packages]) => ({ name, packages }))
    .sort((a, b) => b.packages.length - a.packages.length || a.name.localeCompare(b.name));

  return {
    packages: docs.length,
    strangers: byMaintainer.size,
    deprecated,
    soloMaintained,
    noMaintainerListed,
    top,
  };
}
