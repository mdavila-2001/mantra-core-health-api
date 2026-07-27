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
    CONDITION_CATEGORY_DIAGNOSIS: {
      code: 'COND_DIAGNOSIS',
      display: 'Encounter diagnosis',
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
    APPOINTMENT_BOOKED: { code: 'APPT_BOOKED', display: 'Appointment booked' },
    APPOINTMENT_CHECKED_IN: {
      code: 'APPT_CHECKED_IN',
      display: 'Appointment checked in',
    },
  });
