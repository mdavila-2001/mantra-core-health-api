// Validaciones documentales automatizadas (Plan Maestro §14/§18):
//   1. Cero marcadores TODO/FIXME/TBD en docs/ (contenido final, no borrador).
//   2. Cero páginas vacías o casi vacías.
//   3. Los 60 módulos reales (src/modules/*) tienen su página espejo en docs/modules/.
//   4. Cada uno de los 60 tiene entrada en el catálogo (docs/modules/index.md).
//   5. openapi/openapi.yaml existe y no está vacío (contrato generado, no ausente).
//   6. asyncapi/asyncapi.yaml existe.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, 'docs');
let problems = 0;

function walkMd(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// 1. TODO/FIXME/TBD markers — literal placeholder markers, not the word
// "pendiente" used honestly to describe real, verified gaps in the system.
// Requires the colon-suffixed form (TODO:/FIXME:) or standalone TBD, because
// this is a Spanish-language corpus where bare "TODO" is also the Spanish
// word for "all/everything" (e.g. "sólo si TODO verificado") — a bare-word
// match would be pure noise, not a real placeholder signal.
const MARKER_RE = /\b(TODO:|FIXME:|TBD)\b/;
const files = walkMd(DOCS_DIR);
for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    // A line naming two-plus marker conventions together (e.g. documenting
    // the policy itself: "TODO/FIXME/TBD") is meta-discussion of the rule,
    // not a leftover placeholder — skip it rather than flag a false positive.
    const metaCount = ['TODO', 'FIXME', 'TBD'].filter((w) => line.includes(w)).length;
    if (metaCount >= 2) return;
    if (MARKER_RE.test(line)) {
      console.error(
        `MARKER: ${file.replace(ROOT + '/', '')}:${i + 1} — ${line.trim().slice(0, 100)}`,
      );
      problems++;
    }
  });
}

// 2. Empty or near-empty pages (a real page has more than a bare title).
for (const file of files) {
  const text = readFileSync(file, 'utf-8').trim();
  const meaningful = text.replace(/^#.*$/m, '').trim();
  if (meaningful.length < 40) {
    console.error(`EMPTY/NEAR-EMPTY PAGE: ${file.replace(ROOT + '/', '')}`);
    problems++;
  }
}

// 3-4. Every real module has its mirrored doc page + catalog entry.
const MODULES_DIR = join(ROOT, 'src', 'modules');
const realModules = readdirSync(MODULES_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
const moduleIndexText = existsSync(join(DOCS_DIR, 'modules', 'index.md'))
  ? readFileSync(join(DOCS_DIR, 'modules', 'index.md'), 'utf-8')
  : '';
for (const mod of realModules) {
  const docPath = join(DOCS_DIR, 'modules', `${mod}.md`);
  if (!existsSync(docPath)) {
    console.error(`MISSING MODULE DOC: docs/modules/${mod}.md (real module src/modules/${mod})`);
    problems++;
  }
  if (!moduleIndexText.includes(`(${mod}.md)`)) {
    console.error(`MODULE NOT IN CATALOG: ${mod} missing from docs/modules/index.md`);
    problems++;
  }
}

// 5-6. Contract files exist and are non-trivial.
for (const [label, relPath, minBytes] of [
  ['OpenAPI', 'openapi/openapi.yaml', 10_000],
  ['AsyncAPI', 'asyncapi/asyncapi.yaml', 500],
]) {
  const p = join(ROOT, relPath);
  if (!existsSync(p)) {
    console.error(`MISSING CONTRACT: ${relPath}`);
    problems++;
  } else if (statSync(p).size < minBytes) {
    console.error(`SUSPICIOUSLY SMALL CONTRACT: ${relPath} (${statSync(p).size} bytes)`);
    problems++;
  }
}

console.log(`\nVerificados: ${files.length} páginas de docs/, ${realModules.length} módulos reales.`);
if (problems > 0) {
  console.error(`${problems} problemas de cobertura documental.`);
  process.exit(1);
}
console.log('Cobertura documental OK: sin marcadores pendientes, sin páginas vacías, sin módulos sin documentar, contratos presentes.');
