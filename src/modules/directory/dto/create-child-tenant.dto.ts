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

/** Cuerpo de `POST /tenants/{tenantId}/child-tenants` (UC-04-03). */
export class CreateChildTenantDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único global del sub-tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Razón social / nombre legal del sub-tenant',
    maxLength: 300,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Identificador asociado a admin user.
   */
  @ApiProperty({
    description: 'Usuario administrador inicial del sub-tenant',
    format: 'uuid',
  })
  @IsUUID()
  adminUserId!: string;

  /**
   * Tipo de organización por código. Obligatorio: una sub-organización puede
   * ser de un tipo distinto al del padre (una aseguradora con una filial
   * prestadora), así que heredarlo en silencio dejaba sub-tenants tipados por
   * omisión y sin los datos que ese tipo exige.
   */
  @ApiProperty({
    description:
      'Tipo de organización. Obligatorio: cada tipo exige sus propios datos ' +
      '(PAYER el bloque `payer`, BROKER el bloque `broker`, PROVIDER país y ' +
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
      'Concept id del tipo de tenant. Si viene `tenantType`, se ignora.',
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
    description:
      'Región de residencia de datos (por defecto hereda la del padre)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataResidencyRegionConceptId?: string;

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
   * País de la organización. Obligatorio para `PROVIDER`: determina bajo qué
   * regulador presta atención.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Jurisdicción de la organización. Obligatoria para `PROVIDER`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}
