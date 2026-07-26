import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsAssignmentsService } from './forms-assignments.service';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assignmentsRepo = {
    findActivePolicy: mockFn(),
    countActiveAssignments: mockFn().mockResolvedValue(0),
    createSection: mockFn(),
    createAssignment: mockFn(),
  };
  const fieldsRepo = { findFieldById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsAssignmentsService(em as any, assignmentsRepo as any, fieldsRepo as any, logger as any);
  return { service, tx, assignmentsRepo, fieldsRepo };
}

describe('FormsAssignmentsService', () => {
  describe('createAssignment (UC-09-06)', () => {
    it('provisions a default section and creates the assignment when no policy applies', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicy.mockResolvedValue(null);
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      const res = await d.service.createAssignment(
        { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
        actor,
      );

      expect(res).toEqual({ id: 'as1' });
      expect(d.assignmentsRepo.createSection).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects when the policy field budget is exceeded', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicy.mockResolvedValue({ maximumFields: 1 });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(1);

      await expect(
        d.service.createAssignment({ fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assignmentsRepo.createAssignment).not.toHaveBeenCalled();
    });

    it('throws when the field does not exist', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.createAssignment({ fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
