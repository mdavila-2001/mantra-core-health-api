import { describe, expect, it, jest } from '@jest/globals';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { PRAC } from '../practice.concepts';
import { INFRA_F2_POLICY } from '../policies/infra-f2.policy';
import { grantContains, rolesOn } from '../domain/ops/infra-scope';
import {
  InfraPolicyRegistry,
  InfrastructureAccessService,
} from './infrastructure-access.service';
import { translateInfraWriteError } from './ops/ops-errors';

const TENANT = 't-1';
const site = { id: 'site-1', tenantId: TENANT, practiceId: 'p-1' };
const bed = {
  id: 'bed-1',
  tenantId: TENANT,
  practiceSiteId: site.id,
  spaceTypeConceptId: PRAC.SPACE_FN_BED_STANDARD,
};

function build(
  grants: any[] = [],
  adminLevel: string | null = null,
  space: Record<string, unknown> = bed,
) {
  const registry = new InfraPolicyRegistry();
  registry.register(INFRA_F2_POLICY);
  const structureAccess = {
    adminLevelOf: jest.fn<any>().mockResolvedValue(adminLevel),
  };
  const opsRepo = {
    chain: jest.fn<any>().mockResolvedValue([{ id: bed.id }, { id: 'room-1' }]),
    unitsOf: jest.fn<any>().mockResolvedValue(['unit-1']),
    grants: jest.fn<any>().mockResolvedValue(grants),
  };
  const sitesRepo = { findById: jest.fn<any>().mockResolvedValue(site) };
  const spacesRepo = { findById: jest.fn<any>().mockResolvedValue(space) };
  const unitsRepo = { findById: jest.fn() };
  const svc = new InfrastructureAccessService(
    registry,
    structureAccess as any,
    opsRepo as any,
    sitesRepo as any,
    spacesRepo as any,
    unitsRepo as any,
  );
  return { svc, opsRepo };
}

const actor = { id: 'u-1', roles: [] } as any;
const grant = (
  role: string,
  scope: string,
  extra: Record<string, string> = {},
) => ({
  role_id: role,
  scope_id: scope,
  practice_id: 'p-1',
  practice_site_id: site.id,
  clinical_unit_id: null,
  care_space_id: null,
  ...extra,
});

describe('InfrastructureAccessService (§0.3)', () => {
  it('permitido: Limpieza con alcance SITE inicia limpieza en una cama de la sede', async () => {
    const { svc } = build([
      grant(DELEG.ASSIGN_ROLE_HOUSEKEEPING, DELEG.SCOPE_SITE),
    ]);
    const { roles } = await svc.assertCan(
      actor,
      'f2.cleaning.work',
      { careSpaceId: bed.id },
      {} as any,
      TENANT,
    );
    expect(roles.has('HOUSEKEEPING')).toBe(true);
  });

  it('fail-closed por tenant: el espacio de otro tenant es 404, sin consultar roles', async () => {
    const { svc, opsRepo } = build([
      grant(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SITE),
    ]);
    await expect(
      svc.assertCan(
        actor,
        'f2.cleaning.work',
        { careSpaceId: bed.id },
        {} as any,
        'otro-tenant',
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(opsRepo.grants).not.toHaveBeenCalled();
  });

  it('fail-closed por rol: Limpieza no bloquea → 403 INFRA_ACTION_NOT_ALLOWED con requiredRoles', async () => {
    const { svc } = build([
      grant(DELEG.ASSIGN_ROLE_HOUSEKEEPING, DELEG.SCOPE_SITE),
    ]);
    await expect(
      svc.assertCan(
        actor,
        'f2.availability.clinical',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
      details: { requiredRoles: ['NURSE'] },
    });
  });

  it('alcance SPACE: vale para la habitación que contiene la cama y no para otra', async () => {
    const inRoom = build([
      grant(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SPACE, {
        care_space_id: 'room-1',
      }),
    ]);
    await expect(
      inRoom.svc.assertCan(
        actor,
        'f2.isolation.set',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).resolves.toBeDefined();
    const elsewhere = build([
      grant(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SPACE, {
        care_space_id: 'room-9',
      }),
    ]);
    await expect(
      elsewhere.svc.assertCan(
        actor,
        'f2.isolation.set',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('admin de organización bloquea por motivo administrativo; Jefe QX sólo en quirófanos', async () => {
    const admin = build([], 'ORG');
    await expect(
      admin.svc.assertCan(
        actor,
        'f2.availability.admin',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).resolves.toBeDefined();
    const orManager = build([
      grant(DELEG.ASSIGN_ROLE_OR_MANAGER, DELEG.SCOPE_SITE),
    ]);
    await expect(
      orManager.svc.assertCan(
        actor,
        'f2.availability.admin',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('roles globales sólo cuentan para su objetivo (revisión de seguridad)', () => {
  const periopAdmin = { id: 'u-9', roles: ['PERIOP_ADMIN'] } as any;
  const orRoom = {
    ...bed,
    id: 'or-1',
    spaceTypeConceptId: PRAC.SPACE_FN_OPERATING_ROOM,
  };

  it('PERIOP_ADMIN global no bloquea ni limpia una cama (403)', async () => {
    const { svc } = build();
    for (const action of [
      'f2.availability.clinical',
      'f2.cleaning.create',
      'f2.hygiene.mark-dirty',
      'f2.board.read',
    ]) {
      await expect(
        svc.assertCan(
          periopAdmin,
          action,
          { careSpaceId: bed.id },
          {} as any,
          TENANT,
        ),
      ).rejects.toMatchObject({
        status: 403,
        reason: 'INFRA_ACTION_NOT_ALLOWED',
      });
    }
  });

  it('PERIOP_ADMIN global sí opera un quirófano de su tenant', async () => {
    const { svc } = build([], null, orRoom);
    for (const action of [
      'f2.availability.clinical',
      'f2.cleaning.create',
      'f2.hygiene.mark-dirty',
    ]) {
      await expect(
        svc.assertCan(
          periopAdmin,
          action,
          { careSpaceId: orRoom.id },
          {} as any,
          TENANT,
        ),
      ).resolves.toBeDefined();
    }
  });

  it('PERIOP_ADMIN global no opera un quirófano de otro tenant (404)', async () => {
    const { svc } = build([], null, { ...orRoom, tenantId: 'otro-tenant' });
    await expect(
      svc.assertCan(
        periopAdmin,
        'f2.availability.clinical',
        { careSpaceId: orRoom.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('BILLING global no cuenta en acciones que no lo nombran', async () => {
    const { svc } = build();
    const billing = { id: 'u-8', roles: ['BILLING'] } as any;
    await expect(
      svc.assertCan(
        billing,
        'f2.board.read',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('Jefe QX asignado (SITE) tampoco opera camas: OR_MANAGER va sólo en operatingRoomRoles', async () => {
    const { svc } = build([
      grant(DELEG.ASSIGN_ROLE_OR_MANAGER, DELEG.SCOPE_SITE),
    ]);
    await expect(
      svc.assertCan(
        actor,
        'f2.cleaning.create',
        { careSpaceId: bed.id },
        {} as any,
        TENANT,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('infra-scope (puro)', () => {
  const target = {
    practiceId: 'p',
    siteId: 's',
    unitIds: ['u1'],
    spaceChain: ['bed', 'room'],
  };

  it('UNIT contiene por vínculo; supervisión implica el rol base', () => {
    expect(
      grantContains({ role: 'NURSE', scope: 'UNIT', unitId: 'u1' }, target),
    ).toBe(true);
    const roles = rolesOn(
      [],
      [{ role: 'NURSE_SUPERVISOR', scope: 'SITE', siteId: 's' }],
      target,
    );
    expect([...roles].sort()).toEqual(['NURSE', 'NURSE_SUPERVISOR']);
  });

  it('una asignación de otra sede no cuenta', () => {
    expect(
      rolesOn([], [{ role: 'NURSE', scope: 'SITE', siteId: 'otra' }], target)
        .size,
    ).toBe(0);
  });
});

describe('translateInfraWriteError (§0.2)', () => {
  it('23503 de FK compuesta → 404 sin detalle', () => {
    const err = translateInfraWriteError({
      code: '23503',
      constraint: 'fk_cleaning_orders_tenant_space',
    }) as any;
    expect(err.getStatus()).toBe(404);
    expect(err.details).toBeUndefined();
  });

  it('23P01 del mapa → 409 con su reason; otro error se relanza igual', () => {
    const err = translateInfraWriteError({
      code: '23P01',
      constraint: 'ex_care_space_blocks_time',
    }) as any;
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('BLOCK_OVERLAP');
    const other = new Error('x');
    expect(translateInfraWriteError(other)).toBe(other);
  });
});
