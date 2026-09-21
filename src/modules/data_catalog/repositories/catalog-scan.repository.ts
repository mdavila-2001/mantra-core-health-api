import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  columnFacts,
  columnTechnicalHash,
  objectFacts,
  objectTechnicalHash,
  type ColumnFacts,
  type ForeignKeyFact,
  type IntrospectedColumn,
  type IntrospectedObject,
  type KnownObject,
  type ObjectFacts,
  type ObservationStatus,
} from '../domain';
import {
  CatalogChangeEvents,
  CatalogColumns,
  CatalogObjects,
  CatalogScanRuns,
} from '../entities';

/** Filas por sentencia en inserciones masivas: lejos del tope de 65 535 parámetros. */
const INSERT_CHUNK = 500;

/**
 * Persistencia del ciclo de escaneo. Usa SQL explícito donde el volumen lo
 * exige (un escaneo toca ~20 000 columnas) y entidades donde el volumen es
 * trivial. Todo método que escribe recibe la transacción del servicio.
 */
@Injectable()
export class CatalogScanRepository {
  private sql<T>(
    tx: EntityManager,
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return tx
      .getConnection()
      .execute<T[]>(query, params, 'all', tx.getTransactionContext());
  }

  findActiveScan(tx: EntityManager, sourceCode: string) {
    return tx.findOne(CatalogScanRuns, {
      sourceCode,
      status: { $in: ['QUEUED', 'RUNNING'] },
    });
  }

  findByIdempotencyKey(tx: EntityManager, userId: string, key: string) {
    return tx.findOne(CatalogScanRuns, {
      requestedByUserId: userId,
      idempotencyKey: key,
    });
  }

  findScanForUpdate(tx: EntityManager, id: string) {
    return tx.findOne(
      CatalogScanRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Reclama la corrida más antigua disponible: en cola, o en marcha con lease
   * vencido (su worker murió). `SKIP LOCKED` evita que dos workers tomen la
   * misma; el `lease_owner` nuevo hace de fencing contra el worker anterior.
   */
  async claimNext(
    tx: EntityManager,
    leaseOwner: string,
    leaseMs: number,
  ): Promise<{ id: string; attempt: number } | null> {
    const rows = await this.sql<{ id: string; attempt: number }>(
      tx,
      `UPDATE data_catalog.catalog_scan_runs r
          SET status = 'RUNNING',
              lease_owner = ?,
              lease_expires_at = now() + (? || ' milliseconds')::interval,
              attempt = r.attempt + 1,
              started_at = coalesce(r.started_at, now()),
              updated_at = now(),
              row_version = r.row_version + 1
        WHERE r.id = (
          SELECT id FROM data_catalog.catalog_scan_runs
           WHERE status = 'QUEUED'
              OR (status = 'RUNNING' AND lease_expires_at < now())
           ORDER BY requested_at, id
           LIMIT 1
           FOR UPDATE SKIP LOCKED)
      RETURNING r.id, r.attempt`,
      [leaseOwner, String(leaseMs)],
    );
    return rows[0] ?? null;
  }

  /** Lo que el catálogo sabe de una fuente, en la forma que espera el dominio. */
  async loadKnown(
    tx: EntityManager,
    sourceCode: string,
  ): Promise<KnownObject[]> {
    const objects = await this.sql<{
      id: string;
      schema_name: string;
      object_name: string;
      object_kind: string;
      observation_status: string;
      technical_hash: string;
      table_comment: string | null;
      column_count: number;
      primary_key_columns: string[] | null;
    }>(
      tx,
      `SELECT id, schema_name, object_name, object_kind, observation_status,
              technical_hash, table_comment, column_count, primary_key_columns
         FROM data_catalog.catalog_objects
        WHERE source_code = ? AND observation_status <> 'RETIRED'`,
      [sourceCode],
    );
    const columns = await this.sql<{
      id: string;
      object_id: string;
      column_name: string;
      ordinal: number;
      native_type: string;
      is_nullable: boolean;
      default_expression: string | null;
      is_identity: boolean;
      is_generated: boolean;
      is_primary_key: boolean;
      is_unique: boolean;
      foreign_key: ForeignKeyFact | null;
      column_comment: string | null;
      observation_status: string;
      technical_hash: string;
    }>(
      tx,
      `SELECT c.id, c.object_id, c.column_name, c.ordinal, c.native_type,
              c.is_nullable, c.default_expression, c.is_identity, c.is_generated,
              c.is_primary_key, c.is_unique, c.foreign_key, c.column_comment,
              c.observation_status, c.technical_hash
         FROM data_catalog.catalog_columns c
         JOIN data_catalog.catalog_objects o ON o.id = c.object_id
        WHERE o.source_code = ? AND o.observation_status <> 'RETIRED'`,
      [sourceCode],
    );

    const byObject = new Map<string, KnownObject['columns']>();
    for (const row of columns) {
      const facts: ColumnFacts = {
        ordinal: Number(row.ordinal),
        nativeType: row.native_type,
        isNullable: row.is_nullable,
        defaultExpression: row.default_expression,
        isIdentity: row.is_identity,
        isGenerated: row.is_generated,
        isPrimaryKey: row.is_primary_key,
        isUnique: row.is_unique,
        foreignKey: row.foreign_key,
        comment: row.column_comment,
      };
      const list = byObject.get(row.object_id) ?? [];
      list.push({
        id: row.id,
        name: row.column_name,
        observationStatus: row.observation_status as ObservationStatus,
        technicalHash: row.technical_hash,
        facts,
      });
      byObject.set(row.object_id, list);
    }

    return objects.map((row) => {
      const facts: ObjectFacts = {
        kind: row.object_kind as ObjectFacts['kind'],
        comment: row.table_comment,
        columnCount: Number(row.column_count),
        primaryKey: row.primary_key_columns ?? [],
      };
      return {
        id: row.id,
        schemaName: row.schema_name,
        objectName: row.object_name,
        observationStatus: row.observation_status as ObservationStatus,
        technicalHash: row.technical_hash,
        facts,
        columns: byObject.get(row.id) ?? [],
      };
    });
  }

  /** Inserta objetos nuevos y sus columnas; devuelve id por clave schema.nombre. */
  async insertObjects(
    tx: EntityManager,
    sourceCode: string,
    scanId: string,
    now: Date,
    objects: readonly IntrospectedObject[],
  ): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    const objectRows = objects.map((object) => {
      const row = tx.create(
        CatalogObjects,
        {
          sourceCode,
          schemaName: object.schemaName,
          objectName: object.objectName,
          objectKind: object.kind,
          observationStatus: 'OBSERVED',
          tableComment: object.comment ?? undefined,
          estimatedRows: object.estimatedRows ?? undefined,
          totalBytes: object.totalBytes ?? undefined,
          statsObservedAt: now,
          columnCount: object.columns.length,
          primaryKeyColumns: objectFacts(object).primaryKey,
          technicalHash: objectTechnicalHash(object),
          firstSeenScanId: scanId,
          lastSeenScanId: scanId,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
          rowVersion: 1,
        },
        { persist: false },
      );
      ids.set(`${object.schemaName}.${object.objectName}`, row.id);
      return row;
    });
    await this.insertChunked(tx, CatalogObjects, objectRows);

    const columnRows = objects.flatMap((object) =>
      object.columns.map((column) =>
        this.newColumn(
          tx,
          ids.get(`${object.schemaName}.${object.objectName}`)!,
          column,
          scanId,
          now,
        ),
      ),
    );
    await this.insertChunked(tx, CatalogColumns, columnRows);
    return ids;
  }

  async insertColumns(
    tx: EntityManager,
    objectId: string,
    scanId: string,
    now: Date,
    columns: readonly IntrospectedColumn[],
  ): Promise<Map<string, string>> {
    const rows = columns.map((column) =>
      this.newColumn(tx, objectId, column, scanId, now),
    );
    await this.insertChunked(tx, CatalogColumns, rows);
    return new Map(rows.map((row) => [row.columnName, row.id]));
  }

  private newColumn(
    tx: EntityManager,
    objectId: string,
    column: IntrospectedColumn,
    scanId: string,
    now: Date,
  ): CatalogColumns {
    return tx.create(
      CatalogColumns,
      {
        objectId,
        columnName: column.name,
        ordinal: column.ordinal,
        nativeType: column.nativeType,
        isNullable: column.isNullable,
        defaultExpression: column.defaultExpression ?? undefined,
        isIdentity: column.isIdentity,
        isGenerated: column.isGenerated,
        isPrimaryKey: column.isPrimaryKey,
        isUnique: column.isUnique,
        foreignKey: column.foreignKey ?? undefined,
        columnComment: column.comment ?? undefined,
        observationStatus: 'OBSERVED',
        technicalHash: columnTechnicalHash(column),
        firstSeenScanId: scanId,
        lastSeenScanId: scanId,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        rowVersion: 1,
      },
      { persist: false },
    );
  }

  private async insertChunked<T extends object>(
    tx: EntityManager,
    entity: new () => T,
    rows: readonly T[],
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      await tx.insertMany(entity, rows.slice(i, i + INSERT_CHUNK));
    }
  }

  /**
   * Refresca, en una sentencia, la marca de observación y las estadísticas de
   * todos los objetos vistos. Las estadísticas cambian solas y no son eventos.
   */
  async touchObjects(
    tx: EntityManager,
    scanId: string,
    now: Date,
    rows: ReadonlyArray<{
      id: string;
      estimatedRows: string | null;
      totalBytes: string | null;
    }>,
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_objects o
          SET last_seen_scan_id = ?, last_seen_at = ?, stats_observed_at = ?,
              estimated_rows = v.estimated_rows::bigint,
              total_bytes = v.total_bytes::bigint,
              observation_status = 'OBSERVED', not_observed_since = NULL,
              updated_at = ?
         FROM jsonb_to_recordset(?::jsonb)
              AS v(id uuid, estimated_rows text, total_bytes text)
        WHERE o.id = v.id`,
      [
        scanId,
        now,
        now,
        now,
        JSON.stringify(
          rows.map((row) => ({
            id: row.id,
            estimated_rows: row.estimatedRows,
            total_bytes: row.totalBytes,
          })),
        ),
      ],
    );
  }

  async touchColumns(
    tx: EntityManager,
    scanId: string,
    now: Date,
    ids: readonly string[],
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_columns
          SET last_seen_scan_id = ?, last_seen_at = ?,
              observation_status = 'OBSERVED', not_observed_since = NULL,
              updated_at = ?
        WHERE id IN (SELECT jsonb_array_elements_text(?::jsonb)::uuid)`,
      [scanId, now, now, JSON.stringify(ids)],
    );
  }

  /** Reescribe los hechos de un objeto cuya estructura cambió. */
  async updateObjectFacts(
    tx: EntityManager,
    id: string,
    object: IntrospectedObject,
    now: Date,
  ): Promise<void> {
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_objects
          SET object_kind = ?, table_comment = ?, column_count = ?,
              primary_key_columns = ?::jsonb, technical_hash = ?,
              updated_at = ?, row_version = row_version + 1
        WHERE id = ?`,
      [
        object.kind,
        object.comment,
        object.columns.length,
        JSON.stringify(objectFacts(object).primaryKey),
        objectTechnicalHash(object),
        now,
        id,
      ],
    );
  }

  async updateColumnFacts(
    tx: EntityManager,
    id: string,
    column: IntrospectedColumn,
    now: Date,
  ): Promise<void> {
    const facts = columnFacts(column);
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_columns
          SET ordinal = ?, native_type = ?, is_nullable = ?, default_expression = ?,
              is_identity = ?, is_generated = ?, is_primary_key = ?, is_unique = ?,
              foreign_key = ?::jsonb, column_comment = ?, technical_hash = ?,
              updated_at = ?, row_version = row_version + 1
        WHERE id = ?`,
      [
        facts.ordinal,
        facts.nativeType,
        facts.isNullable,
        facts.defaultExpression,
        facts.isIdentity,
        facts.isGenerated,
        facts.isPrimaryKey,
        facts.isUnique,
        facts.foreignKey ? JSON.stringify(facts.foreignKey) : null,
        facts.comment,
        columnTechnicalHash(column),
        now,
        id,
      ],
    );
  }

  async markObjectsNotObserved(
    tx: EntityManager,
    ids: readonly string[],
    now: Date,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_objects
          SET observation_status = 'NOT_OBSERVED',
              not_observed_since = coalesce(not_observed_since, ?),
              updated_at = ?, row_version = row_version + 1
        WHERE id IN (SELECT jsonb_array_elements_text(?::jsonb)::uuid) AND observation_status = 'OBSERVED'`,
      [now, now, JSON.stringify(ids)],
    );
  }

  async markColumnsNotObserved(
    tx: EntityManager,
    ids: readonly string[],
    now: Date,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.sql(
      tx,
      `UPDATE data_catalog.catalog_columns
          SET observation_status = 'NOT_OBSERVED',
              not_observed_since = coalesce(not_observed_since, ?),
              updated_at = ?, row_version = row_version + 1
        WHERE id IN (SELECT jsonb_array_elements_text(?::jsonb)::uuid) AND observation_status = 'OBSERVED'`,
      [now, now, JSON.stringify(ids)],
    );
  }

  async insertEvents(
    tx: EntityManager,
    rows: ReadonlyArray<Omit<CatalogChangeEvents, 'id'>>,
  ): Promise<void> {
    const entities = rows.map((row) =>
      tx.create(CatalogChangeEvents, row, { persist: false }),
    );
    await this.insertChunked(tx, CatalogChangeEvents, entities);
  }
}
