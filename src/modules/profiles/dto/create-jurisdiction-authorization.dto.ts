import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/practitioners/{profileId}/jurisdiction-authorizations` (UC-05-04). */
export class CreateJurisdictionAuthorizationDto {
  @ApiProperty({ description: 'Nº de licencia', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  @ApiPropertyOptional({
    description: 'Concept id de jurisdicción',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Autoridad regulatoria emisora',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  @ApiPropertyOptional({
    description: 'Concept id del alcance de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceScopeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Vigente desde (ISO date)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Vigente hasta (ISO date)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Respuesta de autorización jurisdiccional. */
export class JurisdictionAuthorizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiProperty({
    description: 'Concept id del estado de la licencia',
    format: 'uuid',
  })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
