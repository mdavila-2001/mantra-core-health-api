import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** What kind of identifier a registration form asks about. */
export const IDENTIFIER_KINDS = ['NATIONAL_ID', 'EMAIL', 'ORG_NAME'] as const;
export type IdentifierKind = (typeof IDENTIFIER_KINDS)[number];

/**
 * Kinds this PUBLIC route answers. Only organization names: they are already
 * public in the directory. Answering for a national id or an email would be an
 * unauthenticated oracle of who is a patient or practitioner; those duplicates
 * are still caught by the registration endpoints themselves (409).
 */
export const PUBLIC_IDENTIFIER_KINDS = ['ORG_NAME'] as const;

/** `GET /iam/auth/identifier-exists` query. */
export class IdentifierExistsQueryDto {
  @ApiProperty({ enum: PUBLIC_IDENTIFIER_KINDS })
  @IsIn(PUBLIC_IDENTIFIER_KINDS)
  kind!: (typeof PUBLIC_IDENTIFIER_KINDS)[number];

  @ApiProperty({
    description: 'Organization name to check',
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
