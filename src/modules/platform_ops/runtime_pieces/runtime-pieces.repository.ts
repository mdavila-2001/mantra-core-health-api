import { Injectable } from '@nestjs/common';
import { REGISTRY_CODE_PREFIX } from './runtime-pieces.types';
import type { SqlPort } from './sql-port';

/** Fila de `platform_ops.tool_registry` tal como la lee el módulo. */
export interface RegistryRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly toolTypeConceptId: string;
  readonly purpose: string | null;
  readonly stateConceptId: string;
  readonly updatedAt: Date;
}

export interface InsertRow {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly toolTypeConceptId: string;
  readonly vendor: string;
  readonly purpose: string;
  readonly stateConceptId: string;
  readonly actorUserId: string | null;
  readonly now: Date;
}

export interface UpdateRow {
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly toolTypeConceptId: string;
  readonly vendor: string;
  readonly purpose: string;
  readonly actorUserId: string | null;
  readonly now: Date;
}

const SELECT_COLUMNS = `id, code, name, tool_type_concept_id AS "toolTypeConceptId",
       purpose, state_concept_id AS "stateConceptId", updated_at AS "updatedAt"`;

/**
 * Acceso a `platform_ops.tool_registry` para las piezas ejecutables. Sólo toca
 * las filas del sujeto de plataforma cuyo `code` empieza por `rtp.`: nunca las
 * del catálogo de herramientas (`tenant_id` nulo) ni las de otros tenants.
 *
 * Todo es SQL parametrizado; las escrituras son `INSERT … ON CONFLICT DO
 * NOTHING` (la unicidad de `code` la impone el índice `uq_tool_registry_code`,
 * no una consulta previa) y `UPDATE … WHERE` con la huella como precondición.
 */
@Injectable()
export class RuntimePiecesRepository {
  /** Filas registradas por el descubrimiento (prefijo `rtp.`), por código. */
  async listRegistered(db: SqlPort, tenantId: string): Promise<RegistryRow[]> {
    return db.query<RegistryRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM platform_ops.tool_registry
        WHERE tenant_id = ? AND code LIKE ?
        ORDER BY code`,
      [tenantId, `${REGISTRY_CODE_PREFIX}%`],
    );
  }

  async findByCode(
    db: SqlPort,
    tenantId: string,
    code: string,
  ): Promise<RegistryRow | null> {
    const [row] = await db.query<RegistryRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM platform_ops.tool_registry
        WHERE tenant_id = ? AND code = ?`,
      [tenantId, code],
    );
    return row ?? null;
  }

  /** Cuáles de los conceptos existen en el catálogo terminológico. */
  async existingConcepts(
    db: SqlPort,
    ids: readonly string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await db.query<{ id: string }>(
      `SELECT id FROM terminology.catalog_concepts WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ids,
    );
    return new Set(rows.map((row) => row.id));
  }

  async tenantExists(db: SqlPort, tenantId: string): Promise<boolean> {
    const rows = await db.query<{ id: string }>(
      'SELECT id FROM directory.tenants WHERE id = ?',
      [tenantId],
    );
    return rows.length > 0;
  }

  /** Serializa dos descubrimientos simultáneos dentro de la transacción. */
  async lockDiscovery(db: SqlPort): Promise<void> {
    await db.query(
      "SELECT pg_advisory_xact_lock(hashtext('platform_ops.runtime_pieces.discover'))",
    );
  }

  /** Inserta la fila si el `code` no existe. `true` si insertó. */
  async insertIfAbsent(db: SqlPort, row: InsertRow): Promise<boolean> {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO platform_ops.tool_registry
              (id, tenant_id, code, name, tool_type_concept_id, vendor, purpose,
               is_approved, state_concept_id, created_at, updated_at,
               created_by_user_id, updated_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?, ?, ?, ?)
       ON CONFLICT (code) DO NOTHING
       RETURNING id`,
      [
        row.id,
        row.tenantId,
        row.code,
        row.name,
        row.toolTypeConceptId,
        row.vendor,
        row.purpose,
        row.stateConceptId,
        row.now,
        row.now,
        row.actorUserId,
        row.actorUserId,
      ],
    );
    return inserted.length > 0;
  }

  /**
   * Actualiza lo derivado del código (nombre, tipo, proveedor, procedencia).
   * Nunca toca el estado ni la homologación: eso lo decide una persona. La
   * cláusula `IS DISTINCT FROM` hace que reescribir lo mismo no cambie nada,
   * ni siquiera `row_version`.
   */
  async updateDerived(db: SqlPort, row: UpdateRow): Promise<boolean> {
    const updated = await db.query<{ id: string }>(
      `UPDATE platform_ops.tool_registry
          SET name = ?, tool_type_concept_id = ?, vendor = ?, purpose = ?,
              updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        WHERE tenant_id = ? AND code = ?
          AND (name, tool_type_concept_id, vendor, purpose)
              IS DISTINCT FROM (?::varchar, ?::uuid, ?::varchar, ?::text)
        RETURNING id`,
      [
        row.name,
        row.toolTypeConceptId,
        row.vendor,
        row.purpose,
        row.now,
        row.actorUserId,
        row.tenantId,
        row.code,
        row.name,
        row.toolTypeConceptId,
        row.vendor,
        row.purpose,
      ],
    );
    return updated.length > 0;
  }
}
