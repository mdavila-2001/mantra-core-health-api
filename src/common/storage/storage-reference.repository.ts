import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StorageLifecycleDenied } from './storage-lifecycle.protocol';

export interface StorageReferenceRow {
  id: string;
  source: string;
  storage_uri: string;
  object_version?: string;
  object_key?: string;
  bucket_or_container?: string;
  content_hash?: string;
  external_source_uri?: string;
}

export interface StorageReferenceSnapshot {
  rows: StorageReferenceRow[];
  opaqueReferencesPresent: boolean;
  incomingReferences: number;
}

/** One bound PostgreSQL uuid[] scalar, not MikroORM's SQL-list array format. */
export function bindStorageReferenceIds(ids: readonly string[]): string {
  if (!Array.isArray(ids))
    throw new StorageLifecycleDenied('REFERENCE_STATE_UNKNOWN');
  for (const id of ids) {
    if (
      typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new StorageLifecycleDenied('REFERENCE_STATE_UNKNOWN');
  }
  return `{${ids.join(',')}}`;
}

/** Metadata-only, unpaginated primary reads. Errors/limited RLS visibility are UNKNOWN. */
@Injectable()
export class StorageReferenceRepository {
  async snapshot(
    tx: EntityManager,
    retiredFileIds: string[],
    retiredVersionIds: string[],
  ): Promise<StorageReferenceSnapshot> {
    if (!tx.getTransactionContext())
      throw new StorageLifecycleDenied('TRANSACTION_REQUIRED');
    // MikroORM formats JS arrays as SQL lists, not a single PostgreSQL uuid[].
    // Bind one scalar array literal; validate every element (including sparse
    // slots) before joining, and snapshot inputs before any asynchronous query.
    const boundIds = [retiredFileIds, retiredVersionIds].map(
      bindStorageReferenceIds,
    );
    const query = <T extends object>(sql: string, params: unknown[] = []) =>
      tx
        .getConnection('write')
        .execute<T[]>(sql, params, 'all', tx.getTransactionContext());
    const visibility = await query<{
      primary: boolean;
      global_visibility: boolean;
    }>(
      'SELECT NOT pg_is_in_recovery() AS primary, (rolsuper OR rolbypassrls) AS global_visibility FROM pg_roles WHERE rolname = current_user',
    );
    if (
      visibility.length !== 1 ||
      visibility[0].primary !== true ||
      visibility[0].global_visibility !== true
    )
      throw new StorageLifecycleDenied('GLOBAL_REFERENCE_VISIBILITY_UNPROVEN');
    const rows = await query<StorageReferenceRow>(`
      SELECT id::text, 'common.file_versions' AS source, storage_uri,
        object_version, object_key, bucket_or_container, content_hash, external_source_uri
      FROM common.file_versions`);
    // No soft-delete, status, latest-version or tenant filter can hide a live locator.
    rows.push(
      ...(await query<StorageReferenceRow>(`
      SELECT id::text, 'audio_assets.audio_assets' AS source,
        storage_key AS storage_uri, checksum_sha256 AS content_hash,
        metadata->'storagePhysicalIdentity'->'versionSelector'->>'providerVersionId' AS object_version,
        metadata->'storagePhysicalIdentity'->>'exactObjectKey' AS object_key,
        metadata->'storagePhysicalIdentity'->>'physicalContainer' AS bucket_or_container
      FROM audio_assets.audio_assets WHERE storage_key IS NOT NULL`)),
    );
    rows.push(
      ...(await query<StorageReferenceRow>(`
      SELECT l.id::text, 'object_storage.object_locations' AS source,
        l.provider_uri AS storage_uri, v.provider_version_id AS object_version,
        v.object_key, v.sha256 AS content_hash
      FROM object_storage.object_locations l
      JOIN object_storage.object_versions v ON v.id = l.object_version_id`)),
    );
    rows.push(
      ...(await query<StorageReferenceRow>(`
      SELECT id::text, 'cross_store_consistency.deletion_targets' AS source,
        target_locator AS storage_uri FROM cross_store_consistency.deletion_targets`)),
    );
    const opaque = await query<{ present: boolean }>(`
      SELECT (
        EXISTS (SELECT 1 FROM identity_assurance.identity_evidence_records WHERE encrypted_evidence_reference IS NOT NULL)
        OR EXISTS (SELECT 1 FROM identity_assurance.identity_verification_attempts
          WHERE request_message_id IS NOT NULL OR response_message_id IS NOT NULL)
        OR EXISTS (SELECT 1 FROM object_storage.multipart_uploads)
        OR EXISTS (SELECT 1 FROM object_storage.object_versions v WHERE NOT EXISTS
          (SELECT 1 FROM object_storage.object_locations l WHERE l.object_version_id = v.id))
      ) AS present`);
    if (opaque.length !== 1 || typeof opaque[0].present !== 'boolean')
      throw new StorageLifecycleDenied('REFERENCE_STATE_UNKNOWN');
    let incomingReferences = 0;
    // Catalog-driven incoming FK coverage includes derivatives/current pointers and
    // every other consumer. No clinical row or binary content is loaded here.
    const edges = await query<{
      schema_name: string;
      table_name: string;
      column_name: string;
      target: string;
      columns: number;
    }>(`
      SELECT ns.nspname AS schema_name, cls.relname AS table_name,
        att.attname AS column_name, ref.relname AS target,
        cardinality(con.conkey) AS columns
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN pg_class ref ON ref.oid = con.confrelid
      JOIN pg_namespace refns ON refns.oid = ref.relnamespace
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = con.conkey[1]
      WHERE con.contype = 'f' AND refns.nspname = 'common'
        AND ref.relname IN ('files', 'file_versions')`);
    if (!edges.length)
      throw new StorageLifecycleDenied('REFERENCE_CATALOG_UNKNOWN');
    for (const edge of edges) {
      if (
        edge.columns !== 1 ||
        ![edge.schema_name, edge.table_name, edge.column_name].every((name) =>
          /^[a-z_][a-z0-9_]*$/.test(name),
        )
      )
        throw new StorageLifecycleDenied('REFERENCE_CATALOG_UNKNOWN');
      const ids = boundIds[edge.target === 'files' ? 0 : 1];
      if (ids === '{}') continue;
      const count = await query<{ count: string }>(
        `SELECT count(*)::text AS count FROM "${edge.schema_name}"."${edge.table_name}" WHERE "${edge.column_name}" = ANY(?::uuid[])`,
        [ids],
      );
      const total = Number(count[0]?.count);
      if (count.length !== 1 || !Number.isSafeInteger(total) || total < 0)
        throw new StorageLifecycleDenied('REFERENCE_STATE_UNKNOWN');
      incomingReferences += total;
    }
    return {
      rows,
      opaqueReferencesPresent: opaque[0].present,
      incomingReferences,
    };
  }
}
