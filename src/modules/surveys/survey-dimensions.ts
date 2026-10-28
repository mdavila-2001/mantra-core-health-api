/**
 * Dimensiones de la encuesta base de experiencia del paciente y cómo se
 * reconoce una pregunta como perteneciente a una de ellas.
 *
 * ## Por qué la dimensión se deriva y no se guarda
 *
 * `survey_questions` no tiene columna `dimension` y este módulo no la agrega:
 * las preguntas de la encuesta base viven en código (texto exacto del banco de
 * preguntas) y las del profesional son texto libre. El resumen agregado
 * (`GET /surveys/insights`) necesita agrupar «lo mismo» entre versiones y
 * plantillas distintas —cada versión nueva re-crea sus preguntas con ids
 * nuevos—, y el único dato estable es el enunciado. Por eso la dimensión sale de
 * este mapa por **texto normalizado**, no del orden: el orden no es estable
 * (el profesional agrega preguntas después de las base y puede reordenar las
 * suyas).
 *
 * Una pregunta cuyo texto no figura acá no tiene dimensión (`null`) y se agrupa
 * por su propio texto normalizado. El mapa debe mantenerse alineado con el banco
 * de preguntas base; si la encuesta base cambia un enunciado, el nuevo texto se
 * agrega acá (el viejo se conserva: sigue habiendo respuestas históricas).
 */

/** Las nueve dimensiones del banco base, en el orden de la encuesta de consulta. */
export const SURVEY_DIMENSIONS = [
  'esfuerzo_acceso',
  'tiempo_espera',
  'comunicacion',
  'claridad_explicacion',
  'trato_respetuoso',
  'seguridad_percibida',
  'satisfaccion_global',
  'recomendacion_nps',
  'comentario_abierto',
] as const;

/** Una de las dimensiones del banco base. */
export type SurveyDimension = (typeof SURVEY_DIMENSIONS)[number];

/**
 * Normaliza un enunciado u opción para compararlo: sin tildes, en minúscula,
 * con espacios colapsados y **sin la ancla de escala final** «(1 = …, 5 = …)»
 * (se descarta porque es el único fragmento que se retoca al ajustar la
 * redacción de las escalas, no el sentido de la pregunta).
 *
 * @param text - Enunciado u opción tal como está guardado.
 * @returns Forma comparable.
 */
export function normalizeSurveyText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s*\(\s*\d+\s*=[^()]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Enunciados base (consulta y servicio) → dimensión. Textos sin normalizar. */
const BASE_QUESTION_TEXTS: ReadonlyArray<readonly [string, SurveyDimension]> = [
  // --- Consulta médica ---
  [
    '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
    'esfuerzo_acceso',
  ],
  [
    'Desde la hora acordada, ¿cuánto tiempo esperó hasta que comenzó su consulta? Incluya la espera en sala o en la videollamada.',
    'tiempo_espera',
  ],
  [
    'En esta consulta, ¿con qué frecuencia el profesional le escuchó con atención? (1 = Nunca, 5 = Siempre)',
    'comunicacion',
  ],
  [
    'En esta consulta, ¿con qué frecuencia el profesional le explicó las cosas de una forma que usted pudo entender? (1 = Nunca, 5 = Siempre)',
    'claridad_explicacion',
  ],
  [
    'En esta consulta, ¿con qué frecuencia el profesional le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
    'trato_respetuoso',
  ],
  [
    'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
    'seguridad_percibida',
  ],
  [
    'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
    'satisfaccion_global',
  ],
  [
    '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
    'recomendacion_nps',
  ],
  ['Si lo desea, cuéntenos qué podríamos hacer mejor.', 'comentario_abierto'],
  // --- Servicio (laboratorio, imagenología, procedimiento, otro) ---
  [
    'Desde la hora acordada (o desde que llegó, si no tenía hora), ¿cuánto esperó hasta que le atendieron?',
    'tiempo_espera',
  ],
  [
    'Durante este servicio, ¿con qué frecuencia el personal le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
    'trato_respetuoso',
  ],
  [
    '¿Qué tan claras fueron las explicaciones o instrucciones que recibió sobre este servicio (por ejemplo: preparación previa, cuidados posteriores o cómo recibirá sus resultados)? (1 = Nada claras, 5 = Muy claras)',
    'claridad_explicacion',
  ],
  [
    'Durante este servicio, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o un manejo que le pareció inseguro)',
    'seguridad_percibida',
  ],
  [
    'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
    'satisfaccion_global',
  ],
  [
    '¿Qué tan probable es que usted recomiende este servicio a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
    'recomendacion_nps',
  ],
];

/** Enunciado normalizado → dimensión. */
const DIMENSION_BY_NORMALIZED_TEXT: ReadonlyMap<string, SurveyDimension> =
  new Map(
    BASE_QUESTION_TEXTS.map(([text, dimension]) => [
      normalizeSurveyText(text),
      dimension,
    ]),
  );

/**
 * La dimensión del banco base a la que corresponde un enunciado.
 *
 * @param questionText - Enunciado guardado de la pregunta.
 * @returns La dimensión, o `null` si no es una pregunta base.
 */
export function dimensionOfQuestionText(
  questionText: string,
): SurveyDimension | null {
  return (
    DIMENSION_BY_NORMALIZED_TEXT.get(normalizeSurveyText(questionText)) ?? null
  );
}

/**
 * Prefijo normalizado de la opción «Sí, y deseo que ALOVIDA me contacte para dar
 * seguimiento» de la pregunta de seguridad. Se compara por prefijo para tolerar
 * un ajuste de la frase final.
 */
const SAFETY_ALERT_OPTION_PREFIX = normalizeSurveyText(
  'Sí, y deseo que ALOVIDA me contacte',
);

/**
 * Si la opción elegida es la que pide que ALOVIDA contacte al paciente.
 *
 * @param option - Texto de la opción elegida.
 * @returns `true` si cuenta como alerta de seguridad.
 */
export function isSafetyAlertOption(option: string): boolean {
  return normalizeSurveyText(option).startsWith(SAFETY_ALERT_OPTION_PREFIX);
}
