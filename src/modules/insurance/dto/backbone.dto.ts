import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidateIf,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const COVERAGE_PATTERN = /^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/;

export const APPROVAL_DOCUMENT_CODES = [
  'FIRMA_MEDICO',
  'SELLO_MEDICO',
  'ORDEN_MEDICA',
  'INFORME_CLINICO',
] as const;

export type ApprovalDocumentCode = (typeof APPROVAL_DOCUMENT_CODES)[number];

function IsOnOrAfter(
  property: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isOnOrAfter',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: [property],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null) return true;
          const start = (args.object as Record<string, unknown>)[property];
          if (start === undefined || start === null) return true;
          if (typeof value !== 'string' || typeof start !== 'string')
            return false;
          return new Date(value).getTime() >= new Date(start).getTime();
        },
      },
    });
  };
}

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
  @IsDateString()
  effectiveFrom?: string;

  /** Fin de vigencia del plan. */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  @IsOnOrAfter('effectiveFrom', {
    message: 'effectiveTo debe ser igual o posterior a effectiveFrom',
  })
  effectiveTo?: string;

  /**
   * Moneda del plan.
   *
   * `insurance_plans.currency_concept_id` existe en el modelo y el alta no lo
   * escribía: los planes nacían sin moneda, y con ellos todo lo que se factura
   * bajo el plan. Un importe sin moneda obliga a la pantalla a elegir entre
   * inventarle un símbolo o mostrar un número pelado — y en un producto
   * boliviano que también maneja dólares, ninguna de las dos es aceptable.
   *
   * Opcional y sin valor por defecto **a propósito**: poner `BOB` de oficio
   * afirmaría la moneda de un plan que nadie declaró.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Alta de beneficio de plan. */
export class CreatePlanBenefitDto {
  /** Categoría de cobertura administrada. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  benefitCategoryConceptId!: string;

  /** Servicio concreto; se omite cuando la cobertura aplica a la categoría. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  /** Fin de vigencia de la cobertura. */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  @IsOnOrAfter('effectiveFrom', {
    message: 'effectiveTo debe ser igual o posterior a effectiveFrom',
  })
  effectiveTo?: string;

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
  @Matches(COVERAGE_PATTERN, {
    message: 'coveragePercent debe estar entre 0 y 100 con hasta dos decimales',
  })
  coveragePercent?: string;

  /** Copago fijo. */
  @ApiPropertyOptional({ example: '25.00' })
  @IsOptional()
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message: 'copayAmount debe ser no negativo y tener hasta dos decimales',
  })
  copayAmount?: string;

  /** Deducible aplicable. */
  @ApiPropertyOptional({ example: '100.00' })
  @IsOptional()
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message:
      'deductibleAmount debe ser no negativo y tener hasta dos decimales',
  })
  deductibleAmount?: string;

  /** Tope anual de la cobertura. */
  @ApiPropertyOptional({ example: '5000.00' })
  @IsOptional()
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message:
      'annualLimitAmount debe ser no negativo y tener hasta dos decimales',
  })
  annualLimitAmount?: string;
}

/** Reemplazo del subconjunto económico de una cobertura. */
export class UpdatePlanBenefitDto {
  @ApiProperty({ nullable: true, type: String, example: '80.00' })
  @ValidateIf((_object, value) => value !== null)
  @IsNumberString()
  @Matches(COVERAGE_PATTERN, {
    message: 'coveragePercent debe estar entre 0 y 100 con hasta dos decimales',
  })
  coveragePercent!: string | null;

  @ApiProperty({ nullable: true, type: String, example: '25.00' })
  @ValidateIf((_object, value) => value !== null)
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message: 'copayAmount debe ser no negativo y tener hasta dos decimales',
  })
  copayAmount!: string | null;

  @ApiProperty({ nullable: true, type: String, example: '100.00' })
  @ValidateIf((_object, value) => value !== null)
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message:
      'deductibleAmount debe ser no negativo y tener hasta dos decimales',
  })
  deductibleAmount!: string | null;

  @ApiProperty({ nullable: true, type: String, example: '5000.00' })
  @ValidateIf((_object, value) => value !== null)
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message:
      'annualLimitAmount debe ser no negativo y tener hasta dos decimales',
  })
  annualLimitAmount!: string | null;
}

/** Reglas administrables de autorización y documentación. */
export class UpdatePlanBenefitRulesDto {
  @ApiProperty()
  @IsBoolean()
  requiresPriorAuthorization!: boolean;

  @ApiProperty({ enum: APPROVAL_DOCUMENT_CODES, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn(APPROVAL_DOCUMENT_CODES, { each: true })
  requiredDocuments!: ApprovalDocumentCode[];

  @ApiProperty({ nullable: true, type: String, maxLength: 1000 })
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  exclusionNotes!: string | null;
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
