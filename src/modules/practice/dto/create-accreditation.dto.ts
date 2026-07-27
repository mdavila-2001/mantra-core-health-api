import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/accreditations` (UC-14-02). */
export class CreateAccreditationDto {
  @ApiPropertyOptional({
    description: 'Sitio acreditado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({
    description: 'Concepto de tipo de acreditación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  accreditationTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Número de acreditación',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  @ApiPropertyOptional({
    description: 'Tenant emisor (directory.tenants)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuerTenantId?: string;

  @ApiPropertyOptional({ description: 'Nombre del emisor', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuerName?: string;

  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({
    description: 'Archivo de evidencia (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}
