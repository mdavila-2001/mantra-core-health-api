import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Alta de aseguradora (backbone de soporte para los casos de uso). */
export class CreateCarrierDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid', description: 'Tenant propietario' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de carrier code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  carrierCode!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;

  /**
   * Valor de regulator identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  regulatorIdentifier?: string;
}

/** Alta de producto de aseguradora. */
@ApiSchema({ name: 'InsuranceCreateProductDto' })
export class CreateProductDto {
  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  productCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}

/** Alta de plan sobre un producto. */
export class CreatePlanDto {
  /**
   * Valor de plan code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  planCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Vigencia desde (ISO date)',
  })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

/** Alta de beneficio de plan. */
export class CreatePlanBenefitDto {
  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  /**
   * Valor de requires prior authorization mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere autorización previa' })
  @IsOptional()
  @IsBoolean()
  requiresPriorAuthorization?: boolean;

  /**
   * Valor de coverage percent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje de cobertura',
    example: '80',
  })
  @IsOptional()
  @IsNumberString()
  coveragePercent?: string;
}

/** Alta de red de prestadores. */
export class CreateProviderNetworkDto {
  /**
   * Identificador asociado a insurance carrier.
   */
  @ApiProperty({ format: 'uuid', description: 'Aseguradora dueña de la red' })
  @IsUUID()
  insuranceCarrierId!: string;

  /**
   * Valor de network code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  networkCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

/** Alta de broker. */
export class CreateBrokerDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de broker code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brokerCode!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;

  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  licenseNumber?: string;
}

/** Alta de grupo empleador. */
export class CreateEmployerGroupDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de group code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  groupCode!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;
}

/** Alta de acuerdo broker–aseguradora. */
export class CreateBrokerAgreementDto {
  /**
   * Identificador asociado a insurance carrier.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  /**
   * Valor de agreement code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  agreementCode!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

/** UC-26-01: alta de membresía de prestador en una red. */
@ApiSchema({ name: 'InsuranceCreateMembershipDto' })
export class CreateMembershipDto {
  /**
   * Identificador asociado a provider entity.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Entidad prestadora (práctica/hospital/etc.)',
  })
  @IsUUID()
  providerEntityId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Referencia a práctica si aplica',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Valor de contract reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contractReference?: string;
}
