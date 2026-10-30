import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `profiles` (personas, pacientes y fuerza laboral
 * de salud). Se declaran aquí para que el módulo pueda añadir estados/tipos sin
 * tocar archivos compartidos: `defineModuleConcepts` deriva un UUIDv5 estable por
 * clave (prefijo `profiles:`) que coincide entre el seed y el runtime.
 *
 * - `PROFILES_CONCEPT_SEEDS` lo consume el agregador central del seed.
 * - `PROF` es el mapa `nombre -> UUID` que consumen servicios y smoke.
 *
 * Cada columna `*_concept_id` NOT NULL de los inserts del módulo tiene aquí un
 * valor; los conceptos que llegan del cliente (categoría profesional, jurisdicción,
 * especialidad, tipo de credencial, parentesco, idioma) se pasan por DTO y usan
 * estos ids como valor por defecto razonable.
 */
export const { seeds: PROFILES_CONCEPT_SEEDS, ids: PROF } =
  defineModuleConcepts('profiles', {
    // Ciclo de vida de la persona
    PERSON_ACTIVE: { code: 'PERSON_ACTIVE', display: 'Person active' },
    PERSON_INACTIVE: { code: 'PERSON_INACTIVE', display: 'Person inactive' },
    PERSON_MERGED: { code: 'PERSON_MERGED', display: 'Person merged' },
    VITAL_ALIVE: { code: 'VITAL_ALIVE', display: 'Vital status alive' },
    VITAL_DECEASED: {
      code: 'VITAL_DECEASED',
      display: 'Vital status deceased',
    },

    // Tipo y estado del perfil de persona
    PROFILE_TYPE_PATIENT: {
      code: 'PROFILE_PATIENT',
      display: 'Patient profile type',
    },
    PROFILE_TYPE_PRACTITIONER: {
      code: 'PROFILE_PRACTITIONER',
      display: 'Practitioner profile type',
    },
    PROFILE_ACTIVE: { code: 'PROFILE_ACTIVE', display: 'Profile active' },

    // Estado de vinculación (MPI) del paciente
    LINKAGE_UNLINKED: { code: 'LINKAGE_UNLINKED', display: 'Record unlinked' },
    LINKAGE_LINKED: { code: 'LINKAGE_LINKED', display: 'Record linked' },
    LINKAGE_MERGED: { code: 'LINKAGE_MERGED', display: 'Record merged' },

    // Vínculo persona-cuenta de portal
    ACCOUNT_LINK_SELF: {
      code: 'ACCOUNT_LINK_SELF',
      display: 'Self account link type',
    },
    ACCOUNT_LINK_ACTIVE: {
      code: 'ACCOUNT_LINK_ACTIVE',
      display: 'Account link active',
    },
    ACCOUNT_LINK_SUPERSEDED: {
      code: 'ACCOUNT_LINK_SUPERSEDED',
      display: 'Account link superseded',
    },
    ACCOUNT_LINK_REVOKED: {
      code: 'ACCOUNT_LINK_REVOKED',
      display: 'Account link revoked',
    },
    ACCOUNT_LINK_VERIFIED: {
      code: 'ACCOUNT_LINK_VERIFIED',
      display: 'Account link verified',
    },

    // Profesional de salud
    PRACT_CATEGORY_GENERAL: {
      code: 'PRACT_CATEGORY_GENERAL',
      display: 'General practitioner category',
    },
    PRACT_VERIF_PENDING: {
      code: 'PRACT_VERIF_PENDING',
      display: 'Practitioner verification pending',
    },
    PRACT_VERIF_VERIFIED: {
      code: 'PRACT_VERIF_VERIFIED',
      display: 'Practitioner verified',
    },
    PRACTICE_ONBOARDING: {
      code: 'PRACTICE_ONBOARDING',
      display: 'Practice onboarding',
    },
    PRACTICE_ACTIVE: { code: 'PRACTICE_ACTIVE', display: 'Practice active' },

    // Autorización jurisdiccional (licencia)
    JURISDICTION_NATIONAL: {
      code: 'JURISDICTION_NATIONAL',
      display: 'National jurisdiction',
    },
    // SEDES (Servicio Departamental de Salud) es una autorización departamental,
    // no nacional: un médico que ejerce en Santa Cruz puede tener las dos —su
    // matrícula del Ministerio de Salud/Colegio y, aparte, su registro ante el
    // SEDES de la gobernación—, así que es una segunda fila de
    // `jurisdiction_authorizations`, no un reemplazo de la nacional.
    JURISDICTION_SEDES_SANTA_CRUZ: {
      code: 'JURISDICTION_SEDES_SANTA_CRUZ',
      display: 'SEDES — Gobernación Autónoma Departamental de Santa Cruz',
    },
    // Los otros ocho Servicios Departamentales de Salud: uno por departamento
    // (CPE art. 269), con el mismo carácter que el de Santa Cruz —se suman a la
    // nacional—. Completan la lista para quien ejerce fuera de Santa Cruz.
    JURISDICTION_SEDES_LA_PAZ: {
      code: 'JURISDICTION_SEDES_LA_PAZ',
      display: 'SEDES — Gobierno Autónomo Departamental de La Paz',
    },
    JURISDICTION_SEDES_COCHABAMBA: {
      code: 'JURISDICTION_SEDES_COCHABAMBA',
      display: 'SEDES — Gobierno Autónomo Departamental de Cochabamba',
    },
    JURISDICTION_SEDES_ORURO: {
      code: 'JURISDICTION_SEDES_ORURO',
      display: 'SEDES — Gobierno Autónomo Departamental de Oruro',
    },
    JURISDICTION_SEDES_POTOSI: {
      code: 'JURISDICTION_SEDES_POTOSI',
      display: 'SEDES — Gobierno Autónomo Departamental de Potosí',
    },
    JURISDICTION_SEDES_CHUQUISACA: {
      code: 'JURISDICTION_SEDES_CHUQUISACA',
      display: 'SEDES — Gobierno Autónomo Departamental de Chuquisaca',
    },
    JURISDICTION_SEDES_TARIJA: {
      code: 'JURISDICTION_SEDES_TARIJA',
      display: 'SEDES — Gobierno Autónomo Departamental de Tarija',
    },
    JURISDICTION_SEDES_BENI: {
      code: 'JURISDICTION_SEDES_BENI',
      display: 'SEDES — Gobierno Autónomo Departamental del Beni',
    },
    JURISDICTION_SEDES_PANDO: {
      code: 'JURISDICTION_SEDES_PANDO',
      display: 'SEDES — Gobierno Autónomo Departamental de Pando',
    },
    // El registro en el colegio de la profesión (Colegio Médico, de
    // Odontólogos…): la tercera habilitación del alta. No es territorial, pero
    // vive en la misma tabla que las otras dos para que el perfil las muestre
    // juntas; el nombre del colegio va en `regulatory_authority`.
    JURISDICTION_PROFESSIONAL_COLLEGE: {
      code: 'JURISDICTION_PROFESSIONAL_COLLEGE',
      display: 'Professional college registration',
    },
    AUTH_PENDING: { code: 'AUTH_PENDING', display: 'Authorization pending' },
    AUTH_ACTIVE: { code: 'AUTH_ACTIVE', display: 'Authorization active' },
    AUTH_EXPIRED: { code: 'AUTH_EXPIRED', display: 'Authorization expired' },
    // v4.2.67: la matrícula que la admisión rechazó. Sin este estado, un rechazo
    // sólo podía dejarla en AUTH_PENDING, indistinguible de «nadie la miró».
    AUTH_REJECTED: { code: 'AUTH_REJECTED', display: 'Authorization rejected' },

    // Credenciales profesionales
    // Los cinco que el registro de procesos enumera para el médico (MÓDULO
    // MÉDICO §1.15 a §1.20). No son escalones de una escala: son documentos
    // distintos, y el registro pide poder cargar VARIOS de cada uno —«espacio
    // para poder subir varios diplomados»—, así que el tipo vive en la fila y
    // no en una columna del perfil.
    CREDENTIAL_TYPE_DEGREE: {
      code: 'CREDENTIAL_TYPE_DEGREE',
      display: 'Academic degree credential',
    },
    CREDENTIAL_TYPE_DIPLOMA: {
      code: 'CREDENTIAL_TYPE_DIPLOMA',
      display: 'Diploma course credential',
    },
    CREDENTIAL_TYPE_MASTER: {
      code: 'CREDENTIAL_TYPE_MASTER',
      display: "Master's degree credential",
    },
    CREDENTIAL_TYPE_DOCTORATE: {
      code: 'CREDENTIAL_TYPE_DOCTORATE',
      display: 'Doctorate degree credential',
    },
    // El TÍTULO de especialidad, que no es lo mismo que la especialidad que
    // ejerce: aquélla es una fila de `practitioner_specialties` y dice qué
    // atiende; ésta es el diploma que la respalda.
    CREDENTIAL_TYPE_SPECIALTY: {
      code: 'CREDENTIAL_TYPE_SPECIALTY',
      display: 'Specialty degree credential',
    },
    CRED_PENDING: {
      code: 'CRED_PENDING',
      display: 'Credential pending verification',
    },
    CRED_VERIFIED: { code: 'CRED_VERIFIED', display: 'Credential verified' },
    CRED_REJECTED: { code: 'CRED_REJECTED', display: 'Credential rejected' },

    // Especialidades. Cuál es cada especialidad no se declara acá: lo dice
    // `VS_MEDICAL_SPECIALTY`, que siembra el paquete del modelo. Estos conceptos
    // describen el rol y la verificación de la especialidad declarada, no su nombre.
    SPECIALTY_ROLE_PRIMARY: {
      code: 'SPECIALTY_ROLE_PRIMARY',
      display: 'Primary specialty role',
    },
    SPEC_VERIF_PENDING: {
      code: 'SPEC_VERIF_PENDING',
      display: 'Specialty verification pending',
    },
    SPEC_VERIF_VERIFIED: {
      code: 'SPEC_VERIF_VERIFIED',
      display: 'Specialty verified',
    },
    SPEC_VERIF_REJECTED: {
      code: 'SPEC_VERIF_REJECTED',
      display: 'Specialty verification rejected',
    },

    // --- Admisiones de profesionales (v4.2.67) -----------------------------
    // Tipo de admisión. La bandeja «Admisiones» es genérica: hoy sólo existe
    // ALTA_DE_DOCTOR; organización, farmacia, laboratorio y aseguradora se
    // agregan como conceptos de este mismo value set, sin tocar el esquema.
    ADMISSION_TYPE_PRACTITIONER_ONBOARDING: {
      code: 'ADMISSION_TYPE_PRACTITIONER_ONBOARDING',
      display: 'Practitioner onboarding admission',
    },
    // Estado de la admisión. `ENVIADA` equivale a PRACT_VERIF_PENDING del perfil.
    ADMISSION_STATUS_SUBMITTED: {
      code: 'ADMISSION_STATUS_SUBMITTED',
      display: 'Admission submitted',
    },
    ADMISSION_STATUS_IN_REVIEW: {
      code: 'ADMISSION_STATUS_IN_REVIEW',
      display: 'Admission in review',
    },
    ADMISSION_STATUS_INFO_REQUIRED: {
      code: 'ADMISSION_STATUS_INFO_REQUIRED',
      display: 'Admission needs more information',
    },
    ADMISSION_STATUS_VERIFIED: {
      code: 'ADMISSION_STATUS_VERIFIED',
      display: 'Admission verified',
    },
    ADMISSION_STATUS_REJECTED: {
      code: 'ADMISSION_STATUS_REJECTED',
      display: 'Admission rejected',
    },
    ADMISSION_STATUS_SUSPENDED: {
      code: 'ADMISSION_STATUS_SUSPENDED',
      display: 'Admission suspended',
    },
    ADMISSION_STATUS_EXPIRED: {
      code: 'ADMISSION_STATUS_EXPIRED',
      display: 'Admission expired',
    },
    ADMISSION_STATUS_WITHDRAWN: {
      code: 'ADMISSION_STATUS_WITHDRAWN',
      display: 'Admission withdrawn',
    },
    // ABANDONADA: el solicitante no respondió a la información pedida dentro de su
    // plazo. Distinta de EXPIRADA, que es la vigencia vencida de una VERIFICADA.
    ADMISSION_STATUS_ABANDONED: {
      code: 'ADMISSION_STATUS_ABANDONED',
      display: 'Admission abandoned',
    },
    // Eventos de la bitácora (append-only).
    ADMISSION_EVENT_CREATED: {
      code: 'ADMISSION_EVENT_CREATED',
      display: 'Admission created',
    },
    ADMISSION_EVENT_CLAIMED: {
      code: 'ADMISSION_EVENT_CLAIMED',
      display: 'Admission claimed for review',
    },
    ADMISSION_EVENT_INFO_REQUESTED: {
      code: 'ADMISSION_EVENT_INFO_REQUESTED',
      display: 'Admission information requested',
    },
    ADMISSION_EVENT_RESUBMITTED: {
      code: 'ADMISSION_EVENT_RESUBMITTED',
      display: 'Admission resubmitted',
    },
    ADMISSION_EVENT_ITEM_VERIFIED: {
      code: 'ADMISSION_EVENT_ITEM_VERIFIED',
      display: 'Admission item verified',
    },
    ADMISSION_EVENT_ITEM_REJECTED: {
      code: 'ADMISSION_EVENT_ITEM_REJECTED',
      display: 'Admission item rejected',
    },
    ADMISSION_EVENT_ITEM_INFO_REQUIRED: {
      code: 'ADMISSION_EVENT_ITEM_INFO_REQUIRED',
      display: 'Admission item needs more information',
    },
    ADMISSION_EVENT_VERIFIED: {
      code: 'ADMISSION_EVENT_VERIFIED',
      display: 'Admission verified',
    },
    ADMISSION_EVENT_REJECTED: {
      code: 'ADMISSION_EVENT_REJECTED',
      display: 'Admission rejected',
    },
    ADMISSION_EVENT_SUSPENDED: {
      code: 'ADMISSION_EVENT_SUSPENDED',
      display: 'Admission suspended',
    },
    ADMISSION_EVENT_REINSTATED: {
      code: 'ADMISSION_EVENT_REINSTATED',
      display: 'Admission reinstated',
    },
    ADMISSION_EVENT_EXPIRED: {
      code: 'ADMISSION_EVENT_EXPIRED',
      display: 'Admission expired',
    },
    ADMISSION_EVENT_WITHDRAWN: {
      code: 'ADMISSION_EVENT_WITHDRAWN',
      display: 'Admission withdrawn',
    },
    ADMISSION_EVENT_ABANDONED: {
      code: 'ADMISSION_EVENT_ABANDONED',
      display: 'Admission abandoned',
    },
    ADMISSION_EVENT_RELEASED: {
      code: 'ADMISSION_EVENT_RELEASED',
      display: 'Admission released back to the queue',
    },
    ADMISSION_EVENT_REASSIGNED: {
      code: 'ADMISSION_EVENT_REASSIGNED',
      display: 'Admission reassigned to another reviewer',
    },
    ADMISSION_EVENT_BACKFILLED: {
      code: 'ADMISSION_EVENT_BACKFILLED',
      display: 'Admission created by backfill',
    },
    // Clase de ficha que revisa un requisito.
    ADMISSION_ITEM_LICENSE: {
      code: 'ADMISSION_ITEM_LICENSE',
      display: 'Admission item: license',
    },
    ADMISSION_ITEM_CREDENTIAL: {
      code: 'ADMISSION_ITEM_CREDENTIAL',
      display: 'Admission item: credential',
    },
    ADMISSION_ITEM_SPECIALTY: {
      code: 'ADMISSION_ITEM_SPECIALTY',
      display: 'Admission item: specialty',
    },
    ADMISSION_ITEM_PROFILE: {
      code: 'ADMISSION_ITEM_PROFILE',
      display: 'Admission item: profile data',
    },
    // Estado vigente de la revisión de un requisito/ítem.
    ADMISSION_REVIEW_PENDING: {
      code: 'ADMISSION_REVIEW_PENDING',
      display: 'Review pending',
    },
    ADMISSION_REVIEW_VERIFIED: {
      code: 'ADMISSION_REVIEW_VERIFIED',
      display: 'Review verified',
    },
    ADMISSION_REVIEW_REJECTED: {
      code: 'ADMISSION_REVIEW_REJECTED',
      display: 'Review rejected',
    },
    ADMISSION_REVIEW_INFO_REQUIRED: {
      code: 'ADMISSION_REVIEW_INFO_REQUIRED',
      display: 'Review needs more information',
    },
    // Tipo de evidencia y método de verificación de un requisito.
    ADMISSION_EVIDENCE_DOCUMENT: {
      code: 'ADMISSION_EVIDENCE_DOCUMENT',
      display: 'Evidence: document',
    },
    ADMISSION_EVIDENCE_DATA: {
      code: 'ADMISSION_EVIDENCE_DATA',
      display: 'Evidence: data',
    },
    ADMISSION_METHOD_MANUAL: {
      code: 'ADMISSION_METHOD_MANUAL',
      display: 'Verification method: manual review',
    },
    ADMISSION_METHOD_AUTHORITY_CHECK: {
      code: 'ADMISSION_METHOD_AUTHORITY_CHECK',
      display: 'Verification method: authority check',
    },
    // Fuente consultada al verificar un ítem (tipo estructurado; mapea a FHIR
    // primarySource.type). No hay registros públicos con URL estable: la fuente es
    // un tipo + una referencia, no sólo un enlace.
    ADMISSION_SOURCE_MINSALUD_REGISTRY: {
      code: 'ADMISSION_SOURCE_MINSALUD_REGISTRY',
      display: 'Source: Ministry of Health registry',
    },
    ADMISSION_SOURCE_MEDICAL_COLLEGE: {
      code: 'ADMISSION_SOURCE_MEDICAL_COLLEGE',
      display: 'Source: medical college',
    },
    ADMISSION_SOURCE_DENTAL_COLLEGE: {
      code: 'ADMISSION_SOURCE_DENTAL_COLLEGE',
      display: 'Source: dental college',
    },
    ADMISSION_SOURCE_SEDES: {
      code: 'ADMISSION_SOURCE_SEDES',
      display: 'Source: departmental health service (SEDES)',
    },
    ADMISSION_SOURCE_SEGIP: {
      code: 'ADMISSION_SOURCE_SEGIP',
      display: 'Source: SEGIP',
    },
    ADMISSION_SOURCE_SUBMITTED_DOCUMENT: {
      code: 'ADMISSION_SOURCE_SUBMITTED_DOCUMENT',
      display: 'Source: document submitted by the applicant',
    },
    ADMISSION_SOURCE_OTHER: {
      code: 'ADMISSION_SOURCE_OTHER',
      display: 'Source: other',
    },
    // Motivo estructurado de un rechazo o de una petición de información.
    ADMISSION_REASON_ILLEGIBLE: {
      code: 'ADMISSION_REASON_ILLEGIBLE',
      display: 'Reason: illegible document',
    },
    ADMISSION_REASON_EXPIRED: {
      code: 'ADMISSION_REASON_EXPIRED',
      display: 'Reason: document expired',
    },
    ADMISSION_REASON_NAME_MISMATCH: {
      code: 'ADMISSION_REASON_NAME_MISMATCH',
      display: 'Reason: name does not match',
    },
    ADMISSION_REASON_NOT_IN_REGISTRY: {
      code: 'ADMISSION_REASON_NOT_IN_REGISTRY',
      display: 'Reason: not found in the registry',
    },
    ADMISSION_REASON_INCOMPLETE: {
      code: 'ADMISSION_REASON_INCOMPLETE',
      display: 'Reason: incomplete document',
    },
    // Sólo para el personal: al solicitante se le muestra como ADMISSION_REASON_OTHER.
    ADMISSION_REASON_SUSPECTED_FRAUD: {
      code: 'ADMISSION_REASON_SUSPECTED_FRAUD',
      display: 'Reason: suspected fraud (staff only)',
    },
    ADMISSION_REASON_OTHER: {
      code: 'ADMISSION_REASON_OTHER',
      display: 'Reason: other',
    },
    // Categoría del aviso que recibe el médico en cada transición.
    NOTICE_ADMISSION: {
      code: 'ADMISSION_NOTICE',
      display: 'Admission notice',
    },

    // Vínculo del profesional con la institución. Desde v4.1.9 el estado es el
    // de la APROBACIÓN del vínculo, no el del registro: aprobado sólo si alguien
    // de la organización aprobó; pendiente si hay a quién preguntarle (la
    // organización tiene OWNER/ADMIN); declarado si no hay nadie. Que el vínculo
    // siga vigente lo sigue diciendo `end_date`, no el estado.
    //
    // `AFFILIATION_DECLARED` no es un pendiente disfrazado: existe porque
    // esperar la aprobación de una organización sin dueño —los hospitales
    // públicos y las cajas, que nunca van a registrarse— bloquearía a sus
    // médicos para siempre. Publica igual; lo que no tiene es sello de la
    // institución, y eso se dice en pantalla.
    AFFILIATION_PENDING: {
      code: 'AFFILIATION_PENDING',
      display: 'Practitioner affiliation pending approval',
    },
    AFFILIATION_DECLARED: {
      code: 'AFFILIATION_DECLARED',
      display: 'Practitioner affiliation declared',
    },
    AFFILIATION_APPROVED: {
      code: 'AFFILIATION_APPROVED',
      display: 'Practitioner affiliation approved',
    },
    AFFILIATION_REJECTED: {
      code: 'AFFILIATION_REJECTED',
      display: 'Practitioner affiliation rejected',
    },
    AFFILIATION_REVOKED: {
      code: 'AFFILIATION_REVOKED',
      display: 'Practitioner affiliation revoked',
    },

    // DEPRECADOS en v4.1.9. Eran el estado del *registro* (activo/retractado) y
    // los cinco de arriba los reemplazan. Se conservan hasta que se cumplan las
    // dos condiciones: (a) `ESTADO_DEL_VINCULO` y sus pruebas apunten a los
    // nuevos —carril MAC-VINCULO— y (b) el backfill del patch v4.1.9 haya
    // corrido en todas las bases vivas, porque hasta entonces son los ids que
    // las filas existentes tienen escritos. Recién ahí se borran, en un PR
    // propio. No les agregues designación en castellano: no pertenecen a ningún
    // conjunto de valores y `terminology-designations.es.spec.ts` lo prohíbe.
    AFFILIATION_ACTIVE: {
      code: 'AFFILIATION_ACTIVE',
      display: 'Practitioner affiliation active',
    },
    AFFILIATION_RETRACTED: {
      code: 'AFFILIATION_RETRACTED',
      display: 'Practitioner affiliation retracted',
    },
    // Categorías de aviso del circuito del vínculo. Son el
    // `category_concept_id` de `messaging.notification_requests`, y existen como
    // conceptos propios porque la preferencia por categoría se declara contra
    // uno: sin él, «no me avises de esto» no se puede expresar.
    NOTICE_AFFILIATION_APPROVED: {
      code: 'AFFILIATION_NOTICE_APPROVED',
      display: 'Affiliation notice: approved',
    },
    NOTICE_AFFILIATION_REJECTED: {
      code: 'AFFILIATION_NOTICE_REJECTED',
      display: 'Affiliation notice: rejected',
    },
    NOTICE_AFFILIATION_REVOKED: {
      code: 'AFFILIATION_NOTICE_REVOKED',
      display: 'Affiliation notice: revoked',
    },
    NOTICE_AFFILIATION_REQUESTED: {
      code: 'AFFILIATION_NOTICE_REQUESTED',
      display: 'Affiliation notice: requested',
    },

    AFFILIATION_TYPE_EMPLOYMENT: {
      code: 'AFFILIATION_TYPE_EMPLOYMENT',
      display: 'Employment affiliation type',
    },

    // Idiomas clínicos
    LANGUAGE_SPANISH: {
      code: 'LANGUAGE_SPANISH',
      display: 'Spanish clinical language',
    },
    LANG_PROFICIENCY_NATIVE: {
      code: 'LANG_PROFICIENCY_NATIVE',
      display: 'Native language proficiency',
    },

    // Vínculos de identidad externa (MPI)
    IDENTITY_LINK_MPI: {
      code: 'IDENTITY_LINK_MPI',
      display: 'MPI identity link type',
    },
    IDENTITY_UNVERIFIED: {
      code: 'IDENTITY_UNVERIFIED',
      display: 'Identity link unverified',
    },
    IDENTITY_VERIFIED: {
      code: 'IDENTITY_VERIFIED',
      display: 'Identity link verified',
    },

    // Fusión de pacientes
    MERGE_REASON_DUPLICATE: {
      code: 'MERGE_REASON_DUPLICATE',
      display: 'Duplicate patient merge reason',
    },
    MERGE_APPROVED: {
      code: 'MERGE_APPROVED',
      display: 'Merge decision approved',
    },
    MERGE_REVERSED: {
      code: 'MERGE_REVERSED',
      display: 'Merge decision reversed',
    },

    // Personas relacionadas / contactos
    RELATIONSHIP_GUARDIAN: {
      code: 'RELATIONSHIP_GUARDIAN',
      display: 'Legal guardian relationship',
    },
    // El parentesco que declara quien se registra, para su contacto de
    // emergencia. `RELATIONSHIP_GUARDIAN` era el único, así que todo contacto
    // quedaba anotado como representante legal —un vínculo que nadie verificó—
    // por falta de opciones, no por decisión de nadie. Sigue siendo el valor por
    // defecto cuando el alta no declara parentesco, por compatibilidad.
    RELATIONSHIP_MOTHER: {
      code: 'RELATIONSHIP_MOTHER',
      display: 'Mother relationship',
    },
    RELATIONSHIP_FATHER: {
      code: 'RELATIONSHIP_FATHER',
      display: 'Father relationship',
    },
    RELATIONSHIP_SPOUSE: {
      code: 'RELATIONSHIP_SPOUSE',
      display: 'Spouse or partner relationship',
    },
    RELATIONSHIP_CHILD: {
      code: 'RELATIONSHIP_CHILD',
      display: 'Child relationship',
    },
    RELATIONSHIP_SIBLING: {
      code: 'RELATIONSHIP_SIBLING',
      display: 'Sibling relationship',
    },
    RELATIONSHIP_OTHER_RELATIVE: {
      code: 'RELATIONSHIP_OTHER_RELATIVE',
      display: 'Other relative relationship',
    },
    RELATIONSHIP_FRIEND: {
      code: 'RELATIONSHIP_FRIEND',
      display: 'Friend relationship',
    },
    // La salida del catálogo: quien no es familia, pareja ni amistad —un vecino,
    // el encargado del edificio— sigue siendo a quien hay que llamar. Sin ella,
    // el desplegable obligaría a elegir un parentesco falso.
    RELATIONSHIP_OTHER: {
      code: 'RELATIONSHIP_OTHER',
      display: 'Other relationship',
    },
    // Parentescos y vínculos que completan el catálogo para un hogar boliviano:
    // la familia extendida (abuelos, tíos, primos, sobrinos), la política
    // (suegros, yernos y nueras, cuñados), la reconstituida (padrastros,
    // hijastros, medios hermanos), la adoptiva y la sustituta (Código Niña, Niño
    // y Adolescente, Ley 548), el compadrazgo, y los vínculos no familiares a
    // los que de verdad se llama en una emergencia (quien cuida, quien trabaja
    // en el hogar, el apoderado con poder notarial). Ninguno sostiene por sí
    // solo una representación: la lista de dependientes sigue siendo
    // `DEPENDENT_RELATIONSHIP_CONCEPT_IDS`.
    RELATIONSHIP_GRANDPARENT: {
      code: 'RELATIONSHIP_GRANDPARENT',
      display: 'Grandparent relationship',
    },
    RELATIONSHIP_GRANDCHILD: {
      code: 'RELATIONSHIP_GRANDCHILD',
      display: 'Grandchild relationship',
    },
    RELATIONSHIP_GREAT_GRANDPARENT: {
      code: 'RELATIONSHIP_GREAT_GRANDPARENT',
      display: 'Great-grandparent relationship',
    },
    RELATIONSHIP_GREAT_GRANDCHILD: {
      code: 'RELATIONSHIP_GREAT_GRANDCHILD',
      display: 'Great-grandchild relationship',
    },
    RELATIONSHIP_UNCLE_AUNT: {
      code: 'RELATIONSHIP_UNCLE_AUNT',
      display: 'Uncle or aunt relationship',
    },
    RELATIONSHIP_NEPHEW_NIECE: {
      code: 'RELATIONSHIP_NEPHEW_NIECE',
      display: 'Nephew or niece relationship',
    },
    RELATIONSHIP_COUSIN: {
      code: 'RELATIONSHIP_COUSIN',
      display: 'Cousin relationship',
    },
    RELATIONSHIP_HALF_SIBLING: {
      code: 'RELATIONSHIP_HALF_SIBLING',
      display: 'Half-sibling relationship',
    },
    RELATIONSHIP_STEPPARENT: {
      code: 'RELATIONSHIP_STEPPARENT',
      display: 'Stepparent relationship',
    },
    RELATIONSHIP_STEPCHILD: {
      code: 'RELATIONSHIP_STEPCHILD',
      display: 'Stepchild relationship',
    },
    RELATIONSHIP_STEPSIBLING: {
      code: 'RELATIONSHIP_STEPSIBLING',
      display: 'Stepsibling relationship',
    },
    RELATIONSHIP_PARENT_IN_LAW: {
      code: 'RELATIONSHIP_PARENT_IN_LAW',
      display: 'Parent-in-law relationship',
    },
    RELATIONSHIP_CHILD_IN_LAW: {
      code: 'RELATIONSHIP_CHILD_IN_LAW',
      display: 'Son- or daughter-in-law relationship',
    },
    RELATIONSHIP_SIBLING_IN_LAW: {
      code: 'RELATIONSHIP_SIBLING_IN_LAW',
      display: 'Sibling-in-law relationship',
    },
    RELATIONSHIP_ADOPTIVE_PARENT: {
      code: 'RELATIONSHIP_ADOPTIVE_PARENT',
      display: 'Adoptive parent relationship',
    },
    RELATIONSHIP_ADOPTED_CHILD: {
      code: 'RELATIONSHIP_ADOPTED_CHILD',
      display: 'Adopted child relationship',
    },
    RELATIONSHIP_FOSTER_PARENT: {
      code: 'RELATIONSHIP_FOSTER_PARENT',
      display: 'Foster parent (substitute family) relationship',
    },
    RELATIONSHIP_EX_SPOUSE: {
      code: 'RELATIONSHIP_EX_SPOUSE',
      display: 'Former spouse or partner relationship',
    },
    RELATIONSHIP_GODPARENT: {
      code: 'RELATIONSHIP_GODPARENT',
      display: 'Godparent relationship',
    },
    RELATIONSHIP_GODCHILD: {
      code: 'RELATIONSHIP_GODCHILD',
      display: 'Godchild relationship',
    },
    RELATIONSHIP_COMPADRE: {
      code: 'RELATIONSHIP_COMPADRE',
      display: 'Co-parent (compadre/comadre) relationship',
    },
    RELATIONSHIP_CAREGIVER: {
      code: 'RELATIONSHIP_CAREGIVER',
      display: 'Caregiver relationship',
    },
    RELATIONSHIP_DOMESTIC_WORKER: {
      code: 'RELATIONSHIP_DOMESTIC_WORKER',
      display: 'Household worker relationship',
    },
    RELATIONSHIP_ATTORNEY_IN_FACT: {
      code: 'RELATIONSHIP_ATTORNEY_IN_FACT',
      display: 'Attorney-in-fact (notarial power) relationship',
    },
    RELATIONSHIP_CARE_HOME_STAFF: {
      code: 'RELATIONSHIP_CARE_HOME_STAFF',
      display: 'Care home or shelter staff relationship',
    },
    RELATIONSHIP_NEIGHBOR: {
      code: 'RELATIONSHIP_NEIGHBOR',
      display: 'Neighbor relationship',
    },
    RELATIONSHIP_HOUSEMATE: {
      code: 'RELATIONSHIP_HOUSEMATE',
      display: 'Housemate relationship',
    },
    RELATIONSHIP_COWORKER: {
      code: 'RELATIONSHIP_COWORKER',
      display: 'Coworker relationship',
    },
    RELATIONSHIP_EMPLOYER: {
      code: 'RELATIONSHIP_EMPLOYER',
      display: 'Employer relationship',
    },
    RELATED_ACTIVE: {
      code: 'RELATED_ACTIVE',
      display: 'Related person active',
    },

    // Proxies de portal
    PROXY_ACTIVE: { code: 'PROXY_ACTIVE', display: 'Portal proxy active' },
    PROXY_REVOKED: { code: 'PROXY_REVOKED', display: 'Portal proxy revoked' },
    // La solicitud de representar a quien ya tiene cuenta: el apoderamiento
    // existe desde que se pide, pero no habilita nada hasta que la persona lo
    // acepta. Todas las lecturas de permiso filtran por `PROXY_ACTIVE`, así que
    // una fila pendiente o rechazada no abre ninguna historia.
    PROXY_PENDING: { code: 'PROXY_PENDING', display: 'Portal proxy pending' },
    PROXY_REJECTED: {
      code: 'PROXY_REJECTED',
      display: 'Portal proxy rejected',
    },

    // Género administrativo de la persona (`persons.administrative_gender_concept_id`).
    // Valores de HL7 FHIR AdministrativeGender: es el género con el que la persona
    // consta a efectos administrativos, no su sexo biológico.
    GENDER_MALE: { code: 'GENDER_MALE', display: 'Administrative gender male' },
    GENDER_FEMALE: {
      code: 'GENDER_FEMALE',
      display: 'Administrative gender female',
    },
    GENDER_OTHER: {
      code: 'GENDER_OTHER',
      display: 'Administrative gender other',
    },
    GENDER_UNKNOWN: {
      code: 'GENDER_UNKNOWN',
      display: 'Administrative gender unknown',
    },

    // Sexo asignado al nacer (`persons.sex_at_birth_concept_id`). Se modela aparte
    // del género porque son datos clínicamente distintos: el sexo al nacer
    // condiciona rangos de referencia y tamizajes; el género, el trato y el registro.
    BIRTH_SEX_MALE: { code: 'BIRTH_SEX_MALE', display: 'Sex at birth male' },
    BIRTH_SEX_FEMALE: {
      code: 'BIRTH_SEX_FEMALE',
      display: 'Sex at birth female',
    },
    BIRTH_SEX_INTERSEX: {
      code: 'BIRTH_SEX_INTERSEX',
      display: 'Sex at birth intersex',
    },
    BIRTH_SEX_UNKNOWN: {
      code: 'BIRTH_SEX_UNKNOWN',
      display: 'Sex at birth unknown',
    },
  });

/** Códigos de género administrativo que aceptan los DTO de cara al cliente. */
export type AdministrativeGenderCode = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

/** Códigos de sexo al nacer que aceptan los DTO de cara al cliente. */
export type BirthSexCode = 'MALE' | 'FEMALE' | 'INTERSEX' | 'UNKNOWN';

/**
 * Traduce el código de género del cliente al concepto que persiste la columna.
 *
 * Los formularios públicos no conocen —ni deben conocer— los UUID del catálogo de
 * terminología: piden un código legible y el backend lo resuelve, igual que hacen
 * `TENANT_TYPE_CONCEPT_BY_CODE` o `ROLE_CONCEPT_BY_CODE`.
 */
export const ADMIN_GENDER_CONCEPT_BY_CODE: Readonly<
  Record<AdministrativeGenderCode, string>
> = {
  MALE: PROF.GENDER_MALE,
  FEMALE: PROF.GENDER_FEMALE,
  OTHER: PROF.GENDER_OTHER,
  UNKNOWN: PROF.GENDER_UNKNOWN,
};

/** Traduce el código de sexo al nacer al concepto que persiste la columna. */
export const BIRTH_SEX_CONCEPT_BY_CODE: Readonly<Record<BirthSexCode, string>> =
  {
    MALE: PROF.BIRTH_SEX_MALE,
    FEMALE: PROF.BIRTH_SEX_FEMALE,
    INTERSEX: PROF.BIRTH_SEX_INTERSEX,
    UNKNOWN: PROF.BIRTH_SEX_UNKNOWN,
  };

/**
 * El camino de vuelta de {@link BIRTH_SEX_CONCEPT_BY_CODE}: del concepto que
 * persiste la columna al código que entiende un formulario.
 *
 * Existe porque el dato ahora se **lee** además de escribirse: quien edita su
 * propio perfil tiene que recibir el mismo código que envía, y no un uuid que
 * tendría que resolver contra terminología para pintar un desplegable. Se deriva
 * del mapa de ida en vez de escribirse a mano para que no puedan discrepar.
 */
export const BIRTH_SEX_CODE_BY_CONCEPT: Readonly<Record<string, BirthSexCode>> =
  Object.fromEntries(
    Object.entries(BIRTH_SEX_CONCEPT_BY_CODE).map(([code, conceptId]) => [
      conceptId,
      code as BirthSexCode,
    ]),
  );

/** Códigos admitidos, para los validadores `@IsIn` de los DTO. */
export const ADMIN_GENDER_CODES = Object.keys(
  ADMIN_GENDER_CONCEPT_BY_CODE,
) as AdministrativeGenderCode[];

/** Códigos admitidos, para los validadores `@IsIn` de los DTO. */
export const BIRTH_SEX_CODES = Object.keys(
  BIRTH_SEX_CONCEPT_BY_CODE,
) as BirthSexCode[];
