import {
  SUPPORT_TARGET_KINDS,
  deriveEffectiveRows,
  grantCovers,
  snapshotRowsFor,
  validateTargetReferences,
} from './index';

describe('validateTargetReferences', () => {
  it('acepta las referencias que cada tipo exige', () => {
    expect(
      validateTargetReferences('PRACTITIONER', {
        practitionerRoleAssignmentId: 'pra',
      }),
    ).toBeNull();
    expect(
      validateTargetReferences('PRACTITIONER_LOCATION', {
        practitionerRoleAssignmentId: 'pra',
        practiceSiteId: 'site',
      }),
    ).toBeNull();
    expect(validateTargetReferences('ALL', {})).toBeNull();
  });

  it('rechaza una referencia que falta, una que sobra y la ubicación doble', () => {
    expect(validateTargetReferences('SERVICE', {})).toMatch(
      /healthcareServiceId/,
    );
    expect(
      validateTargetReferences('ALL_SERVICES', { healthcareServiceId: 's' }),
    ).toMatch(/no admite/);
    expect(
      validateTargetReferences('LOCATION', {
        careSpaceId: 'c',
        practiceSiteId: 's',
      }),
    ).toMatch(/espacio o con una sede/);
  });

  it('declara los diez tipos del contrato', () => {
    expect(SUPPORT_TARGET_KINDS).toHaveLength(10);
  });
});

describe('deriveEffectiveRows', () => {
  const base = {
    grantId: 'g',
    expansionMode: 'DYNAMIC' as const,
    actions: ['schedule.view' as const],
  };

  it('deja NULL en las dimensiones que el permiso no acota', () => {
    const rows = deriveEffectiveRows({
      ...base,
      targetKind: 'PRACTITIONER',
      practitionerRoleAssignmentIds: ['pra-1', 'pra-2'],
      withinCareSpaceIds: [],
    });
    expect(rows).toEqual([
      {
        practitionerRoleAssignmentId: 'pra-1',
        permissionCode: 'schedule.view',
        grantId: 'g',
      },
      {
        practitionerRoleAssignmentId: 'pra-2',
        permissionCode: 'schedule.view',
        grantId: 'g',
      },
    ]);
  });

  it('una fila por espacio dentro de la ubicación y cruce con el servicio', () => {
    const rows = deriveEffectiveRows({
      ...base,
      targetKind: 'SERVICE_LOCATION',
      practitionerRoleAssignmentIds: [],
      healthcareServiceId: 'eco',
      withinCareSpaceIds: ['s1', 's2'],
    });
    expect(rows.map((r) => [r.healthcareServiceId, r.careSpaceId])).toEqual([
      ['eco', 's1'],
      ['eco', 's2'],
    ]);
  });

  it('«todos» deja una sola fila sin dimensiones', () => {
    const rows = deriveEffectiveRows({
      ...base,
      targetKind: 'ALL',
      practitionerRoleAssignmentIds: [],
      withinCareSpaceIds: [],
    });
    expect(rows).toEqual([{ permissionCode: 'schedule.view', grantId: 'g' }]);
  });

  it('un permiso FIXED expande las filas congeladas, no la estructura actual', () => {
    const rows = deriveEffectiveRows({
      ...base,
      targetKind: 'LOCATION',
      practitionerRoleAssignmentIds: [],
      withinCareSpaceIds: ['nuevo'],
      expansionMode: 'FIXED',
      snapshot: { rows: [{ careSpaceId: 'viejo' }] },
    });
    expect(rows.map((r) => r.careSpaceId)).toEqual(['viejo']);
  });
});

describe('snapshotRowsFor (M6: FIXED congela la lista real, también con «todos»)', () => {
  const lists = {
    doctors: [
      { id: 'ra-perez', profileId: 'prof-perez' },
      { id: 'ra-rojas', profileId: 'prof-rojas' },
    ],
    services: ['eco', 'consulta'],
    spaces: ['sala-103', 'sala-201'],
  };

  it('ALL_LOCATIONS congela cada espacio actual, no una fila comodín', () => {
    const { rows } = snapshotRowsFor('ALL_LOCATIONS', lists);
    expect(rows.map((r) => r.careSpaceId)).toEqual(['sala-103', 'sala-201']);
    expect(rows.every((r) => !r.healthcareServiceId)).toBe(true);
  });

  it('ALL_PRACTITIONERS congela cada doctor actual', () => {
    const { rows } = snapshotRowsFor('ALL_PRACTITIONERS', lists);
    expect(rows.map((r) => r.practitionerRoleAssignmentId)).toEqual([
      'ra-perez',
      'ra-rojas',
    ]);
  });

  it('ALL_SERVICES congela cada servicio actual', () => {
    const { rows } = snapshotRowsFor('ALL_SERVICES', lists);
    expect(rows.map((r) => r.healthcareServiceId)).toEqual(['eco', 'consulta']);
  });

  it('ALL congela el cruce de doctores, servicios y espacios actuales', () => {
    const { rows } = snapshotRowsFor('ALL', lists);
    expect(rows).toHaveLength(2 * 2 * 2);
  });

  it('un permiso FIXED ALL_LOCATIONS no cubre un espacio creado después', () => {
    const snapshot = snapshotRowsFor('ALL_LOCATIONS', lists);
    const grant = {
      grantId: 'g',
      targetKind: 'ALL_LOCATIONS' as const,
      expansionMode: 'FIXED' as const,
      snapshot,
      active: true,
      actions: ['schedule.view' as const],
    };
    expect(grantCovers(grant as any, { careSpaceId: 'sala-103' } as any)).toBe(
      true,
    );
    expect(
      grantCovers(grant as any, { careSpaceId: 'sala-nueva' } as any),
    ).toBe(false);
  });

  it('sin espacios actuales no congela nada (ninguna fila vacía que cubra todo)', () => {
    const { rows } = snapshotRowsFor('ALL_LOCATIONS', { ...lists, spaces: [] });
    expect(rows).toEqual([]);
  });

  it('un tipo SPECIFIC usa solo lo que el llamador resolvió', () => {
    const { rows } = snapshotRowsFor('PRACTITIONER_LOCATION', {
      doctors: [{ id: 'ra-perez', profileId: 'prof-perez' }],
      services: [],
      spaces: ['sala-103'],
    });
    expect(rows).toEqual([
      {
        practitionerRoleAssignmentId: 'ra-perez',
        practitionerProfileId: 'prof-perez',
        healthcareServiceId: undefined,
        careSpaceId: 'sala-103',
      },
    ]);
  });

  it('una fila vacía guardada nunca cubre nada', () => {
    const grant = {
      grantId: 'g',
      targetKind: 'ALL_LOCATIONS' as const,
      expansionMode: 'FIXED' as const,
      snapshot: { rows: [{}] },
      active: true,
      actions: ['schedule.view' as const],
    };
    expect(
      grantCovers(grant as any, { careSpaceId: 'cualquiera' } as any),
    ).toBe(false);
  });

  it('un cruce demasiado grande se rechaza en vez de guardarse', () => {
    const many = Array.from({ length: 30 }, (_, i) => `x${i}`);
    expect(() =>
      snapshotRowsFor('ALL', {
        doctors: many.map((id) => ({ id, profileId: id })),
        services: many,
        spaces: many,
      }),
    ).toThrow(/demasiadas combinaciones/);
  });
});
