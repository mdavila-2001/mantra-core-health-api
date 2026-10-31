import { deterministicId } from '../../../common/constants/concepts';
import {
  SUPPORT_ACTIONS,
  isSupportAction,
  type SupportActionCode,
} from './support-actions';

/**
 * Catálogo de permisos atómicos del personal de apoyo (CONTRATO-GOBIERNO §2):
 * 73 átomos `módulo.recurso.acción[.campo]`, sus metadatos, los 15 códigos
 * heredados como alias y los paquetes por defecto v2. Datos y funciones
 * puras: sin Nest ni base de datos.
 */

/** Los 73 códigos de átomo, en el orden canónico del catálogo. */
export const PERMISSION_ATOM_CODES = [
  'agenda.appointment.view',
  'agenda.appointment.view.patient_name',
  'agenda.appointment.view.patient_phone',
  'agenda.appointment.view.patient_document',
  'agenda.appointment.view.reason',
  'agenda.appointment.view.insurance',
  'agenda.appointment.view.price',
  'agenda.appointment.create',
  'agenda.appointment.create.overbook',
  'agenda.appointment.reschedule',
  'agenda.appointment.cancel',
  'agenda.appointment.confirm',
  'agenda.appointment.check_in',
  'agenda.appointment.no_show',
  'agenda.appointment.walk_in',
  'agenda.waitlist.manage',
  'agenda.reminder.send',
  'agenda.block.create',
  'agenda.block.remove',
  'agenda.hours.edit',
  'patients.search.exact',
  'patients.profile.view_basic',
  'patients.profile.view.phone_full',
  'patients.profile.view.document_full',
  'patients.coverage.view',
  'patients.profile.register',
  'patients.guardian.record',
  'patients.profile.edit_contact',
  'patients.profile.edit_verified',
  'patients.profile.merge_request',
  'patients.clinical.request_temporary_access',
  'messages.inbox.view',
  'messages.conversation.reply_on_behalf',
  'messages.conversation.assign',
  'messages.conversation.resolve',
  'messages.note.create_internal',
  'messages.template.use',
  'messages.template.manage',
  'messages.attachment.send',
  'messages.broadcast.send',
  'billing.invoice.view',
  'billing.payment.collect',
  'billing.receipt.issue',
  'billing.receipt.void',
  'billing.payment.refund',
  'billing.discount.apply',
  'billing.cashbox.close',
  'reports.agenda.view',
  'reports.agenda.export',
  'reports.billing.view',
  'reports.billing.export',
  'team.members.view',
  'team.invitations.create',
  'team.requests.decide',
  'team.grants.assign',
  'team.grants.revoke',
  'team.engagement.recertify',
  'team.engagement.suspend',
  'team.engagement.reactivate',
  'team.engagement.end',
  'team.handover.execute',
  'team.campaigns.review',
  'team.campaigns.manage',
  'team.sod.exception.request',
  'team.templates.manage',
  'team.guardrails.manage',
  'team.sod.manage',
  'team.sessionpolicy.manage',
  'audit.activity.view_team',
  'audit.activity.view_org',
  'audit.activity.export',
  'audit.decisions.explain',
  'audit.reports.governance.view',
] as const;

/** Código de un permiso atómico. */
export type SupportAtomCode = (typeof PERMISSION_ATOM_CODES)[number];

/** Lo que el catálogo acepta como acción: un átomo o uno de los 15 alias. */
export type SupportActionInput = SupportActionCode | SupportAtomCode;

/** Sensibilidad del permiso (`authz:SENSITIVITY_*`). */
export type PermissionSensitivity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Quién aprueba (cuatro ojos) un permiso que lo exige (`authz:APPROVAL_*`). */
export type PermissionApprovalMode = 'DOCTOR' | 'SECOND_APPROVER';

/** Propósito de uso (`authz:PURPOSE_*`; HL7 `TREAT`/`HPAYMT`/`HOPERAT`). */
export type PermissionPurpose = 'TREATMENT' | 'PAYMENT' | 'OPERATIONS';

/** Base legal (`audit:LEGAL_BASIS_*`). */
export type PermissionLegalBasis =
  'TREATMENT' | 'CONSENT' | 'LEGAL_OBLIGATION' | 'HEALTHCARE_OPERATIONS';

/** Código de una categoría del catálogo (`authz.permission_categories`). */
export type AtomCategoryCode =
  | 'SUPPORT_AGENDA'
  | 'SUPPORT_PATIENTS'
  | 'SUPPORT_MESSAGING'
  | 'SUPPORT_BILLING'
  | 'SUPPORT_REPORTS'
  | 'SUPPORT_TEAM'
  | 'SUPPORT_AUDIT';

/** Peso de cada sensibilidad en el puntaje de privilegios (§2.1 y §6.6). */
export const SENSITIVITY_WEIGHT: Readonly<
  Record<PermissionSensitivity, number>
> = { LOW: 1, MEDIUM: 2, HIGH: 5, CRITICAL: 10 };

/** Un permiso atómico con todos sus metadatos. */
export interface PermissionAtom {
  /** `deterministicId('seed:authz-permission:' + code)`. */
  readonly id: string;
  /** Código `módulo.recurso.acción[.campo]`. */
  readonly code: SupportAtomCode;
  /** Lo que ve el usuario, en lenguaje simple. */
  readonly name: string;
  /** Primer segmento del código. */
  readonly module: string;
  /** `módulo.recurso` (segmentos 1 y 2). */
  readonly resource: string;
  /** Categoría de la pantalla. */
  readonly categoryCode: AtomCategoryCode;
  /** Sensibilidad. */
  readonly sensitivity: PermissionSensitivity;
  /** ¿Exige motivo escrito? (`requires_reason`). */
  readonly requiresReason: boolean;
  /** ¿Exige segundo paso reciente? (`requires_step_up`). */
  readonly requiresStepUp: boolean;
  /** Aprobación de cuatro ojos que exige; `null` = ninguna. */
  readonly approvalMode: PermissionApprovalMode | null;
  /** Propósito de uso. */
  readonly purposeOfUse: PermissionPurpose;
  /** Base legal. */
  readonly legalBasis: PermissionLegalBasis;
  /** ¿Toca datos clínicos? */
  readonly touchesClinicalData: boolean;
  /** ¿Es un permiso de campo (se enmascara por condición)? */
  readonly isFieldLevel: boolean;
  /** ¿Puede darse a personal de apoyo? (`false` = solo `SECURITY_ADMIN`). */
  readonly supportAssignable: boolean;
  /** Sensibilidad ALTA o CRÍTICA (`is_dangerous`). */
  readonly isDangerous: boolean;
}

/** Fila compacta del catálogo (ver `PermissionAtom` para el significado). */
type AtomRow = readonly [
  code: SupportAtomCode,
  name: string,
  sensitivity: PermissionSensitivity,
  requiresReason: 0 | 1,
  requiresStepUp: 0 | 1,
  approvalMode: PermissionApprovalMode | null,
  purposeOfUse: PermissionPurpose,
  legalBasis: PermissionLegalBasis,
  touchesClinicalData: 0 | 1,
  isFieldLevel: 0 | 1,
  supportAssignable: 0 | 1,
];

/** Categorías del catálogo (`authz.permission_categories`). */
export const ATOM_CATEGORIES: readonly {
  readonly code: AtomCategoryCode;
  readonly name: string;
  readonly id: string;
}[] = (
  [
    ['SUPPORT_AGENDA', 'Agenda'],
    ['SUPPORT_PATIENTS', 'Pacientes'],
    ['SUPPORT_MESSAGING', 'Mensajería'],
    ['SUPPORT_BILLING', 'Facturación y caja'],
    ['SUPPORT_REPORTS', 'Reportes'],
    ['SUPPORT_TEAM', 'Equipo de apoyo'],
    ['SUPPORT_AUDIT', 'Auditoría y explicación'],
  ] as const
).map(([code, name]) => ({
  code,
  name,
  id: deterministicId(`seed:authz-permission-category:${code}`),
}));

/** Categoría que corresponde al módulo de un átomo. */
const CATEGORY_BY_MODULE: Readonly<Record<string, AtomCategoryCode>> = {
  agenda: 'SUPPORT_AGENDA',
  patients: 'SUPPORT_PATIENTS',
  messages: 'SUPPORT_MESSAGING',
  billing: 'SUPPORT_BILLING',
  reports: 'SUPPORT_REPORTS',
  team: 'SUPPORT_TEAM',
  audit: 'SUPPORT_AUDIT',
};

// prettier-ignore
const ATOM_ROWS: readonly AtomRow[] = [
  ['agenda.appointment.view', 'Ver la agenda (horarios y estado de las citas)', 'LOW', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.view.patient_name', 'Ver el nombre del paciente en la cita', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 1, 1],
  ['agenda.appointment.view.patient_phone', 'Ver el teléfono del paciente en la cita', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 1, 1],
  ['agenda.appointment.view.patient_document', 'Ver el documento del paciente en la cita', 'HIGH', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 1, 1],
  ['agenda.appointment.view.reason', 'Ver el motivo de consulta', 'HIGH', 0, 0, null, 'TREATMENT', 'TREATMENT', 1, 1, 1],
  ['agenda.appointment.view.insurance', 'Ver la aseguradora del paciente en la cita', 'MEDIUM', 0, 0, null, 'PAYMENT', 'TREATMENT', 0, 1, 1],
  ['agenda.appointment.view.price', 'Ver el precio de la cita', 'LOW', 0, 0, null, 'PAYMENT', 'TREATMENT', 0, 1, 1],
  ['agenda.appointment.create', 'Crear citas', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.create.overbook', 'Crear citas con sobrecupo', 'HIGH', 1, 0, 'DOCTOR', 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.reschedule', 'Reprogramar citas', 'MEDIUM', 1, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.cancel', 'Cancelar citas', 'MEDIUM', 1, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.confirm', 'Confirmar citas', 'LOW', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.check_in', 'Registrar la llegada del paciente', 'LOW', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.no_show', 'Marcar al paciente como ausente', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.appointment.walk_in', 'Atender a un paciente sin cita previa', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.waitlist.manage', 'Gestionar la lista de espera', 'LOW', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.reminder.send', 'Enviar recordatorios de cita', 'LOW', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['agenda.block.create', 'Bloquear horarios de la agenda', 'MEDIUM', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['agenda.block.remove', 'Quitar bloqueos de la agenda', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['agenda.hours.edit', 'Cambiar los horarios de atención del doctor', 'HIGH', 1, 1, 'DOCTOR', 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['patients.search.exact', 'Buscar pacientes (búsqueda exacta)', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.profile.view_basic', 'Ver la ficha básica del paciente (nombre, edad, contacto parcial)', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.profile.view.phone_full', 'Ver el teléfono completo del paciente', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 1, 1],
  ['patients.profile.view.document_full', 'Ver el documento completo del paciente', 'HIGH', 1, 0, null, 'TREATMENT', 'TREATMENT', 0, 1, 1],
  ['patients.coverage.view', 'Ver la cobertura o seguro vigente del paciente', 'MEDIUM', 0, 0, null, 'PAYMENT', 'TREATMENT', 0, 0, 1],
  ['patients.profile.register', 'Registrar pacientes nuevos', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.guardian.record', 'Anotar al representante de un menor (queda pendiente de verificación)', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.profile.edit_contact', 'Corregir datos de contacto del paciente', 'MEDIUM', 1, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.profile.edit_verified', 'Corregir datos verificados (nombre, documento, nacimiento)', 'CRITICAL', 1, 1, 'SECOND_APPROVER', 'TREATMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['patients.profile.merge_request', 'Pedir la fusión de fichas duplicadas', 'HIGH', 1, 0, 'SECOND_APPROVER', 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['patients.clinical.request_temporary_access', 'Pedir acceso clínico temporal a un paciente', 'HIGH', 1, 1, 'DOCTOR', 'TREATMENT', 'CONSENT', 1, 0, 1],
  ['messages.inbox.view', 'Ver la bandeja de mensajes del doctor', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['messages.conversation.reply_on_behalf', 'Responder mensajes administrativos en nombre del doctor', 'MEDIUM', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['messages.conversation.assign', 'Asignar conversaciones a una persona del equipo', 'LOW', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['messages.conversation.resolve', 'Marcar conversaciones como resueltas', 'LOW', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['messages.note.create_internal', 'Escribir notas internas del equipo', 'LOW', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['messages.template.use', 'Usar respuestas preparadas', 'LOW', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['messages.template.manage', 'Administrar respuestas preparadas', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['messages.attachment.send', 'Enviar archivos adjuntos a pacientes', 'HIGH', 0, 0, null, 'TREATMENT', 'TREATMENT', 0, 0, 1],
  ['messages.broadcast.send', 'Enviar mensajes masivos a pacientes', 'HIGH', 1, 0, 'SECOND_APPROVER', 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['billing.invoice.view', 'Ver cobros y comprobantes emitidos', 'MEDIUM', 0, 0, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.payment.collect', 'Cobrar la atención', 'HIGH', 0, 0, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.receipt.issue', 'Emitir comprobantes', 'HIGH', 0, 0, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.receipt.void', 'Anular comprobantes', 'CRITICAL', 1, 1, 'SECOND_APPROVER', 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.payment.refund', 'Devolver pagos', 'CRITICAL', 1, 1, 'SECOND_APPROVER', 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.discount.apply', 'Aplicar descuentos', 'HIGH', 1, 0, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['billing.cashbox.close', 'Cerrar la caja del día', 'HIGH', 0, 1, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['reports.agenda.view', 'Ver reportes de agenda (sin datos de pacientes)', 'LOW', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['reports.agenda.export', 'Exportar listados de agenda con pacientes', 'HIGH', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['reports.billing.view', 'Ver reportes de caja', 'MEDIUM', 0, 0, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['reports.billing.export', 'Exportar reportes de caja', 'HIGH', 1, 1, null, 'PAYMENT', 'LEGAL_OBLIGATION', 0, 0, 1],
  ['team.members.view', 'Ver al equipo de apoyo y sus permisos', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.invitations.create', 'Invitar personas al equipo (código o QR)', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.requests.decide', 'Resolver solicitudes de acceso del equipo', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.grants.assign', 'Otorgar permisos al equipo (dentro de su techo)', 'HIGH', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.grants.revoke', 'Quitar permisos del equipo', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.engagement.recertify', 'Confirmar vínculos del equipo (recertificar)', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.engagement.suspend', 'Suspender a una persona del equipo', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.engagement.reactivate', 'Pedir la reactivación de una persona suspendida', 'HIGH', 1, 0, 'SECOND_APPROVER', 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.engagement.end', 'Dar de baja a una persona del equipo', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.handover.execute', 'Reasignar el trabajo de quien se va', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.campaigns.review', 'Revisar accesos en campañas de certificación', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.campaigns.manage', 'Crear y lanzar campañas de certificación', 'HIGH', 1, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.sod.exception.request', 'Pedir una excepción de separación de funciones', 'HIGH', 1, 0, 'SECOND_APPROVER', 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['team.templates.manage', 'Administrar plantillas de rol de la organización', 'HIGH', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 0],
  ['team.guardrails.manage', 'Administrar reglas y techos de la organización', 'CRITICAL', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 0],
  ['team.sod.manage', 'Administrar reglas de separación de funciones', 'CRITICAL', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 0],
  ['team.sessionpolicy.manage', 'Administrar políticas de sesión y reglas de red', 'CRITICAL', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 0],
  ['audit.activity.view_team', 'Ver la actividad del equipo', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['audit.activity.view_org', 'Ver la actividad de toda la organización', 'HIGH', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['audit.activity.export', 'Exportar la actividad', 'HIGH', 1, 1, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['audit.decisions.explain', 'Explicar y simular permisos', 'MEDIUM', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
  ['audit.reports.governance.view', 'Ver los tableros de gobierno de accesos', 'HIGH', 0, 0, null, 'OPERATIONS', 'HEALTHCARE_OPERATIONS', 0, 0, 1],
];

/** Id determinista de la fila de `authz.permissions` de un átomo. */
export function permissionAtomId(code: string): string {
  return deterministicId(`seed:authz-permission:${code}`);
}

function toAtom(row: AtomRow): PermissionAtom {
  const [code, name, sensitivity, reason, stepUp, approval, purpose, basis] =
    row;
  const segments = code.split('.');
  return {
    id: permissionAtomId(code),
    code,
    name,
    module: segments[0],
    resource: `${segments[0]}.${segments[1]}`,
    categoryCode: CATEGORY_BY_MODULE[segments[0]],
    sensitivity,
    requiresReason: reason === 1,
    requiresStepUp: stepUp === 1,
    approvalMode: approval,
    purposeOfUse: purpose,
    legalBasis: basis,
    touchesClinicalData: row[8] === 1,
    isFieldLevel: row[9] === 1,
    supportAssignable: row[10] === 1,
    isDangerous: sensitivity === 'HIGH' || sensitivity === 'CRITICAL',
  };
}

/** Los 73 átomos con sus metadatos, en el orden canónico del catálogo. */
export const PERMISSION_ATOMS: readonly PermissionAtom[] =
  ATOM_ROWS.map(toAtom);

/** Átomo por código. */
export const PERMISSION_ATOM_BY_CODE: ReadonlyMap<string, PermissionAtom> =
  new Map(PERMISSION_ATOMS.map((atom) => [atom.code, atom]));

/** Átomo por id de `authz.permissions`. */
export const PERMISSION_ATOM_BY_ID: ReadonlyMap<string, PermissionAtom> =
  new Map(PERMISSION_ATOMS.map((atom) => [atom.id, atom]));

/** ¿Es `value` el código de un átomo del catálogo? */
export function isSupportAtom(value: unknown): value is SupportAtomCode {
  return typeof value === 'string' && PERMISSION_ATOM_BY_CODE.has(value);
}

/** Metadatos de un átomo; `undefined` si el código no es del catálogo. */
export function atomMeta(code: string): PermissionAtom | undefined {
  return PERMISSION_ATOM_BY_CODE.get(code);
}

/**
 * Los 15 códigos heredados como alias: cada uno se expande, al leer, a los
 * átomos de su paquete (CONTRATO-GOBIERNO §2.3). El orden es el del contrato.
 */
export const LEGACY_BUNDLES: Readonly<
  Record<SupportActionCode, readonly SupportAtomCode[]>
> = {
  'schedule.view': [
    'agenda.appointment.view',
    'agenda.appointment.view.patient_name',
  ],
  'schedule.create': [
    'agenda.appointment.create',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.reschedule': [
    'agenda.appointment.reschedule',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.cancel': ['agenda.appointment.cancel'],
  'schedule.confirm': ['agenda.appointment.confirm'],
  'schedule.check_in': [
    'agenda.appointment.check_in',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.walk_in': [
    'agenda.appointment.walk_in',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.waitlist': ['agenda.waitlist.manage'],
  'schedule.send_reminders': ['agenda.reminder.send'],
  'schedule.block_time': ['agenda.block.create', 'agenda.block.remove'],
  'schedule.edit_hours': ['agenda.hours.edit'],
  'billing.collect': ['billing.payment.collect'],
  'billing.issue_receipt': ['billing.receipt.issue'],
  'patient.register': [
    'patients.profile.register',
    'patients.guardian.record',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'messages.reply_on_behalf': [
    'messages.inbox.view',
    'messages.conversation.reply_on_behalf',
    'messages.conversation.assign',
    'messages.note.create_internal',
    'messages.template.use',
  ],
};

/**
 * Átomo primario de cada alias: el que se exige cuando un llamador antiguo
 * pregunta con el código heredado. Es el primero de su paquete salvo en
 * `messages.reply_on_behalf`, donde el paquete abre con la bandeja pero lo que
 * se exige (y lo que hoy chequea la política) es responder en nombre del doctor.
 */
export const LEGACY_PRIMARY: Readonly<
  Record<SupportActionCode, SupportAtomCode>
> = {
  ...(Object.fromEntries(
    SUPPORT_ACTIONS.map((code) => [code, LEGACY_BUNDLES[code][0]]),
  ) as Record<SupportActionCode, SupportAtomCode>),
  'messages.reply_on_behalf': 'messages.conversation.reply_on_behalf',
};

/**
 * Átomos de un alias heredado.
 *
 * @param code - Uno de los 15 códigos antiguos.
 * @returns Su paquete de átomos; vacío si `code` no es un alias.
 */
export function expandLegacy(code: string): readonly SupportAtomCode[] {
  return isSupportAction(code) ? LEGACY_BUNDLES[code] : [];
}

/**
 * Átomo que se exige para una acción (átomo o alias).
 *
 * @param action - Código de átomo o alias heredado.
 * @returns El átomo; `undefined` si el código no es del catálogo.
 */
export function primaryAtomOf(action: string): SupportAtomCode | undefined {
  if (isSupportAtom(action)) return action;
  return isSupportAction(action) ? LEGACY_PRIMARY[action] : undefined;
}

/** Origen de un átomo dentro de un permiso. */
export type AtomOrigin = 'LEGACY' | 'ATOM';

/**
 * Átomos que un código otorga y de dónde vienen: un alias da su paquete
 * (`LEGACY`); un átomo se da a sí mismo (`ATOM`); lo desconocido, nada.
 */
export function atomsOfAction(
  action: string,
): readonly { readonly atom: SupportAtomCode; readonly origin: AtomOrigin }[] {
  if (isSupportAtom(action)) return [{ atom: action, origin: 'ATOM' }];
  return expandLegacy(action).map((atom) => ({ atom, origin: 'LEGACY' }));
}

/** Id de `authz.permissions` de cada alias heredado (no cambian). */
const LEGACY_CODE_BY_PERMISSION_ID: ReadonlyMap<string, SupportActionCode> =
  new Map(
    SUPPORT_ACTIONS.map((code) => [
      deterministicId(`seed:authz-permission:${code}`),
      code,
    ]),
  );

/**
 * Lo que otorga una fila de `authz.permissions` de apoyo (regla 1 de §2.3):
 * un alias se expande a su paquete con origen `LEGACY`; un átomo, a sí mismo.
 *
 * @param permissionId - Id de la fila de permiso.
 * @returns Los átomos con su origen; `undefined` si el id es desconocido (se
 *   ignora, como hoy).
 */
export function atomsOfPermissionId(
  permissionId: string,
):
  | readonly { readonly atom: SupportAtomCode; readonly origin: AtomOrigin }[]
  | undefined {
  const atom = PERMISSION_ATOM_BY_ID.get(permissionId);
  if (atom) return [{ atom: atom.code, origin: 'ATOM' }];
  const legacy = LEGACY_CODE_BY_PERMISSION_ID.get(permissionId);
  return legacy ? atomsOfAction(legacy) : undefined;
}

/** Códigos que las escrituras aceptan hoy: los 73 átomos y los 15 alias. */
export const SUPPORT_PERMISSION_INPUT_CODES: readonly string[] = [
  ...PERMISSION_ATOM_CODES,
  ...SUPPORT_ACTIONS,
];

/**
 * ¿El átomo coincide con el patrón? El patrón es un código exacto, un
 * prefijo con comodín al final (`billing.*`, `agenda.appointment.*`: uno o más
 * segmentos más) o con comodines de un segmento (`reports.*.export`).
 */
export function atomMatchesPattern(atom: string, pattern: string): boolean {
  if (pattern === atom) return true;
  const a = atom.split('.');
  const p = pattern.split('.');
  for (let i = 0; i < p.length; i += 1) {
    const isLast = i === p.length - 1;
    if (p[i] === '*') {
      if (isLast) return a.length > i;
      if (a.length <= i) return false;
      continue;
    }
    if (a[i] !== p[i]) return false;
  }
  return a.length === p.length;
}

/** Átomos del catálogo que coinciden con un patrón, en orden canónico. */
export function expandAtomPattern(pattern: string): readonly SupportAtomCode[] {
  return PERMISSION_ATOM_CODES.filter((code) =>
    atomMatchesPattern(code, pattern),
  );
}
