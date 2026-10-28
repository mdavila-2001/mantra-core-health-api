import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { requireTenantId, type AuthenticatedUser } from '../../../common';
import {
  InsightsRepository,
  type InsightsBucketUnit,
  type InsightsQuestionRow,
  type InsightsScope,
  type InsightsValueRow,
} from '../repositories/insights.repository';
import {
  InsightsQueryDto,
  InsightsNpsDto,
  InsightsOptionCountDto,
  InsightsQuestionDto,
  InsightsScaleBucketDto,
  InsightsTrendPointDto,
  SurveyInsightsDto,
  type InsightsTrendGranularity,
} from '../dto/insights.dto';
import {
  ANSWER_TYPE_CODE_BY_ID,
  type AnswerTypeCode,
} from '../surveys.concepts';
import {
  NPS_DIMENSION,
  SAFETY_DIMENSION,
  SATISFACTION_DIMENSION,
  SURVEY_DIMENSIONS,
  dimensionOfQuestionText,
  dimensionOfSystemQuestion,
  isSafetyAlertOption,
  normalizeSurveyText,
  type SurveyDimension,
} from '../survey-dimensions';

import { MS_PER_DAY } from '../surveys.constants';
import {
  DATE_ONLY_PATTERN,
  MAX_RANGE_MONTHS,
  MIN_COHORT,
  MONTH_START_PATTERN,
} from '../insights.constants';

/** Hasta esta amplitud (días) la tendencia va por día. */
const DAILY_TREND_MAX_DAYS = 35;

/** Hasta esta amplitud (días) la tendencia va por semana; más allá, por mes. */
const WEEKLY_TREND_MAX_DAYS = 140;

/** Una pregunta de una versión concreta, ya clasificada. */
interface QuestionMeta {
  /** Id de la pregunta. */
  id: string;
  /** Enunciado. */
  text: string;
  /** Tipo de respuesta. */
  answerType: AnswerTypeCode;
  /** Mínimo de la escala. */
  scaleMin: number | null;
  /** Máximo de la escala. */
  scaleMax: number | null;
  /** Opciones declaradas. */
  options: string[];
  /** Posición. */
  position: number;
  /** Alta en segundos desde la época. */
  createdAtEpoch: number;
  /** Dimensión del banco base, si la tiene. */
  dimension: SurveyDimension | null;
  /** Respuestas recibidas. */
  n: number;
}

/** Preguntas que cuentan como «la misma» a efectos del resumen. */
interface QuestionGroup {
  /** Clave de agrupación. */
  key: string;
  /** Miembros: una por versión en que apareció la pregunta. */
  members: QuestionMeta[];
  /** La más reciente, de la que salen el texto y el id mostrados. */
  representative: QuestionMeta;
}

/**
 * El resumen agregado del profesional: cómo le va, en general, sin el detalle
 * de cada paciente.
 *
 * ## Qué se calcula y qué no se devuelve nunca
 *
 * Todo sale de consultas agregadas (ver {@link InsightsRepository}) acotadas al
 * tenant activo y al profesional de la sesión. El resultado **no tiene** ningún
 * campo que identifique al paciente o a la atención, y los comentarios llevan el
 * día pero no la hora: con la hora, alguien que conozca el momento exacto de una
 * consulta podría reconocer su propio comentario —o el de otro— en el resumen de
 * su médico.
 *
 * ## Agrupación por dimensión
 *
 * Cada versión de una plantilla re-crea sus preguntas con ids nuevos, y la
 * encuesta base se crea una vez por tenant. Para que el resumen no se parta en
 * una fila por versión, las preguntas se agrupan por su **dimensión** (derivada
 * del enunciado, ver `survey-dimensions.ts`) y, si no tienen, por su enunciado
 * normalizado. Dentro de una misma dimensión sólo se juntan preguntas del mismo
 * tipo y la misma escala.
 *
 * ## Qué cuenta como NPS
 *
 * La pregunta de recomendación: SCALE 0-10 de dimensión `recomendacion_nps` o,
 * en una pregunta propia del profesional sin dimensión, SCALE 0-10 cuyo
 * enunciado contiene «recomend». NPS = %(9-10) − %(0-6), en puntos de −100 a 100
 * con un decimal.
 */
@Injectable()
export class SurveysInsightsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas agregadas del resumen.
   * @param logger - Registro estructurado del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: InsightsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysInsightsService.name);
  }

  /**
   * El resumen general del profesional de la sesión.
   *
   * @param query - Periodo y servicio, opcionales.
   * @param actor - El profesional autenticado.
   * @returns El resumen agregado.
   * @throws ForbiddenException si la sesión no tiene perfil profesional.
   * @throws PreconditionFailedException si el periodo es inválido.
   */
  async getInsights(
    query: InsightsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<SurveyInsightsDto> {
    // El profesional sale del token, nunca de un parámetro: nadie pide el
    // resumen de otro.
    if (!actor.practitionerProfileId) {
      throw new ForbiddenException(
        'Solo un profesional puede ver el resumen de sus encuestas',
      );
    }
    const scope: InsightsScope = {
      tenantId: requireTenantId(),
      practitionerProfileId: actor.practitionerProfileId,
      serviceId: query.serviceId,
      ...this.resolvePeriod(query),
    };
    const em = this.em.fork();

    const spanDays =
      (scope.toExclusive!.getTime() - scope.from!.getTime()) / MS_PER_DAY;
    const granularity = this.granularityFor(spanDays);
    const unit = GRANULARITY_UNIT[granularity];

    const invitationRows = await this.repo.countInvitationsByBucket(
      em,
      scope,
      unit,
    );
    const issued = invitationRows.reduce((sum, row) => sum + row.issued, 0);
    const answered = invitationRows.reduce((sum, row) => sum + row.answered, 0);
    const totals = {
      issued,
      answered,
      responseRate: issued > 0 ? round(answered / issued, 4) : null,
    };

    // Cohorte mínima: con menos respondidas que MIN_COHORT cualquier promedio,
    // distribución, alerta o comentario es de una o pocas personas, y filtrando
    // por un día o un servicio poco usado se podría aislar a una. Sólo se
    // devuelven los totales y no se consultan las respuestas.
    if (answered < MIN_COHORT) {
      this.logger.info(
        {
          operation: 'surveys.insights.read',
          issued,
          answered,
          suppressed: true,
        },
        'Survey insights suppressed: cohort below minimum',
      );
      return {
        totals,
        privacy: { minCohort: MIN_COHORT, suppressed: true },
      };
    }

    const [questionRows, valueRows, commentRows] = await Promise.all([
      this.repo.countAnswersByQuestion(em, scope, unit),
      this.repo.countAnswerValues(em, scope, unit),
      this.repo.listRecentComments(em, scope),
    ]);

    const groups = this.groupQuestions(questionRows);
    const valuesByQuestion = new Map<string, InsightsValueRow[]>();
    for (const row of valueRows) {
      const list = valuesByQuestion.get(row.questionId) ?? [];
      list.push(row);
      valuesByQuestion.set(row.questionId, list);
    }

    // NPS, alertas y tendencia salen SÓLO de las preguntas no suprimidas: si un
    // grupo con pocas respuestas alimentara un total, restando ese total de
    // otros se recuperaría lo que se quiso ocultar.
    const byQuestion: InsightsQuestionDto[] = [];
    const nps = { promoters: 0, passives: 0, detractors: 0 };
    let npsSuppressed = false;
    let safetyAlerts = 0;
    for (const group of groups) {
      const summary = this.summarizeGroup(group, valuesByQuestion);
      byQuestion.push(summary.dto);
      if (summary.nps) {
        nps.promoters += summary.nps.promoters;
        nps.passives += summary.nps.passives;
        nps.detractors += summary.nps.detractors;
      }
      npsSuppressed = npsSuppressed || summary.npsSuppressed;
      safetyAlerts += summary.safetyAlerts;
    }
    this.logger.info(
      {
        operation: 'surveys.insights.read',
        issued,
        answered,
        suppressed: false,
        questions: byQuestion.length,
      },
      'Survey insights computed',
    );

    return {
      totals,
      privacy: { minCohort: MIN_COHORT, suppressed: false },
      nps: this.toNps(nps, npsSuppressed),
      byQuestion,
      trend: this.buildTrend(invitationRows, groups, valuesByQuestion),
      trendGranularity: granularity,
      safetyAlerts: { n: safetyAlerts },
      // Con menos de MIN_COHORT comentarios en el alcance, cada uno es de una
      // persona casi identificable: no se devuelve ninguno.
      comments:
        commentRows.length >= MIN_COHORT
          ? commentRows.map((row) => ({ text: row.text }))
          : [],
    };
  }

  /**
   * Periodo pedido → cotas del alcance. Siempre devuelve ambas: `from` es el
   * primer instante incluido y `toExclusive` el primero que ya no.
   *
   * El periodo son meses calendario enteros (`from` = primer día de un mes,
   * `to` = último día de un mes, hasta 12 meses): ventanas de días arbitrarios
   * permitirían comparar dos resúmenes casi iguales y aislar una respuesta. Sin
   * `to` vale el fin del mes en curso (UTC); sin `from`, 12 meses terminando en
   * el mes de `to`.
   */
  private resolvePeriod(
    query: InsightsQueryDto,
  ): Required<Pick<InsightsScope, 'from' | 'toExclusive'>> {
    const parse = (field: 'from' | 'to', value: string): Date => {
      const date = new Date(`${value}T00:00:00.000Z`);
      if (
        !DATE_ONLY_PATTERN.test(value) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(
          `${field} debe ser una fecha de día válida (YYYY-MM-DD), sin hora`,
        );
      }
      return date;
    };
    const monthIndex = (d: Date): number =>
      d.getUTCFullYear() * 12 + d.getUTCMonth();
    const monthStart = (index: number): Date =>
      new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));

    let toDay: Date;
    if (query.to) {
      toDay = parse('to', query.to);
      const nextDay = new Date(toDay.getTime() + MS_PER_DAY);
      if (nextDay.getUTCDate() !== 1) {
        throw new BadRequestException(
          'to debe ser el último día de un mes (por ejemplo 2026-10-31)',
        );
      }
    } else {
      const now = new Date();
      toDay = new Date(monthStart(monthIndex(now) + 1).getTime() - MS_PER_DAY);
    }

    let from: Date;
    if (query.from) {
      from = parse('from', query.from);
      if (!MONTH_START_PATTERN.test(query.from)) {
        throw new BadRequestException(
          'from debe ser el primer día de un mes (por ejemplo 2026-10-01)',
        );
      }
    } else {
      from = monthStart(monthIndex(toDay) - (MAX_RANGE_MONTHS - 1));
    }

    if (from > toDay) {
      throw new BadRequestException(
        'El inicio del periodo debe ser anterior o igual a su fin',
      );
    }
    if (monthIndex(toDay) - monthIndex(from) + 1 > MAX_RANGE_MONTHS) {
      throw new BadRequestException(
        `El periodo no puede superar ${MAX_RANGE_MONTHS} meses`,
      );
    }
    return {
      from,
      toExclusive: new Date(toDay.getTime() + MS_PER_DAY),
    };
  }

  /** Granularidad de la tendencia según la amplitud del periodo. */
  private granularityFor(spanDays: number): InsightsTrendGranularity {
    if (spanDays <= DAILY_TREND_MAX_DAYS) return 'DAY';
    if (spanDays <= WEEKLY_TREND_MAX_DAYS) return 'WEEK';
    return 'MONTH';
  }

  /** Clasifica las filas de pregunta y las agrupa. */
  private groupQuestions(rows: InsightsQuestionRow[]): QuestionGroup[] {
    const metaById = new Map<string, QuestionMeta>();
    for (const row of rows) {
      const answerType = ANSWER_TYPE_CODE_BY_ID[row.answerTypeId];
      // Un tipo que el contrato no conoce no se puede resumir.
      if (!answerType) continue;
      const existing = metaById.get(row.questionId);
      if (existing) {
        existing.n += row.n;
        continue;
      }
      metaById.set(row.questionId, {
        id: row.questionId,
        text: row.text,
        answerType,
        scaleMin: row.scaleMin,
        scaleMax: row.scaleMax,
        options: Array.isArray(row.options) ? row.options : [],
        position: row.position,
        createdAtEpoch: row.createdAtEpoch,
        // Una pregunta de la encuesta base toma su dimensión de la definición
        // en código; una del profesional, del enunciado si copia uno base.
        dimension: row.systemKind
          ? dimensionOfSystemQuestion(row.systemKind, row.position, row.text)
          : dimensionOfQuestionText(row.text),
        n: row.n,
      });
    }

    const byKey = new Map<string, QuestionMeta[]>();
    for (const meta of metaById.values()) {
      const key = [
        meta.dimension ?? `q:${normalizeSurveyText(meta.text)}`,
        meta.answerType,
        meta.answerType === 'SCALE' ? `${meta.scaleMin}-${meta.scaleMax}` : '',
      ].join('|');
      const members = byKey.get(key) ?? [];
      members.push(meta);
      byKey.set(key, members);
    }

    const groups: QuestionGroup[] = [];
    for (const [key, members] of byKey) {
      const representative = members.reduce((best, candidate) =>
        candidate.createdAtEpoch > best.createdAtEpoch ? candidate : best,
      );
      groups.push({ key, members, representative });
    }
    return groups.sort(compareGroups);
  }

  /** Resume un grupo: su DTO, su aporte al NPS y sus alertas de seguridad. */
  private summarizeGroup(
    group: QuestionGroup,
    valuesByQuestion: Map<string, InsightsValueRow[]>,
  ): {
    /** Resumen de la pregunta. */
    dto: InsightsQuestionDto;
    /** Aporte al NPS, si es la pregunta de recomendación. */
    nps?: NpsCounts;
    /** Alertas de seguridad de este grupo. */
    safetyAlerts: number;
    /** Si es la pregunta de recomendación y quedó suprimida. */
    npsSuppressed: boolean;
  } {
    const rep = group.representative;
    const n = group.members.reduce((sum, m) => sum + m.n, 0);
    const values = group.members.flatMap(
      (m) => valuesByQuestion.get(m.id) ?? [],
    );
    const dto: InsightsQuestionDto = {
      questionId: rep.id,
      text: rep.text,
      dimension: rep.dimension,
      answerType: rep.answerType,
      n,
      distribution: [],
    };
    let nps: NpsCounts | undefined;
    let safetyAlerts = 0;

    if (rep.answerType === 'SCALE') {
      const histogram = new Map<number, number>();
      for (const row of values) {
        if (row.valueNumber === null) continue;
        histogram.set(
          row.valueNumber,
          (histogram.get(row.valueNumber) ?? 0) + row.count,
        );
      }
      const min = rep.scaleMin ?? 1;
      const max = rep.scaleMax ?? 5;
      const keys = new Set<number>(histogram.keys());
      for (let v = min; v <= max; v += 1) keys.add(v);
      dto.distribution = [...keys]
        .sort((a, b) => a - b)
        .map((value): InsightsScaleBucketDto => ({
          value,
          count: histogram.get(value) ?? 0,
        }));
      const counted = [...histogram.values()].reduce((s, c) => s + c, 0);
      if (counted > 0) {
        const total = [...histogram].reduce((s, [v, c]) => s + v * c, 0);
        dto.average = round(total / counted, 2);
      }
      if (isNpsQuestion(rep)) {
        nps = { promoters: 0, passives: 0, detractors: 0 };
        for (const [value, count] of histogram) {
          if (value >= 9) nps.promoters += count;
          else if (value >= 7) nps.passives += count;
          else nps.detractors += count;
        }
      }
    } else if (
      rep.answerType === 'SINGLE_CHOICE' ||
      rep.answerType === 'MULTIPLE_CHOICE'
    ) {
      const counts = new Map<string, number>();
      for (const member of [rep, ...group.members]) {
        for (const option of member.options) counts.set(option, 0);
      }
      for (const row of values) {
        if (row.choice === null) continue;
        counts.set(row.choice, (counts.get(row.choice) ?? 0) + row.count);
      }
      dto.optionCounts = [...counts].map(
        ([option, count]): InsightsOptionCountDto => ({ option, count }),
      );
      if (rep.dimension === SAFETY_DIMENSION) {
        safetyAlerts = dto.optionCounts
          .filter((entry) => isSafetyAlertOption(entry.option))
          .reduce((sum, entry) => sum + entry.count, 0);
      }
    } else if (rep.answerType === 'BOOLEAN') {
      let yes = 0;
      let no = 0;
      for (const row of values) {
        if (row.valueBoolean === true) yes += row.count;
        else if (row.valueBoolean === false) no += row.count;
      }
      dto.optionCounts = [
        { option: 'Sí', count: yes },
        { option: 'No', count: no },
      ];
    }

    // Una pregunta con menos de MIN_COHORT respuestas (típico de las opcionales
    // del servicio) no se desglosa: su «promedio» o su «opción elegida» sería
    // de una o dos personas. Se conserva `n` para que se vea por qué.
    if (rep.answerType !== 'TEXT' && n < MIN_COHORT) {
      dto.suppressed = true;
      dto.distribution = [];
      delete dto.average;
      delete dto.optionCounts;
      safetyAlerts = 0;
      const wasNps = nps !== undefined;
      nps = undefined;
      return { dto, nps, safetyAlerts, npsSuppressed: wasNps };
    }

    return { dto, nps, safetyAlerts, npsSuppressed: false };
  }

  /**
   * Cuenta de NPS → DTO con el valor en puntos. Con la pregunta suprimida, o con
   * menos de MIN_COHORT respuestas, no hay valor ni conteos.
   */
  private toNps(
    counts: NpsCounts,
    questionSuppressed: boolean,
  ): InsightsNpsDto {
    const n = counts.promoters + counts.passives + counts.detractors;
    if (questionSuppressed || (n > 0 && n < MIN_COHORT)) {
      return {
        value: null,
        promoters: 0,
        passives: 0,
        detractors: 0,
        n: 0,
        suppressed: true,
      };
    }
    return {
      value:
        n > 0
          ? round(((counts.promoters - counts.detractors) / n) * 100, 1)
          : null,
      promoters: counts.promoters,
      passives: counts.passives,
      detractors: counts.detractors,
      n,
    };
  }

  /**
   * Tendencia: cuántos cuestionarios se respondieron por tramo de emisión y el
   * promedio de satisfacción de lo respondido.
   *
   * Un tramo con menos de MIN_COHORT respondidos se funde con el siguiente
   * (y el último remanente, con el anterior): ningún punto muestra una respuesta
   * suelta. El promedio de un punto sólo sale si lo sostienen al menos
   * MIN_COHORT respuestas a la pregunta de satisfacción.
   */
  private buildTrend(
    invitationRows: Array<{
      /** Primer día del tramo. */
      bucket: string;
      /** Respondidos. */
      answered: number;
    }>,
    groups: QuestionGroup[],
    valuesByQuestion: Map<string, InsightsValueRow[]>,
  ): InsightsTrendPointDto[] {
    // La serie de satisfacción es la pregunta global; si el profesional no tiene
    // ninguna con respuestas, el promedio de sus escalas 1-5 (mismo sentido:
    // 5 = mejor).
    const scaleGroups = groups.filter(
      (g) => g.representative.answerType === 'SCALE',
    );
    // Sólo grupos no suprimidos: un promedio de una pregunta con pocas
    // respuestas no puede reaparecer en la tendencia.
    const withAnswers = (g: QuestionGroup): boolean =>
      g.members.reduce((sum, m) => sum + m.n, 0) >= MIN_COHORT;
    let source = scaleGroups.filter(
      (g) =>
        g.representative.dimension === SATISFACTION_DIMENSION && withAnswers(g),
    );
    if (source.length === 0) {
      source = scaleGroups.filter(
        (g) =>
          g.representative.scaleMin === 1 &&
          g.representative.scaleMax === 5 &&
          withAnswers(g),
      );
    }

    const sums = new Map<string, { total: number; count: number }>();
    for (const group of source) {
      for (const member of group.members) {
        for (const row of valuesByQuestion.get(member.id) ?? []) {
          if (row.valueNumber === null) continue;
          const acc = sums.get(row.bucket) ?? { total: 0, count: 0 };
          acc.total += row.valueNumber * row.count;
          acc.count += row.count;
          sums.set(row.bucket, acc);
        }
      }
    }

    interface Merged {
      period: string;
      answered: number;
      total: number;
      count: number;
    }
    const absorb = (into: Merged, row: Merged): void => {
      into.answered += row.answered;
      into.total += row.total;
      into.count += row.count;
    };
    const merged: Merged[] = [];
    let carry: Merged | null = null;
    for (const row of invitationRows) {
      const acc = sums.get(row.bucket);
      const next: Merged = {
        period: row.bucket,
        answered: row.answered,
        total: acc?.total ?? 0,
        count: acc?.count ?? 0,
      };
      if (carry) {
        absorb(carry, next);
      } else {
        carry = next;
      }
      if (carry.answered >= MIN_COHORT) {
        merged.push(carry);
        carry = null;
      }
    }
    if (carry) {
      const last = merged.at(-1);
      if (last) absorb(last, carry);
    }

    return merged.map((row) => {
      const point: InsightsTrendPointDto = {
        period: row.period,
        answered: row.answered,
      };
      if (row.count >= MIN_COHORT) {
        point.average = round(row.total / row.count, 2);
      }
      return point;
    });
  }
}

/** Conteos de NPS por categoría. */
interface NpsCounts {
  /** 9-10. */
  promoters: number;
  /** 7-8. */
  passives: number;
  /** 0-6. */
  detractors: number;
}

/** Granularidad → unidad de `date_trunc`. */
const GRANULARITY_UNIT: Readonly<
  Record<InsightsTrendGranularity, InsightsBucketUnit>
> = { DAY: 'day', WEEK: 'week', MONTH: 'month' };

/** Si la pregunta es la de recomendación (NPS). */
function isNpsQuestion(q: QuestionMeta): boolean {
  if (q.answerType !== 'SCALE' || q.scaleMin !== 0 || q.scaleMax !== 10)
    return false;
  if (q.dimension) return q.dimension === NPS_DIMENSION;
  return normalizeSurveyText(q.text).includes('recomend');
}

/** Orden de la lista: dimensiones base en su orden, luego las propias. */
function compareGroups(a: QuestionGroup, b: QuestionGroup): number {
  const rank = (g: QuestionGroup): number => {
    const dimension = g.representative.dimension;
    return dimension
      ? SURVEY_DIMENSIONS.indexOf(dimension)
      : SURVEY_DIMENSIONS.length;
  };
  return (
    rank(a) - rank(b) ||
    a.representative.position - b.representative.position ||
    a.representative.text.localeCompare(b.representative.text)
  );
}

/** Redondea a `digits` decimales. */
function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
