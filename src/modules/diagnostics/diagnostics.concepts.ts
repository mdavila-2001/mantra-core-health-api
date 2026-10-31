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

    // --- Tipo de espécimen (specimens.specimen_type_concept_id) ---
    // Recepción de muestras: hasta acá el DTO pedía un uuid que nada sembraba.
    // Los códigos son los de la tabla HL7 v2-0487 (Specimen Type), salvo
    // `UR24`, que es de este proyecto: la tabla modela la orina de 24 horas
    // como `UR` con período de recolección, y en el mostrador es otra muestra
    // (otro frasco, otra instrucción al paciente).
    SPECIMEN_TYPE_BLOOD_VENOUS: {
      code: 'BLDV',
      display: 'Venous blood (whole blood)',
    },
    SPECIMEN_TYPE_BLOOD_ARTERIAL: { code: 'BLDA', display: 'Arterial blood' },
    SPECIMEN_TYPE_BLOOD_CAPILLARY: {
      code: 'BLDC',
      display: 'Capillary blood',
    },
    SPECIMEN_TYPE_SERUM: { code: 'SER', display: 'Serum' },
    SPECIMEN_TYPE_PLASMA: { code: 'PLAS', display: 'Plasma' },
    SPECIMEN_TYPE_URINE: { code: 'UR', display: 'Urine (random sample)' },
    SPECIMEN_TYPE_URINE_24H: { code: 'UR24', display: '24-hour urine' },
    SPECIMEN_TYPE_STOOL: { code: 'STL', display: 'Stool' },
    SPECIMEN_TYPE_CSF: { code: 'CSF', display: 'Cerebrospinal fluid' },
    SPECIMEN_TYPE_SPUTUM: { code: 'SPT', display: 'Sputum' },
    SPECIMEN_TYPE_THROAT_SWAB: { code: 'THRT', display: 'Throat swab' },
    // Las muestras que completan el mostrador de un laboratorio boliviano:
    // microbiología (herida, pus, secreciones genitales, ótica y conjuntival,
    // hisopado nasal), líquidos de punción (sinovial, pleural, ascítico,
    // amniótico), hematología y patología (médula ósea, tejido), micología
    // (piel, uña), el contenido gástrico de la baciloscopía pediátrica, semen,
    // leche materna, saliva y cálculos. Códigos de HL7 v2-0487, salvo `NPSWAB`,
    // que es de este proyecto por la misma razón que `UR24`: el hisopado
    // nasofaríngeo es otra toma —otro hisopo, otra técnica— que el nasal.
    SPECIMEN_TYPE_URINE_CLEAN_CATCH: {
      code: 'URC',
      display: 'Urine (clean catch, midstream)',
    },
    SPECIMEN_TYPE_URINE_CATHETER: {
      code: 'URT',
      display: 'Urine (catheter)',
    },
    SPECIMEN_TYPE_NASAL_SWAB: { code: 'NOS', display: 'Nasal swab' },
    SPECIMEN_TYPE_NASOPHARYNGEAL_SWAB: {
      code: 'NPSWAB',
      display: 'Nasopharyngeal swab',
    },
    SPECIMEN_TYPE_GASTRIC_CONTENT: {
      code: 'GAST',
      display: 'Gastric fluid/contents',
    },
    SPECIMEN_TYPE_WOUND: { code: 'WND', display: 'Wound' },
    SPECIMEN_TYPE_PUS: { code: 'PUS', display: 'Pus' },
    SPECIMEN_TYPE_VAGINAL: { code: 'GENV', display: 'Vaginal secretion' },
    SPECIMEN_TYPE_CERVIX: {
      code: 'CVX',
      display: 'Cervix (endocervical sample)',
    },
    SPECIMEN_TYPE_URETHRA: { code: 'URTH', display: 'Urethral secretion' },
    SPECIMEN_TYPE_SEMEN: { code: 'SEM', display: 'Seminal fluid' },
    SPECIMEN_TYPE_EAR: { code: 'EAR', display: 'Ear secretion' },
    SPECIMEN_TYPE_EYE: { code: 'EYE', display: 'Eye (conjunctival) secretion' },
    SPECIMEN_TYPE_SYNOVIAL_FLUID: {
      code: 'SNV',
      display: 'Synovial fluid (joint fluid)',
    },
    SPECIMEN_TYPE_PLEURAL_FLUID: { code: 'PLR', display: 'Pleural fluid' },
    SPECIMEN_TYPE_PERITONEAL_FLUID: {
      code: 'PRT',
      display: 'Peritoneal fluid / ascites',
    },
    SPECIMEN_TYPE_AMNIOTIC_FLUID: { code: 'AMN', display: 'Amniotic fluid' },
    SPECIMEN_TYPE_BONE_MARROW: { code: 'MAR', display: 'Bone marrow' },
    SPECIMEN_TYPE_TISSUE: { code: 'TISS', display: 'Tissue (biopsy)' },
    SPECIMEN_TYPE_SKIN: { code: 'SKN', display: 'Skin scraping' },
    SPECIMEN_TYPE_NAIL: { code: 'NAIL', display: 'Nail' },
    SPECIMEN_TYPE_BREAST_MILK: { code: 'MILK', display: 'Breast milk' },
    SPECIMEN_TYPE_SALIVA: { code: 'SAL', display: 'Saliva' },
    SPECIMEN_TYPE_CALCULUS: { code: 'CALC', display: 'Calculus (stone)' },

    // --- Tipo de contenedor (specimen_containers / specimens.container_type_concept_id) ---
    // Tubos por color de tapa según la convención ISO 6710 que usan los
    // fabricantes de tubos al vacío: el color dice el aditivo, y el aditivo
    // dice para qué sirve la muestra.
    CONTAINER_TYPE_TUBE_LAVENDER_EDTA: {
      code: 'TUBE_LAVENDER_EDTA',
      display: 'Lavender-top tube (K2/K3 EDTA)',
    },
    CONTAINER_TYPE_TUBE_LIGHT_BLUE_CITRATE: {
      code: 'TUBE_LIGHT_BLUE_CITRATE',
      display: 'Light blue-top tube (3.2% sodium citrate)',
    },
    CONTAINER_TYPE_TUBE_RED_PLAIN: {
      code: 'TUBE_RED_PLAIN',
      display: 'Red-top tube (no additive / clot activator)',
    },
    CONTAINER_TYPE_TUBE_GOLD_SST: {
      code: 'TUBE_GOLD_SST',
      display: 'Gold-top tube (serum separator gel)',
    },
    CONTAINER_TYPE_TUBE_GREEN_HEPARIN: {
      code: 'TUBE_GREEN_HEPARIN',
      display: 'Green-top tube (lithium heparin)',
    },
    CONTAINER_TYPE_TUBE_GRAY_FLUORIDE: {
      code: 'TUBE_GRAY_FLUORIDE',
      display: 'Gray-top tube (sodium fluoride / potassium oxalate)',
    },
    CONTAINER_TYPE_SYRINGE_BLOOD_GAS: {
      code: 'SYRINGE_BLOOD_GAS',
      display: 'Heparinized blood gas syringe',
    },
    CONTAINER_TYPE_CUP_URINE_STERILE: {
      code: 'CUP_URINE_STERILE',
      display: 'Sterile urine cup',
    },
    CONTAINER_TYPE_JUG_URINE_24H: {
      code: 'JUG_URINE_24H',
      display: '24-hour urine container',
    },
    CONTAINER_TYPE_CUP_STOOL: { code: 'CUP_STOOL', display: 'Stool container' },
    CONTAINER_TYPE_TUBE_STERILE: {
      code: 'TUBE_STERILE',
      display: 'Sterile screw-cap tube',
    },
    CONTAINER_TYPE_SWAB_TRANSPORT: {
      code: 'SWAB_TRANSPORT',
      display: 'Swab with transport medium',
    },
    // Los recipientes que faltaban para las muestras de arriba y para los
    // programas de salud pública: el frasco de hemocultivo, el de esputo de la
    // baciloscopía, el microtubo pediátrico, la lámina de la gota gruesa y del
    // Papanicolaou, la tarjeta de papel filtro del tamizaje neonatal, el
    // frasco con formol de la biopsia y el tubo de tapa rosa del banco de
    // sangre (EDTA para inmunohematología).
    CONTAINER_TYPE_BOTTLE_BLOOD_CULTURE: {
      code: 'BOTTLE_BLOOD_CULTURE',
      display: 'Blood culture bottle',
    },
    CONTAINER_TYPE_CUP_SPUTUM: {
      code: 'CUP_SPUTUM',
      display: 'Sputum container',
    },
    CONTAINER_TYPE_MICROTUBE_CAPILLARY: {
      code: 'MICROTUBE_CAPILLARY',
      display: 'Capillary microtube (pediatric)',
    },
    CONTAINER_TYPE_SLIDE_GLASS: {
      code: 'SLIDE_GLASS',
      display: 'Glass microscope slide',
    },
    CONTAINER_TYPE_CARD_FILTER_PAPER: {
      code: 'CARD_FILTER_PAPER',
      display: 'Filter paper card (dried blood spot)',
    },
    CONTAINER_TYPE_JAR_FORMALIN: {
      code: 'JAR_FORMALIN',
      display: 'Container with 10% buffered formalin',
    },
    CONTAINER_TYPE_TUBE_PINK_EDTA: {
      code: 'TUBE_PINK_EDTA',
      display: 'Pink-top tube (K2 EDTA, blood bank)',
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
export const DIAGNOSTIC_CATEGORIES: readonly string[] = [
  CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
];

/**
 * Las categorías de orden que el **paciente** ve en su portal: las diagnósticas
 * y, además, los procedimientos que un médico le pide hacerse en un centro.
 *
 * Es una lista aparte y no una ampliación de {@link DIAGNOSTIC_CATEGORIES}: el
 * mostrador de laboratorio e imagenología no atiende procedimientos, y sumarlos
 * allí los pondría en una cola que nadie de ese equipo puede cumplir.
 */
export const PATIENT_PORTAL_CATEGORIES: readonly string[] = [
  ...DIAGNOSTIC_CATEGORIES,
  CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
  // P40: la orden de análisis «otro» (`category: 'OTHER'`) también es algo que
  // el paciente tiene que ir a hacerse.
  CLIN.SERVICE_REQUEST_CATEGORY_OTHER,
];

/**
 * Las categorías que lista la ficha diagnóstica del paciente
 * (`GET /diagnostics/patients/:id/orders`): las diagnósticas, la orden de
 * análisis «otro» de C2 (P40) y lo que el formulario de la ficha también pide
 * —estudios cardiológicos, de anatomía patológica y procedimientos—. Lista
 * aparte de {@link DIAGNOSTIC_CATEGORIES} por lo mismo que la del portal: esa alimenta
 * colas y liquidaciones de laboratorio e imagen, y estas órdenes no son trabajo
 * de esos equipos.
 *
 * La imagen de `clinical` entra también: es la que el catálogo de categorías
 * publica, y las órdenes que se pidieron eligiéndola a mano se guardaron con
 * ella. Sin esto esas radiografías desaparecían de la ficha que las pidió.
 */
export const PATIENT_CHART_ORDER_CATEGORIES: readonly string[] = [
  ...DIAGNOSTIC_CATEGORIES,
  CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
  CLIN.SERVICE_REQUEST_CATEGORY_CARDIO,
  CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
  CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
  CLIN.SERVICE_REQUEST_CATEGORY_OTHER,
];

/**
 * Las categorías de orden que llegan a la **recepción de muestras**: las que
 * tienen un espécimen que recibir. Imagenología queda afuera (una radiografía
 * no trae tubo) y anatomía patológica entra, porque su pieza también se recibe,
 * se rotula y se custodia.
 */
export const CATEGORIES_WITH_SPECIMEN: readonly string[] = [
  CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
];

/** Tipos de espécimen publicados como catálogo (`specimen-type`). */
export const SPECIMEN_TYPE_CONCEPTS: readonly string[] = [
  DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
  DIAG.SPECIMEN_TYPE_SERUM,
  DIAG.SPECIMEN_TYPE_PLASMA,
  DIAG.SPECIMEN_TYPE_URINE,
  DIAG.SPECIMEN_TYPE_URINE_24H,
  DIAG.SPECIMEN_TYPE_BLOOD_ARTERIAL,
  DIAG.SPECIMEN_TYPE_BLOOD_CAPILLARY,
  DIAG.SPECIMEN_TYPE_STOOL,
  DIAG.SPECIMEN_TYPE_CSF,
  DIAG.SPECIMEN_TYPE_SPUTUM,
  DIAG.SPECIMEN_TYPE_THROAT_SWAB,
  // Ampliación: van después de las once primeras porque el seed sólo inserta y
  // numera por posición; agregarlas al medio correría el ordinal de filas que
  // ya existen en bases sembradas.
  DIAG.SPECIMEN_TYPE_URINE_CLEAN_CATCH,
  DIAG.SPECIMEN_TYPE_URINE_CATHETER,
  DIAG.SPECIMEN_TYPE_NASAL_SWAB,
  DIAG.SPECIMEN_TYPE_NASOPHARYNGEAL_SWAB,
  DIAG.SPECIMEN_TYPE_GASTRIC_CONTENT,
  DIAG.SPECIMEN_TYPE_WOUND,
  DIAG.SPECIMEN_TYPE_PUS,
  DIAG.SPECIMEN_TYPE_VAGINAL,
  DIAG.SPECIMEN_TYPE_CERVIX,
  DIAG.SPECIMEN_TYPE_URETHRA,
  DIAG.SPECIMEN_TYPE_SEMEN,
  DIAG.SPECIMEN_TYPE_EAR,
  DIAG.SPECIMEN_TYPE_EYE,
  DIAG.SPECIMEN_TYPE_SYNOVIAL_FLUID,
  DIAG.SPECIMEN_TYPE_PLEURAL_FLUID,
  DIAG.SPECIMEN_TYPE_PERITONEAL_FLUID,
  DIAG.SPECIMEN_TYPE_AMNIOTIC_FLUID,
  DIAG.SPECIMEN_TYPE_BONE_MARROW,
  DIAG.SPECIMEN_TYPE_TISSUE,
  DIAG.SPECIMEN_TYPE_SKIN,
  DIAG.SPECIMEN_TYPE_NAIL,
  DIAG.SPECIMEN_TYPE_BREAST_MILK,
  DIAG.SPECIMEN_TYPE_SALIVA,
  DIAG.SPECIMEN_TYPE_CALCULUS,
];

/** Tipos de contenedor publicados como catálogo (`specimen-container-type`). */
export const CONTAINER_TYPE_CONCEPTS: readonly string[] = [
  DIAG.CONTAINER_TYPE_TUBE_LAVENDER_EDTA,
  DIAG.CONTAINER_TYPE_TUBE_GOLD_SST,
  DIAG.CONTAINER_TYPE_TUBE_RED_PLAIN,
  DIAG.CONTAINER_TYPE_TUBE_LIGHT_BLUE_CITRATE,
  DIAG.CONTAINER_TYPE_TUBE_GREEN_HEPARIN,
  DIAG.CONTAINER_TYPE_TUBE_GRAY_FLUORIDE,
  DIAG.CONTAINER_TYPE_SYRINGE_BLOOD_GAS,
  DIAG.CONTAINER_TYPE_CUP_URINE_STERILE,
  DIAG.CONTAINER_TYPE_JUG_URINE_24H,
  DIAG.CONTAINER_TYPE_CUP_STOOL,
  DIAG.CONTAINER_TYPE_TUBE_STERILE,
  DIAG.CONTAINER_TYPE_SWAB_TRANSPORT,
  // Ampliación, al final por la misma razón que la de los tipos de espécimen.
  DIAG.CONTAINER_TYPE_BOTTLE_BLOOD_CULTURE,
  DIAG.CONTAINER_TYPE_CUP_SPUTUM,
  DIAG.CONTAINER_TYPE_MICROTUBE_CAPILLARY,
  DIAG.CONTAINER_TYPE_SLIDE_GLASS,
  DIAG.CONTAINER_TYPE_CARD_FILTER_PAPER,
  DIAG.CONTAINER_TYPE_JAR_FORMALIN,
  DIAG.CONTAINER_TYPE_TUBE_PINK_EDTA,
];
