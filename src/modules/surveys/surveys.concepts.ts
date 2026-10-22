import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo surveys — prefijo `surveys:`.
 *
 * Solo se declaran los estados / tipos que los endpoints de este módulo
 * escriben en columnas `*_concept_id`. Igual que en el resto de los módulos,
 * declararlos acá permite añadir conceptos sin tocar ningún archivo compartido
 * salvo el agregador `module-concepts.ts`.
 *
 * **La separación encuesta privada / calificación pública es del modelo, no de
 * una regla de servicio.** Este módulo no tiene ningún concepto de visibilidad
 * pública a propósito: la reseña pública ya existe como entidad propia en
 * `community.service_reviews`, y la decisión D-08 del proyecto exige que las
 * respuestas de encuesta nunca sean publicables. No hay estado "publicada" que
 * alguien pueda fijar por error.
 */
export const { seeds: SURVEYS_CONCEPT_SEEDS, ids: SURVEYS } =
  defineModuleConcepts('surveys', {
    // --- Ciclo de vida de la plantilla (survey_templates.status) -------------
    TEMPLATE_DRAFT: {
      code: 'SURVEY_TEMPLATE_DRAFT',
      display: 'Survey template draft',
    },
    TEMPLATE_ACTIVE: {
      code: 'SURVEY_TEMPLATE_ACTIVE',
      display: 'Survey template active',
    },
    TEMPLATE_INACTIVE: {
      code: 'SURVEY_TEMPLATE_INACTIVE',
      display: 'Survey template inactive',
    },

    // --- Publicación de la versión (survey_versions.publication_status) ------
    VERSION_DRAFT: {
      code: 'SURVEY_VERSION_DRAFT',
      display: 'Survey version draft',
    },
    VERSION_PUBLISHED: {
      code: 'SURVEY_VERSION_PUBLISHED',
      display: 'Survey version published',
    },
    VERSION_RETIRED: {
      code: 'SURVEY_VERSION_RETIRED',
      display: 'Survey version retired',
    },

    // --- Tipos de respuesta de una pregunta (survey_questions.answer_type) ---
    ANSWER_TYPE_TEXT: {
      code: 'SURVEY_ANSWER_TEXT',
      display: 'Free text answer',
    },
    ANSWER_TYPE_SCALE: {
      code: 'SURVEY_ANSWER_SCALE',
      display: 'Numeric scale answer',
    },
    ANSWER_TYPE_BOOLEAN: {
      code: 'SURVEY_ANSWER_BOOLEAN',
      display: 'Yes/no answer',
    },
    ANSWER_TYPE_SINGLE_CHOICE: {
      code: 'SURVEY_ANSWER_SINGLE_CHOICE',
      display: 'Single choice answer',
    },
    ANSWER_TYPE_MULTIPLE_CHOICE: {
      code: 'SURVEY_ANSWER_MULTI_CHOICE',
      display: 'Multiple choice answer',
    },

    // --- Cosa evaluada por la asignación (survey_assignments.target_type) ----
    // ALOVIDA asocia la encuesta a «una consulta, servicio o tipo de atención».
    TARGET_APPOINTMENT: {
      code: 'SURVEY_TARGET_APPOINTMENT',
      display: 'Assigned to a specific appointment',
    },
    TARGET_SERVICE: {
      code: 'SURVEY_TARGET_SERVICE',
      display: 'Assigned to a healthcare service',
    },
    TARGET_CARE_TYPE: {
      code: 'SURVEY_TARGET_CARE_TYPE',
      display: 'Assigned to a care type',
    },

    // --- Estado de la invitación (survey_invitations.status) ----------------
    INVITATION_PENDING: {
      code: 'SURVEY_INVITATION_PENDING',
      display: 'Invitation pending answer',
    },
    INVITATION_ANSWERED: {
      code: 'SURVEY_INVITATION_ANSWERED',
      display: 'Invitation answered',
    },
    INVITATION_EXPIRED: {
      code: 'SURVEY_INVITATION_EXPIRED',
      display: 'Invitation expired',
    },
  });

/** Tipos de respuesta expuestos por el DTO → concept id. */
export const ANSWER_TYPE_BY_CODE: Record<AnswerTypeCode, string> = {
  TEXT: SURVEYS.ANSWER_TYPE_TEXT,
  SCALE: SURVEYS.ANSWER_TYPE_SCALE,
  BOOLEAN: SURVEYS.ANSWER_TYPE_BOOLEAN,
  SINGLE_CHOICE: SURVEYS.ANSWER_TYPE_SINGLE_CHOICE,
  MULTIPLE_CHOICE: SURVEYS.ANSWER_TYPE_MULTIPLE_CHOICE,
};

/** Códigos de tipo de respuesta admitidos en el contrato HTTP. */
export type AnswerTypeCode =
  'TEXT' | 'SCALE' | 'BOOLEAN' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

/** Los cinco códigos, para `@IsIn` en los DTO y para recorrerlos en tests. */
export const ANSWER_TYPE_CODES: readonly AnswerTypeCode[] = [
  'TEXT',
  'SCALE',
  'BOOLEAN',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
];

/** Inverso de `ANSWER_TYPE_BY_CODE`: concept id → código del contrato. */
export const ANSWER_TYPE_CODE_BY_ID: Readonly<Record<string, AnswerTypeCode>> =
  Object.freeze(
    Object.fromEntries(
      ANSWER_TYPE_CODES.map((code) => [ANSWER_TYPE_BY_CODE[code], code]),
    ) as Record<string, AnswerTypeCode>,
  );

/** Cosa evaluada, expuesta por el DTO → concept id. */
export const TARGET_TYPE_BY_CODE: Record<TargetTypeCode, string> = {
  APPOINTMENT: SURVEYS.TARGET_APPOINTMENT,
  SERVICE: SURVEYS.TARGET_SERVICE,
  CARE_TYPE: SURVEYS.TARGET_CARE_TYPE,
};

/** Códigos de destino admitidos en el contrato HTTP. */
export type TargetTypeCode = 'APPOINTMENT' | 'SERVICE' | 'CARE_TYPE';

/** Los tres códigos de destino, para `@IsIn` en los DTO. */
export const TARGET_TYPE_CODES: readonly TargetTypeCode[] = [
  'APPOINTMENT',
  'SERVICE',
  'CARE_TYPE',
];

/**
 * Tipos de respuesta que exigen un catálogo de opciones y los que lo prohíben.
 *
 * Se declara acá y no en el servicio porque la regla es del modelo: una
 * pregunta de opción múltiple sin opciones es incontestable, y una de texto
 * libre con opciones es una contradicción que la UI no sabría pintar.
 */
export const ANSWER_TYPES_REQUIRING_OPTIONS: readonly AnswerTypeCode[] = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
];
