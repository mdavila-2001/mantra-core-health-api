import { ApiProperty } from '@nestjs/swagger';

export class PatientInsuranceSettlementExclusionDto {
  @ApiProperty({ type: String, format: 'uuid' })
  claimLineId!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  itemId!: string;

  @ApiProperty({ type: String })
  itemName!: string;

  @ApiProperty({ type: String, description: 'Importe decimal exacto excluido' })
  amount!: string;

  @ApiProperty({ type: String })
  policyClauseReference!: string;

  @ApiProperty({ type: String, nullable: true })
  denialRationale!: string | null;
}

/** Importes adjudicados; no representan saldos posteriores a pagos. */
export class PatientInsuranceSettlementDto {
  @ApiProperty({ type: String, format: 'uuid' })
  claimId!: string;

  @ApiProperty({ type: String })
  claimIdentifier!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  adjudicationVersionId!: string;

  @ApiProperty({ type: Number, format: 'int32', minimum: 1 })
  adjudicationVersion!: number;

  @ApiProperty({ type: String, format: 'uuid' })
  eobId!: string;

  @ApiProperty({ type: String })
  carrierName!: string;

  @ApiProperty({ type: String, nullable: true })
  policyIdentifier!: string | null;

  @ApiProperty({ type: String, description: 'Total facturado, decimal exacto' })
  totalBilledAmount!: string;

  @ApiProperty({
    type: String,
    description: 'Aporte del seguro, decimal exacto',
  })
  totalApprovedAmount!: string;

  @ApiProperty({
    type: String,
    description: 'Cargo confirmado al paciente, decimal exacto',
  })
  totalPatientAmount!: string;

  @ApiProperty({
    type: String,
    description: 'Importe excluido sin asignar, decimal exacto',
  })
  totalDeniedAmount!: string;

  @ApiProperty({ type: String, example: 'BOB' })
  currencyCode!: string;

  @ApiProperty({ enum: ['APPROVED', 'PARTIALLY_APPROVED', 'DENIED'] })
  result!: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';

  @ApiProperty({ type: [PatientInsuranceSettlementExclusionDto] })
  exclusions!: PatientInsuranceSettlementExclusionDto[];
}

export interface PatientSettlementProjection {
  insuranceSettlement: PatientInsuranceSettlementDto | null;
  insuranceSettlementAvailability:
    'AVAILABLE' | 'PENDING_PUBLICATION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';
}

export function unavailableSettlement(): PatientSettlementProjection {
  return {
    insuranceSettlement: null,
    insuranceSettlementAvailability: 'NOT_AVAILABLE',
  };
}
