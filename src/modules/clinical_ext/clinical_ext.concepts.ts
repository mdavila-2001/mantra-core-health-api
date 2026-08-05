import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Clinical-Ext (18 — Care Coordination, Alerts and Decision
 * Support). Cada columna `*_concept_id` NOT NULL que insertan los servicios del
 * módulo (estado de equipo/miembro, ciclo de vida de regla CDS, tipo/estado de
 * alerta, estado de order set, estado de referencia, estado de brecha de cuidado,
 * estado de encuentro virtual, estado de calendario de inmunización) toma su valor
 * de aquí. Así el módulo no toca el catálogo transversal ni inventa UUID sueltos.
 *
 * `seeds` (→ `CLINICAL_EXT_CONCEPT_SEEDS`) lo consume el agregador central del
 * seed; `ids` (→ `CEXT`) lo consumen los servicios (`CEXT.CARE_TEAM_ACTIVE`, …).
 */
export const { seeds: CLINICAL_EXT_CONCEPT_SEEDS, ids: CEXT } =
  defineModuleConcepts('clinical_ext', {
    // --- care_teams / care_team_members --------------------------------------
    CARE_TEAM_ACTIVE: { code: 'CT_ACTIVE', display: 'Care team active' },
    CARE_TEAM_CATEGORY_LONGITUDINAL: {
      code: 'CT_LONGITUDINAL',
      display: 'Longitudinal care team',
    },
    MEMBER_ACTIVE: { code: 'CTM_ACTIVE', display: 'Care team member active' },
    MEMBER_ROLE_ATTENDER: {
      code: 'CTM_ATTENDER',
      display: 'Attending member role',
    },

    // --- cds_rules -----------------------------------------------------------
    CDS_RULE_DRAFT: { code: 'CDS_DRAFT', display: 'CDS rule draft' },
    CDS_RULE_ACTIVE: { code: 'CDS_ACTIVE', display: 'CDS rule active' },
    CDS_RULE_RETIRED: { code: 'CDS_RETIRED', display: 'CDS rule retired' },
    CDS_RULE_TYPE_ALERT: {
      code: 'CDS_TYPE_ALERT',
      display: 'Alert-type CDS rule',
    },

    // --- severity (compartida por reglas, alertas e interacciones) -----------
    SEVERITY_HIGH: { code: 'SEV_HIGH', display: 'High severity' },
    SEVERITY_MODERATE: { code: 'SEV_MODERATE', display: 'Moderate severity' },
    SEVERITY_LOW: { code: 'SEV_LOW', display: 'Low severity' },

    // --- clinical_alerts -----------------------------------------------------
    ALERT_ACTIVE: { code: 'ALRT_ACTIVE', display: 'Clinical alert active' },
    ALERT_ACKNOWLEDGED: {
      code: 'ALRT_ACK',
      display: 'Clinical alert acknowledged',
    },
    ALERT_OVERRIDDEN: {
      code: 'ALRT_OVERRIDDEN',
      display: 'Clinical alert overridden',
    },
    ALERT_TYPE_CDS: { code: 'ALRT_CDS', display: 'CDS alert' },
    ALERT_TYPE_DRUG_INTERACTION: {
      code: 'ALRT_DDI',
      display: 'Drug-drug interaction alert',
    },
    TRIGGER_CLINICAL_EVENT: {
      code: 'TRG_CLINICAL',
      display: 'Clinical event trigger',
    },

    // --- order_sets ----------------------------------------------------------
    ORDER_SET_ACTIVE: { code: 'OS_ACTIVE', display: 'Order set active' },
    ORDER_ITEM_TYPE_MEDICATION: {
      code: 'OSI_MEDICATION',
      display: 'Medication order item',
    },
    ORDER_ITEM_TYPE_SERVICE: {
      code: 'OSI_SERVICE',
      display: 'Service order item',
    },

    // --- referrals -----------------------------------------------------------
    REFERRAL_REQUESTED: {
      code: 'REF_REQUESTED',
      display: 'Referral requested',
    },
    REFERRAL_ACCEPTED: { code: 'REF_ACCEPTED', display: 'Referral accepted' },
    REFERRAL_REJECTED: { code: 'REF_REJECTED', display: 'Referral rejected' },
    REFERRAL_PRIORITY_ROUTINE: {
      code: 'REF_ROUTINE',
      display: 'Routine referral priority',
    },

    // --- care_gaps -----------------------------------------------------------
    CARE_GAP_OPEN: { code: 'GAP_OPEN', display: 'Care gap open' },
    CARE_GAP_CLOSED: { code: 'GAP_CLOSED', display: 'Care gap closed' },
    GAP_TYPE_IMMUNIZATION: {
      code: 'GAP_IMMUNIZATION',
      display: 'Immunization gap',
    },
    GAP_TYPE_MEASURE: { code: 'GAP_MEASURE', display: 'Quality measure gap' },

    // --- immunization_schedules ----------------------------------------------
    IMMUNIZATION_SCHEDULE_ACTIVE: {
      code: 'IMMS_ACTIVE',
      display: 'Immunization schedule active',
    },

    // --- virtual_encounters --------------------------------------------------
    VIRTUAL_ENCOUNTER_SCHEDULED: {
      code: 'VENC_SCHEDULED',
      display: 'Virtual encounter scheduled',
    },
    VIRTUAL_ENCOUNTER_IN_PROGRESS: {
      code: 'VENC_IN_PROGRESS',
      display: 'Virtual encounter in progress',
    },
    VIRTUAL_ENCOUNTER_COMPLETED: {
      code: 'VENC_COMPLETED',
      display: 'Virtual encounter completed',
    },
  });
