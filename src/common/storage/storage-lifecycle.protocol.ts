import {
  isKnownPhysicalIdentity,
  isStorageReservationIdentity,
  type StorageReservationIdentity,
  type KnownPhysicalObjectIdentity,
} from './physical-object-identity';
import { AsyncLocalStorage } from 'node:async_hooks';

export const STORAGE_JOB_TYPES = ['storage.publish', 'storage.purge'] as const;
export type StorageJobType = (typeof STORAGE_JOB_TYPES)[number];
export const STORAGE_PHASES = [
  'RESERVED',
  'STORE_DISPATCHED',
  'STORED',
  'COMMITTED',
  'ABORTED',
  'PURGE_PREPARED',
  'DELETE_DISPATCHED',
  'PURGED',
  'UNKNOWN',
] as const;
export type StoragePhase = (typeof STORAGE_PHASES)[number];

/** Security state lives in the existing queued_jobs JSON, not its delivery status. */
export interface StorageIntent {
  schemaVersion: 1;
  operationId: string;
  ownerToken: string;
  identity: StorageReservationIdentity;
  storedIdentity?: KnownPhysicalObjectIdentity;
  referenceOnly?: boolean;
  producer: string;
  tenantId: string;
  targetId: string;
  contentHash: string;
  sizeBytes: number;
  phase: StoragePhase;
  ioAttemptId?: string;
  settledAttemptId?: string;
  /** Definitive non-deletion permits a fresh, fully guarded attempt; UNKNOWN never does. */
  deleteOutcome?: 'DELETED' | 'NOT_DELETED' | 'UNKNOWN';
  /** Server-derived technical proof retained while metadata retirement is unresolved. */
  purgeContext?: {
    storageUri: string;
    eligibleAt: string;
    contractDigest: string;
    caseId: string;
    subjectId: string;
    evidenceTypeCode: string;
    configRevision: string;
    authorizationRevision: string;
    fileIds: string[];
    versionIds: string[];
    recordIds: string[];
    registryIds: string[];
  };
}

export function isStorageJobType(value: string): value is StorageJobType {
  return (STORAGE_JOB_TYPES as readonly string[]).includes(value);
}

export class StorageLifecycleDenied extends Error {
  constructor(readonly reasonCode: string) {
    super(reasonCode);
    this.name = 'StorageLifecycleDenied';
  }
}

/** Unknown/old/forged payloads cannot be silently removed from a safety scan. */
export function readStorageIntent(value: unknown): StorageIntent {
  if (!value || typeof value !== 'object')
    throw new StorageLifecycleDenied('INTENT_UNKNOWN');
  const v = value as Partial<StorageIntent>;
  if (
    v.schemaVersion !== 1 ||
    !isStorageReservationIdentity(v.identity) ||
    ![v.operationId, v.ownerToken, v.producer, v.tenantId, v.targetId].every(
      (item) => typeof item === 'string' && item.length > 0,
    ) ||
    !/^[0-9a-f]{64}$/.test(v.contentHash ?? '') ||
    !Number.isSafeInteger(v.sizeBytes) ||
    (v.sizeBytes ?? -1) < 0 ||
    !(STORAGE_PHASES as readonly unknown[]).includes(v.phase)
  )
    throw new StorageLifecycleDenied('INTENT_UNKNOWN');
  if (
    [
      'STORE_DISPATCHED',
      'STORED',
      'COMMITTED',
      'DELETE_DISPATCHED',
      'PURGED',
    ].includes(v.phase!) &&
    (typeof v.ioAttemptId !== 'string' || !v.ioAttemptId)
  )
    throw new StorageLifecycleDenied('ATTEMPT_UNKNOWN');
  if (
    ['STORED', 'COMMITTED', 'PURGED'].includes(v.phase!) &&
    v.settledAttemptId !== v.ioAttemptId
  )
    throw new StorageLifecycleDenied('SETTLEMENT_UNKNOWN');
  if (
    ['STORED', 'COMMITTED'].includes(v.phase!) &&
    !isKnownPhysicalIdentity(v.storedIdentity)
  )
    throw new StorageLifecycleDenied('STORED_IDENTITY_UNKNOWN');
  if (v.phase === 'PURGED' && v.deleteOutcome !== 'DELETED')
    throw new StorageLifecycleDenied('DELETE_RECEIPT_UNKNOWN');
  return v as StorageIntent;
}

/** TTL, queue retries and a fresh HEAD/404 do not settle a dispatched mutation. */
export function intentExcludesPublication(intent: StorageIntent): boolean {
  return !['COMMITTED', 'ABORTED', 'PURGED'].includes(intent.phase);
}

/** Not accepted from any HTTP DTO or queue payload. Only the separately approved
 * local E2E runner can install a scoped grant after checking the real stack.
 * Environment flags alone never grant destruction; normal API/worker boot stays closed. */
export interface LocalSyntheticDispositionGrant {
  authorization: 'ENDER_APPROVED_7_2_SYNTHETIC_E2E';
  runId: string;
  sourceSha: string;
  diffHash: string;
  fixtureHash: string;
  expiresAt: number;
  evidenceIds: string[];
  storageUris: string[];
}
const destructiveScope = new AsyncLocalStorage<{
  grant: LocalSyntheticDispositionGrant;
  active: boolean;
  environment: string;
}>();
const grantEnvironment = () =>
  JSON.stringify(
    [
      'NODE_ENV',
      'ENVIRONMENT_CLASS',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'FILE_STORAGE_ADAPTER',
      'FILE_STORAGE_LOCAL_DIR',
      'API_RUNTIME_BASE_SHA',
      'API_RUNTIME_DIFF_HASH',
    ].map((key) => process.env[key]),
  );

/** Explicit operator capability, limited to one local run and an exact allowlist.
 * Does not grant any read/download authorization and does not dispatch anything. */
export async function withLocalSyntheticDispositionGrant<T>(
  input: LocalSyntheticDispositionGrant,
  action: () => Promise<T>,
): Promise<T> {
  const grant = structuredClone(input);
  if (
    destructiveScope.getStore() ||
    process.env.NODE_ENV !== 'test' ||
    process.env.ENVIRONMENT_CLASS !== 'LOCAL_TEST' ||
    process.env.DB_HOST !== '127.0.0.1' ||
    process.env.DB_PORT !== '55492' ||
    process.env.DB_NAME !== 'identity_evidence_7_2_test' ||
    process.env.FILE_STORAGE_ADAPTER !== 'local' ||
    !process.env.FILE_STORAGE_LOCAL_DIR?.replaceAll('\\', '/').endsWith(
      `/mantra-7.2-${grant.runId}/objects`,
    ) ||
    process.env.API_RUNTIME_BASE_SHA !== grant.sourceSha ||
    process.env.API_RUNTIME_DIFF_HASH !== grant.diffHash ||
    grant.authorization !== 'ENDER_APPROVED_7_2_SYNTHETIC_E2E' ||
    !/^07200000-0000-4000-8000-000000000001$/.test(grant.runId) ||
    !/^[a-f0-9]{40}$/.test(grant.sourceSha) ||
    !/^[a-f0-9]{64}$/.test(grant.diffHash) ||
    !/^[a-f0-9]{64}$/.test(grant.fixtureHash) ||
    !Number.isFinite(grant.expiresAt) ||
    grant.expiresAt <= Date.now() ||
    grant.expiresAt - Date.now() > 600_000 ||
    grant.evidenceIds.length !== 1 ||
    grant.evidenceIds[0] !== '07200000-0000-4000-8000-000000000301' ||
    grant.storageUris.length !== 1 ||
    grant.storageUris[0] !==
      'file://local/608be925e4325484d28391eb8f89f660cd74e298fd6320bf6f992378d31a1911'
  )
    throw new StorageLifecycleDenied('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
  const scope = { grant, active: true, environment: grantEnvironment() };
  return destructiveScope.run(scope, async () => {
    try {
      return await action();
    } finally {
      scope.active = false;
    }
  });
}

/** Target omission, a late callback, or an unrelated target always fails closed. */
export function assertDestructiveRuntimeAuthorized(target?: string): void {
  const scope = destructiveScope.getStore();
  if (
    !scope?.active ||
    scope.environment !== grantEnvironment() ||
    scope.grant.expiresAt <= Date.now() ||
    !target ||
    ![...scope.grant.evidenceIds, ...scope.grant.storageUris].includes(target)
  )
    throw new StorageLifecycleDenied('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
}
