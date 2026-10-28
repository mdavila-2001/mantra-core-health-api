import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SURVEYS } from '../surveys.concepts';

/** Tramo de fecha en el que se agrupan los cuestionarios emitidos. */
export type InsightsBucketUnit = 'day' | 'week' | 'month';

/** Alcance de un resumen: de quién, de qué periodo y de qué servicio. */
export interface InsightsScope {
  /** Organización activa de la petición. */
  tenantId: string;
  /** Profesional cuyas invitaciones se resumen. */
  practitionerProfileId: string;
  /** Primera emisión incluida. */
  from?: Date;
  /** Primera emisión que ya NO se incluye. */
  toExclusive?: Date;
  /** `billing.service_catalog.id` al que se acota. */
  serviceId?: string;
}

/** Cuestionarios emitidos y respondidos en un tramo. */
export interface InsightsInvitationRow {
  /** Primer día del tramo, `YYYY-MM-DD`. */
  bucket: string;
  /** Emitidos. */
  issued: number;
  /** Respondidos. */
  answered: number;
}

/** Una pregunta de las versiones en alcance, con sus respuestas en un tramo. */
export interface InsightsQuestionRow {
  /** Pregunta. */
  questionId: string;
  /** Enunciado. */
  text: string;
  /** Concept id del tipo de respuesta. */
  answerTypeId: string;
  /** Mínimo de la escala. */
  scaleMin: number | null;
  /** Máximo de la escala. */
  scaleMax: number | null;
  /** Opciones declaradas. */
  options: string[] | null;
  /** Posición en el cuestionario. */
  position: number;
  /** Alta de la pregunta, en segundos desde la época. */
  createdAtEpoch: number;
  /** Tramo de la invitación. */
  bucket: string;
  /** Respuestas dadas a la pregunta en ese tramo (0 si ninguna). */
  n: number;
}

/** Cuántas respuestas hubo con un valor concreto. */
export interface InsightsValueRow {
  /** Pregunta. */
  questionId: string;
  /** Tramo de la invitación. */
  bucket: string;
  /** Valor numérico (SCALE). */
  valueNumber: number | null;
  /** Valor sí/no (BOOLEAN). */
  valueBoolean: boolean | null;
  /** Opción elegida (SINGLE_CHOICE / MULTIPLE_CHOICE), una fila por opción. */
  choice: string | null;
  /** Respuestas con ese valor. */
  count: number;
}

/** Un comentario abierto: texto y día, nada más. */
export interface InsightsCommentRow {
  /** Texto. */
  text: string;
  /** Día del envío, `YYYY-MM-DD` UTC. */
  day: string;
}

/** Tope de comentarios que se devuelven. */
export const INSIGHTS_COMMENTS_LIMIT = 100;

/** Tipos de recurso de agenda que representan a un profesional. */
const PRACTITIONER_RESOURCE_TYPES = [
  'practitioner_profiles',
  'health_practitioner_profiles',
] as const;

/** El SQL del alcance y los parámetros que lo acompañan, en orden. */
interface ScopeSql {
  sql: string;
  params: unknown[];
}

/**
 * Lecturas agregadas de `surveys.*` para el resumen del profesional.
 *
 * ## Qué entra en el resumen
 *
 * Las invitaciones del **tenant activo** que cumplen UNA de estas dos:
 *
 * 1. son de una plantilla cuyo dueño es el profesional
 *    (`owner_practitioner_id`); o
 * 2. son de una plantilla **sin dueño profesional** (la encuesta base del
 *    sistema) y la atención que las originó fue del profesional: la reserva
 *    cae en un cupo de un recurso de agenda cuyo `resource_ref_id` es él.
 *
 * El filtro por periodo es sobre la fecha de **emisión**: el cuestionario
 * pertenece al periodo en que se atendió al paciente, y así la tasa de
 * respuesta compara emitidos contra respondidos de la misma cohorte.
 *
 * ## Qué no sale de acá
 *
 * Ninguna consulta selecciona `patient_profile_id` ni `appointment_booking_id`
 * en su salida: esas columnas sólo se usan para unir. Los comentarios salen con
 * el día, no la hora.
 *
 * ## Sin N+1
 *
 * Cada lectura es una consulta agregada; la cantidad de consultas no depende de
 * cuántas invitaciones, preguntas o respuestas haya.
 */
@Injectable()
export class InsightsRepository {
  /**
   * Primera emisión dentro del alcance, para elegir la granularidad cuando el
   * periodo no trae `from`.
   *
   * @param em - Contexto de persistencia.
   * @param scope - Alcance del resumen.
   * @returns El instante de la primera emisión, o `null` si no hay ninguna.
   */
  async findEarliestIssuedAt(
    em: EntityManager,
    scope: InsightsScope,
  ): Promise<Date | null> {
    const scoped = this.buildScope(scope, 'day');
    const rows = await em
      .getConnection()
      .execute<{ first: Date | string | null }[]>(
        `${scoped.sql} SELECT min(issued_at) AS "first" FROM scope`,
        scoped.params,
        'all',
      );
    const first = rows[0]?.first;
    return first ? new Date(first) : null;
  }

  /**
   * Emitidos y respondidos por tramo.
   *
   * @param em - Contexto de persistencia.
   * @param scope - Alcance del resumen.
   * @param unit - Tramo de agrupación.
   * @returns Una fila por tramo con emisiones, de la más antigua a la reciente.
   */
  async countInvitationsByBucket(
    em: EntityManager,
    scope: InsightsScope,
    unit: InsightsBucketUnit,
  ): Promise<InsightsInvitationRow[]> {
    const scoped = this.buildScope(scope, unit);
    const rows = await em.getConnection().execute<InsightsInvitationRow[]>(
      `${scoped.sql}
       SELECT bucket,
              count(*)::int AS "issued",
              (count(*) FILTER (WHERE answered))::int AS "answered"
         FROM scope
        GROUP BY bucket
        ORDER BY bucket`,
      scoped.params,
      'all',
    );
    return rows.map((row) => ({
      bucket: row.bucket,
      issued: Number(row.issued),
      answered: Number(row.answered),
    }));
  }

  /**
   * Las preguntas de las versiones en alcance con cuántas respuestas recibió
   * cada una por tramo. Incluye las preguntas sin ninguna respuesta (`n = 0`).
   *
   * @param em - Contexto de persistencia.
   * @param scope - Alcance del resumen.
   * @param unit - Tramo de agrupación.
   * @returns Una fila por pregunta y tramo.
   */
  async countAnswersByQuestion(
    em: EntityManager,
    scope: InsightsScope,
    unit: InsightsBucketUnit,
  ): Promise<InsightsQuestionRow[]> {
    const scoped = this.buildScope(scope, unit);
    const rows = await em.getConnection().execute<InsightsQuestionRow[]>(
      `${scoped.sql}
       SELECT q.id AS "questionId",
              q.question_text AS "text",
              q.answer_type_concept_id AS "answerTypeId",
              q.scale_min AS "scaleMin",
              q.scale_max AS "scaleMax",
              q.options AS "options",
              q.position AS "position",
              extract(epoch FROM q.created_at)::float8 AS "createdAtEpoch",
              sc.bucket AS "bucket",
              count(a.id)::int AS "n"
         FROM scope sc
         JOIN surveys.survey_questions q
           ON q.survey_version_id = sc.survey_version_id
         LEFT JOIN surveys.survey_responses r
           ON r.survey_invitation_id = sc.invitation_id
         LEFT JOIN surveys.survey_answers a
           ON a.survey_response_id = r.id AND a.survey_question_id = q.id
        GROUP BY q.id, sc.bucket`,
      scoped.params,
      'all',
    );
    return rows.map((row) => ({
      ...row,
      position: Number(row.position),
      createdAtEpoch: Number(row.createdAtEpoch),
      n: Number(row.n),
    }));
  }

  /**
   * Cuántas respuestas hubo con cada valor, por pregunta y tramo. No incluye las
   * preguntas de texto libre.
   *
   * Una respuesta de opción múltiple aporta una fila por opción elegida, así que
   * la suma de `count` de una pregunta de opción múltiple NO es su `n`.
   *
   * @param em - Contexto de persistencia.
   * @param scope - Alcance del resumen.
   * @param unit - Tramo de agrupación.
   * @returns Una fila por pregunta, tramo y valor.
   */
  async countAnswerValues(
    em: EntityManager,
    scope: InsightsScope,
    unit: InsightsBucketUnit,
  ): Promise<InsightsValueRow[]> {
    const scoped = this.buildScope(scope, unit);
    const rows = await em.getConnection().execute<InsightsValueRow[]>(
      `${scoped.sql}
       SELECT q.id AS "questionId",
              sc.bucket AS "bucket",
              a.value_number AS "valueNumber",
              a.value_boolean AS "valueBoolean",
              ch.choice AS "choice",
              count(*)::int AS "count"
         FROM scope sc
         JOIN surveys.survey_responses r
           ON r.survey_invitation_id = sc.invitation_id
         JOIN surveys.survey_answers a
           ON a.survey_response_id = r.id
         JOIN surveys.survey_questions q
           ON q.id = a.survey_question_id
          AND q.survey_version_id = sc.survey_version_id
         LEFT JOIN LATERAL jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(a.value_choices) = 'array'
                   THEN a.value_choices END
            ) AS ch(choice) ON true
        WHERE q.answer_type_concept_id <> ?
        GROUP BY q.id, sc.bucket, a.value_number, a.value_boolean, ch.choice`,
      [...scoped.params, SURVEYS.ANSWER_TYPE_TEXT],
      'all',
    );
    return rows.map((row) => ({
      ...row,
      valueNumber: row.valueNumber === null ? null : Number(row.valueNumber),
      count: Number(row.count),
    }));
  }

  /**
   * Los comentarios abiertos más recientes: texto y día, sin hora ni vínculo
   * con la respuesta, el paciente o la atención.
   *
   * @param em - Contexto de persistencia.
   * @param scope - Alcance del resumen.
   * @returns Hasta {@link INSIGHTS_COMMENTS_LIMIT} comentarios, recientes primero.
   */
  async listRecentComments(
    em: EntityManager,
    scope: InsightsScope,
  ): Promise<InsightsCommentRow[]> {
    const scoped = this.buildScope(scope, 'day');
    return em.getConnection().execute<InsightsCommentRow[]>(
      `${scoped.sql}
       SELECT a.value_text AS "text",
              to_char(r.submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS "day"
         FROM scope sc
         JOIN surveys.survey_responses r
           ON r.survey_invitation_id = sc.invitation_id
         JOIN surveys.survey_answers a
           ON a.survey_response_id = r.id
         JOIN surveys.survey_questions q
           ON q.id = a.survey_question_id
          AND q.survey_version_id = sc.survey_version_id
        WHERE q.answer_type_concept_id = ?
          AND a.value_text IS NOT NULL
          AND btrim(a.value_text) <> ''
        ORDER BY r.submitted_at DESC
        LIMIT ?`,
      [...scoped.params, SURVEYS.ANSWER_TYPE_TEXT, INSIGHTS_COMMENTS_LIMIT],
      'all',
    );
  }

  /**
   * El `WITH scope AS (...)` común a todas las lecturas.
   *
   * `unit` sólo puede ser uno de tres literales (nunca viene del cliente), por
   * eso se interpola; todo lo demás va como parámetro.
   */
  private buildScope(scope: InsightsScope, unit: InsightsBucketUnit): ScopeSql {
    const params: unknown[] = [
      SURVEYS.INVITATION_ANSWERED,
      scope.tenantId,
      scope.tenantId,
    ];
    let filters = '';
    if (scope.from) {
      filters += ' AND i.issued_at >= ?';
      params.push(scope.from);
    }
    if (scope.toExclusive) {
      filters += ' AND i.issued_at < ?';
      params.push(scope.toExclusive);
    }

    params.push(scope.practitionerProfileId, scope.practitionerProfileId);
    const resourceTypes = PRACTITIONER_RESOURCE_TYPES.map(() => '?').join(', ');
    params.push(...PRACTITIONER_RESOURCE_TYPES);

    let serviceFilter = '';
    if (scope.serviceId) {
      serviceFilter = `
         AND (
           EXISTS (
             SELECT 1
               FROM scheduling.appointment_bookings sb
               JOIN scheduling.practitioner_service_offerings po
                 ON po.id = sb.practitioner_service_offering_id
              WHERE sb.id = i.appointment_booking_id
                AND sb.tenant_id = i.tenant_id
                AND po.service_catalog_id = ?)
           OR EXISTS (
             SELECT 1
               FROM surveys.survey_assignments sa
              WHERE sa.id = i.survey_assignment_id
                AND sa.target_type_concept_id = ?
                AND sa.target_id = ?)
         )`;
      params.push(scope.serviceId, SURVEYS.TARGET_SERVICE, scope.serviceId);
    }

    const sql = `
      WITH scope AS (
        SELECT i.id AS invitation_id,
               i.survey_version_id,
               i.issued_at,
               (i.status_concept_id = ?) AS answered,
               to_char(
                 date_trunc('${unit}', i.issued_at AT TIME ZONE 'UTC'),
                 'YYYY-MM-DD') AS bucket
          FROM surveys.survey_invitations i
          JOIN surveys.survey_versions v ON v.id = i.survey_version_id
          JOIN surveys.survey_templates t ON t.id = v.survey_template_id
         WHERE i.tenant_id = ?
           AND t.tenant_id = ?${filters}
           AND (
             t.owner_practitioner_id = ?
             OR (
               t.owner_practitioner_id IS NULL
               AND EXISTS (
                 SELECT 1
                   FROM scheduling.appointment_bookings b
                   JOIN scheduling.bookable_slots s
                     ON s.id = b.bookable_slot_id
                   JOIN scheduling.schedulable_resources r
                     ON r.id = s.resource_id
                  WHERE b.id = i.appointment_booking_id
                    AND b.tenant_id = i.tenant_id
                    AND r.tenant_id = i.tenant_id
                    AND r.resource_ref_id = ?
                    AND r.resource_ref_type IN (${resourceTypes}))
             )
           )${serviceFilter}
      )`;
    return { sql, params };
  }
}
