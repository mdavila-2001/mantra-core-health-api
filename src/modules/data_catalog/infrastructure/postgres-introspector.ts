import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  ForeignKeyFact,
  IntrospectedColumn,
  IntrospectedObject,
  ObjectKind,
} from '../domain';

/** Una limitación del conector: lo que el resultado NO cubre y por qué. */
export interface ScanLimitation {
  code: string;
  detail: string;
  count?: number;
}

export interface IntrospectionResult {
  engineVersion: string;
  objects: IntrospectedObject[];
  excludedSchemas: string[];
  limitations: ScanLimitation[];
}

/** Schemas de sistema o internos de extensiones: no son modelo de negocio. */
export const EXCLUDED_SCHEMA_PATTERNS = [
  'pg_catalog',
  'information_schema',
  'pg_toast*',
  'pg_temp*',
  '_timescaledb*',
  'timescaledb_information',
  'timescaledb_experimental',
  'toolkit_experimental',
];

const SCHEMA_FILTER = `
  n.nspname NOT IN ('pg_catalog', 'information_schema',
                    'timescaledb_information', 'timescaledb_experimental',
                    'toolkit_experimental')
  AND n.nspname !~ '^pg_'
  AND n.nspname !~ '^_timescaledb'`;

/** Relaciones de primer nivel: sin particiones hijas ni objetos de extensiones. */
const RELATION_FILTER = `
  c.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND NOT c.relispartition
  AND NOT EXISTS (SELECT 1 FROM pg_depend d
                   WHERE d.classid = 'pg_class'::regclass
                     AND d.objid = c.oid AND d.deptype = 'e')
  AND ${SCHEMA_FILTER}`;

const KIND_BY_RELKIND: Readonly<Record<string, ObjectKind>> = {
  r: 'TABLE',
  p: 'PARTITIONED_TABLE',
  v: 'VIEW',
  m: 'MATERIALIZED_VIEW',
  f: 'FOREIGN_TABLE',
};

/** Tiempo máximo por sentencia de introspección. */
const STATEMENT_TIMEOUT_MS = 30_000;

interface ObjectRow {
  schema_name: string;
  object_name: string;
  relkind: string;
  comment: string | null;
  estimated_rows: string | null;
  total_bytes: string | null;
}

interface ColumnRow {
  schema_name: string;
  object_name: string;
  column_name: string;
  ordinal: number;
  native_type: string;
  is_nullable: boolean;
  default_expression: string | null;
  is_identity: boolean;
  is_generated: boolean;
  comment: string | null;
}

interface ConstraintRow {
  schema_name: string;
  object_name: string;
  constraint_name: string;
  contype: string;
  columns: string[];
  target_schema: string | null;
  target_table: string | null;
  target_columns: string[] | null;
}

interface UniqueIndexRow {
  schema_name: string;
  object_name: string;
  column_name: string;
}

/**
 * Lee la estructura de la base de la API desde `pg_catalog`, dentro de una
 * transacción READ ONLY y con timeout por sentencia. No lee filas de negocio:
 * las filas estimadas salen de `pg_class.reltuples`, que es una estadística
 * del planificador, no un `count(*)`.
 *
 * Limitación declarada: usa la conexión de la aplicación, no una cuenta de
 * catálogo dedicada. El modo READ ONLY impide escribir, pero no reduce lo que
 * la cuenta puede ver (ver ADR-AP-003).
 */
@Injectable()
export class PostgresIntrospector {
  constructor(private readonly em: EntityManager) {}

  async introspect(): Promise<IntrospectionResult> {
    return this.em.fork().transactional(async (tx) => {
      const run = <T>(sql: string): Promise<T[]> =>
        tx
          .getConnection()
          .execute<T[]>(sql, [], 'all', tx.getTransactionContext());

      await run('SET TRANSACTION READ ONLY');
      await run(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);

      const [version] = await run<{ server_version: string }>(
        'SHOW server_version',
      );
      const objects = await run<ObjectRow>(`
        SELECT n.nspname AS schema_name, c.relname AS object_name,
               c.relkind::text AS relkind,
               obj_description(c.oid, 'pg_class') AS comment,
               CASE WHEN c.relkind IN ('r', 'm') AND c.reltuples >= 0
                    THEN c.reltuples::bigint::text END AS estimated_rows,
               CASE WHEN c.relkind IN ('r', 'p', 'm')
                    THEN pg_total_relation_size(c.oid)::text END AS total_bytes
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE ${RELATION_FILTER}
         ORDER BY 1, 2`);
      const columns = await run<ColumnRow>(`
        SELECT n.nspname AS schema_name, c.relname AS object_name,
               a.attname AS column_name, a.attnum::int AS ordinal,
               format_type(a.atttypid, a.atttypmod) AS native_type,
               NOT a.attnotnull AS is_nullable,
               pg_get_expr(ad.adbin, ad.adrelid) AS default_expression,
               a.attidentity <> '' AS is_identity,
               a.attgenerated <> '' AS is_generated,
               col_description(c.oid, a.attnum) AS comment
          FROM pg_attribute a
          JOIN pg_class c ON c.oid = a.attrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
         WHERE a.attnum > 0 AND NOT a.attisdropped AND ${RELATION_FILTER}
         ORDER BY 1, 2, 4`);
      const constraints = await run<ConstraintRow>(`
        SELECT n.nspname AS schema_name, c.relname AS object_name,
               con.conname AS constraint_name, con.contype::text AS contype,
               (SELECT json_agg(a.attname ORDER BY k.ord)
                  FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord)
                  JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
               ) AS columns,
               fn.nspname AS target_schema, fc.relname AS target_table,
               (SELECT json_agg(a.attname ORDER BY k.ord)
                  FROM unnest(con.confkey) WITH ORDINALITY k(attnum, ord)
                  JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
               ) AS target_columns
          FROM pg_constraint con
          JOIN pg_class c ON c.oid = con.conrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_class fc ON fc.oid = con.confrelid
          LEFT JOIN pg_namespace fn ON fn.oid = fc.relnamespace
         WHERE con.contype IN ('p', 'f') AND ${RELATION_FILTER}
         ORDER BY 1, 2, 3`);
      // Unicidad de una sola columna, venga de una constraint o de un UNIQUE
      // INDEX (el catálogo del ORM crea índices, no constraints). Un índice
      // parcial no hace única a la columna: sólo a un subconjunto de filas.
      const uniques = await run<UniqueIndexRow>(`
        SELECT DISTINCT n.nspname AS schema_name, c.relname AS object_name,
               a.attname AS column_name
          FROM pg_index i
          JOIN pg_class c ON c.oid = i.indrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
         WHERE i.indisunique AND i.indnatts = 1 AND i.indpred IS NULL
           AND i.indkey[0] > 0 AND ${RELATION_FILTER}`);
      const [partitions] = await run<{ count: number }>(`
        SELECT count(*)::int AS count
          FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relispartition AND ${SCHEMA_FILTER}`);

      return {
        engineVersion: version?.server_version ?? 'unknown',
        objects: assemble(objects, columns, constraints, uniques),
        excludedSchemas: [...EXCLUDED_SCHEMA_PATTERNS],
        limitations: buildLimitations(partitions?.count ?? 0),
      };
    });
  }
}

function buildLimitations(partitionCount: number): ScanLimitation[] {
  const limitations: ScanLimitation[] = [
    {
      code: 'STATS_ARE_ESTIMATES',
      detail:
        'Filas estimadas desde pg_class.reltuples (estadística del planificador); no es un conteo. Null si la tabla nunca se analizó.',
    },
    {
      code: 'EXTENSION_OBJECTS_EXCLUDED',
      detail:
        'Se omiten los objetos que pertenecen a una extensión (pg_depend deptype = e).',
    },
    {
      code: 'VIEW_NULLABILITY_NOT_ENFORCED',
      detail:
        'En vistas, PostgreSQL informa toda columna como anulable; no es una garantía del dato.',
    },
    {
      code: 'APP_CONNECTION_READ_ONLY_TX',
      detail:
        'La introspección usa la conexión de la API en transacción READ ONLY, no una cuenta de catálogo dedicada.',
    },
  ];
  if (partitionCount > 0) {
    limitations.push({
      code: 'PARTITIONS_FOLDED',
      detail:
        'Las particiones hijas no se catalogan por separado: forman parte de su tabla padre.',
      count: partitionCount,
    });
  }
  return limitations;
}

/** Une las cuatro consultas en objetos con sus columnas. */
export function assemble(
  objects: readonly ObjectRow[],
  columns: readonly ColumnRow[],
  constraints: readonly ConstraintRow[],
  uniques: readonly UniqueIndexRow[],
): IntrospectedObject[] {
  const key = (schema: string, name: string) => `${schema}\u0000${name}`;
  const pk = new Set<string>();
  const fkByColumn = new Map<string, ForeignKeyFact>();
  for (const row of constraints) {
    const objectId = key(row.schema_name, row.object_name);
    for (const column of row.columns ?? []) {
      const columnKey = `${objectId}\u0000${column}`;
      if (row.contype === 'p') pk.add(columnKey);
      // Si una columna participa en más de una FK, se conserva la primera por
      // nombre de constraint (orden de la consulta): el caso es raro y el
      // resto sigue visible en la base.
      if (row.contype === 'f' && !fkByColumn.has(columnKey)) {
        fkByColumn.set(columnKey, {
          constraintName: row.constraint_name,
          sourceColumns: row.columns ?? [],
          targetSchema: row.target_schema ?? '',
          targetTable: row.target_table ?? '',
          targetColumns: row.target_columns ?? [],
        });
      }
    }
  }
  const unique = new Set(
    uniques.map(
      (row) =>
        `${key(row.schema_name, row.object_name)}\u0000${row.column_name}`,
    ),
  );

  const byObject = new Map<string, IntrospectedColumn[]>();
  for (const row of columns) {
    const objectId = key(row.schema_name, row.object_name);
    const columnKey = `${objectId}\u0000${row.column_name}`;
    const list = byObject.get(objectId) ?? [];
    list.push({
      name: row.column_name,
      ordinal: Number(row.ordinal),
      nativeType: row.native_type,
      isNullable: Boolean(row.is_nullable),
      defaultExpression: row.default_expression,
      isIdentity: Boolean(row.is_identity),
      isGenerated: Boolean(row.is_generated),
      isPrimaryKey: pk.has(columnKey),
      isUnique: unique.has(columnKey),
      foreignKey: fkByColumn.get(columnKey) ?? null,
      comment: row.comment,
    });
    byObject.set(objectId, list);
  }

  return objects.map((row) => ({
    schemaName: row.schema_name,
    objectName: row.object_name,
    kind: KIND_BY_RELKIND[row.relkind] ?? 'TABLE',
    comment: row.comment,
    estimatedRows: row.estimated_rows,
    totalBytes: row.total_bytes,
    columns: byObject.get(key(row.schema_name, row.object_name)) ?? [],
  }));
}
