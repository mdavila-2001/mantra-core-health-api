// Auditoría de fidelidad: modelo oficial (bóveda SALUD) frente a lo que este
// repositorio materializa (entidades MikroORM + catálogo declarativo).
//
// Es una herramienta de desarrollo, no código de producción: no se compila ni se
// despliega. Se ejecuta con `yarn orm:audit` y escribe un informe JSON.
//
// Complementa al verificador de fidelidad en runtime (src/orm/fidelity), que
// compara entidades contra la base real. Este compara entidades contra el
// modelo, que es la pregunta anterior: "¿mapeamos todo lo que el modelo declara?".
import { writeFileSync } from 'node:fs';
import { readVault } from './lib/vault.mjs';
import { readTsEntities } from './lib/tsentities.mjs';

const { entities: vault, indexSets, foreignKeys } = readVault();
const ts = readTsEntities();

// Stores que no viven en PostgreSQL: fuera del alcance de MikroORM.
const NON_RELATIONAL_SCHEMAS = new Set([
  'document_store',
  'redis_runtime',
  'search_platform',
]);
const NON_RELATIONAL_TIPOS = new Set([
  'mongodb_collection',
  'redis_keyspace',
  'opensearch_index',
  'graph_collection',
]);
// Elementos del modelo que no son tablas: stubs de referencia y definiciones de
// máquina de estado.
const NON_TABLE_TIPOS = new Set(['external', 'state_machine']);

const report = {
  resumen: {},
  entidadesFaltantes: [],
  entidadesSobrantes: [],
  columnasFaltantes: [],
  columnasSobrantes: [],
  tiposDivergentes: [],
  obligatoriedadDivergente: [],
  vistasNoMaterializadas: [],
};

for (const [key, v] of vault) {
  if (NON_RELATIONAL_SCHEMAS.has(v.schema) || NON_RELATIONAL_TIPOS.has(v.tipo))
    continue;
  if (v.referenceOnly) continue;

  // Las vistas se cuentan aparte: su DDL es una consulta que la bóveda no
  // publica, así que no se pueden materializar sin inventarse la semántica.
  if (v.tipo === 'view' || v.tipo === 'materialized_view') {
    if (!ts.has(key))
      report.vistasNoMaterializadas.push({ key, campos: v.fields.length });
    continue;
  }
  if (NON_TABLE_TIPOS.has(v.tipo)) continue;

  const t = ts.get(key);
  if (!t) {
    // Sin campos declarados en la bóveda no hay nada que materializar: la nota
    // describe la entidad en prosa pero no da su estructura.
    if (v.fields.length > 0) {
      report.entidadesFaltantes.push({
        key,
        tipo: v.tipo,
        campos: v.fields.length,
      });
    }
    continue;
  }

  const vNames = v.fields.map((f) => f.name);
  const tNames = t.props.map((p) => p.fieldName);

  for (const name of vNames.filter((n) => !tNames.includes(n))) {
    report.columnasFaltantes.push({
      key,
      columna: name,
      archivo: `${t.module}/entities/${t.file}`,
    });
  }
  for (const name of tNames.filter((n) => !vNames.includes(n))) {
    report.columnasSobrantes.push({
      key,
      columna: name,
      archivo: `${t.module}/entities/${t.file}`,
    });
  }

  for (const f of v.fields) {
    const p = t.props.find((x) => x.fieldName === f.name);
    if (!p) continue;
    const tsType = (p.columnType || p.type || '').toLowerCase();
    if (!typeCompatible(f.type.toLowerCase(), tsType)) {
      report.tiposDivergentes.push({
        key,
        columna: f.name,
        boveda: f.type,
        entidad: tsType,
      });
    }
    if (f.required && p.nullable) {
      report.obligatoriedadDivergente.push({
        key,
        columna: f.name,
        detalle: 'bóveda NOT NULL, entidad opcional',
      });
    }
    if (!f.required && !p.nullable && !p.primary && !p.version) {
      report.obligatoriedadDivergente.push({
        key,
        columna: f.name,
        detalle: 'bóveda NULL, entidad obligatoria',
      });
    }
  }
}

for (const [key, t] of ts) {
  if (!vault.has(key)) {
    report.entidadesSobrantes.push({
      key,
      archivo: `${t.module}/entities/${t.file}`,
    });
  }
}

// Cobertura del catálogo declarativo frente a lo que declara el modelo.
const idxDeclarados = [...indexSets.values()]
  .flat()
  .filter((i) => i.kind !== 'PK').length;
const idxMapeables = [...indexSets.entries()]
  .filter(([key]) => ts.has(key))
  .flatMap(([key, defs]) => {
    const cols = new Set(ts.get(key).props.map((p) => p.fieldName));
    // Una columna puede llevar dirección de orden ("recorded_at desc"); para
    // comprobar que existe hay que quedarse solo con el nombre.
    const columnName = (c) => c.split(/\s+/)[0];
    return defs.filter(
      (d) =>
        d.kind !== 'PK' &&
        d.cols.length > 0 &&
        d.cols.every((c) => cols.has(columnName(c))),
    );
  }).length;
const fkMapeables = foreignKeys.filter((fk) => {
  const src = ts.get(`${fk.schema}.${fk.table}`);
  return (
    src &&
    src.props.some((p) => p.fieldName === fk.column) &&
    ts.has(`${fk.targetSchema}.${fk.targetTable}`)
  );
}).length;

report.resumen = {
  entidadesBoveda: vault.size,
  conjuntosDeIndicesBoveda: indexSets.size,
  entidadesMapeadas: ts.size,
  entidadesFaltantes: report.entidadesFaltantes.length,
  entidadesSobrantes: report.entidadesSobrantes.length,
  columnasFaltantes: report.columnasFaltantes.length,
  columnasSobrantes: report.columnasSobrantes.length,
  tiposDivergentes: report.tiposDivergentes.length,
  obligatoriedadDivergente: report.obligatoriedadDivergente.length,
  vistasNoMaterializadas: report.vistasNoMaterializadas.length,
  indicesDeclarados: idxDeclarados,
  indicesEnCatalogo: idxMapeables,
  fkDeclaradas: foreignKeys.length,
  fkEnCatalogo: fkMapeables,
};

/**
 * Equivalencia de tipos entre el vocabulario de la bóveda y el de MikroORM.
 *
 * Es una tabla explícita y no una comparación textual porque los sinónimos
 * (`integer`/`int`, `timestamptz`/`datetime`) producirían cientos de falsos
 * positivos que enterrarían las divergencias reales.
 */
function typeCompatible(vaultType, tsType) {
  const norm = (x) => x.replace(/\(.*\)/, '').trim();
  const a = norm(vaultType);
  const b = norm(tsType);
  if (!b) return false;
  if (a.endsWith('[]')) return b.startsWith('array');
  const equivalences = {
    uuid: ['uuid'],
    varchar: ['varchar', 'string', 'text'],
    text: ['text', 'varchar', 'string'],
    integer: ['int', 'integer', 'number', 'int4'],
    bigint: ['bigint', 'int8', 'number'],
    smallint: ['smallint', 'int2', 'number'],
    boolean: ['boolean', 'bool'],
    numeric: ['numeric', 'decimal'],
    timestamptz: ['timestamptz', 'datetime', 'date'],
    date: ['date'],
    time: ['time'],
    jsonb: ['jsonb', 'json'],
    json: ['json', 'jsonb'],
    bytea: ['bytea', 'blob', 'buffer'],
    inet: ['inet', 'string'],
    vector: ['vector'],
    interval: ['interval'],
    double: ['double', 'float', 'number'],
    technical_data_type: ['terminology.technical_data_type'],
  };
  for (const [prefix, accepted] of Object.entries(equivalences)) {
    if (a.startsWith(prefix)) return accepted.some((x) => b.startsWith(x));
  }
  return a === b;
}

const output = process.argv[2] ?? 'fidelity-audit.json';
writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.resumen, null, 2));
console.log(`\nInforme completo: ${output}`);
