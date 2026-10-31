import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { DirectoryMembershipsService } from './directory-memberships.service';
import { DIR } from '../directory.concepts';
import {
  ConflictException,
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
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const membershipsRepo = {
    findActiveByUserTenant: mockFn(),
    findActiveByUser: mockFn().mockResolvedValue([]),
    findByIdInTenant: mockFn(),
    findByIdAndUser: mockFn(),
    countActiveByTenantRole: mockFn(),
    create: mockFn(),
  };
  const tenantsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 't1',
      tradeName: 'Clínica Sur',
      legalName: 'Clínica Sur S.R.L.',
      code: 'CSUR',
    }),
  };
  const branchMembershipsRepo = {
    findByMembership: mockFn(() => Promise.resolve([])),
    findByMembershipBranchStatus: mockFn(),
    findByMembershipAndStatus: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const branchesRepo = { findById: mockFn() };
  // Autorización por membresía: los tests de este servicio prueban su lógica, no la del
  // permiso; el doble deja pasar y hay un spec propio para el rechazo.
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
    assertCanChangeOwnership: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryMembershipsService(
    em as any,
    membershipsRepo as any,
    branchMembershipsRepo,
    branchesRepo as any,
    tenantAdmin as never,
    logger as any,
    tenantsRepo as any,
  );
  return {
    service,
    tx,
    tenantsRepo,
    membershipsRepo,
    branchMembershipsRepo,
    branchesRepo,
    tenantAdmin,
  };
}

/**
 * Ejecuta la operación active membership.
 *
 * @param over - Valor de over requerido por la operación.
 * @returns Resultado de active membership.
 */
const activeMembership = (over: any = {}) => ({
  id: 'm1',
  userId: 'u1',
  tenantId: 't1',
  tenantRoleConceptId: DIR.ROLE_STAFF,
  accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
  statusConceptId: DIR.MEMBERSHIP_ACTIVE,
  startDate: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('DirectoryMembershipsService', () => {
  describe('invite (UC-04-05)', () => {
    it('rejects a duplicated active membership (conflict)', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({ id: 'm0' });
      await expect(
        d.service.invite('t1', { userId: 'u1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('N2: crea la membresía PENDIENTE de aceptación (no activa) con los valores por defecto', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue(
        activeMembership({
          statusConceptId: DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
        }),
      );

      const res = await d.service.invite('t1', { userId: 'u1' }, actor);

      expect(res.id).toBe('m1');
      expect(res.status).toBe(DIR.MEMBERSHIP_PENDING_ACCEPTANCE);
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantRoleConceptId: DIR.ROLE_STAFF,
          accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
          statusConceptId: DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
          invitedByUserId: 'admin-1',
          // N10c: la añadió un administrador.
          originConceptId: DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED,
        }),
      );
      // Nunca activa por orden de un administrador.
      expect(d.membershipsRepo.create).not.toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: DIR.MEMBERSHIP_ACTIVE }),
      );
    });

    it('N2: una segunda invitación mientras hay una pendiente es 409', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'm0' });
      await expect(
        d.service.invite('t1', { userId: 'u1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.membershipsRepo.create).not.toHaveBeenCalled();
      expect(d.membershipsRepo.findActiveByUserTenant).toHaveBeenLastCalledWith(
        d.tx,
        'u1',
        't1',
        DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
      );
    });
  });

  describe('N2: aceptar o rechazar una membresía pendiente propia', () => {
    const me = { id: 'u1', roles: ['USER'] } as any;
    const pending = (over: any = {}) =>
      activeMembership({
        statusConceptId: DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
        createdAt: new Date('2026-10-30T10:00:00Z'),
        ...over,
      });

    it('lista solo las pendientes de la propia persona, con el nombre de la organización', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([pending()]);
      const res = await d.service.listMyInvitations(me);
      expect(d.membershipsRepo.findActiveByUser).toHaveBeenCalledWith(
        expect.anything(),
        'u1',
        DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
      );
      expect(res.items).toEqual([
        {
          id: 'm1',
          tenantId: 't1',
          tenantName: 'Clínica Sur',
          role: 'STAFF',
          invitedAt: new Date('2026-10-30T10:00:00Z'),
        },
      ]);
    });

    it('aceptar la deja ACTIVA y el acceso empieza ahora', async () => {
      const d = build();
      const membership = pending({ startDate: new Date('2020-01-01') });
      d.membershipsRepo.findByIdAndUser.mockResolvedValue(membership);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      const res = await d.service.acceptMine(me, 'm1');
      expect(res).toEqual({ id: 'm1', tenantId: 't1', status: 'ACTIVE' });
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
      expect(membership.startDate.getFullYear()).toBeGreaterThan(2020);
      expect(membership.updatedByUserId).toBe('u1');
      // Se vuelca dentro del contexto de la organización (RLS).
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rechazarla la termina y nunca llegó a contar', async () => {
      const d = build();
      const membership = pending();
      d.membershipsRepo.findByIdAndUser.mockResolvedValue(membership);
      const res = await d.service.declineMine(me, 'm1');
      expect(res.status).toBe('DECLINED');
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
      expect(membership.endDate).toBeInstanceOf(Date);
    });

    it('si ya es miembro activo por otro camino, la pendiente se cierra sin crear una segunda activa', async () => {
      const d = build();
      const membership = pending();
      d.membershipsRepo.findByIdAndUser.mockResolvedValue(membership);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({ id: 'm9' });
      await d.service.acceptMine(me, 'm1');
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    });

    it('404 uniforme: ajena, inexistente, ya decidida o pendiente de aprobación de la organización', async () => {
      const d = build();
      // Inexistente o ajena: el repositorio busca por id Y persona.
      d.membershipsRepo.findByIdAndUser.mockResolvedValue(null);
      await expect(d.service.acceptMine(me, 'm1')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.membershipsRepo.findByIdAndUser).toHaveBeenCalledWith(
        d.tx,
        'm1',
        'u1',
      );
      // Ya activa, terminada...
      for (const status of [
        DIR.MEMBERSHIP_ACTIVE,
        DIR.MEMBERSHIP_ENDED,
        DIR.MEMBERSHIP_SUSPENDED,
        // ...o la que el personal de apoyo deja para que la ORGANIZACIÓN apruebe:
        // la persona no puede aprobarse a sí misma.
        DIR.MEMBERSHIP_INVITED,
      ]) {
        d.membershipsRepo.findByIdAndUser.mockResolvedValue(
          pending({ statusConceptId: status }),
        );
        await expect(d.service.acceptMine(me, 'm1')).rejects.toBeInstanceOf(
          ResourceNotFoundException,
        );
        await expect(d.service.declineMine(me, 'm1')).rejects.toBeInstanceOf(
          ResourceNotFoundException,
        );
      }
    });
  });

  describe('N2: la organización puede preparar o retirar la invitación pendiente', () => {
    it('offboard de una invitación pendiente de OWNER no choca con «último OWNER»', async () => {
      const d = build();
      const membership = activeMembership({
        tenantRoleConceptId: DIR.ROLE_OWNER,
        statusConceptId: DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
      });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.membershipsRepo.countActiveByTenantRole.mockResolvedValue(1);
      await expect(d.service.offboard('t1', 'm1', actor)).resolves.toEqual({
        ok: true,
      });
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    });

    it('asignar sede a una pendiente es posible; a una terminada no', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(
        activeMembership({ statusConceptId: DIR.MEMBERSHIP_ENDED }),
      );
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('assignBranch (UC-04-06)', () => {
    it('throws when the membership is missing', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a branch of another tenant (precondition)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({
        id: 'b1',
        tenantId: 'OTHER',
      });
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('assigns the branch and sets it as primary when it is the first', async () => {
      const d = build();
      const membership = activeMembership({ primaryBranchId: undefined });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(
        null,
      );
      d.branchMembershipsRepo.create.mockReturnValue({
        id: 'bm1',
        tenantMembershipId: 'm1',
        branchId: 'b1',
        localRoleConceptId: DIR.LOCAL_ROLE_STAFF,
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
      });

      const res = await d.service.assignBranch(
        't1',
        'm1',
        { branchId: 'b1' },
        actor,
      );

      expect(res.id).toBe('bm1');
      expect(membership.primaryBranchId).toBe('b1');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicated active assignment (conflict)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue({
        id: 'bm0',
      });
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('transfer (UC-04-07)', () => {
    it('closes the source assignment, opens the destination and moves primary', async () => {
      const d = build();
      const membership = activeMembership({ primaryBranchId: 'b1' });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      const source = {
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
        localRoleConceptId: 'lr',
        updatedAt: new Date(),
      };
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(
        source,
      );

      const res = await d.service.transfer(
        't1',
        'm1',
        { fromBranchId: 'b1', toBranchId: 'b2' },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(source.statusConceptId).toBe(DIR.BRANCH_MEMBERSHIP_ENDED);
      expect(membership.primaryBranchId).toBe('b2');
      expect(d.branchMembershipsRepo.create).toHaveBeenCalled();
    });

    it('throws when there is no active assignment on the source branch', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({ id: 'b', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(
        null,
      );
      await expect(
        d.service.transfer(
          't1',
          'm1',
          { fromBranchId: 'b1', toBranchId: 'b2' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('changeRole (UC-04-08)', () => {
    it('rejects when neither role nor scope are provided (precondition)', async () => {
      const d = build();
      await expect(
        d.service.changeRole('t1', 'm1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('updates the role and scope of an active membership', async () => {
      const d = build();
      const membership = activeMembership();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);

      const res = await d.service.changeRole(
        't1',
        'm1',
        { role: 'ADMIN', accessScope: 'BRANCH' } as any,
        actor,
      );

      expect(membership.tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
      expect(membership.accessScopeConceptId).toBe(DIR.SCOPE_BRANCH);
      expect(res.tenantRole).toBe(DIR.ROLE_ADMIN);
    });
  });

  describe('offboard (UC-04-09)', () => {
    it('ends the membership and cascades to its active branch assignments', async () => {
      const d = build();
      const membership = activeMembership();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      const assignment = {
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
        updatedAt: new Date(),
      };
      d.branchMembershipsRepo.findByMembershipAndStatus.mockResolvedValue([
        assignment,
      ]);

      const res = await d.service.offboard('t1', 'm1', actor);

      expect(res).toEqual({ ok: true });
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
      expect(membership.endDate).toBeInstanceOf(Date);
      expect(assignment.statusConceptId).toBe(DIR.BRANCH_MEMBERSHIP_ENDED);
    });

    it('rejects offboarding a non-active membership (precondition)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(
        activeMembership({ statusConceptId: DIR.MEMBERSHIP_ENDED }),
      );
      await expect(
        d.service.offboard('t1', 'm1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('jerarquía del OWNER (invite / changeRole / offboard)', () => {
    // El poder sobre la propiedad lo decide TenantAdministrationService (spec propio);
    // acá se prueba que cada operación consulte la barrera correcta y que el 403 corte
    // la transacción antes de escribir nada.

    it('invitar como OWNER exige la barrera de propiedad', async () => {
      const d = build();
      d.tenantAdmin.assertCanChangeOwnership.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.invite('t1', { userId: 'u2', role: 'OWNER' } as any, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.membershipsRepo.create).not.toHaveBeenCalled();
    });

    it('invitar como STAFF no consulta la barrera de propiedad', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue(activeMembership());

      await d.service.invite('t1', { userId: 'u2', role: 'STAFF' }, actor);

      expect(d.tenantAdmin.assertCanChangeOwnership).not.toHaveBeenCalled();
    });

    it('promover a OWNER exige la barrera de propiedad', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.tenantAdmin.assertCanChangeOwnership.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.changeRole('t1', 'm1', { role: 'OWNER' } as any, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('tocar la membresía de un OWNER —aunque sea sólo el scope— exige la barrera', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(
        activeMembership({ tenantRoleConceptId: DIR.ROLE_OWNER }),
      );
      d.tenantAdmin.assertCanChangeOwnership.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.changeRole(
          't1',
          'm1',
          { accessScope: 'BRANCH' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('degrada a un OWNER cuando queda otro (dos activos)', async () => {
      const d = build();
      const membership = activeMembership({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.membershipsRepo.countActiveByTenantRole.mockResolvedValue(2);

      const res = await d.service.changeRole(
        't1',
        'm1',
        { role: 'ADMIN' } as any,
        actor,
      );

      expect(membership.tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
      expect(res.tenantRole).toBe(DIR.ROLE_ADMIN);
    });

    it('no degrada al último OWNER (precondition, también para la plataforma)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(
        activeMembership({ tenantRoleConceptId: DIR.ROLE_OWNER }),
      );
      d.membershipsRepo.countActiveByTenantRole.mockResolvedValue(1);

      await expect(
        d.service.changeRole('t1', 'm1', { role: 'ADMIN' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no da de baja al último OWNER (precondition)', async () => {
      const d = build();
      const membership = activeMembership({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.membershipsRepo.countActiveByTenantRole.mockResolvedValue(1);

      await expect(
        d.service.offboard('t1', 'm1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    });

    it('da de baja a un OWNER cuando queda otro, pasando por la barrera', async () => {
      const d = build();
      const membership = activeMembership({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.membershipsRepo.countActiveByTenantRole.mockResolvedValue(2);

      const res = await d.service.offboard('t1', 'm1', actor);

      expect(res).toEqual({ ok: true });
      expect(d.tenantAdmin.assertCanChangeOwnership).toHaveBeenCalledWith(
        d.tx,
        't1',
        actor,
      );
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    });

    it('dar de baja a un STAFF no consulta la barrera de propiedad ni cuenta OWNERs', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());

      await d.service.offboard('t1', 'm1', actor);

      expect(d.tenantAdmin.assertCanChangeOwnership).not.toHaveBeenCalled();
      expect(d.membershipsRepo.countActiveByTenantRole).not.toHaveBeenCalled();
    });
  });

  /**
   * La membresía que concede aprobar un vínculo médico–organización
   * (MAC-VINCULO). No es una invitación: la organización ya decidió, así que no
   * vuelve a preguntar quién administra ni falla si la persona ya estaba dentro.
   */
  describe('ensureMembresiaAsistencial', () => {
    const params = {
      userId: 'user-med',
      tenantId: 't1',
      actorUserId: 'admin-1',
    };

    it('crea la membresía con el rol acotado cuando no había ninguna', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue({ id: 'm-nueva' });

      const res = await d.service.ensureCareMembership(d.tx as any, params);

      expect(res).toEqual({ membership: { id: 'm-nueva' }, creada: true });
      const [, data] = d.membershipsRepo.create.mock.calls.at(-1);
      expect(data).toMatchObject({
        userId: 'user-med',
        tenantId: 't1',
        tenantRoleConceptId: DIR.ROLE_PRACTITIONER,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        invitedByUserId: 'admin-1',
        originConceptId: DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED,
      });
    });

    /**
     * Una membresía que existía solo por un vínculo de apoyo deja de depender
     * de él cuando se aprueba al profesional: terminar el vínculo no puede
     * cerrarle la membresía al doctor.
     */
    it('N10c: la membresía de solo-apoyo que recibe al profesional deja de ser solo-apoyo', async () => {
      const d = build();
      const existing = {
        id: 'm-apoyo',
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      };
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(existing);

      await d.service.ensureCareMembership(d.tx as any, params);

      expect(existing.originConceptId).toBe(DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED);
    });

    it('N10c: no toca el origen de una membresía existente que no era de apoyo', async () => {
      const d = build();
      const existing = {
        id: 'm-vieja',
        originConceptId: DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
      };
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(existing);

      await d.service.ensureCareMembership(d.tx as any, params);

      expect(existing.originConceptId).toBe(
        DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
      );
    });

    /**
     * El rol asistencial es el piso, no el techo: si la persona ya administra
     * la organización, aprobarle un vínculo no puede quitarle atribuciones.
     * Aprobar sólo suma acceso.
     */
    it('no degrada a quien ya era ADMIN de la organización', async () => {
      const d = build();
      const existing = {
        id: 'm-vieja',
        tenantRoleConceptId: DIR.ROLE_ADMIN,
      };
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(existing);

      const res = await d.service.ensureCareMembership(d.tx as any, params);

      expect(res).toEqual({ membership: existing, creada: false });
      expect(d.membershipsRepo.create).not.toHaveBeenCalled();
      expect(existing.tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
    });

    /**
     * No hay unique (user, tenant) en la base: la guarda contra la fila
     * duplicada es ésta y sólo ésta.
     */
    it('busca la membresía activa antes de escribir', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue({ id: 'm-nueva' });

      await d.service.ensureCareMembership(d.tx as any, params);

      expect(d.membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
        d.tx,
        'user-med',
        't1',
        DIR.MEMBERSHIP_ACTIVE,
      );
    });

    /**
     * Corre dentro de la transacción de la decisión: abrir una propia o
     * flushear por su cuenta partiría en dos lo que debe pasar junto.
     */
    it('no abre transacción propia ni flushea', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue({ id: 'm-nueva' });

      await d.service.ensureCareMembership(d.tx as any, params);

      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    /** La organización ya decidió: volver a preguntar sería preguntar de más. */
    it('no vuelve a exigir permisos de administración', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue({ id: 'm-nueva' });

      await d.service.ensureCareMembership(d.tx as any, params);

      expect(d.tenantAdmin.assertCanAdminister).not.toHaveBeenCalled();
    });
  });
});
