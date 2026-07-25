// Genera las entidades MikroORM ausentes, con el mismo estilo que produce el
// generador por introspección, a partir del modelo oficial de la bóveda.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readVault } from './lib/vault.mjs';
import { readTsEntities, SRC_MODULES, pascal, camel } from './lib/tsentities.mjs';

const { entities, foreignKeys } = readVault();
const ts = readTsEntities();

// Destino FK por columna, para reproducir el comentario "// FK → schema.tabla".
const fkIndex = new Map();
for (const fk of foreignKeys) fkIndex.set(`${fk.schema}.${fk.table}.${fk.column}`, `${fk.targetSchema}.${fk.targetTable}`);

// Mapeo tipo lógico (bóveda) -> opciones del decorador + tipo TypeScript.
function mapType(vaultType) {
  const t = vaultType.trim().toLowerCase();
  // Los arrays se resuelven primero: 'varchar[]' empieza por 'varchar' y si no
  // se comprobara antes acabaría mapeado como columna escalar.
  if (t.endsWith('[]')) return { opts: `type: 'array'`, tsType: 'string[]' };
  if (t === 'uuid') return { opts: `type: 'uuid'`, tsType: 'string' };
  if (t.startsWith('varchar')) return { opts: `columnType: '${t}'`, tsType: 'string' };
  if (t === 'text') return { opts: `columnType: 'text'`, tsType: 'string' };
  if (t === 'integer') return { opts: `columnType: 'int'`, tsType: 'number' };
  if (t === 'smallint') return { opts: `columnType: 'smallint'`, tsType: 'number' };
  if (t === 'bigint') return { opts: `columnType: 'bigint'`, tsType: 'string' };
  if (t === 'boolean') return { opts: `type: 'boolean'`, tsType: 'boolean' };
  if (t.startsWith('numeric')) return { opts: `columnType: '${t}'`, tsType: 'string' };
  if (t === 'double') return { opts: `columnType: 'double precision'`, tsType: 'number' };
  if (t === 'timestamptz' || t === 'datetime') return { opts: `columnType: 'timestamptz'`, tsType: 'Date' };
  if (t === 'date') return { opts: `columnType: 'date'`, tsType: 'string' };
  if (t === 'time') return { opts: `columnType: 'time'`, tsType: 'string' };
  if (t === 'jsonb' || t === 'json') return { opts: `type: 'json', columnType: 'jsonb'`, tsType: 'unknown' };
  if (t === 'inet') return { opts: `columnType: 'inet'`, tsType: 'string' };
  if (t === 'bytea') return { opts: `columnType: 'bytea'`, tsType: 'Buffer' };
  if (t === 'interval') return { opts: `columnType: 'interval'`, tsType: 'string' };
  if (t === 'vector') return { opts: `columnType: 'vector'`, tsType: 'string' };
  if (t.startsWith('char')) return { opts: `columnType: '${t}'`, tsType: 'string' };
  if (t === 'technical_data_type') return { opts: `columnType: '"terminology"."technical_data_type"'`, tsType: 'string' };
  return { opts: `columnType: '${t}'`, tsType: 'string' };
}

// Tablas del modelo relacional que aún no tienen entidad. Las vistas y vistas
// materializadas quedan fuera: su DDL es una consulta que la bóveda no publica.
const SKIP_TIPOS = new Set(['index_set', 'view', 'materialized_view', 'external', 'state_machine',
  'mongodb_collection', 'redis_keyspace', 'opensearch_index', 'graph_collection']);
const SKIP_SCHEMAS = new Set(['document_store', 'redis_runtime', 'search_platform']);

// Esquemas sin módulo NestJS todavía: se crean con la misma convención.
const SCHEMA_TO_MODULE = {};
for (const [, e] of ts) SCHEMA_TO_MODULE[e.schema] = e.module;
SCHEMA_TO_MODULE.time_series ??= 'time_series';
SCHEMA_TO_MODULE.vector_rag ??= 'vector_rag';

const created = [];
for (const [key, v] of entities) {
  if (SKIP_TIPOS.has(v.tipo) || SKIP_SCHEMAS.has(v.schema) || v.referenceOnly) continue;
  if (ts.has(key)) continue;
  if (v.fields.length === 0) continue; // definición en prosa: no materializable

  const mod = SCHEMA_TO_MODULE[v.schema];
  if (!mod) { console.warn(`sin módulo destino: ${key}`); continue; }
  const dir = join(SRC_MODULES, mod, 'entities');
  mkdirSync(dir, { recursive: true });

  const className = pascal(v.table);
  const pkFields = v.fields.filter((f) => /PK|TIME_KEY|SERIES_KEY|PARTITION_KEY/.test(f.marker));
  const pkNames = new Set(pkFields.map((f) => f.name));
  const singleUuidPk = pkFields.length === 1 && pkFields[0].type === 'uuid';

  const body = [];
  const imports = new Set(['Entity', 'PrimaryKey', 'Property']);

  for (const f of v.fields) {
    const { opts, tsType } = mapType(f.type);
    const isPk = pkNames.has(f.name);
    const isVersion = f.name === 'row_version';
    const parts = [];
    if (f.name !== camel(f.name) && !(isPk && singleUuidPk)) parts.push(`fieldName: '${f.name}'`);
    else if (f.name !== camel(f.name)) parts.push(`fieldName: '${f.name}'`);
    parts.push(opts);
    if (isVersion) parts.push('version: true');
    if (!f.required && !isPk) parts.push('nullable: true');

    const decorator = isPk ? 'PrimaryKey' : 'Property';
    const optsStr = `{ ${parts.join(', ')} }`;
    const target = fkIndex.get(`${v.schema}.${v.table}.${f.name}`);
    const comment = target ? ` // FK → ${target}` : '';
    const prop = camel(f.name);

    if (isPk && singleUuidPk) {
      body.push(`  @PrimaryKey({ type: 'uuid' })\n  ${prop}: string = randomUUID();`);
    } else {
      const suffix = f.required || isPk ? '!' : '?';
      body.push(`  @${decorator}(${optsStr})${comment}\n  ${prop}${suffix}: ${tsType};`);
    }
  }

  const needsUuid = singleUuidPk;
  const src = [
    `import { ${[...imports].join(', ')} } from '@mikro-orm/decorators/legacy';`,
    needsUuid ? `import { randomUUID } from 'node:crypto';` : null,
    '',
    `@Entity({ schema: '${v.schema}', tableName: '${v.table}' })`,
    `export class ${className} {`,
    body.join('\n\n'),
    '}',
    '',
  ].filter((x) => x !== null).join('\n');

  const file = join(dir, `${v.table}.entity.ts`);
  writeFileSync(file, src);
  created.push({ key, mod, file: file.replace(SRC_MODULES + '/', ''), cols: v.fields.length });
}

// Regenerar los barrels de los módulos tocados.
const touched = new Set(created.map((c) => c.mod));
for (const mod of touched) {
  const dir = join(SRC_MODULES, mod, 'entities');
  const files = (await import('node:fs')).readdirSync(dir)
    .filter((f) => f.endsWith('.entity.ts')).sort();
  writeFileSync(join(dir, 'index.ts'), files.map((f) => `export * from './${f.replace(/\.ts$/, '')}';`).join('\n') + '\n');
}

console.log(`entidades creadas: ${created.length}`);
console.log(created.map((c) => `  ${c.key} (${c.cols} col) -> ${c.file}`).join('\n'));
console.log('módulos tocados:', [...touched].join(', '));
