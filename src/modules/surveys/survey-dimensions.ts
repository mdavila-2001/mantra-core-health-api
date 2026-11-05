/**
 * Dimensiones de la encuesta base de experiencia del paciente y cómo se
 * reconoce una pregunta como perteneciente a una de ellas.
 *
 * ## Una sola fuente
 *
 * Las dimensiones, los enunciados y la opción de alerta de seguridad salen de
 * `SYSTEM_BASE_SURVEYS` (`surveys.base-definitions.ts`), la definición en código
 * de la encuesta base. Este archivo no repite ningún texto: si la encuesta base
 * cambia un enunciado, el resumen lo sigue sin tocar nada acá.
 *
 * ## Por qué la dimensión se deriva y no se guarda
 *
 * `survey_questions` no tiene columna `dimension`. El resumen agregado
 * (`GET /surveys/insights`) necesita agrupar «lo mismo» entre versiones y
 * plantillas distintas —cada versión nueva re-crea sus preguntas con ids
 * nuevos—. Hay dos caminos:
 *
 * 1. **Preguntas de una plantilla de sistema** (`dimensionOfSystemQuestion`): se
 *    leen por (tipo de encuesta base, posición) contra `SYSTEM_BASE_SURVEYS`,
 *    siempre que el enunciado guardado coincida con el de esa posición (si una
 *    versión histórica tenía otro texto, se cae al camino 2).
 * 2. **Respaldo por enunciado** (`dimensionOfQuestionText`): el mismo mapa, por
 *    texto normalizado. Sirve a las preguntas del profesional que copian un
 *    enunciado base; una pregunta propia no tiene dimensión (`null`) y se agrupa
 *    por su propio texto normalizado.
 */
import {
  SYSTEM_BASE_SURVEYS,
  SYSTEM_SURVEY_KINDS,
  type SystemSurveyKind,
} from './surveys.base-definitions';

/** Una dimensión del banco base: un slug estable (`recomendacion_nps`, ...). */
export type SurveyDimension = string;

/**
 * Las dimensiones del banco base, en el orden de la encuesta de consulta (la
 * de servicio usa un subconjunto).
 */
export const SURVEY_DIMENSIONS: readonly SurveyDimension[] = Array.from(
  new Set(
    SYSTEM_SURVEY_KINDS.flatMap((kind) =>
      SYSTEM_BASE_SURVEYS[kind].questions.map((q) => q.dimension),
    ),
  ),
);

/** La dimensión de la recomendación (NPS) en la definición base. */
export const NPS_DIMENSION: SurveyDimension = 'recomendacion_nps';
/** La dimensión de la satisfacción global. */
export const SATISFACTION_DIMENSION: SurveyDimension = 'satisfaccion_global';
/** La dimensión de la pregunta de seguridad y trato. */
export const SAFETY_DIMENSION: SurveyDimension = 'seguridad_percibida';

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

/** Enunciado normalizado → dimensión, derivado de la definición base. */
const DIMENSION_BY_NORMALIZED_TEXT: ReadonlyMap<string, SurveyDimension> =
  new Map(
    SYSTEM_SURVEY_KINDS.flatMap((kind) =>
      SYSTEM_BASE_SURVEYS[kind].questions.map(
        (q) => [normalizeSurveyText(q.text), q.dimension] as const,
      ),
    ),
  );

/**
 * La dimensión del banco base a la que corresponde un enunciado (respaldo por
 * texto, para preguntas del profesional que copian un enunciado base).
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
 * La dimensión de una pregunta de una plantilla de sistema: la que declara la
 * definición base en esa posición, si el enunciado guardado es el de la
 * definición; si no (una versión histórica con otro texto), por enunciado.
 *
 * @param kind - Tipo de encuesta base de la plantilla.
 * @param position - Posición de la pregunta.
 * @param questionText - Enunciado guardado.
 * @returns La dimensión, o `null` si no corresponde a ninguna.
 */
export function dimensionOfSystemQuestion(
  kind: SystemSurveyKind,
  position: number,
  questionText: string,
): SurveyDimension | null {
  const base = SYSTEM_BASE_SURVEYS[kind].questions.find(
    (q) => q.position === position,
  );
  if (
    base &&
    normalizeSurveyText(base.text) === normalizeSurveyText(questionText)
  ) {
    return base.dimension;
  }
  return dimensionOfQuestionText(questionText);
}

/**
 * Prefijo normalizado de la opción que pide que ALOVIDA contacte al paciente: las
 * primeras palabras de la segunda opción de la pregunta de seguridad de la
 * definición base. Se compara por prefijo para tolerar un ajuste de la frase
 * final.
 */
const SAFETY_ALERT_OPTION_PREFIX = normalizeSurveyText(
  SYSTEM_BASE_SURVEYS.CONSULTATION.questions.find(
    (q) => q.dimension === SAFETY_DIMENSION,
  )?.options?.[1] ?? '',
)
  .split(' ')
  .slice(0, 7)
  .join(' ');

/**
 * Si la opción elegida es la que pide que ALOVIDA contacte al paciente.
 *
 * @param option - Texto de la opción elegida.
 * @returns `true` si cuenta como alerta de seguridad.
 */
export function isSafetyAlertOption(option: string): boolean {
  return normalizeSurveyText(option).startsWith(SAFETY_ALERT_OPTION_PREFIX);
}
