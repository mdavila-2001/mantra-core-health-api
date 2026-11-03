import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

/**
 * Tarea 3 · H8 (MED-E13..E16) — lote periódico de liquidación al profesional.
 * Ver `docs/contracts/insurer-practitioner-settlement-batches.md`.
 */

const SETTLEMENT_CADENCES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
export type SettlementCadenceDto = (typeof SETTLEMENT_CADENCES)[number];

/** Contrato §8/§12. Un `periodStart` desalineado con la cadencia responde 422. */
export class GeneratePractitionerSettlementBatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ format: 'uuid', description: 'billing_provider_entity_id' })
  @IsUUID()
  providerEntityId!: string;

  @ApiProperty({ enum: SETTLEMENT_CADENCES })
  @IsIn(SETTLEMENT_CADENCES)
  cadence!: SettlementCadenceDto;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-09-01',
    description:
      'Día 1 (MONTHLY), día 1 o 16 (BIWEEKLY), o cualquiera (WEEKLY)',
  })
  @IsISO8601({ strict: true })
  periodStart!: string;
}

/** Filtros de listado (contrato §12): `GET /practitioner-settlement-batches`. */
export class PractitionerSettlementBatchListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  providerEntityId?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}

/** Un reclamo incluido en el lote, con sus tres importes (contrato §3/§7). */
export class PractitionerSettlementBatchClaimDto {
  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty({ type: String })
  claimIdentifier!: string;

  @ApiProperty({ format: 'uuid' })
  adjudicationVersionId!: string;

  @ApiProperty({ type: Number })
  adjudicationVersion!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  eobPublishedAt!: string;

  @ApiProperty({ type: String })
  totalBilledAmount!: string;

  @ApiProperty({ type: String })
  totalApprovedAmount!: string;

  @ApiProperty({ type: String })
  totalPatientAmount!: string;

  @ApiProperty({ type: String })
  totalDeniedAmount!: string;

  @ApiProperty({ type: Number })
  exclusionsCount!: number;
}

const SETTLEMENT_EXCLUSION_REASONS = [
  'NOT_ADJUDICATED',
  'REVERSED',
  'EOB_NOT_PUBLISHED',
  'NOT_RECONCILED',
  'OUT_OF_PERIOD',
  'CURRENCY_MISMATCH',
] as const;

/** Un reclamo que no entró en el lote, con el motivo (contrato §7). */
export class PractitionerSettlementBatchExcludedClaimDto {
  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty({ type: String })
  claimIdentifier!: string;

  @ApiProperty({ enum: SETTLEMENT_EXCLUSION_REASONS })
  reason!: (typeof SETTLEMENT_EXCLUSION_REASONS)[number];
}

/**
 * Ajuste por reversión (contrato §10): un reclamo incluido en un lote
 * anterior que se revirtió después del corte. `adjustmentAmount` es negativo;
 * el lote original nunca se edita.
 */
export class PractitionerSettlementBatchReversalAdjustmentDto {
  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty({ type: String })
  claimIdentifier!: string;

  @ApiProperty({ format: 'uuid' })
  previousBatchId!: string;

  @ApiProperty({ type: String, description: 'Negativo' })
  adjustmentAmount!: string;
}

/**
 * Los tres totales del corte (contrato §7): «Total a transferir por la
 * aseguradora», «Total copagos percibidos en consulta» y «Total exclusiones
 * aplicadas», más el ajuste por reversión. Ninguno es un importe pagado
 * (contrato §11): no hay `totalPaidAmount` en este DTO.
 */
export class PractitionerSettlementBatchTotalsDto {
  @ApiProperty({ type: String })
  totalBilledAmount!: string;

  @ApiProperty({ type: String, description: 'A transferir por la aseguradora' })
  totalApprovedAmount!: string;

  @ApiProperty({ type: String, description: 'Copagos percibidos en consulta' })
  totalPatientAmount!: string;

  @ApiProperty({ type: String, description: 'Exclusiones aplicadas' })
  totalDeniedAmount!: string;

  @ApiProperty({ type: String })
  totalReversalAdjustmentAmount!: string;
}

/** El lote de liquidación completo (contrato §12). */
export class PractitionerSettlementBatchDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  insuranceCarrierId!: string;

  @ApiProperty({ type: String })
  carrierName!: string;

  @ApiProperty({ format: 'uuid' })
  providerEntityId!: string;

  @ApiProperty({ enum: SETTLEMENT_CADENCES })
  cadence!: SettlementCadenceDto;

  @ApiProperty({ type: String, format: 'date' })
  periodStart!: string;

  @ApiProperty({ type: String, format: 'date' })
  periodEnd!: string;

  @ApiProperty({ type: String, nullable: true })
  currencyCode!: string | null;

  @ApiProperty({ type: String, example: 'SETTLEMENT_BATCH_ISSUED' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt!: string;

  @ApiProperty({
    type: Boolean,
    description:
      'true cuando la clave natural ya existía (idempotencia, contrato §9)',
  })
  replayed!: boolean;

  @ApiProperty({ type: PractitionerSettlementBatchTotalsDto })
  totals!: PractitionerSettlementBatchTotalsDto;

  @ApiProperty({ type: [PractitionerSettlementBatchClaimDto] })
  claims!: PractitionerSettlementBatchClaimDto[];

  @ApiProperty({ type: [PractitionerSettlementBatchExcludedClaimDto] })
  excludedClaims!: PractitionerSettlementBatchExcludedClaimDto[];

  @ApiProperty({ type: [PractitionerSettlementBatchReversalAdjustmentDto] })
  reversalAdjustments!: PractitionerSettlementBatchReversalAdjustmentDto[];
}

/** `GET /practitioner-settlement-batches`. */
export class PractitionerSettlementBatchListDto {
  @ApiProperty({ type: [PractitionerSettlementBatchDto] })
  items!: PractitionerSettlementBatchDto[];
}
