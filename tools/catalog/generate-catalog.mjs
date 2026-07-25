// Genera los catálogos declarativos de src/orm/catalog a partir de la bóveda.
// Salida: índices, claves foráneas y registro de esquemas, particionados por
// schema y troceados para que ningún archivo supere el límite de 300 líneas.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readVault, primaryKeyOf } from './lib/vault.mjs';
import { readTsEntities, camel } from './lib/tsentities.mjs';

const ROOT = join(process.cwd(), 'src', 'orm', 'catalog');
const CHUNK = 180; // entradas de datos por archivo

const { entities, indexSets, foreignKeys } = readVault();
const ts = readTsEntities();

// Conjunto de tablas realmente gestionadas por el ORM (las que tienen entidad).
const managed = new Map(); // "schema.table" -> Set(columnas)
for (const [key, e] of ts) managed.set(key, new Set(e.props.map((p) => p.fieldName)));

// ---------------------------------------------------------------- schemas ---
const schemas = new Map(); // schema -> {module, moduleDir, tables}
for (const [key, e] of ts) {
  const cur = schemas.get(e.schema) ?? { schema: e.schema, moduleDir: e.module, moduleNumber: null, tables: 0 };
  cur.tables++;
  const v = entities.get(key);
  if (v?.module) cur.moduleNumber = Number(v.module);
  schemas.set(e.schema, cur);
}

// ------------------------------------------------------------------- FKs ---
const fkBySchema = new Map();
let fkSkipped = 0;
const seen = new Set();
for (const fk of foreignKeys) {
  const src = `${fk.schema}.${fk.table}`;
  const dst = `${fk.targetSchema}.${fk.targetTable}`;
  const cols = managed.get(src);
  if (!cols || !cols.has(fk.column)) { fkSkipped++; continue; }
  if (!managed.has(dst)) { fkSkipped++; continue; }
  const dedupe = `${src}.${fk.column}`;
  if (seen.has(dedupe)) continue;
  seen.add(dedupe);
  const target = entities.get(dst);
  const pk = target ? primaryKeyOf(target) : ['id'];
  if (pk.length !== 1 || !managed.get(dst).has(pk[0])) { fkSkipped++; continue; }
  const list = fkBySchema.get(fk.schema) ?? [];
  list.push([fk.table, fk.column, fk.targetSchema, fk.targetTable, pk[0]]);
  fkBySchema.set(fk.schema, list);
}

// --------------------------------------------------------------- índices ---
const idxBySchema = new Map();
let idxSkipped = 0;
for (const [key, defs] of indexSets) {
  const cols = managed.get(key);
  if (!cols) { idxSkipped += defs.length; continue; }
  const [schema, table] = [key.slice(0, key.indexOf('.')), key.slice(key.indexOf('.') + 1)];
  for (const d of defs) {
    if (d.kind === 'PK') continue; // la PK la emite MikroORM desde la entidad
    // Una columna puede venir como "recorded_at desc": para validar que existe
    // hay que quedarse con el nombre, pero en el catálogo se conserva entera
    // porque la dirección forma parte de la definición del índice.
    const columnName = (c) => c.split(/\s+/)[0];
    if (!d.cols.length || !d.cols.every((c) => cols.has(columnName(c)))) { idxSkipped++; continue; }
    const list = idxBySchema.get(schema) ?? [];
    list.push([table, d.name, d.cols, d.unique, d.method]);
    idxBySchema.set(schema, list);
  }
}

// ------------------------------------------------------------- emisión -----
const lit = (v) => (typeof v === 'string' ? `'${v}'` : Array.isArray(v) ? `[${v.map(lit).join(', ')}]` : String(v));

function emitChunks({ dir, kind, bySchema, constSuffix, typeName, rowComment, header }) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const barrel = [];
  for (const schema of [...bySchema.keys()].sort()) {
    const rows = bySchema.get(schema);
    const chunks = [];
    for (let i = 0; i < rows.length; i += CHUNK) chunks.push(rows.slice(i, i + CHUNK));
    chunks.forEach((chunk, i) => {
      const suffix = chunks.length > 1 ? `.${i + 1}` : '';
      const name = `${camel(schema)}${constSuffix}${chunks.length > 1 ? i + 1 : ''}`;
      const file = `${schema}${suffix}.${kind}.ts`;
      const body = chunk.map((r) => `  [${r.map(lit).join(', ')}],`).join('\n');
      writeFileSync(join(dir, file), [
        `import type { ${typeName} } from '../catalog.types';`,
        '',
        header(schema, chunk.length, chunks.length > 1 ? `${i + 1}/${chunks.length}` : null),
        `export const ${name}: readonly ${typeName}[] = [`,
        `  ${rowComment}`,
        body,
        '];',
        '',
      ].join('\n'));
      barrel.push({ schema, name, file: file.replace(/\.ts$/, '') });
    });
  }
  return barrel;
}

const fkBarrel = emitChunks({
  dir: join(ROOT, 'foreign-keys'),
  kind: 'fk',
  bySchema: fkBySchema,
  constSuffix: 'ForeignKeys',
  typeName: 'ForeignKeyTuple',
  rowComment: '// [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]',
  header: (schema, n, part) =>
    `/**\n * Claves foráneas declaradas por el modelo oficial para el schema \`${schema}\`` +
    `${part ? ` (parte ${part})` : ''}.\n * ${n} restricciones. Generado desde las notas \`FK/\` de la bóveda SALUD;\n` +
    ` * no editar a mano: regenerar con \`yarn orm:catalog\`.\n */`,
});

const idxBarrel = emitChunks({
  dir: join(ROOT, 'indexes'),
  kind: 'idx',
  bySchema: idxBySchema,
  constSuffix: 'Indexes',
  typeName: 'IndexTuple',
  rowComment: '// [tabla, nombre, columnas, único, método]',
  header: (schema, n, part) =>
    `/**\n * Índices secundarios declarados por el modelo oficial para el schema \`${schema}\`` +
    `${part ? ` (parte ${part})` : ''}.\n * ${n} definiciones. Generado desde los \`<<INDEX_SET>>\` de la bóveda SALUD;\n` +
    ` * no editar a mano: regenerar con \`yarn orm:catalog\`.\n */`,
});

function writeBarrel(dir, barrel, typeName, constName, doc) {
  const imports = barrel.map((b) => `import { ${b.name} } from './${b.file}';`).join('\n');
  const groups = new Map();
  for (const b of barrel) groups.set(b.schema, [...(groups.get(b.schema) ?? []), b.name]);
  const entries = [...groups.entries()].sort()
    .map(([s, names]) => `  ${s}: [${names.join(', ')}],`).join('\n');
  writeFileSync(join(dir, 'index.ts'), [
    `import type { ${typeName} } from '../catalog.types';`,
    imports,
    '',
    doc,
    `export const ${constName}: Readonly<Record<string, readonly (readonly ${typeName}[])[]>> = {`,
    entries,
    '};',
    '',
  ].join('\n'));
}

writeBarrel(join(ROOT, 'foreign-keys'), fkBarrel, 'ForeignKeyTuple', 'foreignKeyCatalog',
  `/**\n * Catálogo de claves foráneas indexado por schema. Cada schema apunta a los\n * lotes en que se troceó su definición (ningún archivo supera 300 líneas).\n */`);
writeBarrel(join(ROOT, 'indexes'), idxBarrel, 'IndexTuple', 'indexCatalog',
  `/**\n * Catálogo de índices secundarios indexado por schema. Cada schema apunta a los\n * lotes en que se troceó su definición (ningún archivo supera 300 líneas).\n */`);

// ------------------------------------------------------ schemas.catalog -----
const schemaRows = [...schemas.values()].sort((a, b) => a.schema.localeCompare(b.schema));
writeFileSync(join(ROOT, 'schemas.catalog.ts'), [
  `import type { SchemaSpec } from './catalog.types';`,
  '',
  `/**`,
  ` * Registro de los ${schemaRows.length} esquemas PostgreSQL que compone el modelo canónico.`,
  ` * La capa 02 del arranque crea cada uno con CREATE SCHEMA IF NOT EXISTS antes de`,
  ` * que MikroORM sincronice tablas: sin el schema, el DDL de tablas fallaría.`,
  ` * Generado desde la bóveda SALUD; regenerar con \`yarn orm:catalog\`.`,
  ` */`,
  `export const schemaCatalog: readonly SchemaSpec[] = [`,
  `  // [schema, número de módulo del modelo, carpeta del módulo NestJS, tablas mapeadas]`,
  ...schemaRows.map((s) => `  ['${s.schema}', ${s.moduleNumber ?? 'null'}, '${s.moduleDir}', ${s.tables}],`),
  `];`,
  '',
].join('\n'));

console.log(JSON.stringify({
  schemas: schemaRows.length,
  fkEmitidas: [...fkBySchema.values()].reduce((a, b) => a + b.length, 0),
  fkDescartadas: fkSkipped,
  fkArchivos: fkBarrel.length,
  idxEmitidos: [...idxBySchema.values()].reduce((a, b) => a + b.length, 0),
  idxDescartados: idxSkipped,
  idxArchivos: idxBarrel.length,
}, null, 2));
