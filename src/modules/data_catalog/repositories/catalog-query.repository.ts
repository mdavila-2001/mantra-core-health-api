import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

export interface ObjectListFilters {
  sourceCode: string;
  schema?: string;
  kind?: string;
  observationStatus?: string;
  /** 'NONE' filtra objetos sin ficha. */
  reviewStatus?: string;
  /** Busca en nombre técnico y nombre de negocio. */
  q?: string;
  /** Objetos a los que les falta este campo en su ficha (o no tienen ficha). */
  missing?: 'purpose' | 'existenceRationale' | 'rowGrain' | 'businessOwner';
  after?: { schemaName: string; objectName: string; id: string };
  limit: number;
}

export interface ObjectListRow {
  id: string;
  schema_name: string;
  object_name: string;
  object_kind: string;
  observation_status: string;
  column_count: number;
  estimated_rows: string | null;
  total_bytes: string | null;
  stats_observed_at: Date | null;
  last_seen_at: Date;
  annotation_id: string | null;
  business_name: string | null;
  review_status: string | null;
  has_purpose: boolean;
  has_rationale: boolean;
  has_row_grain: boolean;
  business_owner: string | null;
  data_steward: string | null;
  sensitivity: string | null;
}

const MISSING_COLUMN: Readonly<
  Record<NonNullable<ObjectListFilters['missing']>, string>
> = {
  purpose: 'a.purpose',
  existenceRationale: 'a.existence_rationale',
  rowGrain: 'a.row_grain',
  businessOwner: 'coalesce(a.business_owner, a.data_steward)',
};

/**
 * Lecturas del portal. SQL explícito porque combina objeto, ficha y registro
 * de gobierno en una sola pasada, con orden estable (schema, nombre, id) para
 * que la paginación por cursor no salte ni repita filas.
 */
@Injectable()
export class CatalogQueryRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  listObjects(filters: ObjectListFilters): Promise<ObjectListRow[]> {
    const where: string[] = ['o.source_code = ?'];
    const params: unknown[] = [filters.sourceCode];
    if (filters.schema) {
      where.push('o.schema_name = ?');
      params.push(filters.schema);
    }
    if (filters.kind) {
      where.push('o.object_kind = ?');
      params.push(filters.kind);
    }
    if (filters.observationStatus) {
      where.push('o.observation_status = ?');
      params.push(filters.observationStatus);
    }
    if (filters.reviewStatus === 'NONE') {
      where.push('a.id IS NULL');
    } else if (filters.reviewStatus) {
      where.push('a.review_status = ?');
      params.push(filters.reviewStatus);
    }
    if (filters.q) {
      where.push(
        `(o.schema_name || '.' || o.object_name ILIKE ? OR a.business_name ILIKE ?)`,
      );
      const pattern = `%${escapeLike(filters.q)}%`;
      params.push(pattern, pattern);
    }
    if (filters.missing) {
      where.push(`${MISSING_COLUMN[filters.missing]} IS NULL`);
    }
    if (filters.after) {
      where.push('(o.schema_name, o.object_name, o.id) > (?, ?, ?)');
      params.push(
        filters.after.schemaName,
        filters.after.objectName,
        filters.after.id,
      );
    }
    params.push(filters.limit + 1);
    return this.sql<ObjectListRow>(
      `SELECT o.id, o.schema_name, o.object_name, o.object_kind, o.observation_status,
              o.column_count, o.estimated_rows::text AS estimated_rows,
              o.total_bytes::text AS total_bytes, o.stats_observed_at, o.last_seen_at,
              a.id AS annotation_id, a.business_name, a.review_status,
              a.purpose IS NOT NULL AS has_purpose,
              a.existence_rationale IS NOT NULL AS has_rationale,
              a.row_grain IS NOT NULL AS has_row_grain,
              a.business_owner, a.data_steward, a.sensitivity
         FROM data_catalog.catalog_objects o
         LEFT JOIN data_catalog.catalog_annotations a
                ON a.object_id = o.id AND a.target_kind = 'OBJECT'
        WHERE ${where.join(' AND ')}
        ORDER BY o.schema_name, o.object_name, o.id
        LIMIT ?`,
      params,
    );
  }

  /** Resumen por schema del alcance observado. */
  listSchemas(sourceCode: string) {
    return this.sql<{
      schema_name: string;
      objects: number;
      not_observed: number;
      annotated: number;
      approved: number;
    }>(
      `SELECT o.schema_name,
              count(*) FILTER (WHERE o.observation_status = 'OBSERVED')::int AS objects,
              count(*) FILTER (WHERE o.observation_status = 'NOT_OBSERVED')::int AS not_observed,
              count(a.id) FILTER (WHERE o.observation_status = 'OBSERVED')::int AS annotated,
              count(a.id) FILTER (WHERE o.observation_status = 'OBSERVED'
                                    AND a.review_status = 'APPROVED'
                                    AND a.approved_revision_no = a.current_revision_no)::int AS approved
         FROM data_catalog.catalog_objects o
         LEFT JOIN data_catalog.catalog_annotations a
                ON a.object_id = o.id AND a.target_kind = 'OBJECT'
        WHERE o.source_code = ? AND o.observation_status <> 'RETIRED'
        GROUP BY o.schema_name
        ORDER BY o.schema_name`,
      [sourceCode],
    );
  }

  /**
   * Registro de gobierno de una tabla (`system_ops.entity_registry`), si está
   * registrada. Se lee, no se copia: su dueño es el módulo 11.
   */
  async findGovernance(schemaName: string, tableName: string) {
    const [row] = await this.sql<{
      id: string;
      owner_team: string | null;
      contains_pii: boolean | null;
      contains_phi: boolean | null;
      is_append_only: boolean;
      is_soft_delete: boolean;
      has_history: boolean;
      retention_policy_id: string | null;
      write_policy_id: string | null;
    }>(
      `SELECT id, owner_team, contains_pii, contains_phi, is_append_only,
              is_soft_delete, has_history, retention_policy_id, write_policy_id
         FROM system_ops.entity_registry
        WHERE schema_name = ? AND table_name = ?
        LIMIT 1`,
      [schemaName, tableName],
    );
    return row ?? null;
  }

  /** Tablas cuyo registro de gobierno ya declara PII/PHI (sensibilidad conocida). */
  async registrySensitivityKnown(): Promise<Set<string>> {
    const rows = await this.sql<{ schema_name: string; table_name: string }>(
      `SELECT schema_name, table_name FROM system_ops.entity_registry
        WHERE contains_pii IS NOT NULL OR contains_phi IS NOT NULL`,
    );
    return new Set(rows.map((row) => `${row.schema_name}.${row.table_name}`));
  }

  /**
   * Aristas FK observadas entre objetos del catálogo (una por constraint). Una
   * FK compuesta aparece en varias columnas; se agrupa por nombre de constraint.
   */
  fkEdges(sourceCode: string) {
    return this.sql<{
      from_object_id: string;
      to_object_id: string;
      constraint_name: string;
      from_columns: string[];
      to_columns: string[];
    }>(
      `SELECT DISTINCT ON (c.object_id, c.foreign_key->>'constraintName')
              c.object_id AS from_object_id, t.id AS to_object_id,
              c.foreign_key->>'constraintName' AS constraint_name,
              c.foreign_key->'sourceColumns' AS from_columns,
              c.foreign_key->'targetColumns' AS to_columns
         FROM data_catalog.catalog_columns c
         JOIN data_catalog.catalog_objects o ON o.id = c.object_id
         JOIN data_catalog.catalog_objects t
           ON t.source_code = o.source_code
          AND t.schema_name = c.foreign_key->>'targetSchema'
          AND t.object_name = c.foreign_key->>'targetTable'
        WHERE o.source_code = ? AND c.foreign_key IS NOT NULL
          AND c.observation_status = 'OBSERVED' AND o.observation_status = 'OBSERVED'
        ORDER BY c.object_id, c.foreign_key->>'constraintName'`,
      [sourceCode],
    );
  }

  /** Datos de presentación de un conjunto de objetos del catálogo. */
  describeObjects(ids: readonly string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.sql<{
      id: string;
      schema_name: string;
      object_name: string;
      object_kind: string;
      review_status: string | null;
      owner: string | null;
    }>(
      `SELECT o.id, o.schema_name, o.object_name, o.object_kind, a.review_status,
              coalesce(a.business_owner, a.data_steward) AS owner
         FROM data_catalog.catalog_objects o
         LEFT JOIN data_catalog.catalog_annotations a
                ON a.object_id = o.id AND a.target_kind = 'OBJECT'
        WHERE o.id IN (SELECT jsonb_array_elements_text(?::jsonb)::uuid)`,
      [JSON.stringify(ids)],
    );
  }

  async evidenceCount(
    objectId: string,
    columnId: string | null,
  ): Promise<number> {
    const [row] = await this.sql<{ count: number }>(
      columnId
        ? `SELECT count(*)::int AS count FROM data_catalog.catalog_evidence_items
            WHERE object_id = ? AND column_id = ?`
        : `SELECT count(*)::int AS count FROM data_catalog.catalog_evidence_items
            WHERE object_id = ? AND column_id IS NULL`,
      columnId ? [objectId, columnId] : [objectId],
    );
    return row?.count ?? 0;
  }
}

/** Un `%` o `_` del usuario se busca literal, no como comodín. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
