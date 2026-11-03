import type {
  FitDriftSummary,
  FitFinding,
  FitInputs,
  FitLiveObject,
  FitStaticTable,
} from '../fit.types';
import {
  defineCheck,
  isTable,
  measure,
  noSource,
  sample,
} from './check-helpers';

const nombre = (schema: string, tabla: string): string => `${schema}.${tabla}`;

const estaticas = (tablas: readonly FitStaticTable[]) =>
  new Map(tablas.map((t) => [nombre(t.schema, t.table), t]));

/** Sólo tablas: las vistas no están en el catálogo estático (modelo) y compararlas sería ruido. */
const vivas = (objetos: readonly FitLiveObject[]) =>
  new Map(
    objetos
      .filter((o) => isTable(o.kind))
      .map((o) => [nombre(o.schema, o.name), o]),
  );

export const tableMissingInLive = defineCheck({
  id: 'FIT-MOD-001',
  dimension: 'MODEL',
  title: 'Toda tabla del modelo existe en el catálogo vivo (escaneo)',
  severity: 'ALTA',
  remediation:
    'Aplicar el DDL del modelo a la base (`SQL/apply_all.sql`) y pedir un escaneo (`POST /admin/catalog/scans`); si la tabla se retiró a propósito, quitarla del modelo y regenerar el inventario.',
  evaluate(i: FitInputs) {
    const { staticTables, liveObjects } = i;
    if (!staticTables.ok) return noSource('catálogo estático', staticTables);
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const live = vivas(liveObjects.value);
    return measure(
      staticTables.value,
      (t) => live.has(nombre(t.schema, t.table)),
      (t) => ({
        subject: nombre(t.schema, t.table),
        detail: 'Está en el modelo y el escaneo no la observa en la base',
      }),
    );
  },
});

export const tableMissingInStatic = defineCheck({
  id: 'FIT-MOD-002',
  dimension: 'MODEL',
  title:
    'Toda tabla observada en la base existe en el catálogo estático (modelo)',
  severity: 'ALTA',
  remediation:
    'Si la tabla es nueva, declararla en el modelo y regenerar el inventario (`yarn inventario:catalogo`); si es ajena al producto, excluir su schema del escaneo.',
  evaluate(i: FitInputs) {
    const { staticTables, liveObjects } = i;
    if (!staticTables.ok) return noSource('catálogo estático', staticTables);
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const modelo = estaticas(staticTables.value);
    return measure(
      [...vivas(liveObjects.value).entries()],
      ([clave]) => modelo.has(clave),
      ([clave]) => ({
        subject: clave,
        detail: 'La base la tiene y el modelo no la declara',
      }),
    );
  },
});

/** Columnas en común entre las dos fuentes, sólo de las tablas que existen en ambas. */
function pairedColumns(
  estatico: ReadonlyMap<string, FitStaticTable>,
  vivo: ReadonlyMap<string, FitLiveObject>,
): { table: string; staticCols: Set<string>; liveCols: Set<string> }[] {
  const pares: {
    table: string;
    staticCols: Set<string>;
    liveCols: Set<string>;
  }[] = [];
  for (const [clave, t] of estatico) {
    const o = vivo.get(clave);
    if (!o) continue;
    pares.push({
      table: clave,
      staticCols: new Set(t.columns),
      liveCols: new Set(o.columns.map((c) => c.name)),
    });
  }
  return pares;
}

export const columnMissingInLive = defineCheck({
  id: 'FIT-MOD-003',
  dimension: 'MODEL',
  title: 'Toda columna del modelo existe en el catálogo vivo',
  severity: 'ALTA',
  remediation:
    'Aplicar la migración del modelo a la base y reescanear; una columna que el modelo declara y la base no tiene rompe el ORM en tiempo de ejecución.',
  evaluate(i: FitInputs) {
    const { staticTables, liveObjects } = i;
    if (!staticTables.ok) return noSource('catálogo estático', staticTables);
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const items = pairedColumns(
      estaticas(staticTables.value),
      vivas(liveObjects.value),
    ).flatMap((p) =>
      [...p.staticCols].map((c) => ({
        table: p.table,
        column: c,
        live: p.liveCols,
      })),
    );
    return measure(
      items,
      (x) => x.live.has(x.column),
      (x): FitFinding => ({
        subject: `${x.table}.${x.column}`,
        detail: 'Está en el modelo y no en la base observada',
      }),
    );
  },
});

export const columnMissingInStatic = defineCheck({
  id: 'FIT-MOD-004',
  dimension: 'MODEL',
  title: 'Toda columna observada en la base existe en el catálogo estático',
  severity: 'MEDIA',
  remediation:
    'Declarar la columna en el modelo y regenerar el inventario; una columna que sólo existe en la base es una deriva que el próximo despliegue del modelo no reproduce.',
  evaluate(i: FitInputs) {
    const { staticTables, liveObjects } = i;
    if (!staticTables.ok) return noSource('catálogo estático', staticTables);
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const items = pairedColumns(
      estaticas(staticTables.value),
      vivas(liveObjects.value),
    ).flatMap((p) =>
      [...p.liveCols].map((c) => ({
        table: p.table,
        column: c,
        modelo: p.staticCols,
      })),
    );
    return measure(
      items,
      (x) => x.modelo.has(x.column),
      (x): FitFinding => ({
        subject: `${x.table}.${x.column}`,
        detail: 'Está en la base observada y no en el modelo',
      }),
    );
  },
});

/** Una categoría de deriva es un ítem: sin deriva cumple; con deriva, un hallazgo con muestra. */
function driftCategories(
  fuente: FitDriftSummary,
  categorias: readonly string[],
  etiquetas: Readonly<Record<string, string>>,
) {
  const conocidas = categorias.filter((c) => c in fuente.counts);
  const evidencia = Object.fromEntries(
    conocidas.map((c) => [c, fuente.counts[c] ?? 0]),
  );
  return measure(
    conocidas,
    (c) => (fuente.counts[c] ?? 0) === 0,
    (c) => ({
      subject: c,
      detail: `${etiquetas[c] ?? c}: ${fuente.counts[c]} elemento(s)${
        fuente.samples[c]?.length ? ` (${sample(fuente.samples[c])})` : ''
      }`,
    }),
    evidencia,
    `${conocidas.length} categorías de deriva comparadas; el ítem es la categoría, no cada elemento (los conteos van en la evidencia).`,
  );
}

const ORM_CATEGORIES = [
  'entidadesSinTabla',
  'tablasSinEntidad',
  'columnasAusentesEnOrm',
  'columnasDeMasEnOrm',
  'nulabilidad',
  'tipos',
] as const;

export const modelOrmDrift = defineCheck({
  id: 'FIT-MOD-005',
  dimension: 'MODEL',
  title:
    'El ORM coincide con el modelo (entidades, columnas, nulabilidad y tipos)',
  severity: 'MEDIA',
  remediation:
    'Regenerar las entidades desde el modelo (`salud-db/gen_entities.py`, en el repo del modelo); el esquema fluye modelo → entidades, nunca al revés.',
  evaluate(i: FitInputs) {
    const { ormDrift } = i;
    if (!ormDrift.ok) return noSource('deriva modelo/ORM', ormDrift);
    return driftCategories(ormDrift.value, ORM_CATEGORIES, {
      entidadesSinTabla: 'Entidades del ORM sin tabla en el modelo',
      tablasSinEntidad: 'Tablas del modelo sin entidad en el ORM',
      columnasAusentesEnOrm: 'Columnas del modelo que el ORM no mapea',
      columnasDeMasEnOrm: 'Propiedades del ORM sin columna en el modelo',
      nulabilidad: 'Nulabilidad divergente',
      tipos: 'Tipos divergentes',
    });
  },
});

const DB_CATEGORIES = [
  'tablasAusentes',
  'columnasAusentes',
  'columnasDeMas',
  'nulabilidad',
  'tipos',
  'indicesAusentes',
  'fkAusentes',
  'tablasDeMas',
  'indicesDeMas',
] as const;

export const deployedDbSnapshotDrift = defineCheck({
  id: 'FIT-MOD-006',
  dimension: 'MODEL',
  title:
    'El modelo coincide con la base contra la que se generó el inventario (foto de generación)',
  severity: 'MEDIA',
  remediation:
    'Regenerar la comparación (`yarn inventario:deriva-bd`) contra una base con el DDL actual. Es una foto del momento de generar el inventario; la base de hoy la dicen FIT-MOD-001 a FIT-MOD-004.',
  evaluate(i: FitInputs) {
    const { deployedDbDrift } = i;
    if (!deployedDbDrift.ok)
      return noSource('deriva modelo/base (inventario)', deployedDbDrift);
    return driftCategories(deployedDbDrift.value, DB_CATEGORIES, {
      tablasAusentes: 'Tablas del modelo ausentes en la base',
      columnasAusentes: 'Columnas del modelo ausentes en la base',
      columnasDeMas: 'Columnas de la base que el modelo no declara',
      nulabilidad: 'Nulabilidad divergente',
      tipos: 'Tipos divergentes',
      indicesAusentes: 'Índices del modelo ausentes en la base',
      fkAusentes: 'Claves foráneas ausentes en la base',
      tablasDeMas: 'Tablas de la base que el modelo no declara',
      indicesDeMas: 'Índices de la base que el modelo no declara',
    });
  },
});

export const MODEL_CHECKS = [
  tableMissingInLive,
  tableMissingInStatic,
  columnMissingInLive,
  columnMissingInStatic,
  modelOrmDrift,
  deployedDbSnapshotDrift,
];
