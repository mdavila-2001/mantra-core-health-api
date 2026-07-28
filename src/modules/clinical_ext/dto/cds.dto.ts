import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /cds-rules` (crea la regla en borrador; precondición de UC-18-13). */
export class CreateCdsRuleDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant propietario (null = global)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de regla (concept id)',
  })
  @IsOptional()
  @IsUUID()
  ruleTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Severidad de la alerta que genera (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  @ApiPropertyOptional({ description: 'Lógica de la regla (JSON)' })
  @IsOptional()
  @IsObject()
  logicJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Plantilla del mensaje de alerta' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;
}

/** Cuerpo de `POST /cds-rules/{id}/versions/publish` (UC-18-13). */
export class PublishRuleVersionDto {
  @ApiPropertyOptional({ description: 'Nueva lógica de la regla (JSON)' })
  @IsOptional()
  @IsObject()
  logicJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nueva plantilla del mensaje' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Nueva severidad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;
}

/** Una observación del contexto de evaluación (código + valor numérico opcional). */
export class CdsObservationInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Código de la observación (concept id)',
  })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({
    description: 'Valor numérico observado (p.ej. glucemia)',
  })
  @IsOptional()
  @IsNumber()
  valueNumber?: number;
}

/** Cuerpo de `POST /cds/evaluate` (UC-18-03). */
export class EvaluateCdsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant de las reglas a evaluar',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Tipo del recurso disparador (p.ej. allergy_intolerance)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceResourceType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id del recurso disparador',
  })
  @IsOptional()
  @IsUUID()
  sourceResourceId?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Concept ids de los medicamentos activos del paciente (contexto de evaluación)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  medicationConceptIds?: string[];

  @ApiPropertyOptional({
    type: [CdsObservationInputDto],
    description: 'Observaciones del paciente (contexto de evaluación)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CdsObservationInputDto)
  observations?: CdsObservationInputDto[];
}

/** Cuerpo de `POST /cds/check-interactions` (UC-18-04). */
export class CheckInteractionsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prescripción en borrador que se evalúa',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  @ApiProperty({
    type: [String],
    description:
      'Concept ids de las sustancias activas + la nueva a prescribir',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  substanceConceptIds!: string[];
}

/** Cuerpo de `POST /drug-interactions` (dato de referencia; alimenta UC-18-04). */
export class CreateDrugInteractionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  substanceAConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  substanceBConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Severidad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mechanismText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managementText?: string;
}

/** Respuesta de una regla CDS. */
export class CdsRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Alerta individual generada por una pasada de evaluación. */
export class GeneratedAlertDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  alertTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  ruleId?: string;
}

/** Respuesta atómica del conjunto de alertas generadas (UC-18-03 / UC-18-04). */
export class AlertBatchResponseDto {
  @ApiProperty({ type: [GeneratedAlertDto] })
  alerts!: GeneratedAlertDto[];

  @ApiProperty({ description: 'Nº de alertas generadas' })
  count!: number;
}
