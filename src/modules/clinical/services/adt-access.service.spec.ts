import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { INFRA_F3_ACTIONS } from '../policies/infra-f3.policy';
import { AdtAccessService } from './adt-access.service';

const fn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const actor = { id: 'u1', roles: ['PATIENT'] } as any;

interface Fixtures {
  siteTenant?: string;
  spaceTenant?: string;
  assignments?: any[];
  path?: any[];
  access?: any;
}

function build(f: Fixtures = {}) {
  const tx = {
    execute: fn(async (sql: string) => {
      if (sql.includes('from practice.practice_sites'))
        return [
          {
            id: 's1',
            tenant_id: f.siteTenant ?? TENANT,
            practice_id: 'p1',
            branch_id: null,
          },
        ];
      if (
        sql.includes(
          'select practice_site_id, tenant_id from practice.care_spaces',
        )
      )
        return [{ practice_site_id: 's1', tenant_id: f.spaceTenant ?? TENANT }];
      if (sql.includes('with recursive path'))
        return (
          f.path ?? [
            { id: 'bed', clinical_unit_id: 'u-med', assigned: null },
            { id: 'room', clinical_unit_id: null, assigned: ['u-shared'] },
          ]
        );
      if (sql.includes('organization_user_assignments'))
        return f.assignments ?? [];
      return [];
    }),
  } as any;
  const structure = {
    resolve: fn().mockResolvedValue(
      f.access ?? { level: 'NONE', branchIds: new Set() },
    ),
    canSee: fn().mockReturnValue(true),
  };
  const repo = {
    authoritativeLocation: fn().mockResolvedValue(null),
  };
  return {
    tx,
    service: new AdtAccessService(structure as any, repo as any),
    structure,
    repo,
  };
}

const row = (
  role: string,
  scope: string,
  ids: Record<string, string> = {},
) => ({
  role,
  scope,
  practice_id: null,
  practice_site_id: null,
  clinical_unit_id: null,
  care_space_id: null,
  ...ids,
});

const inTenant = <T>(fnc: () => Promise<T>): Promise<T> =>
  runWithTenant(TENANT, fnc);

describe('AdtAccessService', () => {
  it('un espacio o una sede de otro tenant responde 404 uniforme, antes de mirar roles', async () => {
    for (const make of [
      (b: ReturnType<typeof build>) => b.service.forSpace(b.tx, 'x', actor),
      (b: ReturnType<typeof build>) => b.service.forSite(b.tx, 'x', actor),
    ]) {
      const b = build({ siteTenant: OTHER, spaceTenant: OTHER });
      await expect(inTenant(() => make(b))).rejects.toMatchObject({
        status: 404,
        reason: 'ADT_RESOURCE_OUT_OF_SCOPE',
      });
      expect(b.structure.resolve).not.toHaveBeenCalled();
    }
  });

  it('el alcance de SEDE contiene la cama; el de UNIDAD, sólo si es la del espacio o de sus ancestros (vínculos incluidos)', async () => {
    const site = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SITE, {
          practice_site_id: 's1',
        }),
      ],
    });
    const s1 = await inTenant(() =>
      site.service.forSpace(site.tx, 'bed', actor),
    );
    expect(site.service.can(s1, INFRA_F3_ACTIONS.TRANSFER)).toBe(true);

    for (const unit of ['u-med', 'u-shared']) {
      const b = build({
        assignments: [
          row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_UNIT, {
            clinical_unit_id: unit,
          }),
        ],
      });
      const scope = await inTenant(() =>
        b.service.forSpace(b.tx, 'bed', actor),
      );
      expect(b.service.can(scope, INFRA_F3_ACTIONS.ADMIT)).toBe(true);
    }
    const other = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_UNIT, {
          clinical_unit_id: 'u-otra',
        }),
      ],
    });
    const none = await inTenant(() =>
      other.service.forSpace(other.tx, 'bed', actor),
    );
    expect(other.service.can(none, INFRA_F3_ACTIONS.ADMIT)).toBe(false);
  });

  it('el alcance de ESPACIO contiene al espacio y a sus descendientes', async () => {
    const b = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SPACE, {
          care_space_id: 'room',
        }),
      ],
    });
    const scope = await inTenant(() => b.service.forSpace(b.tx, 'bed', actor));
    expect(b.service.can(scope, INFRA_F3_ACTIONS.DISCHARGE)).toBe(true);
    const lejos = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_SPACE, {
          care_space_id: 'otro',
        }),
      ],
    });
    const sin = await inTenant(() =>
      lejos.service.forSpace(lejos.tx, 'bed', actor),
    );
    expect(lejos.service.can(sin, INFRA_F3_ACTIONS.DISCHARGE)).toBe(false);
  });

  it('sobre una sede (sin cama) sólo contienen el alcance de sede, práctica o tenant, no uno de unidad o de espacio', async () => {
    const unit = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_UNIT, {
          clinical_unit_id: 'u-med',
        }),
      ],
    });
    const s = await inTenant(() => unit.service.forSite(unit.tx, 's1', actor));
    expect(unit.service.can(s, INFRA_F3_ACTIONS.ADMIT)).toBe(false);
    const practice = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE, DELEG.SCOPE_PRACTICE, {
          practice_id: 'p1',
        }),
      ],
    });
    expect(
      practice.service.can(
        await inTenant(() =>
          practice.service.forSite(practice.tx, 's1', actor),
        ),
        INFRA_F3_ACTIONS.ADMIT,
      ),
    ).toBe(true);
    const tenant = build({
      assignments: [row(DELEG.ASSIGN_ROLE_ADMISSION, DELEG.SCOPE_TENANT)],
    });
    expect(
      tenant.service.can(
        await inTenant(() => tenant.service.forSite(tenant.tx, 's1', actor)),
        INFRA_F3_ACTIONS.ADMIT,
      ),
    ).toBe(true);
  });

  it('la supervisión implica el rol de piso; Limpieza no tiene ninguna acción de F3', async () => {
    const sup = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR, DELEG.SCOPE_SITE, {
          practice_site_id: 's1',
        }),
      ],
    });
    const scope = await inTenant(() =>
      sup.service.forSite(sup.tx, 's1', actor),
    );
    expect(scope.operational.has('NURSE')).toBe(true);
    expect(sup.service.can(scope, INFRA_F3_ACTIONS.OVERRIDE)).toBe(true);

    const clean = build({
      assignments: [
        row(DELEG.ASSIGN_ROLE_HOUSEKEEPING, DELEG.SCOPE_SITE, {
          practice_site_id: 's1',
        }),
      ],
    });
    // la consulta ni siquiera pide el rol de limpieza
    const cs = await inTenant(() =>
      clean.service.forSite(clean.tx, 's1', actor),
    );
    for (const action of Object.values(INFRA_F3_ACTIONS))
      expect(clean.service.can(cs, action)).toBe(false);
  });

  it('assertCan responde 403 INFRA_ACTION_NOT_ALLOWED con los roles que sí pueden', async () => {
    const b = build();
    const scope = await inTenant(() => b.service.forSite(b.tx, 's1', actor));
    try {
      b.service.assertCan(scope, INFRA_F3_ACTIONS.CENSUS_ADJUST);
      throw new Error('no lanzó');
    } catch (error: any) {
      expect(error.status).toBe(403);
      expect(error.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(error.details.requiredRoles).toEqual([
        'NURSE_SUPERVISOR',
        'ORG_ADMIN',
        'BRANCH_ADMIN',
      ]);
    }
  });

  it('los administradores de la organización y de sucursal ven y cierran el censo pero no operan camas; la plataforma sólo lee', async () => {
    const levels: [string, string[]][] = [
      ['ORG', ['ORG_ADMIN']],
      ['PLATFORM', ['PLATFORM']],
      ['BRANCH_ADMIN', ['BRANCH_ADMIN']],
    ];
    for (const [level, expected] of levels) {
      const b = build({ access: { level, branchIds: new Set() } });
      const scope = await inTenant(() => b.service.forSite(b.tx, 's1', actor));
      expect([...scope.admin]).toEqual(expected);
      expect(b.service.can(scope, INFRA_F3_ACTIONS.ADMIT)).toBe(false);
      expect(b.service.can(scope, INFRA_F3_ACTIONS.CENSUS_VIEW)).toBe(true);
      expect(b.service.can(scope, INFRA_F3_ACTIONS.CENSUS_CLOSE)).toBe(
        level !== 'PLATFORM',
      );
    }
    // un admin de sucursal que no ve la sede no obtiene el rol
    const b = build({
      access: { level: 'BRANCH_ADMIN', branchIds: new Set() },
    });
    b.structure.canSee.mockReturnValue(false);
    const scope = await inTenant(() => b.service.forSite(b.tx, 's1', actor));
    expect(scope.admin.size).toBe(0);
  });

  it('el rol global BILLING da lectura del censo y los indicadores, nada más', async () => {
    const b = build();
    const billing = {
      id: 'u2',
      roles: ['BILLING'],
      tenantIds: [TENANT],
    } as any;
    const scope = await inTenant(() => b.service.forSite(b.tx, 's1', billing));
    expect(b.service.can(scope, INFRA_F3_ACTIONS.INDICATORS_VIEW)).toBe(true);
    expect(b.service.can(scope, INFRA_F3_ACTIONS.CENSUS_CLOSE)).toBe(false);
    expect(b.service.can(scope, INFRA_F3_ACTIONS.INPATIENT_VIEW)).toBe(false);
  });

  describe('forEncounter · la autoridad sale de la ubicación autoritativa', () => {
    const loc = (over: Record<string, unknown> = {}) => ({
      id: 'l1',
      careSpaceId: 'bed',
      practiceSiteId: 's1',
      ...over,
    });

    it('con cama activa resuelve el alcance de esa cama; sin cama, el de la sede', async () => {
      const bed = build();
      bed.repo.authoritativeLocation.mockResolvedValue(loc());
      await inTenant(() => bed.service.forEncounter(bed.tx, 'e1', actor));
      expect(
        bed.tx.execute.mock.calls.some(([q]: [string]) =>
          q.includes('from practice.care_spaces'),
        ),
      ).toBe(true);

      const site = build();
      site.repo.authoritativeLocation.mockResolvedValue(
        loc({ careSpaceId: null }),
      );
      await inTenant(() => site.service.forEncounter(site.tx, 'e1', actor));
      expect(
        site.tx.execute.mock.calls.some(([q]: [string]) =>
          q.includes('from practice.care_spaces'),
        ),
      ).toBe(false);
    });

    it('sin ubicación autoritativa (sólo reservas o filas canceladas) ⇒ 404 uniforme, sin mirar roles', async () => {
      const b = build();
      b.repo.authoritativeLocation.mockResolvedValue(null);
      await expect(
        inTenant(() => b.service.forEncounter(b.tx, 'e1', actor)),
      ).rejects.toMatchObject({
        status: 404,
        reason: 'ADT_RESOURCE_OUT_OF_SCOPE',
      });
      expect(b.structure.resolve).not.toHaveBeenCalled();
    });

    it('la lectura histórica sólo se pide cuando el llamador la autoriza', async () => {
      const b = build();
      b.repo.authoritativeLocation.mockResolvedValue(loc());
      await inTenant(() => b.service.forEncounter(b.tx, 'e1', actor));
      await inTenant(() =>
        b.service.forEncounter(b.tx, 'e1', actor, { historical: true }),
      );
      expect(b.repo.authoritativeLocation.mock.calls).toEqual([
        [b.tx, 'e1', false],
        [b.tx, 'e1', true],
      ]);
    });
  });
});
