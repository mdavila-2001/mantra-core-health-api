import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /profiles/practitioners` (UC-05-03): onboarding de fuerza laboral
 * (regla GENERALIST). Incluye la primera licencia jurisdiccional (UC-05-04) y una
 * credencial de soporte (verificable vía UC-05-05).
 */
export class CreatePractitionerDto {
  @ApiProperty({ description: 'Código único de profesional (practitioner_code, UK)', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  practitionerCode!: string;

  @ApiPropertyOptional({
    description: 'Persona existente a reutilizar; si se omite se crea una nueva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({ description: 'Nombre visible (si se crea la persona)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Concept id de categoría profesional', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerCategoryConceptId?: string;

  @ApiPropertyOptional({ description: 'Título profesional', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professionalTitle?: string;

  @ApiProperty({ description: 'Nº de licencia de la autorización jurisdiccional inicial', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  @ApiPropertyOptional({ description: 'Concept id de jurisdicción de la licencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ description: 'Autoridad regulatoria emisora', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  @ApiProperty({ description: 'Nº de la credencial de soporte', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  credentialNumber!: string;

  @ApiPropertyOptional({ description: 'Concept id del tipo de credencial', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  credentialTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Concept id del idioma clínico', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;
}

/** Respuesta de onboarding de profesional. */
export class PractitionerResponseDto {
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  @ApiProperty({ format: 'uuid' })
  personId!: string;

  @ApiProperty()
  practitionerCode!: string;

  @ApiProperty({ description: 'Concept id del estado de verificación', format: 'uuid' })
  verificationStatus!: string;

  @ApiProperty({ description: 'Concept id del estado de práctica', format: 'uuid' })
  practiceStatus!: string;

  @ApiProperty({ format: 'uuid' })
  licenseId!: string;

  @ApiProperty({ format: 'uuid' })
  credentialId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
