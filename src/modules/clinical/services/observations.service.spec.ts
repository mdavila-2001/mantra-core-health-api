import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ObservationsService } from './observations.service';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const observationsRepo = {
    findById: mockFn(),
    create: mockFn(),
    createComponent: mockFn(),
    createPerformer: mockFn(),
    createReferenceRange: mockFn(),
    createNote: mockFn(),
    findComponents: mockFn().mockResolvedValue([]),
  };
  const encountersRepo = { findById: mockFn() };
  const serviceRequestsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ObservationsService(
    em as any,
    observationsRepo as any,
    encountersRepo as any,
    serviceRequestsRepo as any,
    logger as any,
  );
  return { service, tx, observationsRepo, encountersRepo, serviceRequestsRepo };
}

describe('ObservationsService', () => {
  describe('record (UC-08-03)', () => {
    it('records a quantity observation with a component', async () => {
      const d = build();
      d.observationsRepo.create.mockReturnValue({
        id: 'obs1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.OBSERVATION_FINAL,
        rowVersion: 1,
        createdAt: new Date(),
      });
      d.observationsRepo.createComponent.mockReturnValue({ id: 'comp1' });

      const res = await d.service.record(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          quantityValue: 120,
          quantityUnitConceptId: 'mmHg',
          components: [{ codeConceptId: 'c-sys', quantityValue: 80 }],
          performers: [{ performerTypeConceptId: 'pt', performerId: 'hp1' }],
          referenceRanges: [{ lowValue: 60, highValue: 100 }],
          notes: ['nota'],
        } as any,
        actor,
      );

      expect(res.status).toBe(CLIN.OBSERVATION_FINAL);
      expect(res.componentIds).toEqual(['comp1']);
      expect(d.observationsRepo.createPerformer).toHaveBeenCalled();
      expect(d.observationsRepo.createReferenceRange).toHaveBeenCalled();
      expect(d.observationsRepo.createNote).toHaveBeenCalled();
    });

    it('rejects when the encounter does not exist', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.record(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            encounterId: 'missing',
            quantityValue: 1,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when no value family is provided', async () => {
      const d = build();
      await expect(
        d.service.record(
          { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'code1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('amend (UC-08-04)', () => {
    const obs = () => ({
      id: 'obs1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.OBSERVATION_FINAL,
      rowVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('amends an observation and adds a note', async () => {
      const d = build();
      const o = obs();
      d.observationsRepo.findById.mockResolvedValue(o);
      const res = await d.service.amend('obs1', { note: 'corrección', valueDecimal: 5 } as any, actor);
      expect(o.statusConceptId).toBe(CLIN.OBSERVATION_AMENDED);
      expect(d.observationsRepo.createNote).toHaveBeenCalled();
      expect(res.status).toBe(CLIN.OBSERVATION_AMENDED);
    });

    it('throws when the observation does not exist', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.amend('missing', { note: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects amending an observation in a non-amendable status', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue({
        ...obs(),
        statusConceptId: CLIN.OBSERVATION_AMENDED,
      });
      await expect(
        d.service.amend('obs1', { note: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects on optimistic version mismatch', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue({ ...obs(), rowVersion: 4 });
      await expect(
        d.service.amend('obs1', { note: 'x', expectedRowVersion: 1 } as any, actor),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });
});
