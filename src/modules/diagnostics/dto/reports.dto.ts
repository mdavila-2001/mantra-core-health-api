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
  @ApiProperty({ format: 'uuid', description: 'Observación enlazada' })
  @IsUUID()
  observationId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Rol del resultado (concept id)' })
  @IsOptional()
  @IsUUID()
  resultRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Orden dentro del informe' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Archivo a adjuntar a una versión de informe. */
export class ReportFileItemDto {
  @ApiProperty({ format: 'uuid', description: 'Archivo (common.files)' })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Rol del contenido (concept id)' })
  @IsOptional()
  @IsUUID()
  contentRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Orden' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /diagnostics/reports/{reportId}/versions` (UC-20-07). */
export class CreateReportVersionDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant custodio (por defecto el del token)' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ description: 'Conclusión clínica' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  conclusionText?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Autor (profesional validador)' })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Versión previa que enmienda' })
  @IsOptional()
  @IsUUID()
  supersedesVersionId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo de enmienda (concept id)' })
  @IsOptional()
  @IsUUID()
  amendmentReasonConceptId?: string;

  @ApiPropertyOptional({ description: 'Texto del motivo de enmienda' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  amendmentReasonText?: string;

  @ApiPropertyOptional({ type: [ReportResultItemDto], description: 'Observaciones enlazadas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportResultItemDto)
  results?: ReportResultItemDto[];

  @ApiPropertyOptional({ type: [ReportFileItemDto], description: 'Archivos adjuntos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFileItemDto)
  files?: ReportFileItemDto[];
}

/** Cuerpo de `POST /diagnostics/reports/{reportId}/versions/{versionId}/release` (UC-20-08). */
export class ReleaseReportVersionDto {
  @ApiPropertyOptional({ description: 'Visibilidad al paciente', enum: ['VISIBLE', 'HIDDEN'] })
  @IsOptional()
  @IsString()
  patientVisibility?: 'VISIBLE' | 'HIDDEN';

  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo (concept id)' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  @ApiPropertyOptional({ description: 'Versión de la política aplicada' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  policyVersion?: string;
}

/** Cuerpo de `POST /diagnostics/critical-results` (UC-20-09). */
export class DetectCriticalResultDto {
  @ApiProperty({ format: 'uuid', description: 'Observación con valor crítico' })
  @IsUUID()
  observationId!: string;

  @ApiProperty({ format: 'uuid', description: 'Paciente afectado' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant custodio (por defecto el del token)' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Criticidad (concept id)' })
  @IsOptional()
  @IsUUID()
  criticalityConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Informe diagnóstico relacionado' })
  @IsOptional()
  @IsUUID()
  diagnosticReportId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional que detecta' })
  @IsOptional()
  @IsUUID()
  detectedByProfileId?: string;

  @ApiPropertyOptional({ description: 'Minutos hasta escalar (SLA)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  escalationDueInMinutes?: number;
}

/** Cuerpo de `POST /diagnostics/critical-results/{id}/acknowledge` (UC-20-10). */
export class AcknowledgeCriticalResultDto {
  @ApiProperty({ format: 'uuid', description: 'Profesional que acusa recibo' })
  @IsUUID()
  acknowledgedByProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Evidencia de comunicación' })
  @IsOptional()
  @IsUUID()
  communicationEvidenceId?: string;
}
