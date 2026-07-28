#!/usr/bin/env node
// =============================================================================
// REDESA — informe de cobertura y huérfanos (estático).
// =============================================================================
// Implementa el primer entregable que pide el informe REDESA (§6/§12):
//   - Inventario de entidades (tablas) y su consumo por repos/servicios.
//   - `ORPHAN_TABLE`: entidad sin ningún consumidor fuera de `entities/`.
//   - Inventario de endpoints y `ORPHAN_ENDPOINT` heurístico (mutante sin @Roles
//     ni @Public → sin actor/autorización declarada).
//   - `DIRECT_CROSS_DOMAIN_ACCESS`: repositorio que importa entidades de OTRO módulo.
// No arranca la app ni toca la BD. Uso: `node tools/redesa/coverage-report.mjs`.
// =============================================================================
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MODULES = join(ROOT, 'src', 'modules');
const rel = (p) => p.replace(ROOT + '/', '');

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

const allFiles = walk(MODULES);
const moduleOf = (p) => p.match(/modules\/([^/]+)\//)?.[1] ?? '';

// --- 1. Entidades (tablas) y su clase exportada -----------------------------
const entityFiles = allFiles.filter((f) => /\/entities\//.test(f));
const entities = []; // { cls, module, file }
for (const f of entityFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/export class (\w+)/g)) {
    entities.push({ cls: m[1], module: moduleOf(f), file: f });
  }
}

// Índice de usos de cada clase de entidad en archivos NO-entity.
const nonEntityText = allFiles
  .filter((f) => !/\/entities\//.test(f))
  .map((f) => ({ f, text: readFileSync(f, 'utf8') }));

const orphanTables = [];
for (const e of entities) {
  const used = nonEntityText.some(({ text }) =>
    new RegExp(`\\b${e.cls}\\b`).test(text),
  );
  if (!used) orphanTables.push(e);
}

// --- 2. Endpoints y ORPHAN_ENDPOINT (mutante sin @Roles ni @Public) ----------
const controllers = allFiles.filter((f) => f.endsWith('.controller.ts'));
let endpointCount = 0;
const orphanEndpoints = [];
for (const f of controllers) {
  const text = readFileSync(f, 'utf8');
  const lines = text.split(/\r?\n/);
  const classHasRoles = /@Roles\(/.test(text);
  let deco = [];
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith('@')) deco.push(l);
    const m = l.match(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);
    if (!m) return;
    endpointCount++;
    const verb = m[1];
    const near = lines.slice(i, i + 6).join(' ');
    const pub = deco.some((d) => /@Public\(/.test(d)) || /@Public\(/.test(near);
    const roles =
      classHasRoles || deco.some((d) => /@Roles\(/.test(d)) || /@Roles\(/.test(near);
    if (['Post', 'Put', 'Patch', 'Delete'].includes(verb) && !roles && !pub) {
      orphanEndpoints.push({ file: rel(f), line: i + 1, verb, path: m[2] });
    }
    deco = [];
  });
}

// --- 3. DIRECT_CROSS_DOMAIN_ACCESS: repo que importa entidades de otro módulo -
const crossDomain = [];
for (const f of allFiles.filter((f) => /\/repositories\//.test(f))) {
  const mod = moduleOf(f);
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/from '(\.\.\/)+modules\/([^/]+)\/entities/g)) {
    if (m[2] !== mod) crossDomain.push({ file: rel(f), from: mod, imports: m[2] });
  }
  // import relativo a ../../<otro_modulo>/entities
  for (const m of text.matchAll(/from '\.\.\/\.\.\/([a-z_]+)\/entities/g)) {
    if (m[1] !== mod && m[1] !== 'common')
      crossDomain.push({ file: rel(f), from: mod, imports: m[1] });
  }
}

// --- Reporte -----------------------------------------------------------------
const lines = [];
const p = (s = '') => lines.push(s);
p('# Informe de cobertura REDESA (estático)');
p('');
p(`- Entidades (tablas mapeadas): **${entities.length}**`);
p(`- Endpoints declarados: **${endpointCount}** en ${controllers.length} controllers`);
p(`- Módulos: **${new Set(entities.map((e) => e.module)).size}**`);
p('');
p(`## ORPHAN_TABLE — entidades sin consumidor fuera de \`entities/\` (${orphanTables.length})`);
p('> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.');
for (const e of orphanTables.slice(0, 60)) p(`- \`${e.module}\` · ${e.cls} (${rel(e.file)})`);
if (orphanTables.length > 60) p(`- … +${orphanTables.length - 60} más`);
p('');
p(`## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (${orphanEndpoints.length})`);
for (const e of orphanEndpoints.slice(0, 60)) p(`- ${e.file}:${e.line} — @${e.verb} ${e.path}`);
if (orphanEndpoints.length > 60) p(`- … +${orphanEndpoints.length - 60} más`);
p('');
p(`## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (${crossDomain.length})`);
for (const c of crossDomain.slice(0, 60)) p(`- ${c.file} → \`${c.imports}\``);
if (crossDomain.length > 60) p(`- … +${crossDomain.length - 60} más`);

const report = lines.join('\n') + '\n';
writeFileSync(join(ROOT, 'REDESA-COBERTURA.md'), report);
console.log(report);
console.log(
  `\nResumen: entidades=${entities.length} orphan_table=${orphanTables.length} orphan_endpoint=${orphanEndpoints.length} cross_domain=${crossDomain.length}`,
);
