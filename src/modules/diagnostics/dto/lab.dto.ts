import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Una prueba a desglosar dentro de la orden de trabajo. */
export class WorkOrderTestItemDto {
  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Orden clínica que solicita la prueba',
  })
  @IsUUID()
  serviceRequestId!: string;

  /**
   * Identificador asociado a test code concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Código de prueba (concept id)' })
  @IsUUID()
  testCodeConceptId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Espécimen sobre el que se corre',
  })
  @IsOptional()
  @IsUUID()
  specimenId?: string;

  /**
   * Identificador asociado a method concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Método (concept id)' })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  /**
   * Identificador asociado a analyzer device.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Analizador asignado (device id)',
  })
  @IsOptional()
  @IsUUID()
  analyzerDeviceId?: string;
}

/** Cuerpo de `POST /diagnostics/work-orders` (UC-20-04). */
export class CreateWorkOrderDto {
  /**
   * Identificador asociado a laboratory accession.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Acesión de laboratorio en estado recibido',
  })
  @IsUUID()
  laboratoryAccessionId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Valor de work order number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de orden (se genera si se omite)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  workOrderNumber?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prioridad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  /**
   * Identificador asociado a assigned laboratory unit.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad de laboratorio asignada',
  })
  @IsOptional()
  @IsUUID()
  assignedLaboratoryUnitId?: string;

  /**
   * Valor de tests mantenido por la instancia.
   */
  @ApiProperty({
    type: [WorkOrderTestItemDto],
    description: 'Pruebas a desglosar',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderTestItemDto)
  tests!: WorkOrderTestItemDto[];
}

/** Cuerpo de `POST /diagnostics/analyzer-runs` (soporte: abrir corrida de analizador). */
export class CreateAnalyzerRunDto {
  /**
   * Identificador asociado a analyzer device.
   */
  @ApiProperty({ format: 'uuid', description: 'Analizador (device id)' })
  @IsUUID()
  analyzerDeviceId!: string;

  /**
   * Valor de run identifier mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identificador de la corrida' })
  @IsString()
  @MaxLength(120)
  runIdentifier!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Identificador asociado a reagent lot.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Lote de reactivo' })
  @IsOptional()
  @IsUUID()
  reagentLotId?: string;

  /**
   * Valor de calibration reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia de calibración' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  calibrationReference?: string;
}

/** Cuerpo de `POST /diagnostics/analyzer-runs/{id}/messages` (UC-20-05). */
export class IngestAnalyzerMessageDto {
  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash idempotente del payload crudo' })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  /**
   * Identificador asociado a message format concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Formato del mensaje (concept id)',
  })
  @IsOptional()
  @IsUUID()
  messageFormatConceptId?: string;

  /**
   * Identificador asociado a message control.
   */
  @ApiPropertyOptional({
    description: 'Message control id (idempotencia por corrida)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  messageControlId?: string;

  /**
   * Identificador asociado a laboratory work order test.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prueba de la orden a completar',
  })
  @IsOptional()
  @IsUUID()
  laboratoryWorkOrderTestId?: string;

  /**
   * Identificador asociado a mapped observation.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Observación mapeada (clinical.observations)',
  })
  @IsOptional()
  @IsUUID()
  mappedObservationId?: string;

  /**
   * Identificador asociado a raw message file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo del mensaje crudo (common.files)',
  })
  @IsOptional()
  @IsUUID()
  rawMessageFileId?: string;
}

/** Cuerpo de `POST /diagnostics/results/{observationId}/verifications` (UC-20-06). */
export class VerifyResultDto {
  /**
   * Valor de level mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['TECHNICAL', 'MEDICAL'],
    description: 'Nivel de verificación',
  })
  @IsIn(['TECHNICAL', 'MEDICAL'])
  level!: 'TECHNICAL' | 'MEDICAL';

  /**
   * Identificador asociado a verified by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que verifica' })
  @IsUUID()
  verifiedByProfileId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Resultado de la verificación (concept id)',
  })
  @IsOptional()
  @IsUUID()
  resultConceptId?: string;

  /**
   * Identificador asociado a previous verification.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Verificación previa que se encadena',
  })
  @IsOptional()
  @IsUUID()
  previousVerificationId?: string;

  /**
   * Valor de verification comment mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Comentario de la verificación' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationComment?: string;
}

/** Filtros de `GET /diagnostics/work-orders`. */
export class ListWorkOrdersQueryDto {
  /**
   * Identificador asociado a laboratory accession.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Accesión de laboratorio',
  })
  @IsOptional()
  @IsUUID()
  laboratoryAccessionId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Estado de la orden' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  /**
   * Identificador asociado a assigned profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional asignado' })
  @IsOptional()
  @IsUUID()
  assignedProfileId?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /**
   * Valor de offset mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Orden de trabajo tal como la devuelve el listado. */
export class WorkOrderSummaryDto {
  /** Identificador de la orden. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Número legible de la orden. */
  @ApiProperty() workOrderNumber!: string;
  /** Accesión de laboratorio de la que cuelga. */
  @ApiProperty({ format: 'uuid' }) laboratoryAccessionId!: string;
  /** Estado de la orden. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  /** Prioridad. */
  @ApiProperty({ format: 'uuid' }) priorityConceptId!: string;
  /** Profesional asignado, si lo hay. */
  @ApiPropertyOptional({ format: 'uuid' }) assignedProfileId?: string;
  /** Cuándo está programada. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  scheduledAt?: Date;
  /** Cuándo se completó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt?: Date;
}
