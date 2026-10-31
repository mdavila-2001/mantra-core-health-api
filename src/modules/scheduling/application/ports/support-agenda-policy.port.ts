import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Puerto de la decisión del personal de apoyo sobre la agenda.
 *
 * Quien es persona de apoyo (tiene vínculo, no es administrador de agenda) no
 * opera por su rol sino permiso por permiso: la política decide —vínculo
 * vigente, aceptación del doctor, permiso que cubre doctor, servicio y espacio
 * de la cita, acción incluida— y la agenda solo pregunta. Qué política hay
 * detrás es asunto de `delegated_access`.
 */

/** Acciones de agenda de siempre (alias de átomos): las que ya preguntan los PEP. */
export type SupportAgendaLegacyAction =
  | 'schedule.view'
  | 'schedule.create'
  | 'schedule.reschedule'
  | 'schedule.cancel'
  | 'schedule.confirm'
  | 'schedule.check_in'
  | 'schedule.walk_in'
  | 'schedule.waitlist'
  | 'schedule.send_reminders';

/** Átomos de agenda (CONTRATO-GOBIERNO §2.2): se pueden preguntar directamente. */
export type SupportAgendaAtom =
  | 'agenda.appointment.view'
  | 'agenda.appointment.view.patient_name'
  | 'agenda.appointment.view.patient_phone'
  | 'agenda.appointment.view.patient_document'
  | 'agenda.appointment.view.reason'
  | 'agenda.appointment.view.insurance'
  | 'agenda.appointment.view.price'
  | 'agenda.appointment.create'
  | 'agenda.appointment.create.overbook'
  | 'agenda.appointment.reschedule'
  | 'agenda.appointment.cancel'
  | 'agenda.appointment.confirm'
  | 'agenda.appointment.check_in'
  | 'agenda.appointment.no_show'
  | 'agenda.appointment.walk_in'
  | 'agenda.waitlist.manage'
  | 'agenda.reminder.send'
  | 'agenda.block.create'
  | 'agenda.block.remove'
  | 'agenda.hours.edit';

/** Acciones de agenda que se preguntan al operar una cita: alias de siempre o átomos. */
export type SupportAgendaAction = SupportAgendaLegacyAction | SupportAgendaAtom;

/** Lo que el PEP sabe de la acción y la política cruza con las condiciones del permiso. */
export interface SupportAgendaContext {
  /** Paciente de la cita. */
  readonly patientProfileId?: string;
  /** Inicio de la cita (la original, si se reprograma). */
  readonly appointmentStartAt?: Date;
  /** Inicio del destino de crear, reprogramar o dar turno sin cita. */
  readonly newAppointmentStartAt?: Date;
  /** Canales de aviso. */
  readonly channels?: readonly ('CHAT' | 'EMAIL')[];
  /** Monto de la operación (facturación). */
  readonly amount?: {
    readonly currency: 'BOB';
    readonly minorUnits: number;
    readonly discountPercent?: number;
  };
  /** Lo que la persona aporta para cumplir obligaciones. */
  readonly proof?: {
    readonly reasonText?: string;
    readonly approvalId?: string;
  };
}

/** Qué pide un desafío de la política. */
export type SupportAgendaChallengeKind =
  'REASON' | 'STEP_UP' | 'APPROVAL' | 'STEP_UP_ENROLL';

/** Lo que se pregunta: quién, dónde, qué y sobre qué cita. */
export interface SupportAgendaQuestion {
  /** Persona de apoyo que actúa. */
  readonly userId: string;
  /** Organización dueña de la cita. */
  readonly tenantId: string;
  /** Acción que quiere hacer. */
  readonly action: SupportAgendaAction;
  /** Perfil del doctor de la cita. */
  readonly practitionerProfileId?: string;
  /** Servicio de la cita. */
  readonly healthcareServiceId?: string;
  /** Espacio de la cita. */
  readonly careSpaceId?: string;
  /** Lo que se sabe de la acción; solo lo usa el evaluador de la agenda combinada. */
  readonly context?: SupportAgendaContext;
}

/** Lo que el PEP sabe de la acción más allá del objetivo (para `decideWithContext`). */
export interface SupportAgendaDecisionHooks {
  /** Paciente, destino, canales, monto, motivo y aprobación. */
  readonly context?: SupportAgendaContext;
  /**
   * Completa el contexto con lo que cuesta una consulta (la hora de la cita): la
   * política solo lo invoca si alguna condición lo usa o hay una aprobación que
   * comparar con esta cita. Un permiso sin condiciones no paga nada por él.
   */
  readonly completeContext?: () => Promise<Partial<SupportAgendaContext>>;
}

/** La respuesta de la política. */
export interface SupportAgendaAnswer {
  /** ¿Se permite? (`false` también ante un desafío: los llamadores viejos fallan cerrado). */
  readonly allowed: boolean;
  /** Motivo estable. */
  readonly reason: string;
  /** Permiso que habilitó la acción. */
  readonly grantId?: string;
  /** Efecto de la decisión; ausente en una política que no lo distingue. */
  readonly effect?: 'PERMIT' | 'DENY' | 'CHALLENGE';
  /** Átomo evaluado. */
  readonly atom?: string;
  /** Qué falta para abrir (solo `CHALLENGE`). */
  readonly challenge?: {
    readonly kind: SupportAgendaChallengeKind;
    readonly details: Readonly<Record<string, unknown>>;
  };
  /** Campos visibles y su máscara (un campo ausente se anula). */
  readonly visibleFields?: Readonly<
    Record<string, 'FULL' | 'PARTIAL' | 'REDACT' | 'NULLIFY'>
  >;
}

/** Evaluador en memoria para decidir muchas citas de una persona en una organización. */
export type SupportAgendaEvaluator = ((
  question: Omit<SupportAgendaQuestion, 'userId' | 'tenantId'>,
) => SupportAgendaAnswer) & {
  /**
   * Carga EN LOTE los hechos de los pacientes que van a aparecer (una consulta
   * para todos). Sin ella, una condición de permiso que necesita hechos queda
   * indeterminada (falla cerrado). Ausente en políticas sin condiciones.
   */
  prime?: (patientProfileIds: readonly string[]) => Promise<void>;
};

/** Política del personal de apoyo sobre la agenda. */
export interface SupportAgendaPolicyPort {
  /** Decide si la persona de apoyo puede hacer la acción sobre esa cita. */
  decide(question: SupportAgendaQuestion): Promise<SupportAgendaAnswer>;
  /**
   * Igual que `decide`, con lo que el PEP sabe de la acción (paciente, destino,
   * motivo, aprobación) y un completador perezoso de la hora de la cita. Una
   * política que no lo implementa se pregunta con `decide` (sin condiciones).
   */
  decideWithContext?(
    question: SupportAgendaQuestion,
    hooks: SupportAgendaDecisionHooks,
  ): Promise<SupportAgendaAnswer>;
  /**
   * Carga una vez lo que la persona tiene en la organización y devuelve un
   * evaluador para decidir muchas citas sin una consulta por cada una.
   */
  evaluator(
    userId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<SupportAgendaEvaluator>;
  /**
   * Corre `work` dentro de la organización indicada: con aislamiento por fila
   * (RLS) encendido abre UNA transacción acotada a ella y le pasa esa
   * transacción —las consultas de la agenda deben usarla, no otro fork—; sin RLS
   * pasa un contexto de lectura y los filtros de cada consulta bastan. Quien
   * llama ya verificó que la persona tiene vínculo en esa organización antes de
   * leer su agenda.
   */
  inTenantScope<T>(
    em: EntityManager,
    tenantId: string,
    work: (tx: EntityManager) => Promise<T>,
  ): Promise<T>;
  /**
   * Orden estable de los doctores de la agenda (por nombre sin acentos y luego
   * por perfil): el mismo que usa la bandeja de chat, porque el color de cada
   * doctor sale de su posición.
   */
  orderDoctors<
    T extends { practitionerProfileId: string; displayName: string },
  >(
    doctors: readonly T[],
  ): T[];
}

/** Token de inyección de la política del personal de apoyo. */
export const SUPPORT_AGENDA_POLICY_PORT = Symbol('SUPPORT_AGENDA_POLICY_PORT');
