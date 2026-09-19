import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Formatos de entrega del certificado de portabilidad. `BUNDLE` es el
 * default: al titular casi siempre le conviene llevarse los dos, y elegir
 * uno solo es la excepción, no la regla.
 */
export enum PortabilityExportFormat {
  PDF = 'PDF',
  JSON = 'JSON',
  BUNDLE = 'BUNDLE',
}

/**
 * Cuerpo de `POST /insurance/portability/export`.
 *
 * `targetInsurerTenantId` es un metadato declarado por el titular, no un
 * traspaso: el modelo todavía no tiene `data_use_agreements` (T-27 §24 · c),
 * así que acá sólo se registra la intención en `delivery_destination_json`.
 */
export class RequestPortabilityExportDto {
  /** Perfil de paciente titular del historial. Tiene que ser el del actor. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({
    enum: PortabilityExportFormat,
    default: PortabilityExportFormat.BUNDLE,
  })
  @IsOptional()
  @IsEnum(PortabilityExportFormat)
  format?: PortabilityExportFormat = PortabilityExportFormat.BUNDLE;

  /**
   * Aseguradora a la que el titular declara que quiere llevar su historial.
   * Sólo se acepta si el tenant es una aseguradora activa; no dispara ningún
   * envío ni acuerdo entre organizaciones.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetInsurerTenantId?: string;
}

/** El afiliado, con lo mínimo para identificarlo en el certificado. */
export class PortabilityPatientDto {
  @ApiProperty({ example: 'Juan Pérez Rodríguez' })
  fullName!: string;

  /** `null` si la persona no tiene documento de identidad nacional cargado. */
  @ApiProperty({ type: String, nullable: true, example: '4872190' })
  nationalId!: string | null;

  /** Departamento de emisión del documento, por su sigla. `null` si no consta. */
  @ApiProperty({ type: String, nullable: true, example: 'SC' })
  nationalIdArea!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '1988-04-12' })
  birthDate!: string | null;
}

/** Una póliza o cobertura declarada por el titular, vigente o no. */
export class PortabilityPolicyDto {
  @ApiProperty({ format: 'uuid' })
  coverageId!: string;

  @ApiProperty({ example: 'Seguros Andina S.A.' })
  carrierName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Plan Oro Familiar' })
  planName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  productName!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'POL-99218-ORO' })
  policyIdentifier!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'AF-4471' })
  memberIdentifier!: string | null;

  /** `SELF`, `SPOUSE`, `CHILD`… en el código del concepto. */
  @ApiProperty({ example: 'SELF' })
  relationship!: string;

  @ApiProperty({ type: String, nullable: true, example: '2023-01-01' })
  startDate!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2026-12-31' })
  endDate!: string | null;

  /** Código del estado de la cobertura (`COVERAGE_ACTIVE`…). */
  @ApiProperty({ example: 'COVERAGE_ACTIVE' })
  status!: string;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currencyCode!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '450.00' })
  monthlyPremiumAmount!: string | null;
}

/** Un ítem facturado dentro de un reclamo, con su dictamen si lo tiene. */
export class PortabilityClaimLineDto {
  @ApiProperty()
  lineSequence!: number;

  @ApiProperty({ type: String, nullable: true })
  serviceName!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['DIAGNOSTIC_STUDY', 'MEDICATION_DISPENSATION', null],
  })
  referenceType!: 'DIAGNOSTIC_STUDY' | 'MEDICATION_DISPENSATION' | null;

  @ApiProperty({ example: '450.00' })
  billedAmount!: string;

  @ApiProperty({ type: String, nullable: true })
  patientResponsibilityAmount!: string | null;

  /** Código de la decisión de línea (`LINE_DECISION_APPROVED`…), si ya se dictaminó. */
  @ApiProperty({ type: String, nullable: true })
  decision!: string | null;

  @ApiProperty({ type: String, nullable: true })
  approvedAmount!: string | null;

  @ApiProperty({ type: String, nullable: true })
  deniedAmount!: string | null;

  @ApiProperty({ type: String, nullable: true })
  policyClauseReference!: string | null;

  @ApiProperty({ type: String, nullable: true })
  denialRationale!: string | null;
}

/** Un reclamo (siniestro) del titular, con sus ítems. */
export class PortabilityClaimDto {
  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty({ example: 'CLM-2026-0891' })
  claimIdentifier!: string;

  /** Fecha de presentación del reclamo. No hay `service_date` en el modelo. */
  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-08-14T00:00:00.000Z',
  })
  submittedAt!: string | null;

  @ApiProperty({ example: 'Seguros Andina S.A.' })
  carrierName!: string;

  @ApiProperty({ type: String, nullable: true })
  policyIdentifier!: string | null;

  /** `PRACTICE`, `PHARMACY` o `DIAGNOSTIC_UNIT`, por código de concepto. */
  @ApiProperty({ example: 'PRACTICE' })
  providerType!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Centro Médico Foianini',
  })
  providerName!: string | null;

  /** Código del estado del reclamo (`CLAIM_SUBMITTED`…). Incluye reversados. */
  @ApiProperty({ example: 'CLAIM_PAID' })
  status!: string;

  @ApiProperty({ type: String, nullable: true })
  outcome!: string | null;

  @ApiProperty({ type: String, nullable: true })
  adjudicatedAt!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currencyCode!: string | null;

  @ApiProperty({ example: '450.00' })
  billedTotal!: string;

  @ApiProperty({ type: String, nullable: true })
  approvedTotal!: string | null;

  @ApiProperty({ type: String, nullable: true })
  patientTotal!: string | null;

  @ApiProperty({ type: String, nullable: true })
  deniedTotal!: string | null;

  /**
   * El modelo no liga un diagnóstico a un reclamo (no existe `claim_diagnoses`):
   * siempre viaja `null`. La cronología de diagnósticos va en `conditions`.
   */
  @ApiProperty({ type: String, nullable: true })
  diagnosisCode!: string | null;

  @ApiProperty({ type: [PortabilityClaimLineDto] })
  @ValidateNested({ each: true })
  @Type(() => PortabilityClaimLineDto)
  lines!: PortabilityClaimLineDto[];
}

/** Un diagnóstico (condición clínica) del titular, con su codificación si existe. */
export class PortabilityConditionDto {
  @ApiProperty({ type: String, nullable: true, example: 'K80.2' })
  code!: string | null;

  /** Código interno del sistema de codificación (`icd10cm`…), `null` si no está catalogado. */
  @ApiProperty({ type: String, nullable: true, example: 'icd10cm' })
  codeSystem!: string | null;

  @ApiProperty({ example: 'Colelitiasis sin colecistitis' })
  display!: string;

  @ApiProperty({ type: String, nullable: true })
  clinicalStatus!: string | null;

  @ApiProperty({ type: String, nullable: true })
  onsetAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  resolvedAt!: string | null;
}

/** Totales agregados de un período (todo el historial o los últimos 36 meses). */
export class PortabilityPeriodStatsDto {
  @ApiProperty()
  claimsCount!: number;

  @ApiProperty()
  approvedCount!: number;

  @ApiProperty()
  deniedCount!: number;

  @ApiProperty()
  pendingCount!: number;

  @ApiProperty({ example: '12450.00' })
  billedAmount!: string;

  @ApiProperty({ example: '10230.00' })
  coveredAmount!: string;

  @ApiProperty({ example: '1200.00' })
  patientCopayAmount!: string;

  @ApiProperty({ example: '0.00' })
  deniedAmount!: string;

  @ApiProperty({ type: String, nullable: true })
  firstClaimAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastClaimAt!: string | null;

  /** Meses de cobertura vigente que se solaparon con el período, en decimal. */
  @ApiProperty({ example: '11.87' })
  coveredMonths!: string;
}

/** Reclamos y montos de un año calendario. */
export class PortabilityYearStatsDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty()
  claimsCount!: number;

  @ApiProperty({ example: '4500.00' })
  billedAmount!: string;

  @ApiProperty({ example: '3600.00' })
  coveredAmount!: string;
}

/** El resumen actuarial del certificado. */
export class PortabilitySummaryDto {
  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currencyCode!: string | null;

  @ApiProperty({ type: PortabilityPeriodStatsDto })
  @ValidateNested()
  @Type(() => PortabilityPeriodStatsDto)
  allTime!: PortabilityPeriodStatsDto;

  @ApiProperty({ type: PortabilityPeriodStatsDto })
  @ValidateNested()
  @Type(() => PortabilityPeriodStatsDto)
  last36Months!: PortabilityPeriodStatsDto;

  @ApiProperty({ type: [PortabilityYearStatsDto] })
  @ValidateNested({ each: true })
  @Type(() => PortabilityYearStatsDto)
  byYear!: PortabilityYearStatsDto[];

  @ApiProperty()
  claimsOver2000Count!: number;

  /**
   * Siniestralidad estimada contra la prima de lista del plan
   * (`insurance_plans.monthly_premium_amount`, v4.2.14). `null` si el plan no
   * declaró prima: nunca se inventa una.
   */
  @ApiProperty({ type: String, nullable: true, example: '86.14' })
  estimatedLossRatioPercent!: string | null;
}

/**
 * El certificado completo: es el objeto que se sella con SHA-256 y se guarda
 * como archivo. `manifestHash` no forma parte del contenido serializado que
 * se hashea (se calcula sobre este mismo objeto sin ese campo) — lo lee
 * quien consulta el certificado ya emitido, nunca en el momento de sellarlo.
 */
export class InsurancePortabilityReportDto {
  @ApiProperty({ example: 'alovida.insurance-portability/1' })
  schemaVersion!: string;

  @ApiProperty({ format: 'uuid' })
  certificateId!: string;

  @ApiProperty({ example: '2026-09-18T18:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: 'AloVida' })
  issuer!: string;

  @ApiProperty({ type: PortabilityPatientDto })
  @ValidateNested()
  @Type(() => PortabilityPatientDto)
  patient!: PortabilityPatientDto;

  @ApiProperty({ type: [PortabilityPolicyDto] })
  @ValidateNested({ each: true })
  @Type(() => PortabilityPolicyDto)
  policies!: PortabilityPolicyDto[];

  @ApiProperty({ type: [PortabilityClaimDto] })
  @ValidateNested({ each: true })
  @Type(() => PortabilityClaimDto)
  claims!: PortabilityClaimDto[];

  @ApiProperty({ type: [PortabilityConditionDto] })
  @ValidateNested({ each: true })
  @Type(() => PortabilityConditionDto)
  conditions!: PortabilityConditionDto[];

  @ApiProperty({ type: PortabilitySummaryDto })
  @ValidateNested()
  @Type(() => PortabilitySummaryDto)
  summary!: PortabilitySummaryDto;
}

/** Respuesta de `POST /insurance/portability/export`. */
export class PortabilityExportResultDto {
  @ApiProperty({ format: 'uuid' })
  certificateId!: string;

  @ApiProperty({
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  manifestHash!: string;

  @ApiProperty({ example: '2026-09-18T18:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ enum: PortabilityExportFormat })
  format!: PortabilityExportFormat;

  @ApiProperty({ example: 14 })
  recordCount!: number;

  @ApiProperty({ example: 3 })
  policiesCount!: number;

  @ApiProperty({ example: '/insurance/portability/certificates/a1b2c3d4/pdf' })
  pdfDownloadUrl!: string;

  @ApiProperty({
    example: '/insurance/portability/certificates/a1b2c3d4/json',
  })
  jsonDownloadUrl!: string;

  @ApiProperty({
    example: 'https://app.alovida.com/verify/portability/e3b0c442...',
  })
  verificationUrl!: string;

  @ApiProperty({ type: PortabilitySummaryDto })
  @ValidateNested()
  @Type(() => PortabilitySummaryDto)
  summary!: PortabilitySummaryDto;
}

/**
 * Respuesta de `GET /public/portability/verify/:manifestHash`. Sin PHI: sólo
 * confirma que el certificado existe y con qué se emitió, igual que el verify
 * público de recetas.
 */
export class PortabilityVerificationResponseDto {
  @ApiProperty({ example: 'VALID' })
  status!: 'VALID';

  @ApiProperty({ format: 'uuid' })
  certificateId!: string;

  @ApiProperty({
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  manifestHash!: string;

  @ApiProperty({ example: '2026-09-18T18:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: 14 })
  recordCount!: number;

  @ApiProperty({ example: 'SHA-256' })
  algorithm!: 'SHA-256';

  @ApiProperty({ example: 'AloVida' })
  issuer!: string;
}
