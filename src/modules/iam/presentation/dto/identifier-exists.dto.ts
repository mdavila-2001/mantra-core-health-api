import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** What kind of identifier a registration form asks about. */
export const IDENTIFIER_KINDS = ['NATIONAL_ID', 'EMAIL', 'ORG_NAME'] as const;
export type IdentifierKind = (typeof IDENTIFIER_KINDS)[number];

/** `GET /iam/auth/identifier-exists` query. */
export class IdentifierExistsQueryDto {
  @ApiProperty({ enum: IDENTIFIER_KINDS })
  @IsIn(IDENTIFIER_KINDS)
  kind!: IdentifierKind;

  @ApiProperty({
    description: 'National id, email or organization name to check',
    maxLength: 320,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  value!: string;
}

/** Only the boolean: never who owns the identifier. */
export class IdentifierExistsResponseDto {
  @ApiProperty({ description: 'Whether an account already uses it' })
  exists!: boolean;
}
