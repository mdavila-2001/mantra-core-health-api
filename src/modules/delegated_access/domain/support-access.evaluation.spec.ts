import {
  SupportAccessReason,
  canSearchPatients,
  checkExactPatientSearch,
  evaluateSupportAccess,
  supportClinicalVisibility,
  SUPPORT_TEMPLATE_DEFAULTS,
  type EngagementFacts,
  type SupportAccessQuery,
  type SupportActionCode,
  type SupportGrantFacts,
} from './index';

/**
 * Hospital Piloto Mantra (ficticio): identificadores sintéticos legibles. La
 * estructura sigue el contrato: Sede Central → Edificio A / Edificio B, y
 * Sede Norte. La ruta materializada lista los ancestros de cada sala.
 */
const SITE_CENTRAL = 'site-central';
const SITE_NORTE = 'site-norte';
const BLD_A = 'bld-a';
const BLD_B = 'bld-b';
const A_P1 = 'a-p1';
const A_P2 = 'a-p2';
const A_P4 = 'a-p4';
const B_P2 = 'b-p2';

const path = (...ids: string[]): string => `/${ids.join('/')}/`;
const ROOMS = {
  a103: { id: 'a-103', path: path(SITE_CENTRAL, BLD_A, A_P1, 'a-103') },
  a105: { id: 'a-105', path: path(SITE_CENTRAL, BLD_A, A_P1, 'a-105') },
  a201: { id: 'a-201', path: path(SITE_CENTRAL, BLD_A, A_P2, 'a-201') },
  a401: { id: 'a-401', path: path(SITE_CENTRAL, BLD_A, A_P4, 'a-401') },
  b102: { id: 'b-102', path: path(SITE_CENTRAL, BLD_B, 'b-p1', 'b-102') },
  b204: { id: 'b-204', path: path(SITE_CENTRAL, BLD_B, B_P2, 'b-204') },
  n102: { id: 'n-102', path: path(SITE_NORTE, 'n-p1', 'n-102') },
};
const SVC = {
  consulta: 'svc-consulta',
  eco: 'svc-ecografia',
  ecoObstetrica: 'svc-eco-obstetrica',
  ecocardio: 'svc-ecocardiograma',
};
const DOC = {
  perez: 'dr-perez',
  rojas: 'dr-rojas',
  suarez: 'dr-suarez',
  mendez: 'dr-mendez',
  antelo: 'dr-antelo',
  cespedes: 'dr-cespedes',
};

const NOW = new Date('2026-10-30T12:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');
const FUTURE = new Date('2027-01-01T00:00:00Z');

/** Un permiso vigente con los valores por defecto del hospital piloto. */
function grant(
  id: string,
  overrides: Partial<SupportGrantFacts> &
    Pick<SupportGrantFacts, 'targetKind' | 'actions'>,
): SupportGrantFacts {
  return {
    grantId: id,
    expansionMode: 'DYNAMIC',
    active: true,
    ...overrides,
  };
}

/** Un vínculo vigente que aceptaron los doctores indicados. */
function engagement(
  id: string,
  accepted: Record<string, boolean>,
  grants: SupportGrantFacts[],
  overrides: Partial<EngagementFacts> = {},
): EngagementFacts {
  return {
    engagementId: id,
    active: true,
    validFrom: PAST,
    validTo: undefined,
    acceptances: Object.entries(accepted).map(
      ([practitionerProfileId, mayReplyOnBehalf]) => ({
        practitionerProfileId,
        mayReplyOnBehalf,
      }),
    ),
    grants,
    ...overrides,
  };
}

const ANA = engagement('eng-ana', { [DOC.perez]: true, [DOC.rojas]: true }, [
  grant('g-ana-perez', {
    targetKind: 'PRACTITIONER',
    practitionerProfileId: DOC.perez,
    actions: SUPPORT_TEMPLATE_DEFAULTS.SECRETARY,
  }),
  grant('g-ana-rojas', {
    targetKind: 'PRACTITIONER',
    practitionerProfileId: DOC.rojas,
    actions: SUPPORT_TEMPLATE_DEFAULTS.SECRETARY,
  }),
]);

const LUCIA = engagement(
  'eng-lucia',
  { [DOC.mendez]: false, [DOC.perez]: false },
  [
    grant('g-lucia-edificio-a-p1', {
      targetKind: 'LOCATION',
      careSpaceId: A_P1,
      actions: SUPPORT_TEMPLATE_DEFAULTS.FRONT_DESK,
    }),
  ],
);

const MARCOS = engagement(
  'eng-marcos',
  { [DOC.antelo]: false, [DOC.rojas]: false, [DOC.suarez]: false },
  [
    grant('g-marcos-ecografia', {
      targetKind: 'SERVICE',
      healthcareServiceId: SVC.eco,
      actions: SUPPORT_TEMPLATE_DEFAULTS.CALL_CENTER,
    }),
    grant('g-marcos-suarez-norte', {
      targetKind: 'PRACTITIONER_LOCATION',
      practitionerProfileId: DOC.suarez,
      practiceSiteId: SITE_NORTE,
      actions: SUPPORT_TEMPLATE_DEFAULTS.CALL_CENTER,
    }),
  ],
);

/** Una consulta sobre la agenda de un doctor en una sala. */
function query(
  action: SupportActionCode,
  doctor: string,
  room: { id: string; path: string },
  service?: string,
): SupportAccessQuery {
  return {
    action,
    practitionerProfileId: doctor,
    healthcareServiceId: service,
    careSpaceId: room.id,
    careSpacePath: room.path,
    careSpaceSiteId: room.path.split('/')[1],
  };
}

interface PilotCase {
  readonly n: string;
  readonly name: string;
  readonly engagements: readonly EngagementFacts[];
  readonly query: SupportAccessQuery;
  readonly allowed: boolean;
  readonly reason: SupportAccessReason;
  readonly grantId?: string;
}

const PILOT_CASES: readonly PilotCase[] = [
  {
    n: '01',
    name: 'Ana crea cita Pérez consulta A-P1',
    engagements: [ANA],
    query: query('schedule.create', DOC.perez, ROOMS.a103, SVC.consulta),
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-ana-perez',
  },
  {
    n: '02',
    name: 'Ana agenda ecocardiograma de Pérez en A-P2',
    engagements: [ANA],
    query: query('schedule.create', DOC.perez, ROOMS.a201, SVC.ecocardio),
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-ana-perez',
  },
  {
    n: '03',
    name: 'Lucía hace check-in de un paciente de Méndez en 105',
    engagements: [LUCIA],
    query: query('schedule.check_in', DOC.mendez, ROOMS.a105, SVC.consulta),
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-lucia-edificio-a-p1',
  },
  {
    n: '04',
    name: 'Lucía hace check-in en A-P4 (fuera de su ubicación)',
    engagements: [LUCIA],
    query: query('schedule.check_in', DOC.mendez, ROOMS.a401, SVC.consulta),
    allowed: false,
    reason: SupportAccessReason.NO_COVERING_GRANT,
  },
  {
    n: '05',
    name: 'Lucía crea cita de Pérez en P1 (la plantilla no tiene create)',
    engagements: [LUCIA],
    query: query('schedule.create', DOC.perez, ROOMS.a103, SVC.consulta),
    allowed: false,
    reason: SupportAccessReason.ACTION_NOT_GRANTED,
  },
  {
    n: '06',
    name: 'Marcos agenda Ecografía con Antelo en la sala 201',
    engagements: [MARCOS],
    query: query('schedule.create', DOC.antelo, ROOMS.a201, SVC.eco),
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-marcos-ecografia',
  },
  {
    n: '07',
    name: 'Marcos agenda eco obstétrica con Rojas en B204 (otro servicio)',
    engagements: [MARCOS],
    query: query('schedule.create', DOC.rojas, ROOMS.b204, SVC.ecoObstetrica),
    allowed: false,
    reason: SupportAccessReason.NO_COVERING_GRANT,
  },
  {
    n: '08a',
    name: 'Marcos agenda a Suárez en Sede Norte (cruce doctor × sede)',
    engagements: [MARCOS],
    query: query('schedule.create', DOC.suarez, ROOMS.n102, SVC.consulta),
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-marcos-suarez-norte',
  },
  {
    n: '08b',
    name: 'Marcos agenda a Suárez en Edificio B (fuera de la sede del cruce)',
    engagements: [MARCOS],
    query: query('schedule.create', DOC.suarez, ROOMS.b102, SVC.consulta),
    allowed: false,
    reason: SupportAccessReason.NO_COVERING_GRANT,
  },
  {
    n: '09',
    name: 'Ana responde un mensaje de un paciente de Pérez',
    engagements: [ANA],
    query: {
      action: 'messages.reply_on_behalf',
      practitionerProfileId: DOC.perez,
    },
    allowed: true,
    reason: SupportAccessReason.ALLOWED,
    grantId: 'g-ana-perez',
  },
  {
    n: '11',
    name: 'Rosa (consultorio privado) ve la agenda de Céspedes en el Hospital Piloto',
    // Rosa solo tiene vínculo en OTRA organización: aquí no hay ninguno.
    engagements: [],
    query: query('schedule.view', DOC.cespedes, ROOMS.a103, SVC.consulta),
    allowed: false,
    reason: SupportAccessReason.NO_ENGAGEMENT,
  },
  {
    n: '12',
    name: 'Ana tras el fin de vínculo',
    engagements: [{ ...ANA, active: false }],
    query: query('schedule.create', DOC.perez, ROOMS.a103, SVC.consulta),
    allowed: false,
    reason: SupportAccessReason.ENGAGEMENT_INACTIVE,
  },
];

describe('evaluateSupportAccess — hospital piloto', () => {
  it.each(PILOT_CASES)(
    'caso $n: $name',
    ({ engagements, query: q, allowed, reason, grantId }) => {
      const decision = evaluateSupportAccess(engagements, q, NOW);
      expect(decision.allowed).toBe(allowed);
      expect(decision.reason).toBe(reason);
      expect(decision.grantId).toBe(grantId);
    },
  );

  it('caso 10: Ana abre la historia clínica y solo ve el motivo; el resto exige acceso temporal que decide el doctor', () => {
    const visibility = supportClinicalVisibility();
    expect(visibility.visible).toEqual(['reasonForVisit']);
    expect(visibility.requiresTemporaryAccess).toBe(true);
    expect(visibility.decidedBy).toBe('DOCTOR');
    // Y ninguna de las 15 acciones de apoyo es de lectura clínica.
    const all = Object.values(SUPPORT_TEMPLATE_DEFAULTS).flat();
    expect(all.some((a) => a.startsWith('clinical'))).toBe(false);
  });

  it.each([
    ['Juan', { fullName: 'Juan' }],
    ['solo nombre y apellido sin fecha', { fullName: 'Juan Pérez' }],
    ['fragmento de documento', { nationalId: '12' }],
    ['teléfono incompleto', { phone: '7123' }],
  ])('caso 13: Ana busca %s → búsqueda inexacta', (_name, criteria) => {
    const verdict = checkExactPatientSearch(criteria);
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toBe('INEXACT_SEARCH');
  });

  it.each([
    ['documento', { nationalId: '1234567' }, 'NATIONAL_ID'],
    ['teléfono', { phone: '+591 7123 4567' }, 'PHONE'],
    [
      'nombre completo y fecha de nacimiento',
      { fullName: 'Juan Pérez', birthDate: '1990-05-17' },
      'FULL_NAME_BIRTH_DATE',
    ],
  ])('la búsqueda exacta por %s se admite', (_name, criteria, mode) => {
    expect(checkExactPatientSearch(criteria)).toEqual({ allowed: true, mode });
  });
});

describe('evaluateSupportAccess — reglas del contrato', () => {
  it('exige la aceptación del doctor antes de mirar los permisos', () => {
    const sinAceptar = engagement('e', {}, ANA.grants as SupportGrantFacts[]);
    const d = evaluateSupportAccess(
      [sinAceptar],
      query('schedule.view', DOC.perez, ROOMS.a103),
      NOW,
    );
    expect(d.reason).toBe(SupportAccessReason.DOCTOR_NOT_ACCEPTED);
  });

  it('responder en nombre del doctor exige además que él lo haya permitido', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['messages.reply_on_behalf'],
      }),
    ]);
    const d = evaluateSupportAccess(
      [e],
      { action: 'messages.reply_on_behalf', practitionerProfileId: DOC.perez },
      NOW,
    );
    expect(d.reason).toBe(SupportAccessReason.REPLY_NOT_ALLOWED_BY_DOCTOR);
  });

  it('un vínculo suspendido o vencido no permite nada', () => {
    const vencido = { ...ANA, validTo: PAST };
    const d = evaluateSupportAccess(
      [vencido],
      query('schedule.view', DOC.perez, ROOMS.a103),
      NOW,
    );
    expect(d.reason).toBe(SupportAccessReason.ENGAGEMENT_INACTIVE);
  });

  it('un permiso revocado o fuera de vigencia no cubre', () => {
    const revocado = engagement('e', { [DOC.perez]: false }, [
      grant('g1', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.view'],
        active: false,
      }),
      grant('g2', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.view'],
        validTo: PAST,
      }),
    ]);
    const d = evaluateSupportAccess(
      [revocado],
      query('schedule.view', DOC.perez, ROOMS.a103),
      NOW,
    );
    expect(d.reason).toBe(SupportAccessReason.NO_COVERING_GRANT);
  });

  it('varias filas se suman: la acción puede venir de otro permiso que cubre', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('solo-ver', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.view'],
      }),
      grant('crear-en-p1', {
        targetKind: 'LOCATION',
        careSpaceId: A_P1,
        actions: ['schedule.create'],
      }),
    ]);
    const d = evaluateSupportAccess(
      [e],
      query('schedule.create', DOC.perez, ROOMS.a103),
      NOW,
    );
    expect(d.grantId).toBe('crear-en-p1');
  });

  it('«todos» cubre cualquier doctor, servicio o espacio de la organización', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('todo', { targetKind: 'ALL', actions: ['schedule.view'] }),
    ]);
    expect(
      evaluateSupportAccess(
        [e],
        query('schedule.view', DOC.perez, ROOMS.n102),
        NOW,
      ).allowed,
    ).toBe(true);
  });

  it('un permiso por ubicación no cubre una cita sin espacio', () => {
    const d = evaluateSupportAccess(
      [LUCIA],
      { action: 'schedule.check_in', practitionerProfileId: DOC.mendez },
      NOW,
    );
    expect(d.reason).toBe(SupportAccessReason.NO_COVERING_GRANT);
  });

  describe('expansión FIXED', () => {
    const fixed = (
      rows: { careSpaceId?: string; practitionerProfileId?: string }[],
    ) =>
      engagement('e', { [DOC.mendez]: false }, [
        grant('fijo', {
          targetKind: 'LOCATION',
          careSpaceId: A_P1,
          expansionMode: 'FIXED',
          snapshot: { rows },
          actions: ['schedule.check_in'],
        }),
      ]);

    it('cubre solo los espacios que la foto congelada lista', () => {
      const e = fixed([{ careSpaceId: ROOMS.a103.id }]);
      expect(
        evaluateSupportAccess(
          [e],
          query('schedule.check_in', DOC.mendez, ROOMS.a103),
          NOW,
        ).allowed,
      ).toBe(true);
      // La sala 105 se agregó después de la foto: un permiso congelado no la ve.
      expect(
        evaluateSupportAccess(
          [e],
          query('schedule.check_in', DOC.mendez, ROOMS.a105),
          NOW,
        ).reason,
      ).toBe(SupportAccessReason.NO_COVERING_GRANT);
    });

    it('un permiso FIXED sin foto no cubre nada', () => {
      const e = engagement('e', { [DOC.mendez]: false }, [
        grant('roto', {
          targetKind: 'ALL',
          expansionMode: 'FIXED',
          actions: ['schedule.view'],
        }),
      ]);
      expect(
        evaluateSupportAccess(
          [e],
          query('schedule.view', DOC.mendez, ROOMS.a103),
          NOW,
        ).allowed,
      ).toBe(false);
    });
  });
});

describe('canSearchPatients', () => {
  it('lo permite con un vínculo vigente y una acción que trata con pacientes', () => {
    expect(canSearchPatients([LUCIA], NOW)).toBe(true);
  });

  it('lo niega sin vínculo o con un vínculo inactivo', () => {
    expect(canSearchPatients([], NOW)).toBe(false);
    expect(canSearchPatients([{ ...LUCIA, active: false }], NOW)).toBe(false);
  });

  it('lo niega si ningún permiso trae una acción de pacientes', () => {
    const soloVer = engagement('e', {}, [
      grant('g', { targetKind: 'ALL', actions: ['schedule.view'] }),
    ]);
    expect(canSearchPatients([soloVer], NOW)).toBe(false);
  });
});

describe('plantillas de rol', () => {
  it('ORG_MANAGEMENT no incluye mensajes ni facturación; SECRETARY sí responde mensajes', () => {
    const org = SUPPORT_TEMPLATE_DEFAULTS.ORG_MANAGEMENT;
    expect(org.some((a) => a.startsWith('billing.'))).toBe(false);
    expect(org).not.toContain('messages.reply_on_behalf');
    expect(org).toContain('schedule.block_time');
    expect(SUPPORT_TEMPLATE_DEFAULTS.SECRETARY).toContain(
      'messages.reply_on_behalf',
    );
    expect(FUTURE.getTime()).toBeGreaterThan(NOW.getTime());
  });
});
