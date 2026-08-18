import { defineModuleConcepts } from '../../common/seed/concept-seed';
import { CLIN } from '../clinical/clinical.concepts';

/**
 * Conceptos propios del módulo Diagnostics (20 — laboratorio, imagen médica y
 * media clínica). Cada estado/tipo/resultado que los servicios fijan en una
 * columna `*_concept_id` NOT NULL sale de aquí; los valores que aporta el cliente
 * (código de prueba, tipo de espécimen, modalidad, formato de mensaje, etc.) se
 * reciben por DTO y no se declaran en este catálogo.
 *
 * El prefijo `diagnostics` espacia las claves para derivar UUIDv5 sin colisionar
 * con otros módulos. `DIAGNOSTICS_CONCEPT_SEEDS` lo consume el agregador central
 * (lo cablea el orquestador); `DIAG` lo consumen servicios y smoke.
 */
export const { seeds: DIAGNOSTICS_CONCEPT_SEEDS, ids: DIAG } =
  defineModuleConcepts('diagnostics', {
    // --- Ciclo de vida del espécimen (specimens.status_concept_id) ---
    SPECIMEN_COLLECTED: {
      code: 'SPEC_COLLECTED',
      display: 'Specimen collected',
    },
    SPECIMEN_RECEIVED: { code: 'SPEC_RECEIVED', display: 'Specimen received' },
    SPECIMEN_REJECTED: { code: 'SPEC_REJECTED', display: 'Specimen rejected' },

    // --- Acesión de laboratorio (laboratory_accessions.status_concept_id) ---
    ACCESSION_RECEIVED: { code: 'ACC_RECEIVED', display: 'Accession received' },
    ACCESSION_IN_PROCESS: {
      code: 'ACC_IN_PROCESS',
      display: 'Accession in process',
    },

    // --- Item de acesión (accession_specimens.status_concept_id) ---
    ACCESSION_ITEM_RECEIVED: {
      code: 'ACC_ITEM_RECEIVED',
      display: 'Accession item received',
    },
    ACCESSION_ITEM_REJECTED: {
      code: 'ACC_ITEM_REJECTED',
      display: 'Accession item rejected',
    },

    // --- Prioridad genérica (priority_concept_id) ---
    PRIORITY_ROUTINE: { code: 'PRIORITY_ROUTINE', display: 'Routine priority' },

    // --- Categoría de la orden diagnóstica (service_requests.category_concept_id) ---
    // `clinical` ya declara la de laboratorio (`SERVICE_REQUEST_CATEGORY_LAB`);
    // la de imagenología faltaba, y sin ella una radiografía sólo se podía pedir
    // como orden sin categoría — indistinguible de una derivación.
    //
    // Se declara acá y no en `clinical.concepts.ts` porque es exactamente para
    // lo que `defineModuleConcepts` espacia las claves por módulo: agregar un
    // concepto sin tocar un archivo compartido. El UUID sale de la clave
    // `diagnostics:SERVICE_REQUEST_CATEGORY_IMAGING`, así que no colisiona con
    // ninguno de `clinical`.
    SERVICE_REQUEST_CATEGORY_IMAGING: {
      code: 'SR_IMAGING',
      display: 'Imaging category',
    },

    // --- Cadena de custodia (specimen_chain_of_custody_events.custody_event_type_concept_id) ---
    CUSTODY_RECEPTION: {
      code: 'CUSTODY_RECEPTION',
      display: 'Custody reception',
    },
    CUSTODY_TRANSFER: { code: 'CUSTODY_TRANSFER', display: 'Custody transfer' },

    // --- Contenedor (specimen_containers.status_concept_id / container events) ---
    CONTAINER_ACTIVE: { code: 'CONTAINER_ACTIVE', display: 'Container active' },
    CONTAINER_IN_TRANSIT: {
      code: 'CONTAINER_IN_TRANSIT',
      display: 'Container in transit',
    },
    CONTAINER_STORED: { code: 'CONTAINER_STORED', display: 'Container stored' },
    CONTAINER_EVENT_TRANSFER: {
      code: 'CONTAINER_EVT_TRANSFER',
      display: 'Container transfer event',
    },

    // --- Motivo de rechazo por defecto (specimen_rejection_events) ---
    REJECTION_REASON_QUALITY: {
      code: 'REJECTION_QUALITY',
      display: 'Rejected for quality (hemolysis/volume)',
    },

    // --- Orden de trabajo (laboratory_work_orders.status_concept_id) ---
    WORK_ORDER_OPEN: { code: 'WO_OPEN', display: 'Work order open' },

    // --- Prueba de la orden (laboratory_work_order_tests.status_concept_id) ---
    TEST_PENDING: { code: 'TEST_PENDING', display: 'Test pending' },
    TEST_PRELIMINARY: {
      code: 'TEST_PRELIMINARY',
      display: 'Test preliminary result',
    },
    TEST_VERIFIED: { code: 'TEST_VERIFIED', display: 'Test verified' },
    TEST_CANCELLED: { code: 'TEST_CANCELLED', display: 'Test cancelled' },
    TEST_REPORTED: { code: 'TEST_REPORTED', display: 'Test reported' },

    // --- Corrida de analizador (analyzer_runs.status_concept_id) ---
    ANALYZER_RUN_OPEN: { code: 'RUN_OPEN', display: 'Analyzer run open' },
    ANALYZER_RUN_CLOSED: { code: 'RUN_CLOSED', display: 'Analyzer run closed' },

    // --- Mensaje de resultado (analyzer_result_messages) ---
    MESSAGE_FORMAT_HL7: { code: 'MSG_HL7', display: 'HL7/ASTM message format' },
    MESSAGE_VALIDATED: { code: 'MSG_VALIDATED', display: 'Message validated' },

    // --- Verificación de resultado (result_verifications) ---
    VERIFIABLE_OBSERVATION: {
      code: 'VERIFIABLE_OBSERVATION',
      display: 'Verifiable observation',
    },
    VERIFICATION_TECHNICAL: {
      code: 'VERIF_TECHNICAL',
      display: 'Technical verification level',
    },
    VERIFICATION_MEDICAL: {
      code: 'VERIF_MEDICAL',
      display: 'Faculty verification level',
    },
    VERIFICATION_ACCEPTED: {
      code: 'VERIF_ACCEPTED',
      display: 'Verification accepted',
    },

    // --- Informe diagnóstico (diagnostic_report_versions.clinical_status_concept_id) ---
    REPORT_PRELIMINARY: {
      code: 'REPORT_PRELIMINARY',
      display: 'Report preliminary',
    },
    REPORT_FINAL: { code: 'REPORT_FINAL', display: 'Report final' },
    RELEASE_ELIGIBLE: { code: 'RELEASE_ELIGIBLE', display: 'Release eligible' },

    // --- Liberación (diagnostic_release_events) ---
    RELEASE_ACTION_RELEASE: {
      code: 'RELEASE_ACTION',
      display: 'Release action',
    },
    VISIBILITY_PATIENT_VISIBLE: {
      code: 'PATIENT_VISIBLE',
      display: 'Visible to patient',
    },
    VISIBILITY_PATIENT_HIDDEN: {
      code: 'PATIENT_HIDDEN',
      display: 'Hidden from patient',
    },

    // --- Resultado crítico (critical_result_notifications) ---
    CRITICALITY_CRITICAL: {
      code: 'CRITICALITY_CRITICAL',
      display: 'Critical value',
    },
    CRITICAL_PENDING: {
      code: 'CRITICAL_PENDING',
      display: 'Critical notification pending',
    },
    CRITICAL_ACKNOWLEDGED: {
      code: 'CRITICAL_ACK',
      display: 'Critical notification acknowledged',
    },
    CRITICAL_ESCALATED: {
      code: 'CRITICAL_ESCALATED',
      display: 'Critical notification escalated',
    },

    // --- Imagen: endpoint DICOM (imaging_endpoints) ---
    IMAGING_ENDPOINT_STOW: {
      code: 'ENDPOINT_STOW',
      display: 'STOW-RS endpoint type',
    },
    IMAGING_ENDPOINT_ACTIVE: {
      code: 'ENDPOINT_ACTIVE',
      display: 'Imaging endpoint active',
    },

    // --- Imagen: estudio/serie/instancia (imaging_studies, series, instances) ---
    IMAGING_STUDY_STORED: {
      code: 'STUDY_STORED',
      display: 'Imaging study stored',
    },
    IMAGING_MODALITY_OTHER: {
      code: 'MODALITY_OTHER',
      display: 'Imaging modality (unspecified)',
    },
    SOP_CLASS_OTHER: {
      code: 'SOP_CLASS_OTHER',
      display: 'SOP class (unspecified)',
    },
    OBJECT_LOCATION_ACTIVE: {
      code: 'OBJLOC_ACTIVE',
      display: 'Object location active',
    },
    PROCEDURE_STEP_COMPLETED: {
      code: 'MPPS_COMPLETED',
      display: 'Procedure step completed',
    },

    // --- Media clínica (clinical_media, media_annotations) ---
    MEDIA_TYPE_PHOTO: { code: 'MEDIA_PHOTO', display: 'Clinical photograph' },
    MEDIA_STATUS_ACTIVE: {
      code: 'MEDIA_ACTIVE',
      display: 'Clinical media active',
    },
    ANNOTATION_TYPE_MANUAL: {
      code: 'ANNOTATION_MANUAL',
      display: 'Manual annotation',
    },
    ANNOTATION_STATUS_ACTIVE: {
      code: 'ANNOTATION_ACTIVE',
      display: 'Annotation active',
    },

    // --- Dosis de radiación (radiation_dose_events.unit_concept_id) ---
    DOSE_UNIT_MGYCM: { code: 'DOSE_UNIT_MGYCM', display: 'Dose unit (mGy·cm)' },

    // --- Calidad de datos y provenance (diagnostic_data_quality_events / links) ---
    DQ_TARGET_SPECIMEN: {
      code: 'DQ_TARGET_SPECIMEN',
      display: 'Data-quality target: specimen',
    },
    DQ_SEVERITY_WARNING: {
      code: 'DQ_SEVERITY_WARNING',
      display: 'Data-quality warning',
    },
    DQ_OPEN: { code: 'DQ_OPEN', display: 'Data-quality event open' },
    DQ_RESOLVED: {
      code: 'DQ_RESOLVED',
      display: 'Data-quality event resolved',
    },
    PROVENANCE_TARGET: { code: 'PROV_TARGET', display: 'Provenance target' },
    PROVENANCE_SOURCE: { code: 'PROV_SOURCE', display: 'Provenance source' },
    PROVENANCE_DERIVATION: {
      code: 'PROV_DERIVATION',
      display: 'Provenance derivation activity',
    },
  });

/**
 * Las categorías de `service_requests` que forman el circuito diagnóstico.
 *
 * Laboratorio la declara `clinical` (es suya desde antes); imagenología la
 * declara este módulo. Son las dos únicas: si mañana aparece otra, se agrega
 * acá y **las dos lecturas** —la del personal y la del portal del paciente— la
 * muestran sin cambiar nada más.
 *
 * Vive en el catálogo y no en un servicio porque tiene dos consumidores:
 * `DiagnosticsOrdersService` (mostrador) y `DiagnosticsPatientResultsService`
 * (portal). Cuando estaba declarada en cada uno, agregar una categoría exigía
 * tocar dos lugares y olvidarse de uno dejaba una pantalla mostrando menos que
 * la otra, en silencio.
 */
export const CATEGORIAS_DIAGNOSTICAS: readonly string[] = [
  CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
];
