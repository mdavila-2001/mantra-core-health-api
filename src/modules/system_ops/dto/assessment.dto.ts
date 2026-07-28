import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /admin/governance/workload-assessments` (UC-11-12). */
export class CreateWorkloadAssessmentDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant de la evaluación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a operational framework.
   */
  @ApiProperty({ description: 'Framework publicado a evaluar', format: 'uuid' })
  @IsUUID()
  operationalFrameworkId!: string;

  /**
   * Valor de workload code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  workloadCode!: string;

  /**
   * Valor de workload name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  workloadName!: string;

  /**
   * Identificador asociado a assessment type concept.
   */
  @ApiProperty({
    description: 'Tipo de evaluación (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  assessmentTypeConceptId!: string;

  /**
   * Valor de assessment period start mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio del periodo (ISO date)' })
  @IsOptional()
  @IsDateString()
  assessmentPeriodStart?: string;

  /**
   * Valor de assessment period end mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin del periodo (ISO date)' })
  @IsOptional()
  @IsDateString()
  assessmentPeriodEnd?: string;

  /**
   * Identificador asociado a facilitator user.
   */
  @ApiPropertyOptional({
    description: 'Facilitador de la evaluación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  facilitatorUserId?: string;
}

/** Un resultado de control dentro de un PUT de resultados. */
export class ControlResultItemDto {
  /**
   * Identificador asociado a operational framework control.
   */
  @ApiProperty({
    description: 'Control del framework evaluado',
    format: 'uuid',
  })
  @IsUUID()
  operationalFrameworkControlId!: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiProperty({ description: 'Resultado (concept id)', format: 'uuid' })
  @IsUUID()
  resultConceptId!: string;

  /**
   * Identificador asociado a maturity level concept.
   */
  @ApiPropertyOptional({
    description: 'Nivel de madurez (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  maturityLevelConceptId?: string;

  /**
   * Valor de evidence summary mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evidenceSummary?: string;

  /**
   * Valor de evidence links json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Enlaces de evidencia (JSON libre)' })
  @IsOptional()
  @IsObject()
  evidenceLinksJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /admin/governance/workload-assessments/{id}/control-results` (UC-11-12). */
export class PutControlResultsDto {
  /**
   * Valor de results mantenido por la instancia.
   */
  @ApiProperty({ type: [ControlResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ControlResultItemDto)
  results!: ControlResultItemDto[];
}

/** Una acción de remediación anidada en el plan. */
export class RemediationActionDto {
  /**
   * Valor de action code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  actionCode!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  /**
   * Identificador asociado a assigned user.
   */
  @ApiPropertyOptional({ description: 'Usuario asignado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  /**
   * Valor de assigned team mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignedTeam?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

/** Cuerpo de `POST /admin/governance/assessments/{id}/findings` (UC-11-13). */
export class CreateFindingDto {
  /**
   * Valor de finding code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  findingCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiProperty({ description: 'Severidad (concept id)', format: 'uuid' })
  @IsUUID()
  severityConceptId!: string;

  /**
   * Identificador asociado a assessment control result.
   */
  @ApiPropertyOptional({
    description: 'Resultado de control del que deriva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assessmentControlResultId?: string;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

/** Cuerpo de `POST /admin/governance/assessments/{id}/remediation-plans` (UC-11-13). */
export class CreateRemediationPlanDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a assessment finding.
   */
  @ApiProperty({
    description: 'Hallazgo al que responde el plan',
    format: 'uuid',
  })
  @IsUUID()
  assessmentFindingId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @ApiPropertyOptional({ description: 'Responsable del plan', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  /**
   * Valor de target completion at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha objetivo de finalización (ISO)' })
  @IsOptional()
  @IsDateString()
  targetCompletionAt?: string;

  /**
   * Valor de actions mantenido por la instancia.
   */
  @ApiProperty({ type: [RemediationActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemediationActionDto)
  actions!: RemediationActionDto[];
}

/** Cuerpo de `POST /admin/governance/remediation-actions/{id}/verify` (UC-11-14). */
export class VerifyRemediationActionDto {
  /**
   * Valor de verification evidence json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Evidencia de verificación (JSON libre)' })
  @IsObject()
  verificationEvidenceJson!: Record<string, unknown>;
}

/** Cuerpo de `PATCH /admin/governance/findings/{id}` (UC-11-14). */
export class UpdateFindingDto {
  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({
    description: 'Estado del hallazgo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;
}

/** Respuesta al crear una evaluación con su primer bloque de resultados. */
export class WorkloadAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Respuesta al abrir un hallazgo con su plan y acciones. */
export class FindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Respuesta al crear un plan de remediación con sus acciones. */
export class RemediationPlanResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de action ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de las acciones creadas' })
  actionIds!: string[];
}
