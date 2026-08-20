import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Clinical (08 — Core Clinical Record, Orders and Encounter
 * Logistics). Cada columna `*_concept_id` NOT NULL de los inserts del módulo
 * (estados de ciclo de vida, intención, tipo de registro, rol de participante,
 * tipo de valor de observación) toma su valor de aquí, de modo que el módulo no
 * necesita tocar el catálogo transversal ni inventar UUID sueltos.
 *
 * `seeds` (→ `CLINICAL_CONCEPT_SEEDS`) lo consume el agregador central del seed;
 * `ids` (→ `CLIN`) lo consumen los servicios (`CLIN.EPISODE_ACTIVE`, …).
 */
export const { seeds: CLINICAL_CONCEPT_SEEDS, ids: CLIN } =
  defineModuleConcepts('clinical', {
    // --- care_episodes ---------------------------------------------------------
    EPISODE_ACTIVE: { code: 'EP_ACTIVE', display: 'Care episode active' },
    EPISODE_FINISHED: { code: 'EP_FINISHED', display: 'Care episode finished' },
    EPISODE_TYPE_HOSPITALIZATION: {
      code: 'EP_HOSPITALIZATION',
      display: 'Hospitalization episode',
    },

    // --- encounters ------------------------------------------------------------
    ENCOUNTER_ARRIVED: { code: 'ENC_ARRIVED', display: 'Encounter arrived' },
    ENCOUNTER_IN_PROGRESS: {
      code: 'ENC_IN_PROGRESS',
      display: 'Encounter in progress',
    },
    ENCOUNTER_FINISHED: { code: 'ENC_FINISHED', display: 'Encounter finished' },
    ENCOUNTER_CLASS_AMBULATORY: {
      code: 'ENC_AMB',
      display: 'Ambulatory encounter class',
    },

    // --- encounter participants / locations ------------------------------------
    PARTICIPANT_ACTIVE: { code: 'PART_ACTIVE', display: 'Participant active' },
    PARTICIPANT_COMPLETED: {
      code: 'PART_COMPLETED',
      display: 'Participant completed',
    },
    PARTICIPANT_ROLE_ATTENDER: {
      code: 'PART_ATTENDER',
      display: 'Attending participant',
    },
    LOCATION_ACTIVE: {
      code: 'LOC_ACTIVE',
      display: 'Encounter location active',
    },
    LOCATION_COMPLETED: {
      code: 'LOC_COMPLETED',
      display: 'Encounter location completed',
    },

    // --- observations ----------------------------------------------------------
    OBSERVATION_PRELIMINARY: {
      code: 'OBS_PRELIMINARY',
      display: 'Observation preliminary',
    },
    OBSERVATION_FINAL: { code: 'OBS_FINAL', display: 'Observation final' },
    OBSERVATION_AMENDED: {
      code: 'OBS_AMENDED',
      display: 'Observation amended',
    },
    OBSERVATION_CORRECTED: {
      code: 'OBS_CORRECTED',
      display: 'Observation corrected',
    },
    VALUE_TYPE_QUANTITY: { code: 'VT_QUANTITY', display: 'Quantity value' },
    VALUE_TYPE_DECIMAL: { code: 'VT_DECIMAL', display: 'Decimal value' },
    VALUE_TYPE_STRING: { code: 'VT_STRING', display: 'String value' },
    VALUE_TYPE_CODEABLE: {
      code: 'VT_CODEABLE',
      display: 'Codeable concept value',
    },
    VALUE_TYPE_BOOLEAN: { code: 'VT_BOOLEAN', display: 'Boolean value' },
    PERFORMER_TYPE_PRACTITIONER: {
      code: 'PERF_PRACTITIONER',
      display: 'Practitioner performer',
    },

    // --- service_requests ------------------------------------------------------
    SERVICE_REQUEST_ACTIVE: {
      code: 'SR_ACTIVE',
      display: 'Service request active',
    },
    SERVICE_REQUEST_COMPLETED: {
      code: 'SR_COMPLETED',
      display: 'Service request completed',
    },
    SERVICE_REQUEST_INTENT_ORDER: { code: 'SR_ORDER', display: 'Order intent' },
    SERVICE_REQUEST_PRIORITY_ROUTINE: {
      code: 'SR_ROUTINE',
      display: 'Routine priority',
    },
    SERVICE_REQUEST_CATEGORY_LAB: {
      code: 'SR_LAB',
      display: 'Laboratory category',
    },

    // --- diagnostic_reports ----------------------------------------------------
    REPORT_PARTIAL: {
      code: 'DR_PARTIAL',
      display: 'Diagnostic report partial',
    },
    REPORT_PRELIMINARY: {
      code: 'DR_PRELIMINARY',
      display: 'Diagnostic report preliminary',
    },
    REPORT_FINAL: { code: 'DR_FINAL', display: 'Diagnostic report final' },
    RELEASE_HELD: { code: 'DR_HELD', display: 'Results held' },
    RELEASE_RELEASED: { code: 'DR_RELEASED', display: 'Results released' },

    // --- conditions ------------------------------------------------------------
    CONDITION_ACTIVE: { code: 'COND_ACTIVE', display: 'Condition active' },
    CONDITION_CONFIRMED: {
      code: 'COND_CONFIRMED',
      display: 'Condition confirmed',
    },
    /* Estado clínico (HL7 FHIR `Condition.clinicalStatus`), completado más allá
       de `CONDITION_ACTIVE`: hasta este patch una condición nacía activa y no
       tenía a dónde ir. `RECURRENCE`/`RELAPSE` son formas de estar activa de
       nuevo (tras `RESOLVED` o `REMISSION`, respectivamente); no son estados
       terminales por sí mismos. Ver la máquina de transiciones en
       `ConditionsService`. */
    CONDITION_INACTIVE: { code: 'COND_INACTIVE', display: 'Condition inactive' },
    CONDITION_REMISSION: {
      code: 'COND_REMISSION',
      display: 'Condition in remission',
    },
    CONDITION_RESOLVED: { code: 'COND_RESOLVED', display: 'Condition resolved' },
    CONDITION_RECURRENCE: {
      code: 'COND_RECURRENCE',
      display: 'Condition recurrence',
    },
    CONDITION_RELAPSE: { code: 'COND_RELAPSE', display: 'Condition relapse' },
    /* Curso clínico: eje distinto del estado. Decide qué transiciones son
       clínicamente válidas (una condición `CHRONIC` no pasa a `RESOLVED`) y si
       tiene sentido ofrecer una fecha esperada de resolución. No es un concepto
       de HL7 `Condition` nuclear (más cercano a la extensión `clinicalCourse`),
       así que no tiene equivalente FHIR canónico como los demás. */
    CONDITION_COURSE_ACUTE: { code: 'COND_COURSE_ACUTE', display: 'Acute' },
    CONDITION_COURSE_CHRONIC: { code: 'COND_COURSE_CHRONIC', display: 'Chronic' },
    CONDITION_COURSE_SUBACUTE: {
      code: 'COND_COURSE_SUBACUTE',
      display: 'Subacute',
    },
    CONDITION_COURSE_RECURRENT: {
      code: 'COND_COURSE_RECURRENT',
      display: 'Recurrent',
    },
    CONDITION_COURSE_UNKNOWN: {
      code: 'COND_COURSE_UNKNOWN',
      display: 'Unknown course',
    },
    CONDITION_CATEGORY_DIAGNOSIS: {
      code: 'COND_DIAGNOSIS',
      display: 'Encounter diagnosis',
    },
    CONDITION_CATEGORY_PROBLEM: {
      code: 'COND_PROBLEM',
      display: 'Problem list item',
    },
    /* Severidad y lateralidad del diagnóstico: enumeraciones cerradas (HL7
       condition-severity y lateralidad de body-site). Antes no existía ningún
       concepto de severidad ni de lateralidad en la plataforma. */
    CONDITION_SEVERITY_MILD: { code: 'COND_SEV_MILD', display: 'Mild' },
    CONDITION_SEVERITY_MODERATE: {
      code: 'COND_SEV_MODERATE',
      display: 'Moderate',
    },
    CONDITION_SEVERITY_SEVERE: { code: 'COND_SEV_SEVERE', display: 'Severe' },
    CONDITION_LATERALITY_LEFT: { code: 'COND_LAT_LEFT', display: 'Left' },
    CONDITION_LATERALITY_RIGHT: { code: 'COND_LAT_RIGHT', display: 'Right' },
    CONDITION_LATERALITY_BILATERAL: {
      code: 'COND_LAT_BILATERAL',
      display: 'Bilateral',
    },

    // --- allergy_intolerances --------------------------------------------------
    ALLERGY_ACTIVE: { code: 'ALG_ACTIVE', display: 'Allergy active' },
    ALLERGY_CONFIRMED: { code: 'ALG_CONFIRMED', display: 'Allergy confirmed' },
    ALLERGY_TYPE_ALLERGY: { code: 'ALG_TYPE', display: 'Allergy type' },
    ALLERGY_CATEGORY_MEDICATION: {
      code: 'ALG_MEDICATION',
      display: 'Medication allergy category',
    },
    ALLERGY_CRITICALITY_HIGH: { code: 'ALG_HIGH', display: 'High criticality' },

    // --- medication_requests / records -----------------------------------------
    // Máquina de estados canónica (REDESA CAN-RX-001..004):
    // DRAFT (editable/eliminable por el autor) → ISSUED (inmutable, sellada) →
    // dispensación (administer → COMPLETED). Una receta emitida NUNCA se edita:
    // corrección = REPLACED (+ nueva receta relacionada) o INVALIDATED; renovar =
    // nueva receta (RENEWED reservado para trazar la relación de renovación).
    MEDICATION_REQUEST_DRAFT: {
      code: 'MR_DRAFT',
      display: 'Medication request draft',
    },
    MEDICATION_REQUEST_ISSUED: {
      code: 'MR_ISSUED',
      display: 'Medication request issued',
    },
    MEDICATION_REQUEST_INVALIDATED: {
      code: 'MR_INVALIDATED',
      display: 'Medication request invalidated',
    },
    MEDICATION_REQUEST_REPLACED: {
      code: 'MR_REPLACED',
      display: 'Medication request replaced',
    },
    MEDICATION_REQUEST_RENEWED: {
      code: 'MR_RENEWED',
      display: 'Medication request renewed',
    },
    MEDICATION_REQUEST_ACTIVE: {
      code: 'MR_ACTIVE',
      display: 'Medication request active',
    },
    MEDICATION_REQUEST_COMPLETED: {
      code: 'MR_COMPLETED',
      display: 'Medication request completed',
    },
    MEDICATION_INTENT_ORDER: {
      code: 'MR_ORDER',
      display: 'Medication order intent',
    },
    MEDICATION_RECORD_COMPLETED: {
      code: 'MREC_COMPLETED',
      display: 'Medication record completed',
    },
    MEDICATION_RECORD_TYPE_ADMINISTRATION: {
      code: 'MREC_ADMINISTRATION',
      display: 'Medication administration',
    },

    // --- procedures ------------------------------------------------------------
    PROCEDURE_COMPLETED: {
      code: 'PROC_COMPLETED',
      display: 'Procedure completed',
    },
    PROCEDURE_CATEGORY_SURGICAL: {
      code: 'PROC_SURGICAL',
      display: 'Surgical procedure',
    },
    PROCEDURE_OUTCOME_SUCCESSFUL: {
      code: 'PROC_SUCCESSFUL',
      display: 'Successful outcome',
    },

    // --- immunizations ---------------------------------------------------------
    IMMUNIZATION_COMPLETED: {
      code: 'IMM_COMPLETED',
      display: 'Immunization completed',
    },

    // --- appointments (referenciado por check-in) ------------------------------
    /**
     * Turno pedido por el paciente y todavía sin aceptar (FHIR `pending`).
     *
     * Nace con la solicitud (corrección #11): la cita clínica existe desde el
     * primer momento para que el turno tenga a qué colgarse, pero decir que está
     * `booked` antes de que el profesional la acepte sería afirmar un compromiso
     * que nadie tomó. La acepta el profesional y recién ahí pasa a `booked`.
     */
    APPOINTMENT_PENDING: {
      code: 'APPT_PENDING',
      display: 'Appointment pending confirmation',
    },
    APPOINTMENT_BOOKED: { code: 'APPT_BOOKED', display: 'Appointment booked' },
    APPOINTMENT_CHECKED_IN: {
      code: 'APPT_CHECKED_IN',
      display: 'Appointment checked in',
    },
    /**
     * La atención ocurrió (FHIR `fulfilled`).
     *
     * Sin este estado, una cita atendida se quedaba en `booked` para siempre y
     * la historia del paciente no podía distinguir el turno que se cumplió del
     * que nadie tocó.
     */
    APPOINTMENT_FULFILLED: {
      code: 'APPT_FULFILLED',
      display: 'Appointment fulfilled',
    },
    /** El turno no va a ocurrir: lo canceló alguna de las dos partes. */
    APPOINTMENT_CANCELLED: {
      code: 'APPT_CANCELLED',
      display: 'Appointment cancelled',
    },

    /* --- vademécum inicial de la receta ---------------------------------------
       ⚠️ CATÁLOGO INICIAL, NO UN VADEMÉCUM. Estos doce fármacos existen para que
       `clinical.medication_requests.medication_concept_id` tenga un conjunto de
       valores al que amarrarse: sin binding, el selector de la ficha queda
       deshabilitado y no se puede prescribir. Antes no había NINGÚN concepto de
       medicamento en la plataforma.

       Un despliegue real reemplaza esto por el vademécum que corresponda —el
       formulario nacional, o ATC completo cargado por el módulo de terminología—
       y esa carga es de datos, no de código: se publica una versión nueva del
       conjunto `medication` y el binding la sigue sin tocar nada de aquí.

       Los códigos son ATC reales (OMS), no inventados, para que la sustitución
       por un catálogo completo sea un superconjunto y no un renombrado. */
    MEDICATION_PARACETAMOL: { code: 'N02BE01', display: 'Paracetamol' },
    MEDICATION_IBUPROFENO: { code: 'M01AE01', display: 'Ibuprofeno' },
    MEDICATION_AMOXICILINA: { code: 'J01CA04', display: 'Amoxicilina' },
    MEDICATION_AZITROMICINA: { code: 'J01FA10', display: 'Azitromicina' },
    MEDICATION_CEFALEXINA: { code: 'J01DB01', display: 'Cefalexina' },
    MEDICATION_OMEPRAZOL: { code: 'A02BC01', display: 'Omeprazol' },
    MEDICATION_METFORMINA: { code: 'A10BA02', display: 'Metformina' },
    MEDICATION_LOSARTAN: { code: 'C09CA01', display: 'Losartán' },
    MEDICATION_ENALAPRIL: { code: 'C09AA02', display: 'Enalapril' },
    MEDICATION_ATORVASTATINA: { code: 'C10AA05', display: 'Atorvastatina' },
    MEDICATION_SALBUTAMOL: { code: 'R03AC02', display: 'Salbutamol' },
    MEDICATION_LORATADINA: { code: 'R06AX13', display: 'Loratadina' },

    /* --- vía de administración ------------------------------------------------
       Éstas sí son una enumeración cerrada de verdad, y las seis cubren la
       práctica ambulatoria. Los códigos siguen la vía de administración de HL7
       (`route-codes`). */
    MEDICATION_ROUTE_ORAL: { code: 'ROUTE_ORAL', display: 'Oral route' },
    MEDICATION_ROUTE_INTRAVENOUS: {
      code: 'ROUTE_IV',
      display: 'Intravenous route',
    },
    MEDICATION_ROUTE_INTRAMUSCULAR: {
      code: 'ROUTE_IM',
      display: 'Intramuscular route',
    },
    MEDICATION_ROUTE_SUBCUTANEOUS: {
      code: 'ROUTE_SC',
      display: 'Subcutaneous route',
    },
    MEDICATION_ROUTE_TOPICAL: { code: 'ROUTE_TOP', display: 'Topical route' },
    MEDICATION_ROUTE_INHALATION: {
      code: 'ROUTE_INH',
      display: 'Inhalation route',
    },

    /* --- unidad de la cantidad prescrita --------------------------------------
       Códigos UCUM, que es lo que el contrato de cantidad espera. Las de forma
       farmacéutica van entre llaves porque UCUM las declara como anotaciones sin
       dimensión: un comprimido no es una magnitud, es una cuenta. */
    MEDICATION_UNIT_MILLIGRAM: { code: 'UNIT_mg', display: 'Milligram' },
    MEDICATION_UNIT_GRAM: { code: 'UNIT_g', display: 'Gram' },
    MEDICATION_UNIT_MILLILITRE: { code: 'UNIT_mL', display: 'Millilitre' },
    MEDICATION_UNIT_TABLET: { code: 'UNIT_{tablet}', display: 'Tablet' },
    MEDICATION_UNIT_CAPSULE: { code: 'UNIT_{capsule}', display: 'Capsule' },
    MEDICATION_UNIT_DROP: { code: 'UNIT_[drp]', display: 'Drop' },

    /* --- nosología inicial del diagnóstico -------------------------------------
       ⚠️ CATÁLOGO INICIAL, NO UNA NOSOLOGÍA. Mismo criterio y mismas razones que
       el vademécum de arriba: estos doce diagnósticos existen para que
       `clinical.conditions.code_concept_id` tenga un conjunto de valores al que
       amarrarse — sin binding, el selector de la ficha queda deshabilitado y el
       médico no puede registrar un diagnóstico. Antes no había NINGÚN concepto de
       diagnóstico en la plataforma.

       Un despliegue real reemplaza esto por la clasificación que corresponda
       (CIE-10 completa o SNOMED CT, cargada por el módulo de terminología) y esa
       carga es de datos, no de código: se publica una versión nueva del conjunto
       `condition-code` y el binding la sigue sin tocar nada de aquí.

       Los códigos son CIE-10 reales (OMS), no inventados, para que la
       sustitución por la clasificación completa sea un superconjunto y no un
       renombrado. Los doce cubren la consulta ambulatoria más frecuente. */
    CONDITION_HIPERTENSION: { code: 'I10', display: 'Hipertensión esencial' },
    CONDITION_DIABETES_TIPO_2: {
      code: 'E11.9',
      display: 'Diabetes mellitus tipo 2',
    },
    CONDITION_IRA_ALTA: {
      code: 'J06.9',
      display: 'Infección aguda de las vías respiratorias superiores',
    },
    CONDITION_LUMBALGIA: { code: 'M54.5', display: 'Lumbalgia' },
    CONDITION_MIGRANA: { code: 'G43.9', display: 'Migraña' },
    CONDITION_GASTRITIS: { code: 'K29.7', display: 'Gastritis' },
    CONDITION_ASMA: { code: 'J45.9', display: 'Asma' },
    CONDITION_ANEMIA_FERROPENICA: {
      code: 'D50.9',
      display: 'Anemia ferropénica',
    },
    CONDITION_INFECCION_URINARIA: {
      code: 'N39.0',
      display: 'Infección de las vías urinarias',
    },
    CONDITION_DERMATITIS_ATOPICA: {
      code: 'L20.9',
      display: 'Dermatitis atópica',
    },
    CONDITION_HIPOTIROIDISMO: { code: 'E03.9', display: 'Hipotiroidismo' },
    CONDITION_ANSIEDAD_GENERALIZADA: {
      code: 'F41.1',
      display: 'Trastorno de ansiedad generalizada',
    },
  });
