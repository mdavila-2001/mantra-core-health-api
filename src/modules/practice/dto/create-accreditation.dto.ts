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
  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({
    description: 'Sitio acreditado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a accreditation type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de acreditación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  accreditationTypeConceptId?: string;

  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Número de acreditación',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  /**
   * Identificador asociado a issuer tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant emisor (directory.tenants)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuerTenantId?: string;

  /**
   * Valor de issuer name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre del emisor', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuerName?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de evidencia (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}
