#!/usr/bin/env node
// =============================================================================
// ALOVIDA — informe de cobertura y huérfanos (estático).
// =============================================================================
// Implementa el primer entregable que pide el informe ALOVIDA (§6/§12):
//   - Inventario de entidades (tablas) y su consumo por repos/servicios.
//   - `ORPHAN_TABLE`: entidad sin ningún consumidor fuera de `entities/`.
//   - Inventario de endpoints y `ORPHAN_ENDPOINT` heurístico (mutante sin @Roles
//     ni @Public → sin actor/autorización declarada).
//   - `DIRECT_CROSS_DOMAIN_ACCESS`: repositorio que importa entidades de OTRO módulo.
// No arranca la app ni toca la BD. Uso: `node tools/alovida/coverage-report.mjs`.
//
// MCH-033: el informe dice de qué commit sale y qué mide cada cifra. Las tres
// capas no se mezclan: «declarado» son decoradores en el código; «registrado»
// son las operaciones del contrato OpenAPI que genera la app arrancada
// (`openapi/openapi.json`, versionado); «verificado en runtime» no lo mide este
// script y se dice así. La fecha es la del commit, no la de la corrida, para
// que regenerar desde un clon del mismo SHA dé el mismo archivo byte a byte.
// =============================================================================
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

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

/**
 * Controladores autenticados por el `JwtAuthGuard` GLOBAL y autorizados a nivel de
 * recurso (no por `@Roles`); no son ORPHAN_ENDPOINT (falso positivo verificado en
 * el triage 2026-07). Ver comentario equivalente en `guardrails.mjs`.
 */
const AUTHN_NON_ROLE_ALLOWLIST =
  /modules\/(telemetry|community|common)\/controllers\/|modules\/identity_assurance\/controllers\/identity-self-service\.controller\.ts/;
const GLOBAL_JWT_GUARD = (() => {
  try {
    const m = readFileSync(
      join(ROOT, 'src', 'common', 'auth', 'auth.module.ts'),
      'utf8',
    );
    return /APP_GUARD/.test(m) && /JwtAuthGuard/.test(m);
  } catch {
    return false;
  }
})();

// --- 1. Entidades (tablas) y su clase exportada -----------------------------
const entityFiles = allFiles.filter((f) => /\/entities\//.test(f));
const entities = []; // { cls, module, file, tableKey }
for (const f of entityFiles) {
  const text = readFileSync(f, 'utf8');
  // Tabla física de la entidad: `@Entity({ schema, tableName })` (cualquier orden).
  const schema = text.match(/schema:\s*'([^']+)'/)?.[1];
  const table = text.match(/tableName:\s*'([^']+)'/)?.[1];
  const tableKey = schema && table ? `${schema}.${table}` : null;
  for (const m of text.matchAll(/export class (\w+)/g)) {
    entities.push({ cls: m[1], module: moduleOf(f), file: f, tableKey });
  }
}

// Índice de usos de cada clase de entidad en archivos NO-entity.
const nonEntityText = allFiles
  .filter((f) => !/\/entities\//.test(f))
  .map((f) => ({ f, text: readFileSync(f, 'utf8') }));

// Las entidades `audit.*_history` las consume el `HistoryMirrorSubscriber`
// (src/orm/subscribers): en cada flush versiona todo agregado con tabla de
// historial mediante metadata dinámica (SQL crudo), consumo que el análisis
// estático no ve. Es un flujo interno documentado (§2 «consumidor verificable»),
// no un huérfano. Se exime a las `*History` del módulo audit.
const historyMirrorPresent = existsSync(
  join(ROOT, 'src', 'orm', 'subscribers', 'history-mirror.subscriber.ts'),
);
const isMirroredHistory = (e) =>
  historyMirrorPresent && e.module === 'audit' && /History$/.test(e.cls);

// Consumo DIRECTO: la clase de la entidad se referencia en código no-entidad
// (repositorio/servicio/job/seed/etc.) o la cubre el mirror de historial.
const directlyConsumed = new Set();
for (const e of entities) {
  if (isMirroredHistory(e)) {
    if (e.tableKey) directlyConsumed.add(e.tableKey);
    continue;
  }
  const used = nonEntityText.some(({ text }) =>
    new RegExp(`\\b${e.cls}\\b`).test(text),
  );
  if (used && e.tableKey) directlyConsumed.add(e.tableKey);
}

// --- Cobertura INDIRECTA (§2) vía el grafo de FKs del catálogo estático -------
// Una tabla sin consumidor directo queda cubierta si participa en un flujo de un
// agregado que SÍ se consume. Se deriva del catálogo `src/orm/catalog/foreign-keys`
// (verdad del modelo), sin BD:
//   (A) hija de un agregado consumido: tiene FK a una tabla cubierta (transitivo);
//   (B) catálogo/lookup de una tabla consumida directamente: es destino de una FK
//       desde una tabla consumida (un salto).
// Se ignoran las FK a infraestructura transversal (concepto/usuario/tenant), que
// están en casi todas las tablas y no representan pertenencia a un agregado.
const GENERIC_FK_SCHEMAS = new Set(['terminology', 'iam', 'directory']);
const fkEdges = []; // { child: 'schema.table', parent: 'schema.table' }
const fkDir = join(ROOT, 'src', 'orm', 'catalog', 'foreign-keys');
try {
  for (const f of readdirSync(fkDir)) {
    if (!f.endsWith('.fk.ts')) continue;
    const srcSchema = f.split('.')[0];
    const text = readFileSync(join(fkDir, f), 'utf8');
    for (const m of text.matchAll(
      /\[\s*'([^']+)'\s*,\s*'[^']+'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,/g,
    )) {
      const child = `${srcSchema}.${m[1]}`;
      const parent = `${m[2]}.${m[3]}`;
      if (GENERIC_FK_SCHEMAS.has(m[2])) continue; // FK a infra transversal
      if (child === parent) continue; // auto-referencia (jerarquía)
      fkEdges.push({ child, parent });
    }
  }
} catch {
  // Sin catálogo de FKs: solo cuenta la cobertura directa.
}

const covered = new Set(directlyConsumed);
// (B) catálogos/lookups referenciados por tablas consumidas directamente.
for (const { child, parent } of fkEdges) {
  if (directlyConsumed.has(child)) covered.add(parent);
}
// (A) hijas de agregados cubiertos (transitivo hasta punto fijo).
let changed = true;
while (changed) {
  changed = false;
  for (const { child, parent } of fkEdges) {
    if (covered.has(parent) && !covered.has(child)) {
      covered.add(child);
      changed = true;
    }
  }
}

const orphanTables = [];
for (const e of entities) {
  if (isMirroredHistory(e)) continue;
  if (e.tableKey && covered.has(e.tableKey)) continue;
  // Sin tableKey (no se pudo parsear el @Entity) cae al chequeo directo textual.
  if (!e.tableKey) {
    const used = nonEntityText.some(({ text }) =>
      new RegExp(`\\b${e.cls}\\b`).test(text),
    );
    if (used) continue;
  }
  orphanTables.push(e);
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
      classHasRoles ||
      deco.some((d) => /@Roles\(/.test(d)) ||
      /@Roles\(/.test(near);
    if (
      ['Post', 'Put', 'Patch', 'Delete'].includes(verb) &&
      !roles &&
      !pub &&
      !(GLOBAL_JWT_GUARD && AUTHN_NON_ROLE_ALLOWLIST.test(f))
    ) {
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
    if (m[2] !== mod)
      crossDomain.push({ file: rel(f), from: mod, imports: m[2] });
  }
  // import relativo a ../../<otro_modulo>/entities
  for (const m of text.matchAll(/from '\.\.\/\.\.\/([a-z_]+)\/entities/g)) {
    if (m[1] !== mod && m[1] !== 'common')
      crossDomain.push({ file: rel(f), from: mod, imports: m[1] });
  }
}

// --- Procedencia y denominadores (MCH-033) -----------------------------------
const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
const commitDate = git('log', '-1', '--format=%cI', 'HEAD');
// Sólo lo que este inventario lee: si `src/` u `openapi/` tienen cambios sin
// commitear, las cifras no corresponden al SHA y el informe lo dice.
const dirty = git('status', '--porcelain', '--', 'src', 'openapi') !== '';

const moduleDirs = readdirSync(MODULES).filter((name) =>
  statSync(join(MODULES, name)).isDirectory(),
);
const modulesWithEntities = new Set(entities.map((e) => e.module)).size;

/** Operaciones del contrato generado desde la app arrancada, si existe. */
const registeredOperations = (() => {
  const file = join(ROOT, 'openapi', 'openapi.json');
  if (!existsSync(file)) return null;
  const HTTP = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  const { paths } = JSON.parse(readFileSync(file, 'utf8'));
  return Object.values(paths).reduce(
    (total, methods) =>
      total + Object.keys(methods).filter((m) => HTTP.includes(m)).length,
    0,
  );
})();

// --- Reporte -----------------------------------------------------------------
const lines = [];
const p = (s = '') => lines.push(s);
p('# Informe de cobertura ALOVIDA (estático)');
p('');
p(`- Commit: \`${sha}\` (${commitDate})`);
if (dirty)
  p(
    '- ⚠️ Generado con cambios sin commitear en `src/` u `openapi/`: las cifras no corresponden a ese commit.',
  );
p(
  '- Regenerar: `node tools/alovida/coverage-report.mjs` (o `yarn alovida:coverage`)',
);
p(
  '- Método: lectura estática del código. No arranca la app, no toca la base y **no ejecuta ninguna ruta**.',
);
p('');
p('## Inventario');
p('');
p('| Qué | Cuánto | Qué significa |');
p('|---|---:|---|');
p(
  `| Directorios de módulo en \`src/modules\` | ${moduleDirs.length} | Todos, tengan o no entidades. |`,
);
p(
  `| Módulos con entidades | ${modulesWithEntities} | Directorios con al menos una clase en \`entities/\`. |`,
);
p(
  `| Clases de entidad | ${entities.length} | Clases exportadas en \`entities/\` de \`src/modules\`. No es un conteo de tablas de la base. |`,
);
p(
  `| Endpoints **declarados** | ${endpointCount} | Decoradores \`@Get/@Post/@Put/@Patch/@Delete\` en ${controllers.length} controllers de \`src/modules\`. |`,
);
p(
  `| Operaciones **registradas** | ${registeredOperations ?? 'sin contrato'} | Operaciones de \`openapi/openapi.json\`, que se genera arrancando la app (\`generate-openapi.mjs\`). Vale para el commit en que se regeneró ese archivo. |`,
);
p(
  '| Rutas **verificadas en runtime** | no medido | Este script no ejecuta rutas. Ninguna cifra de esta tabla es evidencia de que un endpoint funcione. |',
);
p('');
p(
  `## ORPHAN_TABLE — entidades sin consumidor fuera de \`entities/\` (${orphanTables.length})`,
);
p(
  '> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.',
);
for (const e of orphanTables.slice(0, 60))
  p(`- \`${e.module}\` · ${e.cls} (${rel(e.file)})`);
if (orphanTables.length > 60) p(`- … +${orphanTables.length - 60} más`);
p('');
p(
  `## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (${orphanEndpoints.length})`,
);
for (const e of orphanEndpoints.slice(0, 60))
  p(`- ${e.file}:${e.line} — @${e.verb} ${e.path}`);
if (orphanEndpoints.length > 60) p(`- … +${orphanEndpoints.length - 60} más`);
p('');
p(
  `## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (${crossDomain.length})`,
);
for (const c of crossDomain.slice(0, 60)) p(`- ${c.file} → \`${c.imports}\``);
if (crossDomain.length > 60) p(`- … +${crossDomain.length - 60} más`);

const report = lines.join('\n') + '\n';
writeFileSync(join(ROOT, 'ALOVIDA-COBERTURA.md'), report);
console.log(report);
console.log(
  `\nResumen: entidades=${entities.length} orphan_table=${orphanTables.length} orphan_endpoint=${orphanEndpoints.length} cross_domain=${crossDomain.length}`,
);
