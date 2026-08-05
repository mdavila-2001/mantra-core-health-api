// Se importa el módulo de constantes directamente, no el barril `../../common`:
// este archivo lo consumen servicios de otros módulos y el barril arrastra
// guards, filtros e interceptores que no hacen falta para resolver un concepto.
import { CONCEPTS } from '../../common/constants/concepts';
import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo directory (prefijo `directory:`).
 *
 * Solo se declaran los estados / roles / scopes que los endpoints de este módulo
 * necesitan y que NO existen ya en el catálogo transversal (`CONCEPTS.*`). Para el
 * tipo de tenant, el tipo de entidad legal y los estados "activo"/"verificado" de
 * tenant se reutilizan los conceptos transversales, evitando duplicar códigos en
 * el mismo code-system durante el seed.
 *
 * `DIRECTORY_CONCEPT_SEEDS` lo consume el agregador central del seed; `DIR` es el
 * mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: DIRECTORY_CONCEPT_SEEDS, ids: DIR } =
  defineModuleConcepts('directory', {
    // --- Ciclo de vida de tenant (los que faltan en el catálogo transversal) ---
    TENANT_PENDING: {
      code: 'DIR_TENANT_PENDING',
      display: 'Tenant pending verification',
    },
    TENANT_SUSPENDED: {
      code: 'DIR_TENANT_SUSPENDED',
      display: 'Tenant suspended',
    },
    TENANT_UNVERIFIED: {
      code: 'DIR_TENANT_UNVERIFIED',
      display: 'Tenant unverified',
    },

    // --- Estados de tenant_memberships.status_concept_id ---
    MEMBERSHIP_INVITED: {
      code: 'DIR_MEMBERSHIP_INVITED',
      display: 'Membership invited',
    },
    MEMBERSHIP_ACTIVE: {
      code: 'DIR_MEMBERSHIP_ACTIVE',
      display: 'Membership active',
    },
    MEMBERSHIP_ENDED: {
      code: 'DIR_MEMBERSHIP_ENDED',
      display: 'Membership ended',
    },
    MEMBERSHIP_SUSPENDED: {
      code: 'DIR_MEMBERSHIP_SUSPENDED',
      display: 'Membership suspended',
    },

    // --- Roles de tenant (tenant_memberships.tenant_role_concept_id) ---
    ROLE_OWNER: { code: 'DIR_ROLE_OWNER', display: 'Tenant owner' },
    ROLE_ADMIN: { code: 'DIR_ROLE_ADMIN', display: 'Tenant admin' },
    ROLE_STAFF: { code: 'DIR_ROLE_STAFF', display: 'Tenant staff' },

    // --- Scopes de acceso (tenant_memberships.access_scope_concept_id) ---
    SCOPE_ALL_TENANT: {
      code: 'DIR_SCOPE_ALL_TENANT',
      display: 'All-tenant access scope',
    },
    SCOPE_BRANCH: { code: 'DIR_SCOPE_BRANCH', display: 'Branch access scope' },

    // --- Tipos y estados de branch ---
    BRANCH_TYPE_CLINIC: {
      code: 'DIR_BRANCH_TYPE_CLINIC',
      display: 'Clinic branch',
    },
    BRANCH_TYPE_OFFICE: {
      code: 'DIR_BRANCH_TYPE_OFFICE',
      display: 'Administrative office',
    },
    BRANCH_ACTIVE: { code: 'DIR_BRANCH_ACTIVE', display: 'Branch active' },
    BRANCH_SUSPENDED: {
      code: 'DIR_BRANCH_SUSPENDED',
      display: 'Branch suspended',
    },

    // --- Estados y rol local de branch_memberships ---
    BRANCH_MEMBERSHIP_ACTIVE: {
      code: 'DIR_BRANCH_MEMBERSHIP_ACTIVE',
      display: 'Branch membership active',
    },
    BRANCH_MEMBERSHIP_ENDED: {
      code: 'DIR_BRANCH_MEMBERSHIP_ENDED',
      display: 'Branch membership ended',
    },
    LOCAL_ROLE_STAFF: {
      code: 'DIR_LOCAL_ROLE_STAFF',
      display: 'Local staff role',
    },
  });

/**
 * Códigos de tipo de organización aceptados por la API.
 *
 * El DTO habla en códigos y no en UUIDs porque `tenant_type_concept_id` es una
 * FK a `terminology.catalog_concepts`: pedirle al cliente que adivine el UUID
 * del concepto convierte un campo de negocio en un acertijo cuyo único error
 * posible es un 500 por violación de FK.
 */
export type TenantTypeCode =
  | 'PROVIDER'
  | 'PAYER'
  | 'BROKER'
  | 'UNIVERSITY'
  | 'PHARMACY'
  | 'HOSPITAL'
  | 'MEDICAL_OFFICE'
  | 'NURSING'
  | 'HEALTH_OTHER'
  | 'HEALTH_BUSINESS';

/** Mapea el código de tipo de organización (DTO) a su concept id. */
export const TENANT_TYPE_CONCEPT_BY_CODE: Readonly<
  Record<TenantTypeCode, string>
> = {
  PROVIDER: CONCEPTS.TENANT_TYPE_PROVIDER,
  PAYER: CONCEPTS.TENANT_TYPE_PAYER,
  BROKER: CONCEPTS.TENANT_TYPE_BROKER,
  UNIVERSITY: CONCEPTS.TENANT_TYPE_UNIVERSITY,
  PHARMACY: CONCEPTS.TENANT_TYPE_PHARMACY,
  // Las cuatro institucionales. Son códigos hermanos y no un subtipo de otro
  // código porque el tipo ya vive en una sola columna (`tenant_type_concept_id`)
  // y anidar exigiría una columna más para distinguir cuatro valores.
  HOSPITAL: CONCEPTS.TENANT_TYPE_HOSPITAL,
  MEDICAL_OFFICE: CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
  NURSING: CONCEPTS.TENANT_TYPE_NURSING,
  HEALTH_OTHER: CONCEPTS.TENANT_TYPE_HEALTH_OTHER,
  // Negocio de salud: vende productos o servicios de salud sin prestar atención
  // clínica (óptica, ortopedia, distribuidora de insumos). No es institución
  // asistencial, así que no cabe en `HEALTH_OTHER`.
  HEALTH_BUSINESS: CONCEPTS.TENANT_TYPE_HEALTH_BUSINESS,
};

/** Los códigos válidos, para `@IsIn` y para la documentación OpenAPI. */
export const TENANT_TYPE_CODES = Object.keys(
  TENANT_TYPE_CONCEPT_BY_CODE,
) as TenantTypeCode[];

/**
 * Tipos que operan atendiendo o formando en un territorio, y que por eso deben
 * declarar país y jurisdicción: es lo que determina bajo qué regulador operan.
 *
 * `PAYER` y `BROKER` quedan fuera porque su regulador se declara dentro de su
 * propio bloque (`regulatorIdentifier`, `licenseNumber`), que además materializa
 * su fila en `insurance`.
 */
export const TERRITORIAL_TENANT_TYPES: readonly TenantTypeCode[] = [
  'PROVIDER',
  'UNIVERSITY',
  'PHARMACY',
  'HOSPITAL',
  'MEDICAL_OFFICE',
  'NURSING',
  'HEALTH_OTHER',
  'HEALTH_BUSINESS',
];

/** Mapea el código de rol de tenant (DTO) a su concept id. */
export const TENANT_ROLE_CONCEPT_BY_CODE: Record<
  'OWNER' | 'ADMIN' | 'STAFF',
  string
> = {
  OWNER: DIR.ROLE_OWNER,
  ADMIN: DIR.ROLE_ADMIN,
  STAFF: DIR.ROLE_STAFF,
};

/** Mapea el código de scope de acceso (DTO) a su concept id. */
export const ACCESS_SCOPE_CONCEPT_BY_CODE: Record<
  'ALL_TENANT' | 'BRANCH',
  string
> = {
  ALL_TENANT: DIR.SCOPE_ALL_TENANT,
  BRANCH: DIR.SCOPE_BRANCH,
};

/** Mapea el código de tipo de branch (DTO) a su concept id. */
export const BRANCH_TYPE_CONCEPT_BY_CODE: Record<'CLINIC' | 'OFFICE', string> =
  {
    CLINIC: DIR.BRANCH_TYPE_CLINIC,
    OFFICE: DIR.BRANCH_TYPE_OFFICE,
  };
