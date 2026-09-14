import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import { patientCoverageReferenceDate } from '../../profiles/patient-coverage-validity';
import { CatalogRepository } from '../repositories';
import {
  InsuranceAnalyticsRepository,
  type AnalyticsPeriod,
} from '../repositories/insurance-analytics.repository';
import { INS } from '../insurance.concepts';
import { CLIN } from '../../clinical/clinical.concepts';
import { CONCEPTS } from '../../../common/constants/concepts';
import type {
  InsuranceAnalyticsQueryDto,
  InsuranceDashboardAnalyticsResponseDto,
} from '../dto';

/** Roles que pueden ver el tablero de una aseguradora sin ser OWNER/ADMIN de su tenant. */
const ANALYTICS_ROLES = ['INSURANCE_OPERATOR', 'SECURITY_ADMIN', 'SUPERADMIN'];

/** Meses por defecto cuando la consulta no declara `startDate`. */
const DEFAULT_PERIOD_MONTHS = 12;

/** Medianoche civil de `America/La_Paz` como instante UTC. Bolivia no tiene DST: offset fijo -04:00. */
function laPazMidnightUtc(civilDate: string): Date {
  return new Date(`${civilDate}T00:00:00.000-04:00`);
}

/** Resta `months` meses calendario a una fecha civil `YYYY-MM-DD`, en aritmética pura (sin zona horaria). */
function monthsBefore(civilDate: string, months: number): string {
  const [year, month, day] = civilDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 - months, day));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Agregador del tablero de siniestralidad, gasto per cápita y epidemiología
 * de UNA aseguradora — subtarea 3.1, v4.2.14.
 *
 * ## Alcance por tenant, no por prestador
 *
 * `ClaimsReadService` (el otro lector de reclamos del módulo) es la cara del
 * PRESTADOR: acota por `billing_provider_entity_id` vía las prácticas del
 * tenant activo. Este servicio es el lado contrario — la cara de la
 * ASEGURADORA — y acota por `insurance_claims.insurance_carrier_id`, resuelto
 * desde el tenant activo con el mismo patrón que
 * `InsuranceBackboneService.administrableCarrier()`.
 *
 * ## Autorización: membresía O rol, nunca `@Roles`
 *
 * Los roles que pide el prompt original (`BILLING_OPERATOR`, `FINANCIAL_AUDITOR`)
 * no sirven acá: el primero es el rol del PRESTADOR (quien factura y cobra), y
 * el segundo no existe en ningún catálogo de roles del proyecto (ni global ni
 * `authz.roles`). Un dueño de aseguradora típico sólo tiene el rol global
 * `USER` — su autoridad es la membresía OWNER/ADMIN del tenant, no un rol del
 * JWT — así que el controlador no lleva `@Roles`: la barrera vive acá,
 * `canAdminister()` (misma membresía que administra el catálogo) **o**
 * `INSURANCE_OPERATOR`/`SECURITY_ADMIN` explícitos (`SUPERADMIN` ya pasa por
 * el comodín de `RolesGuard`, pero se repite para no depender de él).
 *
 * ## Todo el dinero se suma en Postgres
 *
 * Cada método de {@link InsuranceAnalyticsRepository} hace su propia
 * agregación con `round(…, 2)::text`; este servicio nunca sale a JS con un
 * importe y lo vuelve a sumar — sólo arma el DTO con lo que la base devuelve.
 */
@Injectable()
export class InsuranceAnalyticsService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: CatalogRepository,
    private readonly analyticsRepo: InsuranceAnalyticsRepository,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InsuranceAnalyticsService.name);
  }

  async getLossRatioAnalytics(
    query: InsuranceAnalyticsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<InsuranceDashboardAnalyticsResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();

    const carrier = await this.catalogRepo.findCarrierByTenantId(em, tenantId);
    if (!carrier) {
      throw new ResourceNotFoundException('Aseguradora no encontrada', {
        tenantId,
      });
    }

    const canAdminister = await this.tenantAdministration.canAdminister(
      em,
      tenantId,
      actor,
    );
    const hasAnalyticsRole = ANALYTICS_ROLES.some((role) =>
      actor.roles.includes(role),
    );
    if (!canAdminister && !hasAnalyticsRole) {
      throw new ForbiddenException(
        'Rol insuficiente para ver la analítica de la aseguradora',
      );
    }

    if (query.planId) {
      const plan = await this.catalogRepo.findPlanForCarrier(
        em,
        query.planId,
        carrier.id,
      );
      if (!plan) {
        throw new ResourceNotFoundException('Plan no encontrado', {
          planId: query.planId,
        });
      }
    }

    const period = this.resolvePeriod(query);

    const reportCurrencyConceptId = await this.analyticsRepo.dominantCurrency(
      em,
      carrier.id,
      period,
      INS.CLAIM_REVERSED,
      CONCEPTS.CURRENCY_BOB,
    );

    const [
      kpis,
      monthlyTrends,
      topMedications,
      specialties,
      prevalentPathologies,
      immunization,
    ] = await Promise.all([
      this.analyticsRepo.kpis(
        em,
        carrier.id,
        period,
        INS.CLAIM_REVERSED,
        INS.COVERAGE_ACTIVE,
        INS.DEPENDENT_ACTIVE,
        reportCurrencyConceptId,
      ),
      this.analyticsRepo.monthlyTrends(
        em,
        carrier.id,
        period,
        INS.CLAIM_REVERSED,
        reportCurrencyConceptId,
      ),
      this.analyticsRepo.topMedications(
        em,
        carrier.id,
        period,
        INS.CLAIM_REVERSED,
      ),
      this.analyticsRepo.specialties(
        em,
        carrier.id,
        period,
        INS.COVERAGE_ACTIVE,
        INS.DEPENDENT_ACTIVE,
      ),
      this.analyticsRepo.prevalentPathologies(
        em,
        carrier.id,
        period,
        INS.COVERAGE_ACTIVE,
        INS.DEPENDENT_ACTIVE,
      ),
      this.analyticsRepo.immunization(
        em,
        carrier.id,
        period,
        INS.COVERAGE_ACTIVE,
        INS.DEPENDENT_ACTIVE,
        CLIN.IMMUNIZATION_COMPLETED,
      ),
    ]);

    this.logger.info(
      {
        carrierId: carrier.id,
        planId: query.planId ?? null,
        startDate: period.loDate,
        endDate: period.hiDate,
        totalClaims: kpis.total_claims,
      },
      'Tablero de siniestralidad calculado',
    );

    const currency = await this.resolveCurrencyConcept(
      em,
      reportCurrencyConceptId,
    );

    return {
      carrierId: carrier.id,
      carrierLegalName: carrier.legalName,
      startDate: period.loDate,
      endDate: period.hiDate,
      currency,
      kpis: {
        totalClaimsCount: kpis.total_claims,
        adjudicatedClaimsCount: kpis.adjudicated_claims,
        pendingClaimsCount: kpis.pending_claims,
        otherCurrencyClaimsCount: kpis.other_currency_claims,
        totalBilledAmount: kpis.total_billed,
        totalApprovedAmount: kpis.total_approved,
        totalPatientCopayAmount: kpis.total_copay,
        totalDeniedAmount: kpis.total_denied,
        approvalRatePercent: kpis.approval_rate_percent,
        activeAffiliatesCount: kpis.active_affiliates,
        periodMonths: kpis.period_months,
        averageMonthlyPerCapitaExpense: kpis.avg_monthly_per_capita,
        averageAnnualPerCapitaExpense: kpis.avg_annual_per_capita,
        estimatedPremiumsTotal: kpis.estimated_premiums,
        coveragesWithoutPremiumCount: kpis.coverages_without_premium,
        lossRatioPercent: kpis.loss_ratio_percent,
      },
      monthlyTrends: monthlyTrends.map((row) => ({
        period: row.period,
        billedAmount: row.billed_amount,
        approvedAmount: row.approved_amount,
        claimsCount: row.claims_count,
      })),
      topMedications: topMedications.map((row) => ({
        medicationCode: row.medication_code,
        medicationName: row.medication_name,
        dispensationsCount: row.units,
        totalExpenseAmount: row.total_expense,
        sharePercent: row.share_percent,
      })),
      specialties: specialties.map((row) => ({
        specialtyCode:
          row.specialty_code === 'SIN_ESPECIALIDAD' ? null : row.specialty_code,
        specialtyName: row.specialty_name,
        consultationsCount: row.consultations,
        totalExpenseAmount: null,
      })),
      prevalentPathologies: prevalentPathologies.map((row) => ({
        code: row.code,
        description: row.display,
        casesCount: row.cases,
        percentage: row.percentage,
      })),
      immunization: {
        vaccinatedCount: immunization.vaccinated,
        unvaccinatedCount: immunization.total - immunization.vaccinated,
        vaccinationRatePercent: immunization.rate_percent,
      },
    };
  }

  /**
   * Resuelve el periodo: por defecto, los últimos {@link DEFAULT_PERIOD_MONTHS}
   * meses hasta hoy en La Paz (mismo "hoy" que usa el resto del módulo de
   * coberturas, vía {@link patientCoverageReferenceDate}). `startDate > endDate`
   * — con o sin defaults de por medio — es un rango inválido: 422.
   */
  private resolvePeriod(query: InsuranceAnalyticsQueryDto): AnalyticsPeriod {
    const today = patientCoverageReferenceDate();
    const hiDate = query.endDate ?? today;
    const loDate =
      query.startDate ?? monthsBefore(hiDate, DEFAULT_PERIOD_MONTHS);

    if (loDate > hiDate) {
      throw new PreconditionFailedException(
        'startDate debe ser anterior o igual a endDate',
        { startDate: loDate, endDate: hiDate },
      );
    }

    const lo = laPazMidnightUtc(loDate);
    const hi = new Date(
      laPazMidnightUtc(hiDate).getTime() + 24 * 60 * 60 * 1000,
    );

    return {
      lo,
      hi,
      loDate,
      hiDate,
      planId: query.planId,
    };
  }

  private async resolveCurrencyConcept(
    em: EntityManager,
    conceptId: string | null,
  ): Promise<{ code: string; display: string } | null> {
    if (!conceptId) return null;
    const rows = await em
      .getConnection()
      .execute<{ code: string; display: string }[]>(
        `SELECT code, display FROM terminology.catalog_concepts WHERE id = ?`,
        [conceptId],
      );
    return rows[0] ?? null;
  }
}
