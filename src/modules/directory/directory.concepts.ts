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

    // --- Peldaños intermedios de la escalera de verificación (v4.1.9) ---
    // Entre «sin verificar» y «verificada» faltaban los dos escalones que el
    // producto sí distingue: la institución que existe porque el padrón oficial
    // del SEDES la lista —y que nadie administra todavía— y la que alguien real
    // ya reclamó y está documentando. Sin ellos la escalera era un booleano, y
    // un hospital público, que jamás va a presentar expediente, quedaba para
    // siempre indistinguible de una organización que se inventó a sí misma.
    TENANT_REGISTRY_LISTED: {
      code: 'DIR_TENANT_REGISTRY_LISTED',
      display: 'Tenant listed in official registry',
    },
    TENANT_CLAIMED: {
      code: 'DIR_TENANT_CLAIMED',
      display: 'Tenant claimed',
    },

    // --- Estados de tenant_memberships.status_concept_id ---
    MEMBERSHIP_INVITED: {
      code: 'DIR_MEMBERSHIP_INVITED',
      display: 'Membership invited',
    },
    // Membresía que un administrador creó para una persona y que esta todavía no
    // aceptó. Es distinta de `MEMBERSHIP_INVITED`, que el personal de apoyo usa
    // para lo contrario (la persona pidió entrar y la organización aún no
    // aprueba): con un solo estado, la persona podría «aceptar» una membresía
    // que la organización todavía tiene que aprobar.
    MEMBERSHIP_PENDING_ACCEPTANCE: {
      code: 'DIR_MEMBERSHIP_PENDING_ACCEPTANCE',
      display: 'Membership pending acceptance by the person',
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

    // --- Origen de la membresía (tenant_memberships.origin_concept_id) ---
    // Por qué existe la fila. El modelo no la deduce: la escribe quien la crea
    // y solo la API la cambia después. Las filas anteriores a v4.2.71 quedan en
    // NULL, que se trata igual que `MEMBERSHIP_ORIGIN_UNKNOWN`. Los ids los fija
    // el modelo (CONCEPTOS.md, «Cambios v4.2.71»): la clave completa
    // `directory:<NOMBRE>` es la que se guarda como código.
    /** La creó el dueño de la organización (alta de la organización). */
    MEMBERSHIP_ORIGIN_OWNER_CREATED: {
      code: 'DIR_MEMBERSHIP_ORIGIN_OWNER_CREATED',
      display: 'Membership origin: created by the organization owner',
    },
    /** La añadió un administrador de la organización. */
    MEMBERSHIP_ORIGIN_ADMIN_ADDED: {
      code: 'DIR_MEMBERSHIP_ORIGIN_ADMIN_ADDED',
      display: 'Membership origin: added by an organization administrator',
    },
    /** La persona canjeó una invitación o un QR (de doctor). */
    MEMBERSHIP_ORIGIN_INVITATION_REDEEMED: {
      code: 'DIR_MEMBERSHIP_ORIGIN_INVITATION_REDEEMED',
      display: 'Membership origin: invitation redeemed',
    },
    /**
     * Existe solo porque la persona tiene un vínculo de apoyo: la abrió el flujo
     * de apoyo (solicitud aprobada, invitación o QR de apoyo). Es la única
     * membresía que el fin del último vínculo cierra.
     */
    MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT: {
      code: 'DIR_MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT',
      display: 'Membership origin: exists only through a support engagement',
    },
    /** Desconocido, declarado así de forma explícita. */
    MEMBERSHIP_ORIGIN_UNKNOWN: {
      code: 'DIR_MEMBERSHIP_ORIGIN_UNKNOWN',
      display: 'Membership origin: unknown',
    },

    // --- Invitaciones de afiliación (código o QR) ---
    AFFILIATION_INVITE_KIND_PRACTITIONER: {
      code: 'AFFILIATION_INVITE_KIND_PRACTITIONER',
      display: 'Affiliation invitation for a practitioner',
    },
    AFFILIATION_INVITE_KIND_SUPPORT_STAFF: {
      code: 'AFFILIATION_INVITE_KIND_SUPPORT_STAFF',
      display: 'Affiliation invitation for support staff',
    },
    AFFILIATION_INVITE_ACTIVE: {
      code: 'AFFILIATION_INVITE_ACTIVE',
      display: 'Affiliation invitation active',
    },
    AFFILIATION_INVITE_REVOKED: {
      code: 'AFFILIATION_INVITE_REVOKED',
      display: 'Affiliation invitation revoked',
    },
    AFFILIATION_INVITE_EXPIRED: {
      code: 'AFFILIATION_INVITE_EXPIRED',
      display: 'Affiliation invitation expired',
    },
    AFFILIATION_INVITE_EXHAUSTED: {
      code: 'AFFILIATION_INVITE_EXHAUSTED',
      display: 'Affiliation invitation exhausted',
    },
    AFFILIATION_USE_ACCEPTED: {
      code: 'AFFILIATION_USE_ACCEPTED',
      display: 'Invitation use accepted',
    },
    AFFILIATION_USE_REJECTED_EXPIRED: {
      code: 'AFFILIATION_USE_REJECTED_EXPIRED',
      display: 'Invitation use rejected: expired',
    },
    AFFILIATION_USE_REJECTED_EXHAUSTED: {
      code: 'AFFILIATION_USE_REJECTED_EXHAUSTED',
      display: 'Invitation use rejected: exhausted',
    },
    AFFILIATION_USE_REJECTED_REVOKED: {
      code: 'AFFILIATION_USE_REJECTED_REVOKED',
      display: 'Invitation use rejected: revoked',
    },
    AFFILIATION_USE_ALREADY_MEMBER: {
      code: 'AFFILIATION_USE_ALREADY_MEMBER',
      display: 'Invitation use rejected: already a member',
    },

    // --- Roles de tenant (tenant_memberships.tenant_role_concept_id) ---
    ROLE_OWNER: { code: 'DIR_ROLE_OWNER', display: 'Tenant owner' },
    ROLE_ADMIN: { code: 'DIR_ROLE_ADMIN', display: 'Tenant admin' },
    ROLE_STAFF: { code: 'DIR_ROLE_STAFF', display: 'Tenant staff' },
    /**
     * Profesional cuyo vínculo con la organización fue aprobado. Existe para que
     * la aprobación pueda darle acceso al tenant sin convertirlo en personal
     * administrativo: opera su propia agenda ahí, y nada más.
     *
     * A propósito NO figura en `TENANT_ROLE_CONCEPT_BY_CODE`: el rol lo escribe
     * únicamente el aprobador de vínculos, no un DTO de invitación. Quien
     * administra no puede repartirlo a mano, así que la fila es evidencia de un
     * trámite aprobado y no de una decisión suelta.
     */
    ROLE_PRACTITIONER: {
      code: 'DIR_ROLE_PRACTITIONER',
      display: 'Tenant practitioner',
    },

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
  | 'CLINIC'
  | 'MEDICAL_OFFICE'
  | 'NURSING'
  | 'HEALTH_OTHER'
  | 'HEALTH_BUSINESS'
  | 'DIAGNOSTIC_CENTER';

/** Mapea el código de tipo de organización (DTO) a su concept id. */
export const TENANT_TYPE_CONCEPT_BY_CODE: Readonly<
  Record<TenantTypeCode, string>
> = {
  PROVIDER: CONCEPTS.TENANT_TYPE_PROVIDER,
  PAYER: CONCEPTS.TENANT_TYPE_PAYER,
  BROKER: CONCEPTS.TENANT_TYPE_BROKER,
  UNIVERSITY: CONCEPTS.TENANT_TYPE_UNIVERSITY,
  PHARMACY: CONCEPTS.TENANT_TYPE_PHARMACY,
  // Las cinco institucionales. Son códigos hermanos y no un subtipo de otro
  // código porque el tipo ya vive en una sola columna (`tenant_type_concept_id`)
  // y anidar exigiría una columna más para distinguir cinco valores.
  HOSPITAL: CONCEPTS.TENANT_TYPE_HOSPITAL,
  CLINIC: CONCEPTS.TENANT_TYPE_CLINIC,
  MEDICAL_OFFICE: CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
  NURSING: CONCEPTS.TENANT_TYPE_NURSING,
  HEALTH_OTHER: CONCEPTS.TENANT_TYPE_HEALTH_OTHER,
  // Negocio de salud: vende productos o servicios de salud sin prestar atención
  // clínica (óptica, ortopedia, distribuidora de insumos). No es institución
  // asistencial, así que no cabe en `HEALTH_OTHER`.
  HEALTH_BUSINESS: CONCEPTS.TENANT_TYPE_HEALTH_BUSINESS,
  // Centro de diagnóstico por imágenes o laboratorio clínico (subtarea 1.5).
  // Territorial como los de arriba, y con fila propia en `diagnostic_units`
  // (ver `TenantTypeProfileService.materializeProfile`).
  DIAGNOSTIC_CENTER: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
};

/** Los códigos válidos, para `@IsIn` y para la documentación OpenAPI. */
export const TENANT_TYPE_CODES = Object.keys(
  TENANT_TYPE_CONCEPT_BY_CODE,
) as TenantTypeCode[];

/**
 * El inverso de {@link TENANT_TYPE_CONCEPT_BY_CODE}: concept id → código.
 *
 * Se deriva del mapa de ida para que las dos direcciones no puedan discrepar
 * (mismo patrón que `BIRTH_SEX_CODE_BY_CONCEPT` en `profiles.concepts.ts`).
 * Un `tenant_type_concept_id` que no esté en el catálogo (la columna admite
 * cualquier uuid, ver `DirectoryTenantsService.resolveTenantType`) simplemente
 * no tiene entrada acá: quien lo consulte lo trata como tipo desconocido, no
 * como error.
 */
export const TENANT_TYPE_CODE_BY_CONCEPT_ID: Readonly<
  Record<string, TenantTypeCode>
> = Object.fromEntries(
  Object.entries(TENANT_TYPE_CONCEPT_BY_CODE).map(([code, conceptId]) => [
    conceptId,
    code as TenantTypeCode,
  ]),
);

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
  'CLINIC',
  'MEDICAL_OFFICE',
  'NURSING',
  'HEALTH_OTHER',
  'HEALTH_BUSINESS',
  'DIAGNOSTIC_CENTER',
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
