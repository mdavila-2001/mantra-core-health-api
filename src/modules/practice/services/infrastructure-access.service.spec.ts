import { runWithTenant } from '../../../common';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { FUNCTIONS } from '../infrastructure-catalog';
import { INFRA_F2_POLICY } from '../policies/infra-f2.policy';
import { InfraPolicyRegistry } from '../policies/infra-policy';
import { InfrastructureAccessService } from './infrastructure-access.service';
import { SITE, TENANT, actor, fn } from './ops.testing';

const SPACE = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const OTHER_UNIT = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const UNIT = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

interface World {
  level?: 'PLATFORM' | 'ORG' | 'BRANCH_ADMIN' | 'MEMBER' | 'NONE';
  canSee?: boolean;
  spaceFunction?: string;
  spaceExists?: boolean;
  assignments?: {
    role: string;
    scope: string;
    unitId?: string;
    spaceId?: string;
    siteId?: string;
  }[];
  /** Unidades que contienen al espacio (con las superiores). */
  containingUnits?: string[];
  /** Espacio y ancestros. */
  containingSpaces?: string[];
}

function build(world: World = {}) {
  const registry = new InfraPolicyRegistry();
  registry.register(INFRA_F2_POLICY);
  const structure = {
    resolve: fn().mockResolvedValue({
      level: world.level ?? 'MEMBER',
      branchIds: new Set(),
    }),
    canSee: fn().mockReturnValue(world.canSee ?? true),
  };
  const memberships = {
    findActiveByUserTenant: fn().mockResolvedValue({ id: 'membership-1' }),
  };
  const tx = {
    execute: fn(async (sql: string) => {
      if (
        sql.includes('from practice.care_spaces cs') &&
        sql.includes('join practice.practice_sites s')
      ) {
        return world.spaceExists === false
          ? []
          : [
              {
                id: SPACE,
                parent_space_id: null,
                space_type_concept_id: FUNCTIONS.byInput(
                  world.spaceFunction ?? 'SPACE_FN_BED_STANDARD',
                )!.id,
                practice_site_id: SITE,
                practice_id: 'practice-1',
                branch_id: null,
              },
            ];
      }
      if (sql.includes('from practice.practice_sites s')) {
        return [{ id: SITE, practice_id: 'practice-1', branch_id: null }];
      }
      if (sql.includes('organization_user_assignments')) {
        return (world.assignments ?? []).map((a) => ({
          assignment_role_concept_id: a.role,
          access_scope_concept_id: a.scope,
          practice_id: null,
          practice_site_id: a.siteId ?? null,
          clinical_unit_id: a.unitId ?? null,
          care_space_id: a.spaceId ?? null,
        }));
      }
      if (sql.includes('with recursive anc')) {
        return [
          ...(world.containingSpaces ?? [SPACE]).map((id) => ({
            kind: 'space',
            id,
          })),
          ...(world.containingUnits ?? []).map((id) => ({ kind: 'unit', id })),
        ];
      }
      if (sql.includes('from practice.clinical_units where practice_site_id')) {
        return [{ id: UNIT }, { id: OTHER_UNIT }];
      }
      if (sql.includes('from practice.care_spaces where practice_site_id')) {
        return [{ id: SPACE }, { id: 'room-1' }, { id: 'room-2' }];
      }
      return [];
    }),
  };
  const service = new InfrastructureAccessService(
    structure as any,
    memberships as any,
    registry,
  );
  const can = (action: string, target: any = { careSpaceId: SPACE }) =>
    runWithTenant(TENANT, () =>
      service.assertCan(actor, action, target, tx as any),
    );
  return { service, can, structure, memberships, tx };
}

const nurseUnit = {
  role: DELEG.ASSIGN_ROLE_NURSE,
  scope: DELEG.SCOPE_UNIT,
  unitId: UNIT,
};

describe('InfrastructureAccessService.assertCan', () => {
  it('un espacio de otro tenant, inexistente o fuera del alcance responde el mismo 404', async () => {
    const ausente = build({ spaceExists: false, level: 'ORG' });
    const fuera = build({ level: 'MEMBER' });
    const a = await ausente.can('infra.board.view').catch((e) => e);
    const b = await fuera.can('infra.board.view').catch((e) => e);
    expect(a.getStatus()).toBe(404);
    expect(b.getStatus()).toBe(404);
    expect(a.reason).toBe(b.reason);
    expect(a.details).toBeUndefined();
    expect(b.details).toBeUndefined();
  });

  it('administrar la organización: bloqueo administrativo sí; higiene no, con los roles requeridos (INV-44)', async () => {
    const d = build({ level: 'ORG' });
    const ok = await d.can('infra.block.admin');
    expect(ok.actingRoles).toEqual(['ORG_ADMIN']);
    await expect(d.can('infra.hygiene.mark-dirty')).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
      details: {
        action: 'infra.hygiene.mark-dirty',
        requiredRoles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'],
      },
    });
  });

  it('la plataforma actúa como soporte: lee el tablero y bloquea administrativamente, no bloquea clínicamente', async () => {
    const d = build({ level: 'PLATFORM' });
    expect((await d.can('infra.board.view')).actingRoles).toEqual([
      'SUPERADMIN',
    ]);
    expect((await d.can('infra.block.admin')).actingRoles).toEqual([
      'SUPERADMIN',
    ]);
    await expect(d.can('infra.block.clinical')).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      d.can('infra.cleaning.list', { siteId: SITE }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it('un administrador de sucursal que no ve la sede no obtiene rol alguno: 404', async () => {
    const d = build({ level: 'BRANCH_ADMIN', canSee: false });
    await expect(d.can('infra.board.view')).rejects.toMatchObject({
      status: 404,
    });
    const visible = build({ level: 'BRANCH_ADMIN', canSee: true });
    expect((await visible.can('infra.board.view')).actingRoles).toEqual([
      'BRANCH_ADMIN',
    ]);
  });

  it('enfermería con alcance de unidad opera los espacios que esa unidad contiene y los demás son 404', async () => {
    const dentro = build({ assignments: [nurseUnit], containingUnits: [UNIT] });
    const grant = await dentro.can('infra.hygiene.mark-dirty');
    expect(grant.actingRoles).toEqual(['NURSE']);
    expect(grant.grants[0]).toMatchObject({
      role: 'NURSE',
      wide: false,
      unitId: UNIT,
    });
    const fuera = build({
      assignments: [nurseUnit],
      containingUnits: [OTHER_UNIT],
    });
    await expect(fuera.can('infra.hygiene.mark-dirty')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('el alcance de espacio cubre al espacio y a sus descendientes, no a un hermano', async () => {
    const asignacion = {
      role: DELEG.ASSIGN_ROLE_NURSE,
      scope: DELEG.SCOPE_SPACE,
      spaceId: 'room-1',
    };
    const dentro = build({
      assignments: [asignacion],
      containingSpaces: [SPACE, 'room-1'],
    });
    expect((await dentro.can('infra.isolation.set')).actingRoles).toEqual([
      'NURSE',
    ]);
    const hermano = build({
      assignments: [asignacion],
      containingSpaces: [SPACE, 'room-2'],
    });
    await expect(hermano.can('infra.isolation.set')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('con alcance de sede, Limpieza ve el tablero pero no bloquea ni aísla (403, no 404)', async () => {
    const d = build({
      assignments: [
        {
          role: DELEG.ASSIGN_ROLE_HOUSEKEEPING,
          scope: DELEG.SCOPE_SITE,
          siteId: SITE,
        },
      ],
    });
    expect((await d.can('infra.board.view')).actingRoles).toEqual([
      'HOUSEKEEPING',
    ]);
    for (const action of [
      'infra.block.clinical',
      'infra.block.admin',
      'infra.isolation.set',
    ]) {
      await expect(d.can(action)).rejects.toMatchObject({
        status: 403,
        reason: 'INFRA_ACTION_NOT_ALLOWED',
      });
    }
  });

  it('el supervisor puede lo que el operario; el operario no inspecciona una limpieza terminal', async () => {
    const sup = build({
      assignments: [
        {
          role: DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR,
          scope: DELEG.SCOPE_SITE,
          siteId: SITE,
        },
      ],
    });
    expect((await sup.can('infra.cleaning.work')).actingRoles).toEqual([
      'HOUSEKEEPING',
    ]);
    expect(
      (await sup.can('infra.cleaning.inspect-terminal')).actingRoles,
    ).toEqual(['HOUSEKEEPING_SUPERVISOR']);
    const operario = build({
      assignments: [
        {
          role: DELEG.ASSIGN_ROLE_HOUSEKEEPING,
          scope: DELEG.SCOPE_SITE,
          siteId: SITE,
        },
      ],
    });
    await expect(
      operario.can('infra.cleaning.inspect-terminal'),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it('el jefe de quirófano solo opera quirófanos', async () => {
    const asignacion = [
      {
        role: DELEG.ASSIGN_ROLE_OR_MANAGER,
        scope: DELEG.SCOPE_SITE,
        siteId: SITE,
      },
    ];
    const quirofano = build({
      assignments: asignacion,
      spaceFunction: 'SPACE_FN_OPERATING_ROOM',
    });
    expect((await quirofano.can('infra.block.admin')).actingRoles).toEqual([
      'OR_MANAGER',
    ]);
    const cama = build({ assignments: asignacion });
    await expect(cama.can('infra.block.admin')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('un miembro sin ninguna asignación operativa no tiene rol: 404; sin membresía tampoco consulta asignaciones', async () => {
    const sinAsignacion = build({ level: 'MEMBER', assignments: [] });
    await expect(
      sinAsignacion.can('infra.board.view', { siteId: SITE }),
    ).rejects.toMatchObject({
      status: 404,
    });
    const ajeno = build({ level: 'NONE', assignments: [nurseUnit] });
    await expect(ajeno.can('infra.board.view')).rejects.toMatchObject({
      status: 404,
    });
    expect(
      ajeno.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('organization_user_assignments'),
      ),
    ).toBe(false);
  });

  it('las asignaciones se consultan activas y vigentes, del tenant del contexto', async () => {
    const d = build({ assignments: [nurseUnit], containingUnits: [UNIT] });
    await d.can('infra.board.view');
    const [sql, params] = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('organization_user_assignments'),
    );
    expect(sql).toMatch(/status_concept_id = \?/);
    expect(sql).toMatch(/valid_to is null or a\.valid_to > \?/);
    expect(params).toContain(CONCEPTS.STATE_ACTIVE);
    expect(d.memberships.findActiveByUserTenant).toHaveBeenCalledWith(
      d.tx,
      actor.id,
      TENANT,
      expect.any(String),
    );
  });

  it('una acción que ninguna franja declara es un error de programación, no un 403', async () => {
    const d = build({ level: 'ORG' });
    await expect(d.can('infra.nada')).rejects.toThrow('sin política');
  });
});
