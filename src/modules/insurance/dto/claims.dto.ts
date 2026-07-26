import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Línea de un reclamo (UC-26-06). */
export class ClaimLineDto {
  @ApiProperty({ description: 'Secuencia única dentro del reclamo', example: 1 })
  @IsInt()
  @Min(1)
  lineSequence!: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @ApiProperty({ description: 'Monto facturado', example: '100.00' })
  @IsNumberString()
  billedAmount!: string;

  @ApiPropertyOptional({ description: 'Responsabilidad del paciente', example: '20.00' })
  @IsOptional()
  @IsNumberString()
  patientResponsibilityAmount?: string;
}

/** UC-26-06: enviar reclamo con líneas (837). */
export class CreateClaimDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad facturadora' })
  @IsUUID()
  billingProviderEntityId!: string;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MaxLength(80)
  claimIdentifier!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Autorización previa vinculada' })
  @IsOptional()
  @IsUUID()
  priorAuthorizationRequestId?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @ApiProperty({ type: [ClaimLineDto], description: '1..N líneas' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClaimLineDto)
  lines!: ClaimLineDto[];
}

/** Adjudicación de una línea (UC-26-07). */
export class LineAdjudicationDto {
  @ApiProperty({ format: 'uuid', description: 'Línea del reclamo adjudicada' })
  @IsUUID()
  insuranceClaimLineId!: string;

  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  @IsIn(['APPROVED', 'DENIED'])
  decision!: 'APPROVED' | 'DENIED';

  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;

  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  patientAmount?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  deniedAmount?: string;
}

/** UC-26-07: adjudicar reclamo por línea (835). */
export class CreateAdjudicationDto {
  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  @IsIn(['APPROVED', 'DENIED'])
  outcome!: 'APPROVED' | 'DENIED';

  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  totalApprovedAmount?: string;

  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  totalPatientAmount?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  totalDeniedAmount?: string;

  @ApiProperty({ type: [LineAdjudicationDto], description: 'Una por línea del reclamo' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineAdjudicationDto)
  lineAdjudications!: LineAdjudicationDto[];
}

/** UC-26-08: publicar EOB para el paciente. */
export class PublishEobDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Documento generado (object storage)' })
  @IsOptional()
  @IsUUID()
  documentRecordId?: string;
}

/** UC-26-10: registrar reversión de reclamo. */
export class CreateReversalDto {
  @ApiProperty({ format: 'uuid', description: 'Versión de adjudicación a revertir' })
  @IsUUID()
  reversedAdjudicationVersionId!: string;

  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  reversalAmount?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

/** UC-26-11: abrir disputa sobre adjudicación. */
export class CreateDisputeDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Versión de adjudicación disputada' })
  @IsOptional()
  @IsUUID()
  claimAdjudicationVersionId?: string;

  @ApiProperty({ enum: ['PROVIDER', 'PATIENT'], description: 'Parte que inicia' })
  @IsIn(['PROVIDER', 'PATIENT'])
  initiatedBy!: 'PROVIDER' | 'PATIENT';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  initiatedByEntityId?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Fecha límite de presentación' })
  @IsOptional()
  @IsString()
  filingDeadline?: string;
}
