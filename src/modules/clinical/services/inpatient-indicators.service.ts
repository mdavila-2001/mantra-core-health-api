import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { CLIN } from '../clinical.concepts';
import type { CensusCounts } from '../domain/census-calculation';
import {
  computeIndicators,
  type InpatientIndicators,
  type TurnaroundSample,
} from '../domain/inpatient-indicator-formulas';
import type { IndicatorsQueryDto } from '../dto/adt.dto';
import { INFRA_F3_ACTIONS } from '../policies/infra-f3.policy';
import { AdtAccessService } from './adt-access.service';
import {
  InpatientCensusService,
  addDays,
  adjustedTotals,
} from './inpatient-census.service';

/** Tope del rango de indicadores (F3.3). */
export const MAX_INDICATOR_DAYS = 366;

/** Indicadores de cama de la línea OPS a partir de los censos cerrados. */
@Injectable()
export class InpatientIndicatorsService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Política de F3.
   * @param census - Censo (ajustes y totales ajustados).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: AdtAccessService,
    private readonly census: InpatientCensusService,
  ) {}

  /**
   * `GET /sites/:siteId/inpatient-indicators?from&to&unitId`.
   *
   * Sólo cuentan los días **cerrados**, con sus ajustes ya aplicados; los días que
   * faltan se declaran en `coverage.daysMissing` y no se inventan.
   *
   * @param siteId - Establecimiento.
   * @param query - Rango y unidad.
   * @param actor - Quien consulta.
   */
  async indicators(
    siteId: string,
    query: IndicatorsQueryDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) => {
      const scope = await this.access.forSite(tx, siteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.INDICATORS_VIEW);

      const periodDays = daysBetween(query.from, query.to) + 1;
      if (periodDays < 1) {
        throw new PreconditionFailedException(
          'El rango es inválido: "from" debe ser anterior o igual a "to"',
          undefined,
          ClinicalErrorReason.INDICATOR_RANGE_INVALID,
        );
      }
      if (periodDays > MAX_INDICATOR_DAYS) {
        throw new PreconditionFailedException(
          `El rango no puede superar ${MAX_INDICATOR_DAYS} días`,
          { maxDays: MAX_INDICATOR_DAYS, requestedDays: periodDays },
          ClinicalErrorReason.INDICATOR_RANGE_TOO_LONG,
        );
      }
      if (query.unitId) {
        const unit = await tx.execute<{ id: string }[]>(
          'select id from practice.clinical_units where id = ? and tenant_id = ? and practice_site_id = ?',
          [query.unitId, scope.tenantId, siteId],
        );
        if (unit.length === 0) throw this.notFound();
      }

      const rows = await tx.execute<Record<string, unknown>[]>(
        `select * from clinical.inpatient_census_days
          where tenant_id = ? and practice_site_id = ? and closed_at is not null
            and census_date between ?::date and ?::date
            ${query.unitId ? 'and clinical_unit_id = ?' : ''}
          order by census_date, clinical_unit_id`,
        query.unitId
          ? [scope.tenantId, siteId, query.from, query.to, query.unitId]
          : [scope.tenantId, siteId, query.from, query.to],
      );
      const adjustments = await this.census.adjustmentsOf(
        tx,
        rows.map((row) => row['id'] as string),
      );
      const closedDates = new Set<string>();
      const counts: CensusCounts[] = rows.map((row) => {
        closedDates.add(dateOnly(row['census_date'] as Date | string));
        return adjustedTotals(
          this.census.snapshotOf(row),
          adjustments.filter((a) => a.censusDayId === row['id']),
        );
      });
      const daysMissing: string[] = [];
      for (let i = 0; i < periodDays; i += 1) {
        const day = addDays(query.from, i);
        if (!closedDates.has(day)) daysMissing.push(day);
      }

      const samples = await this.turnaroundSamples(tx, {
        tenantId: scope.tenantId,
        siteId,
        from: query.from,
        to: query.to,
        unitId: query.unitId,
      });
      const indicators: InpatientIndicators = computeIndicators(
        counts,
        periodDays,
        samples,
      );
      return {
        period: { from: query.from, to: query.to },
        unitId: query.unitId ?? null,
        ...indicators,
        coverage: {
          daysClosed: closedDates.size,
          daysMissing,
        },
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /** Egresos del período con la orden de limpieza que los siguió. */
  private async turnaroundSamples(
    tx: EntityManager,
    p: {
      tenantId: string;
      siteId: string;
      from: string;
      to: string;
      unitId?: string;
    },
  ): Promise<TurnaroundSample[]> {
    const tz = await tx.execute<{ tz: string }[]>(
      `select coalesce(s.time_zone, p.time_zone, 'UTC') as tz
         from practice.practice_sites s join practice.practices p on p.id = s.practice_id
        where s.id = ?`,
      [p.siteId],
    );
    const zone = tz[0]?.tz ?? 'UTC';
    const rows = await tx.execute<
      {
        discharged_at: Date;
        requested_at: Date;
        started_at: Date | null;
        finished_at: Date | null;
        inspected_at: Date | null;
      }[]
    >(
      `select el.period_end as discharged_at, co.requested_at, co.started_at, co.finished_at, co.inspected_at
         from clinical.encounter_locations el
         join lateral (
              select c.requested_at, c.started_at, c.finished_at, c.inspected_at
                from practice.cleaning_orders c
               where c.care_space_id = el.care_space_id and c.tenant_id = el.tenant_id
                 and c.requested_at >= el.period_end - interval '1 minute'
               order by c.requested_at limit 1) co on true
        where el.tenant_id = ? and el.practice_site_id = ? and el.is_bed_assignment
          and el.end_reason_concept_id = ?
          and el.period_end >= (?::date)::timestamp at time zone ?
          and el.period_end < ((?::date) + 1)::timestamp at time zone ?
          ${p.unitId ? 'and el.clinical_unit_id = ?' : ''}`,
      [
        p.tenantId,
        p.siteId,
        CLIN.ADT_END_DISCHARGE,
        p.from,
        zone,
        p.to,
        zone,
        ...(p.unitId ? [p.unitId] : []),
      ],
    );
    return rows.map((row) => ({
      dischargedAt: new Date(row.discharged_at),
      requestedAt: new Date(row.requested_at),
      startedAt: row.started_at ? new Date(row.started_at) : null,
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      inspectedAt: row.inspected_at ? new Date(row.inspected_at) : null,
    }));
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}

/** Días entre dos fechas `YYYY-MM-DD` (to − from). */
export function daysBetween(from: string, to: string): number {
  const day = (iso: string): number =>
    Date.UTC(
      Number(iso.slice(0, 4)),
      Number(iso.slice(5, 7)) - 1,
      Number(iso.slice(8, 10)),
    ) / 86_400_000;
  return day(to) - day(from);
}

/** `YYYY-MM-DD` de una fecha de base. */
function dateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
