// Keeps package-lock.json portable. Local installs on corporate machines can
// resolve packages through a private registry proxy; those URLs break
// `npm ci` anywhere else (CI, other contributors). Tarball paths and
// integrity hashes are identical, so rewriting the host is safe.
// Runs on postinstall; a no-op when the lockfile is already clean.

import { readFileSync, writeFileSync } from 'node:fs';

const LOCKFILE = new URL('../package-lock.json', import.meta.url);
const PRIVATE_REGISTRY = 'https://sfw.security.shadowbox.cloud/npm/';
const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';

let text;
try {
  text = readFileSync(LOCKFILE, 'utf8');
} catch {
  process.exit(0);
}

if (text.includes(PRIVATE_REGISTRY)) {
  const fixed = text.replaceAll(PRIVATE_REGISTRY, PUBLIC_REGISTRY);
  writeFileSync(LOCKFILE, fixed);
  const count = text.split(PRIVATE_REGISTRY).length - 1;
  console.log(`fix-lockfile-registry: rewrote ${count} private-registry URLs to registry.npmjs.org`);
}
