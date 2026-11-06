import type {
  ConsultationSurveyRowDto,
  ServiceSurveyAssignmentDto,
  StandardSurveyDto,
} from '../dto';
import { SYSTEM_BASE_SURVEYS } from '../surveys.base-definitions';
import type { StandardSurvey } from '../surveys-standard.catalog';
import type { OwnedServiceAssignment } from './service-survey-ownership';

/** Rótulo de la fila fija de la cita médica (sin servicio). */
const CONSULTATION_ROW_TITLE = 'Cita médica';

/** Una pregunta sin `undefined` sueltos: sólo los campos que trae. */
function questionShape(q: {
  /** Opciones (elección). */
  options?: readonly string[];
  /** Mínimo de la escala. */
  scaleMin?: number;
  /** Máximo de la escala. */
  scaleMax?: number;
}) {
  return {
    ...(q.options ? { options: [...q.options] } : {}),
    ...(q.scaleMin !== undefined ? { scaleMin: q.scaleMin } : {}),
    ...(q.scaleMax !== undefined ? { scaleMax: q.scaleMax } : {}),
  };
}

/** Una entrada del catálogo con la forma del contrato HTTP. */
export function toCatalogItem(entry: StandardSurvey): StandardSurveyDto {
  return {
    code: entry.code,
    title: entry.title,
    description: entry.description,
    serviceKinds: [...entry.serviceKinds],
    source: { ...entry.source },
    additionalSources: entry.additionalSources.map((s) => ({ ...s })),
    questions: entry.questions.map((q) => ({
      text: q.text,
      answerType: q.answerType,
      required: q.required,
      ...questionShape(q),
      dimension: q.dimension,
    })),
  };
}

/**
 * La fila fija «Cita médica»: la encuesta base de consulta del sistema, con
 * sus preguntas. Sale de la definición en código, sin escribir nada.
 */
export function consultationRow(): ConsultationSurveyRowDto {
  const consultation = SYSTEM_BASE_SURVEYS.CONSULTATION;
  return {
    system: true,
    title: CONSULTATION_ROW_TITLE,
    templateTitle: consultation.title,
    questionCount: consultation.questions.length,
    replaceable: false,
    questions: consultation.questions.map((q) => ({
      position: q.position,
      text: q.text,
      answerType: q.answerType,
      required: q.required,
      ...questionShape(q),
    })),
  };
}

/** La asignación con la forma del contrato, o `null`. */
export function toAssignmentDto(
  owned: OwnedServiceAssignment | undefined,
): ServiceSurveyAssignmentDto | null {
  if (!owned) return null;
  return {
    assignmentId: owned.assignment.id,
    catalogCode: owned.template.standardCatalogCode ?? null,
    title: owned.template.title,
    templateId: owned.template.id,
    versionId: owned.version.id,
    assignedAt: owned.assignment.createdAt.toISOString(),
  };
}
