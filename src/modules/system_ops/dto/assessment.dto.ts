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
  @ApiProperty({ description: 'Tenant de la evaluación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Framework publicado a evaluar', format: 'uuid' })
  @IsUUID()
  operationalFrameworkId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  workloadCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  workloadName!: string;

  @ApiProperty({
    description: 'Tipo de evaluación (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  assessmentTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Inicio del periodo (ISO date)' })
  @IsOptional()
  @IsDateString()
  assessmentPeriodStart?: string;

  @ApiPropertyOptional({ description: 'Fin del periodo (ISO date)' })
  @IsOptional()
  @IsDateString()
  assessmentPeriodEnd?: string;

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
  @ApiProperty({
    description: 'Control del framework evaluado',
    format: 'uuid',
  })
  @IsUUID()
  operationalFrameworkControlId!: string;

  @ApiProperty({ description: 'Resultado (concept id)', format: 'uuid' })
  @IsUUID()
  resultConceptId!: string;

  @ApiPropertyOptional({
    description: 'Nivel de madurez (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  maturityLevelConceptId?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evidenceSummary?: string;

  @ApiPropertyOptional({ description: 'Enlaces de evidencia (JSON libre)' })
  @IsOptional()
  @IsObject()
  evidenceLinksJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /admin/governance/workload-assessments/{id}/control-results` (UC-11-12). */
export class PutControlResultsDto {
  @ApiProperty({ type: [ControlResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ControlResultItemDto)
  results!: ControlResultItemDto[];
}

/** Una acción de remediación anidada en el plan. */
export class RemediationActionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  actionCode!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ description: 'Usuario asignado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignedTeam?: string;

  @ApiPropertyOptional({ description: 'Vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

/** Cuerpo de `POST /admin/governance/assessments/{id}/findings` (UC-11-13). */
export class CreateFindingDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  findingCode!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Severidad (concept id)', format: 'uuid' })
  @IsUUID()
  severityConceptId!: string;

  @ApiPropertyOptional({
    description: 'Resultado de control del que deriva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assessmentControlResultId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;

  @ApiPropertyOptional({ description: 'Vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

/** Cuerpo de `POST /admin/governance/assessments/{id}/remediation-plans` (UC-11-13). */
export class CreateRemediationPlanDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Hallazgo al que responde el plan',
    format: 'uuid',
  })
  @IsUUID()
  assessmentFindingId!: string;

  @ApiPropertyOptional({ description: 'Responsable del plan', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ description: 'Fecha objetivo de finalización (ISO)' })
  @IsOptional()
  @IsDateString()
  targetCompletionAt?: string;

  @ApiProperty({ type: [RemediationActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemediationActionDto)
  actions!: RemediationActionDto[];
}

/** Cuerpo de `POST /admin/governance/remediation-actions/{id}/verify` (UC-11-14). */
export class VerifyRemediationActionDto {
  @ApiProperty({ description: 'Evidencia de verificación (JSON libre)' })
  @IsObject()
  verificationEvidenceJson!: Record<string, unknown>;
}

/** Cuerpo de `PATCH /admin/governance/findings/{id}` (UC-11-14). */
export class UpdateFindingDto {
  @ApiPropertyOptional({
    description: 'Estado del hallazgo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;
}

/** Respuesta al crear una evaluación con su primer bloque de resultados. */
export class WorkloadAssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Respuesta al abrir un hallazgo con su plan y acciones. */
export class FindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Respuesta al crear un plan de remediación con sus acciones. */
export class RemediationPlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String], description: 'Ids de las acciones creadas' })
  actionIds!: string[];
}
