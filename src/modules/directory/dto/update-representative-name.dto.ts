import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * The name of an organization's representative, split into the same four parts
 * the sign-up form collects (`RegisterOrganizationLegalRepresentativeDto`).
 *
 * `name` and `lastName` are required; an optional part sent as an empty string
 * is cleared.
 */
export class UpdateRepresentativeNameDto {
  /** Given name. */
  @ApiProperty({ maxLength: 100, example: 'Wendy' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  /** Second given name. Empty string clears it. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Jennyfer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /** Paternal surname. */
  @ApiProperty({ maxLength: 100, example: 'Dávila' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  /** Maternal surname. Empty string clears it. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Yamal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;
}

/** The representative's name as stored after the update. */
export class RepresentativeNameResponseDto {
  /** Canonical role: `LEGAL_REPRESENTATIVE`, `GENERAL_MANAGER`, … */
  @ApiProperty() role!: string;

  /** Composed full name (`persons.display_name`). */
  @ApiProperty() fullName!: string;

  /** Given name. */
  @ApiProperty() name!: string;

  /** Second given name, if any. */
  @ApiPropertyOptional() middleName?: string;

  /** Paternal surname. */
  @ApiProperty() lastName!: string;

  /** Maternal surname, if any. */
  @ApiPropertyOptional() motherLastName?: string;
}
