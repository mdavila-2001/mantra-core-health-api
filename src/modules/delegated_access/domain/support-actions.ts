import { deterministicId } from '../../../common/constants/concepts';

/**
 * Acciones (códigos de permiso) que una persona de apoyo puede recibir, 13 de
 * agenda/facturación/pacientes y 2 de mensajería. Cada permiso de apoyo
 * (`support_scope_grants`) lleva su propio subconjunto.
 */
export const SUPPORT_ACTIONS = [
  'schedule.view',
  'schedule.create',
  'schedule.reschedule',
  'schedule.cancel',
  'schedule.confirm',
  'schedule.check_in',
  'schedule.walk_in',
  'schedule.waitlist',
  'schedule.send_reminders',
  'schedule.block_time',
  'schedule.edit_hours',
  'billing.collect',
  'billing.issue_receipt',
  'patient.register',
  'messages.reply_on_behalf',
] as const;

/**
 * Los 15 códigos heredados, ahora alias de paquetes de átomos (CONTRATO-GOBIERNO
 * §2.3). Mismo arreglo que `SUPPORT_ACTIONS`, con el nombre que usan el catálogo
 * y las escrituras nuevas.
 */
export const SUPPORT_LEGACY_ACTIONS = SUPPORT_ACTIONS;

/** Código de una acción de apoyo. */
export type SupportActionCode = (typeof SUPPORT_ACTIONS)[number];

/** ¿Es `value` un código de acción conocido? */
export function isSupportAction(value: unknown): value is SupportActionCode {
  return (
    typeof value === 'string' &&
    (SUPPORT_ACTIONS as readonly string[]).includes(value)
  );
}

/** Acciones de agenda que otorga el paquete de secretaría/asistente. */
const FRONT_OFFICE_ACTIONS: readonly SupportActionCode[] = [
  'schedule.view',
  'schedule.create',
  'schedule.reschedule',
  'schedule.cancel',
  'schedule.confirm',
  'schedule.check_in',
  'schedule.walk_in',
  'schedule.waitlist',
  'schedule.send_reminders',
  'patient.register',
  'messages.reply_on_behalf',
];

/** Códigos de las plantillas de rol de plataforma. */
export const SUPPORT_TEMPLATE_CODES = [
  'SECRETARY',
  'MEDICAL_ASSISTANT',
  'NURSING',
  'FRONT_DESK',
  'BILLING_CASHIER',
  'CALL_CENTER',
  'ORG_MANAGEMENT',
] as const;

/** Código de una plantilla de rol de apoyo. */
export type SupportTemplateCode = (typeof SUPPORT_TEMPLATE_CODES)[number];

/**
 * Acciones por defecto de cada plantilla. `block_time`, `edit_hours` y
 * `billing.*` quedan fuera del paquete por defecto de agenda pero son
 * otorgables permiso por permiso; `ORG_MANAGEMENT` no incluye mensajes ni
 * facturación.
 */
export const SUPPORT_TEMPLATE_DEFAULTS: Readonly<
  Record<SupportTemplateCode, readonly SupportActionCode[]>
> = {
  SECRETARY: FRONT_OFFICE_ACTIONS,
  MEDICAL_ASSISTANT: FRONT_OFFICE_ACTIONS,
  NURSING: ['schedule.view', 'schedule.check_in', 'schedule.waitlist'],
  FRONT_DESK: [
    'schedule.view',
    'schedule.check_in',
    'schedule.walk_in',
    'patient.register',
  ],
  BILLING_CASHIER: [
    'schedule.view',
    'billing.collect',
    'billing.issue_receipt',
  ],
  CALL_CENTER: [
    'schedule.view',
    'schedule.create',
    'schedule.reschedule',
    'schedule.cancel',
  ],
  ORG_MANAGEMENT: [
    'schedule.view',
    'schedule.create',
    'schedule.reschedule',
    'schedule.cancel',
    'schedule.confirm',
    'schedule.check_in',
    'schedule.walk_in',
    'schedule.waitlist',
    'schedule.send_reminders',
    'schedule.block_time',
    'schedule.edit_hours',
    'patient.register',
  ],
};

/** Nombre legible de cada plantilla (para el seed de plataforma). */
export const SUPPORT_TEMPLATE_NAMES: Readonly<
  Record<SupportTemplateCode, string>
> = {
  SECRETARY: 'Secretaria',
  MEDICAL_ASSISTANT: 'Asistente médico',
  NURSING: 'Enfermería',
  FRONT_DESK: 'Recepción',
  BILLING_CASHIER: 'Facturación y caja',
  CALL_CENTER: 'Central telefónica',
  ORG_MANAGEMENT: 'Gestión de la organización',
};

/** Id determinista de la fila de `authz.permissions` de una acción de apoyo. */
export function supportPermissionId(code: SupportActionCode): string {
  return deterministicId(`seed:authz-permission:${code}`);
}

/** Id determinista de una plantilla de rol de plataforma. */
export function platformTemplateId(code: SupportTemplateCode): string {
  return deterministicId(`seed:delegated-access-role-template:${code}:v1`);
}

/** Mapa inverso `permission_id → código` de las acciones de apoyo. */
export const SUPPORT_ACTION_BY_PERMISSION_ID: ReadonlyMap<
  string,
  SupportActionCode
> = new Map(SUPPORT_ACTIONS.map((code) => [supportPermissionId(code), code]));

/** Recurso y acción de catálogo de cada permiso de apoyo (`authz.permissions`). */
export const SUPPORT_PERMISSION_CATALOG: Readonly<
  Record<
    SupportActionCode,
    {
      /** Nombre legible. */
      readonly name: string;
      /** Recurso sobre el que actúa. */
      readonly resource: string;
      /** Acción de catálogo. */
      readonly action: 'READ' | 'WRITE' | 'CREATE' | 'EXECUTE';
    }
  >
> = {
  'schedule.view': {
    name: 'Ver la agenda',
    resource: 'scheduling.appointment',
    action: 'READ',
  },
  'schedule.create': {
    name: 'Crear citas',
    resource: 'scheduling.appointment',
    action: 'CREATE',
  },
  'schedule.reschedule': {
    name: 'Reprogramar citas',
    resource: 'scheduling.appointment',
    action: 'WRITE',
  },
  'schedule.cancel': {
    name: 'Cancelar citas',
    resource: 'scheduling.appointment',
    action: 'WRITE',
  },
  'schedule.confirm': {
    name: 'Confirmar citas',
    resource: 'scheduling.appointment',
    action: 'EXECUTE',
  },
  'schedule.check_in': {
    name: 'Registrar la llegada del paciente',
    resource: 'scheduling.appointment',
    action: 'EXECUTE',
  },
  'schedule.walk_in': {
    name: 'Atender paciente sin cita previa',
    resource: 'scheduling.appointment',
    action: 'CREATE',
  },
  'schedule.waitlist': {
    name: 'Gestionar la lista de espera',
    resource: 'scheduling.waitlist_entry',
    action: 'WRITE',
  },
  'schedule.send_reminders': {
    name: 'Enviar recordatorios de cita',
    resource: 'scheduling.appointment_reminder',
    action: 'EXECUTE',
  },
  'schedule.block_time': {
    name: 'Bloquear horarios de la agenda',
    resource: 'scheduling.availability_exception',
    action: 'WRITE',
  },
  'schedule.edit_hours': {
    name: 'Editar los horarios de atención',
    resource: 'scheduling.schedule_template',
    action: 'WRITE',
  },
  'billing.collect': {
    name: 'Cobrar la atención',
    resource: 'billing.payment',
    action: 'EXECUTE',
  },
  'billing.issue_receipt': {
    name: 'Emitir comprobantes',
    resource: 'billing.receipt',
    action: 'CREATE',
  },
  'patient.register': {
    name: 'Registrar pacientes',
    resource: 'profiles.patient_profile',
    action: 'CREATE',
  },
  'messages.reply_on_behalf': {
    name: 'Responder mensajes administrativos en nombre del profesional',
    resource: 'community.direct_message',
    action: 'CREATE',
  },
};
