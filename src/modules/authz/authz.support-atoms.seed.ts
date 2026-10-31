import { deterministicId } from '../../common/constants/concepts';
import { SUPPORT_ACTIONS } from '../delegated_access/domain/support-actions';
import type { SupportActionCode } from '../delegated_access/domain/support-actions';

/**
 * Catálogo de apoyo del gobierno de accesos (v4.2.72, CONTRATO-GOBIERNO §2 y
 * Anexo A): 73 permisos atómicos `módulo.recurso.acción[.campo]`, sus 7
 * categorías y el piso de campos del rol de ejecución `SUPPORT_STAFF`.
 *
 * Son DATOS de arranque (mismo mecanismo que `PLATFORM_PERMISSION_SEED`): un
 * cambio de sensibilidad, de obligaciones o de asignabilidad se hace aquí o en
 * `authz.permissions`, no en código de decisión. Los ids son deterministas por
 * código, de modo que el arranque, el parche SQL y el runtime coinciden.
 */

/** Acción de catálogo que habilita el permiso (`authz.permissions.action_concept_id`). */
export type PermissionActionCode =
  'READ' | 'WRITE' | 'CREATE' | 'DELETE' | 'EXECUTE' | 'APPROVE';

/** Sensibilidad (`authz:SENSITIVITY_*`): fija el peso del puntaje de privilegios. */
export type PermissionSensitivity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Quién aprueba el uso (`authz:APPROVAL_*`); sin valor = sin aprobación. */
export type PermissionApprovalMode = 'DOCTOR' | 'SECOND_APPROVER';

/** Propósito de uso (`authz:PURPOSE_*`; HL7 `TREAT`, `HPAYMT`, `HOPERAT`). */
export type PermissionPurpose = 'TREATMENT' | 'PAYMENT' | 'OPERATIONS';

/** Base legal del acceso (`audit:LEGAL_BASIS_*`). */
export type PermissionLegalBasis =
  'TREATMENT' | 'CONSENT' | 'LEGAL_OBLIGATION' | 'HEALTHCARE_OPERATIONS';

/** Metadatos de gobierno de un permiso (las 7 columnas de `authz.permissions` del §7.2). */
export interface PermissionGovernanceSeed {
  /** Sensibilidad del permiso. */
  readonly sensitivity: PermissionSensitivity;
  /** El uso exige un motivo escrito (5-500 caracteres). */
  readonly requiresReason: boolean;
  /** El uso exige un paso extra de verificación (MFA fresco). */
  readonly requiresStepUp: boolean;
  /** Quién debe aprobar el uso; `null` = sin aprobación. */
  readonly approvalMode: PermissionApprovalMode | null;
  /** Propósito de uso; `null` en los alias heredados. */
  readonly purposeOfUse: PermissionPurpose | null;
  /** Base legal; `null` en los alias heredados. */
  readonly legalBasis: PermissionLegalBasis | null;
  /** El permiso toca datos clínicos. */
  readonly touchesClinicalData: boolean;
  /** `false` = ninguna plantilla ni concesión puede otorgarlo a personal de apoyo. */
  readonly supportAssignable: boolean;
}

/** Una categoría de permisos (agrupación de la pantalla de permisos). */
export interface PermissionCategorySeed {
  /** Identificador determinista de la fila en `authz.permission_categories`. */
  readonly id: string;
  /** Código estable de la categoría. */
  readonly code: string;
  /** Nombre legible en español. */
  readonly name: string;
  /** Orden de presentación. */
  readonly ordinal: number;
}

/** Piso de campo del rol de sistema `SUPPORT_STAFF` (`authz.field_permissions`). */
export interface SupportFieldFloorSeed {
  /** Identificador determinista: `seed:authz-field-permission:SUPPORT_STAFF:<entidad>.<columna>`. */
  readonly id: string;
  /** Entidad (`esquema.tabla`). */
  readonly entity: string;
  /** Columna que el apoyo nunca puede leer por ningún camino. */
  readonly columnName: string;
  /** Siempre `false`: es un piso de lectura denegada. */
  readonly canRead: false;
  /** Siempre `false`. */
  readonly canWrite: false;
}

/** Deriva el id determinista de una categoría de permisos por su código. */
export function permissionCategoryId(code: string): string {
  return deterministicId(`seed:authz-permission-category:${code}`);
}

/** Deriva el id determinista de un permiso por su código (igual que `platformPermissionId`). */
function permissionId(code: string): string {
  return deterministicId(`seed:authz-permission:${code}`);
}

const CATEGORY_ROWS: readonly (readonly [string, string])[] = [
  ['SUPPORT_AGENDA', 'Agenda'],
  ['SUPPORT_PATIENTS', 'Pacientes'],
  ['SUPPORT_MESSAGING', 'Mensajería'],
  ['SUPPORT_BILLING', 'Facturación y caja'],
  ['SUPPORT_REPORTS', 'Reportes'],
  ['SUPPORT_TEAM', 'Equipo de apoyo'],
  ['SUPPORT_AUDIT', 'Auditoría y explicación'],
];

/** Las 7 categorías del catálogo de apoyo. */
export const PERMISSION_CATEGORY_SEED: readonly PermissionCategorySeed[] =
  CATEGORY_ROWS.map(([code, name], i) => ({
    id: permissionCategoryId(code),
    code,
    name,
    ordinal: i + 1,
  }));

/** Categoría de cada módulo del código (`agenda.*` → Agenda…). */
const CATEGORY_BY_MODULE: Readonly<Record<string, string>> = {
  agenda: 'SUPPORT_AGENDA',
  patients: 'SUPPORT_PATIENTS',
  messages: 'SUPPORT_MESSAGING',
  billing: 'SUPPORT_BILLING',
  reports: 'SUPPORT_REPORTS',
  team: 'SUPPORT_TEAM',
  audit: 'SUPPORT_AUDIT',
};

/**
 * Un permiso de sistema que algún flujo del producto nombra por código.
 * (Definición compartida con `authz.seed.ts`, que la reexporta.)
 */
export interface SupportPermissionSeed {
  /** Identificador determinista de la fila en `authz.permissions`. */
  id: string;
  /** Código por el que el flujo lo busca. */
  code: string;
  /** Nombre legible en español. */
  name: string;
  /** Recurso sobre el que actúa (`módulo.recurso`). */
  resource: string;
  /** Acción que habilita. */
  action: PermissionActionCode;
  /** Ámbito por defecto de la concesión. */
  scope: 'TENANT';
  /** Código de la categoría; ausente en los alias heredados. */
  categoryCode?: string;
  /** Es un permiso de campo (cuarto segmento del código). */
  fieldLevel?: boolean;
  /** `is_dangerous` = sensibilidad ALTA o CRÍTICA. */
  dangerous?: boolean;
  /** Metadatos de gobierno. */
  governance: PermissionGovernanceSeed;
}

/**
 * Fila compacta del catálogo: código, nombre, acción, sensibilidad, banderas
 * (`R` motivo · `M` paso extra · `C` clínico · `F` de campo · `X` no asignable a
 * apoyo), aprobación, propósito de uso y base legal.
 */
type AtomRow = readonly [
  code: string,
  name: string,
  action: PermissionActionCode,
  sensitivity: PermissionSensitivity,
  flags: string,
  approval: '' | PermissionApprovalMode,
  purpose: PermissionPurpose,
  basis: PermissionLegalBasis,
];

const ATOM_ROWS: readonly AtomRow[] = [
  [
    'agenda.appointment.view',
    'Ver la agenda (horarios y estado de las citas)',
    'READ',
    'LOW',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.patient_name',
    'Ver el nombre del paciente en la cita',
    'READ',
    'MEDIUM',
    'F',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.patient_phone',
    'Ver el teléfono del paciente en la cita',
    'READ',
    'MEDIUM',
    'F',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.patient_document',
    'Ver el documento del paciente en la cita',
    'READ',
    'HIGH',
    'F',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.reason',
    'Ver el motivo de consulta',
    'READ',
    'HIGH',
    'CF',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.insurance',
    'Ver la aseguradora del paciente en la cita',
    'READ',
    'MEDIUM',
    'F',
    '',
    'PAYMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.view.price',
    'Ver el precio de la cita',
    'READ',
    'LOW',
    'F',
    '',
    'PAYMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.create',
    'Crear citas',
    'CREATE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.create.overbook',
    'Crear citas con sobrecupo',
    'CREATE',
    'HIGH',
    'R',
    'DOCTOR',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.reschedule',
    'Reprogramar citas',
    'WRITE',
    'MEDIUM',
    'R',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.cancel',
    'Cancelar citas',
    'WRITE',
    'MEDIUM',
    'R',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.confirm',
    'Confirmar citas',
    'EXECUTE',
    'LOW',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.check_in',
    'Registrar la llegada del paciente',
    'EXECUTE',
    'LOW',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.no_show',
    'Marcar al paciente como ausente',
    'EXECUTE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.appointment.walk_in',
    'Atender a un paciente sin cita previa',
    'CREATE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.waitlist.manage',
    'Gestionar la lista de espera',
    'WRITE',
    'LOW',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.reminder.send',
    'Enviar recordatorios de cita',
    'EXECUTE',
    'LOW',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'agenda.block.create',
    'Bloquear horarios de la agenda',
    'CREATE',
    'MEDIUM',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'agenda.block.remove',
    'Quitar bloqueos de la agenda',
    'DELETE',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'agenda.hours.edit',
    'Cambiar los horarios de atención del doctor',
    'WRITE',
    'HIGH',
    'RM',
    'DOCTOR',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'patients.search.exact',
    'Buscar pacientes (búsqueda exacta)',
    'READ',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.view_basic',
    'Ver la ficha básica del paciente (nombre, edad, contacto parcial)',
    'READ',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.view.phone_full',
    'Ver el teléfono completo del paciente',
    'READ',
    'MEDIUM',
    'F',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.view.document_full',
    'Ver el documento completo del paciente',
    'READ',
    'HIGH',
    'RF',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.coverage.view',
    'Ver la cobertura o seguro vigente del paciente',
    'READ',
    'MEDIUM',
    '',
    '',
    'PAYMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.register',
    'Registrar pacientes nuevos',
    'CREATE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.guardian.record',
    'Anotar al representante de un menor (queda pendiente de verificación)',
    'CREATE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.edit_contact',
    'Corregir datos de contacto del paciente',
    'WRITE',
    'MEDIUM',
    'R',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.profile.edit_verified',
    'Corregir datos verificados (nombre, documento, nacimiento)',
    'WRITE',
    'CRITICAL',
    'RM',
    'SECOND_APPROVER',
    'TREATMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'patients.profile.merge_request',
    'Pedir la fusión de fichas duplicadas',
    'EXECUTE',
    'HIGH',
    'R',
    'SECOND_APPROVER',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'patients.clinical.request_temporary_access',
    'Pedir acceso clínico temporal a un paciente',
    'EXECUTE',
    'HIGH',
    'RMC',
    'DOCTOR',
    'TREATMENT',
    'CONSENT',
  ],
  [
    'messages.inbox.view',
    'Ver la bandeja de mensajes del doctor',
    'READ',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'messages.conversation.reply_on_behalf',
    'Responder mensajes administrativos en nombre del doctor',
    'CREATE',
    'MEDIUM',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'messages.conversation.assign',
    'Asignar conversaciones a una persona del equipo',
    'WRITE',
    'LOW',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'messages.conversation.resolve',
    'Marcar conversaciones como resueltas',
    'WRITE',
    'LOW',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'messages.note.create_internal',
    'Escribir notas internas del equipo',
    'CREATE',
    'LOW',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'messages.template.use',
    'Usar respuestas preparadas',
    'EXECUTE',
    'LOW',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'messages.template.manage',
    'Administrar respuestas preparadas',
    'WRITE',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'messages.attachment.send',
    'Enviar archivos adjuntos a pacientes',
    'CREATE',
    'HIGH',
    '',
    '',
    'TREATMENT',
    'TREATMENT',
  ],
  [
    'messages.broadcast.send',
    'Enviar mensajes masivos a pacientes',
    'EXECUTE',
    'HIGH',
    'R',
    'SECOND_APPROVER',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'billing.invoice.view',
    'Ver cobros y comprobantes emitidos',
    'READ',
    'MEDIUM',
    '',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.payment.collect',
    'Cobrar la atención',
    'CREATE',
    'HIGH',
    '',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.receipt.issue',
    'Emitir comprobantes',
    'CREATE',
    'HIGH',
    '',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.receipt.void',
    'Anular comprobantes',
    'WRITE',
    'CRITICAL',
    'RM',
    'SECOND_APPROVER',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.payment.refund',
    'Devolver pagos',
    'EXECUTE',
    'CRITICAL',
    'RM',
    'SECOND_APPROVER',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.discount.apply',
    'Aplicar descuentos',
    'EXECUTE',
    'HIGH',
    'R',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'billing.cashbox.close',
    'Cerrar la caja del día',
    'EXECUTE',
    'HIGH',
    'M',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'reports.agenda.view',
    'Ver reportes de agenda (sin datos de pacientes)',
    'READ',
    'LOW',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'reports.agenda.export',
    'Exportar listados de agenda con pacientes',
    'EXECUTE',
    'HIGH',
    'RM',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'reports.billing.view',
    'Ver reportes de caja',
    'READ',
    'MEDIUM',
    '',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'reports.billing.export',
    'Exportar reportes de caja',
    'EXECUTE',
    'HIGH',
    'RM',
    '',
    'PAYMENT',
    'LEGAL_OBLIGATION',
  ],
  [
    'team.members.view',
    'Ver al equipo de apoyo y sus permisos',
    'READ',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.invitations.create',
    'Invitar personas al equipo (código o QR)',
    'CREATE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.requests.decide',
    'Resolver solicitudes de acceso del equipo',
    'APPROVE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.grants.assign',
    'Otorgar permisos al equipo (dentro de su techo)',
    'WRITE',
    'HIGH',
    'RM',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.grants.revoke',
    'Quitar permisos del equipo',
    'DELETE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.engagement.recertify',
    'Confirmar vínculos del equipo (recertificar)',
    'EXECUTE',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.engagement.suspend',
    'Suspender a una persona del equipo',
    'EXECUTE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.engagement.reactivate',
    'Pedir la reactivación de una persona suspendida',
    'EXECUTE',
    'HIGH',
    'R',
    'SECOND_APPROVER',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.engagement.end',
    'Dar de baja a una persona del equipo',
    'EXECUTE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.handover.execute',
    'Reasignar el trabajo de quien se va',
    'EXECUTE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.campaigns.review',
    'Revisar accesos en campañas de certificación',
    'APPROVE',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.campaigns.manage',
    'Crear y lanzar campañas de certificación',
    'WRITE',
    'HIGH',
    'R',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.sod.exception.request',
    'Pedir una excepción de separación de funciones',
    'CREATE',
    'HIGH',
    'R',
    'SECOND_APPROVER',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.templates.manage',
    'Administrar plantillas de rol de la organización',
    'WRITE',
    'HIGH',
    'RMX',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.guardrails.manage',
    'Administrar reglas y techos de la organización',
    'WRITE',
    'CRITICAL',
    'RMX',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.sod.manage',
    'Administrar reglas de separación de funciones',
    'WRITE',
    'CRITICAL',
    'RMX',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'team.sessionpolicy.manage',
    'Administrar políticas de sesión y reglas de red',
    'WRITE',
    'CRITICAL',
    'RMX',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'audit.activity.view_team',
    'Ver la actividad del equipo',
    'READ',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'audit.activity.view_org',
    'Ver la actividad de toda la organización',
    'READ',
    'HIGH',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'audit.activity.export',
    'Exportar la actividad',
    'EXECUTE',
    'HIGH',
    'RM',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'audit.decisions.explain',
    'Explicar y simular permisos',
    'READ',
    'MEDIUM',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
  [
    'audit.reports.governance.view',
    'Ver los tableros de gobierno de accesos',
    'READ',
    'HIGH',
    '',
    '',
    'OPERATIONS',
    'HEALTHCARE_OPERATIONS',
  ],
];

/** Los 73 permisos atómicos de apoyo (CONTRATO-GOBIERNO §2.2). */
export const SUPPORT_ATOM_SEED: readonly SupportPermissionSeed[] =
  ATOM_ROWS.map(
    ([code, name, action, sensitivity, flags, approval, purpose, basis]) => {
      const [mod, resource] = code.split('.');
      return {
        id: permissionId(code),
        code,
        name,
        resource: `${mod}.${resource}`,
        action,
        scope: 'TENANT',
        categoryCode: CATEGORY_BY_MODULE[mod],
        fieldLevel: flags.includes('F'),
        dangerous: sensitivity === 'HIGH' || sensitivity === 'CRITICAL',
        governance: {
          sensitivity,
          requiresReason: flags.includes('R'),
          requiresStepUp: flags.includes('M'),
          approvalMode: approval === '' ? null : approval,
          purposeOfUse: purpose,
          legalBasis: basis,
          touchesClinicalData: flags.includes('C'),
          supportAssignable: !flags.includes('X'),
        },
      };
    },
  );

/**
 * Sensibilidad que hereda cada código antiguo de su átomo primario (el primero
 * de su paquete, CONTRATO-GOBIERNO §2.3 regla 2). Es la única metadata que se
 * completa en los 15 alias: siguen SIN motivo, paso extra ni aprobación (regla
 * de no regresión) y quedan asignables a apoyo.
 */
export const LEGACY_SUPPORT_SENSITIVITY: Readonly<
  Record<SupportActionCode, PermissionSensitivity>
> = {
  'schedule.view': 'LOW',
  'schedule.create': 'MEDIUM',
  'schedule.reschedule': 'MEDIUM',
  'schedule.cancel': 'MEDIUM',
  'schedule.confirm': 'LOW',
  'schedule.check_in': 'LOW',
  'schedule.walk_in': 'MEDIUM',
  'schedule.waitlist': 'LOW',
  'schedule.send_reminders': 'LOW',
  'schedule.block_time': 'MEDIUM',
  'schedule.edit_hours': 'HIGH',
  'billing.collect': 'HIGH',
  'billing.issue_receipt': 'HIGH',
  'patient.register': 'MEDIUM',
  'messages.reply_on_behalf': 'MEDIUM',
};

/** Metadatos de gobierno de un código antiguo: asignable, con la sensibilidad de su átomo primario. */
export function legacyGovernance(
  code: SupportActionCode,
): PermissionGovernanceSeed {
  return {
    sensitivity: LEGACY_SUPPORT_SENSITIVITY[code],
    requiresReason: false,
    requiresStepUp: false,
    approvalMode: null,
    purposeOfUse: null,
    legalBasis: null,
    touchesClinicalData: false,
    supportAssignable: true,
  };
}

/** Los 15 códigos antiguos, para quien necesite recorrerlos junto al catálogo. */
export const LEGACY_SUPPORT_CODES: readonly SupportActionCode[] =
  SUPPORT_ACTIONS;

/**
 * Piso de plataforma de `SUPPORT_STAFF` (GP-3): columnas clínicas que el apoyo
 * no lee ni escribe por ningún camino (diagnóstico, notas, resultados e
 * indicación). Sirve al PDP clínico y a cualquier endpoint que pida
 * `maskedFields`; no sustituye a las condiciones por concesión.
 */
export const SUPPORT_STAFF_FIELD_FLOOR: readonly SupportFieldFloorSeed[] = [
  ['clinical.conditions', 'code_concept_id'],
  ['clinical.conditions', 'note_text'],
  ['chart.clinical_note_versions', 'subjective_text'],
  ['chart.clinical_note_versions', 'objective_text'],
  ['chart.clinical_note_versions', 'assessment_text'],
  ['chart.clinical_note_versions', 'plan_text'],
  ['chart.clinical_note_versions', 'entries_json'],
  ['clinical.observations', 'value_text'],
  ['clinical.observations', 'value_decimal'],
  ['clinical.observations', 'interpretation_concept_id'],
  ['clinical.medication_requests', 'medication_concept_id'],
  ['clinical.medication_requests', 'indication_text'],
].map(([entity, columnName]) => ({
  id: deterministicId(
    `seed:authz-field-permission:SUPPORT_STAFF:${entity}.${columnName}`,
  ),
  entity,
  columnName,
  canRead: false as const,
  canWrite: false as const,
}));
