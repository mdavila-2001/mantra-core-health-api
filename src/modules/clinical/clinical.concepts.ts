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

    /* --- ciclo de vida, intención y prioridad, completados ---------------------
       Hasta acá `service_requests` declaraba un estado (activa), una intención
       (orden) y una prioridad (rutina): lo mínimo para insertar una fila, no lo
       necesario para operarla. Una orden que nace en borrador, que se suspende
       mientras el paciente no puede hacerse el estudio, o que el médico revoca,
       no tenía dónde decirlo. Los nombres siguen los de HL7 FHIR `ServiceRequest`
       para que el día que se exporte a un tercero la equivalencia sea directa. */
    SERVICE_REQUEST_DRAFT: {
      code: 'SR_DRAFT',
      display: 'Service request draft',
    },
    SERVICE_REQUEST_ON_HOLD: {
      code: 'SR_ON_HOLD',
      display: 'Service request on hold',
    },
    SERVICE_REQUEST_REVOKED: {
      code: 'SR_REVOKED',
      display: 'Service request revoked',
    },
    SERVICE_REQUEST_INTENT_PLAN: { code: 'SR_PLAN', display: 'Plan intent' },
    SERVICE_REQUEST_INTENT_PROPOSAL: {
      code: 'SR_PROPOSAL',
      display: 'Proposal intent',
    },
    SERVICE_REQUEST_PRIORITY_URGENT: {
      code: 'SR_URGENT',
      display: 'Urgent priority',
    },
    SERVICE_REQUEST_PRIORITY_ASAP: {
      code: 'SR_ASAP',
      display: 'ASAP priority',
    },
    SERVICE_REQUEST_PRIORITY_STAT: {
      code: 'SR_STAT',
      display: 'STAT priority',
    },

    /* Las categorías son las tres puertas del registro de procesos: el médico
       emite «Orden para Laboratorio de Análisis de Sangre», «Orden para análisis
       clínicos (Rayos X, Resonancia, ecografía)» y la receta. Anatomía patológica
       va aparte de laboratorio porque su circuito es otro —hay una muestra que se
       fija, se procesa y se informa— y quien la realiza no es el mismo prestador. */
    SERVICE_REQUEST_CATEGORY_IMAGING: {
      code: 'SR_IMAGING',
      display: 'Imaging category',
    },
    SERVICE_REQUEST_CATEGORY_PATHOLOGY: {
      code: 'SR_PATHOLOGY',
      display: 'Pathology category',
    },
    SERVICE_REQUEST_CATEGORY_PROCEDURE: {
      code: 'SR_PROCEDURE',
      display: 'Procedure category',
    },
    SERVICE_REQUEST_CATEGORY_CARDIO: {
      code: 'SR_CARDIO',
      display: 'Cardiac study category',
    },

    /* --- qué se pide: el catálogo de estudios ---------------------------------
       `service_requests.code_concept_id` es NOT NULL y no tenía ni un concepto
       que ponerle: la pantalla de órdenes respondía «El catálogo de estudios no
       está publicado» y pedir un estudio era imposible. Esto es ese catálogo.

       **Por qué códigos locales y no LOINC.** El vademécum de arriba usa ATC
       real porque ATC nombra el principio activo y es exactamente lo que la
       receta necesita. LOINC no es equivalente: identifica una *medición* con su
       método, su unidad y su espécimen —«Glucosa [Masa/volumen] en Suero o
       Plasma»—, mientras que lo que el médico pide y el laboratorio cobra es un
       *servicio* («glicemia»). Traducir uno al otro es una decisión clínica, no
       una transcripción, y elegir mal el código LOINC es peor que no ponerlo:
       queda un identificador que parece interoperable y no lo es. Cuando el
       laboratorio entregue su nomenclador —que el registro de procesos ya prevé
       («la APP tiene que estar enlazado o sincronizado con el sistema de la
       empresa de Laboratorio»)— se publica una versión nueva del conjunto y el
       binding la sigue sin tocar nada de aquí.

       **De dónde sale la lista.** Los estudios por imagen siguen los grupos del
       Arancel de Honorarios Médicos de Santa Cruz 2025 —tórax, cráneo y cara,
       columna, miembros, contrastados, ecografía, doppler, densitometría,
       tomografía y resonancia—, con los nombres escritos correctamente: el PDF
       del arancel es escaneado y su propio pliego advierte que hay que validar
       los textos antes de cargarlos. Los de laboratorio son el panel ambulatorio
       que se pide todos los días en el primer nivel. */

    // Laboratorio · hematología
    STUDY_HEMOGRAMA: { code: 'LAB_HEMOGRAMA', display: 'Complete blood count' },
    STUDY_VSG: {
      code: 'LAB_VSG',
      display: 'Erythrocyte sedimentation rate',
    },
    STUDY_GRUPO_SANGUINEO: {
      code: 'LAB_GRUPO_RH',
      display: 'ABO and Rh blood group',
    },
    STUDY_RETICULOCITOS: {
      code: 'LAB_RETICULOCITOS',
      display: 'Reticulocytes',
    },
    STUDY_FERRITINA: { code: 'LAB_FERRITINA', display: 'Ferritin' },

    // Laboratorio · coagulación
    STUDY_TIEMPO_PROTROMBINA: {
      code: 'LAB_TP_INR',
      display: 'Prothrombin time and INR',
    },
    STUDY_TIEMPO_TROMBOPLASTINA: {
      code: 'LAB_TTPA',
      display: 'Activated partial thromboplastin time',
    },
    STUDY_FIBRINOGENO: { code: 'LAB_FIBRINOGENO', display: 'Fibrinogen' },
    STUDY_DIMERO_D: { code: 'LAB_DIMERO_D', display: 'D-dimer' },

    // Laboratorio · química y metabolismo
    STUDY_GLICEMIA: { code: 'LAB_GLICEMIA', display: 'Fasting blood glucose' },
    STUDY_CURVA_TOLERANCIA_GLUCOSA: {
      code: 'LAB_CTOG',
      display: 'Oral glucose tolerance test',
    },
    STUDY_HEMOGLOBINA_GLICOSILADA: {
      code: 'LAB_HBA1C',
      display: 'Glycated hemoglobin A1c',
    },
    STUDY_PERFIL_LIPIDICO: {
      code: 'LAB_PERFIL_LIPIDICO',
      display: 'Lipid panel',
    },
    STUDY_CREATININA: { code: 'LAB_CREATININA', display: 'Serum creatinine' },
    STUDY_UREA: { code: 'LAB_UREA', display: 'Blood urea' },
    STUDY_ACIDO_URICO: { code: 'LAB_ACIDO_URICO', display: 'Uric acid' },
    STUDY_PERFIL_HEPATICO: {
      code: 'LAB_PERFIL_HEPATICO',
      display: 'Liver function panel',
    },
    STUDY_BILIRRUBINAS: {
      code: 'LAB_BILIRRUBINAS',
      display: 'Bilirubin panel',
    },
    STUDY_AMILASA: { code: 'LAB_AMILASA', display: 'Amylase' },
    STUDY_LIPASA: { code: 'LAB_LIPASA', display: 'Lipase' },
    STUDY_ELECTROLITOS: {
      code: 'LAB_ELECTROLITOS',
      display: 'Serum electrolytes',
    },
    STUDY_CALCIO: { code: 'LAB_CALCIO', display: 'Serum calcium' },
    STUDY_PROTEINAS_TOTALES: {
      code: 'LAB_PROTEINAS',
      display: 'Total protein and albumin',
    },
    STUDY_VITAMINA_D: {
      code: 'LAB_VITAMINA_D',
      display: 'Vitamin D 25-hydroxy',
    },
    STUDY_VITAMINA_B12: { code: 'LAB_VITAMINA_B12', display: 'Vitamin B12' },

    // Laboratorio · hormonas
    STUDY_PERFIL_TIROIDEO: {
      code: 'LAB_PERFIL_TIROIDEO',
      display: 'Thyroid panel',
    },
    STUDY_TSH: { code: 'LAB_TSH', display: 'Thyroid stimulating hormone' },
    STUDY_PSA: { code: 'LAB_PSA', display: 'Prostate specific antigen' },
    STUDY_BETA_HCG: {
      code: 'LAB_BETA_HCG',
      display: 'Beta human chorionic gonadotropin',
    },
    STUDY_TESTOSTERONA: { code: 'LAB_TESTOSTERONA', display: 'Testosterone' },
    STUDY_CORTISOL: { code: 'LAB_CORTISOL', display: 'Cortisol' },

    // Laboratorio · inflamación e inmunología
    STUDY_PCR: { code: 'LAB_PCR', display: 'C-reactive protein' },
    STUDY_FACTOR_REUMATOIDEO: {
      code: 'LAB_FACTOR_REUMATOIDEO',
      display: 'Rheumatoid factor',
    },
    STUDY_ANTIESTREPTOLISINA: {
      code: 'LAB_ASTO',
      display: 'Antistreptolysin O',
    },

    // Laboratorio · microbiología y serología
    STUDY_ORINA_COMPLETA: { code: 'LAB_ORINA', display: 'Urinalysis' },
    STUDY_UROCULTIVO: { code: 'LAB_UROCULTIVO', display: 'Urine culture' },
    STUDY_COPROPARASITOLOGICO: {
      code: 'LAB_COPROPARASITOLOGICO',
      display: 'Stool ova and parasites',
    },
    STUDY_COPROCULTIVO: { code: 'LAB_COPROCULTIVO', display: 'Stool culture' },
    STUDY_HEMOCULTIVO: { code: 'LAB_HEMOCULTIVO', display: 'Blood culture' },
    STUDY_VIH: { code: 'LAB_VIH', display: 'HIV antibody screening' },
    STUDY_VDRL: { code: 'LAB_VDRL', display: 'Syphilis screening' },
    STUDY_HEPATITIS_B: {
      code: 'LAB_HEPATITIS_B',
      display: 'Hepatitis B surface antigen',
    },
    STUDY_HEPATITIS_C: {
      code: 'LAB_HEPATITIS_C',
      display: 'Hepatitis C antibody',
    },
    STUDY_CHAGAS: { code: 'LAB_CHAGAS', display: 'Chagas disease serology' },
    STUDY_DENGUE: { code: 'LAB_DENGUE', display: 'Dengue serology' },
    STUDY_GOTA_GRUESA: {
      code: 'LAB_GOTA_GRUESA',
      display: 'Malaria thick smear',
    },
    STUDY_BACILOSCOPIA: {
      code: 'LAB_BACILOSCOPIA',
      display: 'Sputum acid-fast bacilli smear',
    },

    // Imagen · radiología simple
    STUDY_RX_TORAX: { code: 'IMG_RX_TORAX', display: 'Chest radiograph' },
    STUDY_RX_CRANEO: { code: 'IMG_RX_CRANEO', display: 'Skull radiograph' },
    STUDY_RX_SENOS_PARANASALES: {
      code: 'IMG_RX_SENOS',
      display: 'Paranasal sinus radiograph',
    },
    STUDY_RX_COLUMNA_CERVICAL: {
      code: 'IMG_RX_COL_CERVICAL',
      display: 'Cervical spine radiograph',
    },
    STUDY_RX_COLUMNA_DORSAL: {
      code: 'IMG_RX_COL_DORSAL',
      display: 'Thoracic spine radiograph',
    },
    STUDY_RX_COLUMNA_LUMBAR: {
      code: 'IMG_RX_COL_LUMBAR',
      display: 'Lumbar spine radiograph',
    },
    STUDY_RX_ABDOMEN: {
      code: 'IMG_RX_ABDOMEN',
      display: 'Abdominal radiograph',
    },
    STUDY_RX_PELVIS: { code: 'IMG_RX_PELVIS', display: 'Pelvis radiograph' },
    STUDY_RX_MIEMBRO_SUPERIOR: {
      code: 'IMG_RX_MIEMBRO_SUP',
      display: 'Upper limb radiograph',
    },
    STUDY_RX_MIEMBRO_INFERIOR: {
      code: 'IMG_RX_MIEMBRO_INF',
      display: 'Lower limb radiograph',
    },

    // Imagen · ecografía
    STUDY_ECO_ABDOMINAL: {
      code: 'IMG_ECO_ABDOMINAL',
      display: 'Abdominal ultrasound',
    },
    STUDY_ECO_RENAL: {
      code: 'IMG_ECO_RENAL',
      display: 'Renal and urinary tract ultrasound',
    },
    STUDY_ECO_PELVICA: {
      code: 'IMG_ECO_PELVICA',
      display: 'Pelvic ultrasound',
    },
    STUDY_ECO_OBSTETRICA: {
      code: 'IMG_ECO_OBSTETRICA',
      display: 'Obstetric ultrasound',
    },
    STUDY_ECO_TIROIDES: {
      code: 'IMG_ECO_TIROIDES',
      display: 'Thyroid ultrasound',
    },
    STUDY_ECO_MAMARIA: {
      code: 'IMG_ECO_MAMARIA',
      display: 'Breast ultrasound',
    },
    STUDY_ECO_PARTES_BLANDAS: {
      code: 'IMG_ECO_PARTES_BLANDAS',
      display: 'Soft tissue ultrasound',
    },
    STUDY_ECO_DOPPLER: {
      code: 'IMG_ECO_DOPPLER',
      display: 'Color Doppler ultrasound',
    },

    // Imagen · tomografía, resonancia y densitometría
    STUDY_TC_CRANEO: { code: 'IMG_TC_CRANEO', display: 'Head CT scan' },
    STUDY_TC_TORAX: { code: 'IMG_TC_TORAX', display: 'Chest CT scan' },
    STUDY_TC_ABDOMEN: {
      code: 'IMG_TC_ABDOMEN',
      display: 'Abdomen and pelvis CT scan',
    },
    STUDY_TC_COLUMNA: { code: 'IMG_TC_COLUMNA', display: 'Spine CT scan' },
    STUDY_RM_CEREBRAL: { code: 'IMG_RM_CEREBRAL', display: 'Brain MRI' },
    STUDY_RM_COLUMNA: { code: 'IMG_RM_COLUMNA', display: 'Spine MRI' },
    STUDY_RM_ARTICULAR: { code: 'IMG_RM_ARTICULAR', display: 'Joint MRI' },
    STUDY_MAMOGRAFIA: { code: 'IMG_MAMOGRAFIA', display: 'Mammography' },
    STUDY_DENSITOMETRIA: {
      code: 'IMG_DENSITOMETRIA',
      display: 'Bone densitometry',
    },

    // Estudios cardiológicos
    STUDY_ELECTROCARDIOGRAMA: {
      code: 'CAR_ECG',
      display: 'Electrocardiogram',
    },
    STUDY_ECOCARDIOGRAMA: {
      code: 'CAR_ECOCARDIOGRAMA',
      display: 'Echocardiogram',
    },
    STUDY_HOLTER: { code: 'CAR_HOLTER', display: 'Holter monitoring' },
    STUDY_ERGOMETRIA: {
      code: 'CAR_ERGOMETRIA',
      display: 'Exercise stress test',
    },
    STUDY_MAPA_PRESION: {
      code: 'CAR_MAPA',
      display: 'Ambulatory blood pressure monitoring',
    },

    // Anatomía patológica
    STUDY_BIOPSIA: { code: 'PAT_BIOPSIA', display: 'Tissue biopsy study' },
    STUDY_CITOLOGIA: { code: 'PAT_CITOLOGIA', display: 'Cytology study' },
    STUDY_PAPANICOLAOU: {
      code: 'PAT_PAPANICOLAOU',
      display: 'Cervical cytology (Pap smear)',
    },

    // Procedimientos diagnósticos
    STUDY_ENDOSCOPIA_ALTA: {
      code: 'PRO_ENDOSCOPIA_ALTA',
      display: 'Upper gastrointestinal endoscopy',
    },
    STUDY_COLONOSCOPIA: { code: 'PRO_COLONOSCOPIA', display: 'Colonoscopy' },
    STUDY_ESPIROMETRIA: { code: 'PRO_ESPIROMETRIA', display: 'Spirometry' },
    STUDY_AUDIOMETRIA: { code: 'PRO_AUDIOMETRIA', display: 'Audiometry' },
    STUDY_ELECTROENCEFALOGRAMA: {
      code: 'PRO_EEG',
      display: 'Electroencephalogram',
    },
    STUDY_ELECTROMIOGRAFIA: {
      code: 'PRO_EMG',
      display: 'Electromyography',
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
    CONDITION_INACTIVE: {
      code: 'COND_INACTIVE',
      display: 'Condition inactive',
    },
    CONDITION_REMISSION: {
      code: 'COND_REMISSION',
      display: 'Condition in remission',
    },
    CONDITION_RESOLVED: {
      code: 'COND_RESOLVED',
      display: 'Condition resolved',
    },
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
    CONDITION_COURSE_CHRONIC: {
      code: 'COND_COURSE_CHRONIC',
      display: 'Chronic',
    },
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

    /* --- vademécum esencial (LINAME / lista modelo OMS) ------------------------
       Los doce de arriba eran un mínimo para poder ejercitar la receta. Éstos
       llevan el catálogo a la práctica ambulatoria real: son los que un médico
       de primer nivel prescribe casi todos los días.

       El criterio de selección es la **lista de medicamentos esenciales** —la
       LINAME boliviana, alineada con la lista modelo de la OMS—, agrupada por
       acción terapéutica. No es el vademécum comercial completo: no hay marcas
       ni presentaciones, porque el modelo prescribe por principio activo.

       Nombres en **DCI en castellano** (denominación común internacional) y
       códigos **ATC de la OMS**, los mismos que ya usaban los doce originales.
       Cada uno lleva su definición en `terminology-designations.es.ts`: sin ella
       el glosario lo mostraría mudo, y su prueba de cobertura falla. */

    /* Analgesia, fiebre e inflamación */
    MEDICATION_ACIDO_ACETILSALICILICO: {
      code: 'N02BA01',
      display: 'Ácido acetilsalicílico',
    },
    MEDICATION_DICLOFENACO: { code: 'M01AB05', display: 'Diclofenaco' },
    MEDICATION_NAPROXENO: { code: 'M01AE02', display: 'Naproxeno' },
    MEDICATION_TRAMADOL: { code: 'N02AX02', display: 'Tramadol' },
    MEDICATION_MORFINA: { code: 'N02AA01', display: 'Morfina' },

    /* Antibióticos */
    MEDICATION_AMOXICILINA_CLAVULANICO: {
      code: 'J01CR02',
      display: 'Amoxicilina con ácido clavulánico',
    },
    MEDICATION_BENCILPENICILINA: {
      code: 'J01CE01',
      display: 'Bencilpenicilina',
    },
    MEDICATION_CEFTRIAXONA: { code: 'J01DD04', display: 'Ceftriaxona' },
    MEDICATION_CLARITROMICINA: { code: 'J01FA09', display: 'Claritromicina' },
    MEDICATION_CIPROFLOXACINO: { code: 'J01MA02', display: 'Ciprofloxacino' },
    MEDICATION_COTRIMOXAZOL: {
      code: 'J01EE01',
      display: 'Sulfametoxazol con trimetoprima',
    },
    MEDICATION_DOXICICLINA: { code: 'J01AA02', display: 'Doxiciclina' },
    MEDICATION_GENTAMICINA: { code: 'J01GB03', display: 'Gentamicina' },
    MEDICATION_METRONIDAZOL: { code: 'J01XD01', display: 'Metronidazol' },
    MEDICATION_NITROFURANTOINA: { code: 'J01XE01', display: 'Nitrofurantoína' },

    /* Antifúngicos y antiparasitarios */
    MEDICATION_FLUCONAZOL: { code: 'J02AC01', display: 'Fluconazol' },
    MEDICATION_ALBENDAZOL: { code: 'P02CA03', display: 'Albendazol' },
    MEDICATION_MEBENDAZOL: { code: 'P02CA01', display: 'Mebendazol' },

    /* Corazón, presión y circulación */
    MEDICATION_AMLODIPINO: { code: 'C08CA01', display: 'Amlodipino' },
    MEDICATION_ATENOLOL: { code: 'C07AB03', display: 'Atenolol' },
    MEDICATION_BISOPROLOL: { code: 'C07AB07', display: 'Bisoprolol' },
    MEDICATION_FUROSEMIDA: { code: 'C03CA01', display: 'Furosemida' },
    MEDICATION_HIDROCLOROTIAZIDA: {
      code: 'C03AA03',
      display: 'Hidroclorotiazida',
    },
    MEDICATION_ESPIRONOLACTONA: { code: 'C03DA01', display: 'Espironolactona' },
    MEDICATION_SIMVASTATINA: { code: 'C10AA01', display: 'Simvastatina' },
    MEDICATION_DIGOXINA: { code: 'C01AA05', display: 'Digoxina' },
    MEDICATION_WARFARINA: { code: 'B01AA03', display: 'Warfarina' },

    /* Diabetes, tiroides y hormonas */
    MEDICATION_INSULINA_NPH: {
      code: 'A10AC01',
      display: 'Insulina isófana (NPH)',
    },
    MEDICATION_INSULINA_RAPIDA: {
      code: 'A10AB01',
      display: 'Insulina humana rápida',
    },
    MEDICATION_GLIBENCLAMIDA: { code: 'A10BB01', display: 'Glibenclamida' },
    MEDICATION_LEVOTIROXINA: { code: 'H03AA01', display: 'Levotiroxina' },
    MEDICATION_PREDNISONA: { code: 'H02AB07', display: 'Prednisona' },
    MEDICATION_DEXAMETASONA: { code: 'H02AB02', display: 'Dexametasona' },

    /* Estómago e intestino */
    MEDICATION_METOCLOPRAMIDA: { code: 'A03FA01', display: 'Metoclopramida' },
    MEDICATION_SALES_REHIDRATACION: {
      code: 'A07CA01',
      display: 'Sales de rehidratación oral',
    },

    /* Respiratorio y alergia */
    MEDICATION_CETIRIZINA: { code: 'R06AE07', display: 'Cetirizina' },
    MEDICATION_BUDESONIDA: { code: 'R03BA02', display: 'Budesonida' },
    MEDICATION_IPRATROPIO: {
      code: 'R03BB01',
      display: 'Bromuro de ipratropio',
    },

    /* Sistema nervioso */
    MEDICATION_DIAZEPAM: { code: 'N05BA01', display: 'Diazepam' },
    MEDICATION_CLONAZEPAM: { code: 'N03AE01', display: 'Clonazepam' },
    MEDICATION_CARBAMAZEPINA: { code: 'N03AF01', display: 'Carbamazepina' },
    MEDICATION_ACIDO_VALPROICO: { code: 'N03AG01', display: 'Ácido valproico' },
    MEDICATION_FENITOINA: { code: 'N03AB02', display: 'Fenitoína' },
    MEDICATION_FLUOXETINA: { code: 'N06AB03', display: 'Fluoxetina' },
    MEDICATION_SERTRALINA: { code: 'N06AB06', display: 'Sertralina' },
    MEDICATION_AMITRIPTILINA: { code: 'N06AA09', display: 'Amitriptilina' },
    MEDICATION_HALOPERIDOL: { code: 'N05AD01', display: 'Haloperidol' },

    /* Vitaminas, minerales y otros */
    MEDICATION_SULFATO_FERROSO: { code: 'B03AA07', display: 'Sulfato ferroso' },
    MEDICATION_ACIDO_FOLICO: { code: 'B03BB01', display: 'Ácido fólico' },
    MEDICATION_ALOPURINOL: { code: 'M04AA01', display: 'Alopurinol' },

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

    /* --- CIE-10 ambulatorio ampliado -----------------------------------------
       Los doce de arriba eran un mínimo para poder ejercitar el diagnóstico. En
       pantalla se veía lo que eran: un desplegable con doce entradas donde un
       médico no encuentra lo que busca y termina eligiendo lo más parecido, que
       es peor que no tener catálogo.

       Éstos llevan la lista a la consulta real: los motivos más frecuentes de
       la atención ambulatoria y de urgencias en Bolivia, por aparato, más los
       síntomas y signos (R) para lo que se registra antes de tener diagnóstico,
       y los motivos de contacto sin enfermedad (Z) —control sano, vacunación,
       certificado— que son consulta pura y no caben en ninguna otra letra.

       Siguen siendo CIE-10 reales de la OMS, por lo mismo que los doce
       primeros: el día que se cargue la clasificación completa, esto es un
       subconjunto suyo y no un renombrado. */

    // infecciosas y parasitarias
    CONDITION_DIARREA_INFECCIOSA: {
      code: 'A09',
      display: 'Diarrea y gastroenteritis de presunto origen infeccioso',
    },
    CONDITION_FIEBRE_TIFOIDEA: { code: 'A01.0', display: 'Fiebre tifoidea' },
    CONDITION_AMEBIASIS: {
      code: 'A06.0',
      display: 'Amebiasis intestinal aguda',
    },
    CONDITION_TUBERCULOSIS_PULMONAR: {
      code: 'A15.0',
      display: 'Tuberculosis pulmonar',
    },
    CONDITION_CHAGAS_CRONICA: {
      code: 'B57.2',
      display: 'Enfermedad de Chagas crónica con compromiso cardíaco',
    },
    CONDITION_DENGUE: { code: 'A90', display: 'Dengue clásico' },
    CONDITION_VARICELA: { code: 'B01.9', display: 'Varicela' },
    CONDITION_HERPES_ZOSTER: { code: 'B02.9', display: 'Herpes zóster' },
    CONDITION_CANDIDIASIS: { code: 'B37.9', display: 'Candidiasis' },
    CONDITION_MICOSIS_SUPERFICIAL: { code: 'B35.9', display: 'Dermatofitosis' },
    CONDITION_PARASITOSIS_INTESTINAL: {
      code: 'B82.9',
      display: 'Parasitosis intestinal',
    },
    CONDITION_VIH: {
      code: 'B24',
      display: 'Enfermedad por VIH sin otra especificación',
    },

    // sangre
    CONDITION_ANEMIA_NO_ESPECIFICADA: {
      code: 'D64.9',
      display: 'Anemia no especificada',
    },
    CONDITION_TROMBOCITOPENIA: {
      code: 'D69.6',
      display: 'Trombocitopenia no especificada',
    },

    // endocrinas, nutricionales y metabólicas
    CONDITION_DIABETES_TIPO_1: {
      code: 'E10.9',
      display: 'Diabetes mellitus tipo 1',
    },
    CONDITION_DIABETES_GESTACIONAL: {
      code: 'O24.4',
      display: 'Diabetes mellitus del embarazo',
    },
    CONDITION_HIPERTIROIDISMO: { code: 'E05.9', display: 'Hipertiroidismo' },
    CONDITION_BOCIO: { code: 'E04.9', display: 'Bocio no tóxico' },
    CONDITION_OBESIDAD: { code: 'E66.9', display: 'Obesidad' },
    CONDITION_SOBREPESO: { code: 'E66.3', display: 'Sobrepeso' },
    CONDITION_DISLIPIDEMIA: {
      code: 'E78.5',
      display: 'Hiperlipidemia no especificada',
    },
    CONDITION_HIPERCOLESTEROLEMIA: {
      code: 'E78.0',
      display: 'Hipercolesterolemia pura',
    },
    CONDITION_DESNUTRICION: {
      code: 'E46',
      display: 'Desnutrición proteico-calórica no especificada',
    },
    CONDITION_DEFICIENCIA_VITAMINA_D: {
      code: 'E55.9',
      display: 'Deficiencia de vitamina D',
    },
    CONDITION_HIPERURICEMIA: {
      code: 'E79.0',
      display: 'Hiperuricemia sin signos de artritis inflamatoria',
    },
    CONDITION_SINDROME_METABOLICO: {
      code: 'E88.81',
      display: 'Síndrome metabólico',
    },

    // mentales y del comportamiento
    CONDITION_DEPRESION: { code: 'F32.9', display: 'Episodio depresivo' },
    CONDITION_TRASTORNO_SUENO: {
      code: 'F51.0',
      display: 'Insomnio no orgánico',
    },
    CONDITION_TRASTORNO_PANICO: {
      code: 'F41.0',
      display: 'Trastorno de pánico',
    },
    CONDITION_DEMENCIA: { code: 'F03', display: 'Demencia no especificada' },
    CONDITION_TDAH: { code: 'F90.9', display: 'Trastorno hipercinético' },
    CONDITION_DEPENDENCIA_ALCOHOL: {
      code: 'F10.2',
      display: 'Dependencia del alcohol',
    },
    CONDITION_DEPENDENCIA_TABACO: {
      code: 'F17.2',
      display: 'Dependencia del tabaco',
    },

    // sistema nervioso
    CONDITION_CEFALEA_TENSIONAL: {
      code: 'G44.2',
      display: 'Cefalea tensional',
    },
    CONDITION_EPILEPSIA: { code: 'G40.9', display: 'Epilepsia' },
    CONDITION_NEUROPATIA_DIABETICA: {
      code: 'G63.2',
      display: 'Polineuropatía diabética',
    },
    CONDITION_PARKINSON: { code: 'G20', display: 'Enfermedad de Parkinson' },
    CONDITION_VERTIGO: {
      code: 'H81.1',
      display: 'Vértigo paroxístico benigno',
    },
    CONDITION_SINDROME_TUNEL_CARPIANO: {
      code: 'G56.0',
      display: 'Síndrome del túnel carpiano',
    },
    CONDITION_CIATICA: { code: 'M54.3', display: 'Ciática' },

    // ojo y oído
    CONDITION_CONJUNTIVITIS: { code: 'H10.9', display: 'Conjuntivitis' },
    CONDITION_CATARATA: { code: 'H25.9', display: 'Catarata senil' },
    CONDITION_GLAUCOMA: { code: 'H40.9', display: 'Glaucoma' },
    CONDITION_MIOPIA: { code: 'H52.1', display: 'Miopía' },
    CONDITION_OTITIS_MEDIA: { code: 'H66.9', display: 'Otitis media' },
    CONDITION_HIPOACUSIA: { code: 'H91.9', display: 'Hipoacusia' },

    // circulatorio
    CONDITION_INSUFICIENCIA_CARDIACA: {
      code: 'I50.9',
      display: 'Insuficiencia cardíaca',
    },
    CONDITION_FIBRILACION_AURICULAR: {
      code: 'I48',
      display: 'Fibrilación auricular',
    },
    CONDITION_CARDIOPATIA_ISQUEMICA: {
      code: 'I25.9',
      display: 'Cardiopatía isquémica crónica',
    },
    CONDITION_INFARTO_AGUDO_MIOCARDIO: {
      code: 'I21.9',
      display: 'Infarto agudo de miocardio',
    },
    CONDITION_ANGINA: { code: 'I20.9', display: 'Angina de pecho' },
    CONDITION_ACV: { code: 'I64', display: 'Accidente cerebrovascular agudo' },
    CONDITION_VARICES: {
      code: 'I83.9',
      display: 'Várices de miembros inferiores',
    },
    CONDITION_TROMBOSIS_VENOSA: {
      code: 'I80.2',
      display: 'Trombosis venosa profunda',
    },
    CONDITION_HIPOTENSION: { code: 'I95.9', display: 'Hipotensión' },

    // respiratorio
    CONDITION_FARINGITIS: { code: 'J02.9', display: 'Faringitis aguda' },
    CONDITION_AMIGDALITIS: { code: 'J03.9', display: 'Amigdalitis aguda' },
    CONDITION_SINUSITIS: { code: 'J01.9', display: 'Sinusitis aguda' },
    CONDITION_BRONQUITIS_AGUDA: { code: 'J20.9', display: 'Bronquitis aguda' },
    CONDITION_NEUMONIA: { code: 'J18.9', display: 'Neumonía' },
    CONDITION_EPOC: {
      code: 'J44.9',
      display: 'Enfermedad pulmonar obstructiva crónica',
    },
    CONDITION_RINITIS_ALERGICA: { code: 'J30.4', display: 'Rinitis alérgica' },
    CONDITION_INFLUENZA: {
      code: 'J11.1',
      display: 'Influenza con manifestaciones respiratorias',
    },
    CONDITION_COVID19: {
      code: 'U07.1',
      display: 'COVID-19 confirmado por laboratorio',
    },

    // digestivo
    CONDITION_ERGE: {
      code: 'K21.9',
      display: 'Enfermedad por reflujo gastroesofágico',
    },
    CONDITION_ULCERA_PEPTICA: { code: 'K27.9', display: 'Úlcera péptica' },
    CONDITION_SINDROME_INTESTINO_IRRITABLE: {
      code: 'K58.9',
      display: 'Síndrome del intestino irritable',
    },
    CONDITION_ESTRENIMIENTO: { code: 'K59.0', display: 'Estreñimiento' },
    CONDITION_HEMORROIDES: { code: 'K64.9', display: 'Hemorroides' },
    CONDITION_COLELITIASIS: {
      code: 'K80.2',
      display: 'Colelitiasis sin colecistitis',
    },
    CONDITION_APENDICITIS: { code: 'K35.8', display: 'Apendicitis aguda' },
    CONDITION_HERNIA_INGUINAL: { code: 'K40.9', display: 'Hernia inguinal' },
    CONDITION_HIGADO_GRASO: { code: 'K76.0', display: 'Esteatosis hepática' },
    CONDITION_PANCREATITIS: { code: 'K85.9', display: 'Pancreatitis aguda' },
    CONDITION_CARIES: { code: 'K02.9', display: 'Caries dental' },
    CONDITION_GINGIVITIS: { code: 'K05.1', display: 'Gingivitis crónica' },
    CONDITION_PERIODONTITIS: {
      code: 'K05.3',
      display: 'Periodontitis crónica',
    },

    // piel
    CONDITION_ACNE: { code: 'L70.0', display: 'Acné vulgar' },
    CONDITION_PSORIASIS: { code: 'L40.9', display: 'Psoriasis' },
    CONDITION_URTICARIA: { code: 'L50.9', display: 'Urticaria' },
    CONDITION_CELULITIS: { code: 'L03.9', display: 'Celulitis' },
    CONDITION_DERMATITIS_CONTACTO: {
      code: 'L23.9',
      display: 'Dermatitis alérgica de contacto',
    },
    CONDITION_ALOPECIA: { code: 'L65.9', display: 'Alopecia no cicatricial' },

    // musculoesquelético
    CONDITION_ARTROSIS_RODILLA: { code: 'M17.9', display: 'Gonartrosis' },
    CONDITION_ARTROSIS_CADERA: { code: 'M16.9', display: 'Coxartrosis' },
    CONDITION_ARTRITIS_REUMATOIDE: {
      code: 'M06.9',
      display: 'Artritis reumatoide',
    },
    CONDITION_GOTA: { code: 'M10.9', display: 'Gota' },
    CONDITION_OSTEOPOROSIS: { code: 'M81.9', display: 'Osteoporosis' },
    CONDITION_CERVICALGIA: { code: 'M54.2', display: 'Cervicalgia' },
    CONDITION_TENDINITIS_HOMBRO: {
      code: 'M75.3',
      display: 'Tendinitis calcificante del hombro',
    },
    CONDITION_ESGUINCE_TOBILLO: {
      code: 'S93.4',
      display: 'Esguince de tobillo',
    },
    CONDITION_FIBROMIALGIA: { code: 'M79.7', display: 'Fibromialgia' },
    CONDITION_ESCOLIOSIS: { code: 'M41.9', display: 'Escoliosis' },

    // genitourinario
    CONDITION_ENFERMEDAD_RENAL_CRONICA: {
      code: 'N18.9',
      display: 'Enfermedad renal crónica',
    },
    CONDITION_LITIASIS_RENAL: { code: 'N20.0', display: 'Cálculo del riñón' },
    CONDITION_HIPERPLASIA_PROSTATICA: {
      code: 'N40',
      display: 'Hiperplasia prostática benigna',
    },
    CONDITION_VAGINITIS: { code: 'N76.0', display: 'Vaginitis aguda' },
    CONDITION_MIOMA_UTERINO: { code: 'D25.9', display: 'Leiomioma del útero' },
    CONDITION_DISMENORREA: { code: 'N94.6', display: 'Dismenorrea' },
    CONDITION_MENOPAUSIA: { code: 'N95.1', display: 'Estado menopáusico' },
    CONDITION_INFERTILIDAD: { code: 'N97.9', display: 'Infertilidad femenina' },

    // embarazo, parto y puerperio
    CONDITION_EMBARAZO_NORMAL: {
      code: 'Z34.9',
      display: 'Supervisión de embarazo normal',
    },
    CONDITION_PREECLAMPSIA: { code: 'O14.9', display: 'Preeclampsia' },
    CONDITION_AMENAZA_ABORTO: { code: 'O20.0', display: 'Amenaza de aborto' },
    CONDITION_ANEMIA_EMBARAZO: {
      code: 'O99.0',
      display: 'Anemia que complica el embarazo',
    },

    // perinatal y pediatría
    CONDITION_ICTERICIA_NEONATAL: {
      code: 'P59.9',
      display: 'Ictericia neonatal',
    },
    CONDITION_BAJO_PESO_NACER: { code: 'P07.1', display: 'Bajo peso al nacer' },
    CONDITION_BRONQUIOLITIS: { code: 'J21.9', display: 'Bronquiolitis aguda' },
    CONDITION_OTITIS_EXTERNA: { code: 'H60.9', display: 'Otitis externa' },

    // síntomas y signos
    CONDITION_FIEBRE: { code: 'R50.9', display: 'Fiebre no especificada' },
    CONDITION_DOLOR_ABDOMINAL: { code: 'R10.4', display: 'Dolor abdominal' },
    CONDITION_DOLOR_TORACICO: { code: 'R07.4', display: 'Dolor torácico' },
    CONDITION_DISNEA: { code: 'R06.0', display: 'Disnea' },
    CONDITION_TOS: { code: 'R05', display: 'Tos' },
    CONDITION_MAREO: { code: 'R42', display: 'Mareo y desvanecimiento' },
    CONDITION_ASTENIA: { code: 'R53', display: 'Malestar y fatiga' },
    CONDITION_EDEMA: { code: 'R60.9', display: 'Edema' },
    CONDITION_PERDIDA_PESO: {
      code: 'R63.4',
      display: 'Pérdida anormal de peso',
    },
    CONDITION_SINCOPE: { code: 'R55', display: 'Síncope y colapso' },
    CONDITION_PALPITACIONES: { code: 'R00.2', display: 'Palpitaciones' },

    // lesiones
    CONDITION_FRACTURA_ANTEBRAZO: {
      code: 'S52.9',
      display: 'Fractura del antebrazo',
    },
    CONDITION_HERIDA_CORTANTE: {
      code: 'T14.1',
      display: 'Herida abierta de región no especificada',
    },
    CONDITION_QUEMADURA: {
      code: 'T30.0',
      display: 'Quemadura de región no especificada',
    },
    CONDITION_CONTUSION: {
      code: 'T14.0',
      display: 'Contusión de región no especificada',
    },
    CONDITION_TRAUMATISMO_CRANEAL: {
      code: 'S06.9',
      display: 'Traumatismo intracraneal',
    },

    // motivos de contacto sin enfermedad
    CONDITION_CONTROL_SALUD: {
      code: 'Z00.0',
      display: 'Examen médico general',
    },
    CONDITION_VACUNACION: {
      code: 'Z23',
      display: 'Contacto para inmunización',
    },
    CONDITION_ANTICONCEPCION: {
      code: 'Z30.9',
      display: 'Atención para la anticoncepción',
    },
    CONDITION_CERTIFICADO_MEDICO: {
      code: 'Z02.7',
      display: 'Emisión de certificado médico',
    },
    CONDITION_CONTROL_NINO_SANO: {
      code: 'Z00.1',
      display: 'Control de salud de rutina del niño',
    },
  });
