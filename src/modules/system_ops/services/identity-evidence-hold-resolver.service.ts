import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { LegalHoldRepository } from '../repositories/legal-hold.repository';
import { SYSOPS } from '../system_ops.concepts';
import type { LegalHolds } from '../entities/legal_holds.entity';
import type { FileStorageAdapter } from '../../../common/storage/file-storage.adapter';
import {
  physicalContentionKey,
  type KnownPhysicalObjectIdentity,
} from '../../../common/storage/physical-object-identity';
import { EntityRegistry } from '../entities/entity_registry.entity';

export interface IdentityHoldGraph {
  tenantId: string;
  recordIds: string[];
  registryIds: string[];
  fileHoldUntil: (Date | null | undefined)[];
  objectHolds: { holdState: string; placedAt: Date; releasedAt?: Date }[];
  objectRetentionLocks: { retainUntil: Date; releasedAt?: Date }[];
  coverage: 'PROVEN' | 'UNKNOWN';
}
export interface IdentityHoldDecision {
  state: 'CLEAR' | 'ACTIVE' | 'UNKNOWN';
  reasonCode: string;
}
const validDate = (value: unknown): value is Date =>
  value instanceof Date && Number.isFinite(value.getTime());

/** One resolver combines subject/case/evidence/file/table/object holds. */
@Injectable()
export class IdentityEvidenceHoldResolver {
  constructor(private readonly repository: LegalHoldRepository) {}

  /** Enrich the same resolver with provider holds; never treat unlocated holds as absent. */
  async resolveWithObjects(
    tx: EntityManager,
    graph: IdentityHoldGraph,
    targets: KnownPhysicalObjectIdentity[],
    adapter: FileStorageAdapter,
    now: Date,
  ): Promise<IdentityHoldDecision> {
    try {
      const enriched: IdentityHoldGraph = {
        ...graph,
        recordIds: [...graph.recordIds],
        registryIds: [...graph.registryIds],
        objectHolds: [...graph.objectHolds],
        objectRetentionLocks: [...graph.objectRetentionLocks],
      };
      if (targets.length) {
        const rows = await tx.getConnection('write').execute<
          {
            id: string;
            manifest_id: string;
            storage_uri: string | null;
            provider_version_id?: string;
            hold_state: string | null;
            placed_at: Date | null;
            hold_released_at?: Date;
            retain_until: Date | null;
            lock_released_at?: Date;
          }[]
        >(
          `SELECT v.id, v.object_manifest_id AS manifest_id, l.provider_uri AS storage_uri, v.provider_version_id,
          h.hold_state, h.placed_at, h.released_at AS hold_released_at, r.retain_until, r.released_at AS lock_released_at
          FROM object_storage.object_versions v LEFT JOIN object_storage.object_locations l ON l.object_version_id=v.id
          LEFT JOIN object_storage.object_legal_holds h ON h.object_version_id=v.id
          LEFT JOIN object_storage.object_retention_locks r ON r.object_version_id=v.id`,
          [],
          'all',
          tx.getTransactionContext(),
        );
        for (const row of rows) {
          const identity = row.storage_uri
            ? adapter.resolvePhysicalIdentity?.(
                row.storage_uri,
                row.provider_version_id,
              )
            : undefined;
          if (!identity || identity.kind === 'UNKNOWN') {
            enriched.coverage = 'UNKNOWN';
            continue;
          }
          if (
            !targets.some(
              (target) =>
                physicalContentionKey(target) ===
                physicalContentionKey(identity),
            )
          )
            continue;
          enriched.recordIds.push(row.id, row.manifest_id);
          if (row.hold_state != null)
            enriched.objectHolds.push({
              holdState: row.hold_state,
              placedAt: row.placed_at!,
              releasedAt: row.hold_released_at,
            });
          if (row.retain_until != null)
            enriched.objectRetentionLocks.push({
              retainUntil: row.retain_until,
              releasedAt: row.lock_released_at,
            });
        }
        for (const tableName of ['object_versions', 'object_manifests']) {
          const registries = await tx.find(
            EntityRegistry,
            { schemaName: 'object_storage', tableName },
            { fields: ['id', 'stateConceptId'], refresh: true },
          );
          if (
            registries.length !== 1 ||
            registries[0].stateConceptId !== CONCEPTS.STATE_ACTIVE
          )
            enriched.coverage = 'UNKNOWN';
          else enriched.registryIds.push(registries[0].id);
        }
      }
      return this.resolve(tx, enriched, now);
    } catch {
      return { state: 'UNKNOWN', reasonCode: 'OBJECT_HOLD_LOOKUP_FAILED' };
    }
  }

  async resolve(
    tx: EntityManager,
    graph: IdentityHoldGraph,
    now: Date,
  ): Promise<IdentityHoldDecision> {
    try {
      const holds = await this.repository.findForLifecycleGraph(tx, [
        ...new Set([...graph.recordIds, ...graph.registryIds]),
      ]);
      return this.evaluate(graph, holds, now);
    } catch {
      return { state: 'UNKNOWN', reasonCode: 'HOLD_LOOKUP_FAILED' };
    }
  }

  evaluate(
    graph: IdentityHoldGraph,
    holds: Pick<
      LegalHolds,
      | 'tenantId'
      | 'targetId'
      | 'targetTypeConceptId'
      | 'statusConceptId'
      | 'startsAt'
      | 'endsAt'
    >[],
    now: Date,
  ): IdentityHoldDecision {
    const decision = (
      state: IdentityHoldDecision['state'],
      reasonCode: string,
    ): IdentityHoldDecision => ({ state, reasonCode });
    if (
      graph.coverage !== 'PROVEN' ||
      !graph.tenantId ||
      !graph.recordIds.length ||
      !graph.registryIds.length ||
      !validDate(now)
    )
      return decision('UNKNOWN', 'HOLD_COVERAGE_UNKNOWN');
    for (const until of graph.fileHoldUntil) {
      if (until == null) continue;
      if (!validDate(until))
        return decision('UNKNOWN', 'FILE_HOLD_DATE_UNKNOWN');
      if (until > now) return decision('ACTIVE', 'FILE_HOLD_ACTIVE');
    }
    for (const hold of holds) {
      if (hold.tenantId !== graph.tenantId)
        return decision('UNKNOWN', 'HOLD_TENANT_AMBIGUOUS');
      const ids =
        hold.targetTypeConceptId === SYSOPS.HOLD_TARGET_RECORD
          ? graph.recordIds
          : hold.targetTypeConceptId === SYSOPS.HOLD_TARGET_TABLE
            ? graph.registryIds
            : undefined;
      if (!ids?.includes(hold.targetId))
        return decision('UNKNOWN', 'HOLD_TARGET_UNKNOWN');
      if (hold.statusConceptId === CONCEPTS.STATE_ACTIVE)
        return decision('ACTIVE', 'LEGAL_HOLD_ACTIVE');
      if (
        hold.statusConceptId !== CONCEPTS.STATE_REVOKED ||
        !validDate(hold.startsAt) ||
        !validDate(hold.endsAt) ||
        hold.endsAt > now ||
        hold.endsAt < hold.startsAt
      )
        return decision('UNKNOWN', 'HOLD_RELEASE_UNPROVEN');
    }
    for (const hold of graph.objectHolds) {
      if (hold.holdState === 'ACTIVE')
        return decision('ACTIVE', 'OBJECT_HOLD_ACTIVE');
      if (
        hold.holdState !== 'RELEASED' ||
        !validDate(hold.placedAt) ||
        !validDate(hold.releasedAt) ||
        hold.releasedAt > now ||
        hold.releasedAt < hold.placedAt
      )
        return decision('UNKNOWN', 'OBJECT_HOLD_UNKNOWN');
    }
    for (const lock of graph.objectRetentionLocks) {
      if (!validDate(lock.retainUntil))
        return decision('UNKNOWN', 'OBJECT_RETENTION_UNKNOWN');
      if (lock.retainUntil > now)
        return decision('ACTIVE', 'OBJECT_RETENTION_ACTIVE');
      if (
        lock.releasedAt != null &&
        (!validDate(lock.releasedAt) || lock.releasedAt > now)
      )
        return decision('UNKNOWN', 'OBJECT_RETENTION_UNKNOWN');
    }
    return decision('CLEAR', 'NO_APPLICABLE_HOLD');
  }
}
