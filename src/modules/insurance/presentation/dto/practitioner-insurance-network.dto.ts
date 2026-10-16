import { ApiProperty } from '@nestjs/swagger';

/** Una red de aseguradora en la que figura un profesional (una membresía vigente). */
export class PractitionerInsuranceNetworkDto {
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ format: 'uuid' })
  carrierId!: string;

  /** El nombre de la aseguradora (`insurance_carriers.legal_name`). */
  @ApiProperty()
  carrierName!: string;

  @ApiProperty()
  networkName!: string;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  effectiveFrom!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  effectiveTo!: string | null;
}

/** `GET /practitioners/:profileId/insurance-networks`. Vacía es 200, nunca 404. */
export class PractitionerInsuranceNetworkPageDto {
  @ApiProperty({ type: () => [PractitionerInsuranceNetworkDto] })
  items!: PractitionerInsuranceNetworkDto[];

  @ApiProperty()
  count!: number;
}
