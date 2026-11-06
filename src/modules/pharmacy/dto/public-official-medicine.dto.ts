import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A medication of the official health registry (AGEMED, CIMA, INVIMA,
 * ANVISA) that matches the showcase search. It says what exists and what it
 * is for; whether a pharmacy of the network sells it is the card list's job.
 */
export class PublicOfficialMedicineDto {
  /** Registry product id. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Name as registered («IBUPROFENO 400 mg comprimidos»). */
  @ApiProperty()
  name!: string;

  /** Holder of the registration (laboratory). */
  @ApiPropertyOptional({ type: String, nullable: true })
  holder!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  strengthText!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  dosageForm!: string | null;

  /** Registry it comes from («AGEMED»…). */
  @ApiProperty()
  sourceName!: string;

  @ApiProperty({ type: [String] })
  atc!: string[];

  /** What it is for, by its ATC group (WHO). Classification, not advice. */
  @ApiProperty({ type: [String] })
  uses!: string[];

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  requiresPrescription!: boolean | null;
}
