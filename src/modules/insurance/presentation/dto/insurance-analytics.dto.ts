import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { InsuranceConceptDto } from './read.dto';

/**
 * Filtros del tablero de siniestralidad (subtarea 3.1, v4.2.14).
 *
 * Sin `startDate`/`endDate` el servicio usa los últimos 12 meses hasta hoy en
 * `America/La_Paz` (patrón de `patientCoverageReferenceDate`). `strict: true`
 * exige `YYYY-MM-DD`, sin hora: el rango es de días civiles, no de instantes.
 */
export class InsuranceAnalyticsQueryDto {
  @ApiPropertyOptional({
    format: 'date',
    example: '2026-01-01',
    description:
      'Fecha de inicio del periodo (inclusive). Sin ella: 12 meses atrás.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-12-31',
    description:
      'Fecha de fin del periodo (inclusive). Sin ella: hoy en La Paz.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Acota el tablero a un plan del carrier del tenant activo.',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;
}

/**
 * Los KPI del encabezado del tablero.
 *
 * Ningún importe se calcula en el cliente: todos vienen ya sumados y
 * redondeados a 2 decimales en la base (`round(…, 2)::text`). Las tasas y el
 * loss ratio son `null`, nunca `'0.00'` ni `NaN`, cuando su denominador es 0 —
 * misma regla que `MoneyDto`/`money()` del módulo: ausencia ≠ cero.
 */
export class LossRatioKpiDto {
  /** Reclamos del carrier en el periodo (incluye los sin dictamen). */
  @ApiProperty({ example: 42 })
  totalClaimsCount!: number;

  /** De los anteriores, los que ya tienen al menos una versión de adjudicación. */
  @ApiProperty({ example: 38 })
  adjudicatedClaimsCount!: number;

  /** Reclamos enviados y todavía sin dictamen. */
  @ApiProperty({ example: 4 })
  pendingClaimsCount!: number;

  /**
   * Reclamos del periodo en una moneda distinta de la moneda de reporte, o sin
   * moneda declarada. No se suman a ningún importe de este DTO: convertir o
   * inferir una moneda inventaría un dato que la base no tiene.
   */
  @ApiProperty({ example: 0 })
  otherCurrencyClaimsCount!: number;

  /** Suma de `insurance_claims.total_amount` de los reclamos en la moneda de reporte. */
  @ApiProperty({ example: '350000.00' })
  totalBilledAmount!: string;

  /** Suma de `total_approved_amount` de la versión de adjudicación vigente de cada reclamo. */
  @ApiProperty({ example: '280000.00' })
  totalApprovedAmount!: string;

  /** Suma de `total_patient_amount` (copago) de la versión vigente. */
  @ApiProperty({ example: '55000.00' })
  totalPatientCopayAmount!: string;

  /** Suma de `total_denied_amount` de la versión vigente. */
  @ApiProperty({ example: '15000.00' })
  totalDeniedAmount!: string;

  /** Aprobado ÷ facturado, sólo de los reclamos con dictamen. `null` sin dictaminados. */
  @ApiProperty({ nullable: true, type: String, example: '80.00' })
  approvalRatePercent!: string | null;

  /** Titulares con cobertura activa que solapa el periodo, más sus dependientes activos. */
  @ApiProperty({ example: 1250 })
  activeAffiliatesCount!: number;

  /** Duración del periodo en meses, prorrateados por día calendario. */
  @ApiProperty({ example: '3.00' })
  periodMonths!: string;

  /** Aprobado ÷ afiliados activos ÷ meses del periodo. `null` sin afiliados o sin meses. */
  @ApiProperty({ nullable: true, type: String, example: '224.00' })
  averageMonthlyPerCapitaExpense!: string | null;

  /** Gasto mensual × 12. */
  @ApiProperty({ nullable: true, type: String, example: '2688.00' })
  averageAnnualPerCapitaExpense!: string | null;

  /**
   * Primas devengadas estimadas: Σ por cobertura vigente de la prima de lista
   * mensual del plan (v4.2.14) × la fracción de cada mes del periodo que la
   * cobertura estuvo activa. Sólo suma coberturas de planes CON prima en la
   * moneda de reporte.
   */
  @ApiProperty({ example: '400000.00' })
  estimatedPremiumsTotal!: string;

  /** Coberturas vigentes en el periodo cuyo plan no tiene prima declarada. */
  @ApiProperty({ example: 3 })
  coveragesWithoutPremiumCount!: number;

  /** Aprobado ÷ primas devengadas × 100. `null` sin primas (nunca 0.00 ni infinito). */
  @ApiProperty({ nullable: true, type: String, example: '70.00' })
  lossRatioPercent!: string | null;
}

/** Un mes del periodo, con ceros si no hubo reclamos. */
export class MonthlyTrendDto {
  @ApiProperty({ example: '2026-01' })
  period!: string;

  @ApiProperty({ example: '28000.00' })
  billedAmount!: string;

  @ApiProperty({ example: '22400.00' })
  approvedAmount!: string;

  @ApiProperty({ example: 35 })
  claimsCount!: number;
}

/**
 * Una fila del top de medicamentos, por gasto facturado del periodo.
 *
 * La línea del reclamo enlaza a farmacia por dos caminos posibles (el que
 * escribe el runtime y el que trae el corpus de seeds): la agregación los
 * combina con `COALESCE`. El producto se agrupa por su concepto RxNorm/interno
 * cuando el producto lo declara, y si no, por el producto mismo.
 */
export class TopMedicationDto {
  @ApiProperty({ example: 'MED-001', nullable: true, type: String })
  medicationCode!: string | null;

  @ApiProperty({ example: 'Losartán Potásico 50mg' })
  medicationName!: string;

  /** Suma de `quantity` de las líneas agrupadas. */
  @ApiProperty({ example: '180' })
  dispensationsCount!: string;

  @ApiProperty({ example: '14400.00' })
  totalExpenseAmount!: string;

  /** Porcentaje sobre el total facturado en líneas de farmacia del periodo. */
  @ApiProperty({ example: '12.50' })
  sharePercent!: string;
}

/**
 * Consultas por especialidad de la POBLACIÓN AFILIADA en el periodo.
 *
 * No es «reclamado»: `insurance_claims.encounter_id` no lo escribe ningún
 * camino de alta de la API, así que no hay forma honesta de atar un reclamo a
 * un encuentro clínico concreto. Esta fila cuenta encuentros de los afiliados
 * del carrier (o del plan filtrado) agrupados por la especialidad principal
 * del profesional que atendió — por eso `totalExpenseAmount` es siempre `null`.
 */
export class SpecialtyDistributionDto {
  @ApiProperty({ example: 'MED_GEN', nullable: true, type: String })
  specialtyCode!: string | null;

  @ApiProperty({ example: 'Medicina General' })
  specialtyName!: string;

  @ApiProperty({ example: 150 })
  consultationsCount!: number;

  /** Siempre `null`: el gasto no es reconstruible sin el enlace reclamo→encuentro. */
  @ApiProperty({ nullable: true, type: String })
  totalExpenseAmount!: string | null;
}

/**
 * Patologías de la POBLACIÓN AFILIADA en el periodo, sólo CIE-10-CM.
 *
 * Igual que la especialidad: no se puede filtrar por «causó un reclamo», así
 * que esto es morbilidad de los afiliados, no morbilidad reclamada.
 */
export class PrevalentPathologyDto {
  @ApiProperty({ example: 'I10' })
  code!: string;

  @ApiProperty({ example: 'Hipertensión Esencial (Primaria)' })
  description!: string;

  /** Pacientes distintos con al menos una condición de ese código en el periodo. */
  @ApiProperty({ example: 95 })
  casesCount!: number;

  /** Sobre la suma de `casesCount` de TODOS los códigos CIE-10 de la lista. */
  @ApiProperty({ example: '22.60' })
  percentage!: string;
}

/**
 * Cobertura de inmunización, acumulada hasta el fin del periodo.
 *
 * Es un PISO, no una tasa real: sólo cuenta lo registrado en esta base
 * (`clinical.immunizations`, único estado `IMM_COMPLETED`), no lo que un
 * afiliado se aplicó en otra institución.
 */
export class ImmunizationRateDto {
  @ApiProperty({ example: 980 })
  vaccinatedCount!: number;

  @ApiProperty({ example: 270 })
  unvaccinatedCount!: number;

  /** `null` sin afiliados activos (nunca `'0.00'`). */
  @ApiProperty({ nullable: true, type: String, example: '78.40' })
  vaccinationRatePercent!: string | null;
}

/** El tablero completo de una aseguradora para un periodo y, opcionalmente, un plan. */
export class InsuranceDashboardAnalyticsResponseDto {
  @ApiProperty()
  carrierId!: string;

  @ApiProperty({ example: 'Seguros Andina' })
  carrierLegalName!: string;

  @ApiProperty({ format: 'date' })
  startDate!: string;

  @ApiProperty({ format: 'date' })
  endDate!: string;

  /**
   * Moneda de reporte: la más frecuente entre los reclamos del periodo
   * (empate → boliviano). Todos los importes del DTO están en esta moneda;
   * los reclamos en otra moneda se cuentan en `kpis.otherCurrencyClaimsCount`
   * y no se suman a ningún importe. `null` sin reclamos en el periodo.
   */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  currency!: InsuranceConceptDto | null;

  @ApiProperty({ type: LossRatioKpiDto })
  kpis!: LossRatioKpiDto;

  @ApiProperty({ type: [MonthlyTrendDto] })
  monthlyTrends!: MonthlyTrendDto[];

  @ApiProperty({ type: [TopMedicationDto] })
  topMedications!: TopMedicationDto[];

  @ApiProperty({ type: [SpecialtyDistributionDto] })
  specialties!: SpecialtyDistributionDto[];

  @ApiProperty({ type: [PrevalentPathologyDto] })
  prevalentPathologies!: PrevalentPathologyDto[];

  @ApiProperty({ type: ImmunizationRateDto })
  immunization!: ImmunizationRateDto;
}
