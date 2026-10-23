// Comparación entre el DDL del modelo (catálogo) y la base desplegada, sólo con lecturas del
// catálogo del sistema (information_schema y pg_catalog). Regla 97.2: tabla ausente, columna
// ausente, columna obligatoria no mapeada y nulabilidad divergente son fallos, no avisos.
import { familiaDeTipo } from './orm.mjs';

export const CONSULTAS = {
  columnas: `select table_schema as schema, table_name as tabla, column_name as columna, is_nullable = 'YES' as nulable,
    case when data_type = 'ARRAY' then regexp_replace(udt_name, '^_', '') || '[]' else coalesce(nullif(udt_name, ''), data_type) end as tipo
    from information_schema.columns where table_schema not in ('pg_catalog', 'information_schema') order by 1, 2, ordinal_position`,
  tablas: `select table_schema as schema, table_name as tabla from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema') and table_type = 'BASE TABLE'`,
  indices: `select schemaname as schema, tablename as tabla, indexname as nombre from pg_indexes where schemaname not in ('pg_catalog', 'information_schema')`,
  respaldoDeIndices: `select n.nspname as schema, i.relname as nombre from pg_constraint c join pg_class i on i.oid = c.conindid join pg_namespace n on n.oid = i.relnamespace
    where c.contype in ('p', 'u', 'x') and n.nspname not in ('pg_catalog', 'information_schema')`,
  fks: `select n.nspname as schema, r.relname as tabla, c.conname as nombre from pg_constraint c join pg_class r on r.oid = c.conrelid join pg_namespace n on n.oid = r.relnamespace
    where c.contype = 'f' and n.nspname not in ('pg_catalog', 'information_schema')`,
  version: 'select version() as version',
};

const familiaBd = (tipo) => familiaDeTipo(tipo);

/**
 * @param {{ id: string, schema: string, tabla: string, columnas: {nombre: string, tipo: string, nulable: boolean}[], indices: {nombre: string}[], relaciones: {salientes: {constraint: string}[]} }[]} tablas
 * @param {{ tablas: object[], columnas: object[], indices: object[], respaldoDeIndices: object[], fks: object[] }} bd
 */
export function compararConBase(tablas, bd) {
  const tablasBd = new Set(bd.tablas.map((t) => `${t.schema}.${t.tabla}`));
  const columnasBd = new Map();
  for (const c of bd.columnas) {
    const k = `${c.schema}.${c.tabla}`;
    if (!columnasBd.has(k)) columnasBd.set(k, new Map());
    columnasBd.get(k).set(c.columna, c);
  }
  const indicesBd = new Map();
  for (const i of bd.indices)
    indicesBd.set(`${i.schema}.${i.nombre}`, `${i.schema}.${i.tabla}`);
  const respaldo = new Set(
    bd.respaldoDeIndices.map((i) => `${i.schema}.${i.nombre}`),
  );
  const fksBd = new Set(
    bd.fks.map((f) => `${f.schema}.${f.tabla}.${f.nombre}`),
  );

  const porTabla = new Map();
  const totales = {
    tablasAusentes: 0,
    columnasAusentes: 0,
    columnasDeMas: 0,
    nulabilidad: 0,
    tipos: 0,
    indicesAusentes: 0,
    fkAusentes: 0,
  };
  const indicesDelCatalogo = new Set();
  for (const t of tablas) {
    if (!tablasBd.has(t.id)) {
      porTabla.set(t.id, { estado: 'AUSENTE' });
      totales.tablasAusentes += 1;
      continue;
    }
    const cols = columnasBd.get(t.id) ?? new Map();
    const ausentes = [];
    const nulabilidad = [];
    const tipos = [];
    for (const c of t.columnas) {
      const real = cols.get(c.nombre);
      if (!real) {
        ausentes.push(c.nombre);
        continue;
      }
      if (real.nulable !== c.nulable)
        nulabilidad.push(
          `${c.nombre}: el modelo dice ${c.nulable ? 'opcional' : 'obligatoria'} y la base ${real.nulable ? 'opcional' : 'obligatoria'}`,
        );
      const a = familiaDeTipo(c.tipo);
      const b = familiaBd(real.tipo);
      if (a && b && a !== b)
        tipos.push(
          `${c.nombre}: el modelo dice ${c.tipo} y la base ${real.tipo}`,
        );
    }
    const nombres = new Set(t.columnas.map((c) => c.nombre));
    const deMas = [...cols.keys()].filter((c) => !nombres.has(c));
    const indicesAusentes = [];
    for (const r of t.restricciones ?? [])
      if (r.tipo === 'UNIQUE INDEX')
        indicesDelCatalogo.add(`${t.schema}.${r.nombre}`);
    for (const i of t.indices) {
      indicesDelCatalogo.add(`${t.schema}.${i.nombre}`);
      if (!indicesBd.has(`${t.schema}.${i.nombre}`))
        indicesAusentes.push(i.nombre);
    }
    const fkAusentes = t.relaciones.salientes
      .filter((r) => !fksBd.has(`${t.schema}.${t.tabla}.${r.constraint}`))
      .map((r) => r.constraint);
    totales.columnasAusentes += ausentes.length;
    totales.columnasDeMas += deMas.length;
    totales.nulabilidad += nulabilidad.length;
    totales.tipos += tipos.length;
    totales.indicesAusentes += indicesAusentes.length;
    totales.fkAusentes += fkAusentes.length;
    const hay =
      ausentes.length ||
      deMas.length ||
      nulabilidad.length ||
      tipos.length ||
      indicesAusentes.length ||
      fkAusentes.length;
    porTabla.set(t.id, {
      estado: hay ? 'DIVERGE' : 'COINCIDE',
      ...(ausentes.length ? { columnasAusentes: ausentes } : {}),
      ...(deMas.length ? { columnasDeMas: deMas } : {}),
      ...(nulabilidad.length ? { nulabilidad } : {}),
      ...(tipos.length ? { tipos } : {}),
      ...(indicesAusentes.length ? { indicesAusentes } : {}),
      ...(fkAusentes.length ? { fkAusentes } : {}),
    });
  }
  // lo que la base tiene y el catálogo no: tablas, e índices que no respaldan una PK o una restricción
  const idsDelCatalogo = new Set(tablas.map((t) => t.id));
  const tablasDeMas = [...tablasBd]
    .filter((t) => !idsDelCatalogo.has(t))
    .sort();
  const indicesDeMas = [...indicesBd.keys()]
    .filter((i) => !indicesDelCatalogo.has(i) && !respaldo.has(i))
    .sort();
  return {
    porTabla,
    totales: {
      ...totales,
      tablasDeMas: tablasDeMas.length,
      indicesDeMas: indicesDeMas.length,
    },
    tablasDeMas,
    indicesDeMas,
  };
}
