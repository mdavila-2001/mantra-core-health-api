import type { SupportActionCode } from './support-actions';

/**
 * Cómo se lee la cadena de auditoría como actividad del personal de apoyo: qué
 * asiento es qué acción, con qué permiso se hizo y cómo se dice en palabras.
 * Todo es identificadores y verbos: ninguna fila lleva datos clínicos.
 */

/** Un tipo de asiento reconocido de la bitácora. */
export interface ActivityKind {
  /** Código que ve el cliente: el permiso (`schedule.check_in`) o el evento (`engagement.ended`). */
  readonly code: string;
  /** Permiso de apoyo con el que se hizo, si es una acción de agenda. */
  readonly permission?: SupportActionCode;
  /** Qué hizo la persona, en pasado (sin sujeto): «confirmó una cita». */
  readonly verb: string;
}

/** Asientos de auditoría (`audit.audit_log.action`) que se reconocen. */
export const ACTIVITY_KINDS: Readonly<Record<string, ActivityKind>> = {
  BOOKING_ACCEPTED: {
    code: 'schedule.confirm',
    permission: 'schedule.confirm',
    verb: 'confirmó una cita',
  },
  BOOKING_CONFIRMED: {
    code: 'schedule.confirm',
    permission: 'schedule.confirm',
    verb: 'confirmó una cita',
  },
  BOOKING_CANCELLED: {
    code: 'schedule.cancel',
    permission: 'schedule.cancel',
    verb: 'canceló una cita',
  },
  BOOKING_RESCHEDULED: {
    code: 'schedule.reschedule',
    permission: 'schedule.reschedule',
    verb: 'reprogramó una cita',
  },
  BOOKING_CHECKED_IN: {
    code: 'schedule.check_in',
    permission: 'schedule.check_in',
    verb: 'registró la llegada de un paciente',
  },
  DIRECT_APPOINTMENT_CREATED: {
    code: 'schedule.create',
    permission: 'schedule.create',
    verb: 'creó una cita',
  },
  WALK_IN_APPOINTMENT_CREATED: {
    code: 'schedule.walk_in',
    permission: 'schedule.walk_in',
    verb: 'atendió a un paciente sin cita',
  },
  WAITLIST_ENTRY_ENROLLED: {
    code: 'schedule.waitlist',
    permission: 'schedule.waitlist',
    verb: 'anotó a un paciente en la lista de espera',
  },
  BOOKING_REMINDERS_SCHEDULED: {
    code: 'schedule.send_reminders',
    permission: 'schedule.send_reminders',
    verb: 'programó recordatorios de una cita',
  },
  SUPPORT_ENGAGEMENT_REQUESTED: {
    code: 'request.created',
    verb: 'pidió acceso',
  },
  SUPPORT_ENGAGEMENT_REQUEST_DECIDED: {
    code: 'request.decided',
    verb: 'resolvió una solicitud',
  },
  SUPPORT_GRANT_CREATED: { code: 'grant.created', verb: 'agregó un permiso' },
  SUPPORT_GRANT_UPDATED: { code: 'grant.updated', verb: 'cambió un permiso' },
  SUPPORT_ENGAGEMENT_RECERTIFIED: {
    code: 'engagement.recertified',
    verb: 'confirmó un vínculo',
  },
  SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON: {
    code: 'engagement.confirmed_by_person',
    verb: 'confirmó su propio vínculo',
  },
  SUPPORT_ENGAGEMENT_ENDED: {
    code: 'engagement.ended',
    verb: 'terminó un vínculo',
  },
  AFFILIATION_INVITATION_REDEEMED: {
    code: 'invitation.redeemed',
    verb: 'usó una invitación',
  },
  SUPPORT_DELEGATE_ACCEPTED: {
    code: 'delegate.accepted',
    verb: 'aceptó a una persona de apoyo',
  },
  SUPPORT_CLINICAL_ACCESS_REQUESTED: {
    code: 'clinical_access.requested',
    verb: 'pidió un acceso clínico temporal',
  },
  SUPPORT_PATIENT_SEARCHED: {
    code: 'patient.search',
    verb: 'buscó a un paciente',
  },
  // Gobierno de accesos: decisiones, reglas, SoD, cuatro ojos y banderas (B4a).
  ACCESS_EXPLAINED: {
    code: 'access.explained',
    verb: 'consultó por qué una persona puede o no puede hacer algo',
  },
  ACCESS_SIMULATED: {
    code: 'access.simulated',
    verb: 'simuló un cambio de permisos',
  },
  SUPPORT_GRANT_CONDITIONS_UPDATED: {
    code: 'grant.conditions_updated',
    verb: 'cambió las condiciones de un permiso',
  },
  SUPPORT_GRANT_DENY_CREATED: {
    code: 'grant.deny_created',
    verb: 'agregó una prohibición expresa',
  },
  SUPPORT_GRANT_NORMALIZED: {
    code: 'grant.normalized',
    verb: 'normalizó permisos heredados',
  },
  SUPPORT_GRANT_NORMALIZE_REVERTED: {
    code: 'grant.normalize_reverted',
    verb: 'revirtió una normalización de permisos',
  },
  GOVERNANCE_RULE_CREATED: {
    code: 'rule.created',
    verb: 'creó una regla de la organización',
  },
  GOVERNANCE_RULE_UPDATED: {
    code: 'rule.updated',
    verb: 'cambió una regla de la organización',
  },
  GOVERNANCE_RULE_RETIRED: {
    code: 'rule.retired',
    verb: 'retiró una regla de la organización',
  },
  GOVERNANCE_SETTINGS_UPDATED: {
    code: 'settings.updated',
    verb: 'cambió los ajustes de gobierno',
  },
  SOD_RULE_CREATED: {
    code: 'sod.rule_created',
    verb: 'creó una regla de segregación de funciones',
  },
  SOD_RULE_UPDATED: {
    code: 'sod.rule_updated',
    verb: 'cambió una regla de segregación de funciones',
  },
  PATIENT_RESTRICTION_FLAGS_UPDATED: {
    code: 'patient.flags_updated',
    verb: 'cambió las restricciones de un paciente',
  },
  SOD_EXCEPTION_REQUESTED: {
    code: 'sod.exception_requested',
    verb: 'pidió una excepción de segregación de funciones',
  },
  SOD_EXCEPTION_GRANTED: {
    code: 'sod.exception_granted',
    verb: 'otorgó una excepción de segregación de funciones',
  },
  SOD_EXCEPTION_REVOKED: {
    code: 'sod.exception_revoked',
    verb: 'revocó una excepción de segregación de funciones',
  },
  SOD_EXCEPTION_EXPIRED: {
    code: 'sod.exception_expired',
    verb: 'dejó vencer una excepción de segregación de funciones',
  },
  FOUR_EYES_REQUESTED: {
    code: 'approval.requested',
    verb: 'pidió una aprobación',
  },
  FOUR_EYES_APPROVED: {
    code: 'approval.approved',
    verb: 'aprobó una solicitud',
  },
  FOUR_EYES_REJECTED: {
    code: 'approval.rejected',
    verb: 'rechazó una solicitud',
  },
  FOUR_EYES_EXPIRED: {
    code: 'approval.expired',
    verb: 'dejó vencer una solicitud de aprobación',
  },
  FOUR_EYES_CANCELLED: {
    code: 'approval.cancelled',
    verb: 'canceló una solicitud de aprobación',
  },
  FOUR_EYES_EXECUTED: {
    code: 'approval.executed',
    verb: 'ejecutó un cambio aprobado',
  },
};

/** El tipo de un asiento; los que no se reconocen conservan su acción tal cual. */
export function activityKindOf(auditAction: string): ActivityKind {
  return (
    ACTIVITY_KINDS[auditAction] ?? {
      code: auditAction,
      verb: 'hizo una acción',
    }
  );
}

/**
 * Los asientos de auditoría que corresponden a un filtro `action`, que puede ser
 * el código del cliente (`schedule.confirm`, `engagement.ended`) o el asiento
 * crudo (`BOOKING_CONFIRMED`). Un código que se reconoce da todos sus asientos;
 * uno que no, se busca tal cual.
 *
 * @param action - Valor del filtro.
 * @returns Los asientos a buscar.
 */
export function auditActionsFor(action: string): string[] {
  const matches = Object.entries(ACTIVITY_KINDS)
    .filter(([, kind]) => kind.code === action)
    .map(([audit]) => audit);
  return matches.length > 0 ? matches : [action];
}

/** Zona en la que se leen los filtros de fecha sin hora (la de la plataforma, La Paz, UTC-4 todo el año). */
const DAY_OFFSET_HOURS = 4;

/**
 * Convierte un límite de fecha del filtro a un instante: una fecha sin hora
 * (`2026-10-30`) es el día completo en la hora de La Paz, así que `from` es su
 * inicio y `to` su último milisegundo; un instante con hora se respeta tal cual.
 *
 * @param value - `YYYY-MM-DD` o un instante ISO.
 * @param edge - `start` para el límite inferior, `end` para el superior.
 * @returns El instante, o `undefined` si no se puede leer.
 */
export function activityBoundary(
  value: string,
  edge: 'start' | 'end',
): Date | undefined {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (day) {
    const [year, month, date] = [
      Number(day[1]),
      Number(day[2]),
      Number(day[3]),
    ];
    const start = Date.UTC(year, month - 1, date, DAY_OFFSET_HOURS);
    return new Date(edge === 'start' ? start : start + 86_400_000 - 1);
  }
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? undefined : instant;
}

/** Posición en la bitácora: instante e id del último asiento entregado. */
export interface ActivityCursor {
  readonly recordedAt: Date;
  /** Ausente en los cursores de la primera versión (solo instante). */
  readonly id?: string;
}

/** Cursor opaco `instante|id`, para no perder asientos con el mismo instante. */
export function encodeActivityCursor(cursor: {
  recordedAt: Date;
  id: string;
}): string {
  return Buffer.from(
    `${cursor.recordedAt.toISOString()}|${cursor.id}`,
  ).toString('base64url');
}

/** Lee un cursor, también el antiguo que solo traía el instante; uno ilegible equivale a no tenerlo. */
export function decodeActivityCursor(
  cursor: string,
): ActivityCursor | undefined {
  const [instant, id] = Buffer.from(cursor, 'base64url')
    .toString('utf8')
    .split('|');
  const recordedAt = new Date(instant);
  if (Number.isNaN(recordedAt.getTime())) return undefined;
  return { recordedAt, ...(id ? { id } : {}) };
}

/** ¿Es el texto un uuid? Un filtro con uuid compara ids; con otro texto, nombres. */
export function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Compara dos nombres sin distinguir mayúsculas ni acentos. */
export function sameName(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const fold = (s: string): string =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
  return fold(a) === fold(b);
}

/**
 * La frase de una entrada: «Ana Gutiérrez confirmó una cita de Andrés Pérez».
 * Un asiento fallido se aclara: «(no se pudo)».
 *
 * @param actorName - Persona que actuó.
 * @param kind - Qué hizo.
 * @param doctorName - Doctor sobre el que actuó, si se conoce y se puede decir.
 * @param success - Si la acción se hizo.
 * @returns La frase.
 */
export function activitySummary(
  actorName: string,
  kind: ActivityKind,
  doctorName: string | undefined,
  success: boolean,
): string {
  const who = actorName || 'Una persona de apoyo';
  const about = doctorName ? ` (agenda de ${doctorName})` : '';
  return `${who} ${kind.verb}${about}${success ? '' : ': no se pudo hacer'}.`;
}

/** Cada acción de apoyo en palabras de quien la lee. */
const ACTION_LABELS: Readonly<Record<SupportActionCode, string>> = {
  'schedule.view': 'ver la agenda',
  'schedule.create': 'crear citas',
  'schedule.reschedule': 'reprogramar citas',
  'schedule.cancel': 'cancelar citas',
  'schedule.confirm': 'confirmar citas',
  'schedule.check_in': 'registrar la llegada del paciente',
  'schedule.walk_in': 'atender pacientes sin cita',
  'schedule.waitlist': 'manejar la lista de espera',
  'schedule.send_reminders': 'enviar recordatorios',
  'schedule.block_time': 'bloquear horarios',
  'schedule.edit_hours': 'cambiar el horario de atención',
  'billing.collect': 'cobrar',
  'billing.issue_receipt': 'emitir recibos',
  'patient.register': 'registrar pacientes nuevos',
  'messages.reply_on_behalf': 'responder mensajes administrativos en su nombre',
};

/**
 * Qué cubre una persona de la agenda de un doctor, resumido para mostrar:
 * las primeras acciones y cuántas más. Sin acciones, lo dice.
 *
 * @param actions - Acciones de apoyo vigentes sobre ese doctor.
 * @returns El resumen en una línea.
 */
export function coverageSummary(actions: readonly string[]): string {
  const labels = actions
    .filter((a): a is SupportActionCode => a in ACTION_LABELS)
    .map((a) => ACTION_LABELS[a]);
  if (labels.length === 0) return 'Sin permisos vigentes sobre su agenda';
  const shown = labels.slice(0, 4).join(', ');
  const rest = labels.length - 4;
  const text = rest > 0 ? `${shown} y ${rest} más` : shown;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Etiqueta corta de un paciente para que el doctor reconozca de quién se trata
 * sin que figure su nombre completo: el primer nombre y la inicial del último
 * apellido («Juan P.»).
 *
 * @param displayName - Nombre para mostrar del paciente.
 * @returns La etiqueta, o «Paciente» si no hay nombre.
 */
export function patientLabelOf(displayName: string | undefined): string {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Paciente';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/** Horas de acceso clínico temporal que rigen si el doctor no fija otra vigencia al aprobar. */
export const DEFAULT_CLINICAL_ACCESS_HOURS = 24;
