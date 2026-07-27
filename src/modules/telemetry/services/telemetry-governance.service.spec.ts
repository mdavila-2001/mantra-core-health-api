import { jest } from '@jest/globals';

// Loose-typed mock factory: mantiene el runtime 'jest' evitando el tipado estricto Mock<never>.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TelemetryGovernanceService } from './telemetry-governance.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const purposesRepo = {
    findByCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const schemasRepo = {
    findByNameVersion: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const disclosuresRepo = {
    findByDocumentVersion: mockFn(),
    findOpenByDocument: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const funnelsRepo = { findByCode: mockFn(), create: mockFn() };
  const funnelStepsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TelemetryGovernanceService(
    em as any,
    purposesRepo,
    schemasRepo,
    disclosuresRepo as any,
    funnelsRepo as any,
    funnelStepsRepo,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    purposesRepo,
    schemasRepo,
    disclosuresRepo,
    funnelsRepo,
    funnelStepsRepo,
  };
}

describe('TelemetryGovernanceService', () => {
  describe('definePurpose (UC-28-01)', () => {
    it('creates a purpose when the code is free', async () => {
      const d = build();
      d.purposesRepo.findByCode.mockResolvedValue(null);
      d.purposesRepo.create.mockReturnValue({
        id: 'p1',
        purposeCode: 'ANALYTICS',
        versionNumber: 1,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        requiresConsent: true,
        createdAt: new Date('2026-01-01'),
      });

      const res = await d.service.definePurpose(
        { purposeCode: 'ANALYTICS', name: 'Analytics' },
        actor,
      );

      expect(res.id).toBe('p1');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate purpose code', async () => {
      const d = build();
      d.purposesRepo.findByCode.mockResolvedValue({ id: 'exists' });
      await expect(
        d.service.definePurpose(
          { purposeCode: 'ANALYTICS', name: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('registerEventSchema (UC-28-02)', () => {
    it('registers a schema for an active purpose', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.schemasRepo.findByNameVersion.mockResolvedValue(null);
      d.schemasRepo.create.mockReturnValue({
        id: 's1',
        eventName: 'page_view',
        schemaVersion: 1,
        purposeDefinitionId: 'p1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.registerEventSchema(
        { eventName: 'page_view', purposeDefinitionId: 'p1' },
        actor,
      );
      expect(res.id).toBe('s1');
    });

    it('404 when the purpose does not exist', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.registerEventSchema(
          { eventName: 'x', purposeDefinitionId: 'p9' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('422 when the purpose is not active', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.registerEventSchema(
          { eventName: 'x', purposeDefinitionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('409 on duplicate (eventName, schemaVersion)', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.schemasRepo.findByNameVersion.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.registerEventSchema(
          { eventName: 'x', purposeDefinitionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('publishDisclosure (UC-28-03)', () => {
    it('publishes and closes previous open versions', async () => {
      const d = build();
      d.disclosuresRepo.findByDocumentVersion.mockResolvedValue(null);
      const prev = { effectiveTo: undefined as Date | undefined };
      d.disclosuresRepo.findOpenByDocument.mockResolvedValue([prev]);
      d.disclosuresRepo.create.mockReturnValue({
        id: 'v1',
        documentCode: 'PRIV',
        versionNumber: 1,
        statusConceptId: 'published',
        createdAt: new Date(),
      });

      const res = await d.service.publishDisclosure(
        { documentCode: 'PRIV' },
        actor,
      );
      expect(res.id).toBe('v1');
      expect(prev.effectiveTo).toBeInstanceOf(Date);
    });

    it('409 on duplicate document version', async () => {
      const d = build();
      d.disclosuresRepo.findByDocumentVersion.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.publishDisclosure({ documentCode: 'PRIV' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('defineFunnel (UC-28-10)', () => {
    it('creates funnel and its steps, flushing parent before children', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({ id: 'p1' });
      d.funnelsRepo.findByCode.mockResolvedValue(null);
      d.schemasRepo.findById.mockResolvedValue({ id: 's1' });
      d.funnelsRepo.create.mockReturnValue({
        id: 'f1',
        funnelCode: 'signup',
        versionNumber: 1,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.defineFunnel(
        {
          funnelCode: 'signup',
          name: 'Signup',
          purposeDefinitionId: 'p1',
          steps: [
            { eventSchemaDefinitionId: 's1' },
            { eventSchemaDefinitionId: 's1' },
          ],
        },
        actor,
      );
      expect(res.stepCount).toBe(2);
      expect(d.funnelStepsRepo.create).toHaveBeenCalledTimes(2);
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('422 when a step references a missing schema', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({ id: 'p1' });
      d.funnelsRepo.findByCode.mockResolvedValue(null);
      d.schemasRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.defineFunnel(
          {
            funnelCode: 'x',
            name: 'x',
            purposeDefinitionId: 'p1',
            steps: [{ eventSchemaDefinitionId: 'nope' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
