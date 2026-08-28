import { CONCEPTS } from '../constants/concepts';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { DIR } from '../../modules/directory/directory.concepts';
import { CHART } from '../../modules/chart/chart.concepts';
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
 * Cubre los **162 conceptos que componen los 63 conjuntos de valores** de
 * `DYNAMIC_ENUM_CATALOG` — es decir, todo lo que el glosario puede llegar a
 * mostrar hoy navegando por etiquetas. El catálogo interno completo es mayor
 * (estados de auditoría, tipos de evento, cosas que ningún conjunto de valores
 * ofrece y que nadie ve en pantalla): esos quedan sin designación `ES` a
 * propósito, y la lectura los devuelve con su rótulo original marcados como no
 * traducidos, nunca en blanco. `terminology-designations.es.spec.ts` fija que la
 * cobertura sea completa, de modo que añadir un concepto a un
 * conjunto de valores sin traducirlo rompe la prueba en vez de aparecer en
 * inglés en producción.
 *
 * El número sube cuando sube: los cinco del curso clínico y los seis del estado
 * clínico de la condición entraron con el conjunto que los ofrece, y llegaron
 * acá porque esa prueba se puso roja — que es exactamente para lo que está. Los
 * siete de v4.1.9 (los cinco estados del vínculo profesional–institución y los
 * dos peldaños intermedios de la escalera de verificación) entraron igual.
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
      display: 'Título universitario',
      definition:
        'El título de grado expedido por la universidad. Un profesional puede tener más de uno: el registro contempla a quien cursó dos carreras.',
    },
  ],
  [
    PROF.CREDENTIAL_TYPE_DIPLOMA,
    {
      display: 'Diplomado',
      definition:
        'Curso de posgrado corto. Se cargan tantos como haya cursado el profesional.',
    },
  ],
  [
    PROF.CREDENTIAL_TYPE_MASTER,
    {
      display: 'Maestría',
      definition:
        'Título de maestría. Se cargan tantos como haya obtenido el profesional.',
    },
  ],
  [
    PROF.CREDENTIAL_TYPE_DOCTORATE,
    {
      display: 'Doctorado',
      definition:
        'Título de doctorado. Se cargan tantos como haya obtenido el profesional.',
    },
  ],
  [
    PROF.CREDENTIAL_TYPE_SPECIALTY,
    {
      display: 'Título de especialidad',
      definition:
        'El diploma que respalda una especialidad. No es la especialidad que ejerce —eso lo declara practitioner_specialties— sino el documento que la acredita.',
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
    PROF.JURISDICTION_SEDES_SANTA_CRUZ,
    {
      display: 'SEDES — Santa Cruz',
      definition:
        'Registro ante el Servicio Departamental de Salud de la Gobernación de Santa Cruz. ' +
        'Es una habilitación departamental que se suma a la nacional, no la reemplaza.',
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

  // --- Profesionales: vínculo con la institución --------------------------
  [
    PROF.AFFILIATION_PENDING,
    {
      display: 'Vínculo pendiente de aprobación',
      definition:
        'El profesional declaró que atiende ahí y alguien de la organización todavía tiene que confirmarlo.',
    },
  ],
  [
    PROF.AFFILIATION_DECLARED,
    {
      display: 'Vínculo declarado por el profesional',
      definition:
        'Lo declaró el profesional y no hay nadie en la organización que pueda confirmarlo. Se muestra siempre con esa aclaración: no lleva el sello de la institución.',
    },
  ],
  [
    PROF.AFFILIATION_APPROVED,
    {
      display: 'Vínculo aprobado',
      definition:
        'Alguien que administra la organización confirmó que el profesional atiende ahí.',
    },
  ],
  [
    PROF.AFFILIATION_REJECTED,
    {
      display: 'Vínculo rechazado',
      definition:
        'La organización no confirmó el vínculo. Si escribió el motivo, el profesional lo lee.',
    },
  ],
  [
    PROF.AFFILIATION_REVOKED,
    {
      display: 'Vínculo revocado',
      definition:
        'El vínculo estuvo aprobado y la organización lo retiró después. Deja de valer para atender ahí; las citas ya confirmadas no se cancelan solas.',
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
    DIR.TENANT_REGISTRY_LISTED,
    {
      display: 'Organización del padrón oficial',
      definition:
        'Figura en el padrón oficial de establecimientos de salud, así que existe de hecho, pero todavía nadie la administra en la plataforma.',
    },
  ],
  [
    DIR.TENANT_CLAIMED,
    {
      display: 'Organización reclamada',
      definition:
        'Alguien real la administra y está reuniendo la documentación para que se la verifique.',
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
    DIR.ROLE_PRACTITIONER,
    {
      display: 'Profesional vinculado',
      definition:
        'Profesional de salud cuyo vínculo fue aprobado por la organización. Atiende y publica su agenda en ella; no administra personas, sucursales ni configuración.',
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
    CONCEPTS.ADDR_USE_WORK,
    {
      display: 'Domicilio laboral',
      definition: 'Dirección donde la persona trabaja.',
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

  // --- Vademécum esencial (DCI/ATC; nombre y definición en castellano) -----
  [
    CLIN.MEDICATION_ACIDO_ACETILSALICILICO,
    {
      display: 'Ácido acetilsalicílico',
      definition:
        'Calma el dolor, baja la fiebre y, en dosis baja, hace la sangre menos espesa para prevenir infartos.',
    },
  ],
  [
    CLIN.MEDICATION_DICLOFENACO,
    {
      display: 'Diclofenaco',
      definition:
        'Antiinflamatorio potente para dolor de articulaciones, golpes y cólicos. Irrita el estómago.',
    },
  ],
  [
    CLIN.MEDICATION_NAPROXENO,
    {
      display: 'Naproxeno',
      definition:
        'Antiinflamatorio de efecto prolongado: sirve para dolores que duran todo el día.',
    },
  ],
  [
    CLIN.MEDICATION_TRAMADOL,
    {
      display: 'Tramadol',
      definition:
        'Analgésico fuerte para dolor moderado o intenso que no cede con los comunes.',
    },
  ],
  [
    CLIN.MEDICATION_MORFINA,
    {
      display: 'Morfina',
      definition:
        'Analgésico opioide para dolor intenso, como el del cáncer o el postoperatorio.',
    },
  ],
  [
    CLIN.MEDICATION_AMOXICILINA_CLAVULANICO,
    {
      display: 'Amoxicilina con ácido clavulánico',
      definition:
        'Antibiótico de amplio espectro. El clavulánico vence a bacterias que resisten la amoxicilina sola.',
    },
  ],
  [
    CLIN.MEDICATION_BENCILPENICILINA,
    {
      display: 'Bencilpenicilina',
      definition:
        'Penicilina inyectable, la de siempre para infecciones por estreptococo y sífilis.',
    },
  ],
  [
    CLIN.MEDICATION_CEFTRIAXONA,
    {
      display: 'Ceftriaxona',
      definition:
        'Antibiótico inyectable de amplio espectro para infecciones graves.',
    },
  ],
  [
    CLIN.MEDICATION_CLARITROMICINA,
    {
      display: 'Claritromicina',
      definition:
        'Antibiótico para infecciones respiratorias y para erradicar el Helicobacter pylori.',
    },
  ],
  [
    CLIN.MEDICATION_CIPROFLOXACINO,
    {
      display: 'Ciprofloxacino',
      definition: 'Antibiótico para infecciones urinarias e intestinales.',
    },
  ],
  [
    CLIN.MEDICATION_COTRIMOXAZOL,
    {
      display: 'Sulfametoxazol con trimetoprima',
      definition:
        'Antibiótico combinado para infecciones urinarias y respiratorias. También previene neumonías en personas inmunodeprimidas.',
    },
  ],
  [
    CLIN.MEDICATION_DOXICICLINA,
    {
      display: 'Doxiciclina',
      definition:
        'Antibiótico para infecciones respiratorias, de piel y transmitidas por garrapatas.',
    },
  ],
  [
    CLIN.MEDICATION_GENTAMICINA,
    {
      display: 'Gentamicina',
      definition:
        'Antibiótico inyectable para infecciones graves. Exige vigilar el riñón y el oído.',
    },
  ],
  [
    CLIN.MEDICATION_METRONIDAZOL,
    {
      display: 'Metronidazol',
      definition:
        'Trata infecciones por bacterias sin oxígeno y parásitos como la amebiasis y la giardiasis.',
    },
  ],
  [
    CLIN.MEDICATION_NITROFURANTOINA,
    {
      display: 'Nitrofurantoína',
      definition:
        'Antibiótico que se concentra en la orina: es de elección en la cistitis.',
    },
  ],
  [
    CLIN.MEDICATION_FLUCONAZOL,
    {
      display: 'Fluconazol',
      definition:
        'Antifúngico para candidiasis, tanto vaginal como de boca o esófago.',
    },
  ],
  [
    CLIN.MEDICATION_ALBENDAZOL,
    {
      display: 'Albendazol',
      definition: 'Antiparasitario de dosis única para lombrices intestinales.',
    },
  ],
  [
    CLIN.MEDICATION_MEBENDAZOL,
    {
      display: 'Mebendazol',
      definition:
        'Antiparasitario para oxiuros y otras lombrices intestinales.',
    },
  ],
  [
    CLIN.MEDICATION_AMLODIPINO,
    {
      display: 'Amlodipino',
      definition:
        'Baja la presión relajando las arterias. Puede hinchar los tobillos.',
    },
  ],
  [
    CLIN.MEDICATION_ATENOLOL,
    {
      display: 'Atenolol',
      definition: 'Betabloqueante: baja la presión y enlentece el pulso.',
    },
  ],
  [
    CLIN.MEDICATION_BISOPROLOL,
    {
      display: 'Bisoprolol',
      definition: 'Betabloqueante para hipertensión e insuficiencia cardíaca.',
    },
  ],
  [
    CLIN.MEDICATION_FUROSEMIDA,
    {
      display: 'Furosemida',
      definition:
        'Diurético potente: saca líquido cuando hay hinchazón o el corazón falla.',
    },
  ],
  [
    CLIN.MEDICATION_HIDROCLOROTIAZIDA,
    {
      display: 'Hidroclorotiazida',
      definition:
        'Diurético suave, de los primeros para tratar la presión alta.',
    },
  ],
  [
    CLIN.MEDICATION_ESPIRONOLACTONA,
    {
      display: 'Espironolactona',
      definition:
        'Diurético que conserva el potasio. Se usa en insuficiencia cardíaca y cirrosis.',
    },
  ],
  [
    CLIN.MEDICATION_SIMVASTATINA,
    {
      display: 'Simvastatina',
      definition: 'Baja el colesterol para prevenir infartos y derrames.',
    },
  ],
  [
    CLIN.MEDICATION_DIGOXINA,
    {
      display: 'Digoxina',
      definition:
        'Fortalece el latido y controla el pulso en la fibrilación auricular.',
    },
  ],
  [
    CLIN.MEDICATION_WARFARINA,
    {
      display: 'Warfarina',
      definition:
        'Anticoagulante oral: evita trombos. Exige control periódico de la sangre.',
    },
  ],
  [
    CLIN.MEDICATION_INSULINA_NPH,
    {
      display: 'Insulina isófana (NPH)',
      definition:
        'Insulina de acción intermedia: cubre la glucemia durante varias horas.',
    },
  ],
  [
    CLIN.MEDICATION_INSULINA_RAPIDA,
    {
      display: 'Insulina humana rápida',
      definition:
        'Insulina de acción corta, para acompañar las comidas o corregir una subida.',
    },
  ],
  [
    CLIN.MEDICATION_GLIBENCLAMIDA,
    {
      display: 'Glibenclamida',
      definition:
        'Pastilla para la diabetes tipo 2: hace que el páncreas suelte más insulina.',
    },
  ],
  [
    CLIN.MEDICATION_LEVOTIROXINA,
    {
      display: 'Levotiroxina',
      definition:
        'Reemplaza la hormona tiroidea cuando la tiroides trabaja de menos.',
    },
  ],
  [
    CLIN.MEDICATION_PREDNISONA,
    {
      display: 'Prednisona',
      definition:
        'Corticoide oral: desinflama con fuerza en asma, alergias y enfermedades autoinmunes.',
    },
  ],
  [
    CLIN.MEDICATION_DEXAMETASONA,
    {
      display: 'Dexametasona',
      definition: 'Corticoide potente y prolongado, para inflamación grave.',
    },
  ],
  [
    CLIN.MEDICATION_METOCLOPRAMIDA,
    {
      display: 'Metoclopramida',
      definition:
        'Corta las náuseas y los vómitos, y ayuda a que el estómago se vacíe.',
    },
  ],
  [
    CLIN.MEDICATION_SALES_REHIDRATACION,
    {
      display: 'Sales de rehidratación oral',
      definition:
        'Repone agua y sales en la diarrea. Es el tratamiento que salva vidas en la deshidratación.',
    },
  ],
  [
    CLIN.MEDICATION_CETIRIZINA,
    {
      display: 'Cetirizina',
      definition: 'Antihistamínico para alergia, con poco sueño.',
    },
  ],
  [
    CLIN.MEDICATION_BUDESONIDA,
    {
      display: 'Budesonida',
      definition:
        'Corticoide inhalado: desinflama el bronquio y previene las crisis de asma.',
    },
  ],
  [
    CLIN.MEDICATION_IPRATROPIO,
    {
      display: 'Bromuro de ipratropio',
      definition:
        'Broncodilatador inhalado, sobre todo en la enfermedad pulmonar crónica.',
    },
  ],
  [
    CLIN.MEDICATION_DIAZEPAM,
    {
      display: 'Diazepam',
      definition: 'Calma la ansiedad, relaja el músculo y corta convulsiones.',
    },
  ],
  [
    CLIN.MEDICATION_CLONAZEPAM,
    {
      display: 'Clonazepam',
      definition: 'Controla convulsiones y crisis de pánico.',
    },
  ],
  [
    CLIN.MEDICATION_CARBAMAZEPINA,
    {
      display: 'Carbamazepina',
      definition:
        'Antiepiléptico, y también para el dolor del nervio trigémino.',
    },
  ],
  [
    CLIN.MEDICATION_ACIDO_VALPROICO,
    {
      display: 'Ácido valproico',
      definition:
        'Antiepiléptico de amplio espectro. No se usa en el embarazo.',
    },
  ],
  [
    CLIN.MEDICATION_FENITOINA,
    {
      display: 'Fenitoína',
      definition: 'Antiepiléptico clásico para convulsiones tónico-clónicas.',
    },
  ],
  [
    CLIN.MEDICATION_FLUOXETINA,
    {
      display: 'Fluoxetina',
      definition:
        'Antidepresivo: levanta el ánimo y sirve en la ansiedad. Tarda semanas en hacer efecto.',
    },
  ],
  [
    CLIN.MEDICATION_SERTRALINA,
    {
      display: 'Sertralina',
      definition:
        'Antidepresivo para depresión, ansiedad y estrés postraumático.',
    },
  ],
  [
    CLIN.MEDICATION_AMITRIPTILINA,
    {
      display: 'Amitriptilina',
      definition:
        'Antidepresivo antiguo, hoy más usado para dolor de nervios y migraña.',
    },
  ],
  [
    CLIN.MEDICATION_HALOPERIDOL,
    {
      display: 'Haloperidol',
      definition:
        'Antipsicótico para alucinaciones, delirio y agitación grave.',
    },
  ],
  [
    CLIN.MEDICATION_SULFATO_FERROSO,
    {
      display: 'Sulfato ferroso',
      definition:
        'Hierro para tratar la anemia. Oscurece la deposición, que es normal.',
    },
  ],
  [
    CLIN.MEDICATION_ACIDO_FOLICO,
    {
      display: 'Ácido fólico',
      definition:
        'Vitamina esencial en el embarazo: previene malformaciones del tubo neural.',
    },
  ],
  [
    CLIN.MEDICATION_ALOPURINOL,
    {
      display: 'Alopurinol',
      definition: 'Baja el ácido úrico para prevenir ataques de gota.',
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

  /* --- órdenes de estudios (v4.1.4) ----------------------------------------
     Los ejes de `clinical.service_requests` y los ochenta y ocho estudios de su
     catálogo. El `display` del concepto está en inglés, como todo el code system
     interno; esto es lo que ve el médico al pedir un laboratorio o una imagen. */
  [
    CLIN.SERVICE_REQUEST_DRAFT,
    {
      display: 'Orden en borrador',
      definition:
        'La orden se está escribiendo y todavía no se envió al prestador. El médico puede editarla o descartarla.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_ON_HOLD,
    {
      display: 'Orden en espera',
      definition:
        'La orden es válida pero su ejecución quedó suspendida; se retoma sin volver a emitirla.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_REVOKED,
    {
      display: 'Orden revocada',
      definition:
        'El médico dejó sin efecto la orden antes de que se realizara el estudio.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_INTENT_PLAN,
    {
      display: 'Intención de plan',
      definition:
        'El estudio queda planificado para más adelante; todavía no es una orden a ejecutar.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_INTENT_PROPOSAL,
    {
      display: 'Intención de propuesta',
      definition:
        'Se sugiere el estudio a otro profesional, que decide si lo ordena.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_PRIORITY_URGENT,
    {
      display: 'Prioridad urgente',
      definition:
        'Se necesita antes que las órdenes de rutina, sin llegar a ser una emergencia.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_PRIORITY_ASAP,
    {
      display: 'Prioridad cuanto antes',
      definition:
        'Se realiza en cuanto haya disponibilidad, por delante de lo urgente programado.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_PRIORITY_STAT,
    {
      display: 'Prioridad inmediata',
      definition: 'Emergencia: se realiza de inmediato e interrumpe la cola.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
    {
      display: 'Estudio por imagen',
      definition:
        'Radiografía, ecografía, tomografía, resonancia y demás estudios que produce un centro de imagen.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
    {
      display: 'Anatomía patológica',
      definition:
        'Estudio de una muestra de tejido o de células, con su propio circuito de fijación, procesado e informe.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
    {
      display: 'Procedimiento diagnóstico',
      definition:
        'Estudio que exige un procedimiento sobre el paciente, como una endoscopía o una espirometría.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_CATEGORY_CARDIO,
    {
      display: 'Estudio cardiológico',
      definition:
        'Electrocardiograma, ecocardiograma, Holter y demás estudios del corazón.',
    },
  ],
  [
    CLIN.STUDY_HEMOGRAMA,
    {
      display: 'Hemograma completo',
      definition:
        'Recuento y características de glóbulos rojos, glóbulos blancos y plaquetas.',
    },
  ],
  [
    CLIN.STUDY_VSG,
    {
      display: 'Velocidad de sedimentación globular',
      definition:
        'Marcador inespecífico de inflamación; se informa en milímetros por hora.',
    },
  ],
  [
    CLIN.STUDY_GRUPO_SANGUINEO,
    {
      display: 'Grupo sanguíneo y factor Rh',
      definition: 'Determina el grupo ABO y el factor Rh.',
    },
  ],
  [
    CLIN.STUDY_RETICULOCITOS,
    {
      display: 'Recuento de reticulocitos',
      definition:
        'Glóbulos rojos jóvenes; indica si la médula ósea está respondiendo.',
    },
  ],
  [
    CLIN.STUDY_FERRITINA,
    {
      display: 'Ferritina',
      definition: 'Refleja las reservas de hierro del organismo.',
    },
  ],
  [
    CLIN.STUDY_TIEMPO_PROTROMBINA,
    {
      display: 'Tiempo de protrombina e INR',
      definition:
        'Evalúa la vía extrínseca de la coagulación y controla el tratamiento anticoagulante oral.',
    },
  ],
  [
    CLIN.STUDY_TIEMPO_TROMBOPLASTINA,
    {
      display: 'Tiempo de tromboplastina parcial activada',
      definition: 'Evalúa la vía intrínseca de la coagulación.',
    },
  ],
  [
    CLIN.STUDY_FIBRINOGENO,
    {
      display: 'Fibrinógeno',
      definition:
        'Proteína de la coagulación; también sube en cuadros inflamatorios.',
    },
  ],
  [
    CLIN.STUDY_DIMERO_D,
    {
      display: 'Dímero D',
      definition:
        'Producto de degradación de la fibrina; se usa para descartar trombosis.',
    },
  ],
  [
    CLIN.STUDY_GLICEMIA,
    {
      display: 'Glicemia en ayunas',
      definition:
        'Glucosa en sangre tras ayuno; es la prueba base para diabetes.',
    },
  ],
  [
    CLIN.STUDY_CURVA_TOLERANCIA_GLUCOSA,
    {
      display: 'Curva de tolerancia a la glucosa',
      definition: 'Mide la glucosa antes y después de una carga oral.',
    },
  ],
  [
    CLIN.STUDY_HEMOGLOBINA_GLICOSILADA,
    {
      display: 'Hemoglobina glicosilada (HbA1c)',
      definition: 'Promedio de glucosa de los últimos dos o tres meses.',
    },
  ],
  [
    CLIN.STUDY_PERFIL_LIPIDICO,
    {
      display: 'Perfil lipídico',
      definition: 'Colesterol total, HDL, LDL y triglicéridos.',
    },
  ],
  [
    CLIN.STUDY_CREATININA,
    {
      display: 'Creatinina en sangre',
      definition: 'Principal indicador de función renal.',
    },
  ],
  [
    CLIN.STUDY_UREA,
    {
      display: 'Urea en sangre',
      definition:
        'Producto del metabolismo de las proteínas; acompaña a la creatinina.',
    },
  ],
  [
    CLIN.STUDY_ACIDO_URICO,
    {
      display: 'Ácido úrico',
      definition: 'Su elevación se asocia a gota y a litiasis renal.',
    },
  ],
  [
    CLIN.STUDY_PERFIL_HEPATICO,
    {
      display: 'Perfil hepático',
      definition:
        'Transaminasas, fosfatasa alcalina y gamma-glutamil transferasa.',
    },
  ],
  [
    CLIN.STUDY_BILIRRUBINAS,
    {
      display: 'Bilirrubinas',
      definition: 'Bilirrubina total, directa e indirecta.',
    },
  ],
  [
    CLIN.STUDY_AMILASA,
    {
      display: 'Amilasa',
      definition: 'Enzima pancreática; se eleva en la pancreatitis aguda.',
    },
  ],
  [
    CLIN.STUDY_LIPASA,
    {
      display: 'Lipasa',
      definition: 'Enzima pancreática, más específica que la amilasa.',
    },
  ],
  [
    CLIN.STUDY_ELECTROLITOS,
    {
      display: 'Electrolitos séricos',
      definition: 'Sodio, potasio y cloro.',
    },
  ],
  [
    CLIN.STUDY_CALCIO,
    {
      display: 'Calcio sérico',
      definition: 'Calcio en sangre, total o iónico.',
    },
  ],
  [
    CLIN.STUDY_PROTEINAS_TOTALES,
    {
      display: 'Proteínas totales y albúmina',
      definition: 'Estado proteico y función de síntesis del hígado.',
    },
  ],
  [
    CLIN.STUDY_VITAMINA_D,
    {
      display: 'Vitamina D 25-hidroxi',
      definition: 'Nivel de vitamina D circulante.',
    },
  ],
  [
    CLIN.STUDY_VITAMINA_B12,
    {
      display: 'Vitamina B12',
      definition: 'Su déficit causa anemia y compromiso neurológico.',
    },
  ],
  [
    CLIN.STUDY_PERFIL_TIROIDEO,
    {
      display: 'Perfil tiroideo',
      definition: 'TSH, T4 libre y T3.',
    },
  ],
  [
    CLIN.STUDY_TSH,
    {
      display: 'Hormona estimulante de tiroides (TSH)',
      definition: 'Primera prueba para evaluar la función tiroidea.',
    },
  ],
  [
    CLIN.STUDY_PSA,
    {
      display: 'Antígeno prostático específico (PSA)',
      definition: 'Tamizaje y seguimiento de patología prostática.',
    },
  ],
  [
    CLIN.STUDY_BETA_HCG,
    {
      display: 'Subunidad beta de gonadotropina coriónica',
      definition: 'Confirma embarazo y sigue su evolución.',
    },
  ],
  [
    CLIN.STUDY_TESTOSTERONA,
    {
      display: 'Testosterona',
      definition: 'Hormona sexual masculina; se mide en sangre.',
    },
  ],
  [
    CLIN.STUDY_CORTISOL,
    {
      display: 'Cortisol',
      definition:
        'Hormona suprarrenal; su valor depende de la hora de la toma.',
    },
  ],
  [
    CLIN.STUDY_PCR,
    {
      display: 'Proteína C reactiva',
      definition: 'Marcador de inflamación aguda e infección.',
    },
  ],
  [
    CLIN.STUDY_FACTOR_REUMATOIDEO,
    {
      display: 'Factor reumatoideo',
      definition: 'Anticuerpo asociado a la artritis reumatoide.',
    },
  ],
  [
    CLIN.STUDY_ANTIESTREPTOLISINA,
    {
      display: 'Antiestreptolisina O (ASTO)',
      definition: 'Evidencia de infección estreptocócica reciente.',
    },
  ],
  [
    CLIN.STUDY_ORINA_COMPLETA,
    {
      display: 'Examen general de orina',
      definition: 'Estudio físico, químico y del sedimento urinario.',
    },
  ],
  [
    CLIN.STUDY_UROCULTIVO,
    {
      display: 'Urocultivo',
      definition: 'Cultivo de orina con recuento de colonias y antibiograma.',
    },
  ],
  [
    CLIN.STUDY_COPROPARASITOLOGICO,
    {
      display: 'Coproparasitológico',
      definition: 'Búsqueda de parásitos y sus huevos en materia fecal.',
    },
  ],
  [
    CLIN.STUDY_COPROCULTIVO,
    {
      display: 'Coprocultivo',
      definition:
        'Cultivo de materia fecal para identificar bacterias enteropatógenas.',
    },
  ],
  [
    CLIN.STUDY_HEMOCULTIVO,
    {
      display: 'Hemocultivo',
      definition: 'Cultivo de sangre para detectar bacteriemia.',
    },
  ],
  [
    CLIN.STUDY_VIH,
    {
      display: 'Prueba de VIH',
      definition:
        'Tamizaje de anticuerpos contra el virus de la inmunodeficiencia humana.',
    },
  ],
  [
    CLIN.STUDY_VDRL,
    {
      display: 'Prueba de sífilis (VDRL/RPR)',
      definition: 'Tamizaje serológico de sífilis.',
    },
  ],
  [
    CLIN.STUDY_HEPATITIS_B,
    {
      display: 'Antígeno de superficie de hepatitis B',
      definition: 'Detecta infección por el virus de la hepatitis B.',
    },
  ],
  [
    CLIN.STUDY_HEPATITIS_C,
    {
      display: 'Anticuerpos de hepatitis C',
      definition: 'Tamizaje de infección por el virus de la hepatitis C.',
    },
  ],
  [
    CLIN.STUDY_CHAGAS,
    {
      display: 'Serología de Chagas',
      definition:
        'Detecta anticuerpos contra Trypanosoma cruzi. Es de tamizaje obligado en gran parte de Bolivia.',
    },
  ],
  [
    CLIN.STUDY_DENGUE,
    {
      display: 'Serología de dengue',
      definition: 'Detecta antígeno NS1 y anticuerpos del virus del dengue.',
    },
  ],
  [
    CLIN.STUDY_GOTA_GRUESA,
    {
      display: 'Gota gruesa para malaria',
      definition: 'Examen microscópico de sangre para detectar Plasmodium.',
    },
  ],
  [
    CLIN.STUDY_BACILOSCOPIA,
    {
      display: 'Baciloscopía de esputo',
      definition:
        'Búsqueda de bacilos ácido-alcohol resistentes; tamizaje de tuberculosis.',
    },
  ],
  [
    CLIN.STUDY_RX_TORAX,
    {
      display: 'Radiografía de tórax',
      definition: 'Estudio radiológico de pulmones, corazón y caja torácica.',
    },
  ],
  [
    CLIN.STUDY_RX_CRANEO,
    {
      display: 'Radiografía de cráneo',
      definition: 'Estudio radiológico del cráneo.',
    },
  ],
  [
    CLIN.STUDY_RX_SENOS_PARANASALES,
    {
      display: 'Radiografía de senos paranasales',
      definition: 'Estudio radiológico de los senos frontales y maxilares.',
    },
  ],
  [
    CLIN.STUDY_RX_COLUMNA_CERVICAL,
    {
      display: 'Radiografía de columna cervical',
      definition: 'Estudio radiológico del segmento cervical.',
    },
  ],
  [
    CLIN.STUDY_RX_COLUMNA_DORSAL,
    {
      display: 'Radiografía de columna dorsal',
      definition: 'Estudio radiológico del segmento dorsal o torácico.',
    },
  ],
  [
    CLIN.STUDY_RX_COLUMNA_LUMBAR,
    {
      display: 'Radiografía de columna lumbar',
      definition: 'Estudio radiológico del segmento lumbosacro.',
    },
  ],
  [
    CLIN.STUDY_RX_ABDOMEN,
    {
      display: 'Radiografía de abdomen',
      definition: 'Estudio radiológico simple del abdomen.',
    },
  ],
  [
    CLIN.STUDY_RX_PELVIS,
    {
      display: 'Radiografía de pelvis',
      definition: 'Estudio radiológico de la pelvis y las caderas.',
    },
  ],
  [
    CLIN.STUDY_RX_MIEMBRO_SUPERIOR,
    {
      display: 'Radiografía de miembro superior',
      definition: 'Hombro, brazo, codo, antebrazo, muñeca o mano.',
    },
  ],
  [
    CLIN.STUDY_RX_MIEMBRO_INFERIOR,
    {
      display: 'Radiografía de miembro inferior',
      definition: 'Cadera, muslo, rodilla, pierna, tobillo o pie.',
    },
  ],
  [
    CLIN.STUDY_ECO_ABDOMINAL,
    {
      display: 'Ecografía abdominal',
      definition:
        'Estudio por ultrasonido de hígado, vesícula, páncreas, bazo y riñones.',
    },
  ],
  [
    CLIN.STUDY_ECO_RENAL,
    {
      display: 'Ecografía renal y de vías urinarias',
      definition: 'Estudio por ultrasonido de riñones, uréteres y vejiga.',
    },
  ],
  [
    CLIN.STUDY_ECO_PELVICA,
    {
      display: 'Ecografía pélvica',
      definition: 'Estudio por ultrasonido de los órganos de la pelvis.',
    },
  ],
  [
    CLIN.STUDY_ECO_OBSTETRICA,
    {
      display: 'Ecografía obstétrica',
      definition: 'Control ecográfico del embarazo.',
    },
  ],
  [
    CLIN.STUDY_ECO_TIROIDES,
    {
      display: 'Ecografía de tiroides',
      definition: 'Estudio por ultrasonido de la glándula tiroides.',
    },
  ],
  [
    CLIN.STUDY_ECO_MAMARIA,
    {
      display: 'Ecografía mamaria',
      definition: 'Estudio por ultrasonido de las mamas.',
    },
  ],
  [
    CLIN.STUDY_ECO_PARTES_BLANDAS,
    {
      display: 'Ecografía de partes blandas',
      definition:
        'Estudio por ultrasonido de músculos, tendones y tejido subcutáneo.',
    },
  ],
  [
    CLIN.STUDY_ECO_DOPPLER,
    {
      display: 'Ecografía Doppler color',
      definition:
        'Estudio por ultrasonido que mide el flujo de la sangre en arterias y venas.',
    },
  ],
  [
    CLIN.STUDY_TC_CRANEO,
    {
      display: 'Tomografía de cráneo',
      definition: 'Tomografía computarizada del encéfalo y el cráneo.',
    },
  ],
  [
    CLIN.STUDY_TC_TORAX,
    {
      display: 'Tomografía de tórax',
      definition: 'Tomografía computarizada de pulmones y mediastino.',
    },
  ],
  [
    CLIN.STUDY_TC_ABDOMEN,
    {
      display: 'Tomografía de abdomen y pelvis',
      definition: 'Tomografía computarizada del abdomen y la pelvis.',
    },
  ],
  [
    CLIN.STUDY_TC_COLUMNA,
    {
      display: 'Tomografía de columna',
      definition: 'Tomografía computarizada de un segmento de la columna.',
    },
  ],
  [
    CLIN.STUDY_RM_CEREBRAL,
    {
      display: 'Resonancia magnética cerebral',
      definition: 'Resonancia magnética del encéfalo.',
    },
  ],
  [
    CLIN.STUDY_RM_COLUMNA,
    {
      display: 'Resonancia magnética de columna',
      definition: 'Resonancia magnética de un segmento de la columna.',
    },
  ],
  [
    CLIN.STUDY_RM_ARTICULAR,
    {
      display: 'Resonancia magnética articular',
      definition:
        'Resonancia magnética de una articulación, como rodilla u hombro.',
    },
  ],
  [
    CLIN.STUDY_MAMOGRAFIA,
    {
      display: 'Mamografía',
      definition:
        'Estudio radiológico de las mamas; es el tamizaje del cáncer de mama.',
    },
  ],
  [
    CLIN.STUDY_DENSITOMETRIA,
    {
      display: 'Densitometría ósea',
      definition:
        'Mide la densidad mineral del hueso; diagnostica osteoporosis.',
    },
  ],
  [
    CLIN.STUDY_ELECTROCARDIOGRAMA,
    {
      display: 'Electrocardiograma',
      definition: 'Registro de la actividad eléctrica del corazón en reposo.',
    },
  ],
  [
    CLIN.STUDY_ECOCARDIOGRAMA,
    {
      display: 'Ecocardiograma',
      definition: 'Estudio por ultrasonido del corazón y sus válvulas.',
    },
  ],
  [
    CLIN.STUDY_HOLTER,
    {
      display: 'Holter de ritmo',
      definition:
        'Registro continuo del electrocardiograma durante veinticuatro horas o más.',
    },
  ],
  [
    CLIN.STUDY_ERGOMETRIA,
    {
      display: 'Ergometría',
      definition: 'Electrocardiograma durante esfuerzo físico controlado.',
    },
  ],
  [
    CLIN.STUDY_MAPA_PRESION,
    {
      display: 'Monitoreo ambulatorio de presión arterial',
      definition: 'Registro de la presión arterial durante veinticuatro horas.',
    },
  ],
  [
    CLIN.STUDY_BIOPSIA,
    {
      display: 'Estudio histopatológico de biopsia',
      definition: 'Análisis microscópico de una muestra de tejido.',
    },
  ],
  [
    CLIN.STUDY_CITOLOGIA,
    {
      display: 'Estudio citológico',
      definition:
        'Análisis microscópico de células obtenidas por punción o raspado.',
    },
  ],
  [
    CLIN.STUDY_PAPANICOLAOU,
    {
      display: 'Papanicolaou',
      definition:
        'Citología del cuello uterino; es el tamizaje del cáncer cervicouterino.',
    },
  ],
  [
    CLIN.STUDY_ENDOSCOPIA_ALTA,
    {
      display: 'Endoscopía digestiva alta',
      definition: 'Exploración con endoscopio de esófago, estómago y duodeno.',
    },
  ],
  [
    CLIN.STUDY_COLONOSCOPIA,
    {
      display: 'Colonoscopía',
      definition: 'Exploración con endoscopio del intestino grueso.',
    },
  ],
  [
    CLIN.STUDY_ESPIROMETRIA,
    {
      display: 'Espirometría',
      definition: 'Mide los volúmenes y flujos respiratorios.',
    },
  ],
  [
    CLIN.STUDY_AUDIOMETRIA,
    {
      display: 'Audiometría',
      definition: 'Mide la capacidad auditiva por vía aérea y ósea.',
    },
  ],
  [
    CLIN.STUDY_ELECTROENCEFALOGRAMA,
    {
      display: 'Electroencefalograma',
      definition: 'Registro de la actividad eléctrica del cerebro.',
    },
  ],
  [
    CLIN.STUDY_ELECTROMIOGRAFIA,
    {
      display: 'Electromiografía',
      definition:
        'Registro de la actividad eléctrica del músculo y del nervio periférico.',
    },
  ],
  /* Los cinco que ya existían desde el módulo 08 y nunca se habían traducido:
     hasta ahora `service_requests` no tenía ninguna enumeración publicada, así
     que ningún concepto suyo llegaba a una pantalla. */
  [
    CLIN.SERVICE_REQUEST_ACTIVE,
    {
      display: 'Orden activa',
      definition:
        'La orden está vigente y el prestador puede realizar el estudio.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_COMPLETED,
    {
      display: 'Orden completada',
      definition: 'El estudio se realizó y la orden se cerró.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_INTENT_ORDER,
    {
      display: 'Intención de orden',
      definition:
        'El estudio se ordena para que se realice, sin pasos intermedios.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_PRIORITY_ROUTINE,
    {
      display: 'Prioridad de rutina',
      definition:
        'Se realiza en el turno normal del prestador, sin adelantarse a otras órdenes.',
    },
  ],
  [
    CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    {
      display: 'Análisis de laboratorio',
      definition:
        'Estudio sobre una muestra biológica que procesa un laboratorio de análisis clínicos.',
    },
  ],
  /* --- formas societarias (v4.1.4) ------------------------------------------
     Las ocho que enumera el registro de procesos, con el nombre con el que las
     nombra la ley boliviana. */
  [
    CONCEPTS.LEGAL_ENTITY_SOLE_PROPRIETORSHIP,
    {
      display: 'Empresa unipersonal',
      definition:
        'Una sola persona natural es la titular del negocio y responde con su patrimonio.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_SRL,
    {
      display: 'Sociedad de Responsabilidad Limitada (S.R.L.)',
      definition:
        'Los socios responden hasta el monto de sus aportes. El capital se divide en cuotas, no en acciones.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_LTDA,
    {
      display: 'Sociedad Limitada (Ltda.)',
      definition:
        'Denominación usada en el giro comercial para una sociedad de responsabilidad limitada.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_SA,
    {
      display: 'Sociedad Anónima (S.A.)',
      definition:
        'El capital se divide en acciones y los accionistas responden hasta el valor de las suyas.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_GENERAL_PARTNERSHIP,
    {
      display: 'Sociedad Colectiva',
      definition:
        'Todos los socios responden de forma solidaria e ilimitada por las obligaciones sociales.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_LIMITED_PARTNERSHIP,
    {
      display: 'Sociedad en Comandita Simple',
      definition:
        'Convive un socio gestor, que responde de forma ilimitada, con socios comanditarios que responden sólo por su aporte.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_PARTNERSHIP_BY_SHARES,
    {
      display: 'Sociedad en Comandita por Acciones',
      definition:
        'Como la comandita simple, pero el aporte de los socios comanditarios está representado en acciones.',
    },
  ],
  [
    CONCEPTS.LEGAL_ENTITY_FOREIGN_BRANCH,
    {
      display: 'Sucursal de sociedad extranjera',
      definition:
        'Establecimiento en Bolivia de una sociedad constituida en otro país, inscrito en el registro de comercio.',
    },
  ],
  /* --- la nota clínica narrativa (v4.1.4) -----------------------------------
     Se veían en inglés en la pestaña «Notas» del expediente, que es justo donde
     el médico va a buscar lo que acaba de escribir. */
  [
    CHART.NOTE_TYPE_PROGRESS,
    {
      display: 'Nota de evolución',
      definition:
        'El registro corriente de una consulta: qué pasó, qué se encontró y qué se decidió.',
    },
  ],
  [
    CHART.NOTE_LIFECYCLE_DRAFT,
    {
      display: 'Borrador',
      definition:
        'La nota está escrita pero todavía sin firmar. Se puede seguir editando y no cuenta como registro definitivo.',
    },
  ],
  [
    CHART.NOTE_LIFECYCLE_SIGNED,
    {
      display: 'Firmada',
      definition:
        'La nota quedó firmada por su autor. Desde acá no se edita: corregirla es enmendarla, y la enmienda dice por qué.',
    },
  ],
  [
    CHART.NOTE_LIFECYCLE_AMENDED,
    {
      display: 'Enmendada',
      definition:
        'La nota se corrigió después de firmarla. La versión anterior sigue en la historia con su motivo de enmienda.',
    },
  ],
  [
    CHART.RELEASE_NOT_RELEASED,
    {
      display: 'No compartida con el paciente',
      definition:
        'La nota es visible para el equipo de salud pero todavía no para la persona atendida.',
    },
  ],
  [
    CHART.RELEASE_RELEASED,
    {
      display: 'Compartida con el paciente',
      definition: 'La persona atendida puede leer esta nota desde su historia.',
    },
  ],
  [
    CHART.RELEASE_WITHHELD,
    {
      display: 'Retenida',
      definition:
        'El profesional decidió que esta nota no se comparta con la persona atendida, aunque el resto de su historia sí.',
    },
  ],

  /* --- CIE-10 ambulatorio ampliado (v4.1.5) ---------------------------------
     Ciento treinta diagnósticos más. La explicación no es para el médico —que
     sabe qué es una gonartrosis— sino para el glosario que lee el paciente. */
  [
    CLIN.CONDITION_DIARREA_INFECCIOSA,
    {
      display: 'Diarrea y gastroenteritis de presunto origen infeccioso',
      definition:
        'Deposiciones líquidas frecuentes por una infección del intestino. CIE-10: A09.',
    },
  ],
  [
    CLIN.CONDITION_FIEBRE_TIFOIDEA,
    {
      display: 'Fiebre tifoidea',
      definition:
        'Infección intestinal por Salmonella typhi, con fiebre prolongada. CIE-10: A01.0.',
    },
  ],
  [
    CLIN.CONDITION_AMEBIASIS,
    {
      display: 'Amebiasis intestinal aguda',
      definition:
        'Infección del intestino por amebas, con diarrea que puede tener sangre. CIE-10: A06.0.',
    },
  ],
  [
    CLIN.CONDITION_TUBERCULOSIS_PULMONAR,
    {
      display: 'Tuberculosis pulmonar',
      definition:
        'Infección del pulmón por el bacilo de Koch, con tos de más de dos semanas. CIE-10: A15.0.',
    },
  ],
  [
    CLIN.CONDITION_CHAGAS_CRONICA,
    {
      display: 'Enfermedad de Chagas crónica con compromiso cardíaco',
      definition:
        'Fase tardía de la infección por Trypanosoma cruzi, cuando afecta al corazón. CIE-10: B57.2.',
    },
  ],
  [
    CLIN.CONDITION_DENGUE,
    {
      display: 'Dengue clásico',
      definition:
        'Infección viral transmitida por el mosquito Aedes, con fiebre y dolor de cuerpo. CIE-10: A90.',
    },
  ],
  [
    CLIN.CONDITION_VARICELA,
    {
      display: 'Varicela',
      definition:
        'Infección viral con ampollas en la piel que pican, frecuente en la infancia. CIE-10: B01.9.',
    },
  ],
  [
    CLIN.CONDITION_HERPES_ZOSTER,
    {
      display: 'Herpes zóster',
      definition:
        'Reactivación del virus de la varicela, con ampollas dolorosas en una franja de piel. CIE-10: B02.9.',
    },
  ],
  [
    CLIN.CONDITION_CANDIDIASIS,
    {
      display: 'Candidiasis',
      definition:
        'Infección por el hongo Candida, en boca, piel o zona genital. CIE-10: B37.9.',
    },
  ],
  [
    CLIN.CONDITION_MICOSIS_SUPERFICIAL,
    {
      display: 'Dermatofitosis',
      definition:
        'Infección por hongos en la piel, las uñas o el cuero cabelludo. CIE-10: B35.9.',
    },
  ],
  [
    CLIN.CONDITION_PARASITOSIS_INTESTINAL,
    {
      display: 'Parasitosis intestinal',
      definition: 'Presencia de parásitos en el intestino. CIE-10: B82.9.',
    },
  ],
  [
    CLIN.CONDITION_VIH,
    {
      display: 'Enfermedad por VIH sin otra especificación',
      definition:
        'Infección por el virus de la inmunodeficiencia humana. CIE-10: B24.',
    },
  ],
  [
    CLIN.CONDITION_ANEMIA_NO_ESPECIFICADA,
    {
      display: 'Anemia no especificada',
      definition:
        'Falta de glóbulos rojos o hemoglobina, sin causa aún establecida. CIE-10: D64.9.',
    },
  ],
  [
    CLIN.CONDITION_TROMBOCITOPENIA,
    {
      display: 'Trombocitopenia no especificada',
      definition:
        'Plaquetas bajas, lo que favorece hematomas y sangrados. CIE-10: D69.6.',
    },
  ],
  [
    CLIN.CONDITION_DIABETES_TIPO_1,
    {
      display: 'Diabetes mellitus tipo 1',
      definition:
        'El páncreas deja de producir insulina; requiere insulina de por vida. CIE-10: E10.9.',
    },
  ],
  [
    CLIN.CONDITION_DIABETES_GESTACIONAL,
    {
      display: 'Diabetes mellitus del embarazo',
      definition: 'Azúcar alta que aparece durante el embarazo. CIE-10: O24.4.',
    },
  ],
  [
    CLIN.CONDITION_HIPERTIROIDISMO,
    {
      display: 'Hipertiroidismo',
      definition:
        'La tiroides trabaja de más: baja de peso, palpitaciones, nerviosismo. CIE-10: E05.9.',
    },
  ],
  [
    CLIN.CONDITION_BOCIO,
    {
      display: 'Bocio no tóxico',
      definition:
        'Aumento del tamaño de la tiroides sin alteración de su función. CIE-10: E04.9.',
    },
  ],
  [
    CLIN.CONDITION_OBESIDAD,
    {
      display: 'Obesidad',
      definition:
        'Exceso de grasa corporal que aumenta el riesgo de otras enfermedades. CIE-10: E66.9.',
    },
  ],
  [
    CLIN.CONDITION_SOBREPESO,
    {
      display: 'Sobrepeso',
      definition:
        'Peso por encima de lo saludable, sin llegar a obesidad. CIE-10: E66.3.',
    },
  ],
  [
    CLIN.CONDITION_DISLIPIDEMIA,
    {
      display: 'Hiperlipidemia no especificada',
      definition: 'Grasas altas en la sangre. CIE-10: E78.5.',
    },
  ],
  [
    CLIN.CONDITION_HIPERCOLESTEROLEMIA,
    {
      display: 'Hipercolesterolemia pura',
      definition: 'Colesterol alto en la sangre. CIE-10: E78.0.',
    },
  ],
  [
    CLIN.CONDITION_DESNUTRICION,
    {
      display: 'Desnutrición proteico-calórica no especificada',
      definition:
        'Falta de energía y proteínas para las necesidades del cuerpo. CIE-10: E46.',
    },
  ],
  [
    CLIN.CONDITION_DEFICIENCIA_VITAMINA_D,
    {
      display: 'Deficiencia de vitamina D',
      definition:
        'Vitamina D baja, que afecta al hueso y al músculo. CIE-10: E55.9.',
    },
  ],
  [
    CLIN.CONDITION_HIPERURICEMIA,
    {
      display: 'Hiperuricemia sin signos de artritis inflamatoria',
      definition: 'Ácido úrico alto sin ataque de gota todavía. CIE-10: E79.0.',
    },
  ],
  [
    CLIN.CONDITION_SINDROME_METABOLICO,
    {
      display: 'Síndrome metabólico',
      definition:
        'Conjunto de obesidad abdominal, azúcar, presión y grasas altas. CIE-10: E88.81.',
    },
  ],
  [
    CLIN.CONDITION_DEPRESION,
    {
      display: 'Episodio depresivo',
      definition:
        'Ánimo bajo y pérdida de interés que duran semanas e interfieren con la vida diaria. CIE-10: F32.9.',
    },
  ],
  [
    CLIN.CONDITION_TRASTORNO_SUENO,
    {
      display: 'Insomnio no orgánico',
      definition:
        'Dificultad para dormir sin una causa física que lo explique. CIE-10: F51.0.',
    },
  ],
  [
    CLIN.CONDITION_TRASTORNO_PANICO,
    {
      display: 'Trastorno de pánico',
      definition:
        'Crisis de miedo intenso que aparecen de golpe y sin motivo aparente. CIE-10: F41.0.',
    },
  ],
  [
    CLIN.CONDITION_DEMENCIA,
    {
      display: 'Demencia no especificada',
      definition:
        'Pérdida progresiva de memoria y otras funciones mentales. CIE-10: F03.',
    },
  ],
  [
    CLIN.CONDITION_TDAH,
    {
      display: 'Trastorno hipercinético',
      definition:
        'Dificultad sostenida para prestar atención, con inquietud e impulsividad. CIE-10: F90.9.',
    },
  ],
  [
    CLIN.CONDITION_DEPENDENCIA_ALCOHOL,
    {
      display: 'Dependencia del alcohol',
      definition:
        'Consumo de alcohol que la persona ya no logra controlar. CIE-10: F10.2.',
    },
  ],
  [
    CLIN.CONDITION_DEPENDENCIA_TABACO,
    {
      display: 'Dependencia del tabaco',
      definition: 'Adicción a la nicotina. CIE-10: F17.2.',
    },
  ],
  [
    CLIN.CONDITION_CEFALEA_TENSIONAL,
    {
      display: 'Cefalea tensional',
      definition:
        'Dolor de cabeza opresivo, como una banda, ligado a la tensión muscular. CIE-10: G44.2.',
    },
  ],
  [
    CLIN.CONDITION_EPILEPSIA,
    {
      display: 'Epilepsia',
      definition:
        'Tendencia a repetir convulsiones por descargas anormales del cerebro. CIE-10: G40.9.',
    },
  ],
  [
    CLIN.CONDITION_NEUROPATIA_DIABETICA,
    {
      display: 'Polineuropatía diabética',
      definition:
        'Daño de los nervios por la diabetes, con hormigueo o pérdida de sensibilidad. CIE-10: G63.2.',
    },
  ],
  [
    CLIN.CONDITION_PARKINSON,
    {
      display: 'Enfermedad de Parkinson',
      definition:
        'Enfermedad del cerebro con temblor, rigidez y lentitud de movimientos. CIE-10: G20.',
    },
  ],
  [
    CLIN.CONDITION_VERTIGO,
    {
      display: 'Vértigo paroxístico benigno',
      definition:
        'Sensación de giro al mover la cabeza, por un problema del oído interno. CIE-10: H81.1.',
    },
  ],
  [
    CLIN.CONDITION_SINDROME_TUNEL_CARPIANO,
    {
      display: 'Síndrome del túnel carpiano',
      definition:
        'Compresión de un nervio en la muñeca, con hormigueo en la mano. CIE-10: G56.0.',
    },
  ],
  [
    CLIN.CONDITION_CIATICA,
    {
      display: 'Ciática',
      definition:
        'Dolor que baja por la pierna desde la espalda, por compresión del nervio ciático. CIE-10: M54.3.',
    },
  ],
  [
    CLIN.CONDITION_CONJUNTIVITIS,
    {
      display: 'Conjuntivitis',
      definition:
        'Inflamación de la membrana que cubre el ojo: enrojecimiento y secreción. CIE-10: H10.9.',
    },
  ],
  [
    CLIN.CONDITION_CATARATA,
    {
      display: 'Catarata senil',
      definition:
        'El cristalino del ojo se vuelve opaco con la edad y la visión se nubla. CIE-10: H25.9.',
    },
  ],
  [
    CLIN.CONDITION_GLAUCOMA,
    {
      display: 'Glaucoma',
      definition:
        'Daño del nervio óptico, casi siempre por presión alta dentro del ojo. CIE-10: H40.9.',
    },
  ],
  [
    CLIN.CONDITION_MIOPIA,
    {
      display: 'Miopía',
      definition: 'Se ve borroso de lejos y bien de cerca. CIE-10: H52.1.',
    },
  ],
  [
    CLIN.CONDITION_OTITIS_MEDIA,
    {
      display: 'Otitis media',
      definition:
        'Infección del oído medio, con dolor y a veces fiebre. CIE-10: H66.9.',
    },
  ],
  [
    CLIN.CONDITION_HIPOACUSIA,
    {
      display: 'Hipoacusia',
      definition: 'Disminución de la audición. CIE-10: H91.9.',
    },
  ],
  [
    CLIN.CONDITION_INSUFICIENCIA_CARDIACA,
    {
      display: 'Insuficiencia cardíaca',
      definition:
        'El corazón no bombea lo suficiente: cansancio, falta de aire e hinchazón. CIE-10: I50.9.',
    },
  ],
  [
    CLIN.CONDITION_FIBRILACION_AURICULAR,
    {
      display: 'Fibrilación auricular',
      definition:
        'Latido irregular del corazón que aumenta el riesgo de trombos. CIE-10: I48.',
    },
  ],
  [
    CLIN.CONDITION_CARDIOPATIA_ISQUEMICA,
    {
      display: 'Cardiopatía isquémica crónica',
      definition:
        'Las arterias del corazón llevan menos sangre de la necesaria. CIE-10: I25.9.',
    },
  ],
  [
    CLIN.CONDITION_INFARTO_AGUDO_MIOCARDIO,
    {
      display: 'Infarto agudo de miocardio',
      definition:
        'Una arteria del corazón se tapa y parte del músculo cardíaco muere. CIE-10: I21.9.',
    },
  ],
  [
    CLIN.CONDITION_ANGINA,
    {
      display: 'Angina de pecho',
      definition:
        'Dolor en el pecho por falta momentánea de sangre al corazón, casi siempre con el esfuerzo. CIE-10: I20.9.',
    },
  ],
  [
    CLIN.CONDITION_ACV,
    {
      display: 'Accidente cerebrovascular agudo',
      definition:
        'Interrupción de la sangre al cerebro por obstrucción o hemorragia. CIE-10: I64.',
    },
  ],
  [
    CLIN.CONDITION_VARICES,
    {
      display: 'Várices de miembros inferiores',
      definition:
        'Venas dilatadas en las piernas, con pesadez e hinchazón. CIE-10: I83.9.',
    },
  ],
  [
    CLIN.CONDITION_TROMBOSIS_VENOSA,
    {
      display: 'Trombosis venosa profunda',
      definition:
        'Coágulo en una vena profunda, casi siempre de la pierna. CIE-10: I80.2.',
    },
  ],
  [
    CLIN.CONDITION_HIPOTENSION,
    {
      display: 'Hipotensión',
      definition: 'Presión arterial más baja de lo normal. CIE-10: I95.9.',
    },
  ],
  [
    CLIN.CONDITION_FARINGITIS,
    {
      display: 'Faringitis aguda',
      definition:
        'Inflamación de la garganta, con dolor al tragar. CIE-10: J02.9.',
    },
  ],
  [
    CLIN.CONDITION_AMIGDALITIS,
    {
      display: 'Amigdalitis aguda',
      definition:
        'Infección de las amígdalas, con dolor de garganta y fiebre. CIE-10: J03.9.',
    },
  ],
  [
    CLIN.CONDITION_SINUSITIS,
    {
      display: 'Sinusitis aguda',
      definition:
        'Infección de los senos paranasales, con congestión y dolor facial. CIE-10: J01.9.',
    },
  ],
  [
    CLIN.CONDITION_BRONQUITIS_AGUDA,
    {
      display: 'Bronquitis aguda',
      definition:
        'Inflamación de los bronquios, con tos que suele durar días. CIE-10: J20.9.',
    },
  ],
  [
    CLIN.CONDITION_NEUMONIA,
    {
      display: 'Neumonía',
      definition:
        'Infección del pulmón, con fiebre, tos y falta de aire. CIE-10: J18.9.',
    },
  ],
  [
    CLIN.CONDITION_EPOC,
    {
      display: 'Enfermedad pulmonar obstructiva crónica',
      definition:
        'Obstrucción permanente del flujo de aire, ligada sobre todo al tabaco. CIE-10: J44.9.',
    },
  ],
  [
    CLIN.CONDITION_RINITIS_ALERGICA,
    {
      display: 'Rinitis alérgica',
      definition:
        'Estornudos, congestión y picazón nasal por alergia. CIE-10: J30.4.',
    },
  ],
  [
    CLIN.CONDITION_INFLUENZA,
    {
      display: 'Influenza con manifestaciones respiratorias',
      definition:
        'Gripe, con fiebre, dolor de cuerpo y síntomas respiratorios. CIE-10: J11.1.',
    },
  ],
  [
    CLIN.CONDITION_COVID19,
    {
      display: 'COVID-19 confirmado por laboratorio',
      definition:
        'Infección por SARS-CoV-2 confirmada con prueba de laboratorio. CIE-10: U07.1.',
    },
  ],
  [
    CLIN.CONDITION_ERGE,
    {
      display: 'Enfermedad por reflujo gastroesofágico',
      definition:
        'El contenido del estómago sube al esófago y produce ardor. CIE-10: K21.9.',
    },
  ],
  [
    CLIN.CONDITION_ULCERA_PEPTICA,
    {
      display: 'Úlcera péptica',
      definition: 'Llaga en la pared del estómago o el duodeno. CIE-10: K27.9.',
    },
  ],
  [
    CLIN.CONDITION_SINDROME_INTESTINO_IRRITABLE,
    {
      display: 'Síndrome del intestino irritable',
      definition:
        'Dolor abdominal y cambios del ritmo intestinal sin lesión que los explique. CIE-10: K58.9.',
    },
  ],
  [
    CLIN.CONDITION_ESTRENIMIENTO,
    {
      display: 'Estreñimiento',
      definition: 'Evacuaciones poco frecuentes o difíciles. CIE-10: K59.0.',
    },
  ],
  [
    CLIN.CONDITION_HEMORROIDES,
    {
      display: 'Hemorroides',
      definition:
        'Venas dilatadas del ano y el recto, con dolor o sangrado. CIE-10: K64.9.',
    },
  ],
  [
    CLIN.CONDITION_COLELITIASIS,
    {
      display: 'Colelitiasis sin colecistitis',
      definition:
        'Cálculos en la vesícula, sin infección todavía. CIE-10: K80.2.',
    },
  ],
  [
    CLIN.CONDITION_APENDICITIS,
    {
      display: 'Apendicitis aguda',
      definition:
        'Inflamación del apéndice; es una urgencia quirúrgica. CIE-10: K35.8.',
    },
  ],
  [
    CLIN.CONDITION_HERNIA_INGUINAL,
    {
      display: 'Hernia inguinal',
      definition:
        'Parte del intestino se sale por un punto débil de la ingle. CIE-10: K40.9.',
    },
  ],
  [
    CLIN.CONDITION_HIGADO_GRASO,
    {
      display: 'Esteatosis hepática',
      definition: 'Acumulación de grasa en el hígado. CIE-10: K76.0.',
    },
  ],
  [
    CLIN.CONDITION_PANCREATITIS,
    {
      display: 'Pancreatitis aguda',
      definition:
        'Inflamación del páncreas, con dolor abdominal intenso. CIE-10: K85.9.',
    },
  ],
  [
    CLIN.CONDITION_CARIES,
    {
      display: 'Caries dental',
      definition:
        'Destrucción del esmalte y la dentina por bacterias de la boca. CIE-10: K02.9.',
    },
  ],
  [
    CLIN.CONDITION_GINGIVITIS,
    {
      display: 'Gingivitis crónica',
      definition:
        'Inflamación de las encías, que sangran al cepillarse. CIE-10: K05.1.',
    },
  ],
  [
    CLIN.CONDITION_PERIODONTITIS,
    {
      display: 'Periodontitis crónica',
      definition:
        'La inflamación llegó al hueso que sostiene el diente. CIE-10: K05.3.',
    },
  ],
  [
    CLIN.CONDITION_ACNE,
    {
      display: 'Acné vulgar',
      definition:
        'Granos y espinillas por obstrucción e inflamación de los poros. CIE-10: L70.0.',
    },
  ],
  [
    CLIN.CONDITION_PSORIASIS,
    {
      display: 'Psoriasis',
      definition:
        'Placas rojas con escamas, por recambio acelerado de la piel. CIE-10: L40.9.',
    },
  ],
  [
    CLIN.CONDITION_URTICARIA,
    {
      display: 'Urticaria',
      definition: 'Ronchas que pican y aparecen y desaparecen. CIE-10: L50.9.',
    },
  ],
  [
    CLIN.CONDITION_CELULITIS,
    {
      display: 'Celulitis',
      definition:
        'Infección bacteriana de la piel y el tejido de debajo. CIE-10: L03.9.',
    },
  ],
  [
    CLIN.CONDITION_DERMATITIS_CONTACTO,
    {
      display: 'Dermatitis alérgica de contacto',
      definition:
        'Reacción de la piel al contacto con una sustancia a la que se es alérgico. CIE-10: L23.9.',
    },
  ],
  [
    CLIN.CONDITION_ALOPECIA,
    {
      display: 'Alopecia no cicatricial',
      definition:
        'Caída del cabello sin destrucción del folículo. CIE-10: L65.9.',
    },
  ],
  [
    CLIN.CONDITION_ARTROSIS_RODILLA,
    {
      display: 'Gonartrosis',
      definition:
        'Desgaste del cartílago de la rodilla, con dolor al caminar. CIE-10: M17.9.',
    },
  ],
  [
    CLIN.CONDITION_ARTROSIS_CADERA,
    {
      display: 'Coxartrosis',
      definition: 'Desgaste del cartílago de la cadera. CIE-10: M16.9.',
    },
  ],
  [
    CLIN.CONDITION_ARTRITIS_REUMATOIDE,
    {
      display: 'Artritis reumatoide',
      definition:
        'Enfermedad autoinmune que inflama las articulaciones de forma simétrica. CIE-10: M06.9.',
    },
  ],
  [
    CLIN.CONDITION_GOTA,
    {
      display: 'Gota',
      definition:
        'Ataques de dolor articular por cristales de ácido úrico. CIE-10: M10.9.',
    },
  ],
  [
    CLIN.CONDITION_OSTEOPOROSIS,
    {
      display: 'Osteoporosis',
      definition: 'Huesos frágiles por pérdida de masa ósea. CIE-10: M81.9.',
    },
  ],
  [
    CLIN.CONDITION_CERVICALGIA,
    {
      display: 'Cervicalgia',
      definition: 'Dolor en el cuello. CIE-10: M54.2.',
    },
  ],
  [
    CLIN.CONDITION_TENDINITIS_HOMBRO,
    {
      display: 'Tendinitis calcificante del hombro',
      definition:
        'Depósito de calcio en un tendón del hombro, con dolor al levantar el brazo. CIE-10: M75.3.',
    },
  ],
  [
    CLIN.CONDITION_ESGUINCE_TOBILLO,
    {
      display: 'Esguince de tobillo',
      definition:
        'Estiramiento o desgarro de los ligamentos del tobillo. CIE-10: S93.4.',
    },
  ],
  [
    CLIN.CONDITION_FIBROMIALGIA,
    {
      display: 'Fibromialgia',
      definition:
        'Dolor generalizado y cansancio persistentes, sin lesión que los explique. CIE-10: M79.7.',
    },
  ],
  [
    CLIN.CONDITION_ESCOLIOSIS,
    {
      display: 'Escoliosis',
      definition: 'Desviación lateral de la columna. CIE-10: M41.9.',
    },
  ],
  [
    CLIN.CONDITION_ENFERMEDAD_RENAL_CRONICA,
    {
      display: 'Enfermedad renal crónica',
      definition:
        'Pérdida progresiva y permanente de la función de los riñones. CIE-10: N18.9.',
    },
  ],
  [
    CLIN.CONDITION_LITIASIS_RENAL,
    {
      display: 'Cálculo del riñón',
      definition:
        'Piedra en el riñón, que puede producir cólico. CIE-10: N20.0.',
    },
  ],
  [
    CLIN.CONDITION_HIPERPLASIA_PROSTATICA,
    {
      display: 'Hiperplasia prostática benigna',
      definition:
        'Agrandamiento de la próstata que dificulta orinar. CIE-10: N40.',
    },
  ],
  [
    CLIN.CONDITION_VAGINITIS,
    {
      display: 'Vaginitis aguda',
      definition:
        'Inflamación de la vagina, con flujo y molestias. CIE-10: N76.0.',
    },
  ],
  [
    CLIN.CONDITION_MIOMA_UTERINO,
    {
      display: 'Leiomioma del útero',
      definition: 'Tumor benigno del músculo del útero. CIE-10: D25.9.',
    },
  ],
  [
    CLIN.CONDITION_DISMENORREA,
    {
      display: 'Dismenorrea',
      definition: 'Dolor menstrual. CIE-10: N94.6.',
    },
  ],
  [
    CLIN.CONDITION_MENOPAUSIA,
    {
      display: 'Estado menopáusico',
      definition: 'Etapa posterior al cese de la menstruación. CIE-10: N95.1.',
    },
  ],
  [
    CLIN.CONDITION_INFERTILIDAD,
    {
      display: 'Infertilidad femenina',
      definition:
        'Dificultad para lograr un embarazo tras un año de intentarlo. CIE-10: N97.9.',
    },
  ],
  [
    CLIN.CONDITION_EMBARAZO_NORMAL,
    {
      display: 'Supervisión de embarazo normal',
      definition:
        'Control de un embarazo que transcurre sin complicaciones. CIE-10: Z34.9.',
    },
  ],
  [
    CLIN.CONDITION_PREECLAMPSIA,
    {
      display: 'Preeclampsia',
      definition:
        'Presión alta y proteína en la orina durante el embarazo. CIE-10: O14.9.',
    },
  ],
  [
    CLIN.CONDITION_AMENAZA_ABORTO,
    {
      display: 'Amenaza de aborto',
      definition:
        'Sangrado en el primer tramo del embarazo, con el embarazo aún viable. CIE-10: O20.0.',
    },
  ],
  [
    CLIN.CONDITION_ANEMIA_EMBARAZO,
    {
      display: 'Anemia que complica el embarazo',
      definition: 'Hemoglobina baja durante la gestación. CIE-10: O99.0.',
    },
  ],
  [
    CLIN.CONDITION_ICTERICIA_NEONATAL,
    {
      display: 'Ictericia neonatal',
      definition:
        'Color amarillo de la piel del recién nacido por bilirrubina alta. CIE-10: P59.9.',
    },
  ],
  [
    CLIN.CONDITION_BAJO_PESO_NACER,
    {
      display: 'Bajo peso al nacer',
      definition: 'Recién nacido con menos de 2 500 gramos. CIE-10: P07.1.',
    },
  ],
  [
    CLIN.CONDITION_BRONQUIOLITIS,
    {
      display: 'Bronquiolitis aguda',
      definition:
        'Infección viral de los bronquios pequeños, típica del lactante. CIE-10: J21.9.',
    },
  ],
  [
    CLIN.CONDITION_OTITIS_EXTERNA,
    {
      display: 'Otitis externa',
      definition: 'Infección del conducto auditivo externo. CIE-10: H60.9.',
    },
  ],
  [
    CLIN.CONDITION_FIEBRE,
    {
      display: 'Fiebre no especificada',
      definition:
        'Temperatura elevada sin causa aún establecida. CIE-10: R50.9.',
    },
  ],
  [
    CLIN.CONDITION_DOLOR_ABDOMINAL,
    {
      display: 'Dolor abdominal',
      definition:
        'Dolor en el abdomen, sin diagnóstico definitivo todavía. CIE-10: R10.4.',
    },
  ],
  [
    CLIN.CONDITION_DOLOR_TORACICO,
    {
      display: 'Dolor torácico',
      definition:
        'Dolor en el pecho, pendiente de estudiar su causa. CIE-10: R07.4.',
    },
  ],
  [
    CLIN.CONDITION_DISNEA,
    {
      display: 'Disnea',
      definition: 'Sensación de falta de aire. CIE-10: R06.0.',
    },
  ],
  [
    CLIN.CONDITION_TOS,
    {
      display: 'Tos',
      definition:
        'Tos como motivo de consulta, sin causa aún establecida. CIE-10: R05.',
    },
  ],
  [
    CLIN.CONDITION_MAREO,
    {
      display: 'Mareo y desvanecimiento',
      definition:
        'Sensación de inestabilidad o de estar por desmayarse. CIE-10: R42.',
    },
  ],
  [
    CLIN.CONDITION_ASTENIA,
    {
      display: 'Malestar y fatiga',
      definition: 'Cansancio persistente sin causa identificada. CIE-10: R53.',
    },
  ],
  [
    CLIN.CONDITION_EDEMA,
    {
      display: 'Edema',
      definition: 'Hinchazón por acumulación de líquido. CIE-10: R60.9.',
    },
  ],
  [
    CLIN.CONDITION_PERDIDA_PESO,
    {
      display: 'Pérdida anormal de peso',
      definition:
        'Baja de peso no buscada, que hay que estudiar. CIE-10: R63.4.',
    },
  ],
  [
    CLIN.CONDITION_SINCOPE,
    {
      display: 'Síncope y colapso',
      definition:
        'Pérdida breve del conocimiento con recuperación completa. CIE-10: R55.',
    },
  ],
  [
    CLIN.CONDITION_PALPITACIONES,
    {
      display: 'Palpitaciones',
      definition:
        'Percepción del propio latido, acelerado o irregular. CIE-10: R00.2.',
    },
  ],
  [
    CLIN.CONDITION_FRACTURA_ANTEBRAZO,
    {
      display: 'Fractura del antebrazo',
      definition:
        'Rotura de uno o los dos huesos del antebrazo. CIE-10: S52.9.',
    },
  ],
  [
    CLIN.CONDITION_HERIDA_CORTANTE,
    {
      display: 'Herida abierta de región no especificada',
      definition: 'Corte que atraviesa la piel. CIE-10: T14.1.',
    },
  ],
  [
    CLIN.CONDITION_QUEMADURA,
    {
      display: 'Quemadura de región no especificada',
      definition:
        'Lesión de la piel por calor, químicos o electricidad. CIE-10: T30.0.',
    },
  ],
  [
    CLIN.CONDITION_CONTUSION,
    {
      display: 'Contusión de región no especificada',
      definition:
        'Golpe sin herida abierta, con dolor y moretón. CIE-10: T14.0.',
    },
  ],
  [
    CLIN.CONDITION_TRAUMATISMO_CRANEAL,
    {
      display: 'Traumatismo intracraneal',
      definition:
        'Golpe en la cabeza con posible compromiso del cerebro. CIE-10: S06.9.',
    },
  ],
  [
    CLIN.CONDITION_CONTROL_SALUD,
    {
      display: 'Examen médico general',
      definition:
        'Consulta de control en una persona sin enfermedad. CIE-10: Z00.0.',
    },
  ],
  [
    CLIN.CONDITION_VACUNACION,
    {
      display: 'Contacto para inmunización',
      definition: 'Consulta cuyo motivo es aplicar una vacuna. CIE-10: Z23.',
    },
  ],
  [
    CLIN.CONDITION_ANTICONCEPCION,
    {
      display: 'Atención para la anticoncepción',
      definition:
        'Consulta para elegir o controlar un método anticonceptivo. CIE-10: Z30.9.',
    },
  ],
  [
    CLIN.CONDITION_CERTIFICADO_MEDICO,
    {
      display: 'Emisión de certificado médico',
      definition:
        'Consulta cuyo motivo es emitir un certificado. CIE-10: Z02.7.',
    },
  ],
  [
    CLIN.CONDITION_CONTROL_NINO_SANO,
    {
      display: 'Control de salud de rutina del niño',
      definition:
        'Control periódico de crecimiento y desarrollo. CIE-10: Z00.1.',
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
