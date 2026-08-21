import { CONCEPTS } from '../constants/concepts';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { DIR } from '../../modules/directory/directory.concepts';
import { CLIN } from '../../modules/clinical/clinical.concepts';
import { definitionPropertyCode } from '../../modules/terminology/terminology.constants';

/**
 * El catálogo en castellano: cómo se llama cada concepto y qué significa.
 *
 * ## Qué problema resuelve
 *
 * `catalog_concepts.display` guarda el rótulo del sistema de codificación, y en
 * este catálogo —igual que en SNOMED o LOINC— ese texto está en inglés:
 * «Encounter diagnosis», «Sex at birth male», «Scan infected». Y
 * `catalog_concepts.definition` está **vacía** para todo lo que siembra
 * `TerminologySeedService`: nunca se escribió.
 *
 * O sea que el glosario mostraba nombres en inglés y explicaciones en blanco. No
 * es un problema de rótulos de interfaz —esos ya estaban en castellano— sino de
 * datos: no había qué mostrar. Este archivo es ese contenido.
 *
 * ## Dónde acaba cada mitad, y por qué en sitios distintos
 *
 * - **El nombre** va a `terminology.concept_designations` como designación `ES`
 *   preferida. Es la tabla que el modelo tiene para esto: un texto por idioma,
 *   con su `language_concept_id` y su tipo (`PREFERRED`/`SYNONYM`).
 * - **La definición** va a `terminology.concept_properties` con
 *   `property_code = 'definition-es'`. `concept_designations` guarda un nombre,
 *   no una explicación: no tiene columna donde ponerla. Y
 *   `catalog_concepts.definition` es una sola columna sin idioma declarado, en
 *   un catálogo que es multilingüe por diseño — escribir castellano ahí dejaría
 *   la segunda lengua sin sitio el día que haga falta. Por eso esa columna
 *   **no se toca**.
 *
 * Las dos las materializa {@link TerminologySeedService}, con la misma regla de
 * idempotencia que el resto del seed: lo que ya existe no se pisa. Si alguien
 * editó una designación por API, el arranque siguiente no le deshace el cambio.
 *
 * ## De dónde salen las traducciones
 *
 * La terminología clínica no se improvisa, así que cada grupo declara su fuente:
 *
 * | Grupo | Fuente |
 * |---|---|
 * | Diagnósticos (`I10`, `E11.9`, …) | **CIE-10-ES**, edición española de la CIE-10 (Ministerio de Sanidad). Los `display` ya estaban en castellano; acá se añade la definición |
 * | Medicamentos (`N02BE01`, …) | **DCI/ATC** — la denominación común internacional en español de la OMS. Ya estaban en castellano |
 * | Unidades (`UNIT_mg`, …) | **UCUM**, con el nombre de la unidad en castellano |
 * | Vías de administración, severidad, lateralidad, categoría | **HL7 FHIR** (`route-codes`, `condition-severity`, `condition-category`), traducidos siguiendo el uso de la edición española de SNOMED CT |
 * | Estado y curso clínico de la condición | **HL7 FHIR** (`condition-clinical`, `condition-course`), con la misma referencia — la distinción recidiva/recaída es la de la edición española de SNOMED CT |
 * | Género, sexo al nacer | **HL7 FHIR AdministrativeGender**, con la distinción género/sexo que exige el propio modelo |
 * | Todo lo operativo (estados, roles, vínculos) | Vocabulario del propio sistema. No hay estándar externo: la traducción es de este proyecto y se escribió en lenguaje llano, que es lo que el glosario promete |
 *
 * ## Cobertura, dicha en voz alta
 *
 * Cubre los **155 conceptos que componen los 53 conjuntos de valores** de
 * `DYNAMIC_ENUM_CATALOG` — es decir, todo lo que el glosario puede llegar a
 * mostrar hoy navegando por etiquetas. El catálogo interno completo es mayor
 * (estados de auditoría, tipos de evento, cosas que ningún conjunto de valores
 * ofrece y que nadie ve en pantalla): esos quedan sin designación `ES` a
 * propósito, y la lectura los devuelve con su rótulo original marcados como no
 * traducidos, nunca en blanco. `terminology-designations.es.spec.ts` fija que la
 * cobertura de los 155 sea completa, de modo que añadir un concepto a un
 * conjunto de valores sin traducirlo rompe la prueba en vez de aparecer en
 * inglés en producción.
 *
 * El número sube cuando sube: los cinco del curso clínico y los seis del estado
 * clínico de la condición entraron con el conjunto que los ofrece, y llegaron
 * acá porque esa prueba se puso roja — que es exactamente para lo que está.
 */

/** El nombre y la explicación de un concepto en castellano. */
export interface SpanishDesignation {
  /** Cómo se llama el concepto. Es la designación `ES` preferida. */
  readonly display: string;
  /**
   * Qué significa, en lenguaje llano y sin abreviaturas.
   *
   * Va a `concept_properties` bajo `definition-es`. Es lo que lee quien abre el
   * término en el glosario, así que se escribe para alguien en consulta, no para
   * quien configura el sistema.
   */
  readonly definition: string;
}

/**
 * Código de la propiedad que guarda la definición en castellano.
 *
 * Se deriva de {@link definitionPropertyCode} en vez de escribir el literal: es
 * la misma convención que usa la lectura para encontrarla, y dos literales
 * separados fallarían en silencio —el glosario volvería a mostrarse sin
 * definiciones— el día que uno de los dos cambie.
 */
export const SPANISH_DEFINITION_PROPERTY_CODE = definitionPropertyCode('ES');

/**
 * Las traducciones, indexadas por identificador de concepto.
 *
 * Se declara como arreglo de pares y se convierte a `Map` en
 * {@link SPANISH_DESIGNATIONS} para que un identificador repetido —dos entradas
 * para el mismo concepto— sea detectable: un objeto literal lo colapsaría en
 * silencio y la traducción perdedora desaparecería sin que nadie se entere.
 */
const ENTRIES: readonly (readonly [string, SpanishDesignation])[] = [
  // --- Persona: género, sexo y estado vital -------------------------------
  // HL7 FHIR AdministrativeGender. El modelo separa género de sexo al nacer a
  // propósito y la traducción no los mezcla: son dos conjuntos distintos.
  [
    PROF.GENDER_MALE,
    {
      display: 'Masculino',
      definition:
        'Género masculino, tal como la persona consta a efectos administrativos.',
    },
  ],
  [
    PROF.GENDER_FEMALE,
    {
      display: 'Femenino',
      definition:
        'Género femenino, tal como la persona consta a efectos administrativos.',
    },
  ],
  [
    PROF.GENDER_OTHER,
    {
      display: 'Otro',
      definition:
        'La persona no se identifica como masculino ni femenino. Es un valor válido, no un dato incompleto.',
    },
  ],
  [
    PROF.GENDER_UNKNOWN,
    {
      display: 'Sin especificar',
      definition:
        'No consta el género de la persona. Distinto de «Otro»: acá el dato falta, no es que la persona haya elegido otra opción.',
    },
  ],
  [
    PROF.BIRTH_SEX_MALE,
    {
      display: 'Sexo al nacer: masculino',
      definition:
        'Sexo masculino asignado al nacer. Es un dato clínico, no administrativo: condiciona rangos de referencia de laboratorio y qué tamizajes corresponden.',
    },
  ],
  [
    PROF.BIRTH_SEX_FEMALE,
    {
      display: 'Sexo al nacer: femenino',
      definition:
        'Sexo femenino asignado al nacer. Es un dato clínico, no administrativo: condiciona rangos de referencia de laboratorio y qué tamizajes corresponden.',
    },
  ],
  [
    PROF.BIRTH_SEX_INTERSEX,
    {
      display: 'Sexo al nacer: intersexual',
      definition:
        'Características sexuales al nacer que no encajan en las definiciones típicas de masculino o femenino.',
    },
  ],
  [
    PROF.BIRTH_SEX_UNKNOWN,
    {
      display: 'Sexo al nacer: sin especificar',
      definition: 'No consta el sexo asignado al nacer.',
    },
  ],
  [
    PROF.PERSON_ACTIVE,
    {
      display: 'Persona activa',
      definition:
        'El registro de la persona está vigente y se puede usar en la atención.',
    },
  ],
  [
    PROF.PERSON_INACTIVE,
    {
      display: 'Persona inactiva',
      definition:
        'El registro sigue existiendo pero está fuera de uso. No se borra: la historia clínica asociada tiene que seguir siendo legible.',
    },
  ],
  [
    PROF.PERSON_MERGED,
    {
      display: 'Persona fusionada',
      definition:
        'El registro se unificó con otro por ser la misma persona. Se conserva para que los enlaces antiguos sigan resolviendo, y apunta al registro que quedó vigente.',
    },
  ],
  [
    PROF.VITAL_ALIVE,
    {
      display: 'Viva',
      definition: 'La persona consta viva.',
    },
  ],
  [
    PROF.VITAL_DECEASED,
    {
      display: 'Fallecida',
      definition:
        'La persona consta fallecida. Cierra los circuitos abiertos y cambia qué avisos corresponde emitir.',
    },
  ],

  // --- Persona: vinculación con el índice maestro de pacientes (MPI) ------
  [
    PROF.LINKAGE_UNLINKED,
    {
      display: 'Sin vincular al índice de pacientes',
      definition:
        'El registro todavía no se cotejó contra el índice maestro de pacientes, así que podría existir por duplicado en otra institución.',
    },
  ],
  [
    PROF.LINKAGE_LINKED,
    {
      display: 'Vinculado al índice de pacientes',
      definition:
        'El registro está cotejado contra el índice maestro de pacientes: es la misma persona en todas las instituciones que comparten el índice.',
    },
  ],
  [
    PROF.LINKAGE_MERGED,
    {
      display: 'Fusionado en el índice de pacientes',
      definition:
        'El índice maestro determinó que este registro y otro eran la misma persona, y los unificó.',
    },
  ],
  [
    PROF.IDENTITY_LINK_MPI,
    {
      display: 'Vínculo con el índice maestro de pacientes',
      definition:
        'Enlace entre el registro local y la identidad de la persona en el índice maestro de pacientes (MPI).',
    },
  ],
  [
    PROF.IDENTITY_UNVERIFIED,
    {
      display: 'Vínculo de identidad sin verificar',
      definition:
        'El enlace con la identidad externa se declaró pero nadie lo comprobó todavía.',
    },
  ],
  [
    PROF.IDENTITY_VERIFIED,
    {
      display: 'Vínculo de identidad verificado',
      definition:
        'Se comprobó que el enlace con la identidad externa corresponde efectivamente a esta persona.',
    },
  ],
  [
    PROF.MERGE_REASON_DUPLICATE,
    {
      display: 'Fusión por registro duplicado',
      definition:
        'Se unificaron dos registros porque describían a la misma persona cargada dos veces.',
    },
  ],
  [
    PROF.MERGE_APPROVED,
    {
      display: 'Fusión aprobada',
      definition: 'La unificación de los dos registros sigue en pie.',
    },
  ],
  [
    PROF.MERGE_REVERSED,
    {
      display: 'Fusión revertida',
      definition:
        'La unificación se deshizo: eran dos personas distintas. Los registros vuelven a estar separados.',
    },
  ],

  // --- Persona: acompañantes, apoderados y cuentas del portal -------------
  [
    PROF.RELATIONSHIP_GUARDIAN,
    {
      display: 'Tutor o representante legal',
      definition:
        'Persona con potestad legal para decidir por el paciente: madre, padre, tutor designado.',
    },
  ],
  [
    PROF.RELATED_ACTIVE,
    {
      display: 'Vínculo vigente',
      definition:
        'La persona de contacto sigue siendo un vínculo válido del paciente.',
    },
  ],
  [
    PROF.PROXY_ACTIVE,
    {
      display: 'Apoderado del portal vigente',
      definition:
        'Alguien puede entrar al portal en nombre del paciente y ver lo que el permiso le habilite.',
    },
  ],
  [
    PROF.PROXY_REVOKED,
    {
      display: 'Apoderado del portal revocado',
      definition:
        'Se retiró el permiso: esa persona ya no puede entrar al portal en nombre del paciente.',
    },
  ],
  [
    PROF.ACCOUNT_LINK_SELF,
    {
      display: 'Cuenta propia',
      definition:
        'La cuenta del portal pertenece a la propia persona, no a alguien que la represente.',
    },
  ],
  [
    PROF.ACCOUNT_LINK_ACTIVE,
    {
      display: 'Vínculo de cuenta vigente',
      definition:
        'La cuenta del portal está efectivamente asociada a la persona.',
    },
  ],
  [
    PROF.ACCOUNT_LINK_SUPERSEDED,
    {
      display: 'Vínculo de cuenta reemplazado',
      definition:
        'Hay un vínculo más nuevo que reemplaza a éste. Se conserva por trazabilidad, pero no es el que vale.',
    },
  ],
  [
    PROF.ACCOUNT_LINK_REVOKED,
    {
      display: 'Vínculo de cuenta revocado',
      definition:
        'Se cortó la asociación entre la cuenta y la persona: esa cuenta ya no la representa.',
    },
  ],

  // --- Profesionales: categoría, verificación y ejercicio -----------------
  [
    PROF.PRACT_CATEGORY_GENERAL,
    {
      display: 'Profesional general',
      definition:
        'Categoría por omisión de un profesional de salud, sin una clasificación más específica cargada.',
    },
  ],
  [
    PROF.PRACT_VERIF_PENDING,
    {
      display: 'Profesional pendiente de verificación',
      definition:
        'Los datos del profesional se cargaron pero todavía nadie comprobó su identidad ni su matrícula.',
    },
  ],
  [
    PROF.PRACT_VERIF_VERIFIED,
    {
      display: 'Profesional verificado',
      definition:
        'Se comprobaron la identidad y las credenciales del profesional.',
    },
  ],
  [
    PROF.PRACTICE_ONBOARDING,
    {
      display: 'Alta en curso',
      definition:
        'El profesional está completando su alta: todavía faltan datos o comprobaciones para poder ejercer en la organización.',
    },
  ],
  [
    PROF.PRACTICE_ACTIVE,
    {
      display: 'Ejercicio activo',
      definition:
        'El profesional está habilitado para atender en la organización.',
    },
  ],
  [
    PROF.CREDENTIAL_TYPE_DEGREE,
    {
      display: 'Título académico',
      definition:
        'Credencial que acredita la formación del profesional: el título expedido por la universidad.',
    },
  ],
  [
    PROF.CRED_PENDING,
    {
      display: 'Credencial pendiente de verificación',
      definition:
        'La credencial se presentó pero todavía no se comprobó contra la entidad que la emitió.',
    },
  ],
  [
    PROF.CRED_VERIFIED,
    {
      display: 'Credencial verificada',
      definition:
        'La credencial se comprobó contra la entidad que la emitió y es auténtica.',
    },
  ],
  [
    PROF.CRED_REJECTED,
    {
      display: 'Credencial rechazada',
      definition:
        'La credencial no superó la comprobación. No habilita para ejercer.',
    },
  ],
  [
    PROF.JURISDICTION_NATIONAL,
    {
      display: 'Jurisdicción nacional',
      definition:
        'La habilitación para ejercer vale en todo el país, no sólo en un departamento o municipio.',
    },
  ],
  [
    PROF.AUTH_PENDING,
    {
      display: 'Habilitación pendiente',
      definition:
        'La solicitud para ejercer en esa jurisdicción está presentada y todavía no se resolvió.',
    },
  ],
  [
    PROF.AUTH_ACTIVE,
    {
      display: 'Habilitación vigente',
      definition:
        'El profesional está autorizado a ejercer en esa jurisdicción.',
    },
  ],
  [
    PROF.AUTH_EXPIRED,
    {
      display: 'Habilitación vencida',
      definition:
        'La autorización para ejercer caducó y hay que renovarla antes de volver a atender.',
    },
  ],
  [
    PROF.SPECIALTY_ROLE_PRIMARY,
    {
      display: 'Especialidad principal',
      definition:
        'La especialidad con la que el profesional se presenta y ejerce habitualmente, cuando tiene más de una.',
    },
  ],
  [
    PROF.SPEC_VERIF_PENDING,
    {
      display: 'Especialidad pendiente de verificación',
      definition:
        'El profesional declaró la especialidad pero todavía no se comprobó el título que la respalda.',
    },
  ],
  [
    PROF.SPEC_VERIF_VERIFIED,
    {
      display: 'Especialidad verificada',
      definition:
        'Se comprobó el título de especialista que respalda la especialidad declarada.',
    },
  ],

  // --- Organizaciones: qué tipo de institución es -------------------------
  [
    CONCEPTS.TENANT_TYPE_PROVIDER,
    {
      display: 'Prestador de salud',
      definition:
        'Institución que presta atención de salud. Es el tipo genérico cuando ninguno de los más específicos encaja.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_HOSPITAL,
    {
      display: 'Hospital',
      definition:
        'Establecimiento con internación, quirófano y guardia. Se distingue del consultorio justamente por la internación.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
    {
      display: 'Consultorio médico',
      definition: 'Establecimiento de atención ambulatoria, sin internación.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_NURSING,
    {
      display: 'Centro de cuidados de enfermería',
      definition:
        'Establecimiento de cuidados prolongados de enfermería: residencia geriátrica, centro de rehabilitación.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_PHARMACY,
    {
      display: 'Farmacia',
      definition: 'Establecimiento de dispensación de medicamentos.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_UNIVERSITY,
    {
      display: 'Universidad',
      definition:
        'Institución de formación en salud. Emite los títulos que después se verifican como credenciales.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_PAYER,
    {
      display: 'Aseguradora',
      definition:
        'Quien financia la atención: seguro de salud, obra social, prepaga.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_BROKER,
    {
      display: 'Corredor de seguros',
      definition:
        'Intermediario entre la aseguradora y el asegurado. No presta atención de salud.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_HEALTH_BUSINESS,
    {
      display: 'Empresa del rubro salud',
      definition:
        'Empresa que opera en salud sin ser prestador: proveedores, laboratorios de la industria, servicios.',
    },
  ],
  [
    CONCEPTS.TENANT_TYPE_HEALTH_OTHER,
    {
      display: 'Otra institución de salud',
      definition:
        'Institución de salud que no encaja en ninguno de los tipos anteriores.',
    },
  ],

  // --- Organizaciones: estado, verificación y membresías ------------------
  [
    DIR.TENANT_PENDING,
    {
      display: 'Organización pendiente de verificación',
      definition:
        'La organización se registró y espera que se comprueben sus datos legales.',
    },
  ],
  [
    CONCEPTS.TENANT_ACTIVE,
    {
      display: 'Organización activa',
      definition: 'La organización opera con normalidad.',
    },
  ],
  [
    DIR.TENANT_SUSPENDED,
    {
      display: 'Organización suspendida',
      definition:
        'La organización está temporalmente fuera de servicio. Sus datos se conservan.',
    },
  ],
  [
    DIR.TENANT_UNVERIFIED,
    {
      display: 'Organización sin verificar',
      definition:
        'No se comprobó la existencia legal de la organización ni quién la representa.',
    },
  ],
  [
    CONCEPTS.TENANT_VERIFIED,
    {
      display: 'Organización verificada',
      definition:
        'Se comprobaron la existencia legal de la organización y quién la representa.',
    },
  ],
  [
    DIR.MEMBERSHIP_INVITED,
    {
      display: 'Invitación enviada',
      definition:
        'Se invitó a la persona a formar parte de la organización y todavía no aceptó.',
    },
  ],
  [
    DIR.MEMBERSHIP_ACTIVE,
    {
      display: 'Miembro activo',
      definition:
        'La persona forma parte de la organización y puede trabajar en ella.',
    },
  ],
  [
    DIR.MEMBERSHIP_SUSPENDED,
    {
      display: 'Miembro suspendido',
      definition:
        'La persona sigue figurando en la organización pero no puede operar mientras dure la suspensión.',
    },
  ],
  [
    DIR.MEMBERSHIP_ENDED,
    {
      display: 'Membresía terminada',
      definition:
        'La persona dejó la organización. Lo que registró mientras era miembro se conserva.',
    },
  ],
  [
    DIR.ROLE_OWNER,
    {
      display: 'Titular de la organización',
      definition:
        'Quien responde por la organización. Es el único rol que puede transferir la titularidad.',
    },
  ],
  [
    DIR.ROLE_ADMIN,
    {
      display: 'Administrador de la organización',
      definition:
        'Gestiona la organización: da de alta personas, sucursales y configuración. No es el titular.',
    },
  ],
  [
    DIR.ROLE_STAFF,
    {
      display: 'Personal de la organización',
      definition:
        'Trabaja en la organización sin atribuciones de administración.',
    },
  ],
  [
    DIR.SCOPE_ALL_TENANT,
    {
      display: 'Alcance: toda la organización',
      definition:
        'La persona opera en todas las sucursales de la organización, no en una sola.',
    },
  ],
  [
    DIR.SCOPE_BRANCH,
    {
      display: 'Alcance: una sucursal',
      definition:
        'La persona opera únicamente en las sucursales que tenga asignadas.',
    },
  ],
  [
    DIR.BRANCH_TYPE_CLINIC,
    {
      display: 'Sucursal asistencial',
      definition: 'Sede donde se atiende pacientes.',
    },
  ],
  [
    DIR.BRANCH_TYPE_OFFICE,
    {
      display: 'Sucursal administrativa',
      definition:
        'Sede sin atención de pacientes: administración, facturación, depósito.',
    },
  ],
  [
    DIR.BRANCH_ACTIVE,
    {
      display: 'Sucursal activa',
      definition: 'La sucursal está abierta y operando.',
    },
  ],
  [
    DIR.BRANCH_SUSPENDED,
    {
      display: 'Sucursal suspendida',
      definition:
        'La sucursal está temporalmente cerrada. No se puede agendar ni atender en ella.',
    },
  ],
  [
    DIR.BRANCH_MEMBERSHIP_ACTIVE,
    {
      display: 'Asignación a sucursal vigente',
      definition:
        'La persona está asignada a esa sucursal y puede trabajar ahí.',
    },
  ],
  [
    DIR.BRANCH_MEMBERSHIP_ENDED,
    {
      display: 'Asignación a sucursal terminada',
      definition: 'La persona ya no trabaja en esa sucursal.',
    },
  ],
  [
    DIR.LOCAL_ROLE_STAFF,
    {
      display: 'Personal de la sucursal',
      definition:
        'Rol que la persona cumple dentro de una sucursal concreta, que puede ser distinto del que tiene en la organización.',
    },
  ],

  // --- Cuenta y acceso ----------------------------------------------------
  [
    CONCEPTS.USER_ACTIVE,
    {
      display: 'Cuenta activa',
      definition: 'La cuenta puede iniciar sesión y operar con normalidad.',
    },
  ],
  [
    CONCEPTS.USER_LOCKED,
    {
      display: 'Cuenta bloqueada',
      definition:
        'La cuenta existe pero no puede iniciar sesión: se bloqueó por seguridad o por decisión administrativa.',
    },
  ],
  [
    CONCEPTS.USER_ANONYMIZED,
    {
      display: 'Cuenta anonimizada',
      definition:
        'Se borraron los datos personales de la cuenta a pedido de la persona. La fila se conserva para que la historia clínica siga siendo consistente, sin nada que identifique a nadie.',
    },
  ],
  [
    CONCEPTS.MFA_DISABLED,
    {
      display: 'Segundo factor desactivado',
      definition:
        'La cuenta entra sólo con contraseña, sin pedir un segundo factor de autenticación.',
    },
  ],
  [
    CONCEPTS.MFA_ENABLED,
    {
      display: 'Segundo factor activado',
      definition:
        'Además de la contraseña, la cuenta pide un segundo factor para entrar.',
    },
  ],
  [
    CONCEPTS.MFA_TOTP,
    {
      display: 'Código temporal (TOTP)',
      definition:
        'Segundo factor por código de seis dígitos que cambia cada treinta segundos, generado por una aplicación de autenticación en el teléfono.',
    },
  ],
  [
    CONCEPTS.MFA_WEBAUTHN,
    {
      display: 'Llave de seguridad (WebAuthn)',
      definition:
        'Segundo factor por llave física o biometría del dispositivo, sin código que teclear.',
    },
  ],
  [
    CONCEPTS.STATE_PENDING,
    {
      display: 'Pendiente',
      definition:
        'Falta una comprobación o una decisión para que quede resuelto.',
    },
  ],
  [
    CONCEPTS.STATE_VERIFIED,
    {
      display: 'Verificado',
      definition: 'Se comprobó y es válido.',
    },
  ],
  [
    CONCEPTS.STATE_REVOKED,
    {
      display: 'Revocado',
      definition: 'Se retiró la validez que tenía. Ya no sirve.',
    },
  ],
  [
    CONCEPTS.CONTACT_EMAIL,
    {
      display: 'Correo electrónico',
      definition: 'Dirección de correo electrónico de contacto.',
    },
  ],
  [
    CONCEPTS.CONTACT_PHONE,
    {
      display: 'Teléfono',
      definition: 'Número de teléfono de contacto.',
    },
  ],
  [
    CONCEPTS.CONTACT_USE_HOME,
    {
      display: 'Contacto particular',
      definition: 'Dato de contacto personal, no laboral.',
    },
  ],
  [
    CONCEPTS.CONTACT_USE_WORK,
    {
      display: 'Contacto laboral',
      definition: 'Dato de contacto del trabajo.',
    },
  ],
  [
    CONCEPTS.ADDR_USE_HOME,
    {
      display: 'Domicilio particular',
      definition: 'Dirección donde vive la persona.',
    },
  ],
  [
    CONCEPTS.ADDR_TYPE_POSTAL,
    {
      display: 'Dirección postal',
      definition:
        'Dirección a la que se envía correspondencia, que puede no ser donde la persona vive.',
    },
  ],
  [
    CONCEPTS.FILE_CATEGORY_DOCUMENT,
    {
      display: 'Documento',
      definition:
        'Archivo de texto o formulario adjunto: un informe, un consentimiento, un certificado.',
    },
  ],
  [
    CONCEPTS.FILE_CATEGORY_IMAGE,
    {
      display: 'Imagen',
      definition:
        'Archivo de imagen adjunto: una fotografía clínica, un estudio de imagenología, la foto de un documento.',
    },
  ],
  [
    CONCEPTS.FILE_ACTIVE,
    {
      display: 'Archivo vigente',
      definition: 'El archivo está disponible y se puede abrir.',
    },
  ],
  [
    CONCEPTS.FILE_DELETED,
    {
      display: 'Archivo eliminado',
      definition:
        'El archivo se marcó como borrado y no se muestra. No se destruye de inmediato: la trazabilidad de quién lo subió y cuándo tiene que sobrevivir al borrado.',
    },
  ],
  [
    CONCEPTS.SCAN_PENDING,
    {
      display: 'Análisis antivirus pendiente',
      definition:
        'El archivo se subió y todavía no se analizó. Hasta que el análisis termine no se puede descargar.',
    },
  ],
  [
    CONCEPTS.SCAN_CLEAN,
    {
      display: 'Análisis antivirus limpio',
      definition: 'El archivo se analizó y no contiene código malicioso.',
    },
  ],
  [
    CONCEPTS.SCAN_INFECTED,
    {
      display: 'Archivo infectado',
      definition:
        'El análisis encontró código malicioso en el archivo. Queda bloqueado y no se puede descargar.',
    },
  ],

  // --- Medicamentos (DCI/ATC; los nombres ya estaban en castellano) -------
  [
    CLIN.MEDICATION_PARACETAMOL,
    {
      display: 'Paracetamol',
      definition:
        'Analgésico y antipirético: baja la fiebre y calma el dolor leve o moderado. No es antiinflamatorio.',
    },
  ],
  [
    CLIN.MEDICATION_IBUPROFENO,
    {
      display: 'Ibuprofeno',
      definition:
        'Antiinflamatorio no esteroideo: calma el dolor, baja la fiebre y desinflama.',
    },
  ],
  [
    CLIN.MEDICATION_AMOXICILINA,
    {
      display: 'Amoxicilina',
      definition:
        'Antibiótico del grupo de las penicilinas, de amplio espectro. Se usa en infecciones respiratorias, urinarias y dentales.',
    },
  ],
  [
    CLIN.MEDICATION_AZITROMICINA,
    {
      display: 'Azitromicina',
      definition:
        'Antibiótico macrólido. Alternativa habitual en personas alérgicas a la penicilina.',
    },
  ],
  [
    CLIN.MEDICATION_CEFALEXINA,
    {
      display: 'Cefalexina',
      definition:
        'Antibiótico cefalosporínico de primera generación, frecuente en infecciones de piel y de vías urinarias.',
    },
  ],
  [
    CLIN.MEDICATION_OMEPRAZOL,
    {
      display: 'Omeprazol',
      definition:
        'Inhibidor de la bomba de protones: reduce la acidez del estómago. Se usa en gastritis, reflujo y úlcera.',
    },
  ],
  [
    CLIN.MEDICATION_METFORMINA,
    {
      display: 'Metformina',
      definition:
        'Antidiabético oral. Es el tratamiento inicial habitual de la diabetes tipo 2.',
    },
  ],
  [
    CLIN.MEDICATION_LOSARTAN,
    {
      display: 'Losartán',
      definition:
        'Antihipertensivo que bloquea el receptor de la angiotensina II. Baja la presión arterial.',
    },
  ],
  [
    CLIN.MEDICATION_ENALAPRIL,
    {
      display: 'Enalapril',
      definition:
        'Antihipertensivo inhibidor de la enzima convertidora de angiotensina (IECA). Baja la presión arterial.',
    },
  ],
  [
    CLIN.MEDICATION_ATORVASTATINA,
    {
      display: 'Atorvastatina',
      definition:
        'Estatina: baja el colesterol y reduce el riesgo cardiovascular.',
    },
  ],
  [
    CLIN.MEDICATION_SALBUTAMOL,
    {
      display: 'Salbutamol',
      definition:
        'Broncodilatador de acción rápida. Abre la vía aérea en la crisis de asma.',
    },
  ],
  [
    CLIN.MEDICATION_LORATADINA,
    {
      display: 'Loratadina',
      definition:
        'Antihistamínico que no da sueño. Se usa en alergias y rinitis alérgica.',
    },
  ],

  // --- Vías de administración (HL7 FHIR route-codes) ----------------------
  [
    CLIN.MEDICATION_ROUTE_ORAL,
    {
      display: 'Vía oral',
      definition: 'Se toma por la boca y se traga.',
    },
  ],
  [
    CLIN.MEDICATION_ROUTE_INTRAVENOUS,
    {
      display: 'Vía intravenosa',
      definition:
        'Se administra directamente en una vena. Es la vía de efecto más rápido.',
    },
  ],
  [
    CLIN.MEDICATION_ROUTE_INTRAMUSCULAR,
    {
      display: 'Vía intramuscular',
      definition: 'Se inyecta dentro de un músculo.',
    },
  ],
  [
    CLIN.MEDICATION_ROUTE_SUBCUTANEOUS,
    {
      display: 'Vía subcutánea',
      definition:
        'Se inyecta en el tejido que está justo debajo de la piel. Es la vía habitual de la insulina.',
    },
  ],
  [
    CLIN.MEDICATION_ROUTE_TOPICAL,
    {
      display: 'Vía tópica',
      definition:
        'Se aplica sobre la piel o la mucosa, para que actúe en ese mismo lugar.',
    },
  ],
  [
    CLIN.MEDICATION_ROUTE_INHALATION,
    {
      display: 'Vía inhalatoria',
      definition:
        'Se respira para que llegue a los pulmones. Es la vía del aerosol y del nebulizador.',
    },
  ],

  // --- Unidades de medida (UCUM) ------------------------------------------
  [
    CLIN.MEDICATION_UNIT_MILLIGRAM,
    {
      display: 'Miligramo (mg)',
      definition: 'La milésima parte de un gramo.',
    },
  ],
  [
    CLIN.MEDICATION_UNIT_GRAM,
    {
      display: 'Gramo (g)',
      definition: 'Unidad de masa. Equivale a mil miligramos.',
    },
  ],
  [
    CLIN.MEDICATION_UNIT_MILLILITRE,
    {
      display: 'Mililitro (mL)',
      definition:
        'La milésima parte de un litro. Es la unidad de los jarabes y las ampollas.',
    },
  ],
  [
    CLIN.MEDICATION_UNIT_TABLET,
    {
      display: 'Comprimido',
      definition: 'Una unidad de la presentación sólida del medicamento.',
    },
  ],
  [
    CLIN.MEDICATION_UNIT_CAPSULE,
    {
      display: 'Cápsula',
      definition:
        'Una unidad de la presentación en cápsula, con el principio activo dentro de una envoltura soluble.',
    },
  ],
  [
    CLIN.MEDICATION_UNIT_DROP,
    {
      display: 'Gota',
      definition:
        'Una gota de la presentación líquida. El volumen depende del gotero, así que sólo se usa con el envase que lo indica.',
    },
  ],

  // --- Diagnósticos (CIE-10-ES; los nombres ya estaban en castellano) -----
  [
    CLIN.CONDITION_HIPERTENSION,
    {
      display: 'Hipertensión esencial',
      definition:
        'Presión arterial persistentemente alta sin una causa identificable detrás. Es la forma más frecuente de hipertensión. CIE-10: I10.',
    },
  ],
  [
    CLIN.CONDITION_DIABETES_TIPO_2,
    {
      display: 'Diabetes mellitus tipo 2',
      definition:
        'El cuerpo produce insulina pero no la aprovecha bien, y el azúcar en sangre queda alto. CIE-10: E11.9.',
    },
  ],
  [
    CLIN.CONDITION_IRA_ALTA,
    {
      display: 'Infección aguda de las vías respiratorias superiores',
      definition:
        'Infección de nariz, garganta o senos paranasales, casi siempre viral y de resolución espontánea. CIE-10: J06.9.',
    },
  ],
  [
    CLIN.CONDITION_LUMBALGIA,
    {
      display: 'Lumbalgia',
      definition: 'Dolor en la parte baja de la espalda. CIE-10: M54.5.',
    },
  ],
  [
    CLIN.CONDITION_MIGRANA,
    {
      display: 'Migraña',
      definition:
        'Dolor de cabeza intenso y recurrente, habitualmente de un solo lado, que suele empeorar con la luz y el ruido. CIE-10: G43.9.',
    },
  ],
  [
    CLIN.CONDITION_GASTRITIS,
    {
      display: 'Gastritis',
      definition:
        'Inflamación de la mucosa que recubre el estómago. CIE-10: K29.7.',
    },
  ],
  [
    CLIN.CONDITION_ASMA,
    {
      display: 'Asma',
      definition:
        'Enfermedad crónica en la que la vía aérea se inflama y se estrecha por episodios, con falta de aire y silbidos al respirar. CIE-10: J45.9.',
    },
  ],
  [
    CLIN.CONDITION_ANEMIA_FERROPENICA,
    {
      display: 'Anemia ferropénica',
      definition:
        'Anemia por falta de hierro: no alcanza para fabricar la hemoglobina que transporta el oxígeno. CIE-10: D50.9.',
    },
  ],
  [
    CLIN.CONDITION_INFECCION_URINARIA,
    {
      display: 'Infección de las vías urinarias',
      definition:
        'Infección de la vejiga o de las vías urinarias, con ardor al orinar y necesidad frecuente de hacerlo. CIE-10: N39.0.',
    },
  ],
  [
    CLIN.CONDITION_DERMATITIS_ATOPICA,
    {
      display: 'Dermatitis atópica',
      definition:
        'Enfermedad crónica de la piel, con brotes de picazón, sequedad y enrojecimiento. CIE-10: L20.9.',
    },
  ],
  [
    CLIN.CONDITION_HIPOTIROIDISMO,
    {
      display: 'Hipotiroidismo',
      definition:
        'La glándula tiroides produce menos hormona de la necesaria, y todo el metabolismo se enlentece. CIE-10: E03.9.',
    },
  ],
  [
    CLIN.CONDITION_ANSIEDAD_GENERALIZADA,
    {
      display: 'Trastorno de ansiedad generalizada',
      definition:
        'Preocupación excesiva y persistente, difícil de controlar, que interfiere con la vida diaria. CIE-10: F41.1.',
    },
  ],

  // --- Cómo se registra un diagnóstico (HL7 FHIR) -------------------------
  [
    CLIN.CONDITION_CATEGORY_DIAGNOSIS,
    {
      display: 'Diagnóstico de la consulta',
      definition:
        'Lo que se diagnosticó en esta consulta concreta. Es un hecho de ese encuentro, no necesariamente algo que la persona arrastre.',
    },
  ],
  [
    CLIN.CONDITION_CATEGORY_PROBLEM,
    {
      display: 'Problema de la lista',
      definition:
        'Condición que la persona arrastra y que hay que tener presente en cualquier consulta, no sólo en la que se registró.',
    },
  ],
  [
    CLIN.CONDITION_SEVERITY_MILD,
    {
      display: 'Leve',
      definition: 'Molesta pero no limita la vida diaria de la persona.',
    },
  ],
  [
    CLIN.CONDITION_SEVERITY_MODERATE,
    {
      display: 'Moderada',
      definition: 'Limita algunas actividades de la vida diaria.',
    },
  ],
  [
    CLIN.CONDITION_SEVERITY_SEVERE,
    {
      display: 'Grave',
      definition: 'Impide la vida diaria normal o pone en riesgo a la persona.',
    },
  ],
  [
    CLIN.CONDITION_LATERALITY_LEFT,
    {
      display: 'Izquierdo',
      definition: 'Afecta el lado izquierdo del cuerpo.',
    },
  ],
  [
    CLIN.CONDITION_LATERALITY_RIGHT,
    {
      display: 'Derecho',
      definition: 'Afecta el lado derecho del cuerpo.',
    },
  ],
  [
    CLIN.CONDITION_LATERALITY_BILATERAL,
    {
      display: 'Bilateral',
      definition: 'Afecta los dos lados del cuerpo.',
    },
  ],
  // --- Estado clínico de la condición (HL7 condition-clinical) ---
  //
  // Los seis del ciclo de vida. «Recidiva» y «recaída» son distintas y en el
  // uso corriente se confunden, así que la definición las separa en vez de
  // dejarlo al nombre: la primera vuelve después de estar resuelta, la segunda
  // vuelve después de haber mejorado sin llegar a resolverse.
  [
    CLIN.CONDITION_ACTIVE,
    {
      display: 'Activa',
      definition: 'La condición está presente ahora y da síntomas o signos.',
    },
  ],
  [
    CLIN.CONDITION_RECURRENCE,
    {
      display: 'Recidiva',
      definition:
        'Volvió a aparecer después de haberse dado por resuelta. Es un episodio nuevo de algo que ya había terminado.',
    },
  ],
  [
    CLIN.CONDITION_RELAPSE,
    {
      display: 'Recaída',
      definition:
        'Volvió a empeorar después de haber mejorado, sin que se hubiera llegado a resolver. Es el mismo episodio, que retrocede.',
    },
  ],
  [
    CLIN.CONDITION_INACTIVE,
    {
      display: 'Inactiva',
      definition:
        'Ya no da síntomas, pero tampoco se declara resuelta: sigue en la historia porque puede volver.',
    },
  ],
  [
    CLIN.CONDITION_REMISSION,
    {
      display: 'En remisión',
      definition:
        'Los síntomas cedieron y el seguimiento continúa. No es alta: se sigue controlando por si reaparece.',
    },
  ],
  [
    CLIN.CONDITION_RESOLVED,
    {
      display: 'Resuelta',
      definition:
        'Terminó y no se espera que vuelva. Queda registrada como antecedente.',
    },
  ],
  // --- Curso clínico de la condición ---
  //
  // Eje distinto del estado: una condición crónica puede estar activa o en
  // remisión, y una aguda puede estar resuelta. El corte agudo/subagudo/crónico
  // es de duración, no de gravedad.
  [
    CLIN.CONDITION_COURSE_ACUTE,
    {
      display: 'Aguda',
      definition:
        'Aparece de golpe y dura poco, con una resolución esperable en días o semanas.',
    },
  ],
  [
    CLIN.CONDITION_COURSE_CHRONIC,
    {
      display: 'Crónica',
      definition:
        'Dura en el tiempo y no se espera que se resuelva. Se convive con ella y se controla.',
    },
  ],
  [
    CLIN.CONDITION_COURSE_SUBACUTE,
    {
      display: 'Subaguda',
      definition:
        'Entre las dos: ni el arranque brusco de la aguda ni la permanencia de la crónica. Semanas o pocos meses.',
    },
  ],
  [
    CLIN.CONDITION_COURSE_RECURRENT,
    {
      display: 'Recurrente',
      definition:
        'Va y viene en episodios separados, con períodos sin síntomas entre uno y otro.',
    },
  ],
  [
    CLIN.CONDITION_COURSE_UNKNOWN,
    {
      display: 'Curso desconocido',
      definition:
        'Todavía no hay datos para decir si es aguda o crónica. Se deja dicho en vez de suponerlo.',
    },
  ],
];

/**
 * Las traducciones listas para consultar por identificador de concepto.
 *
 * Se construye una sola vez al cargar el módulo: la consume el seed en cada
 * arranque y la prueba de cobertura.
 */
export const SPANISH_DESIGNATIONS: ReadonlyMap<string, SpanishDesignation> =
  new Map(ENTRIES);

/**
 * Cuántas traducciones se declararon, contando las entradas y no las claves del
 * mapa.
 *
 * La diferencia entre los dos números es justamente lo que delataría un
 * identificador repetido, y por eso el conteo se expone: la prueba compara
 * `ENTRIES.length` con `SPANISH_DESIGNATIONS.size` y falla si no coinciden.
 */
export const SPANISH_DESIGNATION_ENTRY_COUNT = ENTRIES.length;
