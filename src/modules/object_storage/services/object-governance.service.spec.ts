import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ObjectGovernanceService } from './object-governance.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  CHECKSUM_VERIFICATION,
  INTEGRITY_CHECK,
  LEGAL_HOLD_STATE,
  OBJECT_LIFECYCLE,
  REPLICATION_STATE,
  RETENTION_LOCK_MODE,
} from '../constants';

const actor = { id: 'user-1', roles: ['COMPLIANCE_OFFICER'] };
const MANIFEST = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const NAMESPACE = '33333333-3333-3333-3333-333333333333';
const HOLD = '44444444-4444-4444-4444-444444444444';
const SHA = 'a'.repeat(64);

function future(): string {
  return new Date(Date.now() + 86_400_000).toISOString();
}

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const governanceRepo = {
    createRetentionLock: mockFn(() => ({ id: 'lock-1' })),
    findActiveRetentionLockForUpdate: mockFn(() => Promise.resolve(null)),
    findActiveRetentionLocks: mockFn(() => Promise.resolve([])),
    createLegalHold: mockFn(() => ({ id: HOLD })),
    findLegalHoldForUpdate: mockFn(),
    findActiveLegalHolds: mockFn(() => Promise.resolve([])),
    findActiveLegalHoldsForVersions: mockFn(() => Promise.resolve([])),
    createIntegrityCheck: mockFn(() => ({ id: 'check-1' })),
    createDeletionMarker: mockFn(() => ({ id: 'marker-1' })),
    findDeletionMarker: mockFn(() => Promise.resolve(null)),
    createArchiveManifest: mockFn(() => ({ id: 'archive-1' })),
    findArchiveManifestByHash: mockFn(() => Promise.resolve(null)),
  };
  const storageRepo = {
    findVersionById: mockFn(),
    findLatestVersion: mockFn(),
    findManifestForUpdate: mockFn(),
    findNamespaceById: mockFn(() =>
      Promise.resolve({ id: NAMESPACE, objectLockEnabled: true }),
    ),
    findChecksumForUpdate: mockFn(() => Promise.resolve(null)),
    findPrimaryLocationForUpdate: mockFn(() => Promise.resolve(null)),
    createLocation: mockFn(() => ({ id: 'location-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ObjectGovernanceService(
    em as any,
    governanceRepo,
    storageRepo as any,
    logger as any,
  );
  return { service, tx, governanceRepo, storageRepo, logger };
}

function activeManifest(overrides: Record<string, unknown> = {}): any {
  return {
    id: MANIFEST,
    namespaceId: NAMESPACE,
    lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
    ...overrides,
  };
}

describe('ObjectGovernanceService', () => {
  describe('applyRetentionLock (UC-60-07)', () => {
    function wire(d: ReturnType<typeof build>, manifest = activeManifest()) {
      d.storageRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestForUpdate.mockResolvedValue(manifest);
      return manifest;
    }

    it('applies the lock and leaves the object retained', async () => {
      const d = build();
      const manifest = wire(d);

      const res = await d.service.applyRetentionLock(VERSION, {
        lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
        retainUntil: future(),
      });

      expect(res.lifecycleState).toBe(OBJECT_LIFECYCLE.RETAINED);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.RETAINED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not downgrade an object already under legal hold', async () => {
      const d = build();
      const manifest = wire(
        d,
        activeManifest({ lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD }),
      );

      const res = await d.service.applyRetentionLock(VERSION, {
        lockMode: RETENTION_LOCK_MODE.GOVERNANCE,
        retainUntil: future(),
      });

      expect(res.lifecycleState).toBe(OBJECT_LIFECYCLE.LEGAL_HOLD);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.LEGAL_HOLD);
    });

    it('rejects a retention that ends in the past', async () => {
      const d = build();

      await expect(
        d.service.applyRetentionLock(VERSION, {
          lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
          retainUntil: '2020-01-01T00:00:00.000Z',
        } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a second active retention', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveRetentionLockForUpdate.mockResolvedValue({
        id: 'lock-prev',
        lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
      });

      await expect(
        d.service.applyRetentionLock(VERSION, {
          lockMode: RETENTION_LOCK_MODE.GOVERNANCE,
          retainUntil: future(),
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a namespace without object lock', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findNamespaceById.mockResolvedValue({
        id: NAMESPACE,
        objectLockEnabled: false,
      });

      await expect(
        d.service.applyRetentionLock(VERSION, {
          lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
          retainUntil: future(),
        } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.storageRepo.findVersionById.mockResolvedValue(null);

      await expect(
        d.service.applyRetentionLock(VERSION, {
          lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
          retainUntil: future(),
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('placeLegalHold / releaseLegalHold (UC-60-08)', () => {
    function wire(d: ReturnType<typeof build>, manifest = activeManifest()) {
      d.storageRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestForUpdate.mockResolvedValue(manifest);
      return manifest;
    }

    it('places the hold and marks the object', async () => {
      const d = build();
      const manifest = wire(d);
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([{ id: HOLD }]);

      const res = await d.service.placeLegalHold(
        VERSION,
        { legalCaseReference: 'CASO-2026-1' },
        actor,
      );

      expect(res).toMatchObject({
        holdState: LEGAL_HOLD_STATE.ACTIVE,
        lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD,
        activeHolds: 1,
      });
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.LEGAL_HOLD);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('returns the object to active when the last hold is released', async () => {
      const d = build();
      const manifest = wire(
        d,
        activeManifest({ lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD }),
      );
      d.governanceRepo.findLegalHoldForUpdate.mockResolvedValue({
        id: HOLD,
        objectVersionId: VERSION,
        holdState: LEGAL_HOLD_STATE.ACTIVE,
      });
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([{ id: HOLD }]);

      const res = await d.service.releaseLegalHold(VERSION, HOLD, actor);

      expect(res).toMatchObject({
        holdState: LEGAL_HOLD_STATE.RELEASED,
        activeHolds: 0,
      });
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.ACTIVE);
    });

    it('leaves the object retained if a retention survives the release', async () => {
      const d = build();
      const manifest = wire(
        d,
        activeManifest({ lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD }),
      );
      d.governanceRepo.findLegalHoldForUpdate.mockResolvedValue({
        id: HOLD,
        objectVersionId: VERSION,
        holdState: LEGAL_HOLD_STATE.ACTIVE,
      });
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([{ id: HOLD }]);
      d.governanceRepo.findActiveRetentionLockForUpdate.mockResolvedValue({
        id: 'lock-1',
      });

      const res = await d.service.releaseLegalHold(VERSION, HOLD, actor);

      expect(res.lifecycleState).toBe(OBJECT_LIFECYCLE.RETAINED);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.RETAINED);
    });

    it('keeps the hold state when another legal hold survives', async () => {
      const d = build();
      const manifest = wire(
        d,
        activeManifest({ lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD }),
      );
      d.governanceRepo.findLegalHoldForUpdate.mockResolvedValue({
        id: HOLD,
        objectVersionId: VERSION,
        holdState: LEGAL_HOLD_STATE.ACTIVE,
      });
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([
        { id: HOLD },
        { id: 'hold-2' },
      ]);

      const res = await d.service.releaseLegalHold(VERSION, HOLD, actor);

      expect(res.activeHolds).toBe(1);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.LEGAL_HOLD);
    });

    it('refuses releasing a hold of another version', async () => {
      const d = build();
      d.governanceRepo.findLegalHoldForUpdate.mockResolvedValue({
        id: HOLD,
        objectVersionId: 'otra-version',
        holdState: LEGAL_HOLD_STATE.ACTIVE,
      });

      await expect(
        d.service.releaseLegalHold(VERSION, HOLD, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses releasing twice', async () => {
      const d = build();
      d.governanceRepo.findLegalHoldForUpdate.mockResolvedValue({
        id: HOLD,
        objectVersionId: VERSION,
        holdState: LEGAL_HOLD_STATE.RELEASED,
      });

      await expect(
        d.service.releaseLegalHold(VERSION, HOLD, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('recordIntegrityCheck (UC-60-10)', () => {
    function wire(d: ReturnType<typeof build>) {
      const manifest = activeManifest();
      d.storageRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        objectManifestId: MANIFEST,
        sha256: SHA,
      });
      d.storageRepo.findManifestForUpdate.mockResolvedValue(manifest);
      return manifest;
    }

    it('passes when the hash matches and marks the replica verified', async () => {
      const d = build();
      const manifest = wire(d);
      const checksum: any = {};
      const location: any = {};
      d.storageRepo.findChecksumForUpdate.mockResolvedValue(checksum);
      d.storageRepo.findPrimaryLocationForUpdate.mockResolvedValue(location);

      const res = await d.service.recordIntegrityCheck(VERSION, {
        actualHash: SHA,
      });

      expect(res.status).toBe(INTEGRITY_CHECK.PASSED);
      expect(checksum.verificationStatus).toBe(CHECKSUM_VERIFICATION.VERIFIED);
      expect(location.replicationState).toBe(REPLICATION_STATE.VERIFIED);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.ACTIVE);
    });

    it('marks the object corrupt when the hash does not match', async () => {
      const d = build();
      const manifest = wire(d);
      const checksum: any = {};
      d.storageRepo.findChecksumForUpdate.mockResolvedValue(checksum);

      const res = await d.service.recordIntegrityCheck(VERSION, {
        actualHash: 'b'.repeat(64),
      });

      expect(res.status).toBe(INTEGRITY_CHECK.FAILED);
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.CORRUPT);
      expect(checksum.verificationStatus).toBe(CHECKSUM_VERIFICATION.MISMATCH);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('compares the hash case-insensitively', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordIntegrityCheck(VERSION, {
        actualHash: SHA.toUpperCase(),
      });

      expect(res.status).toBe(INTEGRITY_CHECK.PASSED);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.storageRepo.findVersionById.mockResolvedValue(null);

      await expect(
        d.service.recordIntegrityCheck(VERSION, { actualHash: SHA } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('buildArchiveJob (UC-60-11)', () => {
    const dto: any = {
      objectManifestId: MANIFEST,
      archiveType: 'cold-tier',
      archiveNamespaceId: NAMESPACE,
      manifestHash: 'hash-lote-1',
      providerUri: 'glacier://vault/obj',
    };

    function wire(d: ReturnType<typeof build>) {
      const manifest = activeManifest();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(manifest);
      d.storageRepo.findLatestVersion.mockResolvedValue({ id: VERSION });
      return manifest;
    }

    it('archives the object and adds the cold location', async () => {
      const d = build();
      const manifest = wire(d);

      const res = await d.service.buildArchiveJob(dto);

      expect(res).toMatchObject({
        id: 'archive-1',
        recordCount: '1',
        lifecycleState: OBJECT_LIFECYCLE.ARCHIVED,
        duplicate: false,
      });
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.ARCHIVED);
      expect(d.storageRepo.createLocation).toHaveBeenCalled();
    });

    it('refuses archiving a version under legal hold', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([{ id: HOLD }]);

      await expect(d.service.buildArchiveJob(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('does not archive the same batch twice', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findArchiveManifestByHash.mockResolvedValue({
        id: 'archive-prev',
        recordCount: '1',
      });

      const res = await d.service.buildArchiveJob(dto);

      expect(res).toMatchObject({ id: 'archive-prev', duplicate: true });
      expect(d.governanceRepo.createArchiveManifest).not.toHaveBeenCalled();
    });

    it('refuses archiving an object with no versions', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(activeManifest());
      d.storageRepo.findLatestVersion.mockResolvedValue(null);

      await expect(d.service.buildArchiveJob(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('requestDeletion (UC-60-12)', () => {
    const dto: any = { reason: 'solicitud de supresión del titular' };

    function wire(d: ReturnType<typeof build>) {
      const manifest = activeManifest();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(manifest);
      d.storageRepo.findLatestVersion.mockResolvedValue({ id: VERSION });
      return manifest;
    }

    it('marks the object as pending deletion', async () => {
      const d = build();
      const manifest = wire(d);

      const res = await d.service.requestDeletion(MANIFEST, dto, actor);

      expect(res).toMatchObject({
        id: 'marker-1',
        lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION,
        duplicate: false,
      });
      expect(manifest.lifecycleState).toBe(OBJECT_LIFECYCLE.PENDING_DELETION);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('aborts when a legal hold is alive', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveLegalHolds.mockResolvedValue([{ id: HOLD }]);

      await expect(
        d.service.requestDeletion(MANIFEST, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('aborts when a compliance retention has not expired', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveRetentionLockForUpdate.mockResolvedValue({
        lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
        retainUntil: new Date(Date.now() + 86_400_000),
      });

      await expect(
        d.service.requestDeletion(MANIFEST, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('allows deletion when the compliance retention already expired', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveRetentionLockForUpdate.mockResolvedValue({
        lockMode: RETENTION_LOCK_MODE.COMPLIANCE,
        retainUntil: new Date('2020-01-01T00:00:00.000Z'),
      });

      const res = await d.service.requestDeletion(MANIFEST, dto, actor);

      expect(res.lifecycleState).toBe(OBJECT_LIFECYCLE.PENDING_DELETION);
    });

    it('allows deletion under a governance retention', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findActiveRetentionLockForUpdate.mockResolvedValue({
        lockMode: RETENTION_LOCK_MODE.GOVERNANCE,
        retainUntil: new Date(Date.now() + 86_400_000),
      });

      const res = await d.service.requestDeletion(MANIFEST, dto, actor);

      expect(res.lifecycleState).toBe(OBJECT_LIFECYCLE.PENDING_DELETION);
    });

    it('does not open a second deletion request', async () => {
      const d = build();
      wire(d);
      d.governanceRepo.findDeletionMarker.mockResolvedValue({
        id: 'marker-prev',
        verificationStatus: 'pending',
      });

      const res = await d.service.requestDeletion(MANIFEST, dto, actor);

      expect(res).toMatchObject({ id: 'marker-prev', duplicate: true });
      expect(d.governanceRepo.createDeletionMarker).not.toHaveBeenCalled();
    });

    it('fails when the object does not exist', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(null);

      await expect(
        d.service.requestDeletion(MANIFEST, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
