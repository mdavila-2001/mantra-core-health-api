import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsAssignmentsService } from './forms-assignments.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
  const service = new FormsAssignmentsService(
    em as any,
    assignmentsRepo as any,
    fieldsRepo as any,
    logger as any,
  );
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
        {
          fieldId: 'f1',
          targetResourceConceptId: 'rt-1',
          tenantId: 'tenant-a',
        },
        actor,
      );

      expect(res).toEqual({ id: 'as1' });
      expect(d.assignmentsRepo.createSection).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects when the policy field budget is exceeded', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicy.mockResolvedValue({
        maximumFields: 1,
      });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(1);

      await expect(
        d.service.createAssignment(
          {
            fieldId: 'f1',
            targetResourceConceptId: 'rt-1',
            tenantId: 'tenant-a',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assignmentsRepo.createAssignment).not.toHaveBeenCalled();
    });

    it('only counts the budget against the assignment tenant, not others sharing the same target', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicy.mockResolvedValue({
        maximumFields: 1,
      });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(0);
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      await d.service.createAssignment(
        {
          fieldId: 'f1',
          targetResourceConceptId: 'rt-1',
          tenantId: 'tenant-a',
        },
        actor,
      );

      expect(d.assignmentsRepo.countActiveAssignments).toHaveBeenCalledWith(
        d.tx,
        'rt-1',
        expect.any(String),
        'tenant-a',
      );
    });

    it('throws when the field does not exist', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.createAssignment(
          { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
