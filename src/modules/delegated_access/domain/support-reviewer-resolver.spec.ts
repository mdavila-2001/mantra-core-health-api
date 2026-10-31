import {
  escalationTargets,
  resolveReviewer,
  type AdminScope,
  type ReviewerContext,
  type ReviewerGrantFacts,
} from './support-reviewer-resolver';

const SITE = 'site-1';
const pathOf = (...ids: string[]): string => `/${[SITE, ...ids].join('/')}/`;

const SOFIA = 'u-sofia';
const MARCOS = 'u-marcos';
const GONZALO = 'u-gonzalo';
const RICARDO = 'u-ricardo';
const DR_PEREZ = 'u-perez';
const DR_ROJAS = 'u-rojas';

const ctx = (over: Partial<ReviewerContext> = {}): ReviewerContext => ({
  campaignOwnerUserId: GONZALO,
  securityAdminUserIds: [GONZALO, 'u-admin-2'],
  doctorUserIdsByPractitioner: {
    'prof-perez': DR_PEREZ,
    'prof-rojas': DR_ROJAS,
  },
  ...over,
});
const sofiaScope: AdminScope = {
  adminUserId: SOFIA,
  target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
};
const piso1Head: AdminScope = {
  adminUserId: RICARDO,
  target: {
    targetKind: 'LOCATION',
    careSpaceId: 'piso-1',
    careSpacePath: pathOf('edif-a', 'piso-1'),
  },
};
const grantOf = (
  over: Partial<ReviewerGrantFacts> & Pick<ReviewerGrantFacts, 'targetKind'>,
): ReviewerGrantFacts => ({ grantedByUserId: 'u-grantor', ...over });
const engagement = (over: { supervisorUserId?: string | null } = {}) => ({
  subjectUserId: MARCOS,
  supervisorUserId: SOFIA,
  ...over,
});

describe('resolveReviewer · reglas 1 a 3 (§6.2)', () => {
  it('1. una concesión de UN doctor la revisa ese doctor (su cuenta por el vínculo)', () => {
    for (const kind of [
      'PRACTITIONER',
      'PRACTITIONER_SERVICE',
      'PRACTITIONER_LOCATION',
    ] as const) {
      const r = resolveReviewer(
        grantOf({
          targetKind: kind,
          practitionerProfileId: 'prof-perez',
          healthcareServiceId: 'eco',
          careSpaceId: 'piso-1',
          careSpacePath: pathOf('edif-a', 'piso-1'),
        }),
        [sofiaScope],
        engagement(),
        ctx(),
      );
      expect(r).toMatchObject({
        kind: 'DOCTOR_OWNER',
        userIds: [DR_PEREZ],
        unresolved: false,
      });
    }
  });

  it('1. un FIXED con un solo doctor también es del doctor; con dos, del administrador', () => {
    const fixed = (rows: Array<{ d: string }>): ReviewerGrantFacts => ({
      ...grantOf({ targetKind: 'ALL' }),
      expansionMode: 'FIXED',
      snapshot: {
        rows: rows.map((r) => ({
          practitionerProfileId: r.d,
          healthcareServiceId: 'eco',
        })),
      },
    });
    expect(
      resolveReviewer(
        fixed([{ d: 'prof-perez' }, { d: 'prof-perez' }]),
        [],
        engagement(),
        ctx(),
      ).kind,
    ).toBe('DOCTOR_OWNER');
    expect(
      resolveReviewer(
        fixed([{ d: 'prof-perez' }, { d: 'prof-rojas' }]),
        [],
        engagement(),
        ctx(),
      ).kind,
    ).toBe('ADMIN');
  });

  it('1. el doctor se reconoce también por la asignación de rol', () => {
    const r = resolveReviewer(
      grantOf({
        targetKind: 'PRACTITIONER',
        practitionerRoleAssignmentId: 'pra-perez',
      }),
      [],
      engagement(),
      ctx({ doctorUserIdsByPractitioner: { 'pra-perez': DR_PEREZ } }),
    );
    expect(r).toMatchObject({ kind: 'DOCTOR_OWNER', userIds: [DR_PEREZ] });
  });

  it('1. si la cuenta del doctor no se conoce, cae al administrador (no queda sin revisor)', () => {
    const r = resolveReviewer(
      grantOf({
        targetKind: 'PRACTITIONER',
        practitionerProfileId: 'prof-sin-cuenta',
      }),
      [],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
  });

  it('2. K-01: la concesión de Ecografía de Marcos la revisa la jefa de servicio (Sofía)', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'eco' }),
      [sofiaScope, piso1Head],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({
      kind: 'SERVICE_HEAD',
      userIds: [SOFIA],
      unresolved: false,
    });
  });

  it('2. LOCATION y SERVICE_LOCATION: el jefe de piso cuyo alcance contiene el espacio', () => {
    const sala = grantOf({
      targetKind: 'LOCATION',
      careSpaceId: 'sala-103',
      careSpacePath: pathOf('edif-a', 'piso-1', 'sala-103'),
    });
    expect(
      resolveReviewer(sala, [sofiaScope, piso1Head], engagement(), ctx()),
    ).toMatchObject({ kind: 'SERVICE_HEAD', userIds: [RICARDO] });
    const mixto = grantOf({
      targetKind: 'SERVICE_LOCATION',
      healthcareServiceId: 'eco',
      careSpaceId: 'sala-103',
      careSpacePath: pathOf('edif-a', 'piso-1', 'sala-103'),
    });
    // Un delegado que deja una dimensión libre cubre cualquier valor de ella: Sofía (servicio) y
    // Ricardo (piso) contienen ambos la concesión «Ecografía en la sala 103».
    expect(
      resolveReviewer(mixto, [sofiaScope, piso1Head], engagement(), ctx()),
    ).toMatchObject({ kind: 'SERVICE_HEAD', userIds: [RICARDO, SOFIA] });
    // Un delegado de otro servicio y otro piso no la contiene.
    const otros: AdminScope[] = [
      {
        adminUserId: 'u-card',
        target: { targetKind: 'SERVICE', healthcareServiceId: 'card' },
      },
      {
        adminUserId: 'u-p2',
        target: {
          targetKind: 'LOCATION',
          careSpaceId: 'piso-2',
          careSpacePath: pathOf('edif-a', 'piso-2'),
        },
      },
    ];
    expect(resolveReviewer(mixto, otros, engagement(), ctx()).kind).toBe(
      'ADMIN',
    );
  });

  it('2. si hay varios jefes, todos pueden decidir (ordenados, sin repetir)', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'eco' }),
      [
        {
          adminUserId: 'u-b',
          target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
        },
        sofiaScope,
        { adminUserId: 'u-b', target: { targetKind: 'ALL' } },
      ],
      engagement(),
      ctx(),
    );
    expect(r.userIds).toEqual(['u-b', SOFIA]);
  });

  it('3. ALL, ALL_SERVICES, ALL_LOCATIONS y ALL_PRACTITIONERS van al administrador, a nombre del responsable de la campaña', () => {
    for (const kind of [
      'ALL',
      'ALL_SERVICES',
      'ALL_LOCATIONS',
      'ALL_PRACTITIONERS',
    ] as const) {
      const r = resolveReviewer(
        grantOf({ targetKind: kind }),
        [{ adminUserId: 'u-jefe-total', target: { targetKind: 'ALL' } }],
        engagement(),
        ctx(),
      );
      expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
    }
  });

  it('3. sin jefe resoluble el ítem va al administrador', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'card' }),
      [sofiaScope],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
  });

  it('3. sin responsable de campaña, todos los administradores de seguridad elegibles', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL' }),
      [],
      engagement(),
      ctx({ campaignOwnerUserId: null }),
    );
    expect(r.userIds).toEqual(['u-admin-2', GONZALO]);
  });
});

describe('resolveReviewer · responsable de campaña delegado (B-B8)', () => {
  const delegateOwner = ctx({ campaignOwnerUserId: RICARDO });

  it('si el responsable de la campaña es un delegado, NO es el revisor único: se agregan los administradores de seguridad', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL' }),
      [],
      engagement(),
      delegateOwner,
    );
    expect(r.kind).toBe('ADMIN');
    expect(r.userIds).toEqual([RICARDO, 'u-admin-2', GONZALO]);
  });

  it('GP-6 en campañas: un delegado responsable no revisa a otro administrador (certificación mutua entre pares)', () => {
    const peerScope: AdminScope = {
      adminUserId: SOFIA,
      target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
    };
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL' }),
      [peerScope],
      { subjectUserId: SOFIA, supervisorUserId: GONZALO },
      delegateOwner,
    );
    expect(r.userIds).toEqual(['u-admin-2', GONZALO]);
    expect(r.userIds).not.toContain(RICARDO);
  });

  it('si el responsable es administrador de seguridad todo sigue como antes: él solo', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL' }),
      [],
      engagement(),
      ctx(),
    );
    expect(r.userIds).toEqual([GONZALO]);
  });
});

describe('resolveReviewer · exclusiones (SOD-GOV-02)', () => {
  it('S-04: Sofía otorgó el permiso: no es jefa de servicio de su propia concesión y el ítem va al administrador', () => {
    const r = resolveReviewer(
      grantOf({
        targetKind: 'SERVICE',
        healthcareServiceId: 'eco',
        grantedByUserId: SOFIA,
      }),
      [sofiaScope],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
    expect(r.excludedUserIds).toEqual([SOFIA]);
  });

  it('K-01: Sofía es el sujeto de su propia concesión ALTA: el ítem va al administrador', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'eco' }),
      [sofiaScope],
      { subjectUserId: SOFIA, supervisorUserId: GONZALO },
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
  });

  it('quien aprobó la concesión tampoco la revisa (cuatro ojos o solicitud)', () => {
    const r = resolveReviewer(
      grantOf({
        targetKind: 'SERVICE',
        healthcareServiceId: 'eco',
        approvedByUserIds: [SOFIA, null],
      }),
      [sofiaScope],
      engagement(),
      ctx(),
    );
    expect(r.kind).toBe('ADMIN');
  });

  it('el doctor que otorgó su propia concesión no la revisa', () => {
    const r = resolveReviewer(
      grantOf({
        targetKind: 'PRACTITIONER',
        practitionerProfileId: 'prof-perez',
        grantedByUserId: DR_PEREZ,
      }),
      [],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
  });

  it('el administrador que otorgó (responsable de campaña) tampoco revisa: queda el otro administrador', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL', grantedByUserId: GONZALO }),
      [],
      engagement(),
      ctx(),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: ['u-admin-2'] });
  });

  it('si no queda nadie elegible, se dice «sin resolver» en lugar de devolver a un excluido', () => {
    const r = resolveReviewer(
      grantOf({ targetKind: 'ALL', grantedByUserId: GONZALO }),
      [],
      engagement(),
      ctx({ securityAdminUserIds: [GONZALO], campaignOwnerUserId: GONZALO }),
    );
    expect(r).toMatchObject({ kind: 'ADMIN', userIds: [], unresolved: true });
    expect(r.excludedUserIds).toContain(GONZALO);
  });

  it('propiedad: nunca devuelve al sujeto, a quien otorgó ni a quien aprobó', () => {
    const users = [
      SOFIA,
      MARCOS,
      GONZALO,
      RICARDO,
      DR_PEREZ,
      DR_ROJAS,
      'u-admin-2',
    ];
    const kinds: ReviewerGrantFacts['targetKind'][] = [
      'PRACTITIONER',
      'SERVICE',
      'LOCATION',
      'ALL',
      'PRACTITIONER_SERVICE',
      'SERVICE_LOCATION',
      'ALL_SERVICES',
    ];
    let seed = 7;
    const rnd = (n: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };
    let checked = 0;
    for (let i = 0; i < 400; i += 1) {
      const subject = users[rnd(users.length)];
      const grantedBy = rnd(4) === 0 ? null : users[rnd(users.length)];
      const approvers = [
        users[rnd(users.length)],
        rnd(2) ? null : users[rnd(users.length)],
      ];
      const r = resolveReviewer(
        grantOf({
          targetKind: kinds[rnd(kinds.length)],
          practitionerProfileId: rnd(2) ? 'prof-perez' : 'prof-rojas',
          healthcareServiceId: 'eco',
          careSpaceId: 'piso-1',
          careSpacePath: pathOf('edif-a', 'piso-1'),
          grantedByUserId: grantedBy,
          approvedByUserIds: approvers,
        }),
        [
          sofiaScope,
          piso1Head,
          { adminUserId: GONZALO, target: { targetKind: 'ALL' } },
        ],
        { subjectUserId: subject, supervisorUserId: users[rnd(users.length)] },
        ctx({
          campaignKind: (
            ['PERIODIC', 'MOVER', 'TARGETED', 'REMEDIATION'] as const
          )[rnd(4)],
        }),
      );
      const banned = new Set(
        [subject, grantedBy, ...approvers].filter(Boolean),
      );
      for (const id of r.userIds) {
        expect(banned.has(id)).toBe(false);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('propiedad: el resultado no depende del orden de los alcances de administración', () => {
    const scopes: AdminScope[] = [
      sofiaScope,
      piso1Head,
      {
        adminUserId: 'u-z',
        target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
      },
    ];
    const g = grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'eco' });
    const expected = resolveReviewer(g, scopes, engagement(), ctx());
    expect(
      resolveReviewer(g, [...scopes].reverse(), engagement(), ctx()),
    ).toEqual(expected);
  });
});

describe('resolveReviewer · campañas de cambio de rol y dirigidas (regla 4)', () => {
  const serviceGrant = grantOf({
    targetKind: 'SERVICE',
    healthcareServiceId: 'eco',
  });
  const doctorGrant = grantOf({
    targetKind: 'PRACTITIONER',
    practitionerProfileId: 'prof-perez',
  });

  it('MOVER: el dueño de la cuenta revisa las concesiones nuevas', () => {
    expect(
      resolveReviewer(
        serviceGrant,
        [sofiaScope],
        engagement({ supervisorUserId: RICARDO }),
        ctx({ campaignKind: 'MOVER' }),
      ),
    ).toMatchObject({
      kind: 'SUPERVISOR',
      userIds: [RICARDO],
    });
  });
  it('MOVER: si la concesión es de un doctor, lo revisa el doctor', () => {
    expect(
      resolveReviewer(
        doctorGrant,
        [],
        engagement(),
        ctx({ campaignKind: 'MOVER' }),
      ),
    ).toMatchObject({ kind: 'DOCTOR_OWNER', userIds: [DR_PEREZ] });
  });
  it('TARGETED: el dueño de la cuenta, aunque la concesión sea de un doctor', () => {
    expect(
      resolveReviewer(
        doctorGrant,
        [],
        engagement(),
        ctx({ campaignKind: 'TARGETED' }),
      ),
    ).toMatchObject({ kind: 'SUPERVISOR', userIds: [SOFIA] });
  });
  it('sin dueño elegible (o es quien otorgó), cae al administrador', () => {
    expect(
      resolveReviewer(
        serviceGrant,
        [],
        engagement({ supervisorUserId: null }),
        ctx({ campaignKind: 'TARGETED' }),
      ).kind,
    ).toBe('ADMIN');
    expect(
      resolveReviewer(
        { ...serviceGrant, grantedByUserId: SOFIA },
        [],
        engagement(),
        ctx({ campaignKind: 'MOVER' }),
      ).kind,
    ).toBe('ADMIN');
  });
  it('PERIODIC, RECERTIFICATION y REMEDIATION siguen las reglas 1 a 3', () => {
    for (const campaignKind of [
      'PERIODIC',
      'RECERTIFICATION',
      'REMEDIATION',
    ] as const) {
      expect(
        resolveReviewer(
          serviceGrant,
          [sofiaScope],
          engagement(),
          ctx({ campaignKind }),
        ).kind,
      ).toBe('SERVICE_HEAD');
    }
  });
});

describe('escalationTargets · a quién sube un ítem sin decidir (§6.2)', () => {
  const grant = grantOf({
    targetKind: 'PRACTITIONER_SERVICE',
    practitionerProfileId: 'prof-perez',
    healthcareServiceId: 'eco',
  });

  it('doctor → jefe de servicio; si no hay, administrador', () => {
    const up = escalationTargets(
      'DOCTOR_OWNER',
      grant,
      [sofiaScope],
      engagement(),
      ctx(),
    );
    expect(up).toMatchObject({ kind: 'SERVICE_HEAD', userIds: [SOFIA] });
    const noHead = escalationTargets(
      'DOCTOR_OWNER',
      grant,
      [],
      engagement(),
      ctx(),
    );
    expect(noHead).toMatchObject({ kind: 'ADMIN', userIds: [GONZALO] });
  });
  it('jefe de servicio → administrador', () => {
    expect(
      escalationTargets(
        'SERVICE_HEAD',
        grantOf({ targetKind: 'SERVICE', healthcareServiceId: 'eco' }),
        [sofiaScope],
        engagement(),
        ctx(),
      ),
    ).toMatchObject({
      kind: 'ADMIN',
      userIds: [GONZALO],
    });
  });
  it('administrador → responsable de la campaña y un segundo administrador de seguridad', () => {
    const up = escalationTargets(
      'ADMIN',
      grantOf({ targetKind: 'ALL' }),
      [],
      engagement(),
      ctx(),
    );
    expect(up).toMatchObject({
      kind: 'ADMIN',
      userIds: [GONZALO, 'u-admin-2'],
    });
  });
  it('el segundo administrador no es el sujeto ni quien otorgó', () => {
    const up = escalationTargets(
      'ADMIN',
      grantOf({ targetKind: 'ALL', grantedByUserId: 'u-admin-2' }),
      [],
      engagement(),
      ctx({ securityAdminUserIds: [GONZALO, 'u-admin-2', 'u-admin-3'] }),
    );
    expect(up.userIds).toEqual([GONZALO, 'u-admin-3']);
  });
  it('dueño de la cuenta → administrador', () => {
    expect(
      escalationTargets(
        'SUPERVISOR',
        grantOf({ targetKind: 'ALL' }),
        [],
        engagement(),
        ctx(),
      ).kind,
    ).toBe('ADMIN');
  });
});
