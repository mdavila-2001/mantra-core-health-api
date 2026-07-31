// Verifica que todo enlace relativo interno dentro de docs/ resuelve a un
// archivo real. Complementa `mkdocs build --strict` (que hace la misma
// verificación al construir el sitio) con un chequeo standalone en Node, sin
// depender de Python/mkdocs — útil para un paso de CI rápido antes del build
// completo del portal (Fase 16).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const DOCS_DIR = join(process.cwd(), 'docs');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const LINK_RE = /\]\(([^)]+)\)/g;

function isExternal(link) {
  return /^([a-z]+:)?\/\//i.test(link) || link.startsWith('mailto:');
}

let errors = 0;
let checked = 0;
const files = walk(DOCS_DIR);

for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  let m;
  while ((m = LINK_RE.exec(text))) {
    let link = m[1].trim();
    if (!link || isExternal(link)) continue;
    // Strip in-page anchor and query string for the file-existence check.
    const hashIndex = link.indexOf('#');
    const targetPart = hashIndex >= 0 ? link.slice(0, hashIndex) : link;
    if (!targetPart) continue; // pure in-page anchor, e.g. [x](#section)
    checked++;
    const resolved = resolve(dirname(file), decodeURIComponent(targetPart));
    if (!existsSync(resolved)) {
      console.error(`BROKEN LINK: ${file.replace(process.cwd() + '/', '')} -> ${link}`);
      errors++;
      continue;
    }
    // Linking to a directory without an index page is very likely a mistake.
    if (statSync(resolved).isDirectory() && !existsSync(join(resolved, 'index.md'))) {
      console.error(
        `LINK TO DIRECTORY WITHOUT index.md: ${file.replace(process.cwd() + '/', '')} -> ${link}`,
      );
      errors++;
    }
  }
}

// No orphan pages: every .md file under docs/ (except index.md itself) should
// be reachable from at least one other page's links, so nothing sits unlinked
// in the built site.
const linkedTargets = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  let m;
  while ((m = LINK_RE.exec(text))) {
    const link = m[1].trim().split('#')[0];
    if (!link || isExternal(link)) continue;
    const resolved = resolve(dirname(file), decodeURIComponent(link));
    if (extname(resolved) === '.md') linkedTargets.add(resolved);
  }
}
const orphans = files.filter(
  (f) => f !== join(DOCS_DIR, 'index.md') && !linkedTargets.has(f),
);
if (orphans.length > 0) {
  console.warn(`\nPáginas huérfanas (sin ningún enlace entrante desde otra página de docs/):`);
  for (const o of orphans) console.warn(`  - ${o.replace(process.cwd() + '/', '')}`);
}

console.log(`\n${checked} enlaces internos verificados en ${files.length} páginas.`);
if (errors > 0) {
  console.error(`${errors} enlaces rotos.`);
  process.exit(1);
}
console.log('Sin enlaces rotos.');
