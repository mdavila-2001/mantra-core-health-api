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
  @ApiProperty({ description: 'Tenant primario (organizador)', format: 'uuid' })
  @IsUUID()
  primaryTenantId!: string;

  @ApiProperty({ description: 'Tenant participante', format: 'uuid' })
  @IsUUID()
  participatingTenantId!: string;

  @ApiPropertyOptional({ description: 'Tipo de afiliación (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  affiliationTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Sitio de práctica anfitrión', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hostPracticeSiteId?: string;

  @ApiPropertyOptional({ description: 'Servicio de salud implicado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  @ApiPropertyOptional({ description: 'Referencia de contrato', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractReference?: string;

  @ApiPropertyOptional({ description: 'Acuerdo de uso de datos (DUA) firmado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dataUseAgreementId?: string;

  @ApiPropertyOptional({ description: 'Vigente desde (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
