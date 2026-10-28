// Validaciones documentales automatizadas (Plan Maestro §14/§18):
//   1. Cero marcadores TODO/FIXME/TBD en docs/ (contenido final, no borrador).
//   2. Cero páginas vacías o casi vacías.
//   3. Los 60 módulos reales (src/modules/*) tienen su página espejo en docs/modules/.
//   4. Cada uno de los 60 tiene entrada en el catálogo (docs/modules/index.md).
//   5. openapi/openapi.yaml existe y no está vacío (contrato generado, no ausente).
//   6. asyncapi/asyncapi.yaml existe.
//   7. El repo no declara pendientes (AGENTS.md §2.1, .agents/rules/40-reporte-obligatorio.md):
//      a. ni `docs/trabajo/` (ni `docs/progress/`, `docs/tareas/`), ni `PLAN.md`, `REPORTE.md`
//         o `PENDIENTES*.md` en ninguna parte del repo;
//      b. ningún markdown con un encabezado «Pendiente(s)», «Próximos pasos», «Por hacer»,
//         «Falta», «Qué sigue» o `TODO`/`FIXME`;
//      c. ningún comentario `TODO:` o `FIXME` en `src/**/*.ts`.
//      Quedan fuera lo vendorizado (`database/SQL/`), `.agents/` y `.claude/` (describen la regla)
//      y `.github/` (la plantilla del PR lleva su checklist de verificación).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

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
// "pendiente" used as a business state (an appointment PENDIENTE, a pending
// payment). Docs describe what exists; work still to do lives in GitHub
// issues, never in docs/ (docs/governance/documentation-policy.md).
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
    const metaCount = ['TODO', 'FIXME', 'TBD'].filter((w) =>
      line.includes(w),
    ).length;
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
    console.error(
      `MISSING MODULE DOC: docs/modules/${mod}.md (real module src/modules/${mod})`,
    );
    problems++;
  }
  if (!moduleIndexText.includes(`(${mod}.md)`)) {
    console.error(
      `MODULE NOT IN CATALOG: ${mod} missing from docs/modules/index.md`,
    );
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
    console.error(
      `SUSPICIOUSLY SMALL CONTRACT: ${relPath} (${statSync(p).size} bytes)`,
    );
    problems++;
  }
}

// 7. El repo describe lo que existe: no guarda planes, reportes ni pendientes.
// El plan y la evidencia van en la descripción del PR; lo que queda sin hacer, en un issue.
const DONDE_VA =
  'El plan y la evidencia van en la descripción del PR (Resumen y Verificación de ' +
  '.github/PULL_REQUEST_TEMPLATE.md); lo que queda sin hacer, a medias o bloqueado, en un issue ' +
  'de GitHub enlazado desde el PR (AGENTS.md §2.1).';

// Directorios que no se miran nunca (dependencias, salidas de build, el modelo vendorizado) y
// prefijos que solo describen la regla o son plantillas de GitHub.
const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.yarn',
  'dist',
  'build',
  'coverage',
  'site',
]);
const IGNORED_PREFIXES = ['database/SQL/', '.agents/', '.claude/', '.github/'];
const WORKLOG_DIRS = ['docs/trabajo/', 'docs/progress/', 'docs/tareas/'];
const WORKLOG_FILE_RE = /^(PLAN|REPORTE)\.md$|^PENDIENTES[^/]*\.md$/i;

function isIgnored(rel) {
  if (rel.split('/').some((seg) => IGNORED_SEGMENTS.has(seg))) return true;
  return IGNORED_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

// Archivos del repo: los versionados y los nuevos sin ignorar (para frenar un plan antes del commit).
// Fuera de un repo git (p. ej. una copia de prueba) se recorre el árbol.
function repoFiles() {
  try {
    const out = execFileSync(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 256 * 1024 * 1024,
      },
    );
    return [...new Set(out.split('\0').filter(Boolean))].filter((rel) =>
      existsSync(join(ROOT, rel)),
    );
  } catch {
    const out = [];
    const walk = (dir, rel) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (IGNORED_SEGMENTS.has(entry.name)) continue;
        const childRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) walk(join(dir, entry.name), childRel);
        else out.push(childRel);
      }
    };
    walk(ROOT, '');
    return out;
  }
}

// «Próximos pasos», «Por hacer», «Qué sigue» sin importar mayúsculas ni lo que siga. «Pendiente(s)»
// y «Falta» solo como título entero o seguidos de «:», «(», «—»: «Falta de stock» o «Pendiente de
// pago» describen un estado del negocio, no trabajo por hacer. TODO y FIXME solo en mayúsculas,
// porque «Todo lo redactado…» es castellano.
const PENDING_HEADING_ES = new RegExp(
  String.raw`^#{1,6}\s+[*_]*(?:\d+[.)]?\s+)?(?:` +
    String.raw`(?:pr[oó]ximos\s+pasos|por\s+hacer|qu[eé]\s+sigue)(?=$|[\s:.,;!?*_—–-])` +
    String.raw`|(?:pendientes?|falta)[*_]*\s*(?:$|[:(—–-]))`,
  'iu',
);
const PENDING_HEADING_TODO = /^#{1,6}\s+[*_]*(?:TODO|FIXME)\b/u;
// Comentario que empieza con TODO:/TODO(...): o FIXME. «// TODO el catálogo» (castellano) no cuenta.
const TODO_COMMENT_RE =
  /(?:\/\/+|\/\*+|^\s*\*)\s*(?:(?:TODO|XXX)\s*(?:\([^)]*\))?\s*:|FIXME\b)/;

const allFiles = repoFiles().map((rel) => rel.split(sep).join('/'));
let pendingProblems = 0;

for (const rel of allFiles) {
  if (WORKLOG_DIRS.some((dir) => rel.startsWith(dir))) {
    console.error(
      `WORK LOG: ${rel} — el repo no guarda bitácoras de trabajo. ${DONDE_VA}`,
    );
    pendingProblems++;
    continue;
  }
  if (isIgnored(rel)) continue;
  const base = rel.slice(rel.lastIndexOf('/') + 1);
  if (WORKLOG_FILE_RE.test(base)) {
    console.error(
      `WORK LOG: ${rel} — no se versionan planes ni reportes de sesión. ${DONDE_VA}`,
    );
    pendingProblems++;
    continue;
  }
  if (rel.endsWith('.md')) {
    const lines = readFileSync(join(ROOT, rel), 'utf-8').split('\n');
    let fence = null;
    lines.forEach((line, i) => {
      const f = /^\s*(`{3,}|~{3,})/.exec(line);
      if (f) {
        if (fence === null) fence = f[1][0];
        else if (f[1][0] === fence) fence = null;
        return;
      }
      if (fence !== null) return;
      if (PENDING_HEADING_ES.test(line) || PENDING_HEADING_TODO.test(line)) {
        console.error(
          `PENDING SECTION: ${rel}:${i + 1} — «${line.trim().slice(0, 80)}». Una página describe lo que ` +
            `existe; un límite real se dice en presente y, si hay trabajo previsto, cita el issue. ${DONDE_VA}`,
        );
        pendingProblems++;
      }
    });
  } else if (rel.startsWith('src/') && rel.endsWith('.ts')) {
    const lines = readFileSync(join(ROOT, rel), 'utf-8').split('\n');
    lines.forEach((line, i) => {
      if (TODO_COMMENT_RE.test(line)) {
        console.error(
          `TODO COMMENT: ${rel}:${i + 1} — «${line.trim().slice(0, 80)}». Una limitación intencional ` +
            `se describe en presente con su porqué; el trabajo que falta es un issue y el comentario ` +
            `puede citarlo («// ver #123»).`,
        );
        pendingProblems++;
      }
    });
  }
}
problems += pendingProblems;

console.log(
  `\nVerificados: ${files.length} páginas de docs/, ${realModules.length} módulos reales, ` +
    `${allFiles.length} archivos del repo revisados en busca de planes, reportes y pendientes.`,
);
if (problems > 0) {
  console.error(`${problems} problemas de cobertura documental.`);
  process.exit(1);
}
console.log(
  'Cobertura documental OK: sin marcadores pendientes, sin páginas vacías, sin módulos sin documentar, contratos presentes, sin planes, reportes ni secciones de pendientes.',
);
