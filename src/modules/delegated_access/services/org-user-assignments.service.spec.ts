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
  runWithTenant,
} from '../../../common';
import { STATUS } from './concept-maps';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = '11111111-1111-4111-8111-111111111111';

/** Corre la operación dentro del contexto de un tenant, como el interceptor. */
const inTenant = <T>(work: () => T): T => runWithTenant(TENANT, work);

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
  const resolved = {
    scope: 'TENANT',
    role: 'STAFF',
    targets: {
      practiceId: null,
      practiceSiteId: null,
      clinicalUnitId: null,
      careSpaceId: null,
      diagnosticUnitId: null,
      pharmacyId: null,
    },
    siteId: null,
    branchId: null,
  };
  const scope = {
    membership: mockFn().mockResolvedValue({ id: 'm1', userId: 'u1' }),
    membershipOwner: mockFn().mockResolvedValue({ id: 'm1', userId: 'u1' }),
    resolve: mockFn().mockResolvedValue(resolved),
    access: mockFn().mockResolvedValue({
      level: 'PLATFORM',
      branchIds: new Set(),
    }),
    locate: mockFn().mockResolvedValue({ siteId: null, branchId: null }),
    canSee: mockFn().mockReturnValue(true),
    assertCanManage: mockFn(),
    assertSupervisor: mockFn().mockResolvedValue(undefined),
    assertNoUnitHeadOverlap: mockFn().mockResolvedValue(undefined),
  };
  const events = { scopeChanged: mockFn().mockResolvedValue(undefined) };
  const service = new OrgUserAssignmentsService(
    em as any,
    assignmentsRepo,
    delegatesRepo as any,
    logger as any,
    scope as any,
    events as any,
  );
  return { service, tx, em, assignmentsRepo, delegatesRepo, scope, events };
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
      const res = await inTenant(() =>
        d.service.createAssignment('m1', { role: 'SECRETARY' } as any, actor),
      );
      expect(res).toEqual({
        id: 'a1',
        status: STATUS.ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects an overlapping active role+scope (conflict)', async () => {
      const d = build();
      d.assignmentsRepo.findActiveOverlap.mockResolvedValue({ id: 'x' });
      await expect(
        inTenant(() => d.service.createAssignment('m1', {} as any, actor)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateAssignment (UC-29-10)', () => {
    it('rejects when there is nothing to change (precondition)', async () => {
      const d = build();
      await expect(
        inTenant(() => d.service.updateAssignment('a1', {} as any, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the assignment does not exist', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.updateAssignment('a1', { suspend: true } as any, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the assignment is not active (precondition)', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: STATUS.SUSPENDED,
      });
      await expect(
        inTenant(() =>
          d.service.updateAssignment('a1', { suspend: true } as any, actor),
        ),
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
        inTenant(() =>
          d.service.updateAssignment(
            'a1',
            { suspend: true, expectedRowVersion: 2 } as any,
            actor,
          ),
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
      const res = await inTenant(() =>
        d.service.updateAssignment('a1', { suspend: true }, actor),
      );
      expect(res).toEqual({ ok: true });
      expect(assignment.statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.delegatesRepo.suspendByDelegateAssignment).toHaveBeenCalled();
    });
  });

  describe('F5g · alcance por espacio', () => {
    const resolvedFor = (scope: string, role: string, targets: object) => ({
      scope,
      role,
      targets: {
        practiceId: null,
        practiceSiteId: null,
        clinicalUnitId: null,
        careSpaceId: null,
        diagnosticUnitId: null,
        pharmacyId: null,
        ...targets,
      },
      siteId: 'site-1',
      branchId: 'branch-1',
    });

    it('autoriza contra el objetivo resuelto, no contra el cuerpo, y publica scope_changed', async () => {
      const d = build();
      const resolved = resolvedFor('SPACE', 'HOUSEKEEPING', {
        careSpaceId: 's1',
      });
      d.scope.resolve.mockResolvedValue(resolved);
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        accessScopeConceptId: 'x',
        careSpaceId: 's1',
        rowVersion: 1,
        createdAt: new Date(),
      });
      await inTenant(() =>
        d.service.createAssignment(
          'm1',
          {
            role: 'HOUSEKEEPING',
            accessScope: 'SPACE',
            careSpaceId: 's1',
          } as any,
          actor,
        ),
      );
      expect(d.scope.membership).toHaveBeenCalledWith(d.tx, TENANT, 'm1');
      expect(d.scope.resolve).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'HOUSEKEEPING',
        'SPACE',
        expect.objectContaining({ careSpaceId: 's1' }),
      );
      expect(d.scope.assertCanManage).toHaveBeenCalledWith(
        expect.anything(),
        resolved,
        { id: 'm1', userId: 'u1' },
        actor,
      );
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          careSpaceId: 's1',
          practiceSiteId: undefined,
        }),
      );
      expect(d.events.scopeChanged).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          change: 'CREATED',
          roleCode: 'HOUSEKEEPING',
          from: null,
        }),
      );
    });

    it('no escribe nada si la membresía no es del tenant', async () => {
      const d = build();
      d.scope.membership.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(
        inTenant(() => d.service.createAssignment('m9', {} as any, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
      expect(d.events.scopeChanged).not.toHaveBeenCalled();
    });

    it('no escribe si el actor no puede otorgar el alcance', async () => {
      const d = build();
      d.scope.assertCanManage.mockImplementation(() => {
        throw new ResourceNotFoundException('x');
      });
      await expect(
        inTenant(() => d.service.createAssignment('m1', {} as any, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('el jefe de servicio consulta el solape de la unidad antes de crear', async () => {
      const d = build();
      d.scope.resolve.mockResolvedValue(
        resolvedFor('UNIT', 'UNIT_HEAD', { clinicalUnitId: 'u1' }),
      );
      d.scope.assertNoUnitHeadOverlap.mockRejectedValue(
        new ConflictException('ya hay jefe'),
      );
      await expect(
        inTenant(() =>
          d.service.createAssignment(
            'm1',
            {
              role: 'UNIT_HEAD',
              accessScope: 'UNIT',
              clinicalUnitId: 'u1',
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza una vigencia que termina antes de empezar', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.createAssignment(
            'm1',
            {
              validFrom: '2026-02-01T00:00:00Z',
              validTo: '2026-01-01T00:00:00Z',
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('un supervisor que no es miembro del tenant frena el alta', async () => {
      const d = build();
      d.scope.assertSupervisor.mockRejectedValue(
        new ResourceNotFoundException('x'),
      );
      await expect(
        inTenant(() =>
          d.service.createAssignment(
            'm1',
            { supervisorUserId: 'u-x' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('cambiar el alcance reemplaza los objetivos, excluye la propia fila del solape y publica', async () => {
      const d = build();
      const assignment: any = {
        id: 'a1',
        tenantMembershipId: 'm1',
        statusConceptId: STATUS.ACTIVE,
        assignmentRoleConceptId: 'rol',
        accessScopeConceptId: 'viejo',
        careSpaceId: 'old-space',
        rowVersion: 2,
        updatedAt: new Date(),
      };
      d.assignmentsRepo.findById.mockResolvedValue(assignment);
      d.scope.resolve.mockResolvedValue(
        resolvedFor('SPACE', 'STAFF', { careSpaceId: 'new-space' }),
      );
      await inTenant(() =>
        d.service.updateAssignment(
          'a1',
          { accessScope: 'SPACE', careSpaceId: 'new-space' } as any,
          actor,
        ),
      );
      expect(d.assignmentsRepo.findActiveOverlap).toHaveBeenCalledWith(
        d.tx,
        'm1',
        'rol',
        expect.any(String),
        STATUS.ACTIVE,
        expect.objectContaining({ careSpaceId: 'new-space' }),
        'a1',
      );
      expect(assignment.careSpaceId).toBe('new-space');
      expect(assignment.practiceSiteId).toBeNull();
      expect(d.events.scopeChanged).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          change: 'RETARGETED',
          from: expect.objectContaining({ careSpaceId: 'old-space' }),
        }),
      );
    });

    it('una asignación cuya membresía es de otro tenant es 404 y no se toca', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        tenantMembershipId: 'm-ajena',
        statusConceptId: STATUS.ACTIVE,
      });
      d.scope.membershipOwner.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.updateAssignment('a1', { suspend: true } as any, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(
        d.delegatesRepo.suspendByDelegateAssignment,
      ).not.toHaveBeenCalled();
    });

    it('para un administrador de sucursal, una asignación fuera de sus sedes no existe', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        tenantMembershipId: 'm1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.scope.access.mockResolvedValue({
        level: 'BRANCH_ADMIN',
        branchIds: new Set(['b']),
      });
      d.scope.canSee.mockReturnValue(false);
      await expect(
        inTenant(() =>
          d.service.updateAssignment('a1', { suspend: true } as any, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.scope.assertCanManage).not.toHaveBeenCalled();
    });
  });
});
