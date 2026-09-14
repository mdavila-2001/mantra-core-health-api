import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** El rango y el plan que acotan cada consulta del tablero. */
export interface AnalyticsPeriod {
  /** Límite inferior INCLUSIVE, instante UTC exacto del inicio del día civil en La Paz. */
  readonly lo: Date;
  /** Límite superior EXCLUSIVE, instante UTC exacto del inicio del día siguiente al final, en La Paz. */
  readonly hi: Date;
  /** El mismo rango, como fechas civiles `YYYY-MM-DD`: sólo para la proration por mes. */
  readonly loDate: string;
  readonly hiDate: string;
  /** Si se declaró, acota reclamos/afiliados/primas a un plan del carrier. */
  readonly planId?: string;
}

interface CurrencyCountRow {
  readonly currency_concept_id: string | null;
  readonly n: string;
}

interface KpiRow {
  readonly total_claims: number;
  readonly other_currency_claims: number;
  readonly adjudicated_claims: number;
  readonly pending_claims: number;
  readonly total_billed: string;
  readonly total_approved: string;
  readonly total_copay: string;
  readonly total_denied: string;
  readonly active_affiliates: number;
  readonly period_months: string;
  readonly estimated_premiums: string;
  readonly coverages_without_premium: number;
  /**
   * Tasas ya calculadas en Postgres (`numeric`, `NULLIF` contra el
   * denominador): `null` cuando el denominador es 0, nunca `'0.00'` ni un
   * error de división. Ninguna se recalcula en JS.
   */
  readonly approval_rate_percent: string | null;
  readonly avg_monthly_per_capita: string | null;
  readonly avg_annual_per_capita: string | null;
  readonly loss_ratio_percent: string | null;
}

interface MonthlyTrendRow {
  readonly period: string;
  readonly billed_amount: string;
  readonly approved_amount: string;
  readonly claims_count: number;
}

interface TopMedicationRow {
  readonly medication_code: string | null;
  readonly medication_name: string;
  readonly units: string;
  readonly total_expense: string;
  readonly share_percent: string;
}

interface SpecialtyRow {
  readonly specialty_code: string;
  readonly specialty_name: string;
  readonly consultations: number;
}

interface PathologyRow {
  readonly code: string;
  readonly display: string;
  readonly cases: number;
  readonly percentage: string;
}

interface ImmunizationRow {
  readonly vaccinated: number;
  readonly total: number;
  /** `null` sin afiliados activos (nunca `'0.00'`). Calculado en Postgres. */
  readonly rate_percent: string | null;
}

/**
 * Acceso a datos del tablero de siniestralidad (subtarea 3.1, v4.2.14).
 *
 * Todo por SQL crudo (`em.getConnection().execute`), como
 * `ProcedureNomenclatureService.listSpecialties()` — el precedente del repo
 * para una agregación de lectura: `?` posicionales (el driver no convierte
 * arrays de JS a arrays de Postgres, así que un `IN` con lista se arma con un
 * marcador por elemento, nunca `= any(?)`), filas tipadas con un genérico
 * inline, y toda la aritmética monetaria en `numeric` de Postgres —
 * `round(…, 2)::text` — nunca en JS. Cada consulta repite el filtro de
 * reclamos del periodo porque `getConnection().execute` no comparte CTEs
 * entre llamadas: es el mismo patrón que el resto del módulo.
 *
 * **Límites del periodo**: `period.lo`/`period.hi` son instantes UTC exactos
 * de medianoche civil en `America/La_Paz` (Bolivia no tiene DST, así que el
 * servicio los calcula con un offset fijo -04:00 en vez de `AT TIME ZONE` por
 * fila — más barato y sin sorpresas). `period.loDate`/`hiDate` son las mismas
 * fechas como `date` puro, sólo para la proration mensual (afiliados y primas
 * se cuentan por SOLAPAMIENTO de fechas civiles, no de instantes).
 *
 * **Hallazgo destapado, no corregido acá**: `insurance_claim_lines` declara
 * `inventory_reservation_line_id` en las 4 capas del modelo
 * (`SQL/26_insurance/02_tables.sql:346`) pero la columna está AUSENTE en la
 * base Neon que apunta este `.env` (verificado 2026-09-14: `information_schema.columns`
 * no la lista, aunque columnas de patches posteriores como v4.2.10 sí están).
 * El enlace vía `inventory_reservation_line_id` que escribe
 * `linked-claim-order.service.ts` ya está roto en esta base para cualquier
 * lectura o escritura que lo toque; `topMedications()` usa sólo
 * `medication_dispensation_line_id` (la única columna presente, y la que
 * puebla el corpus de seeds — 16/16 líneas mock, 0/16 con el otro enlace).
 * Cuando se corrija la deriva, sumar el segundo enlace es un `COALESCE` más.
 */
@Injectable()
export class InsuranceAnalyticsRepository {
  /**
   * La moneda con más reclamos del carrier en el periodo; empate → `bobConceptId`.
   * `null` si no hay ningún reclamo en el rango.
   */
  async dominantCurrency(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    reversedConceptId: string,
    bobConceptId: string,
  ): Promise<string | null> {
    const rows = await em.getConnection().execute<CurrencyCountRow[]>(
      `SELECT c.currency_concept_id AS currency_concept_id, count(*)::text AS n
         FROM insurance.insurance_claims c
        WHERE c.insurance_carrier_id = ?
          AND c.submitted_at >= ? AND c.submitted_at < ?
          AND c.status_concept_id <> ?
          AND (?::uuid IS NULL OR EXISTS (
                SELECT 1 FROM insurance.patient_coverages pc
                 WHERE pc.id = c.patient_coverage_id AND pc.insurance_plan_id = ?::uuid
              ))
        GROUP BY c.currency_concept_id
        ORDER BY count(*) DESC, (c.currency_concept_id = ?) DESC NULLS LAST
        LIMIT 1`,
      [
        carrierId,
        period.lo,
        period.hi,
        reversedConceptId,
        period.planId ?? null,
        period.planId ?? null,
        bobConceptId,
      ],
    );
    return rows[0]?.currency_concept_id ?? null;
  }

  /**
   * Los KPI del encabezado: conteos y sumas de reclamos en la moneda de
   * reporte, afiliados activos, meses del periodo y primas devengadas.
   */
  async kpis(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    reversedConceptId: string,
    coverageActiveConceptId: string,
    dependentActiveConceptId: string,
    reportCurrencyConceptId: string | null,
  ): Promise<KpiRow> {
    const rows = await em.getConnection().execute<KpiRow[]>(
      `WITH claims AS (
         SELECT c.id, c.total_amount, c.currency_concept_id
           FROM insurance.insurance_claims c
          WHERE c.insurance_carrier_id = ?
            AND c.submitted_at >= ? AND c.submitted_at < ?
            AND c.status_concept_id <> ?
            AND (?::uuid IS NULL OR EXISTS (
                  SELECT 1 FROM insurance.patient_coverages pc
                   WHERE pc.id = c.patient_coverage_id AND pc.insurance_plan_id = ?::uuid
                ))
       ),
       current_version AS (
         SELECT DISTINCT ON (v.insurance_claim_id)
           v.insurance_claim_id, v.total_approved_amount, v.total_patient_amount, v.total_denied_amount
           FROM insurance.claim_adjudication_versions v
           JOIN claims c ON c.id = v.insurance_claim_id
          ORDER BY v.insurance_claim_id, v.adjudication_version DESC
       ),
       claim_totals AS (
         SELECT
           count(*) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?) AS total_claims,
           count(*) FILTER (WHERE c.currency_concept_id IS DISTINCT FROM ?) AS other_currency_claims,
           count(cv.insurance_claim_id) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?) AS adjudicated_claims,
           coalesce(sum(c.total_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?), 0) AS total_billed_n,
           coalesce(sum(c.total_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ? AND cv.insurance_claim_id IS NOT NULL), 0) AS total_billed_adjudicated_n,
           coalesce(sum(cv.total_approved_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?), 0) AS total_approved_n,
           coalesce(sum(cv.total_patient_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?), 0) AS total_copay_n,
           coalesce(sum(cv.total_denied_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?), 0) AS total_denied_n
           FROM claims c
           LEFT JOIN current_version cv ON cv.insurance_claim_id = c.id
       ),
       affiliates AS (
         SELECT pc.patient_profile_id
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND (pc.effective_from IS NULL OR pc.effective_from < (?::date + 1))
            AND (pc.effective_to IS NULL OR pc.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
         UNION
         SELECT cd.dependent_patient_profile_id
           FROM insurance.coverage_dependents cd
           JOIN insurance.patient_coverages pc ON pc.id = cd.patient_coverage_id
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND cd.status_concept_id = ?
            AND (cd.effective_from IS NULL OR cd.effective_from < (?::date + 1))
            AND (cd.effective_to IS NULL OR cd.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
       ),
       months AS (
         SELECT gs::date AS month_start,
                (gs + interval '1 month')::date AS month_end,
                GREATEST(gs::date, ?::date) AS overlap_start,
                LEAST((gs + interval '1 month')::date, (?::date + 1)) AS overlap_end
           FROM generate_series(date_trunc('month', ?::date), date_trunc('month', ?::date), interval '1 month') AS gs
       ),
       period AS (
         SELECT round(coalesce(sum(GREATEST(overlap_end - overlap_start, 0)::numeric / (month_end - month_start)), 0), 2) AS months
           FROM months
       ),
       premium_by_month AS (
         SELECT
           pl.monthly_premium_amount *
             (GREATEST(LEAST(m.overlap_end, COALESCE(pc.effective_to, m.overlap_end) + 1)
                       - GREATEST(m.overlap_start, COALESCE(pc.effective_from, m.overlap_start)), 0)::numeric
              / (m.month_end - m.month_start)) AS month_premium
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
           CROSS JOIN months m
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND pl.monthly_premium_amount IS NOT NULL
            AND pl.currency_concept_id IS NOT DISTINCT FROM ?
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
            AND (pc.effective_from IS NULL OR pc.effective_from < m.overlap_end)
            AND (pc.effective_to IS NULL OR pc.effective_to >= m.overlap_start)
       ),
       premiums AS (
         SELECT coalesce(sum(month_premium), 0) AS estimated_premiums_n
           FROM premium_by_month
       ),
       coverages_without_premium AS (
         SELECT count(DISTINCT pc.id)::int AS n
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND pl.monthly_premium_amount IS NULL
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
            AND (pc.effective_from IS NULL OR pc.effective_from < (?::date + 1))
            AND (pc.effective_to IS NULL OR pc.effective_to >= ?::date)
       )
       SELECT
         ct.total_claims::int AS total_claims,
         ct.other_currency_claims::int AS other_currency_claims,
         ct.adjudicated_claims::int AS adjudicated_claims,
         (ct.total_claims - ct.adjudicated_claims)::int AS pending_claims,
         round(ct.total_billed_n, 2)::text AS total_billed,
         round(ct.total_approved_n, 2)::text AS total_approved,
         round(ct.total_copay_n, 2)::text AS total_copay,
         round(ct.total_denied_n, 2)::text AS total_denied,
         (SELECT count(*)::int FROM affiliates) AS active_affiliates,
         p.months::text AS period_months,
         round(pr.estimated_premiums_n, 2)::text AS estimated_premiums,
         cwp.n AS coverages_without_premium,
         CASE WHEN ct.adjudicated_claims = 0 OR ct.total_billed_adjudicated_n = 0 THEN NULL
              ELSE round(ct.total_approved_n / ct.total_billed_adjudicated_n * 100, 2)::text END AS approval_rate_percent,
         CASE WHEN (SELECT count(*) FROM affiliates) = 0 OR p.months = 0 THEN NULL
              ELSE round(ct.total_approved_n / (SELECT count(*) FROM affiliates) / p.months, 2)::text END AS avg_monthly_per_capita,
         CASE WHEN (SELECT count(*) FROM affiliates) = 0 OR p.months = 0 THEN NULL
              ELSE round(ct.total_approved_n / (SELECT count(*) FROM affiliates) / p.months * 12, 2)::text END AS avg_annual_per_capita,
         CASE WHEN pr.estimated_premiums_n = 0 THEN NULL
              ELSE round(ct.total_approved_n / pr.estimated_premiums_n * 100, 2)::text END AS loss_ratio_percent
         FROM claim_totals ct, period p, premiums pr, coverages_without_premium cwp`,
      [
        carrierId,
        period.lo,
        period.hi,
        reversedConceptId,
        period.planId ?? null,
        period.planId ?? null,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        carrierId,
        coverageActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        carrierId,
        dependentActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        period.loDate,
        period.hiDate,
        period.loDate,
        period.hiDate,
        carrierId,
        coverageActiveConceptId,
        reportCurrencyConceptId,
        period.planId ?? null,
        period.planId ?? null,
        carrierId,
        coverageActiveConceptId,
        period.planId ?? null,
        period.planId ?? null,
        period.hiDate,
        period.loDate,
      ],
    );
    return rows[0];
  }

  /** Un mes por fila entre `loDate` y `hiDate`, con ceros si no hubo reclamos. */
  async monthlyTrends(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    reversedConceptId: string,
    reportCurrencyConceptId: string | null,
  ): Promise<MonthlyTrendRow[]> {
    return em.getConnection().execute<MonthlyTrendRow[]>(
      `WITH claims AS (
         SELECT c.id, c.total_amount, c.currency_concept_id, c.submitted_at
           FROM insurance.insurance_claims c
          WHERE c.insurance_carrier_id = ?
            AND c.submitted_at >= ? AND c.submitted_at < ?
            AND c.status_concept_id <> ?
            AND (?::uuid IS NULL OR EXISTS (
                  SELECT 1 FROM insurance.patient_coverages pc
                   WHERE pc.id = c.patient_coverage_id AND pc.insurance_plan_id = ?::uuid
                ))
       ),
       current_version AS (
         SELECT DISTINCT ON (v.insurance_claim_id)
           v.insurance_claim_id, v.total_approved_amount
           FROM insurance.claim_adjudication_versions v
           JOIN claims c ON c.id = v.insurance_claim_id
          ORDER BY v.insurance_claim_id, v.adjudication_version DESC
       ),
       monthly AS (
         SELECT to_char(c.submitted_at AT TIME ZONE 'America/La_Paz', 'YYYY-MM') AS period,
                sum(c.total_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?) AS billed,
                sum(cv.total_approved_amount) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?) AS approved,
                count(*) FILTER (WHERE c.currency_concept_id IS NOT DISTINCT FROM ?) AS n
           FROM claims c
           LEFT JOIN current_version cv ON cv.insurance_claim_id = c.id
          GROUP BY 1
       ),
       months AS (
         SELECT to_char(gs, 'YYYY-MM') AS period
           FROM generate_series(date_trunc('month', ?::date), date_trunc('month', ?::date), interval '1 month') AS gs
       )
       SELECT m.period,
              round(coalesce(mo.billed, 0), 2)::text AS billed_amount,
              round(coalesce(mo.approved, 0), 2)::text AS approved_amount,
              coalesce(mo.n, 0)::int AS claims_count
         FROM months m
         LEFT JOIN monthly mo ON mo.period = m.period
        ORDER BY m.period`,
      [
        carrierId,
        period.lo,
        period.hi,
        reversedConceptId,
        period.planId ?? null,
        period.planId ?? null,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        reportCurrencyConceptId,
        period.loDate,
        period.hiDate,
      ],
    );
  }

  /**
   * Top 10 medicamentos por gasto facturado del periodo.
   *
   * Sólo vía `medication_dispensation_line_id` — ver el aviso de cabecera
   * sobre `inventory_reservation_line_id`, ausente en esta base.
   */
  async topMedications(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    reversedConceptId: string,
  ): Promise<TopMedicationRow[]> {
    return em.getConnection().execute<TopMedicationRow[]>(
      `WITH claims AS (
         SELECT c.id
           FROM insurance.insurance_claims c
          WHERE c.insurance_carrier_id = ?
            AND c.submitted_at >= ? AND c.submitted_at < ?
            AND c.status_concept_id <> ?
            AND (?::uuid IS NULL OR EXISTS (
                  SELECT 1 FROM insurance.patient_coverages pc
                   WHERE pc.id = c.patient_coverage_id AND pc.insurance_plan_id = ?::uuid
                ))
       ),
       lines AS (
         SELECT l.quantity, l.billed_amount, mdl.pharmacy_product_id
           FROM insurance.insurance_claim_lines l
           JOIN claims c ON c.id = l.insurance_claim_id
           JOIN pharmacy_inventory.medication_dispensation_lines mdl ON mdl.id = l.medication_dispensation_line_id
          WHERE l.medication_dispensation_line_id IS NOT NULL
       ),
       priced AS (
         SELECT ln.quantity, ln.billed_amount, pp.product_code, pp.brand_name, pp.generic_name,
                mc.code AS med_code, mc.display AS med_display
           FROM lines ln
           JOIN pharmacy.pharmacy_products pp ON pp.id = ln.pharmacy_product_id
           LEFT JOIN terminology.catalog_concepts mc ON mc.id = pp.medication_concept_id
       ),
       grouped AS (
         SELECT
           coalesce(med_code, product_code) AS medication_code,
           coalesce(med_display, brand_name, generic_name, product_code) AS medication_name,
           sum(quantity) AS units,
           round(coalesce(sum(billed_amount), 0), 2) AS total_expense
           FROM priced
          GROUP BY 1, 2
       ),
       totals AS (SELECT coalesce(sum(total_expense), 0) AS grand_total FROM grouped)
       SELECT medication_code, medication_name, units::text AS units,
              total_expense::text AS total_expense,
              round(CASE WHEN t.grand_total = 0 THEN 0 ELSE total_expense / t.grand_total * 100 END, 2)::text AS share_percent
         FROM grouped, totals t
        ORDER BY total_expense DESC
        LIMIT 10`,
      [
        carrierId,
        period.lo,
        period.hi,
        reversedConceptId,
        period.planId ?? null,
        period.planId ?? null,
      ],
    );
  }

  /**
   * Consultas por especialidad de la POBLACIÓN AFILIADA en el periodo
   * (encuentros de los afiliados, no reclamos: `insurance_claims.encounter_id`
   * no lo escribe ningún camino de alta de la API).
   */
  async specialties(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    coverageActiveConceptId: string,
    dependentActiveConceptId: string,
  ): Promise<SpecialtyRow[]> {
    return em.getConnection().execute<SpecialtyRow[]>(
      `WITH affiliates AS (
         SELECT pc.patient_profile_id
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND (pc.effective_from IS NULL OR pc.effective_from < (?::date + 1))
            AND (pc.effective_to IS NULL OR pc.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
         UNION
         SELECT cd.dependent_patient_profile_id
           FROM insurance.coverage_dependents cd
           JOIN insurance.patient_coverages pc ON pc.id = cd.patient_coverage_id
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND cd.status_concept_id = ?
            AND (cd.effective_from IS NULL OR cd.effective_from < (?::date + 1))
            AND (cd.effective_to IS NULL OR cd.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
       ),
       encounters AS (
         SELECT e.id, e.start_at, coalesce(e.primary_practitioner_id, a.practitioner_profile_id) AS practitioner_id
           FROM clinical.encounters e
           LEFT JOIN clinical.appointments a ON a.id = e.appointment_id
          WHERE e.patient_profile_id IN (SELECT patient_profile_id FROM affiliates)
            AND e.start_at >= ? AND e.start_at < ?
       ),
       specialty AS (
         SELECT enc.id AS encounter_id, cc.code AS specialty_code, cc.display AS specialty_name
           FROM encounters enc
           LEFT JOIN LATERAL (
             SELECT ps.specialty_concept_id
               FROM profiles.practitioner_specialties ps
              WHERE ps.practitioner_profile_id = enc.practitioner_id
                AND ps.is_primary IS TRUE
                AND (ps.valid_to IS NULL OR ps.valid_to >= enc.start_at::date)
                AND (ps.valid_from IS NULL OR ps.valid_from <= enc.start_at::date)
              ORDER BY ps.valid_from DESC NULLS LAST
              LIMIT 1
           ) match ON true
           LEFT JOIN terminology.catalog_concepts cc ON cc.id = match.specialty_concept_id
       )
       SELECT coalesce(specialty_code, 'SIN_ESPECIALIDAD') AS specialty_code,
              coalesce(specialty_name, 'Sin especialidad registrada') AS specialty_name,
              count(*)::int AS consultations
         FROM specialty
        GROUP BY 1, 2
        ORDER BY consultations DESC`,
      [
        carrierId,
        coverageActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        carrierId,
        dependentActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        period.lo,
        period.hi,
      ],
    );
  }

  /**
   * Patologías CIE-10-CM de la POBLACIÓN AFILIADA en el periodo (top 10 por
   * casos). Vacío si el code system `icd10cm` no está cargado en esta base.
   */
  async prevalentPathologies(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    coverageActiveConceptId: string,
    dependentActiveConceptId: string,
  ): Promise<PathologyRow[]> {
    return em.getConnection().execute<PathologyRow[]>(
      `WITH affiliates AS (
         SELECT pc.patient_profile_id
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND (pc.effective_from IS NULL OR pc.effective_from < (?::date + 1))
            AND (pc.effective_to IS NULL OR pc.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
         UNION
         SELECT cd.dependent_patient_profile_id
           FROM insurance.coverage_dependents cd
           JOIN insurance.patient_coverages pc ON pc.id = cd.patient_coverage_id
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND cd.status_concept_id = ?
            AND (cd.effective_from IS NULL OR cd.effective_from < (?::date + 1))
            AND (cd.effective_to IS NULL OR cd.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
       ),
       conditions AS (
         SELECT cd.patient_profile_id, cd.code_concept_id
           FROM clinical.conditions cd
          WHERE cd.patient_profile_id IN (SELECT patient_profile_id FROM affiliates)
            AND coalesce(cd.onset_at, cd.created_at) >= ? AND coalesce(cd.onset_at, cd.created_at) < ?
       ),
       icd AS (
         SELECT c.patient_profile_id, cc.code, cc.display
           FROM conditions c
           JOIN terminology.catalog_concepts cc ON cc.id = c.code_concept_id
           JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
           JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
          WHERE cs.internal_code = 'icd10cm'
       ),
       counts AS (
         SELECT code, display, count(DISTINCT patient_profile_id)::int AS cases
           FROM icd
          GROUP BY code, display
       ),
       total AS (SELECT coalesce(sum(cases), 0) AS n FROM counts)
       SELECT code, display, cases,
              round(CASE WHEN t.n = 0 THEN 0 ELSE cases::numeric / t.n * 100 END, 2)::text AS percentage
         FROM counts, total t
        ORDER BY cases DESC
        LIMIT 10`,
      [
        carrierId,
        coverageActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        carrierId,
        dependentActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        period.lo,
        period.hi,
      ],
    );
  }

  /**
   * Cobertura de inmunización ACUMULADA hasta el fin del periodo: un piso,
   * no una tasa real (sólo lo registrado en esta base).
   */
  async immunization(
    em: EntityManager,
    carrierId: string,
    period: AnalyticsPeriod,
    coverageActiveConceptId: string,
    dependentActiveConceptId: string,
    immunizationCompletedConceptId: string,
  ): Promise<ImmunizationRow> {
    const rows = await em.getConnection().execute<ImmunizationRow[]>(
      `WITH affiliates AS (
         SELECT pc.patient_profile_id
           FROM insurance.patient_coverages pc
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND pc.status_concept_id = ?
            AND (pc.effective_from IS NULL OR pc.effective_from < (?::date + 1))
            AND (pc.effective_to IS NULL OR pc.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
         UNION
         SELECT cd.dependent_patient_profile_id
           FROM insurance.coverage_dependents cd
           JOIN insurance.patient_coverages pc ON pc.id = cd.patient_coverage_id
           JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
           JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
          WHERE pr.insurance_carrier_id = ?
            AND cd.status_concept_id = ?
            AND (cd.effective_from IS NULL OR cd.effective_from < (?::date + 1))
            AND (cd.effective_to IS NULL OR cd.effective_to >= ?::date)
            AND (?::uuid IS NULL OR pc.insurance_plan_id = ?::uuid)
       ),
       vaccinated AS (
         SELECT DISTINCT i.patient_profile_id
           FROM clinical.immunizations i
           JOIN affiliates a ON a.patient_profile_id = i.patient_profile_id
          WHERE i.status_concept_id = ? AND i.administered_at < ?
       )
       SELECT (SELECT count(*)::int FROM vaccinated) AS vaccinated,
              (SELECT count(*)::int FROM affiliates) AS total,
              CASE WHEN (SELECT count(*) FROM affiliates) = 0 THEN NULL
                   ELSE round((SELECT count(*) FROM vaccinated)::numeric / (SELECT count(*) FROM affiliates) * 100, 2)::text
              END AS rate_percent`,
      [
        carrierId,
        coverageActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        carrierId,
        dependentActiveConceptId,
        period.hiDate,
        period.loDate,
        period.planId ?? null,
        period.planId ?? null,
        immunizationCompletedConceptId,
        period.hi,
      ],
    );
    return rows[0];
  }
}
