import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Chart (15 — Versioned Patient Chart, Notes and Documents).
 *
 * Cada columna `*_concept_id` NOT NULL de los inserts del módulo (estados del
 * ciclo de vida de la nota y de sus versiones, tipos de firma, acciones y
 * visibilidad de liberación, estados de plan de cuidado y de sus actividades,
 * categorías de documento y roles de archivo, estado de asignación de plantilla)
 * toma su valor de aquí, de modo que el módulo no necesita tocar el catálogo
 * transversal ni inventar UUID sueltos. También se declaran valores "por defecto"
 * para columnas FK enforced que el cliente puede no aportar (p. ej. el sistema
 * corporal de un hallazgo, la categoría de un documento o el concepto de una
 * actividad) para que el happy-path pueda persistir sin violar la FK.
 *
 * `seeds` (→ `CHART_CONCEPT_SEEDS`) lo consume el agregador central del seed;
 * `ids` (→ `CHART`) lo consumen los servicios (`CHART.NOTE_LIFECYCLE_DRAFT`, …).
 */
export const { seeds: CHART_CONCEPT_SEEDS, ids: CHART } = defineModuleConcepts(
  'chart',
  {
    // --- clinical_note_headers: tipo y ciclo de vida ---------------------------
    NOTE_TYPE_PROGRESS: {
      code: 'PROGRESS_NOTE',
      display: 'Progress note type',
    },
    NOTE_LIFECYCLE_DRAFT: {
      code: 'NOTE_LC_DRAFT',
      display: 'Clinical note draft',
    },
    NOTE_LIFECYCLE_SIGNED: {
      code: 'NOTE_LC_SIGNED',
      display: 'Clinical note signed',
    },
    NOTE_LIFECYCLE_AMENDED: {
      code: 'NOTE_LC_AMENDED',
      display: 'Clinical note amended',
    },

    // --- clinical_note_headers: estado de liberación al paciente ---------------
    RELEASE_NOT_RELEASED: {
      code: 'PREL_NOT_RELEASED',
      display: 'Not released to patient',
    },
    RELEASE_RELEASED: { code: 'PREL_RELEASED', display: 'Released to patient' },
    RELEASE_WITHHELD: {
      code: 'PREL_WITHHELD',
      display: 'Withheld from patient',
    },

    // --- clinical_note_versions: estado y elegibilidad -------------------------
    VERSION_DRAFT: { code: 'NVER_DRAFT', display: 'Note version draft' },
    VERSION_SIGNED: { code: 'NVER_SIGNED', display: 'Note version signed' },
    VERSION_COSIGNED: {
      code: 'NVER_COSIGNED',
      display: 'Note version cosigned',
    },
    ELIGIBILITY_ELIGIBLE: {
      code: 'RELIG_ELIGIBLE',
      display: 'Eligible for release',
    },
    AMENDMENT_REASON_CORRECTION: {
      code: 'AMEND_CORRECTION',
      display: 'Amendment: correction',
    },

    // --- clinical_note_signatures: tipo de firma -------------------------------
    SIGNATURE_AUTHOR: { code: 'SIG_AUTHOR', display: 'Author signature' },
    SIGNATURE_COSIGN: { code: 'SIG_COSIGN', display: 'Cosignature' },

    // --- note_release_events: acción y visibilidad resultante ------------------
    RELEASE_ACTION_RELEASE: {
      code: 'NREL_ACT_RELEASE',
      display: 'Release action',
    },
    RELEASE_ACTION_WITHHOLD: {
      code: 'NREL_ACT_WITHHOLD',
      display: 'Withhold action',
    },
    VISIBILITY_PATIENT_VISIBLE: {
      code: 'VIS_PATIENT',
      display: 'Patient visible',
    },
    VISIBILITY_PROVIDER_ONLY: {
      code: 'VIS_PROVIDER',
      display: 'Provider only',
    },
    WITHHOLD_REASON_LEGAL: {
      code: 'WH_REASON_LEGAL',
      display: 'Withhold reason: legal hold',
    },

    // --- physical_exam_findings: sistema corporal por defecto ------------------
    EXAM_BODY_SYSTEM_GENERAL: {
      code: 'EXAM_SYS_GENERAL',
      display: 'General body system',
    },

    // --- care_plans: estado e intención ----------------------------------------
    CAREPLAN_ACTIVE: { code: 'CP_ACTIVE', display: 'Care plan active' },
    CAREPLAN_COMPLETED: {
      code: 'CP_COMPLETED',
      display: 'Care plan completed',
    },
    CAREPLAN_INTENT_PLAN: {
      code: 'CP_INTENT_PLAN',
      display: 'Care plan intent: plan',
    },

    // --- care_plan_activities: concepto por defecto y estados ------------------
    ACTIVITY_DEFAULT: {
      code: 'CPACT_GENERAL',
      display: 'General care plan activity',
    },
    ACTIVITY_SCHEDULED: {
      code: 'CPACT_SCHEDULED',
      display: 'Activity scheduled',
    },
    ACTIVITY_IN_PROGRESS: {
      code: 'CPACT_IN_PROGRESS',
      display: 'Activity in progress',
    },
    ACTIVITY_COMPLETED: {
      code: 'CPACT_COMPLETED',
      display: 'Activity completed',
    },
    ACTIVITY_CANCELLED: {
      code: 'CPACT_CANCELLED',
      display: 'Activity cancelled',
    },

    // --- document_records / document_record_files ------------------------------
    DOC_CATEGORY_GENERAL: {
      code: 'DOC_CAT_GENERAL',
      display: 'General document category',
    },
    DOC_STATUS_ACTIVE: { code: 'DOC_ACTIVE', display: 'Document active' },
    DOC_CONFIDENTIALITY_NORMAL: {
      code: 'DOC_CONF_NORMAL',
      display: 'Document confidentiality normal',
    },
    CONTENT_ROLE_PRIMARY: {
      code: 'DOCF_PRIMARY',
      display: 'Primary file content role',
    },
    CONTENT_ROLE_ATTACHMENT: {
      code: 'DOCF_ATTACHMENT',
      display: 'Attachment file content role',
    },

    // --- chart_template_assignments --------------------------------------------
    ASSIGNMENT_ACTIVE: {
      code: 'TASSIGN_ACTIVE',
      display: 'Template assignment active',
    },
  },
);
