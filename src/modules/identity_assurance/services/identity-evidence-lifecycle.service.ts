import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
} from '../../../common/storage/file-storage.adapter';
import { StoragePublicationService } from '../../../common/storage/storage-publication.service';
import { StorageLifecycleCoordinator } from '../../../common/storage/storage-lifecycle-coordinator.service';
import { StorageReferenceRepository } from '../../../common/storage/storage-reference.repository';
import { StorageReferenceResolver } from '../../../common/storage/storage-reference-resolver.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import {
  isKnownPhysicalIdentity,
  physicalObjectKey,
  type KnownPhysicalObjectIdentity,
} from '../../../common/storage/physical-object-identity';
import { IdentityEvidenceHoldResolver } from '../../system_ops/services/identity-evidence-hold-resolver.service';
import {
  IdentityLifecycleConfigResolver,
  type IdentityDisposition,
  type IdentityLifecycleRule,
} from '../identity-evidence-lifecycle.config';
import { IdentityEvidenceLifecycleRepository } from '../repositories/identity-evidence-lifecycle.repository';
import { IdentityEvidenceEligibilityService } from './identity-evidence-eligibility.service';
import {
  IdentityEvidenceDispositionExecutor,
  type IdentityDispositionOutcome,
} from './identity-evidence-disposition.executor';
import { IdentityEvidenceRecords } from '../entities/identity_evidence_records.entity';
import { CatalogConcepts } from '../../terminology/entities/catalog_concepts.entity';

@Injectable()
export class IdentityEvidenceLifecycleService {
  constructor(
    private readonly em: EntityManager,
    private readonly config: IdentityLifecycleConfigResolver,
    private readonly repository: IdentityEvidenceLifecycleRepository,
    private readonly eligibility: IdentityEvidenceEligibilityService,
    private readonly holds: IdentityEvidenceHoldResolver,
    private readonly publication: StoragePublicationService,
    private readonly coordinator: StorageLifecycleCoordinator,
    private readonly references: StorageReferenceRepository,
    private readonly referenceResolver: StorageReferenceResolver,
    private readonly executor: IdentityEvidenceDispositionExecutor,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
  ) {}

  async execute(
    evidenceId: string,
    tenantId: string,
    evidenceTypeCode: string,
    operation: IdentityDisposition,
    now = new Date(),
  ): Promise<IdentityDispositionOutcome> {
    try {
      return await this.em.fork().transactional(async (tx) => {
        const config = await this.config.resolve(
          tx,
          tenantId,
          evidenceTypeCode,
          operation,
        );
        await this.publication.lockNamespace(tx);
        await this.coordinator.excludeNamespaces(tx, []); // Primary/global visibility even without a binary.
        await tx
          .getConnection('write')
          .execute(
            'SELECT pg_advisory_xact_lock(hashtextextended(?, 0))',
            [`identity-evidence-lifecycle:v1:${evidenceId}`],
            'all',
            tx.getTransactionContext(),
          );
        const graph = await this.repository.graph(
          tx,
          evidenceId,
          tenantId,
          now,
        );
        if (graph.opaqueReference)
          throw new StorageLifecycleDenied('EXTERNAL_REFERENCE_UNKNOWN');
        const identities: KnownPhysicalObjectIdentity[] = [];
        const contentByIdentity = new Map<string, string>();
        for (const version of graph.versions) {
          const identity = this.storage.resolvePhysicalIdentity?.(
            version.storageUri,
            version.objectVersion,
          );
          if (!isKnownPhysicalIdentity(identity))
            throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
          if (
            (version.objectKey &&
              version.objectKey !== identity.exactObjectKey) ||
            (version.bucketOrContainer &&
              version.bucketOrContainer !== identity.physicalContainer)
          )
            throw new StorageLifecycleDenied('PHYSICAL_METADATA_CONFLICT');
          const key = physicalObjectKey(identity);
          const content = JSON.stringify([
            version.contentHash,
            version.sizeBytes,
          ]);
          if (
            contentByIdentity.has(key) &&
            contentByIdentity.get(key) !== content
          )
            throw new StorageLifecycleDenied('PHYSICAL_METADATA_CONFLICT');
          contentByIdentity.set(key, content);
          await this.coordinator.assertNoContender(tx, identity);
          if (
            !identities.some(
              (item) => physicalObjectKey(item) === physicalObjectKey(identity),
            )
          )
            identities.push(identity);
        }
        const hold = await this.holds.resolveWithObjects(
          tx,
          {
            tenantId,
            recordIds: graph.recordIds,
            registryIds: graph.registryIds,
            fileHoldUntil: graph.files.map((file) => file.legalHoldUntil),
            objectHolds: [],
            objectRetentionLocks: [],
            coverage: graph.holdCoverage,
          },
          identities,
          this.storage,
          now,
        );
        let references: 'CLEAR' | 'BLOCKED' | 'UNKNOWN' =
          graph.externalReferenceCount > 0 ? 'BLOCKED' : 'CLEAR';
        if (identities.length) {
          const snapshot = await this.references.snapshot(tx, [], []);
          const targetVersionIds = new Set(
            graph.versions.map((version) => version.id),
          );
          // Planning only. These rows STILL count until retirement is committed.
          const outside = {
            ...snapshot,
            rows: snapshot.rows.filter(
              (row) =>
                row.source !== 'common.file_versions' ||
                !targetVersionIds.has(row.id),
            ),
          };
          for (const identity of identities) {
            const decision = this.referenceResolver.evaluate(identity, outside);
            if (decision.state === 'UNKNOWN') references = 'UNKNOWN';
            else if (
              decision.state === 'REFERENCED' &&
              references !== 'UNKNOWN'
            )
              references = 'BLOCKED';
          }
        }
        const result = this.eligibility.evaluate(config, {
          tenantId,
          ownerResolved: graph.ownerResolved,
          evidence: graph.evidence,
          case: graph.case,
          hold: hold.state,
          references,
          now,
        });
        if (!result.eligible)
          return { status: 'DENIED', reasonCode: result.reasonCode };
        return this.executor.execute(tx, {
          operation,
          graph,
          config,
          identities,
          eligibleAt: result.eligibleAt,
        });
      });
    } catch (error) {
      return {
        status: 'DENIED',
        reasonCode:
          error instanceof StorageLifecycleDenied
            ? error.reasonCode
            : 'LIFECYCLE_STATE_UNKNOWN',
      };
    }
  }

  /** Bounded keyset scan; disabled config does not query evidence or enqueue work. */
  async scan(
    cursor?: string,
    policyCode?: string,
  ): Promise<{
    scanned: number;
    retained: number;
    denied: number;
    boundary: number;
    nextCursor?: string;
  }> {
    const rules = this.config
      .configuredRules()
      .filter((rule) => !policyCode || rule.retentionPolicyCode === policyCode);
    const counts = { scanned: 0, retained: 0, denied: 0, boundary: 0 };
    if (!rules.length) return counts;
    const em = this.em.fork();
    const concepts = await em.find(
      CatalogConcepts,
      {
        code: {
          $in: [...new Set(rules.map((rule) => rule.evidenceTypeConceptCode))],
        },
      },
      { fields: ['id', 'code'] },
    );
    const records = await em.find(
      IdentityEvidenceRecords,
      {
        evidenceTypeConceptId: { $in: concepts.map((concept) => concept.id) },
        ...(cursor ? { id: { $gt: cursor } } : {}),
      },
      {
        fields: ['id', 'evidenceTypeConceptId'],
        orderBy: { id: 'ASC' },
        limit: 100,
      },
    );
    for (const evidence of records) {
      const type = concepts.find(
        (concept) => concept.id === evidence.evidenceTypeConceptId,
      )?.code;
      for (const rule of rules.filter(
        (rule) => rule.evidenceTypeConceptCode === type,
      )) {
        const outcome = await this.executeRule(evidence.id, rule);
        counts.scanned++;
        if (outcome.status === 'RETAINED' || outcome.status === 'DUPLICATE')
          counts.retained++;
        else if (outcome.status === 'DESTRUCTIVE_BOUNDARY') counts.boundary++;
        else counts.denied++;
      }
    }
    return {
      ...counts,
      ...(records.length === 100
        ? { nextCursor: records[records.length - 1].id }
        : {}),
    };
  }
  private executeRule(evidenceId: string, rule: IdentityLifecycleRule) {
    return this.execute(
      evidenceId,
      rule.tenantId,
      rule.evidenceTypeConceptCode,
      rule.operation,
    );
  }
}
