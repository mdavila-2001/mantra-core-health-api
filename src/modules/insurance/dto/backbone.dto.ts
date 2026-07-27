import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ format: 'uuid', description: 'Tenant propietario' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  carrierCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  regulatorIdentifier?: string;
}

/** Alta de producto de aseguradora. */
export class CreateProductDto {
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  productCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}

/** Alta de plan sobre un producto. */
export class CreatePlanDto {
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  planCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

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
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Requiere autorización previa' })
  @IsOptional()
  @IsBoolean()
  requiresPriorAuthorization?: boolean;

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
  @ApiProperty({ format: 'uuid', description: 'Aseguradora dueña de la red' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  networkCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

/** Alta de broker. */
export class CreateBrokerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brokerCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  licenseNumber?: string;
}

/** Alta de grupo empleador. */
export class CreateEmployerGroupDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  groupCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  legalName!: string;
}

/** Alta de acuerdo broker–aseguradora. */
export class CreateBrokerAgreementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  agreementCode!: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

/** UC-26-01: alta de membresía de prestador en una red. */
export class CreateMembershipDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Entidad prestadora (práctica/hospital/etc.)',
  })
  @IsUUID()
  providerEntityId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Referencia a práctica si aplica',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contractReference?: string;
}
