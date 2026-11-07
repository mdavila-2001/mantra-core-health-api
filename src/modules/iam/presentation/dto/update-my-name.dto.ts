import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * Letters (any script, with accents), separated by a space, a hyphen or an apostrophe: no digits,
 * no control or invisible characters. The same shape the sign-up form accepts.
 */
const NAME_PART = /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u;
const NAME_PART_MESSAGE =
  'Solo letras; un nombre compuesto se separa con un espacio, un guion o un apóstrofo';
/** An optional part may be sent empty (it is cleared): the shape is only checked when it has text. */
const hasText = (_object: unknown, value: unknown): boolean =>
  value !== undefined && value !== '';

/**
 * The name of the signed-in account, in the same four parts the sign-up collects. `name` and
 * `lastName` are required; an optional part sent as an empty string is cleared.
 */
export class UpdateMyNameDto {
  /** Given name. */
  @ApiProperty({ maxLength: 100, example: 'Wendy' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PART, { message: NAME_PART_MESSAGE })
  name!: string;

  /** Second given name (the sign-up folds further given names into it). */
  @ApiPropertyOptional({ maxLength: 100, example: 'Jennyfer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ValidateIf(hasText)
  @Matches(NAME_PART, { message: NAME_PART_MESSAGE })
  middleName?: string;

  /** Paternal surname. */
  @ApiProperty({ maxLength: 100, example: 'Dávila' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PART, { message: NAME_PART_MESSAGE })
  lastName!: string;

  /** Maternal surname. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Yamal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ValidateIf(hasText)
  @Matches(NAME_PART, { message: NAME_PART_MESSAGE })
  motherLastName?: string;
}

/** The account name as stored: what the greeting and the session token carry. */
export class MyNameResponseDto {
  /** Composed name (`iam.users.display_name`). */
  @ApiProperty() displayName!: string;
}
