import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TENANT_TYPE_CODES, type TenantTypeCode } from '../directory.concepts';
import { BrokerProfileDto, PayerProfileDto } from './tenant-type-profile.dto';

/** Cuerpo de `POST /admin/tenants` (UC-04-01: aprovisionar tenant raíz). */
export class CreateTenantDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único global del tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Razón social / nombre legal', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Identificador asociado a owner user.
   */
  @ApiProperty({
    description: 'Usuario que será owner inicial del tenant',
    format: 'uuid',
  })
  @IsUUID()
  ownerUserId!: string;

  /**
   * Valor de trade name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  /**
   * Tipo de organización por código. Es la forma normal de tiparla.
   */
  @ApiProperty({
    description:
      'Tipo de organización. Obligatorio: cada tipo exige sus propios datos ' +
      '(PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, ' +
      'UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, ' +
      'HEALTH_BUSINESS— país y ' +
      'jurisdicción).',
    enum: TENANT_TYPE_CODES,
  })
  @IsIn(TENANT_TYPE_CODES)
  tenantType!: TenantTypeCode;

  /**
   * Identificador asociado a tenant type concept.
   */
  @ApiPropertyOptional({
    description:
      'Concept id del tipo de tenant. Escotilla para tipos fuera del ' +
      'catálogo interno; si viene `tenantType`, este campo se ignora.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantTypeConceptId?: string;

  /**
   * Identificador asociado a legal entity type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de entidad legal',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalEntityTypeConceptId?: string;

  /**
   * Identificador asociado a data residency region concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la región de residencia de datos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataResidencyRegionConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Datos de aseguradora. Obligatorio cuando `tenantType` es `PAYER`; se
   * rechaza en cualquier otro tipo.
   */
  @ApiPropertyOptional({ type: PayerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayerProfileDto)
  payer?: PayerProfileDto;

  /**
   * Datos de corredor. Obligatorio cuando `tenantType` es `BROKER`; se rechaza
   * en cualquier otro tipo.
   */
  @ApiPropertyOptional({ type: BrokerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerProfileDto)
  broker?: BrokerProfileDto;

  /**
   * País de la organización. Obligatorio para los tipos territoriales: determina bajo qué
   * regulador presta atención.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Jurisdicción de la organización. Obligatoria para los tipos territoriales.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}
