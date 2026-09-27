import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Dependiente que se afilia junto con la cobertura (UC-26-02). */
export class CoverageDependentDto {
  /**
   * Identificador asociado a dependent patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dependentPatientProfileId!: string;

  /**
   * Valor de relationship mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['SPOUSE', 'CHILD'] })
  @IsOptional()
  @IsString()
  relationship?: 'SPOUSE' | 'CHILD';
}

/** UC-26-02: registrar cobertura de paciente y dependientes. */
export class CreateCoverageDto {
  /**
   * Identificador asociado a insurance plan.
   */
  @ApiProperty({ format: 'uuid', description: 'Plan de seguro afiliado' })
  @IsUUID()
  insurancePlanId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Perfil del paciente/afiliado' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de member identifier mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 80,
    description: 'Identificador de afiliado (member id)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  memberIdentifier!: string;

  /**
   * Valor de policy identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  policyIdentifier?: string;

  /**
   * Valor de coverage order mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden de coordinación (1=primaria)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  coverageOrder?: number;

  /**
   * Identificador asociado a insurance broker.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Broker que intermedia (vincula broker_clients)',
  })
  @IsOptional()
  @IsUUID()
  insuranceBrokerId?: string;

  /**
   * Valor de dependents mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [CoverageDependentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CoverageDependentDto)
  dependents?: CoverageDependentDto[];
}

/** UC-26-03: solicitar y resolver elegibilidad (270/271). */
export class CreateEligibilityRequestDto {
  /**
   * Identificador asociado a patient coverage.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  /**
   * Valor de service date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  serviceDate?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  /**
   * Valor de benefit summary mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Resumen de beneficios recibido del pagador',
  })
  @IsOptional()
  benefitSummary?: unknown;
}

/** UC-26-09: determinar coordinación de beneficios (COB). */
export class CreateCobDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a primary patient coverage.
   */
  @ApiProperty({ format: 'uuid', description: 'Cobertura primaria' })
  @IsUUID()
  primaryPatientCoverageId!: string;

  /**
   * Identificador asociado a secondary patient coverage.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Cobertura secundaria' })
  @IsOptional()
  @IsUUID()
  secondaryPatientCoverageId?: string;

  /**
   * Identificador asociado a tertiary patient coverage.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Cobertura terciaria' })
  @IsOptional()
  @IsUUID()
  tertiaryPatientCoverageId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

/** Una cobertura del paciente, para «Mi cobertura» (CV-11). */
export class MyCoverageDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Plan de la aseguradora. */
  @ApiProperty({ format: 'uuid' })
  insurancePlanId!: string;

  /** Corredor que intermedió el alta, si hubo uno. */
  @ApiPropertyOptional({ format: 'uuid' })
  insuranceBrokerId?: string;

  /** Identificador de afiliado ante la aseguradora. */
  @ApiProperty()
  memberIdentifier!: string;

  /** Número de póliza, si se declaró. */
  @ApiPropertyOptional()
  policyIdentifier?: string;

  /** 1 = cobertura privada, 2 = pública. */
  @ApiPropertyOptional()
  coverageOrder?: number;

  /** Vínculo con el titular de la póliza (a sí mismo, cónyuge, hijo). */
  @ApiPropertyOptional({ format: 'uuid' })
  relationshipToSubscriberConceptId?: string;

  /** Vigencia desde. */
  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveFrom?: Date;

  /** Vigencia hasta, si venció. */
  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveTo?: Date;

  /** Estado de verificación de la elegibilidad. */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  /** Estado de la cobertura. */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /** Fecha de alta. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
