import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SystemContextsService } from './system-contexts.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const CONTEXT = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const TYPE = '33333333-3333-3333-3333-333333333333';
const SCOPE = '44444444-4444-4444-4444-444444444444';
const CONSUMER = '55555555-5555-5555-5555-555555555555';
const CONSUMER_TYPE = '66666666-6666-6666-6666-666666666666';
const SOURCE_TYPE = '77777777-7777-7777-7777-777777777777';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  let inputSeq = 0;
  const contextRepo = {
    createContext: mockFn(() => ({ id: CONTEXT })),
    findContextById: mockFn(),
    findContextForUpdate: mockFn(),
    findContextByCode: mockFn(() => Promise.resolve(null)),
    createContextVersion: mockFn(() => ({ id: VERSION })),
    findContextVersionById: mockFn(),
    findContextVersionForUpdate: mockFn(),
    findLatestContextVersion: mockFn(() => Promise.resolve(null)),
    findActiveContextVersionForUpdate: mockFn(() => Promise.resolve(null)),
    createContextInput: mockFn(() => ({ id: `input-${++inputSeq}` })),
    findContextInputs: mockFn(() => Promise.resolve([])),
    createRefreshRun: mockFn(() => ({ id: 'run-1' })),
    findRefreshRunByKey: mockFn(() => Promise.resolve(null)),
    createContextBinding: mockFn(() => ({ id: 'binding-1' })),
    findContextBindingsForConsumer: mockFn(() => Promise.resolve([])),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SystemContextsService(
    em as any,
    contextRepo as any,
    logger as any,
  );
  return { service, tx, contextRepo, logger };
}

function activeContext(overrides: Record<string, unknown> = {}): any {
  return {
    id: CONTEXT,
    code: 'country-cl',
    statusConceptId: CONCEPTS.SYSCTX_ACTIVE,
    ...overrides,
  };
}

describe('SystemContextsService', () => {
  describe('createContext (UC-45-06)', () => {
    const dto: any = {
      code: 'country-cl',
      name: 'Contexto de Chile',
      contextTypeConceptId: TYPE,
      scopeTypeConceptId: SCOPE,
      contextJson: { currency: 'CLP' },
    };

    it('creates the context and its first version in one go', async () => {
      const d = build();

      const res = await d.service.createContext(dto, actor);

      expect(res).toMatchObject({
        id: CONTEXT,
        code: 'country-cl',
        currentVersionId: VERSION,
        statusConceptId: CONCEPTS.SYSCTX_ACTIVE,
      });
      expect(res.contentHash).toHaveLength(64);
      expect(d.contextRepo.createContextVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 1,
          statusConceptId: CONCEPTS.SYSCTX_VERSION_DRAFT,
        }),
      );
    });

    it('hashes the content regardless of key order', async () => {
      const d = build();

      const first = await d.service.createContext(dto, actor);
      const second = await d.service.createContext(
        { ...dto, contextJson: { currency: 'CLP', ...dto.contextJson } },
        actor,
      );

      expect(first.contentHash).toBe(second.contentHash);
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.contextRepo.findContextByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createContext(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('refreshContext (UC-45-07 y UC-45-08)', () => {
    const dto: any = {
      idempotencyKey: 'refresh-2026-07-20',
      trigger: 'SCHEDULED',
      contextJson: { currency: 'CLP', vat: 19 },
    };

    it('drafts a new version and snapshots its provenance', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      d.contextRepo.findLatestContextVersion.mockResolvedValue({
        versionNumber: 3,
        contentHash: 'otro-hash',
      });

      const res = await d.service.refreshContext(
        CONTEXT,
        {
          ...dto,
          inputs: [
            {
              sourceTypeConceptId: SOURCE_TYPE,
              sourceEntityName: 'tax_rates',
              required: true,
            },
          ],
        },
        actor,
      );

      expect(res).toMatchObject({
        runId: 'run-1',
        statusConceptId: CONCEPTS.REFRESH_RUN_SUCCEEDED,
        versionId: VERSION,
        versionNumber: 4,
        unchanged: false,
        inputCount: 1,
        duplicate: false,
      });
      expect(d.contextRepo.createContextInput).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ precedence: 1, required: true }),
      );
    });

    it('does not draft a version when the content did not change', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      const first = await d.service.createContext(
        {
          code: 'c',
          name: 'n',
          contextTypeConceptId: TYPE,
          scopeTypeConceptId: SCOPE,
          contextJson: dto.contextJson,
        },
        actor,
      );
      d.contextRepo.findLatestContextVersion.mockResolvedValue({
        versionNumber: 3,
        contentHash: first.contentHash,
      });
      d.contextRepo.createContextVersion.mockClear();

      const res = await d.service.refreshContext(CONTEXT, dto, actor);

      expect(res.unchanged).toBe(true);
      expect(res.statusConceptId).toBe(CONCEPTS.REFRESH_RUN_UNCHANGED);
      expect(d.contextRepo.createContextVersion).not.toHaveBeenCalled();
    });

    it('returns the previous run when the idempotency key repeats', async () => {
      const d = build();
      d.contextRepo.findRefreshRunByKey.mockResolvedValue({
        id: 'run-prev',
        statusConceptId: CONCEPTS.REFRESH_RUN_SUCCEEDED,
        outputContentHash: 'hash-prev',
        inputCount: 2,
      });

      const res = await d.service.refreshContext(CONTEXT, dto, actor);

      expect(res).toEqual({
        runId: 'run-prev',
        statusConceptId: CONCEPTS.REFRESH_RUN_SUCCEEDED,
        contentHash: 'hash-prev',
        unchanged: false,
        inputCount: 2,
        duplicate: true,
      });
      expect(d.contextRepo.createRefreshRun).not.toHaveBeenCalled();
    });

    it('fails the run when a required input is missing', async () => {
      const d = build();
      const run: any = { id: 'run-1' };
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      d.contextRepo.createRefreshRun.mockReturnValue(run);

      const res = await d.service.refreshContext(
        CONTEXT,
        {
          ...dto,
          inputs: [
            {
              sourceTypeConceptId: SOURCE_TYPE,
              sourceEntityName: 'tax_rates',
              required: true,
              missing: true,
            },
          ],
        },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.REFRESH_RUN_FAILED);
      expect(run.errorSummary).toContain('tax_rates');
      expect(d.contextRepo.createContextVersion).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('tolerates a missing optional input', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());

      const res = await d.service.refreshContext(
        CONTEXT,
        {
          ...dto,
          inputs: [
            {
              sourceTypeConceptId: SOURCE_TYPE,
              required: false,
              missing: true,
            },
          ],
        },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.REFRESH_RUN_SUCCEEDED);
    });

    it('refuses refreshing a context that is not active', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(
        activeContext({ statusConceptId: CONCEPTS.SYSCTX_RETIRED }),
      );

      await expect(
        d.service.refreshContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the context does not exist', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(null);

      await expect(
        d.service.refreshContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('activateVersion (UC-45-09)', () => {
    function draftVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        versionNumber: 2,
        contentHash: 'hash-2',
        statusConceptId: CONCEPTS.SYSCTX_VERSION_DRAFT,
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>, version = draftVersion()) {
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      d.contextRepo.findContextVersionForUpdate.mockResolvedValue(version);
      return version;
    }

    it('activates the version and points the context at it', async () => {
      const d = build();
      const context = activeContext();
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);
      const version = draftVersion();
      d.contextRepo.findContextVersionForUpdate.mockResolvedValue(version);

      const res = await d.service.activateVersion(CONTEXT, 2, {}, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.SYSCTX_VERSION_ACTIVE);
      expect(version.effectiveFrom).toBeInstanceOf(Date);
      expect(context.currentVersionId).toBe(VERSION);
    });

    it('supersedes the version that was active', async () => {
      const d = build();
      wire(d);
      const previous: any = {
        id: 'version-prev',
        statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE,
      };
      d.contextRepo.findActiveContextVersionForUpdate.mockResolvedValue(
        previous,
      );

      const res = await d.service.activateVersion(CONTEXT, 2, {}, actor);

      expect(res.supersededVersionId).toBe('version-prev');
      expect(previous.statusConceptId).toBe(CONCEPTS.SYSCTX_VERSION_SUPERSEDED);
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('refuses activating content that is not the expected one', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.activateVersion(
          CONTEXT,
          2,
          { expectedContentHash: 'otro' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts the matching content hash', async () => {
      const d = build();
      wire(d);

      const res = await d.service.activateVersion(
        CONTEXT,
        2,
        { expectedContentHash: 'hash-2' },
        actor,
      );

      expect(res.id).toBe(VERSION);
    });

    it('refuses activating the version that is already active', async () => {
      const d = build();
      wire(
        d,
        draftVersion({ statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE }),
      );

      await expect(
        d.service.activateVersion(CONTEXT, 2, {} as any, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses activating a superseded version', async () => {
      const d = build();
      wire(
        d,
        draftVersion({ statusConceptId: CONCEPTS.SYSCTX_VERSION_SUPERSEDED }),
      );

      await expect(
        d.service.activateVersion(CONTEXT, 2, {} as any, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      d.contextRepo.findContextVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.activateVersion(CONTEXT, 2, {} as any, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createBinding (UC-45-10)', () => {
    const dto: any = {
      consumerTypeConceptId: CONSUMER_TYPE,
      consumerId: CONSUMER,
      validFrom: '2026-08-01T00:00:00.000Z',
      validTo: '2026-09-01T00:00:00.000Z',
    };

    it('binds the context to the consumer', async () => {
      const d = build();
      d.contextRepo.findContextById.mockResolvedValue(activeContext());

      const res = await d.service.createBinding(CONTEXT, dto, actor);

      expect(res).toEqual({
        id: 'binding-1',
        systemContextId: CONTEXT,
        priority: 1,
        statusConceptId: CONCEPTS.SYSCTX_BINDING_ACTIVE,
      });
    });

    it('rejects an inverted validity window', async () => {
      const d = build();

      await expect(
        d.service.createBinding(
          CONTEXT,
          { ...dto, validTo: '2026-07-01T00:00:00.000Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a binding overlapping another of the same consumer', async () => {
      const d = build();
      d.contextRepo.findContextById.mockResolvedValue(activeContext());
      d.contextRepo.findContextBindingsForConsumer.mockResolvedValue([
        {
          id: 'binding-prev',
          validFrom: new Date('2026-08-15T00:00:00.000Z'),
          validTo: new Date('2026-10-01T00:00:00.000Z'),
        },
      ]);

      await expect(
        d.service.createBinding(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('accepts a binding that starts when the previous one ends', async () => {
      const d = build();
      d.contextRepo.findContextById.mockResolvedValue(activeContext());
      d.contextRepo.findContextBindingsForConsumer.mockResolvedValue([
        {
          id: 'binding-prev',
          validFrom: new Date('2026-07-01T00:00:00.000Z'),
          validTo: new Date('2026-08-01T00:00:00.000Z'),
        },
      ]);

      const res = await d.service.createBinding(CONTEXT, dto, actor);

      expect(res.id).toBe('binding-1');
    });

    it('refuses binding a context that is not active', async () => {
      const d = build();
      d.contextRepo.findContextById.mockResolvedValue(
        activeContext({ statusConceptId: CONCEPTS.SYSCTX_RETIRED }),
      );

      await expect(
        d.service.createBinding(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the context does not exist', async () => {
      const d = build();
      d.contextRepo.findContextById.mockResolvedValue(null);

      await expect(
        d.service.createBinding(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rollbackContext (UC-45-12)', () => {
    const dto: any = {
      targetVersionNumber: 2,
      reason: 'la versión 3 rompió el cálculo de IVA',
    };

    function supersededVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'version-2',
        versionNumber: 2,
        contentHash: 'hash-2',
        statusConceptId: CONCEPTS.SYSCTX_VERSION_SUPERSEDED,
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>, target = supersededVersion()) {
      const context = activeContext();
      const current: any = {
        id: 'version-3',
        versionNumber: 3,
        statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE,
      };
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);
      d.contextRepo.findContextVersionForUpdate.mockResolvedValue(target);
      d.contextRepo.findActiveContextVersionForUpdate.mockResolvedValue(
        current,
      );
      return { context, current, target };
    }

    it('reactivates the target and supersedes the current one', async () => {
      const d = build();
      const { context, current, target } = wire(d);

      const res = await d.service.rollbackContext(CONTEXT, dto, actor);

      expect(res).toEqual({
        id: 'version-2',
        versionNumber: 2,
        supersededVersionId: 'version-3',
        statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE,
      });
      expect(current.statusConceptId).toBe(CONCEPTS.SYSCTX_VERSION_SUPERSEDED);
      expect(current.effectiveTo).toBeInstanceOf(Date);
      expect(target.effectiveTo).toBeUndefined();
      expect(context.currentVersionId).toBe('version-2');
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses rolling back to a version that was never active', async () => {
      const d = build();
      wire(
        d,
        supersededVersion({ statusConceptId: CONCEPTS.SYSCTX_VERSION_DRAFT }),
      );

      await expect(
        d.service.rollbackContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses rolling back when the content is not the expected one', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.rollbackContext(
          CONTEXT,
          { ...dto, expectedContentHash: 'otro' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses rolling back a context with no active version', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findActiveContextVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.rollbackContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the target version does not exist', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());
      d.contextRepo.findContextVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.rollbackContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails when the context does not exist', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(null);

      await expect(
        d.service.rollbackContext(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
