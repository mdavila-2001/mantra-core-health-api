import { clinicalRoleId, type ClinicalRoleSeed } from './authz.seed';
import type { BaseRole, RoleScope } from './dto';

/**
 * Roles operativos de negocio, plataforma y servicio que las rutas exigen con `@Roles(...)` y que
 * hasta ahora nadie sembraba en `authz.roles`.
 *
 * Sin la fila no existe el rol que asignar (`POST /authz/users/:userId/role-assignments` exige un
 * `roleId` existente y asignable) y el claim `roles` del token nunca lo lleva: la ruta que lo
 * exige solo la ejercía `SUPERADMIN` por comodín. Es la deriva `usedNotSeeded` de
 * `GET /admin/catalog/permission-drift`. Se declaran acá, por área, por el mismo motivo por el que
 * `authz.business-roles.seed.ts` y los `*.roles.ts` de cada módulo declaran los suyos.
 *
 * Sembrar un rol solo lo hace **asignable**: ningún usuario lo recibe por existir.
 *
 * ## Ámbito
 *
 * - `GLOBAL`: plataforma, datos transversales y cuentas de servicio. Se asigna **sin tenant**
 *   (con tenant el servicio lo rechaza: `ROLE_ASSIGNMENT_GLOBAL_ROLE_WITH_SCOPE`).
 * - `TENANT`: funciones de una organización (ERP, CRM, pagos, marketing, educación…). La
 *   asignación puede acotarse a un tenant.
 * - `SELF`: el usuario como cliente de un programa (alumno, socio de lealtad).
 *
 * Ninguno es `CLINICAL`: no son personal asistencial y no quedan sujetos al PDP clínico.
 *
 * ## Roles que no están acá
 *
 * - `PHARMACY_STAFF` lo deriva el login de una membresía en un tenant de farmacia
 *   (`withPharmacyStaffRole`); sembrarlo permitiría asignarlo a mano.
 * - `SYSTEM` y los seis globales de `iam` existen aparte (`PLATFORM_ROLE_CODES`).
 */
function role(
  code: string,
  name: string,
  baseRole: BaseRole,
  scope: RoleScope,
): ClinicalRoleSeed {
  return { id: clinicalRoleId(code), code, name, baseRole, scope };
}

/** ERP, finanzas operativas, ventas y personal de una organización. */
const BUSINESS_OPERATIONS: readonly ClinicalRoleSeed[] = [
  role('BUSINESS_ADMIN', 'Administrador del negocio', 'ADMIN', 'TENANT'),
  role('ERP_ADMIN', 'Administrador del ERP', 'ADMIN', 'TENANT'),
  role('HR_ADMIN', 'Administrador de recursos humanos', 'ADMIN', 'TENANT'),
  role('ACCOUNTANT', 'Contador', 'STAFF', 'TENANT'),
  role('ACCOUNTS_PAYABLE', 'Cuentas por pagar', 'STAFF', 'TENANT'),
  role('BUYER', 'Comprador', 'STAFF', 'TENANT'),
  role('CASHIER', 'Cajero', 'STAFF', 'TENANT'),
  role('CONTRACT_MANAGER', 'Gestor de contratos', 'STAFF', 'TENANT'),
  role('EMPLOYEE', 'Empleado', 'STAFF', 'TENANT'),
  role('SALES', 'Ventas', 'STAFF', 'TENANT'),
  role('WAREHOUSE', 'Almacén', 'STAFF', 'TENANT'),
  role('BILLING_AGENT', 'Agente de facturación', 'STAFF', 'TENANT'),
  role('BILLING_OPERATOR', 'Operador de facturación', 'STAFF', 'TENANT'),
  role('PAYMENTS_ADMIN', 'Administrador de pagos', 'ADMIN', 'TENANT'),
  role('SCHEDULER', 'Programador de procesos', 'STAFF', 'TENANT'),
];

/** Relación con clientes, marketing, publicidad, promociones, educación y logística. */
const BUSINESS_ENGAGEMENT: readonly ClinicalRoleSeed[] = [
  role('CRM_ADMIN', 'Administrador del CRM', 'ADMIN', 'TENANT'),
  role('CRM_AGENT', 'Agente del CRM', 'STAFF', 'TENANT'),
  role('MARKETING_MANAGER', 'Responsable de marketing', 'STAFF', 'TENANT'),
  role('CONTENT_EDITOR', 'Editor de contenido', 'STAFF', 'TENANT'),
  role('ADS_ADMIN', 'Administrador de publicidad', 'ADMIN', 'TENANT'),
  role('AD_OPS', 'Operaciones de publicidad', 'STAFF', 'TENANT'),
  role(
    'POLICY_REVIEWER',
    'Revisor de políticas publicitarias',
    'STAFF',
    'TENANT',
  ),
  role(
    'DATA_PRIVACY_OFFICER',
    'Oficial de privacidad de datos',
    'STAFF',
    'TENANT',
  ),
  role('PROMOTIONS_ADMIN', 'Administrador de promociones', 'ADMIN', 'TENANT'),
  role('EDUCATION_ADMIN', 'Administrador de educación', 'ADMIN', 'TENANT'),
  role('COURSE_AUTHOR', 'Autor de cursos', 'STAFF', 'TENANT'),
  role('LEARNER', 'Alumno', 'STAFF', 'SELF'),
  role('MEMBER', 'Socio del programa de lealtad', 'STAFF', 'SELF'),
  role(
    'TRACKING_ADMIN',
    'Administrador de seguimiento logístico',
    'ADMIN',
    'TENANT',
  ),
  role('LOGISTICS_OPERATOR', 'Operador logístico', 'STAFF', 'TENANT'),
  role('COURIER', 'Mensajero', 'STAFF', 'TENANT'),
  role('REPORTING_ADMIN', 'Administrador de reportes', 'ADMIN', 'TENANT'),
  role('REPORT_AUTHOR', 'Autor de reportes', 'STAFF', 'TENANT'),
  role('REPORT_VIEWER', 'Lector de reportes', 'STAFF', 'TENANT'),
  role('DICOM_VIEWER', 'Visor de imágenes DICOM', 'STAFF', 'TENANT'),
];

/** Operación de la plataforma, entrega, calidad y gobierno de datos: sin tenant. */
const PLATFORM_OPERATIONS: readonly ClinicalRoleSeed[] = [
  role('PLATFORM_ADMIN', 'Administrador de la plataforma', 'ADMIN', 'GLOBAL'),
  role('PLATFORM_OPERATOR', 'Operador de la plataforma', 'STAFF', 'GLOBAL'),
  role('SRE', 'Ingeniería de confiabilidad', 'STAFF', 'GLOBAL'),
  role('RELEASE_MANAGER', 'Responsable de versiones', 'STAFF', 'GLOBAL'),
  role('CHANGE_APPROVER', 'Aprobador de cambios', 'STAFF', 'GLOBAL'),
  role('INCIDENT_COMMANDER', 'Comandante de incidentes', 'STAFF', 'GLOBAL'),
  role('CAPACITY_PLANNER', 'Planificador de capacidad', 'STAFF', 'GLOBAL'),
  role('FINOPS_ANALYST', 'Analista FinOps', 'STAFF', 'GLOBAL'),
  role('QA_ADMIN', 'Administrador de QA', 'ADMIN', 'GLOBAL'),
  role('QA_ENGINEER', 'Ingeniero de QA', 'STAFF', 'GLOBAL'),
  role('MODULE_OWNER', 'Dueño de módulo', 'STAFF', 'GLOBAL'),
  role('TERMINOLOGY_ENGINEER', 'Ingeniero de terminología', 'STAFF', 'GLOBAL'),
  role('WORKFLOW_ARCHITECT', 'Arquitecto de flujos', 'STAFF', 'GLOBAL'),
  role('AUTOMATION_ENGINEER', 'Ingeniero de automatización', 'STAFF', 'GLOBAL'),
  role('OPERATIONAL_APPROVER', 'Aprobador operativo', 'STAFF', 'GLOBAL'),
  role('MESSAGING_ADMIN', 'Administrador de mensajería', 'ADMIN', 'GLOBAL'),
  role('IDENTITY_ADMIN', 'Administrador de identidad', 'ADMIN', 'GLOBAL'),
  role('STORAGE_ADMIN', 'Administrador de almacenamiento', 'ADMIN', 'GLOBAL'),
  role('SEARCH_ADMIN', 'Administrador de búsqueda', 'ADMIN', 'GLOBAL'),
  role('SEARCH_READER', 'Lector de búsqueda', 'STAFF', 'GLOBAL'),
  role('GOVERNANCE', 'Gobierno de contextos', 'STAFF', 'GLOBAL'),
  role('SOURCE_ADMIN', 'Administrador de fuentes', 'ADMIN', 'GLOBAL'),
  role('CONTEXT_CURATOR', 'Curador de contexto', 'STAFF', 'GLOBAL'),
  role('CONTEXT_CONSUMER', 'Consumidor de contexto', 'STAFF', 'GLOBAL'),
];

/** Datos, cumplimiento, inteligencia y gobierno de IA: sin tenant. */
const DATA_AND_GOVERNANCE: readonly ClinicalRoleSeed[] = [
  role(
    'DATA_GOVERNANCE_ADMIN',
    'Administrador de gobierno de datos',
    'ADMIN',
    'GLOBAL',
  ),
  role(
    'DATA_PLATFORM_ENGINEER',
    'Ingeniero de la plataforma de datos',
    'STAFF',
    'GLOBAL',
  ),
  role('DATA_PRODUCT_OWNER', 'Dueño de producto de datos', 'STAFF', 'GLOBAL'),
  role(
    'HEALTH_DATA_ADMIN',
    'Administrador de datos de salud',
    'ADMIN',
    'GLOBAL',
  ),
  role(
    'MPI_STEWARD',
    'Custodio del índice maestro de pacientes',
    'STAFF',
    'GLOBAL',
  ),
  role('PRIVACY_OFFICER', 'Oficial de privacidad', 'STAFF', 'GLOBAL'),
  role('COMPLIANCE_OFFICER', 'Oficial de cumplimiento', 'STAFF', 'GLOBAL'),
  role('LEGAL_COUNSEL', 'Asesoría legal', 'STAFF', 'GLOBAL'),
  role('RESEARCH_GOVERNANCE', 'Gobierno de investigación', 'STAFF', 'GLOBAL'),
  role('QUALITY_REVIEWER', 'Revisor de calidad', 'STAFF', 'GLOBAL'),
  role('AI_GOVERNANCE_OFFICER', 'Oficial de gobierno de IA', 'STAFF', 'GLOBAL'),
  role('MLOPS_ENGINEER', 'Ingeniero MLOps', 'STAFF', 'GLOBAL'),
  role(
    'RAG_COLLECTION_ADMIN',
    'Administrador de colecciones RAG',
    'ADMIN',
    'GLOBAL',
  ),
  role('GRAPH_ANALYST', 'Analista de grafos', 'STAFF', 'GLOBAL'),
  role('ANALYST', 'Analista', 'STAFF', 'GLOBAL'),
];

/**
 * Identidades de servicio a servicio: workers, orquestadores y pasarelas. Las asume una cuenta de
 * proceso (con su ciclo de rotación), no una persona; se asignan sin tenant.
 */
const SERVICE_SUBJECTS: readonly ClinicalRoleSeed[] = [
  role('AUTH_SERVICE', 'Servicio de autenticación', 'STAFF', 'GLOBAL'),
  role('WRITE_SERVICE', 'Servicio de escritura', 'STAFF', 'GLOBAL'),
  role('AGENT_RUNTIME', 'Runtime de agentes', 'STAFF', 'GLOBAL'),
  role('DEVICE', 'Dispositivo', 'STAFF', 'GLOBAL'),
  role('DEPLOY_PIPELINE', 'Pipeline de despliegue', 'STAFF', 'GLOBAL'),
  role('INGEST_GATEWAY', 'Pasarela de ingesta', 'STAFF', 'GLOBAL'),
  role('PACS_GATEWAY', 'Pasarela PACS', 'STAFF', 'GLOBAL'),
  role('API_CONSUMER', 'Consumidor de API', 'STAFF', 'GLOBAL'),
  role(
    'INTEROP_CONSUMER',
    'Consumidor de interoperabilidad',
    'STAFF',
    'GLOBAL',
  ),
  role('STORAGE_CLIENT', 'Cliente de almacenamiento', 'STAFF', 'GLOBAL'),
  role('SAGA_ORCHESTRATOR', 'Orquestador de sagas', 'STAFF', 'GLOBAL'),
  role('SYSTEM_WORKER', 'Worker del sistema', 'STAFF', 'GLOBAL'),
  role('MAINTENANCE_WORKER', 'Worker de mantenimiento', 'STAFF', 'GLOBAL'),
  role('DELETION_WORKER', 'Worker de borrado', 'STAFF', 'GLOBAL'),
  role(
    'DEIDENTIFICATION_WORKER',
    'Worker de desidentificación',
    'STAFF',
    'GLOBAL',
  ),
  role('EMBEDDING_WORKER', 'Worker de embeddings', 'STAFF', 'GLOBAL'),
  role('INGESTION_WORKER', 'Worker de ingestión', 'STAFF', 'GLOBAL'),
  role('PROJECTION_WORKER', 'Worker de proyecciones', 'STAFF', 'GLOBAL'),
  role('RECONCILIATION_WORKER', 'Worker de reconciliación', 'STAFF', 'GLOBAL'),
  role('RETRIEVAL_WORKER', 'Worker de recuperación', 'STAFF', 'GLOBAL'),
  role('TRANSFORMATION_WORKER', 'Worker de transformación', 'STAFF', 'GLOBAL'),
  role(
    'GRAPH_ANALYTICS_WORKER',
    'Worker de analítica de grafos',
    'STAFF',
    'GLOBAL',
  ),
  role(
    'GRAPH_PROJECTION_WORKER',
    'Worker de proyección de grafos',
    'STAFF',
    'GLOBAL',
  ),
];

/**
 * Rol de EJECUCIÓN del personal de apoyo. El login lo deriva de un vínculo de
 * apoyo vivo (`withSupportStaffRole` en `iam-auth.service.ts`) y acota el claim a
 * la organización del vínculo: **sembrarlo no cambia el token ni los claims**.
 * Existe como fila de sistema solo para que `@Roles('SECURITY_ADMIN',
 * 'SUPPORT_STAFF')` nombre un rol que existe (cierra la deriva `usedNotSeeded`
 * del gate `permission-drift`) y para colgarle el piso de campos de plataforma.
 *
 * NO es asignable: nadie lo recibe por `POST /authz/users/:id/role-assignments`.
 * Lo que la persona de apoyo puede hacer lo dicen sus concesiones
 * (`support_scope_grants`), no este rol. No es asistencial: no queda sujeto al
 * PDP clínico.
 */
const SUPPORT_EXECUTION: readonly ClinicalRoleSeed[] = [
  {
    ...role('SUPPORT_STAFF', 'Personal de apoyo', 'STAFF', 'TENANT'),
    assignable: false,
  },
];

export const AUTHZ_PLATFORM_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  ...BUSINESS_OPERATIONS,
  ...BUSINESS_ENGAGEMENT,
  ...PLATFORM_OPERATIONS,
  ...DATA_AND_GOVERNANCE,
  ...SERVICE_SUBJECTS,
  ...SUPPORT_EXECUTION,
];

/** Códigos sembrados por este archivo. */
export const AUTHZ_PLATFORM_ROLE_CODES: readonly string[] =
  AUTHZ_PLATFORM_ROLE_SEED.map((r) => r.code);
