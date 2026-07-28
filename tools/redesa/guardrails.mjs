#!/usr/bin/env node
// =============================================================================
// Guardrails REDESA — checks estáticos de los criterios de rechazo técnico.
// =============================================================================
// Convierte en un check de CI (rompe el build) los antipatrones que las reglas
// canónicas prohíben. Es estático (no arranca la app ni toca la BD): analiza los
// controladores y el catálogo ORM. Uso: `node tools/redesa/guardrails.mjs`.
//
// Criterios implementados:
//   - HARD_DELETE_RESTRICTED_DATA      @Delete sobre dominios inmutables
//   - GENERIC_CRUD_ON_IMMUTABLE        @Patch/@Put sobre recursos inmutables
//   - UNSCOPED_MUTATION                endpoint mutante sin @Roles y sin @Public
//   - CASCADE_ON_RESTRICTED            ON DELETE CASCADE hacia dominios protegidos
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Dominios cuyos datos son inmutables/protegidos (clínico, legal, financiero, auditoría). */
const RESTRICTED_DOMAINS = [
  'clinical',
  'clinical_ext',
  'chart',
  'audit',
  'accounting',
];

/** Recursos inmutables: no admiten edición/borrado directo (solo comandos de negocio). */
const IMMUTABLE_RESOURCE = /(medication|prescription|clinical-?note|chart-note|journal|ledger|audit)/i;

/** Verbos de negocio permitidos sobre recursos inmutables (no son CRUD genérico). */
const ALLOWED_COMMANDS =
  /(amend|addend|invalidate|replace|renew|reverse|sign|cosign|finalize|release|issue|deprecate|version|dsar)/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

const rel = (p) => p.replace(ROOT + '/', '');
const violations = [];
const add = (code, file, line, msg) =>
  violations.push({ code, file: rel(file), line, msg });

// --- Controladores -----------------------------------------------------------
const controllers = walk(join(SRC, 'modules')).filter((f) =>
  f.endsWith('.controller.ts'),
);

for (const file of controllers) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const domain = file.match(/modules\/([^/]+)\//)?.[1] ?? '';
  const classHasRoles = /@Roles\(/.test(text);
  const isImmutableCtrl = IMMUTABLE_RESOURCE.test(file);

  // Bloque por método: acumula decoradores hasta el nombre del handler.
  let pendingDecorators = [];
  lines.forEach((raw, i) => {
    const l = raw.trim();
    const mhttp = l.match(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);
    if (l.startsWith('@')) pendingDecorators.push({ text: l, line: i + 1 });
    if (!mhttp) return;

    const verb = mhttp[1];
    const path = mhttp[2] || '';
    const near = lines.slice(i, i + 6).join(' ');
    const hasPublic = pendingDecorators.some((d) => /@Public\(/.test(d.text)) || /@Public\(/.test(near);
    const hasRolesHere =
      classHasRoles || pendingDecorators.some((d) => /@Roles\(/.test(d.text)) || /@Roles\(/.test(near);

    // HARD_DELETE sobre dominio protegido.
    if (verb === 'Delete' && RESTRICTED_DOMAINS.includes(domain)) {
      add('HARD_DELETE_RESTRICTED_DATA', file, i + 1,
        `@Delete en dominio protegido '${domain}': ${path}`);
    }
    // CRUD genérico sobre recurso inmutable (Patch/Put/Delete sin verbo de negocio).
    if (
      isImmutableCtrl &&
      ['Put', 'Patch', 'Delete'].includes(verb) &&
      !ALLOWED_COMMANDS.test(path)
    ) {
      add('GENERIC_CRUD_ON_IMMUTABLE', file, i + 1,
        `@${verb} sobre recurso inmutable sin comando de negocio: ${path}`);
    }
    // Endpoint mutante sin autorización por rol y sin ser público.
    if (['Post', 'Put', 'Patch', 'Delete'].includes(verb) && !hasRolesHere && !hasPublic) {
      add('UNSCOPED_MUTATION', file, i + 1,
        `@${verb} mutante sin @Roles ni @Public: ${path}`);
    }
    pendingDecorators = [];
  });
}

// --- Catálogo ORM: ON DELETE CASCADE hacia dominios protegidos ---------------
const fkDir = join(SRC, 'orm', 'catalog', 'foreign-keys');
try {
  for (const file of walk(fkDir)) {
    const text = readFileSync(file, 'utf8');
    if (/CASCADE/.test(text) && RESTRICTED_DOMAINS.some((d) => text.includes(`${d}.`))) {
      text.split(/\r?\n/).forEach((l, i) => {
        if (/CASCADE/i.test(l) && RESTRICTED_DOMAINS.some((d) => l.includes(`${d}.`)))
          add('CASCADE_ON_RESTRICTED', file, i + 1, l.trim().slice(0, 100));
      });
    }
  }
} catch {
  // Sin catálogo de FKs: se omite este check.
}

// --- Reporte -----------------------------------------------------------------
const byCode = {};
for (const v of violations) (byCode[v.code] ??= []).push(v);

console.log('== Guardrails REDESA ==');
for (const code of Object.keys(byCode)) {
  console.log(`\n[${code}] ${byCode[code].length} hallazgo(s):`);
  for (const v of byCode[code].slice(0, 40))
    console.log(`  ${v.file}:${v.line} — ${v.msg}`);
  if (byCode[code].length > 40) console.log(`  … +${byCode[code].length - 40} más`);
}
if (violations.length === 0) console.log('Sin violaciones. ✓');

// UNSCOPED_MUTATION es informativo (puede haber excepciones legítimas); los demás
// rompen el build.
const blocking = violations.filter((v) => v.code !== 'UNSCOPED_MUTATION');
console.log(
  `\nTotal: ${violations.length} (bloqueantes: ${blocking.length}, informativos: ${violations.length - blocking.length})`,
);
process.exit(blocking.length > 0 ? 1 : 0);
