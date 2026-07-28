import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /orgext/affiliations` (UC-22-07). */
export class CreateAffiliationDto {
  /**
   * Identificador asociado a primary tenant.
   */
  @ApiProperty({ description: 'Tenant primario (organizador)', format: 'uuid' })
  @IsUUID()
  primaryTenantId!: string;

  /**
   * Identificador asociado a participating tenant.
   */
  @ApiProperty({ description: 'Tenant participante', format: 'uuid' })
  @IsUUID()
  participatingTenantId!: string;

  /**
   * Identificador asociado a affiliation type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de afiliación (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  affiliationTypeConceptId?: string;

  /**
   * Identificador asociado a host practice site.
   */
  @ApiPropertyOptional({
    description: 'Sitio de práctica anfitrión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  hostPracticeSiteId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @ApiPropertyOptional({
    description: 'Servicio de salud implicado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  /**
   * Valor de contract reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de contrato',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractReference?: string;

  /**
   * Identificador asociado a data use agreement.
   */
  @ApiPropertyOptional({
    description: 'Acuerdo de uso de datos (DUA) firmado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataUseAgreementId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente desde (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
