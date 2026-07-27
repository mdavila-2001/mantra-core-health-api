import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsInstancesService } from './forms-instances.service';
import { FORMS } from '../forms.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'clin-1', roles: ['USER'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const instancesRepo = {
    findByResourceAndVersion: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const valuesRepo = {
    findPreliminaryByInstance: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsInstancesService(
    em as any,
    instancesRepo,
    valuesRepo as any,
    logger as any,
  );
  return { service, tx, instancesRepo, valuesRepo };
}

describe('FormsInstancesService', () => {
  describe('openInstance (UC-09-07)', () => {
    it('opens a new instance for a resource', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue(null);
      d.instancesRepo.create.mockReturnValue({
        id: 'i1',
        schemaVersion: 1,
        stateConceptId: FORMS.INSTANCE_OPEN,
      });
      const res = await d.service.openInstance({ resourceId: 'r1' }, actor);
      expect(res).toEqual({
        id: 'i1',
        schemaVersion: 1,
        state: FORMS.INSTANCE_OPEN,
      });
    });

    it('rejects a duplicate instance', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue({ id: 'i0' });
      await expect(
        d.service.openInstance({ resourceId: 'r1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('closeInstance (UC-09-11)', () => {
    it('closes an open instance and finalizes preliminary values', async () => {
      const d = build();
      const instance = {
        id: 'i1',
        stateConceptId: FORMS.INSTANCE_OPEN,
        updatedAt: new Date(),
      };
      const prelim = {
        id: 'v1',
        valueStatusConceptId: FORMS.VALUE_PRELIMINARY,
        updatedAt: new Date(),
      };
      d.instancesRepo.findById.mockResolvedValue(instance);
      d.valuesRepo.findPreliminaryByInstance.mockResolvedValue([prelim]);
      const res = await d.service.closeInstance('i1', actor);
      expect(res).toEqual({ ok: true });
      expect(instance.stateConceptId).toBe(FORMS.INSTANCE_CLOSED);
      expect(prelim.valueStatusConceptId).toBe(FORMS.VALUE_FINAL);
    });

    it('rejects closing an instance that is not open', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue({
        id: 'i1',
        stateConceptId: FORMS.INSTANCE_CLOSED,
      });
      await expect(d.service.closeInstance('i1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the instance does not exist', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(null);
      await expect(d.service.closeInstance('i1', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
