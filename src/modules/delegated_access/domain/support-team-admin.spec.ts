import {
  checkDelegatedGrant,
  checkWholePersonScope,
  effectiveDelegationCeiling,
  partitionByScope,
  TEAM_ADMIN_PRESET_CEILING,
} from './support-team-admin';
import type { GrantTargetFacts } from './support-grant-targets';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const day = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);
const eco: GrantTargetFacts = {
  targetKind: 'SERVICE',
  healthcareServiceId: 'eco',
};
const card: GrantTargetFacts = {
  targetKind: 'SERVICE',
  healthcareServiceId: 'card',
};
const ceiling = TEAM_ADMIN_PRESET_CEILING;

describe('techo del jefe de servicio (D-10, preajuste)', () => {
  it('el preajuste da agenda, búsqueda exacta, ficha básica, bandeja y plantillas operativas, 180 días', () => {
    expect(ceiling.maxValidDays).toBe(180);
    expect(ceiling.templates).toEqual([
      'SECRETARY',
      'MEDICAL_ASSISTANT',
      'NURSING',
      'FRONT_DESK',
      'CALL_CENTER',
    ]);
    expect(ceiling.allowAtoms).toEqual(
      expect.arrayContaining([
        'agenda.*',
        'patients.search.exact',
        'patients.profile.view_basic',
        'messages.inbox.view',
      ]),
    );
  });

  it('techo efectivo = (allowAtoms ∩ techo de la plantilla) − forbidAtoms − átomos prohibidos al delegado − reglas de la organización', () => {
    const atoms = effectiveDelegationCeiling({
      ceiling,
      subjectTemplateCode: 'FRONT_DESK',
    });
    expect(atoms).toEqual(
      expect.arrayContaining([
        'agenda.appointment.view',
        'agenda.appointment.create',
        'patients.search.exact',
      ]),
    );
    expect(atoms).not.toContain('billing.payment.collect');
    // GP-5: aunque `agenda.*` lo permitiera, nunca los prohibidos a un delegado.
    expect(atoms.some((a) => a.startsWith('team.'))).toBe(false);
  });
  it('forbidAtoms y reglas CEILING/DENY de la organización lo recortan', () => {
    const base = effectiveDelegationCeiling({
      ceiling,
      subjectTemplateCode: 'FRONT_DESK',
    });
    const cut = effectiveDelegationCeiling({
      ceiling: { ...ceiling, forbidAtoms: ['agenda.appointment.cancel'] },
      subjectTemplateCode: 'FRONT_DESK',
      orgRules: [
        {
          kind: 'DENY_PERMISSION',
          permissionPattern: 'agenda.appointment.reschedule',
        },
        {
          kind: 'CEILING',
          roleTemplateCode: 'FRONT_DESK',
          permissionPattern: 'agenda.appointment.no_show',
        },
        {
          kind: 'CEILING',
          roleTemplateCode: 'SECRETARY',
          permissionPattern: 'agenda.appointment.create',
        },
      ],
    });
    expect(base).toEqual(
      expect.arrayContaining([
        'agenda.appointment.cancel',
        'agenda.appointment.reschedule',
      ]),
    );
    for (const gone of [
      'agenda.appointment.cancel',
      'agenda.appointment.reschedule',
    ])
      expect(cut).not.toContain(gone);
    expect(cut).toContain('agenda.appointment.create');
    expect(cut.length).toBeLessThan(base.length);
  });
  it('una plantilla fuera del techo de la organización o desconocida no tiene átomos', () => {
    expect(
      effectiveDelegationCeiling({
        ceiling,
        subjectTemplateCode: 'ORG_MANAGEMENT',
      }),
    ).toEqual([]);
    expect(
      effectiveDelegationCeiling({ ceiling, subjectTemplateCode: 'PROPIA' }),
    ).toEqual([]);
  });
  it('sin lista de plantillas en el techo, vale cualquiera de plataforma', () => {
    const atoms = effectiveDelegationCeiling({
      ceiling: { allowAtoms: ['agenda.*'] },
      subjectTemplateCode: 'SECRETARY',
    });
    expect(atoms.length).toBeGreaterThan(0);
  });
});

describe('checkDelegatedGrant · D-01 (§6.4 «Otorgar»)', () => {
  const base = {
    adminTargets: [eco],
    ceiling,
    subjectTemplateCode: 'FRONT_DESK',
    now: NOW,
  };
  const proposed = (
    target: GrantTargetFacts,
    atoms: string[],
    validTo?: Date,
  ) => ({ target, atoms, validTo });

  it('agenda ver+crear sobre Ecografía: 201', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(
          eco,
          ['agenda.appointment.view', 'agenda.appointment.create'],
          day(90),
        ),
      }),
    ).toEqual({ ok: true });
  });
  it('billing.payment.collect: 403 ADMIN_CEILING_EXCEEDED (no hay aprobación que lo salte)', () => {
    const r = checkDelegatedGrant({
      ...base,
      proposed: proposed(eco, ['billing.payment.collect'], day(90)),
    });
    expect(r).toMatchObject({
      ok: false,
      code: 'ADMIN_CEILING_EXCEEDED',
      httpStatus: 403,
      offendingAtoms: ['billing.payment.collect'],
    });
  });
  it('mismos átomos sobre Cardiología: 403 ADMIN_SCOPE_EXCEEDED (fuera de su alcance)', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(card, ['agenda.appointment.view'], day(90)),
      }),
    ).toMatchObject({
      ok: false,
      code: 'ADMIN_SCOPE_EXCEEDED',
      httpStatus: 403,
    });
  });
  it('valid_to a +200 días: 403 ADMIN_CEILING_EXCEEDED por maxValidDays (180)', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(eco, ['agenda.appointment.view'], day(200)),
      }),
    ).toMatchObject({
      ok: false,
      code: 'ADMIN_CEILING_EXCEEDED',
      reason: 'MAX_VALID_DAYS',
      maxValidDays: 180,
    });
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(eco, ['agenda.appointment.view'], day(180)),
      }).ok,
    ).toBe(true);
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(eco, ['agenda.appointment.view']),
      }),
    ).toMatchObject({ ok: false, reason: 'MAX_VALID_DAYS' });
  });
  it('la plantilla de la persona debe estar entre las del techo', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        subjectTemplateCode: 'ORG_MANAGEMENT',
        proposed: proposed(eco, ['agenda.appointment.view'], day(30)),
      }),
    ).toMatchObject({
      ok: false,
      code: 'ADMIN_CEILING_EXCEEDED',
      reason: 'TEMPLATE_NOT_ALLOWED',
    });
  });
  it('un objetivo más amplio que su alcance (ALL) está fuera de alcance', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(
          { targetKind: 'ALL' },
          ['agenda.appointment.view'],
          day(30),
        ),
      }),
    ).toMatchObject({ code: 'ADMIN_SCOPE_EXCEEDED' });
  });
  it('con varias concesiones de administración basta con que una contenga el objetivo', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        adminTargets: [card, eco],
        proposed: proposed(card, ['agenda.appointment.view'], day(30)),
      }).ok,
    ).toBe(true);
  });
  it('sin concesiones de administración nada está dentro de su alcance', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        adminTargets: [],
        proposed: proposed(eco, ['agenda.appointment.view'], day(30)),
      }),
    ).toMatchObject({ code: 'ADMIN_SCOPE_EXCEEDED' });
  });
  it('team.* nunca, aunque el techo lo listara por error (GP-5)', () => {
    const wide = { ...ceiling, allowAtoms: ['*.*.*', 'team.*'] };
    expect(
      checkDelegatedGrant({
        ...base,
        ceiling: wide,
        proposed: proposed(eco, ['team.grants.assign'], day(30)),
      }),
    ).toMatchObject({ ok: false, code: 'ADMIN_CEILING_EXCEEDED' });
  });
  it('un alias se valida por los átomos de su paquete', () => {
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(eco, ['billing.collect'], day(30)),
      }),
    ).toMatchObject({ ok: false, code: 'ADMIN_CEILING_EXCEEDED' });
    expect(
      checkDelegatedGrant({
        ...base,
        proposed: proposed(eco, ['schedule.view'], day(30)),
      }).ok,
    ).toBe(true);
  });
});

describe('alcance sobre toda la persona (§6.4: suspender, dar de baja, trasladar)', () => {
  const marcosGrants: GrantTargetFacts[] = [
    eco,
    {
      targetKind: 'PRACTITIONER_LOCATION',
      practitionerProfileId: 'suarez',
      careSpaceId: 'norte',
      careSpacePath: '/s/norte/',
    },
  ];
  it('D-02: Marcos tiene una concesión fuera de Ecografía → 403 ADMIN_SCOPE_EXCEEDED con outOfScope: 1', () => {
    expect(
      checkWholePersonScope({
        personGrants: marcosGrants,
        adminTargets: [eco],
      }),
    ).toEqual({
      ok: false,
      code: 'ADMIN_SCOPE_EXCEEDED',
      httpStatus: 403,
      outOfScope: 1,
    });
  });
  it('si todas están dentro, se puede', () => {
    expect(
      checkWholePersonScope({ personGrants: [eco], adminTargets: [eco] }),
    ).toEqual({ ok: true });
    expect(
      checkWholePersonScope({ personGrants: [], adminTargets: [eco] }),
    ).toEqual({ ok: true });
  });
  it('partitionByScope separa lo visible del administrador de «otras funciones: N»', () => {
    const p = partitionByScope(marcosGrants, [eco]);
    expect(p.inScope).toEqual([eco]);
    expect(p.outOfScopeCount).toBe(1);
    const none = partitionByScope([card], [eco]);
    expect(none.inScope).toEqual([]);
    expect(none.outOfScopeCount).toBe(1);
  });
  it('población administrable: tiene alguna concesión dentro del alcance', () => {
    expect(partitionByScope(marcosGrants, [eco]).administrable).toBe(true);
    expect(partitionByScope([card], [eco]).administrable).toBe(false);
    expect(partitionByScope([], [eco]).administrable).toBe(false);
  });
});
