import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  name!: string;

  /** Second given name (the sign-up folds further given names into it). */
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

  /** Maternal surname. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Yamal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;
}

/** The account name as stored: what the greeting and the session token carry. */
export class MyNameResponseDto {
  /** Composed name (`iam.users.display_name`). */
  @ApiProperty() displayName!: string;
}
