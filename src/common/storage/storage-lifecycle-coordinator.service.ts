import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { CONCEPTS } from '../constants/concepts';
import { QueuesRepository } from '../../modules/messaging/repositories/queues.repository';
import type { QueuedJobs } from '../../modules/messaging/entities/queued_jobs.entity';
import type {
  FileStorageAdapter,
  StorageDeletePermit,
  StorageDeleteReceipt,
} from './file-storage.adapter';
import {
  isStorageReservationIdentity,
  isKnownPhysicalIdentity,
  physicalContentionKey,
  physicalNamespace,
  reservationKey,
  reservationAcceptsReceipt,
  type KnownPhysicalObjectIdentity,
  type StorageReservationIdentity,
} from './physical-object-identity';
import {
  assertDestructiveRuntimeAuthorized,
  intentExcludesPublication,
  readStorageIntent,
  StorageLifecycleDenied,
  type StorageIntent,
} from './storage-lifecycle.protocol';

export interface PublicationReservation {
  operationId: string;
  ownerToken: string;
  identity: StorageReservationIdentity;
}

export interface BeginPublication extends PublicationReservation {
  queueCode: string;
  tenantId: string;
  producer: string;
  targetId: string;
  contentHash: string;
  sizeBytes: number;
}

/** Queued jobs are durable intents; PostgreSQL, not runTick's mutex, excludes peers. */
@Injectable()
export class StorageLifecycleCoordinator {
  constructor(
    private readonly em: EntityManager,
    private readonly queues: QueuesRepository,
  ) {}

  /** Call BEFORE all graph/hold/reference mutations; locks live on the caller's tx. */
  async excludeNamespaces(
    tx: EntityManager,
    identities: StorageReservationIdentity[],
  ): Promise<void> {
    if (!tx.getTransactionContext())
      throw new StorageLifecycleDenied('TRANSACTION_REQUIRED');
    await this.assertPrimaryVisibility(tx);
    const namespaces = [
      ...new Set(
        identities.map((identity) => {
          if (!isStorageReservationIdentity(identity))
            throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
          return physicalNamespace(identity);
        }),
      ),
    ].sort();
    for (const namespace of namespaces) {
      await tx
        .getConnection('write')
        .execute(
          'SELECT pg_advisory_xact_lock(hashtextextended(?, 0))',
          [namespace],
          'all',
          tx.getTransactionContext(),
        );
    }
  }

  /** No permission leaves this method until the intent transaction commits. */
  async begin(input: BeginPublication): Promise<PublicationReservation> {
    const intent: StorageIntent = {
      ...input,
      schemaVersion: 1,
      phase: 'RESERVED',
    };
    readStorageIntent(intent);
    return this.em.fork().transactional(async (tx) => {
      await this.excludeNamespaces(tx, [input.identity]);
      const prior = await this.queues.findJobByDedupeKey(
        tx,
        this.dedupe(input.operationId),
      );
      if (prior) {
        const stored = this.owned(prior, input);
        if (
          stored.contentHash !== input.contentHash ||
          stored.sizeBytes !== input.sizeBytes ||
          stored.tenantId !== input.tenantId ||
          stored.targetId !== input.targetId ||
          stored.producer !== input.producer
        )
          throw new StorageLifecycleDenied('IDEMPOTENCY_CONFLICT');
        if (stored.phase !== 'RESERVED')
          throw new StorageLifecycleDenied('OPERATION_ALREADY_DISPATCHED');
        return this.reservation(stored);
      }
      await this.assertNoContender(tx, input.identity);
      const queue = await this.queues.findQueueByCode(tx, input.queueCode);
      if (!queue || queue.stateConceptId !== CONCEPTS.STATE_ACTIVE)
        throw new StorageLifecycleDenied('QUEUE_CONFIGURATION_MISSING');
      this.queues.createJob(tx, {
        queueId: queue.id,
        tenantId: input.tenantId,
        jobType: 'storage.publish',
        dedupeKey: this.dedupe(input.operationId),
        priority: 5,
        payloadJson: intent,
        statusConceptId: CONCEPTS.JOB_RUNNING,
        availableAt: new Date(),
        maxAttempts: 1,
      });
      await tx.flush();
      return this.reservation(intent);
    });
  }

  /** One committed transition grants exactly one native attempt, never an SDK retry. */
  async dispatch(reservation: PublicationReservation): Promise<string> {
    return this.change(reservation, async (_tx, job, intent) => {
      if (intent.phase !== 'RESERVED')
        throw new StorageLifecycleDenied('DISPATCH_REPLAY');
      const ioAttemptId = randomUUID();
      job.payloadJson = { ...intent, phase: 'STORE_DISPATCHED', ioAttemptId };
      return ioAttemptId;
    });
  }

  /** Only the adapter's definitive response settles this exact attempt. */
  async settle(
    reservation: PublicationReservation,
    ioAttemptId: string,
    receipt: {
      identity: KnownPhysicalObjectIdentity;
      contentHash: string;
      sizeBytes: number;
    },
  ): Promise<void> {
    await this.change(reservation, async (_tx, job, intent) => {
      if (
        intent.ioAttemptId !== ioAttemptId ||
        !['STORE_DISPATCHED', 'STORED'].includes(intent.phase)
      )
        throw new StorageLifecycleDenied('SETTLEMENT_UNKNOWN');
      if (
        !reservationAcceptsReceipt(intent.identity, receipt.identity) ||
        (intent.storedIdentity &&
          reservationKey(intent.storedIdentity) !==
            reservationKey(receipt.identity)) ||
        receipt.contentHash !== intent.contentHash ||
        receipt.sizeBytes !== intent.sizeBytes ||
        receipt.identity.bindingRevision !== intent.identity.bindingRevision
      )
        throw new StorageLifecycleDenied('STORE_RECEIPT_MISMATCH');
      job.payloadJson = {
        ...intent,
        phase: 'STORED',
        settledAttemptId: ioAttemptId,
        storedIdentity: receipt.identity,
      };
    });
  }

  /** A settled PRESENT object is referenced without issuing another PUT. */
  async reuse(
    reservation: PublicationReservation,
    receipt: {
      identity: KnownPhysicalObjectIdentity;
      contentHash: string;
      sizeBytes: number;
    },
  ): Promise<void> {
    await this.change(reservation, async (_tx, job, intent) => {
      if (
        intent.phase !== 'RESERVED' ||
        !reservationAcceptsReceipt(intent.identity, receipt.identity) ||
        receipt.contentHash !== intent.contentHash ||
        receipt.sizeBytes !== intent.sizeBytes
      )
        throw new StorageLifecycleDenied('PRESENT_OBJECT_UNPROVEN');
      const proofId = randomUUID();
      job.payloadJson = {
        ...intent,
        phase: 'STORED',
        referenceOnly: true,
        ioAttemptId: proofId,
        settledAttemptId: proofId,
        storedIdentity: receipt.identity,
      };
    });
  }

  /** Join an already-owned domain transaction (anonymous claim/audio finalize). */
  async commitInTransaction<T>(
    tx: EntityManager,
    reservation: PublicationReservation,
    publish: (tx: EntityManager, intent: StorageIntent) => Promise<T>,
  ): Promise<T> {
    await this.excludeNamespaces(tx, [reservation.identity]);
    const job = await this.queues.findJobByDedupeKey(
      tx,
      this.dedupe(reservation.operationId),
    );
    if (!job) throw new StorageLifecycleDenied('RESERVATION_MISSING');
    const intent = this.owned(job, reservation);
    if (intent.phase !== 'STORED')
      throw new StorageLifecycleDenied('STORE_NOT_SETTLED');
    await this.assertNoContender(tx, intent.identity, intent.operationId);
    const result = await publish(tx, intent);
    job.payloadJson = { ...intent, phase: 'COMMITTED' };
    job.resultJson = { targetId: intent.targetId };
    job.statusConceptId = CONCEPTS.JOB_SUCCEEDED;
    job.completedAt = new Date();
    await tx.flush();
    return result;
  }

  /** Metadata and COMMITTED flush in ONE transaction; callback must use this tx. */
  async commit<T>(
    reservation: PublicationReservation,
    publish: (tx: EntityManager) => Promise<T>,
  ): Promise<{ targetId: string; duplicate: boolean; result?: T }> {
    return this.change(reservation, async (tx, job, intent) => {
      if (intent.phase === 'COMMITTED')
        return { targetId: intent.targetId, duplicate: true };
      if (intent.phase !== 'STORED')
        throw new StorageLifecycleDenied('STORE_NOT_SETTLED');
      await this.assertNoContender(tx, intent.identity, intent.operationId);
      const result = await publish(tx);
      job.payloadJson = { ...intent, phase: 'COMMITTED' };
      // Store only a technical publication receipt, never a DTO containing PII.
      job.resultJson = { targetId: intent.targetId };
      job.statusConceptId = CONCEPTS.JOB_SUCCEEDED;
      job.completedAt = new Date();
      return { targetId: intent.targetId, duplicate: false, result };
    });
  }

  async abort(reservation: PublicationReservation): Promise<void> {
    await this.change(reservation, async (_tx, job, intent) => {
      if (['COMMITTED', 'PURGED', 'ABORTED'].includes(intent.phase)) return;
      job.payloadJson = {
        ...intent,
        phase: intent.phase === 'RESERVED' ? 'ABORTED' : 'UNKNOWN',
      };
    });
  }

  /** Recovery is quarantine only. No TTL, retry count, HEAD or 404 clears uncertainty. */
  async recover(): Promise<{ inspected: number; quarantined: number }> {
    const jobs = await this.em.fork().transactional(async (tx) => {
      await this.assertPrimaryVisibility(tx);
      return this.queues.findStorageIntents(tx);
    });
    let quarantined = 0;
    for (const job of jobs) {
      const intent = this.readJob(job);
      const stamp = job.updatedAt ?? job.createdAt;
      const stale =
        (job.lockExpiresAt instanceof Date &&
          job.lockExpiresAt.getTime() <= Date.now()) ||
        (stamp instanceof Date && Date.now() - stamp.getTime() >= 300_000);
      if (
        stale &&
        ['STORE_DISPATCHED', 'DELETE_DISPATCHED'].includes(intent.phase)
      ) {
        await this.em.fork().transactional(async (tx) => {
          await this.excludeNamespaces(tx, [intent.identity]);
          const current = await this.queues.findJobByDedupeKey(
            tx,
            this.dedupe(intent.operationId),
          );
          if (!current) throw new StorageLifecycleDenied('RESERVATION_MISSING');
          const latest = this.readJob(current);
          if (
            ['STORE_DISPATCHED', 'DELETE_DISPATCHED'].includes(latest.phase)
          ) {
            current.payloadJson = { ...latest, phase: 'UNKNOWN' };
            await tx.flush();
            quarantined++;
          }
        });
      }
    }
    return { inspected: jobs.length, quarantined };
  }

  async assertNoContender(
    tx: EntityManager,
    identity: StorageReservationIdentity,
    exceptOperationId?: string,
  ): Promise<void> {
    for (const job of await this.queues.findStorageIntents(tx)) {
      const intent = this.readJob(job);
      if (
        intent.operationId === exceptOperationId &&
        job.jobType === 'storage.publish'
      )
        continue;
      if (
        physicalContentionKey(intent.identity) ===
          physicalContentionKey(identity) &&
        intentExcludesPublication(intent)
      )
        throw new StorageLifecycleDenied('PRODUCER_OR_PURGE_IN_FLIGHT');
    }
  }

  /** References/holds with an opaque locator cannot pass an unresolved purge. */
  async assertNoPendingPurge(tx: EntityManager): Promise<void> {
    for (const job of await this.queues.findStorageIntents(tx)) {
      const intent = this.readJob(job);
      if (job.jobType === 'storage.purge' && intent.phase !== 'PURGED')
        throw new StorageLifecycleDenied('PURGE_IN_FLIGHT');
    }
  }

  async inspectReservation(
    reservation: PublicationReservation,
  ): Promise<StorageIntent> {
    return this.change(reservation, async (_tx, _job, intent) => intent);
  }

  async assertSettledReference(
    tx: EntityManager,
    reservation: PublicationReservation,
    identity: KnownPhysicalObjectIdentity,
  ): Promise<void> {
    const job = await this.queues.findJobByDedupeKey(
      tx,
      this.dedupe(reservation.operationId),
    );
    if (!job) throw new StorageLifecycleDenied('RESERVATION_MISSING');
    const intent = this.owned(job, reservation);
    if (
      intent.phase !== 'STORED' ||
      !intent.storedIdentity ||
      reservationKey(intent.storedIdentity) !== reservationKey(identity) ||
      intent.storedIdentity.bindingRevision !== identity.bindingRevision
    )
      throw new StorageLifecycleDenied('PUBLICATION_IDENTITY_CHANGED');
  }

  /** Metadata retirement and durable purge intent share this caller transaction.
   * This phase is intentionally unreachable while the destructive runtime gate is blocked. */
  async preparePurgeRetirement(
    tx: EntityManager,
    input: BeginPublication & {
      purgeContext: NonNullable<StorageIntent['purgeContext']>;
    },
  ): Promise<void> {
    assertDestructiveRuntimeAuthorized(input.targetId);
    if (!isKnownPhysicalIdentity(input.identity))
      throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
    await this.excludeNamespaces(tx, [input.identity]);
    await this.assertNoContender(tx, input.identity);
    if (
      await this.queues.findJobByDedupeKey(tx, this.dedupe(input.operationId))
    )
      throw new StorageLifecycleDenied('PURGE_OPERATION_ALREADY_PRESENT');
    const queue = await this.queues.findQueueByCode(tx, input.queueCode);
    if (!queue || queue.stateConceptId !== CONCEPTS.STATE_ACTIVE)
      throw new StorageLifecycleDenied('QUEUE_CONFIGURATION_MISSING');
    const intent: StorageIntent = {
      ...input,
      schemaVersion: 1,
      phase: 'PURGE_PREPARED',
    };
    readStorageIntent(intent);
    this.queues.createJob(tx, {
      queueId: queue.id,
      tenantId: input.tenantId,
      jobType: 'storage.purge',
      dedupeKey: this.dedupe(input.operationId),
      payloadJson: intent,
      statusConceptId: CONCEPTS.JOB_RUNNING,
      priority: 5,
      maxAttempts: 1,
      availableAt: new Date(),
    });
    await tx.flush();
  }

  async pendingPurges(): Promise<StorageIntent[]> {
    return this.em.fork().transactional(async (tx) => {
      await this.assertPrimaryVisibility(tx);
      return (await this.queues.findStorageIntents(tx))
        .filter((job) => job.jobType === 'storage.purge')
        .map((job) => this.readJob(job))
        .filter((intent) => intent.phase !== 'PURGED');
    });
  }

  async reviewPurge<T>(
    candidate: StorageIntent,
    review: (tx: EntityManager, intent: StorageIntent) => Promise<T>,
  ): Promise<T> {
    return this.em.fork().transactional(async (tx) => {
      await this.excludeNamespaces(tx, [candidate.identity]);
      const job = await this.queues.findJobByDedupeKey(
        tx,
        this.dedupe(candidate.operationId),
      );
      if (!job || job.jobType !== 'storage.purge')
        throw new StorageLifecycleDenied('PURGE_INTENT_UNKNOWN');
      const current = this.readJob(job);
      if (
        reservationKey(current.identity) !==
          reservationKey(candidate.identity) ||
        current.identity.bindingRevision !== candidate.identity.bindingRevision
      )
        throw new StorageLifecycleDenied('PURGE_IDENTITY_CHANGED');
      if (current.phase !== 'PURGE_PREPARED')
        throw new StorageLifecycleDenied('PURGE_COMPLETION_UNKNOWN');
      for (const peer of await this.queues.findStorageIntents(tx)) {
        const other = this.readJob(peer);
        if (peer.id === job.id) continue;
        if (
          physicalContentionKey(other.identity) ===
            physicalContentionKey(current.identity) &&
          intentExcludesPublication(other)
        )
          throw new StorageLifecycleDenied('PRODUCER_OR_PURGE_IN_FLIGHT');
      }
      return review(tx, current);
    });
  }

  /** Two commits are essential: a rollback after native I/O must leave a durable
   * DELETE_DISPATCHED intent, never revive PURGE_PREPARED. All guards run again
   * under the namespace lock immediately before the one-use native dispatch. */
  async dispatchPurge(
    candidate: StorageIntent,
    validate: (tx: EntityManager, intent: StorageIntent) => Promise<void>,
    storage: FileStorageAdapter,
    recordCompletion: (
      tx: EntityManager,
      intent: StorageIntent,
    ) => Promise<void>,
  ): Promise<'PURGED' | 'NOT_DELETED' | 'UNKNOWN'> {
    const dispatched = await this.reviewPurge(candidate, async (tx, intent) => {
      await validate(tx, intent);
      this.assertPurgeRuntime(intent.targetId);
      const job = await this.queues.findJobByDedupeKey(
        tx,
        this.dedupe(intent.operationId),
      );
      if (!job) throw new StorageLifecycleDenied('PURGE_INTENT_UNKNOWN');
      const next: StorageIntent = {
        ...intent,
        phase: 'DELETE_DISPATCHED',
        ioAttemptId: randomUUID(),
        settledAttemptId: undefined,
        deleteOutcome: undefined,
      };
      job.payloadJson = next;
      // JSONB drops undefined keys. Use the actual persisted representation.
      delete next.settledAttemptId;
      delete next.deleteOutcome;
      job.resultJson = undefined;
      job.updatedAt = new Date();
      await tx.flush();
      return structuredClone(next);
    });
    // Failure/ambiguous commit above grants NO native attempt. A retry sees the
    // durable phase if that commit actually succeeded, and fails closed.
    try {
      return await this.em.fork().transactional(async (tx) => {
        await this.excludeNamespaces(tx, [dispatched.identity]);
        const job = await this.queues.findJobByDedupeKey(
          tx,
          this.dedupe(dispatched.operationId),
        );
        if (!job || job.jobType !== 'storage.purge')
          throw new StorageLifecycleDenied('PURGE_INTENT_UNKNOWN');
        const intent = this.readJob(job);
        if (
          intent.phase !== 'DELETE_DISPATCHED' ||
          intent.ioAttemptId !== dispatched.ioAttemptId ||
          !isDeepStrictEqual(
            JSON.parse(JSON.stringify(intent)),
            JSON.parse(JSON.stringify(dispatched)),
          )
        )
          throw new StorageLifecycleDenied('DELETE_ATTEMPT_CHANGED');
        for (const peer of await this.queues.findStorageIntents(tx)) {
          if (peer.id === job.id) continue;
          const other = this.readJob(peer);
          if (
            physicalContentionKey(other.identity) ===
              physicalContentionKey(intent.identity) &&
            intentExcludesPublication(other)
          )
            throw new StorageLifecycleDenied('PRODUCER_OR_PURGE_IN_FLIGHT');
        }
        await validate(tx, intent);
        this.assertPurgeRuntime(intent.targetId);
        if (!isKnownPhysicalIdentity(intent.identity) || !intent.purgeContext)
          throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
        const identity = Object.freeze({
          ...intent.identity,
          versionSelector: Object.freeze({
            ...intent.identity.versionSelector,
          }),
        });
        let consumed = false;
        let active = true;
        const permit: StorageDeletePermit = {
          identity,
          ioAttemptId: intent.ioAttemptId!,
          consume: (actual) => {
            // Inspection can await remote/native state. Recheck the scoped
            // authorization at the last synchronous point before native I/O.
            this.assertPurgeRuntime(intent.targetId);
            if (
              !active ||
              consumed ||
              !isKnownPhysicalIdentity(actual) ||
              reservationKey(actual) !== reservationKey(identity) ||
              actual.bindingRevision !== identity.bindingRevision
            )
              throw new StorageLifecycleDenied('DELETE_PERMIT_INVALID');
            consumed = true;
          },
        };
        let timer: ReturnType<typeof setTimeout> | undefined;
        let receipt: StorageDeleteReceipt | void;
        try {
          receipt = await Promise.race([
            storage.delete(intent.purgeContext.storageUri, permit),
            new Promise<never>((_resolve, reject) => {
              timer = setTimeout(
                () =>
                  reject(new StorageLifecycleDenied('DELETE_RESULT_TIMEOUT')),
                30_000,
              );
            }),
          ]);
        } catch {
          receipt = undefined;
        } finally {
          active = false;
          clearTimeout(timer);
        }
        const verified =
          consumed &&
          receipt &&
          receipt.ioAttemptId === intent.ioAttemptId &&
          isKnownPhysicalIdentity(receipt.identity) &&
          reservationKey(receipt.identity) === reservationKey(identity) &&
          receipt.identity.bindingRevision === identity.bindingRevision;
        const outcome =
          verified &&
          receipt &&
          (receipt.state === 'DELETED' || receipt.state === 'NOT_DELETED')
            ? receipt.state
            : 'UNKNOWN';
        job.payloadJson = {
          ...intent,
          phase:
            outcome === 'DELETED'
              ? 'PURGED'
              : outcome === 'NOT_DELETED'
                ? 'PURGE_PREPARED'
                : 'UNKNOWN',
          deleteOutcome: outcome,
          settledAttemptId:
            outcome === 'UNKNOWN' ? undefined : intent.ioAttemptId,
        };
        job.resultJson = {
          schemaVersion: 1,
          operation: 'PURGE',
          outcome,
          ioAttemptId: intent.ioAttemptId,
          contractDigest: intent.purgeContext.contractDigest,
        };
        job.updatedAt = new Date();
        if (outcome === 'DELETED') {
          await recordCompletion(tx, intent);
          job.statusConceptId = CONCEPTS.JOB_SUCCEEDED;
          job.completedAt = new Date();
        } else if (outcome === 'UNKNOWN') {
          job.statusConceptId = CONCEPTS.JOB_DEAD_LETTER;
        }
        await tx.flush();
        return outcome === 'DELETED' ? 'PURGED' : outcome;
      });
    } catch {
      // A commit/receipt failure cannot certify success. Recovery also covers a
      // process crash here. Do not retry I/O or infer completion from HEAD/404.
      await this.em.fork().transactional(async (tx) => {
        await this.excludeNamespaces(tx, [dispatched.identity]);
        const job = await this.queues.findJobByDedupeKey(
          tx,
          this.dedupe(dispatched.operationId),
        );
        if (!job) throw new StorageLifecycleDenied('PURGE_INTENT_UNKNOWN');
        const intent = this.readJob(job);
        if (
          intent.phase === 'DELETE_DISPATCHED' &&
          intent.ioAttemptId === dispatched.ioAttemptId
        ) {
          job.payloadJson = {
            ...intent,
            phase: 'UNKNOWN',
            deleteOutcome: 'UNKNOWN',
          };
          job.statusConceptId = CONCEPTS.JOB_DEAD_LETTER;
          job.updatedAt = new Date();
          await tx.flush();
        }
      });
      return 'UNKNOWN';
    }
  }

  /** Gate is before metadata retirement as well as before physical I/O. */
  assertPurgeRuntime(this: void, targetId?: string): void {
    return assertDestructiveRuntimeAuthorized(targetId);
  }

  private async change<T>(
    reservation: PublicationReservation,
    action: (
      tx: EntityManager,
      job: QueuedJobs,
      intent: StorageIntent,
    ) => Promise<T>,
  ): Promise<T> {
    return this.em.fork().transactional(async (tx) => {
      await this.excludeNamespaces(tx, [reservation.identity]);
      const job = await this.queues.findJobByDedupeKey(
        tx,
        this.dedupe(reservation.operationId),
      );
      if (!job) throw new StorageLifecycleDenied('RESERVATION_MISSING');
      const result = await action(tx, job, this.owned(job, reservation));
      job.updatedAt = new Date();
      await tx.flush();
      return result;
    });
  }

  private owned(
    job: QueuedJobs,
    reservation: PublicationReservation,
  ): StorageIntent {
    const intent = this.readJob(job);
    if (
      job.jobType !== 'storage.publish' ||
      intent.operationId !== reservation.operationId ||
      intent.ownerToken !== reservation.ownerToken ||
      reservationKey(intent.identity) !==
        reservationKey(reservation.identity) ||
      intent.identity.bindingRevision !== reservation.identity.bindingRevision
    )
      throw new StorageLifecycleDenied('RESERVATION_OWNER_MISMATCH');
    return intent;
  }

  private readJob(job: QueuedJobs): StorageIntent {
    const intent = readStorageIntent(job.payloadJson);
    const allowed =
      job.jobType === 'storage.publish'
        ? [
            'RESERVED',
            'STORE_DISPATCHED',
            'STORED',
            'COMMITTED',
            'ABORTED',
            'UNKNOWN',
          ]
        : job.jobType === 'storage.purge'
          ? ['PURGE_PREPARED', 'DELETE_DISPATCHED', 'PURGED', 'UNKNOWN']
          : [];
    if (
      !allowed.includes(intent.phase) ||
      (job.jobType === 'storage.purge' &&
        !isKnownPhysicalIdentity(intent.identity)) ||
      job.tenantId !== intent.tenantId ||
      job.dedupeKey !== this.dedupe(intent.operationId)
    )
      throw new StorageLifecycleDenied('INTENT_ENVELOPE_UNKNOWN');
    return intent;
  }

  private async assertPrimaryVisibility(tx: EntityManager): Promise<void> {
    if (!tx.getTransactionContext())
      throw new StorageLifecycleDenied('TRANSACTION_REQUIRED');
    const rows = await tx.getConnection('write').execute<
      {
        primary: boolean;
        global_visibility: boolean;
      }[]
    >('SELECT NOT pg_is_in_recovery() AS primary, (rolsuper OR rolbypassrls) AS global_visibility FROM pg_roles WHERE rolname = current_user', [], 'all', tx.getTransactionContext());
    if (
      rows.length !== 1 ||
      rows[0].primary !== true ||
      rows[0].global_visibility !== true
    )
      throw new StorageLifecycleDenied(
        'GLOBAL_RESERVATION_VISIBILITY_UNPROVEN',
      );
  }

  private reservation(intent: StorageIntent): PublicationReservation {
    return {
      operationId: intent.operationId,
      ownerToken: intent.ownerToken,
      identity: intent.identity,
    };
  }

  private dedupe(operationId: string): string {
    return `storage-lifecycle:v1:${createHash('sha256').update(operationId).digest('hex')}`;
  }
}
