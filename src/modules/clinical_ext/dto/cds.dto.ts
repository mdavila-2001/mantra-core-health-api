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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant propietario (null = global)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a rule type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de regla (concept id)',
  })
  @IsOptional()
  @IsUUID()
  ruleTypeConceptId?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Severidad de la alerta que genera (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  /**
   * Valor de logic json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Lógica de la regla (JSON)' })
  @IsOptional()
  @IsObject()
  logicJson?: Record<string, unknown>;

  /**
   * Valor de message template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plantilla del mensaje de alerta' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;
}

/** Cuerpo de `POST /cds-rules/{id}/versions/publish` (UC-18-13). */
export class PublishRuleVersionDto {
  /**
   * Valor de logic json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nueva lógica de la regla (JSON)' })
  @IsOptional()
  @IsObject()
  logicJson?: Record<string, unknown>;

  /**
   * Valor de message template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nueva plantilla del mensaje' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  /**
   * Identificador asociado a severity concept.
   */
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
  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Código de la observación (concept id)',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Valor de value number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor numérico observado (p.ej. glucemia)',
  })
  @IsOptional()
  @IsNumber()
  valueNumber?: number;
}

/** Cuerpo de `POST /cds/evaluate` (UC-18-03). */
export class EvaluateCdsDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant de las reglas a evaluar',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de source resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo del recurso disparador (p.ej. allergy_intolerance)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceResourceType?: string;

  /**
   * Identificador asociado a source resource.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id del recurso disparador',
  })
  @IsOptional()
  @IsUUID()
  sourceResourceId?: string;

  /**
   * Valor de medication concept ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description:
      'Concept ids de los medicamentos activos del paciente (contexto de evaluación)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  medicationConceptIds?: string[];

  /**
   * Valor de observations mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a medication request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prescripción en borrador que se evalúa',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  /**
   * Valor de substance concept ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description:
      'Concept ids de las sustancias activas + la nueva a prescribir',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID(undefined, { each: true })
  substanceConceptIds!: string[];
}

/** Cuerpo de `POST /drug-interactions` (dato de referencia; alimenta UC-18-04). */
export class CreateDrugInteractionDto {
  /**
   * Identificador asociado a substance aconcept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  substanceAConceptId!: string;

  /**
   * Identificador asociado a substance bconcept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  substanceBConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Severidad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  /**
   * Valor de mechanism text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mechanismText?: string;

  /**
   * Valor de management text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managementText?: string;
}

/** Respuesta de una regla CDS. */
export class CdsRuleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiProperty()
  isActive!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Alerta individual generada por una pasada de evaluación. */
export class GeneratedAlertDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a alert type concept.
   */
  @ApiProperty({ format: 'uuid' })
  alertTypeConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  /**
   * Identificador asociado a rule.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  ruleId?: string;
}

/** Respuesta atómica del conjunto de alertas generadas (UC-18-03 / UC-18-04). */
export class AlertBatchResponseDto {
  /**
   * Valor de alerts mantenido por la instancia.
   */
  @ApiProperty({ type: [GeneratedAlertDto] })
  alerts!: GeneratedAlertDto[];

  /**
   * Valor de count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de alertas generadas' })
  count!: number;
}
