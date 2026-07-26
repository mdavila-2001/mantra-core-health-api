import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Una prueba a desglosar dentro de la orden de trabajo. */
export class WorkOrderTestItemDto {
  @ApiProperty({ format: 'uuid', description: 'Orden clínica que solicita la prueba' })
  @IsUUID()
  serviceRequestId!: string;

  @ApiProperty({ format: 'uuid', description: 'Código de prueba (concept id)' })
  @IsUUID()
  testCodeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Espécimen sobre el que se corre' })
  @IsOptional()
  @IsUUID()
  specimenId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Método (concept id)' })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Analizador asignado (device id)' })
  @IsOptional()
  @IsUUID()
  analyzerDeviceId?: string;
}

/** Cuerpo de `POST /diagnostics/work-orders` (UC-20-04). */
export class CreateWorkOrderDto {
  @ApiProperty({ format: 'uuid', description: 'Acesión de laboratorio en estado recibido' })
  @IsUUID()
  laboratoryAccessionId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant custodio (por defecto el del token)' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ description: 'Nº de orden (se genera si se omite)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  workOrderNumber?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Prioridad (concept id)' })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Unidad de laboratorio asignada' })
  @IsOptional()
  @IsUUID()
  assignedLaboratoryUnitId?: string;

  @ApiProperty({ type: [WorkOrderTestItemDto], description: 'Pruebas a desglosar' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderTestItemDto)
  tests!: WorkOrderTestItemDto[];
}

/** Cuerpo de `POST /diagnostics/analyzer-runs` (soporte: abrir corrida de analizador). */
export class CreateAnalyzerRunDto {
  @ApiProperty({ format: 'uuid', description: 'Analizador (device id)' })
  @IsUUID()
  analyzerDeviceId!: string;

  @ApiProperty({ description: 'Identificador de la corrida' })
  @IsString()
  @MaxLength(120)
  runIdentifier!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant custodio (por defecto el del token)' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Lote de reactivo' })
  @IsOptional()
  @IsUUID()
  reagentLotId?: string;

  @ApiPropertyOptional({ description: 'Referencia de calibración' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  calibrationReference?: string;
}

/** Cuerpo de `POST /diagnostics/analyzer-runs/{id}/messages` (UC-20-05). */
export class IngestAnalyzerMessageDto {
  @ApiProperty({ description: 'Hash idempotente del payload crudo' })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Formato del mensaje (concept id)' })
  @IsOptional()
  @IsUUID()
  messageFormatConceptId?: string;

  @ApiPropertyOptional({ description: 'Message control id (idempotencia por corrida)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  messageControlId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Prueba de la orden a completar' })
  @IsOptional()
  @IsUUID()
  laboratoryWorkOrderTestId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Observación mapeada (clinical.observations)' })
  @IsOptional()
  @IsUUID()
  mappedObservationId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Archivo del mensaje crudo (common.files)' })
  @IsOptional()
  @IsUUID()
  rawMessageFileId?: string;
}

/** Cuerpo de `POST /diagnostics/results/{observationId}/verifications` (UC-20-06). */
export class VerifyResultDto {
  @ApiProperty({ enum: ['TECHNICAL', 'MEDICAL'], description: 'Nivel de verificación' })
  @IsIn(['TECHNICAL', 'MEDICAL'])
  level!: 'TECHNICAL' | 'MEDICAL';

  @ApiProperty({ format: 'uuid', description: 'Profesional que verifica' })
  @IsUUID()
  verifiedByProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant custodio (por defecto el del token)' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Resultado de la verificación (concept id)' })
  @IsOptional()
  @IsUUID()
  resultConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Verificación previa que se encadena' })
  @IsOptional()
  @IsUUID()
  previousVerificationId?: string;

  @ApiPropertyOptional({ description: 'Comentario de la verificación' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationComment?: string;
}
