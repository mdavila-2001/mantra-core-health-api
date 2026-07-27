import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReadModelDefinitionsService } from './read-model-definitions.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { RM } from '../read_models.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => em),
  };
  const definitionsRepo = {
    findById: mockFn(),
    findBySchemaObjectVersion: mockFn(),
    findAllBySchemaObject: mockFn(),
    findAllNotRetired: mockFn(),
    create: mockFn(),
  };
  const dependenciesRepo = { create: mockFn() };
  const runsRepo = { create: mockFn(), findLatestByDefinition: mockFn() };
  const pageViewsRepo = { countByDefinition: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ReadModelDefinitionsService(
    em as any,
    definitionsRepo as any,
    dependenciesRepo as any,
    runsRepo,
    pageViewsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    definitionsRepo,
    dependenciesRepo,
    runsRepo,
    pageViewsRepo,
  };
}

const baseDto = {
  schemaName: 'read_models',
  objectName: 'crm_account_360_v',
  objectType: 'MATERIALIZED_VIEW' as const,
  dependencies: [
    {
      sourceSchemaName: 'crm',
      sourceObjectName: 'accounts',
      dependencyType: 'TABLE' as const,
    },
  ],
};

describe('ReadModelDefinitionsService', () => {
  describe('createDefinition (UC-30-01)', () => {
    it('publishes the definition, flushes before dependencies and records them', async () => {
      const d = build();
      d.definitionsRepo.findBySchemaObjectVersion.mockResolvedValue(null);
      d.definitionsRepo.create.mockReturnValue({
        id: 'def-1',
        schemaName: baseDto.schemaName,
        objectName: baseDto.objectName,
        versionNumber: 1,
        statusConceptId: RM.DEF_ACTIVE,
        definitionHash: 'h',
        createdAt: new Date('2026-01-01'),
      });

      const res = await d.service.createDefinition(baseDto, actor);

      expect(res.id).toBe('def-1');
      expect(res.status).toBe(RM.DEF_ACTIVE);
      expect(res.dependencyCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.dependenciesRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate (schema, object, version) with a conflict', async () => {
      const d = build();
      d.definitionsRepo.findBySchemaObjectVersion.mockResolvedValue({
        id: 'x',
      });

      await expect(
        d.service.createDefinition(baseDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.definitionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('createVersion (UC-30-08)', () => {
    it('throws when there is no previous version', async () => {
      const d = build();
      d.definitionsRepo.findAllBySchemaObject.mockResolvedValue([]);

      await expect(
        d.service.createVersion(
          'read_models',
          'crm_account_360_v',
          baseDto as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when no previous version is ACTIVE', async () => {
      const d = build();
      d.definitionsRepo.findAllBySchemaObject.mockResolvedValue([
        { versionNumber: 1, statusConceptId: RM.DEF_DRAFT },
      ]);

      await expect(
        d.service.createVersion(
          'read_models',
          'crm_account_360_v',
          baseDto as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates version N+1 in DRAFT when a previous ACTIVE exists', async () => {
      const d = build();
      d.definitionsRepo.findAllBySchemaObject.mockResolvedValue([
        { versionNumber: 2, statusConceptId: RM.DEF_ACTIVE },
      ]);
      d.definitionsRepo.create.mockReturnValue({
        id: 'def-2',
        schemaName: 'read_models',
        objectName: 'crm_account_360_v',
        versionNumber: 3,
        statusConceptId: RM.DEF_DRAFT,
        definitionHash: 'h',
        createdAt: new Date(),
      });

      const res = await d.service.createVersion(
        'read_models',
        'crm_account_360_v',
        baseDto,
        actor,
      );

      expect(res.versionNumber).toBe(3);
      expect(res.status).toBe(RM.DEF_DRAFT);
      const createArg = d.definitionsRepo.create.mock.calls[0][1];
      expect(createArg.versionNumber).toBe(3);
    });
  });

  describe('refresh (UC-30-03)', () => {
    it('throws not found when the definition is missing', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue(null);
      await expect(d.service.refresh('missing', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects refreshing a non-materialized view (precondition 422)', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        objectTypeConceptId: RM.OBJECT_TYPE_VIEW,
        statusConceptId: RM.DEF_ACTIVE,
      });
      await expect(d.service.refresh('def-1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.runsRepo.create).not.toHaveBeenCalled();
    });

    it('records a successful concurrent refresh run for a materialized view', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        objectTypeConceptId: RM.OBJECT_TYPE_MATERIALIZED_VIEW,
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.runsRepo.create.mockReturnValue({
        id: 'run-1',
        rowsAffected: '0',
        startedAt: new Date(),
        completedAt: new Date(),
      });

      const res = await d.service.refresh('def-1', actor);

      expect(res.id).toBe('run-1');
      expect(res.refreshType).toBe(RM.REFRESH_TYPE_CONCURRENT);
      expect(res.result).toBe(RM.RESULT_SUCCESS);
      expect(d.runsRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('backfill (UC-30-04)', () => {
    it('records a FULL_BACKFILL run', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        objectTypeConceptId: RM.OBJECT_TYPE_MATERIALIZED_VIEW,
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.runsRepo.create.mockReturnValue({ id: 'run-2' });

      const res = await d.service.backfill('def-1', actor);
      expect(res.refreshType).toBe(RM.REFRESH_TYPE_FULL_BACKFILL);
    });
  });

  describe('reconcile (UC-30-07)', () => {
    it('records a RECONCILE run with REPAIRED result', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        objectTypeConceptId: RM.OBJECT_TYPE_MATERIALIZED_VIEW,
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.runsRepo.create.mockReturnValue({ id: 'run-3' });

      const res = await d.service.reconcile('def-1', actor);
      expect(res.refreshType).toBe(RM.REFRESH_TYPE_RECONCILE);
      expect(res.result).toBe(RM.RESULT_REPAIRED);
    });
  });

  describe('deprecate (UC-30-13)', () => {
    it('moves an ACTIVE definition to DEPRECATED', async () => {
      const d = build();
      const def = {
        id: 'def-1',
        statusConceptId: RM.DEF_ACTIVE,
        updatedAt: new Date(),
      };
      d.definitionsRepo.findById.mockResolvedValue(def);

      const res = await d.service.deprecate('def-1', actor);
      expect(res).toEqual({ ok: true, status: RM.DEF_DEPRECATED });
      expect(def.statusConceptId).toBe(RM.DEF_DEPRECATED);
    });

    it('throws not found for a missing definition', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue(null);
      await expect(d.service.deprecate('x', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('retire (UC-30-13)', () => {
    it('rejects retiring a definition still referenced by views (422)', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.pageViewsRepo.countByDefinition.mockResolvedValue(2);

      await expect(d.service.retire('def-1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('retires a definition with no referencing views', async () => {
      const d = build();
      const def = {
        id: 'def-1',
        statusConceptId: RM.DEF_DEPRECATED,
        updatedAt: new Date(),
      };
      d.definitionsRepo.findById.mockResolvedValue(def);
      d.pageViewsRepo.countByDefinition.mockResolvedValue(0);

      const res = await d.service.retire('def-1', actor);
      expect(res).toEqual({ ok: true, status: RM.DEF_RETIRED });
      expect(def.statusConceptId).toBe(RM.DEF_RETIRED);
    });
  });

  describe('health (UC-30-12)', () => {
    it('flags a definition as stale when it exceeds its staleness threshold', async () => {
      const d = build();
      d.definitionsRepo.findAllNotRetired.mockResolvedValue([
        {
          id: 'def-1',
          schemaName: 's',
          objectName: 'o',
          maximumStalenessSeconds: 10,
        },
      ]);
      d.runsRepo.findLatestByDefinition.mockResolvedValue({
        completedAt: new Date(Date.now() - 60_000),
      });

      const res = await d.service.health();
      expect(res.items).toHaveLength(1);
      expect(res.items[0].stale).toBe(true);
    });
  });
});
