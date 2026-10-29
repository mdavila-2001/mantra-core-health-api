import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgUserAssignmentsService } from './org-user-assignments.service';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { STATUS } from './concept-maps';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assignmentsRepo = {
    findActiveOverlap: mockFn().mockResolvedValue(null),
    create: mockFn(),
    findById: mockFn(),
    findOverdueActive: mockFn().mockResolvedValue([]),
  };
  const delegatesRepo = {
    suspendByDelegateAssignment: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new OrgUserAssignmentsService(
    em as any,
    assignmentsRepo,
    delegatesRepo as any,
    logger as any,
  );
  return { service, tx, em, assignmentsRepo, delegatesRepo };
}

describe('OrgUserAssignmentsService', () => {
  describe('createAssignment (UC-29-01)', () => {
    it('creates the assignment and flushes', async () => {
      const d = build();
      const created = {
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date('2026-01-01'),
      };
      d.assignmentsRepo.create.mockReturnValue(created);
      const res = await d.service.createAssignment(
        'm1',
        { role: 'SECRETARY' } as any,
        actor,
      );
      expect(res).toEqual({
        id: 'a1',
        status: STATUS.ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('un rol operativo pide el nodo de su alcance (422 ASSIGNMENT_SCOPE_NODE_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.service.createAssignment(
          'm1',
          { role: 'HOUSEKEEPING', accessScope: 'UNIT' } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: 'DELEGATED_ASSIGNMENT_SCOPE_NODE_REQUIRED',
        details: { requiredField: 'clinicalUnitId' },
      });
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('un nodo de otro tenant que la membresía responde 404 y no crea nada', async () => {
      const d = build();
      (d.tx as any).execute = mockFn()
        .mockResolvedValueOnce([{ tenant_id: 'tenant-a' }])
        .mockResolvedValueOnce([]);
      await expect(
        d.service.createAssignment(
          'm1',
          {
            role: 'NURSE_SUPERVISOR',
            accessScope: 'SPACE',
            careSpaceId: 'space-de-otro-tenant',
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 404,
        reason: 'DELEGATED_SCOPE_NODE_NOT_FOUND',
      });
      expect((d.tx as any).execute).toHaveBeenLastCalledWith(
        expect.stringContaining('practice.care_spaces'),
        ['space-de-otro-tenant', 'tenant-a'],
      );
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('con un nodo del tenant crea la asignación y el solape se mide por nodo', async () => {
      const d = build();
      (d.tx as any).execute = mockFn()
        .mockResolvedValueOnce([{ tenant_id: 'tenant-a' }])
        .mockResolvedValueOnce([{ id: 'unit-1' }]);
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a2',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date('2026-01-01'),
      });
      await d.service.createAssignment(
        'm1',
        {
          role: 'HOUSEKEEPING',
          accessScope: 'UNIT',
          clinicalUnitId: 'unit-1',
        } as any,
        actor,
      );
      expect(d.assignmentsRepo.findActiveOverlap).toHaveBeenCalledWith(
        d.tx,
        'm1',
        expect.any(String),
        expect.any(String),
        STATUS.ACTIVE,
        expect.objectContaining({ clinicalUnitId: 'unit-1' }),
      );
      expect(d.assignmentsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects an overlapping active role+scope (conflict)', async () => {
      const d = build();
      d.assignmentsRepo.findActiveOverlap.mockResolvedValue({ id: 'x' });
      await expect(
        d.service.createAssignment('m1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateAssignment (UC-29-10)', () => {
    it('rejects when there is nothing to change (precondition)', async () => {
      const d = build();
      await expect(
        d.service.updateAssignment('a1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the assignment does not exist', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.updateAssignment('a1', { suspend: true } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the assignment is not active (precondition)', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: STATUS.SUSPENDED,
      });
      await expect(
        d.service.updateAssignment('a1', { suspend: true } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects on row_version mismatch (concurrency)', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 3,
      });
      await expect(
        d.service.updateAssignment(
          'a1',
          { suspend: true, expectedRowVersion: 2 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });

    it('suspends and cascades to dependent delegations', async () => {
      const d = build();
      const assignment = {
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 1,
        updatedAt: new Date(),
      };
      d.assignmentsRepo.findById.mockResolvedValue(assignment);
      const res = await d.service.updateAssignment(
        'a1',
        { suspend: true },
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(assignment.statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.delegatesRepo.suspendByDelegateAssignment).toHaveBeenCalled();
    });
  });
});
