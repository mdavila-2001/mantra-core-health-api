import { ApiProperty } from '@nestjs/swagger';
import type {
  PatientInsuranceSettlementExclusion,
  PatientInsuranceSettlementSnapshot,
} from '../../domain/order-settlement';

export class PatientInsuranceSettlementExclusionDto implements PatientInsuranceSettlementExclusion {
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

/** Liquidación del seguro, copiada al contrato del pedido de farmacia. */
export class PatientInsuranceSettlementDto implements PatientInsuranceSettlementSnapshot {
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
