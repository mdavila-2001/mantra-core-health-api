import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Resultado (observación) a enlazar en una versión de informe. */
export class ReportResultItemDto {
  /**
   * Identificador asociado a observation.
   */
  @ApiProperty({ format: 'uuid', description: 'Observación enlazada' })
  @IsUUID()
  observationId!: string;

  /**
   * Identificador asociado a result role concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol del resultado (concept id)',
  })
  @IsOptional()
  @IsUUID()
  resultRoleConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden dentro del informe' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Archivo a adjuntar a una versión de informe. */
export class ReportFileItemDto {
  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ format: 'uuid', description: 'Archivo (common.files)' })
  @IsUUID()
  fileId!: string;

  /**
   * Identificador asociado a content role concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol del contenido (concept id)',
  })
  @IsOptional()
  @IsUUID()
  contentRoleConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /diagnostics/reports/{reportId}/versions` (UC-20-07). */
export class CreateReportVersionDto {
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
   * Valor de conclusion text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Conclusión clínica' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  conclusionText?: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Autor (profesional validador)',
  })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

  /**
   * Identificador asociado a supersedes version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión previa que enmienda',
  })
  @IsOptional()
  @IsUUID()
  supersedesVersionId?: string;

  /**
   * Identificador asociado a amendment reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Motivo de enmienda (concept id)',
  })
  @IsOptional()
  @IsUUID()
  amendmentReasonConceptId?: string;

  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto del motivo de enmienda' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  amendmentReasonText?: string;

  /**
   * Valor de results mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ReportResultItemDto],
    description: 'Observaciones enlazadas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportResultItemDto)
  results?: ReportResultItemDto[];

  /**
   * Valor de files mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ReportFileItemDto],
    description: 'Archivos adjuntos',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFileItemDto)
  files?: ReportFileItemDto[];
}

/** Cuerpo de `POST /diagnostics/reports/{reportId}/versions/{versionId}/release` (UC-20-08). */
export class ReleaseReportVersionDto {
  /**
   * Valor de patient visibility mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Visibilidad al paciente',
    enum: ['VISIBLE', 'HIDDEN'],
  })
  @IsOptional()
  @IsString()
  patientVisibility?: 'VISIBLE' | 'HIDDEN';

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo (concept id)' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión de la política aplicada' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  policyVersion?: string;
}

/** Cuerpo de `POST /diagnostics/critical-results` (UC-20-09). */
export class DetectCriticalResultDto {
  /**
   * Identificador asociado a observation.
   */
  @ApiProperty({ format: 'uuid', description: 'Observación con valor crítico' })
  @IsUUID()
  observationId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente afectado' })
  @IsUUID()
  patientProfileId!: string;

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
   * Identificador asociado a criticality concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Criticidad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  criticalityConceptId?: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Informe diagnóstico relacionado',
  })
  @IsOptional()
  @IsUUID()
  diagnosticReportId?: string;

  /**
   * Identificador asociado a detected by profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que detecta',
  })
  @IsOptional()
  @IsUUID()
  detectedByProfileId?: string;

  /**
   * Valor de escalation due in minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Minutos hasta escalar (SLA)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  escalationDueInMinutes?: number;
}

/** Cuerpo de `POST /diagnostics/critical-results/{id}/acknowledge` (UC-20-10). */
export class AcknowledgeCriticalResultDto {
  /**
   * Identificador asociado a acknowledged by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que acusa recibo' })
  @IsUUID()
  acknowledgedByProfileId!: string;

  /**
   * Identificador asociado a communication evidence.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evidencia de comunicación',
  })
  @IsOptional()
  @IsUUID()
  communicationEvidenceId?: string;
}
