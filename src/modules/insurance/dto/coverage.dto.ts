import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumberString,
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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dependentPatientProfileId!: string;

  @ApiPropertyOptional({ enum: ['SPOUSE', 'CHILD'] })
  @IsOptional()
  @IsString()
  relationship?: 'SPOUSE' | 'CHILD';
}

/** UC-26-02: registrar cobertura de paciente y dependientes. */
export class CreateCoverageDto {
  @ApiProperty({ format: 'uuid', description: 'Plan de seguro afiliado' })
  @IsUUID()
  insurancePlanId!: string;

  @ApiProperty({ format: 'uuid', description: 'Perfil del paciente/afiliado' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ maxLength: 80, description: 'Identificador de afiliado (member id)' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  memberIdentifier!: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  policyIdentifier?: string;

  @ApiPropertyOptional({ description: 'Orden de coordinación (1=primaria)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  coverageOrder?: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Broker que intermedia (vincula broker_clients)' })
  @IsOptional()
  @IsUUID()
  insuranceBrokerId?: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  serviceDate?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Resumen de beneficios recibido del pagador' })
  @IsOptional()
  benefitSummary?: unknown;
}

/** UC-26-09: determinar coordinación de beneficios (COB). */
export class CreateCobDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Cobertura primaria' })
  @IsUUID()
  primaryPatientCoverageId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cobertura secundaria' })
  @IsOptional()
  @IsUUID()
  secondaryPatientCoverageId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cobertura terciaria' })
  @IsOptional()
  @IsUUID()
  tertiaryPatientCoverageId?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}
