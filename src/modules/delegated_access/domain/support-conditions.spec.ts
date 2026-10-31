import { SupportAccessReason } from './support-access.types';
import type {
  SupportAccessContext,
  SupportAccessFacts,
  UsageKey,
} from './support-access-context';
import {
  SUPPORT_CONDITION_SCHEMA_VERSION,
  conditionKeyAppliesToAtom,
  evaluateConditions,
  requiredFacets,
  type EvaluateConditionsOptions,
  type SupportCondition,
} from './support-conditions';

/** Reloj de las pruebas: martes 2026-11-03 10:30 en La Paz (UTC−4). */
const NOW = new Date('2026-11-03T10:30:00-04:00');
const hoursFromNow = (h: number): Date =>
  new Date(NOW.getTime() + h * 3_600_000);
const daysFromNow = (d: number): Date => hoursFromNow(d * 24);

const V1 = SUPPORT_CONDITION_SCHEMA_VERSION;

type Tri = 'T' | 'F' | 'I';
interface Row {
  readonly name: string;
  readonly atom: string;
  readonly cond: Omit<SupportCondition, 'schemaVersion'>;
  readonly ctx?: SupportAccessContext;
  readonly facts?: SupportAccessFacts;
  readonly options?: EvaluateConditionsOptions;
  readonly now?: Date;
  readonly key: string;
  readonly expected: Tri;
  readonly code?: SupportAccessReason;
}

const patient = (
  over: Partial<NonNullable<SupportAccessFacts['patient']>> = {},
) => ({
  birthDateKnown: true,
  flags: [] as const,
  ...over,
});
const withPatient = (
  over: Partial<NonNullable<SupportAccessFacts['patient']>> = {},
): SupportAccessFacts => ({ patient: patient(over) });
const CTX_PATIENT: SupportAccessContext = { patientProfileId: 'p-1' };

const ROWS: readonly Row[] = [
  // ───── time
  {
    name: 'time T: martes 10:30 dentro de lun-vie 07:30-18:30',
    atom: 'agenda.appointment.cancel',
    cond: {
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
      },
    },
    key: 'time',
    expected: 'T',
  },
  {
    name: 'time F: lunes 19:10 fuera de horario',
    atom: 'agenda.appointment.cancel',
    cond: {
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
      },
    },
    now: new Date('2026-11-02T19:10:00-04:00'),
    key: 'time',
    expected: 'F',
    code: SupportAccessReason.TIME_WINDOW,
  },
  {
    name: 'time I: zona inválida (dato roto → falla cerrado, no abierto)',
    atom: 'agenda.appointment.cancel',
    cond: {
      time: {
        timeZone: 'Marte/Olympus',
        windows: [{ days: [2], from: '07:30', to: '18:30' }],
      },
    },
    key: 'time',
    expected: 'I',
    code: SupportAccessReason.TIME_WINDOW,
  },
  // ───── limits
  {
    name: 'limits T: 3 de 20 al día',
    atom: 'agenda.appointment.cancel',
    cond: {
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
    },
    facts: { usage: () => ({ used: 3, remaining: 17 }) },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'T',
  },
  {
    name: 'limits F: 20 de 20 al día',
    atom: 'agenda.appointment.cancel',
    cond: {
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
    },
    facts: { usage: () => ({ used: 20, remaining: 0 }) },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'F',
    code: SupportAccessReason.LIMIT_EXCEEDED,
  },
  {
    name: 'limits I: sin contador (Redis caído o no cargado)',
    atom: 'agenda.appointment.cancel',
    cond: {
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
    },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'I',
    code: SupportAccessReason.LIMIT_EXCEEDED,
  },
  {
    name: 'limits T: DISTINCT_PATIENTS con el paciente ya contado aunque el tope esté lleno',
    atom: 'patients.search.exact',
    cond: {
      limits: [
        { metric: 'DISTINCT_PATIENTS', per: 'HOUR', max: 15, onExceed: 'DENY' },
      ],
    },
    ctx: CTX_PATIENT,
    facts: { usage: () => ({ used: 15, remaining: 0, alreadyCounted: true }) },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'T',
  },
  {
    name: 'limits F: DISTINCT_PATIENTS con un paciente nuevo y el tope lleno',
    atom: 'patients.search.exact',
    cond: {
      limits: [
        { metric: 'DISTINCT_PATIENTS', per: 'HOUR', max: 15, onExceed: 'DENY' },
      ],
    },
    ctx: CTX_PATIENT,
    facts: { usage: () => ({ used: 15, remaining: 0, alreadyCounted: false }) },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'F',
    code: SupportAccessReason.LIMIT_EXCEEDED,
  },
  {
    name: 'limits I: DISTINCT_PATIENTS sin paciente en el contexto',
    atom: 'patients.search.exact',
    cond: {
      limits: [
        { metric: 'DISTINCT_PATIENTS', per: 'HOUR', max: 15, onExceed: 'DENY' },
      ],
    },
    facts: { usage: () => ({ used: 1, remaining: 14 }) },
    options: { grantId: 'g1' },
    key: 'limits',
    expected: 'I',
    code: SupportAccessReason.LIMIT_EXCEEDED,
  },
  // ───── patients.scope
  {
    name: 'patients.scope T: cita en la ventana con el doctor cubierto',
    atom: 'agenda.appointment.cancel',
    cond: {
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: {
          daysBefore: 0,
          daysAfter: 7,
          withCoveredDoctor: true,
        },
      },
    },
    ctx: CTX_PATIENT,
    facts: withPatient({ hasBookingInWindow: () => true }),
    options: { coveredPractitionerProfileId: 'dr-perez' },
    key: 'patients.scope',
    expected: 'T',
  },
  {
    name: 'patients.scope F: sin cita en la ventana',
    atom: 'agenda.appointment.cancel',
    cond: {
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: { daysBefore: 0, daysAfter: 0 },
      },
    },
    ctx: CTX_PATIENT,
    facts: withPatient({ hasBookingInWindow: () => false }),
    key: 'patients.scope',
    expected: 'F',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  {
    name: 'patients.scope I: no se pudo consultar las citas del paciente',
    atom: 'agenda.appointment.cancel',
    cond: {
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: { daysBefore: 0, daysAfter: 0 },
      },
    },
    ctx: CTX_PATIENT,
    facts: withPatient(),
    key: 'patients.scope',
    expected: 'I',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  {
    name: 'patients.scope T: equipo asistencial del doctor cubierto',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { scope: 'CARE_TEAM_OF_COVERED_DOCTOR' } },
    ctx: CTX_PATIENT,
    facts: withPatient({ inCareTeamOf: (d) => d === 'dr-perez' }),
    options: { coveredPractitionerProfileId: 'dr-perez' },
    key: 'patients.scope',
    expected: 'T',
  },
  {
    name: 'patients.scope F: fuera del equipo asistencial',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { scope: 'CARE_TEAM_OF_COVERED_DOCTOR' } },
    ctx: CTX_PATIENT,
    facts: withPatient({ inCareTeamOf: () => false }),
    options: { coveredPractitionerProfileId: 'dr-perez' },
    key: 'patients.scope',
    expected: 'F',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  {
    name: 'patients.scope I: equipo asistencial sin doctor de referencia',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { scope: 'CARE_TEAM_OF_COVERED_DOCTOR' } },
    ctx: CTX_PATIENT,
    facts: withPatient({ inCareTeamOf: () => true }),
    key: 'patients.scope',
    expected: 'I',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  // ───── patients.age
  {
    name: 'patients.age T: 45 años dentro de 18-65',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { age: { min: 18, max: 65 } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ ageYears: 45 }),
    key: 'patients.age',
    expected: 'T',
  },
  {
    name: 'patients.age F: 72 años fuera de 18-65',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { age: { min: 18, max: 65 } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ ageYears: 72 }),
    key: 'patients.age',
    expected: 'F',
    code: SupportAccessReason.PATIENT_AGE,
  },
  {
    name: 'C-07 patients.age I: sin fecha de nacimiento (Sandra)',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { age: { min: 18 } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ birthDateKnown: false }),
    key: 'patients.age',
    expected: 'I',
    code: SupportAccessReason.PATIENT_AGE_UNKNOWN,
  },
  // ───── patients.isMinor
  {
    name: 'patients.isMinor T: el menor coincide con isMinor = true',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { isMinor: true } },
    ctx: CTX_PATIENT,
    facts: withPatient({ ageYears: 8 }),
    key: 'patients.isMinor',
    expected: 'T',
  },
  {
    name: 'patients.isMinor F: un adulto no coincide con isMinor = true',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { isMinor: true } },
    ctx: CTX_PATIENT,
    facts: withPatient({ ageYears: 45 }),
    key: 'patients.isMinor',
    expected: 'F',
    code: SupportAccessReason.PATIENT_AGE,
  },
  {
    name: 'patients.isMinor I: edad desconocida',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { isMinor: false } },
    ctx: CTX_PATIENT,
    facts: withPatient({ birthDateKnown: false }),
    key: 'patients.isMinor',
    expected: 'I',
    code: SupportAccessReason.PATIENT_AGE_UNKNOWN,
  },
  // ───── patients.coverage
  {
    name: 'patients.coverage T: solo asegurados y el paciente lo está',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { coverage: { mode: 'INSURED_ONLY' } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ insured: true }),
    key: 'patients.coverage',
    expected: 'T',
  },
  {
    name: 'patients.coverage F: solo asegurados y no tiene seguro',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { coverage: { mode: 'INSURED_ONLY' } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ insured: false }),
    key: 'patients.coverage',
    expected: 'F',
    code: SupportAccessReason.PATIENT_COVERAGE,
  },
  {
    name: 'patients.coverage I: no se sabe si tiene seguro',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { coverage: { mode: 'SELF_PAY_ONLY' } } },
    ctx: CTX_PATIENT,
    facts: withPatient(),
    key: 'patients.coverage',
    expected: 'I',
    code: SupportAccessReason.PATIENT_COVERAGE,
  },
  {
    name: 'patients.coverage F: la aseguradora no está entre las pedidas',
    atom: 'agenda.appointment.cancel',
    cond: {
      patients: { coverage: { mode: 'INSURED_ONLY', carrierIds: ['c-1'] } },
    },
    ctx: CTX_PATIENT,
    facts: withPatient({ insured: true, carrierIds: ['c-2'] }),
    key: 'patients.coverage',
    expected: 'F',
    code: SupportAccessReason.PATIENT_COVERAGE,
  },
  // ───── patients.flags.anyOf (filas DENY)
  {
    name: 'patients.flags T: el paciente tiene CONFIDENTIAL',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { flags: { anyOf: ['CONFIDENTIAL'] } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ flags: ['CONFIDENTIAL'] }),
    key: 'patients.flags',
    expected: 'T',
  },
  {
    name: 'patients.flags F: sin banderas',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { flags: { anyOf: ['CONFIDENTIAL'] } } },
    ctx: CTX_PATIENT,
    facts: withPatient(),
    key: 'patients.flags',
    expected: 'F',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  {
    name: 'patients.flags I: paciente sin resolver',
    atom: 'agenda.appointment.view.reason',
    cond: { patients: { flags: { anyOf: ['CONFIDENTIAL'] } } },
    key: 'patients.flags',
    expected: 'I',
    code: SupportAccessReason.PATIENT_SCOPE,
  },
  // ───── patients.exclude
  {
    name: 'patients.exclude T: sin banderas excluidas',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ flags: ['STAFF_RELATIVE'] }),
    key: 'patients.exclude',
    expected: 'T',
  },
  {
    name: 'C-05 patients.exclude F: paciente CONFIDENTIAL',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ flags: ['CONFIDENTIAL'] }),
    key: 'patients.exclude',
    expected: 'F',
    code: SupportAccessReason.PATIENT_EXCLUDED,
  },
  {
    name: 'patients.exclude F: excluir menores gana sobre un alcance abierto',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { scope: 'ANY', exclude: { minors: true } } },
    ctx: CTX_PATIENT,
    facts: withPatient({ ageYears: 8 }),
    key: 'patients.exclude',
    expected: 'F',
    code: SupportAccessReason.PATIENT_EXCLUDED,
  },
  {
    name: 'patients.exclude I: sin paciente no se puede descartar que sea reservado',
    atom: 'agenda.appointment.cancel',
    cond: { patients: { exclude: { flags: ['VIP'] } } },
    key: 'patients.exclude',
    expected: 'I',
    code: SupportAccessReason.PATIENT_EXCLUDED,
  },
  // ───── appointment.window
  {
    name: 'appointment.window T: la cita de mañana cae entre ayer y +14 días',
    atom: 'agenda.appointment.view.reason',
    cond: { appointment: { window: { daysBefore: 1, daysAfter: 14 } } },
    ctx: { appointmentStartAt: daysFromNow(1) },
    key: 'appointment.window',
    expected: 'T',
  },
  {
    name: 'appointment.window F: la cita de dentro de 20 días queda fuera',
    atom: 'agenda.appointment.view.reason',
    cond: { appointment: { window: { daysBefore: 1, daysAfter: 14 } } },
    ctx: { appointmentStartAt: daysFromNow(20) },
    key: 'appointment.window',
    expected: 'F',
    code: SupportAccessReason.APPOINTMENT_WINDOW,
  },
  {
    name: 'appointment.window I: sin fecha de la cita',
    atom: 'agenda.appointment.view.reason',
    cond: { appointment: { window: { daysBefore: 1, daysAfter: 14 } } },
    key: 'appointment.window',
    expected: 'I',
    code: SupportAccessReason.APPOINTMENT_WINDOW,
  },
  // ───── appointment.leadTime
  {
    name: 'leadTime T: faltan 30 h y se piden 24',
    atom: 'agenda.appointment.cancel',
    cond: { appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } } },
    ctx: { appointmentStartAt: hoursFromNow(30) },
    key: 'appointment.leadTime',
    expected: 'T',
  },
  {
    name: 'C-03 leadTime F: faltan 6 h y se piden 24',
    atom: 'agenda.appointment.cancel',
    cond: {
      appointment: {
        leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
      },
    },
    ctx: { appointmentStartAt: hoursFromNow(6) },
    key: 'appointment.leadTime',
    expected: 'F',
    code: SupportAccessReason.LEAD_TIME,
  },
  {
    name: 'leadTime F: una cita ya empezada siempre incumple',
    atom: 'agenda.appointment.cancel',
    cond: { appointment: { leadTime: { minHours: 1, onViolation: 'DENY' } } },
    ctx: { appointmentStartAt: hoursFromNow(-1.5) },
    key: 'appointment.leadTime',
    expected: 'F',
    code: SupportAccessReason.LEAD_TIME,
  },
  {
    name: 'leadTime I: sin fecha de la cita',
    atom: 'agenda.appointment.reschedule',
    cond: { appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } } },
    key: 'appointment.leadTime',
    expected: 'I',
    code: SupportAccessReason.LEAD_TIME,
  },
  // ───── appointment.horizon
  {
    name: 'horizon T: dentro de 90 días',
    atom: 'agenda.appointment.create',
    cond: { appointment: { horizon: { maxDaysAhead: 90 } } },
    ctx: { newAppointmentStartAt: daysFromNow(30) },
    key: 'appointment.horizon',
    expected: 'T',
  },
  {
    name: 'horizon F: a 120 días',
    atom: 'agenda.appointment.create',
    cond: { appointment: { horizon: { maxDaysAhead: 90 } } },
    ctx: { newAppointmentStartAt: daysFromNow(120) },
    key: 'appointment.horizon',
    expected: 'F',
    code: SupportAccessReason.HORIZON,
  },
  {
    name: 'horizon I: sin fecha de destino',
    atom: 'agenda.appointment.create',
    cond: { appointment: { horizon: { maxDaysAhead: 90 } } },
    key: 'appointment.horizon',
    expected: 'I',
    code: SupportAccessReason.HORIZON,
  },
  // ───── channels
  {
    name: 'channels T: CHAT está permitido',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { channels: { allow: ['CHAT'] } },
    ctx: { channels: ['CHAT'] },
    key: 'channels',
    expected: 'T',
  },
  {
    name: 'channels F: EMAIL no está permitido',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { channels: { allow: ['CHAT'] } },
    ctx: { channels: ['CHAT', 'EMAIL'] },
    key: 'channels',
    expected: 'F',
    code: SupportAccessReason.CHANNEL_NOT_ALLOWED,
  },
  {
    name: 'channels I: la acción no declara canales',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { channels: { allow: ['CHAT'] } },
    ctx: { channels: [] },
    key: 'channels',
    expected: 'I',
    code: SupportAccessReason.CHANNEL_UNKNOWN,
  },
  // ───── amount
  {
    name: 'C-08 amount T: Bs 1 500 con tope de Bs 2 000 por operación',
    atom: 'billing.payment.collect',
    cond: {
      amount: {
        currency: 'BOB',
        perTransactionMax: 2000,
        onExceed: 'REQUIRE_APPROVAL',
      },
    },
    ctx: { amount: { currency: 'BOB', minorUnits: 150_000 } },
    key: 'amount',
    expected: 'T',
  },
  {
    name: 'C-08 amount F: Bs 2 500 supera Bs 2 000',
    atom: 'billing.payment.collect',
    cond: {
      amount: {
        currency: 'BOB',
        perTransactionMax: 2000,
        onExceed: 'REQUIRE_APPROVAL',
      },
    },
    ctx: { amount: { currency: 'BOB', minorUnits: 250_000 } },
    key: 'amount',
    expected: 'F',
    code: SupportAccessReason.AMOUNT_LIMIT,
  },
  {
    name: 'C-08 amount I: sin monto en el contexto',
    atom: 'billing.payment.collect',
    cond: {
      amount: {
        currency: 'BOB',
        perTransactionMax: 2000,
        onExceed: 'REQUIRE_APPROVAL',
      },
    },
    key: 'amount',
    expected: 'I',
    code: SupportAccessReason.AMOUNT_UNKNOWN,
  },
  {
    name: 'amount F: el acumulado del día pasa de perDayMax',
    atom: 'billing.payment.collect',
    cond: { amount: { currency: 'BOB', perDayMax: 20000, onExceed: 'DENY' } },
    ctx: { amount: { currency: 'BOB', minorUnits: 200_000 } },
    facts: { usage: () => ({ used: 1_900_000, remaining: 100_000 }) },
    options: { grantId: 'g1' },
    key: 'amount',
    expected: 'F',
    code: SupportAccessReason.AMOUNT_LIMIT,
  },
  {
    name: 'amount F: descuento mayor al máximo',
    atom: 'billing.discount.apply',
    cond: {
      amount: { currency: 'BOB', maxDiscountPercent: 10, onExceed: 'DENY' },
    },
    ctx: {
      amount: { currency: 'BOB', minorUnits: 10_000, discountPercent: 25 },
    },
    key: 'amount',
    expected: 'F',
    code: SupportAccessReason.AMOUNT_LIMIT,
  },
  // ───── session
  {
    name: 'session T: sesión de 1 h con tope de 4 h',
    atom: 'agenda.appointment.cancel',
    cond: { session: { maxSessionMinutes: 240 } },
    facts: { session: { startedAt: hoursFromNow(-1) } },
    key: 'session',
    expected: 'T',
  },
  {
    name: 'C-11 session F: sesión de 5 h con tope de 4 h',
    atom: 'agenda.appointment.cancel',
    cond: { session: { maxSessionMinutes: 240 } },
    facts: { session: { startedAt: hoursFromNow(-5) } },
    key: 'session',
    expected: 'F',
    code: SupportAccessReason.SESSION_TOO_LONG,
  },
  {
    name: 'session I: sesión no resoluble',
    atom: 'agenda.appointment.cancel',
    cond: { session: { maxSessionMinutes: 240 } },
    key: 'session',
    expected: 'I',
    code: SupportAccessReason.SESSION_TOO_LONG,
  },
  // ───── network
  {
    name: 'network T: la IP pasa las reglas de la organización',
    atom: 'billing.payment.collect',
    cond: { network: { require: 'ORG_RULES' } },
    facts: { network: { satisfiesOrgRules: true, orgHasAllowRules: true } },
    key: 'network',
    expected: 'T',
  },
  {
    name: 'C-09 network F: IP fuera de la red de la organización',
    atom: 'billing.payment.collect',
    cond: { network: { require: 'ORG_RULES' } },
    facts: { network: { satisfiesOrgRules: false, orgHasAllowRules: true } },
    key: 'network',
    expected: 'F',
    code: SupportAccessReason.NETWORK_NOT_ALLOWED,
  },
  {
    name: 'network I: la organización no definió redes permitidas',
    atom: 'billing.payment.collect',
    cond: { network: { require: 'ORG_RULES' } },
    facts: { network: { satisfiesOrgRules: false, orgHasAllowRules: false } },
    key: 'network',
    expected: 'I',
    code: SupportAccessReason.NETWORK_RULES_NOT_CONFIGURED,
  },
  {
    name: 'network I: no se resolvió la red',
    atom: 'billing.payment.collect',
    cond: { network: { require: 'ORG_RULES' } },
    key: 'network',
    expected: 'I',
    code: SupportAccessReason.NETWORK_NOT_ALLOWED,
  },
  {
    name: 'network T: require ANY no restringe',
    atom: 'billing.payment.collect',
    cond: { network: { require: 'ANY' } },
    key: 'network',
    expected: 'T',
  },
  // ───── device
  {
    name: 'device T: equipo de confianza',
    atom: 'billing.payment.collect',
    cond: { device: { knownOnly: true } },
    facts: { device: { trusted: true } },
    key: 'device',
    expected: 'T',
  },
  {
    name: 'C-09 device F: equipo que no es de confianza',
    atom: 'billing.payment.collect',
    cond: { device: { knownOnly: true } },
    facts: { device: { trusted: false } },
    key: 'device',
    expected: 'F',
    code: SupportAccessReason.DEVICE_NOT_TRUSTED,
  },
  {
    name: 'device I: dispositivo no resuelto',
    atom: 'billing.payment.collect',
    cond: { device: { knownOnly: true } },
    key: 'device',
    expected: 'I',
    code: SupportAccessReason.DEVICE_NOT_TRUSTED,
  },
  // ───── presence
  {
    name: 'presence T: el doctor está en línea',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { presence: { doctor: 'ONLINE' } },
    facts: { doctorOnline: true },
    key: 'presence',
    expected: 'T',
  },
  {
    name: 'C-11 presence F: el doctor está fuera de línea',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { presence: { doctor: 'ONLINE' } },
    facts: { doctorOnline: false },
    key: 'presence',
    expected: 'F',
    code: SupportAccessReason.DOCTOR_OFFLINE,
  },
  {
    name: 'presence I: presencia no resuelta',
    atom: 'messages.conversation.reply_on_behalf',
    cond: { presence: { doctor: 'ONLINE' } },
    key: 'presence',
    expected: 'I',
    code: SupportAccessReason.DOCTOR_OFFLINE,
  },
];

describe('AC-3 · condiciones v1 · tabla T/F/I por clave (§3.4)', () => {
  it.each(ROWS.map((row) => [row.name, row] as const))('%s', (_name, row) => {
    const result = evaluateConditions(
      { schemaVersion: V1, ...row.cond },
      row.atom,
      row.ctx,
      row.facts,
      row.now ?? NOW,
      { evaluateAll: true, ...row.options },
    );
    expect(result.predicates[row.key]).toBe(row.expected);
    const unmet = result.unmet.filter((u) => u.key === row.key);
    if (row.expected === 'T') {
      expect(unmet).toHaveLength(0);
    } else {
      expect(unmet.length).toBeGreaterThanOrEqual(1);
      expect(unmet[0].status).toBe(row.expected);
      expect(unmet[0].code).toBe(row.code);
    }
  });

  it('cubre las 12 claves de §3.4 con al menos tres casos T, F e I cada una', () => {
    const byKey = new Map<string, Set<Tri>>();
    for (const row of ROWS) {
      byKey.set(
        row.key,
        new Set([...(byKey.get(row.key) ?? []), row.expected]),
      );
    }
    for (const key of [
      'time',
      'limits',
      'patients.scope',
      'patients.age',
      'patients.isMinor',
      'patients.coverage',
      'patients.flags',
      'patients.exclude',
      'appointment.window',
      'appointment.leadTime',
      'appointment.horizon',
      'channels',
      'amount',
      'session',
      'network',
      'device',
      'presence',
    ]) {
      expect([...(byKey.get(key) ?? [])].sort()).toEqual(['F', 'I', 'T']);
    }
  });
});

describe('support-conditions · detalles de los incumplimientos', () => {
  it('limits F trae métrica, periodo, tope, uso y cuándo se renueva (C-04)', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
      },
      'agenda.appointment.cancel',
      undefined,
      { usage: () => ({ used: 20, remaining: 0 }) },
      NOW,
      { grantId: 'g1' },
    );
    expect(result.unmet[0].details).toEqual({
      metric: 'ACTIONS',
      per: 'DAY',
      max: 20,
      used: 20,
      resetsAt: '2026-11-04T04:00:00.000Z',
    });
    expect(result.unmet[0].approvable).toBe(false);
  });

  it('la clave del contador sale del permiso, el grupo y el periodo', () => {
    const keys: UsageKey[] = [];
    const facts: SupportAccessFacts = {
      usage: (key) => {
        keys.push(key);
        return { used: 0, remaining: 20 };
      },
    };
    const cond: SupportCondition = {
      schemaVersion: V1,
      limits: [
        { metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' },
        {
          metric: 'ACTIONS',
          per: 'WEEK',
          max: 50,
          scope: 'PERSON',
          group: 'cambios-agenda',
          onExceed: 'DENY',
        },
      ],
    };
    evaluateConditions(
      cond,
      'agenda.appointment.cancel',
      undefined,
      facts,
      NOW,
      {
        grantId: 'g1',
        subjectId: 'u-1',
      },
    );
    expect(keys).toEqual([
      {
        metric: 'ACTIONS',
        per: 'DAY',
        period: '2026-11-03',
        scope: 'GRANT',
        subject: 'g1',
        bucket: 'agenda.appointment.cancel',
      },
      {
        metric: 'ACTIONS',
        per: 'WEEK',
        period: '2026-W45',
        scope: 'PERSON',
        subject: 'u-1',
        bucket: 'cambios-agenda',
      },
    ]);
  });

  it('un límite que se cumple pide consumir 1 y DISTINCT_PATIENTS cuenta al paciente', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        limits: [
          { metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' },
          {
            metric: 'DISTINCT_PATIENTS',
            per: 'HOUR',
            max: 15,
            onExceed: 'DENY',
          },
        ],
      },
      'patients.search.exact',
      { patientProfileId: 'p-1' },
      { usage: () => ({ used: 1, remaining: 10 }) },
      NOW,
      { grantId: 'g1' },
    );
    expect(result.unmet).toEqual([]);
    expect(
      result.usage.map((u) => [u.key.metric, u.amount, u.key.patientProfileId]),
    ).toEqual([
      ['ACTIONS', 1, undefined],
      ['DISTINCT_PATIENTS', 1, 'p-1'],
    ]);
  });

  it('el monto por día suma el monto de la operación al contador', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        amount: { currency: 'BOB', perDayMax: 20000, onExceed: 'DENY' },
      },
      'billing.payment.collect',
      { amount: { currency: 'BOB', minorUnits: 12_345 } },
      { usage: () => ({ used: 1, remaining: 10 }) },
      NOW,
      { grantId: 'g1' },
    );
    expect(result.unmet).toEqual([]);
    expect(result.usage).toEqual([
      {
        key: {
          metric: 'AMOUNT',
          per: 'DAY',
          period: '2026-11-03',
          scope: 'GRANT',
          subject: 'g1',
          bucket: 'billing.payment.collect',
        },
        amount: 12_345,
      },
    ]);
  });

  it('LEAD_TIME trae minHours, hoursLeft y onViolation; approvable según onViolation (C-03)', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        appointment: {
          leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
        },
      },
      'agenda.appointment.cancel',
      { appointmentStartAt: hoursFromNow(6) },
      undefined,
      NOW,
    );
    expect(result.unmet[0]).toMatchObject({
      key: 'appointment.leadTime',
      code: SupportAccessReason.LEAD_TIME,
      approvable: true,
      details: { minHours: 24, hoursLeft: 6, onViolation: 'REQUIRE_APPROVAL' },
    });
    const deny = evaluateConditions(
      {
        schemaVersion: V1,
        appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
      },
      'agenda.appointment.cancel',
      { appointmentStartAt: hoursFromNow(6) },
      undefined,
      NOW,
    );
    expect(deny.unmet[0].approvable).toBe(false);
  });

  it('el monto que se pasa con REQUIRE_APPROVAL es aprobable; sin monto (AMOUNT_UNKNOWN) no', () => {
    const cond: SupportCondition = {
      schemaVersion: V1,
      amount: {
        currency: 'BOB',
        perTransactionMax: 2000,
        onExceed: 'REQUIRE_APPROVAL',
      },
    };
    const over = evaluateConditions(
      cond,
      'billing.payment.collect',
      { amount: { currency: 'BOB', minorUnits: 250_000 } },
      undefined,
      NOW,
    );
    expect(over.unmet[0].approvable).toBe(true);
    const unknown = evaluateConditions(
      cond,
      'billing.payment.collect',
      undefined,
      undefined,
      NOW,
    );
    expect(unknown.unmet[0]).toMatchObject({
      code: SupportAccessReason.AMOUNT_UNKNOWN,
      approvable: false,
    });
  });

  it('una moneda distinta de BOB no se acepta (v1)', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        amount: { currency: 'BOB', perTransactionMax: 100, onExceed: 'DENY' },
      },
      'billing.payment.collect',
      { amount: { currency: 'USD' as 'BOB', minorUnits: 1 } },
      undefined,
      NOW,
    );
    expect(result.predicates.amount).toBe('I');
  });

  it('el reloj manda: ctx.now no cambia el resultado y el `now` explícito sí', () => {
    const cond: SupportCondition = {
      schemaVersion: V1,
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [2], from: '08:00', to: '12:00' }],
      },
    };
    expect(
      evaluateConditions(
        cond,
        'agenda.appointment.cancel',
        undefined,
        undefined,
        NOW,
      ).predicates.time,
    ).toBe('T');
    expect(
      evaluateConditions(
        cond,
        'agenda.appointment.cancel',
        undefined,
        undefined,
        new Date('2026-11-03T15:00:00-04:00'),
      ).predicates.time,
    ).toBe('F');
  });

  it('time sin timeZone usa la de la organización y, sin ella, La Paz', () => {
    const cond: SupportCondition = {
      schemaVersion: V1,
      time: { windows: [{ days: [2], from: '10:00', to: '11:00' }] },
    };
    // 10:30 La Paz = 14:30 UTC: en UTC no estaría dentro de 10-11.
    expect(
      evaluateConditions(
        cond,
        'agenda.appointment.cancel',
        undefined,
        undefined,
        NOW,
      ).predicates.time,
    ).toBe('T');
    expect(
      evaluateConditions(
        cond,
        'agenda.appointment.cancel',
        undefined,
        undefined,
        NOW,
        { timeZone: 'UTC' },
      ).predicates.time,
    ).toBe('F');
  });

  it('las claves que no aplican al átomo no se evalúan (se rechazan al guardar)', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
        channels: { allow: ['CHAT'] },
      },
      'agenda.appointment.view',
      undefined,
      undefined,
      NOW,
    );
    expect(result.predicates).toEqual({});
    expect(result.unmet).toEqual([]);
  });

  it('las facetas caras no se consultan si una barata ya falló, salvo peek/evaluateAll', () => {
    const cond: SupportCondition = {
      schemaVersion: V1,
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [6], from: '08:00', to: '12:00' }],
      },
      network: { require: 'ORG_RULES' },
    };
    const lazy = evaluateConditions(
      cond,
      'billing.payment.collect',
      undefined,
      undefined,
      NOW,
    );
    expect(Object.keys(lazy.predicates)).toEqual(['time']);
    const peek = evaluateConditions(
      cond,
      'billing.payment.collect',
      { peek: true },
      undefined,
      NOW,
    );
    expect(Object.keys(peek.predicates).sort()).toEqual(['network', 'time']);
    const all = evaluateConditions(
      cond,
      'billing.payment.collect',
      undefined,
      undefined,
      NOW,
      { evaluateAll: true },
    );
    expect(Object.keys(all.predicates).sort()).toEqual(['network', 'time']);
  });

  it('los incumplimientos salen en el orden de evaluación del contrato', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        amount: { currency: 'BOB', perTransactionMax: 1, onExceed: 'DENY' },
        presence: { doctor: 'ONLINE' },
        network: { require: 'ORG_RULES' },
        time: {
          timeZone: 'America/La_Paz',
          windows: [{ days: [6], from: '08:00', to: '12:00' }],
        },
        channels: { allow: ['CHAT'] },
      },
      'messages.conversation.reply_on_behalf',
      { channels: ['EMAIL'], amount: { currency: 'BOB', minorUnits: 100 } },
      {
        network: { satisfiesOrgRules: false, orgHasAllowRules: true },
        doctorOnline: false,
      },
      NOW,
      { evaluateAll: true },
    );
    expect(result.unmet.map((u) => u.key)).toEqual([
      'time',
      'channels',
      'network',
      'presence',
    ]);
  });
});

describe('support-conditions · salidas: campos y obligaciones', () => {
  it('fields devuelve la máscara de cada campo del permiso', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
      },
      'agenda.appointment.view.reason',
      undefined,
      undefined,
      NOW,
    );
    expect(result.fields).toEqual({
      'agenda.appointment.view.reason': 'PARTIAL',
    });
    expect(result.unmet).toEqual([]);
  });

  it('obligations devuelve motivo, paso extra y aprobación pedidos por la condición', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        obligations: {
          requireReason: { minLength: 10 },
          stepUp: { maxAgeMinutes: 5 },
          approval: { by: 'SECOND_APPROVER', ttlMinutes: 30 },
        },
      },
      'billing.receipt.void',
      undefined,
      undefined,
      NOW,
    );
    expect(result.obligations).toEqual({
      reason: { minLength: 10 },
      stepUp: { maxAgeMinutes: 5 },
      approval: { by: 'SECOND_APPROVER', ttlMinutes: 30 },
    });
  });

  it('el valor por defecto de stepUp es 10 min y el de la aprobación, 60 min', () => {
    const result = evaluateConditions(
      {
        schemaVersion: V1,
        obligations: { stepUp: {}, approval: { by: 'DOCTOR' } },
      },
      'billing.receipt.void',
      undefined,
      undefined,
      NOW,
    );
    expect(result.obligations.stepUp).toEqual({ maxAgeMinutes: 10 });
    expect(result.obligations.approval).toEqual({
      by: 'DOCTOR',
      ttlMinutes: 60,
    });
  });
});

describe('support-conditions · requiredFacets y aplicabilidad', () => {
  it('sin condiciones no se pide ninguna faceta', () => {
    expect(requiredFacets({ schemaVersion: V1 }).size).toBe(0);
  });

  it('cada clave pide sus facetas', () => {
    const facets = requiredFacets({
      schemaVersion: V1,
      time: { windows: [{ days: [1], from: '08:00', to: '09:00' }] },
      patients: { exclude: { flags: ['VIP'] } },
      session: { maxSessionMinutes: 60 },
      network: { require: 'ORG_RULES' },
      device: { knownOnly: true },
      presence: { doctor: 'ONLINE' },
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 1, onExceed: 'DENY' }],
      obligations: { stepUp: { maxAgeMinutes: 5 } },
    });
    expect([...facets].sort()).toEqual([
      'device',
      'doctorOnline',
      'network',
      'patient',
      'session',
      'stepUp',
      'usage',
    ]);
  });

  it('requiredFacets con átomo ignora las claves que no le aplican', () => {
    const cond: SupportCondition = {
      schemaVersion: V1,
      session: { maxSessionMinutes: 60 },
      patients: { exclude: { minors: true } },
    };
    expect([...requiredFacets(cond, 'patients.profile.register')]).toEqual([
      'session',
    ]);
    expect(
      [...requiredFacets(cond, 'agenda.appointment.cancel')].sort(),
    ).toEqual(['patient', 'session']);
  });

  it('un átomo con catálogo de paso extra pide la faceta stepUp aunque la condición no diga nada', () => {
    expect([
      ...requiredFacets({ schemaVersion: V1 }, 'billing.receipt.void'),
    ]).toEqual(['stepUp']);
  });

  it('conditionKeyAppliesToAtom sigue la tabla del §3.6', () => {
    expect(
      conditionKeyAppliesToAtom(
        'appointment.leadTime',
        'agenda.appointment.cancel',
      ),
    ).toBe(true);
    expect(
      conditionKeyAppliesToAtom(
        'appointment.leadTime',
        'agenda.appointment.create',
      ),
    ).toBe(false);
    expect(
      conditionKeyAppliesToAtom(
        'appointment.horizon',
        'agenda.appointment.walk_in',
      ),
    ).toBe(true);
    expect(
      conditionKeyAppliesToAtom('channels', 'messages.broadcast.send'),
    ).toBe(true);
    expect(conditionKeyAppliesToAtom('channels', 'messages.inbox.view')).toBe(
      false,
    );
    expect(conditionKeyAppliesToAtom('amount', 'billing.invoice.view')).toBe(
      false,
    );
    expect(
      conditionKeyAppliesToAtom('patients', 'patients.profile.register'),
    ).toBe(false);
    expect(
      conditionKeyAppliesToAtom('patients', 'patients.guardian.record'),
    ).toBe(true);
    expect(
      conditionKeyAppliesToAtom('presence', 'billing.payment.collect'),
    ).toBe(false);
    expect(conditionKeyAppliesToAtom('time', 'billing.payment.collect')).toBe(
      true,
    );
    expect(conditionKeyAppliesToAtom('time', 'team.guardrails.manage')).toBe(
      false,
    );
  });
});
