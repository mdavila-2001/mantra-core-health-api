import type { AnswerTypeCode } from './surveys.concepts';

/**
 * Catálogo estándar de encuestas por tipo de servicio (`GET /surveys/catalog`).
 *
 * El médico ya no crea encuestas libres: a cada uno de sus servicios le asocia
 * una plantilla de este catálogo. La cita médica sin servicio sigue usando la
 * encuesta base del sistema (`SYSTEM_BASE_SURVEYS.CONSULTATION`), que no está
 * acá y no se reemplaza.
 *
 * ## De dónde salen las preguntas
 *
 * Sólo de instrumentos de dominio público o de uso libre (ver el estudio en
 * `mantra_core_technologies_health_docs/SALUD/Arquitectura/encuestas-estandar-por-servicio.md`):
 *
 * - **CAHPS®** (AHRQ / CMS, obras del gobierno de los EE. UU., dominio público):
 *   CG-CAHPS 3.0 y 4.0 (beta), OAS CAHPS (cirugía ambulatoria), Home Health
 *   CAHPS, HCAHPS (salvo los ítems de transición de cuidados, © E. A. Coleman,
 *   que NO se usan), ECHO (salud conductual) y la Encuesta de Satisfacción de
 *   Medicare en castellano (OMB 0938-0732), que ya usa la encuesta base.
 * - **Pregunta de recomendación 0-10** (método NPS, de uso libre; «Net
 *   Promoter», «NPS» son marcas de Bain & Company, Satmetrix y F. Reichheld:
 *   el texto al paciente no las nombra).
 * - **NHS Friends and Family Test** (pregunta global de experiencia).
 *
 * Cada pregunta cita en un comentario el ítem fuente. La adaptación (cambiar «en
 * los últimos 6 meses» por «este servicio», pasar la frecuencia a la escala 1-5
 * del banco, traducir) es propia: **no hay validación psicométrica ni
 * comparabilidad con los puntajes CAHPS publicados**, y por la regla de marca de
 * la AHRQ ninguna plantilla se presenta como «encuesta CAHPS», sólo como
 * «ítems adaptados de».
 *
 * ## Núcleo común
 *
 * Todas las plantillas comparten un núcleo copiado **literalmente** de la
 * encuesta base de servicio (o de la de consulta, en telemedicina): espera,
 * trato, claridad, seguridad, satisfacción global 1-5, recomendación 0-10 y
 * comentario. Copiado y no referenciado a propósito: una plantilla `_V1` es
 * inmutable aunque la base cambie. Literal porque el resumen «Cómo le va»
 * reconoce la dimensión por el enunciado (`dimensionOfQuestionText`): así las
 * respuestas de cualquier servicio suman a la misma serie de satisfacción y al
 * mismo NPS. La satisfacción global queda en 1-5 (no 0-10) porque la tendencia
 * del resumen promedia esa dimensión como escala 1-5; el 0-10 es la
 * recomendación. El spec verifica que el núcleo siga coincidiendo con la base.
 *
 * ## Obligatoriedad
 *
 * Todas las preguntas van `required: false`, igual que la encuesta base de
 * servicio y que la regla del servidor para las plantillas del profesional.
 *
 * ## Versionado
 *
 * Una plantilla publicada no se reescribe: un cambio de enunciado, opción o
 * escala es una plantilla nueva con el código `_V2`, y la `_V1` queda para las
 * asociaciones existentes.
 */

/** Tipos de servicio que orientan la elección de plantilla. */
export type ServiceKind =
  | 'CONSULTATION'
  | 'PROCEDURE'
  | 'LAB'
  | 'IMAGING'
  | 'TELEMEDICINE'
  | 'THERAPY'
  | 'HOME_CARE'
  | 'PHARMACY'
  | 'OTHER';

/** Todos los tipos de servicio, en orden de presentación. */
export const SERVICE_KINDS: readonly ServiceKind[] = [
  'CONSULTATION',
  'PROCEDURE',
  'LAB',
  'IMAGING',
  'TELEMEDICINE',
  'THERAPY',
  'HOME_CARE',
  'PHARMACY',
  'OTHER',
];

/**
 * Tipos cubiertos por este catálogo: todos menos `CONSULTATION`, que es la
 * encuesta base del sistema.
 */
export const CATALOG_SERVICE_KINDS: readonly ServiceKind[] =
  SERVICE_KINDS.filter((kind) => kind !== 'CONSULTATION');

/** Fuente de un instrumento: qué es, bajo qué licencia y dónde verificarlo. */
export interface StandardSurveySource {
  /** Instrumento de origen. */
  instrument: string;
  /** Licencia o régimen de uso. */
  license: string;
  /** Página oficial del instrumento o de su licencia. */
  url: string;
}

/** Una pregunta de una plantilla del catálogo. */
export interface StandardSurveyQuestion {
  /** Enunciado tal como lo lee el paciente. */
  text: string;
  /** Tipo de respuesta (los mismos códigos que aceptan los DTO). */
  answerType: AnswerTypeCode;
  /** Si el paciente debe contestarla (siempre `false`; ver la cabecera). */
  required: boolean;
  /** Opciones en orden de presentación (sólo elección). */
  options?: readonly string[];
  /** Mínimo de la escala (sólo `SCALE`). */
  scaleMin?: number;
  /** Máximo de la escala (sólo `SCALE`). */
  scaleMax?: number;
  /**
   * Slug estable del tema que mide. El del núcleo coincide con la encuesta
   * base; el resto es propio del catálogo. No se muestra ni se persiste.
   */
  dimension: string;
}

/** Una plantilla del catálogo, con la forma de `GET /surveys/catalog`. */
export interface StandardSurvey {
  /** Código estable, `STD_<KIND>_V<n>`. */
  code: string;
  /** Título que ve el médico al importar y el paciente al responder. */
  title: string;
  /** Consigna que ve el paciente antes de responder. */
  description: string;
  /** Tipos de servicio a los que apunta (orienta, no restringe). */
  serviceKinds: readonly ServiceKind[];
  /** Fuente principal. */
  source: StandardSurveySource;
  /** Otras fuentes de las que salen ítems. */
  additionalSources: readonly StandardSurveySource[];
  /** Las preguntas, en orden. */
  questions: readonly StandardSurveyQuestion[];
}

// ---------------------------------------------------------------------------
// Fuentes
// ---------------------------------------------------------------------------

const CAHPS_LICENSE =
  'Dominio público (obra del gobierno de los EE. UU., AHRQ/CMS); CAHPS® es marca registrada de la AHRQ';

const SRC_BASE: StandardSurveySource = {
  instrument:
    'Encuesta base de servicio de ALOVIDA (v2), con ítems de la Encuesta de Satisfacción de Medicare en castellano (CMS, OMB 0938-0732)',
  license: CAHPS_LICENSE,
  url: 'https://www.ahrq.gov/cahps/about-cahps/index.html',
};
const SRC_CG_CAHPS: StandardSurveySource = {
  instrument: 'CAHPS Clinician & Group Survey 3.0 y Visit Survey 4.0 (beta)',
  license: CAHPS_LICENSE,
  url: 'https://www.ahrq.gov/cahps/surveys-guidance/cg/index.html',
};
const SRC_OAS_CAHPS: StandardSurveySource = {
  instrument: 'Outpatient and Ambulatory Surgery CAHPS (OAS CAHPS)',
  license: CAHPS_LICENSE,
  url: 'https://oascahps.org/',
};
const SRC_HH_CAHPS: StandardSurveySource = {
  instrument: 'Home Health Care CAHPS (HHCAHPS)',
  license: CAHPS_LICENSE,
  url: 'https://homehealthcahps.org/',
};
const SRC_HCAHPS: StandardSurveySource = {
  instrument:
    'HCAHPS, ítems de comunicación sobre medicamentos (no los de Care Transitions Measure, © E. A. Coleman)',
  license:
    'Dominio público (CMS), salvo los ítems CTM, que no se usan; HCAHPS® es marca registrada',
  url: 'https://www.hcahpsonline.org/',
};
const SRC_ECHO: StandardSurveySource = {
  instrument: 'CAHPS Experience of Care and Health Outcomes (ECHO) Survey',
  license: CAHPS_LICENSE,
  url: 'https://www.ahrq.gov/cahps/surveys-guidance/echo/index.html',
};
const SRC_MEDICARE_CAHPS: StandardSurveySource = {
  instrument:
    'Medicare Advantage and Prescription Drug Plan CAHPS (MA & PDP CAHPS), traducción oficial al castellano de CMS',
  license: CAHPS_LICENSE,
  url: 'https://ma-pdpcahps.org/',
};
const SRC_NPS: StandardSurveySource = {
  instrument: 'Pregunta de recomendación 0-10 (método Net Promoter)',
  license:
    'Método de uso libre; Net Promoter® y NPS® son marcas de Bain & Company, Satmetrix y F. Reichheld (no se nombran al paciente)',
  url: 'https://www.netpromotersystem.com/about/',
};
const SRC_NHS_FFT: StandardSurveySource = {
  instrument: 'NHS Friends and Family Test (guía 2019, vigente desde 04/2020)',
  license:
    'Material del sector público de Inglaterra, Open Government Licence v3.0',
  url: 'https://www.england.nhs.uk/fft/fft-guidance/',
};

// ---------------------------------------------------------------------------
// Opciones y escalas compartidas
// ---------------------------------------------------------------------------

/** Respuesta CAHPS «Sí, definitivamente / Sí, un poco / No». */
const YES_DEFINITELY: readonly string[] = [
  'Sí, definitivamente',
  'Sí, hasta cierto punto',
  'No',
];

/** Esperas: las mismas opciones que la encuesta base. */
const WAIT_OPTIONS: readonly string[] = [
  'Menos de 15 minutos',
  'De 15 a 30 minutos',
  'De 31 a 60 minutos',
  'Más de 1 hora',
  'No lo recuerdo',
];

/** Pregunta de seguridad: mismas opciones que la base (la 2.ª es la alerta). */
const SAFETY_OPTIONS: readonly string[] = [
  'No, no tuve ningún problema',
  'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
  'Sí, pero no deseo que me contacten',
];

/** Una pregunta de escala 1-5 (5 = mejor). */
function scale5(text: string, dimension: string): StandardSurveyQuestion {
  return {
    text,
    answerType: 'SCALE',
    required: false,
    scaleMin: 1,
    scaleMax: 5,
    dimension,
  };
}

/** Una pregunta de opción única. */
function choice(
  text: string,
  options: readonly string[],
  dimension: string,
): StandardSurveyQuestion {
  return {
    text,
    answerType: 'SINGLE_CHOICE',
    required: false,
    options,
    dimension,
  };
}

// ---------------------------------------------------------------------------
// Núcleo común: copia literal de SYSTEM_BASE_SURVEYS.SERVICE (v2)
// ---------------------------------------------------------------------------

// Base SERVICE #1 · CG-CAHPS 4.0 «visit started on time» / tiempo de espera.
const CORE_WAIT = choice(
  'Desde la hora acordada (o desde que llegó, si no tenía hora), ¿cuánto esperó hasta que le atendieron?',
  WAIT_OPTIONS,
  'tiempo_espera',
);
// Base SERVICE #2 · CG-CAHPS 3.0 «How often did clerks and receptionists at
// this provider's office treat you with courtesy and respect?».
const CORE_COURTESY = scale5(
  'Durante este servicio, ¿con qué frecuencia el personal le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
  'trato_respetuoso',
);
// Base SERVICE #3 · CG-CAHPS 3.0 «explain things in a way that was easy to
// understand», llevado a las instrucciones del servicio.
const CORE_CLARITY = scale5(
  '¿Qué tan claras fueron las explicaciones o instrucciones que recibió sobre este servicio (por ejemplo: preparación previa, cuidados posteriores o cómo recibirá sus resultados)? (1 = Nada claras, 5 = Muy claras)',
  'claridad_explicacion',
);
// Base SERVICE #4 · propia de ALOVIDA (alerta de seguridad del resumen); en la
// línea del ítem de errores de OCDE PaRIS, sin copiar su redacción.
const CORE_SAFETY = choice(
  'Durante este servicio, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o un manejo que le pareció inseguro)',
  SAFETY_OPTIONS,
  'seguridad_percibida',
);
// Base SERVICE #5 · NHS FFT «Overall, how was your experience of our
// service?» (Very good … Very poor), en escala 1-5.
const CORE_OVERALL = scale5(
  'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
  'satisfaccion_global',
);
// Base SERVICE #6 · pregunta de recomendación 0-10 (método NPS) y CAHPS
// «Would you recommend…»; escala 0-10.
const CORE_NPS: StandardSurveyQuestion = {
  text: '¿Qué tan probable es que usted recomiende este servicio a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
  answerType: 'SCALE',
  required: false,
  scaleMin: 0,
  scaleMax: 10,
  dimension: 'recomendacion_nps',
};
// Base SERVICE #7 · NHS FFT, pregunta abierta de seguimiento.
const CORE_COMMENT: StandardSurveyQuestion = {
  text: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
  answerType: 'TEXT',
  required: false,
  dimension: 'comentario_abierto',
};

/** Cierre común: seguridad, satisfacción, recomendación y comentario. */
const CORE_CLOSING: readonly StandardSurveyQuestion[] = [
  CORE_SAFETY,
  CORE_OVERALL,
  CORE_NPS,
  CORE_COMMENT,
];

// ---------------------------------------------------------------------------
// Ítems compartidos entre servicios diagnósticos y procedimientos
// ---------------------------------------------------------------------------

// OAS CAHPS «Did the doctors and nurses make sure you were as comfortable as
// possible?» (Yes, definitely / Yes, somewhat / No).
const ITEM_COMFORT = choice(
  'Durante la atención, ¿el personal se aseguró de que usted estuviera lo más cómodo posible?',
  YES_DEFINITELY,
  'comodidad',
);
// CG-CAHPS 3.0 «When this provider ordered a blood test, x-ray, or other test
// for you, how often did someone from this provider's office follow up to give
// you those results?», llevado a cuándo y cómo los recibe.
const ITEM_RESULTS = choice(
  '¿Le informaron con claridad cuándo y por qué medio recibiría sus resultados?',
  YES_DEFINITELY,
  'entrega_resultados',
);

/** Descripción común que ve el paciente (servicios presenciales). */
const SERVICE_DESCRIPTION =
  'Le pedimos un minuto para contarnos cómo fue su servicio. Todas las preguntas son opcionales. Sus respuestas son confidenciales y las ve el profesional que le atendió. Esta encuesta no es un canal de urgencias: si necesita atención inmediata, acuda a un centro de salud.';

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/** Las plantillas estándar, una por tipo de servicio (salvo la consulta). */
export const STANDARD_SURVEY_CATALOG: readonly StandardSurvey[] = [
  {
    code: 'STD_PROCEDURE_V1',
    title: 'Encuesta de su procedimiento',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['PROCEDURE'],
    source: {
      instrument: 'OAS CAHPS (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: SRC_OAS_CAHPS.license,
      url: SRC_OAS_CAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_CG_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // OAS CAHPS «Before your procedure, did your doctor or anyone from the
      // facility give you all the information you needed about your procedure?»
      choice(
        'Antes de su procedimiento, ¿el profesional o alguien del lugar le dio toda la información que necesitaba sobre el procedimiento?',
        YES_DEFINITELY,
        'informacion_previa',
      ),
      // OAS CAHPS «Before your procedure, did your doctor or anyone from the
      // facility give you easy to understand instructions about getting ready
      // for your procedure?»
      choice(
        'Antes de su procedimiento, ¿le dieron instrucciones fáciles de entender sobre cómo prepararse?',
        YES_DEFINITELY,
        'preparacion_previa',
      ),
      ITEM_COMFORT,
      // OAS CAHPS «Did your doctor or anyone from the facility give you
      // information about what to do if you had pain / signs of bleeding /
      // signs of infection as a result of your procedure?» (tres ítems en uno).
      choice(
        'Al terminar, ¿le explicaron qué hacer si después tenía dolor, sangrado, fiebre u otra señal de alarma?',
        YES_DEFINITELY,
        'cuidados_posteriores',
      ),
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_LAB_V1',
    title: 'Encuesta de su análisis de laboratorio',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['LAB'],
    source: {
      instrument:
        'CG-CAHPS 3.0 y OAS CAHPS (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: CAHPS_LICENSE,
      url: SRC_CG_CAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_OAS_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // OAS CAHPS «easy to understand instructions about getting ready»,
      // llevado a la preparación del análisis (ayuno, horario, medicación).
      choice(
        'Antes del análisis, ¿le indicaron con claridad cómo prepararse (por ejemplo: ayuno, horario o qué hacer con su medicación)?',
        [...YES_DEFINITELY, 'No necesitaba preparación'],
        'preparacion_previa',
      ),
      ITEM_COMFORT,
      ITEM_RESULTS,
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_IMAGING_V1',
    title: 'Encuesta de su estudio de imagen',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['IMAGING'],
    source: {
      instrument:
        'OAS CAHPS y CG-CAHPS 3.0 (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: CAHPS_LICENSE,
      url: SRC_OAS_CAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_CG_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // OAS CAHPS «give you all the information you needed about your
      // procedure», llevado al estudio (en qué consiste y cuánto dura).
      choice(
        'Antes del estudio, ¿le explicaron en qué consistía y cuánto iba a durar?',
        YES_DEFINITELY,
        'informacion_previa',
      ),
      // OAS CAHPS «easy to understand instructions about getting ready».
      choice(
        'Antes del estudio, ¿le indicaron con claridad cómo prepararse (por ejemplo: ayuno, ropa, objetos metálicos o medicación)?',
        [...YES_DEFINITELY, 'No necesitaba preparación'],
        'preparacion_previa',
      ),
      ITEM_COMFORT,
      ITEM_RESULTS,
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_TELEMEDICINE_V1',
    title: 'Encuesta de su consulta por videollamada',
    description:
      'Le pedimos un minuto para contarnos cómo fue su consulta a distancia. Todas las preguntas son opcionales. Sus respuestas son confidenciales y las ve el profesional que le atendió. Esta encuesta no es un canal de urgencias: si necesita atención inmediata, comuníquese con su profesional o acuda a un centro de salud.',
    serviceKinds: ['TELEMEDICINE'],
    source: {
      instrument:
        'CAHPS Clinician & Group Visit Survey 4.0 (beta), ítems de video (adaptados) + encuesta base de consulta ALOVIDA',
      license: CAHPS_LICENSE,
      url: SRC_CG_CAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_MEDICARE_CAHPS, SRC_NPS, SRC_NHS_FFT],
    // Telemedicina es una consulta: el núcleo es literal de
    // SYSTEM_BASE_SURVEYS.CONSULTATION (v2), no de SERVICE.
    questions: [
      // Base CONSULTATION #2 · CG-CAHPS 4.0 «visit started on time».
      choice(
        'Desde la hora acordada, ¿cuánto tiempo esperó hasta que comenzó su consulta? Incluya la espera en sala o en la videollamada.',
        WAIT_OPTIONS,
        'tiempo_espera',
      ),
      // CG-CAHPS 4.0 (beta) «Did you need instructions from this provider's
      // office to use video…?» + «Were those instructions enough…?» (Yes /
      // Somewhat / No), fundidos en una sola pregunta.
      choice(
        '¿Las instrucciones que recibió para conectarse a la videollamada fueron suficientes?',
        ['Sí', 'En parte', 'No', 'No necesité instrucciones'],
        'instrucciones_conexion',
      ),
      // CG-CAHPS 4.0 (beta) «Was the video easy to use during this visit?».
      choice(
        'Durante la consulta, ¿la videollamada fue fácil de usar (imagen, sonido y conexión)?',
        ['Sí', 'En parte', 'No'],
        'facilidad_tecnologia',
      ),
      // Base CONSULTATION #3 · CG-CAHPS «listen carefully to you».
      scale5(
        'En esta consulta, ¿con qué frecuencia el profesional le escuchó con atención? (1 = Nunca, 5 = Siempre)',
        'comunicacion',
      ),
      // Base CONSULTATION #4 · CG-CAHPS «explain things in a way that was easy
      // to understand».
      scale5(
        'En esta consulta, ¿con qué frecuencia el profesional le explicó las cosas de una forma que usted pudo entender? (1 = Nunca, 5 = Siempre)',
        'claridad_explicacion',
      ),
      // Base CONSULTATION #5 · CG-CAHPS «show respect for what you had to say».
      scale5(
        'En esta consulta, ¿con qué frecuencia el profesional le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
        'trato_respetuoso',
      ),
      // Base CONSULTATION #9 · alerta de seguridad ALOVIDA.
      choice(
        'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
        SAFETY_OPTIONS,
        'seguridad_percibida',
      ),
      // Base CONSULTATION #10 · NHS FFT, experiencia global en 1-5.
      scale5(
        'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
        'satisfaccion_global',
      ),
      // Base CONSULTATION #11 · recomendación 0-10 (método NPS).
      {
        text: '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
        answerType: 'SCALE',
        required: false,
        scaleMin: 0,
        scaleMax: 10,
        dimension: 'recomendacion_nps',
      },
      CORE_COMMENT,
    ],
  },
  {
    code: 'STD_THERAPY_V1',
    title: 'Encuesta de su terapia o tratamiento',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['THERAPY'],
    source: {
      instrument:
        'CAHPS ECHO Survey (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: SRC_ECHO.license,
      url: SRC_ECHO.url,
    },
    additionalSources: [SRC_BASE, SRC_CG_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // ECHO «How often were you involved as much as you wanted in your
      // treatment?» (Never … Always), en escala 1-5.
      scale5(
        '¿Con qué frecuencia le involucraron tanto como usted quería en las decisiones sobre su tratamiento? (1 = Nunca, 5 = Siempre)',
        'decisiones_compartidas',
      ),
      // CG-CAHPS 3.0 (ítem de decisiones compartidas) «Did you and this
      // provider talk about … what you thought was best for you?», llevado a
      // los objetivos del tratamiento.
      choice(
        '¿Hablaron con usted sobre los objetivos de su tratamiento y sobre cómo avanzar hacia ellos?',
        YES_DEFINITELY,
        'objetivos_tratamiento',
      ),
      // ECHO «How much were you helped by the counseling or treatment you got?»
      // (A lot / Somewhat / A little / Not at all) + opción de «es pronto».
      choice(
        'Hasta ahora, ¿cuánto le ha ayudado esta terapia o tratamiento?',
        ['Mucho', 'Algo', 'Poco', 'Nada', 'Todavía es pronto para saberlo'],
        'beneficio_percibido',
      ),
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_HOME_CARE_V1',
    title: 'Encuesta de su atención a domicilio',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['HOME_CARE'],
    source: {
      instrument:
        'Home Health CAHPS (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: SRC_HH_CAHPS.license,
      url: SRC_HH_CAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      // HHCAHPS «How often did home health providers from this agency keep you
      // informed about when they would arrive at your home?» (Never … Always).
      scale5(
        '¿Con qué frecuencia le avisaron a qué hora llegaría el personal a su domicilio? (1 = Nunca, 5 = Siempre)',
        'aviso_llegada',
      ),
      CORE_COURTESY,
      // HHCAHPS «How often did home health providers from this agency treat
      // you as gently as possible?».
      scale5(
        '¿Con qué frecuencia el personal le atendió con el mayor cuidado y delicadeza posibles? (1 = Nunca, 5 = Siempre)',
        'trato_cuidadoso',
      ),
      CORE_CLARITY,
      // HHCAHPS «When you first started getting home health care from this
      // agency, did someone from the agency talk with you about how to set up
      // your home so you can move around safely?».
      choice(
        '¿Alguien del equipo habló con usted sobre cómo acomodar su casa para moverse con seguridad?',
        [...YES_DEFINITELY, 'No hacía falta'],
        'seguridad_domicilio',
      ),
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_PHARMACY_V1',
    title: 'Encuesta de su atención en farmacia',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['PHARMACY'],
    source: {
      instrument:
        'HCAHPS, comunicación sobre medicamentos (ítems adaptados) + núcleo de servicio ALOVIDA',
      license: SRC_HCAHPS.license,
      url: SRC_HCAHPS.url,
    },
    additionalSources: [SRC_BASE, SRC_MEDICARE_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // MA & PDP CAHPS «How often was it easy to use your prescription drug
      // plan to get the medicines your doctor prescribed?», llevado al
      // despacho: qué tan fácil fue obtenerlos todos.
      scale5(
        '¿Qué tan fácil le resultó obtener todos los medicamentos que le recetaron? (1 = Muy difícil, 5 = Muy fácil)',
        'acceso_medicamentos',
      ),
      // HCAHPS «Before giving you any new medicine, how often did hospital
      // staff tell you what the medicine was for?».
      choice(
        '¿Le explicaron para qué sirve cada medicamento que recibió?',
        YES_DEFINITELY,
        'proposito_medicamento',
      ),
      // HCAHPS «…how often did hospital staff describe possible side effects
      // in a way you could understand?».
      choice(
        '¿Le explicaron los posibles efectos secundarios de una forma que usted pudo entender?',
        YES_DEFINITELY,
        'efectos_secundarios',
      ),
      ...CORE_CLOSING,
    ],
  },
  {
    code: 'STD_OTHER_V1',
    title: 'Encuesta de su servicio de salud',
    description: SERVICE_DESCRIPTION,
    serviceKinds: ['OTHER'],
    source: {
      instrument:
        'Núcleo de servicio ALOVIDA (CG-CAHPS, Medicare CAHPS en castellano, NHS FFT, recomendación 0-10)',
      license: CAHPS_LICENSE,
      url: SRC_BASE.url,
    },
    additionalSources: [SRC_CG_CAHPS, SRC_MEDICARE_CAHPS, SRC_NPS, SRC_NHS_FFT],
    questions: [
      CORE_WAIT,
      CORE_COURTESY,
      CORE_CLARITY,
      // Medicare CAHPS en castellano (CMS), ítem 41, el mismo de la base de
      // consulta #7, con «del servicio» en lugar de «de la consulta».
      scale5(
        '¿Terminó el servicio sintiendo que todas sus inquietudes o preguntas habían sido contestadas del todo? (1 = Nada, 5 = Del todo)',
        'inquietudes_resueltas',
      ),
      ...CORE_CLOSING,
    ],
  },
];

/**
 * Busca una plantilla del catálogo por código (sin distinguir mayúsculas).
 *
 * @param code - Código `STD_<KIND>_V<n>`.
 * @returns La plantilla, o `undefined` si el código no existe.
 */
export function findStandardSurvey(code: string): StandardSurvey | undefined {
  const wanted = code.trim().toUpperCase();
  return STANDARD_SURVEY_CATALOG.find((survey) => survey.code === wanted);
}

/**
 * La plantilla sugerida para un tipo de servicio. `CONSULTATION` no tiene: usa
 * la encuesta base del sistema.
 *
 * @param kind - Tipo de servicio.
 * @returns La plantilla, o `undefined` para la consulta.
 */
export function standardSurveyForKind(
  kind: ServiceKind,
): StandardSurvey | undefined {
  return STANDARD_SURVEY_CATALOG.find((survey) =>
    survey.serviceKinds.includes(kind),
  );
}
