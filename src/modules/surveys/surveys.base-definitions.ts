import { DEFAULT_RESPONSE_WINDOW_DAYS } from './surveys.constants';
import type { AnswerTypeCode } from './surveys.concepts';

/**
 * Las encuestas BASE del sistema: las preguntas «por defecto hechas por
 * nosotros», idénticas para todos los profesionales y todos los tenants.
 *
 * **Viven en código, no en la base**, a propósito: nadie las edita por la API
 * y un cambio de redacción es un cambio de código revisado. La base sólo las
 * materializa, de forma perezosa e idempotente, la primera vez que un tenant
 * emite una invitación del tipo (ver `SurveysSystemTemplatesService`), con ids
 * deterministas derivados de este contenido.
 *
 * - `CONSULTATION`: se emite al completarse una reserva sin servicio
 *   (`practitionerServiceOfferingId` nulo). Las ocho primeras son obligatorias;
 *   el comentario final es libre y opcional.
 * - `SERVICE`: se emite al completarse la reserva de un servicio (laboratorio,
 *   imagen, procedimiento...). Todas opcionales.
 *
 * Las escalas son 1-5 (5 = mejor), salvo la recomendación (NPS), que es 0-10.
 * La opción «Sí, y deseo que ALOVIDA me contacte para dar seguimiento» de la
 * pregunta de seguridad sólo se cuenta como alerta en el resumen del médico;
 * no abre ningún caso. `dimension` es un slug estable para agregar por tema:
 * no se muestra al paciente ni se persiste.
 *
 * Contenido: banco de preguntas de experiencia del paciente (28/10/2026). Es
 * una adaptación propia, sin validación psicométrica ni comparabilidad con
 * CAHPS: no reescribir un enunciado sin subir `SYSTEM_BASE_SURVEY_VERSION`.
 */

/** Los dos tipos de encuesta base. */
export type SystemSurveyKind = 'CONSULTATION' | 'SERVICE';

/** Los dos tipos, para recorrerlos. */
export const SYSTEM_SURVEY_KINDS: readonly SystemSurveyKind[] = [
  'CONSULTATION',
  'SERVICE',
];

/**
 * Versión del contenido de este archivo. Cada vez que cambia un enunciado, una
 * opción, una escala o la obligatoriedad hay que subirla: el servicio crea y
 * publica la versión nueva en cada tenant y retira la anterior, sin tocar las
 * respuestas ya dadas.
 */
export const SYSTEM_BASE_SURVEY_VERSION = 1;

/** Plazo, en días, para responder una invitación base. */
export const SYSTEM_BASE_RESPONSE_WINDOW_DAYS = DEFAULT_RESPONSE_WINDOW_DAYS;

/** Una pregunta de la encuesta base. */
export interface SystemBaseQuestion {
  /** Posición dentro del cuestionario, desde 1. */
  position: number;
  /** Enunciado tal como lo lee el paciente. */
  text: string;
  /** Tipo de respuesta. */
  answerType: AnswerTypeCode;
  /** Si el paciente debe contestarla para poder enviar. */
  required: boolean;
  /** Mínimo de la escala (sólo `SCALE`). */
  scaleMin?: number;
  /** Máximo de la escala (sólo `SCALE`). */
  scaleMax?: number;
  /** Opciones en orden de presentación (sólo elección). */
  options?: readonly string[];
  /** Slug estable del tema que mide, para agregar. */
  dimension: string;
}

/** Una encuesta base completa. */
export interface SystemBaseSurvey {
  /** Tipo de encuesta. */
  kind: SystemSurveyKind;
  /** Título que ve el paciente. */
  title: string;
  /** Consigna que ve el paciente antes de responder. */
  description: string;
  /** Las preguntas, en orden. */
  questions: readonly SystemBaseQuestion[];
}

/** Las encuestas base, por tipo. */
export const SYSTEM_BASE_SURVEYS: Readonly<
  Record<SystemSurveyKind, SystemBaseSurvey>
> = {
  CONSULTATION: {
    kind: 'CONSULTATION',
    title: 'Encuesta de su consulta médica',
    description:
      'Le pedimos un minuto para contarnos cómo fue su consulta. Sus respuestas son confidenciales y las ve el profesional que le atendió. Esta encuesta no es un canal de urgencias: si necesita atención inmediata, comuníquese con su profesional o acuda a un centro de salud.',
    questions: [
      {
        position: 1,
        text: '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'esfuerzo_acceso',
      },
      {
        position: 2,
        text: 'Desde la hora acordada, ¿cuánto tiempo esperó hasta que comenzó su consulta? Incluya la espera en sala o en la videollamada.',
        answerType: 'SINGLE_CHOICE',
        required: true,
        options: [
          'Menos de 15 minutos',
          'De 15 a 30 minutos',
          'De 31 a 60 minutos',
          'Más de 1 hora',
          'No lo recuerdo',
        ],
        dimension: 'tiempo_espera',
      },
      {
        position: 3,
        text: 'En esta consulta, ¿con qué frecuencia el profesional le escuchó con atención? (1 = Nunca, 5 = Siempre)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'comunicacion',
      },
      {
        position: 4,
        text: 'En esta consulta, ¿con qué frecuencia el profesional le explicó las cosas de una forma que usted pudo entender? (1 = Nunca, 5 = Siempre)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'claridad_explicacion',
      },
      {
        position: 5,
        text: 'En esta consulta, ¿con qué frecuencia el profesional le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'trato_respetuoso',
      },
      {
        position: 6,
        text: 'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
        answerType: 'SINGLE_CHOICE',
        required: true,
        options: [
          'No, no tuve ningún problema',
          'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
          'Sí, pero no deseo que me contacten',
        ],
        dimension: 'seguridad_percibida',
      },
      {
        position: 7,
        text: 'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'satisfaccion_global',
      },
      {
        position: 8,
        text: '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
        answerType: 'SCALE',
        required: true,
        scaleMin: 0,
        scaleMax: 10,
        dimension: 'recomendacion_nps',
      },
      {
        position: 9,
        text: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
        answerType: 'TEXT',
        required: false,
        dimension: 'comentario_abierto',
      },
    ],
  },
  SERVICE: {
    kind: 'SERVICE',
    title: 'Encuesta de su servicio de salud',
    description:
      'Le pedimos un minuto para contarnos cómo fue su servicio (laboratorio, imagenología, procedimiento u otro). Todas las preguntas son opcionales. Sus respuestas son confidenciales. Esta encuesta no es un canal de urgencias: si necesita atención inmediata, acuda a un centro de salud.',
    questions: [
      {
        position: 1,
        text: 'Desde la hora acordada (o desde que llegó, si no tenía hora), ¿cuánto esperó hasta que le atendieron?',
        answerType: 'SINGLE_CHOICE',
        required: false,
        options: [
          'Menos de 15 minutos',
          'De 15 a 30 minutos',
          'De 31 a 60 minutos',
          'Más de 1 hora',
          'No lo recuerdo',
        ],
        dimension: 'tiempo_espera',
      },
      {
        position: 2,
        text: 'Durante este servicio, ¿con qué frecuencia el personal le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
        answerType: 'SCALE',
        required: false,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'trato_respetuoso',
      },
      {
        position: 3,
        text: '¿Qué tan claras fueron las explicaciones o instrucciones que recibió sobre este servicio (por ejemplo: preparación previa, cuidados posteriores o cómo recibirá sus resultados)? (1 = Nada claras, 5 = Muy claras)',
        answerType: 'SCALE',
        required: false,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'claridad_explicacion',
      },
      {
        position: 4,
        text: 'Durante este servicio, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o un manejo que le pareció inseguro)',
        answerType: 'SINGLE_CHOICE',
        required: false,
        options: [
          'No, no tuve ningún problema',
          'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
          'Sí, pero no deseo que me contacten',
        ],
        dimension: 'seguridad_percibida',
      },
      {
        position: 5,
        text: 'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
        answerType: 'SCALE',
        required: false,
        scaleMin: 1,
        scaleMax: 5,
        dimension: 'satisfaccion_global',
      },
      {
        position: 6,
        text: '¿Qué tan probable es que usted recomiende este servicio a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
        answerType: 'SCALE',
        required: false,
        scaleMin: 0,
        scaleMax: 10,
        dimension: 'recomendacion_nps',
      },
      {
        position: 7,
        text: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
        answerType: 'TEXT',
        required: false,
        dimension: 'comentario_abierto',
      },
    ],
  },
};
