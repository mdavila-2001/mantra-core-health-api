/** Acciones de agenda que se resuelven por cita en la agenda combinada. */
export const AGENDA_ACTIONS = [
  'schedule.view',
  'schedule.confirm',
  'schedule.reschedule',
  'schedule.cancel',
  'schedule.check_in',
] as const;

/** Acción de agenda de una cita. */
export type AgendaAction = (typeof AGENDA_ACTIONS)[number];

/** Una cita tal como sale de la lectura, con lo necesario para decidirla. */
export interface AgendaRow {
  readonly bookingId: string;
  readonly resourceId?: string;
  readonly practitionerProfileId?: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly statusConceptId: string;
  readonly careSpaceId?: string;
  readonly healthcareServiceId?: string;
  readonly patientProfileId?: string;
  readonly patientName?: string;
}

/** Veredicto de la política para una acción sobre una cita. */
export interface AgendaVerdict {
  readonly allowed: boolean;
  readonly reason: string;
  readonly grantId?: string;
  /** `CHALLENGE`: la acción se ofrece, pero pide motivo, paso extra o aprobación al ejecutarla. */
  readonly effect?: 'PERMIT' | 'DENY' | 'CHALLENGE';
  /** Campos visibles de la cita y su máscara (un campo ausente se anula). */
  readonly visibleFields?: Readonly<
    Record<string, 'FULL' | 'PARTIAL' | 'REDACT' | 'NULLIFY'>
  >;
}

/**
 * Motivos por los que la política negó PORQUE un permiso cubre la cita pero una
 * condición no se cumple (horario, paciente, ventana, tope…). La cita de un
 * paciente fuera del alcance se muestra como bloque «Reservado»: nunca se oculta
 * el horario ocupado. Los demás motivos (sin vínculo, sin permiso que cubra,
 * regla de la organización) dejan la cita fuera, como siempre.
 */
const CONDITIONAL_DENIALS: ReadonlySet<string> = new Set([
  'TIME_WINDOW',
  'LIMIT_EXCEEDED',
  'PATIENT_SCOPE',
  'PATIENT_AGE',
  'PATIENT_AGE_UNKNOWN',
  'PATIENT_COVERAGE',
  'PATIENT_EXCLUDED',
  'APPOINTMENT_WINDOW',
  'LEAD_TIME',
  'HORIZON',
  'CHANNEL_NOT_ALLOWED',
  'CHANNEL_UNKNOWN',
  'NETWORK_NOT_ALLOWED',
  'NETWORK_RULES_NOT_CONFIGURED',
  'DEVICE_NOT_TRUSTED',
  'SESSION_TOO_LONG',
  'DOCTOR_OFFLINE',
  'EXPLICIT_DENY',
  'CONDITION_UNREADABLE',
]);

/**
 * Motivos que NO salen a la pantalla: dirían qué paciente es «reservado» (o por
 * qué regla). La cita se muestra como «Reservado» y nada más.
 */
const RESERVED_REASONS: ReadonlySet<string> = new Set([
  'PATIENT_SCOPE',
  'PATIENT_AGE',
  'PATIENT_AGE_UNKNOWN',
  'PATIENT_COVERAGE',
  'PATIENT_EXCLUDED',
  'EXPLICIT_DENY',
]);

/** Una cita de la agenda combinada, con su política ya resuelta. */
export interface AgendaItem {
  /** Solo con `schedule.view`: sin él el bloque no nombra la cita. */
  readonly bookingId?: string;
  readonly resourceId?: string;
  readonly practitionerProfileId?: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly statusConceptId: string;
  readonly careSpaceId?: string;
  /** Solo con `schedule.view`: el tipo de servicio revela de qué se atiende. */
  readonly healthcareServiceId?: string;
  /** Solo con `schedule.view`. */
  readonly patientProfileId?: string;
  /** Solo con `schedule.view`. */
  readonly patientName?: string;
  /** Personas en la lista de espera activa de esta agenda en este horario. */
  readonly waitlistCount?: number;
  /** Acciones que la persona puede hacer sobre esta cita. */
  readonly allowedActions: readonly AgendaAction[];
  /** Por qué no puede ver la cita, si no puede (`RESERVED` si no debe decirse). */
  readonly denialReason?: string;
  /** Campos visibles de la cita (solo con `schedule.view`): la presentación los enmascara. */
  readonly visibleFields?: AgendaVerdict['visibleFields'];
  /** Permisos que habilitaron alguna acción (para sellar el acceso). */
  readonly grantIds: readonly string[];
  /**
   * ¿Algún permiso `schedule.*` aplicable a esta cita permite alguna acción? Sin
   * ninguno la persona no tiene nada que ver con la cita y no se muestra ni como
   * bloque.
   */
  readonly covered: boolean;
}

/**
 * Arma una cita de la agenda combinada: pregunta a la política cada acción con
 * el doctor, servicio y espacio de LA cita. Sin `schedule.view` la cita queda
 * como un bloque ocupado —horario, doctor y espacio— sin paciente, sin servicio,
 * sin identificador de la cita y con el motivo de la negativa, para que la
 * pantalla muestre por qué no se puede abrir. Si ninguna acción de agenda está
 * permitida (`covered` en falso) quien llama no la muestra.
 *
 * @param row - La cita.
 * @param decide - Decisión de la política para una acción sobre la cita.
 * @returns La cita con acciones permitidas y, si no se ve, el motivo.
 */
export function composeAgendaItem(
  row: AgendaRow,
  decide: (question: {
    action: AgendaAction;
    practitionerProfileId?: string;
    healthcareServiceId?: string;
    careSpaceId?: string;
    context?: { patientProfileId?: string; appointmentStartAt?: Date };
  }) => AgendaVerdict,
): AgendaItem {
  const verdicts = AGENDA_ACTIONS.map((action) => ({
    action,
    verdict: decide({
      action,
      practitionerProfileId: row.practitionerProfileId,
      healthcareServiceId: row.healthcareServiceId,
      careSpaceId: row.careSpaceId,
      // El paciente y la hora de ESTA cita: de ellos salen las condiciones del permiso.
      context: {
        ...(row.patientProfileId
          ? { patientProfileId: row.patientProfileId }
          : {}),
        appointmentStartAt: row.startAt,
      },
    }),
  }));
  const view = verdicts.find((v) => v.action === 'schedule.view')!.verdict;
  // Una acción que pide motivo, paso extra o aprobación se OFRECE (la pantalla la
  // lleva al desafío al ejecutarla); solo la ejecución completa la permite.
  const offered = (v: AgendaVerdict): boolean =>
    v.allowed || v.effect === 'CHALLENGE';
  const allowed = verdicts.filter((v) => offered(v.verdict));
  // Cubierta: algún permiso la alcanza (aunque hoy una condición la cierre).
  const covered =
    allowed.length > 0 ||
    verdicts.some((v) => CONDITIONAL_DENIALS.has(v.verdict.reason));
  const base = {
    resourceId: row.resourceId,
    practitionerProfileId: row.practitionerProfileId,
    startAt: row.startAt,
    endAt: row.endAt,
    statusConceptId: row.statusConceptId,
    careSpaceId: row.careSpaceId,
  };
  if (!view.allowed) {
    return {
      ...base,
      allowedActions: [],
      denialReason: RESERVED_REASONS.has(view.reason)
        ? 'RESERVED'
        : view.reason,
      grantIds: [],
      covered,
    };
  }
  return {
    ...base,
    bookingId: row.bookingId,
    healthcareServiceId: row.healthcareServiceId,
    covered,
    patientProfileId: row.patientProfileId,
    patientName: row.patientName,
    allowedActions: allowed.map((v) => v.action),
    ...(view.visibleFields ? { visibleFields: view.visibleFields } : {}),
    grantIds: [
      ...new Set(
        allowed
          .map((v) => v.verdict.grantId)
          .filter((id): id is string => !!id),
      ),
    ],
  };
}

const DAY_MS = 24 * 3600 * 1000;

/** Máximo de días que abarca una lectura de agenda. */
export function maxAgendaDays(): number {
  return 31;
}

/**
 * Valida el rango pedido: orden correcto y no más de {@link maxAgendaDays} días.
 *
 * @param from - Inicio.
 * @param to - Fin.
 * @returns Si el rango es admisible.
 */
export function validateAgendaRange(
  from: Date,
  to: Date,
): { ok: boolean; reason?: string } {
  if (!(to.getTime() > from.getTime())) {
    return { ok: false, reason: 'El fin debe ser posterior al inicio' };
  }
  if (to.getTime() - from.getTime() > maxAgendaDays() * DAY_MS) {
    return {
      ok: false,
      reason: `El rango no puede pasar de ${maxAgendaDays()} días`,
    };
  }
  return { ok: true };
}

/**
 * Cuántas esperas activas cubren un horario: las de la misma agenda cuya
 * ventana deseada incluye el inicio del horario (sin ventana, «cualquiera me
 * sirve» y cuenta). Es la misma regla con la que la promoción elige candidatos.
 *
 * @param waits - Esperas activas de las agendas del rango.
 * @param resourceId - Agenda del horario.
 * @param startAt - Inicio del horario.
 * @returns Cuántas personas esperan este horario.
 */
export function countWaitlistFor(
  waits: readonly {
    readonly resourceId: string;
    readonly desiredFrom?: Date;
    readonly desiredTo?: Date;
  }[],
  resourceId: string | undefined,
  startAt: Date,
): number {
  if (!resourceId) return 0;
  const at = startAt.getTime();
  return waits.filter(
    (w) =>
      w.resourceId === resourceId &&
      (!w.desiredFrom || w.desiredFrom.getTime() <= at) &&
      (!w.desiredTo || w.desiredTo.getTime() >= at),
  ).length;
}
