/**
 * Hospital piloto (CONTRATO-GOBIERNO §10) como datos de prueba del dominio:
 * personas, concesiones con condiciones y pacientes. Solo lo usan las
 * `*.spec.ts` de esta carpeta (no se exporta en `index.ts`).
 */
import type {
  GovernanceRuleFacts,
  PatientFlag,
  SupportAccessFacts,
  UsageKey,
  UsageReading,
} from './support-access-context';
import type {
  EngagementFacts,
  SupportAccessQuery,
  SupportGrantFacts,
} from './support-access.types';
import type { SupportCondition } from './support-conditions';
import { SUPPORT_TEMPLATE_DEFAULTS } from './support-actions';
import { SUPPORT_TEMPLATE_DEFAULTS_V2 } from './support-template-packages';

/** Hoy de referencia: martes 2026-11-03 10:30 (America/La_Paz, UTC−4). */
export const NOW = new Date('2026-11-03T10:30:00-04:00');
export const at = (iso: string): Date => new Date(`${iso}-04:00`);
export const hoursFromNow = (h: number, now = NOW): Date =>
  new Date(now.getTime() + h * 3_600_000);

export const DOC = {
  perez: 'dr-perez',
  rojas: 'dr-rojas',
  suarez: 'dr-suarez',
  mendez: 'dr-mendez',
  antelo: 'dr-antelo',
};

/** Pacientes ficticios del piloto (§10.2). */
export const PATIENT = {
  carmen: 'p-carmen',
  luis: 'p-luis',
  mateo: 'p-mateo',
  reservado01: 'p-reservado-01',
  reservado02: 'p-reservado-02',
  sandra: 'p-sandra',
  julian: 'p-julian',
} as const;

interface PatientSeed {
  readonly ageYears?: number;
  readonly flags: readonly PatientFlag[];
  readonly insured: boolean;
}
const PATIENT_SEEDS: Readonly<Record<string, PatientSeed>> = {
  [PATIENT.carmen]: { ageYears: 45, flags: [], insured: true },
  [PATIENT.luis]: { ageYears: 72, flags: [], insured: false },
  [PATIENT.mateo]: { ageYears: 8, flags: [], insured: true },
  [PATIENT.reservado01]: { ageYears: 50, flags: ['VIP'], insured: true },
  [PATIENT.reservado02]: {
    ageYears: 50,
    flags: ['CONFIDENTIAL'],
    insured: true,
  },
  [PATIENT.sandra]: { flags: [], insured: false },
  [PATIENT.julian]: { ageYears: 29, flags: ['STAFF_RELATIVE'], insured: true },
};

/** Hechos del paciente `id`; `bookingsInWindow` = quién tiene cita en la ventana. */
export function patientFacts(
  id: string,
  opts: { bookingsInWindow?: boolean } = {},
): NonNullable<SupportAccessFacts['patient']> {
  const seed = PATIENT_SEEDS[id];
  return {
    ageYears: seed.ageYears,
    birthDateKnown: seed.ageYears !== undefined,
    flags: seed.flags,
    insured: seed.insured,
    hasBookingInWindow: () => opts.bookingsInWindow ?? true,
    inCareTeamOf: () => false,
  };
}

/** Hechos de la mayoría de los casos: red de la organización, equipo de confianza, doctor en línea. */
export function baseFacts(
  over: Partial<SupportAccessFacts> = {},
): SupportAccessFacts {
  return {
    network: { satisfiesOrgRules: true, orgHasAllowRules: true },
    device: { trusted: true },
    session: { startedAt: hoursFromNow(-1) },
    doctorOnline: true,
    stepUpAgeMinutes: null,
    stepUpEnrolled: true,
    ...over,
  };
}

/** Un contador de uso fijo: `used` para toda clave, o por periodo. */
export function usageOf(
  used: number | ((key: UsageKey) => number),
  max = 20,
): NonNullable<SupportAccessFacts['usage']> {
  return (key) => {
    const n = typeof used === 'number' ? used : used(key);
    return { used: n, remaining: Math.max(0, max - n) } satisfies UsageReading;
  };
}

export const PAST = new Date('2026-01-01T00:00:00Z');

export function grant(
  id: string,
  overrides: Partial<SupportGrantFacts> &
    Pick<SupportGrantFacts, 'targetKind' | 'actions'>,
): SupportGrantFacts {
  return { grantId: id, expansionMode: 'DYNAMIC', active: true, ...overrides };
}

export function engagement(
  id: string,
  accepted: Record<string, boolean>,
  grants: SupportGrantFacts[],
  overrides: Partial<EngagementFacts> = {},
): EngagementFacts {
  return {
    engagementId: id,
    active: true,
    validFrom: PAST,
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

export const ROOM = {
  a103: { id: 'a-103', path: '/site-central/bld-a/a-p1/a-103/' },
  b201: { id: 'b-201', path: '/site-central/bld-b/b-p2/b-201/' },
  n102: { id: 'n-102', path: '/site-norte/n-p1/n-102/' },
};

export function query(
  action: string,
  doctor: string,
  room: { id: string; path: string } = ROOM.a103,
  extra: Partial<SupportAccessQuery> = {},
): SupportAccessQuery {
  return {
    action: action as SupportAccessQuery['action'],
    practitionerProfileId: doctor,
    careSpaceId: room.id,
    careSpacePath: room.path,
    careSpaceSiteId: room.path.split('/')[1],
    ...extra,
  } as SupportAccessQuery;
}

const WEEKDAYS_OFFICE: SupportCondition['time'] = {
  timeZone: 'America/La_Paz',
  windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
};

/** Ana: Pérez con filas alias (compatibilidad); Rojas con átomos y condiciones (§10.3). */
export const ANA = engagement(
  'eng-ana',
  { [DOC.perez]: true, [DOC.rojas]: true },
  [
    grant('g-ana-perez', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.perez,
      actions: SUPPORT_TEMPLATE_DEFAULTS.SECRETARY,
    }),
    grant('g-ana-rojas', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.rojas,
      actions: SUPPORT_TEMPLATE_DEFAULTS_V2.SECRETARY,
      condition: {
        schemaVersion: 1,
        time: WEEKDAYS_OFFICE,
        network: { require: 'ORG_RULES' },
      },
      atomGrants: [
        {
          atom: 'agenda.appointment.view.reason',
          origin: 'ATOM',
          condition: {
            schemaVersion: 1,
            appointment: { window: { daysBefore: 1, daysAfter: 14 } },
            fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
          },
        },
        {
          atom: 'agenda.appointment.cancel',
          origin: 'ATOM',
          condition: {
            schemaVersion: 1,
            appointment: {
              leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
            },
            limits: [
              { metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' },
            ],
            patients: { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } },
          },
        },
      ],
    }),
    grant('g-ana-rojas-deny', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.rojas,
      effect: 'DENY',
      actions: ['agenda.appointment.view.reason'],
      condition: {
        schemaVersion: 1,
        patients: { flags: { anyOf: ['CONFIDENTIAL'] } },
      },
    }),
  ],
  { templateCode: 'SECRETARY', userId: 'u-ana' },
);

/** Marcos: Suárez × Sede Norte con `cancel` condicionado (§10.3). */
export const MARCOS = engagement(
  'eng-marcos',
  { [DOC.suarez]: false, [DOC.antelo]: false },
  [
    grant('g-marcos-suarez-norte', {
      targetKind: 'PRACTITIONER_LOCATION',
      practitionerProfileId: DOC.suarez,
      practiceSiteId: 'site-norte',
      actions: SUPPORT_TEMPLATE_DEFAULTS_V2.CALL_CENTER,
      atomGrants: [
        {
          atom: 'agenda.appointment.cancel',
          origin: 'ATOM',
          condition: {
            schemaVersion: 1,
            appointment: {
              leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
            },
            limits: [
              { metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' },
            ],
          },
        },
      ],
    }),
  ],
  { templateCode: 'CALL_CENTER', userId: 'u-marcos' },
);

/** Nora: enfermería de Méndez; motivo solo de pacientes con cita hoy y parcial (§10.3). */
export const NORA = engagement(
  'eng-nora',
  { [DOC.mendez]: false },
  [
    grant('g-nora-mendez', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.mendez,
      actions: SUPPORT_TEMPLATE_DEFAULTS_V2.NURSING,
      atomGrants: [
        {
          atom: 'agenda.appointment.view.reason',
          origin: 'ATOM',
          condition: {
            schemaVersion: 1,
            patients: {
              scope: 'WITH_APPOINTMENT_WINDOW',
              appointmentWindow: {
                daysBefore: 0,
                daysAfter: 0,
                withCoveredDoctor: true,
              },
            },
            fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
          },
        },
      ],
    }),
  ],
  { templateCode: 'NURSING', userId: 'u-nora' },
);

/** Mario: caja con cobro con tope de monto y dispositivo conocido (ejemplo C de §3.9, sin anular). */
export const MARIO = engagement(
  'eng-mario',
  { [DOC.perez]: false, [DOC.rojas]: false },
  [
    grant('g-mario-todo', {
      targetKind: 'ALL_LOCATIONS',
      actions: ['billing.payment.collect', 'billing.receipt.issue'],
      condition: {
        schemaVersion: 1,
        time: {
          timeZone: 'America/La_Paz',
          windows: [{ days: [1, 2, 3, 4, 5, 6], from: '08:00', to: '20:00' }],
        },
        device: { knownOnly: true },
      },
      atomGrants: [
        {
          atom: 'billing.payment.collect',
          origin: 'ATOM',
          condition: {
            schemaVersion: 1,
            amount: {
              currency: 'BOB',
              perTransactionMax: 2000,
              perDayMax: 20000,
              onExceed: 'REQUIRE_APPROVAL',
            },
          },
        },
      ],
    }),
  ],
  { templateCode: 'BILLING_CASHIER', userId: 'u-mario' },
);

/** Reglas L1 del piloto (§10.3). */
export const RULE_BILLING_NETWORK: GovernanceRuleFacts = {
  id: 'rule-billing-network',
  kind: 'REQUIRE_CONDITION',
  permissionPattern: 'billing.*',
  condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
};
export const RULE_DOCUMENT_FLOOR: GovernanceRuleFacts = {
  id: 'rule-document-floor',
  kind: 'FIELD_FLOOR',
  permissionPattern: 'agenda.appointment.view.patient_document',
  maxVisibility: 'PARTIAL',
};
