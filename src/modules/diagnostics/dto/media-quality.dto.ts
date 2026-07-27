import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Anotación (manual o IA) sobre la media clínica. */
export class MediaAnnotationItemDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de anotación (concept id)',
  })
  @IsOptional()
  @IsUUID()
  annotationTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Etiqueta textual' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  labelText?: string;

  @ApiPropertyOptional({ description: 'Score de confianza (0..1)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  confidenceScore?: string;

  @ApiPropertyOptional({ description: 'Referencia del modelo/algoritmo IA' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  algorithmModelReference?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Autor de la anotación' })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;
}

/** Cuerpo de `POST /diagnostics/clinical-media` (UC-20-12). */
export class AttachClinicalMediaDto {
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño de la media' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Archivo ya cargado (common.files)',
  })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de media (concept id)',
  })
  @IsOptional()
  @IsUUID()
  mediaTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico (concept id)',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Vista/proyección (concept id)',
  })
  @IsOptional()
  @IsUUID()
  viewConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Informe diagnóstico al que se adjunta',
  })
  @IsOptional()
  @IsUUID()
  diagnosticReportId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Visibilidad al paciente (concept id)',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que captura',
  })
  @IsOptional()
  @IsUUID()
  capturedByProfileId?: string;

  @ApiPropertyOptional({
    type: [MediaAnnotationItemDto],
    description: 'Anotaciones IA/manual',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAnnotationItemDto)
  annotations?: MediaAnnotationItemDto[];
}

/** Cuerpo de `POST /diagnostics/data-quality-events` (UC-20-14). */
export class CreateDataQualityEventDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Id del objetivo (specimen/observation/study)',
  })
  @IsUUID()
  targetId!: string;

  @ApiProperty({ description: 'Código de regla de calidad' })
  @IsString()
  @MaxLength(120)
  ruleCode!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de objetivo (concept id)',
  })
  @IsOptional()
  @IsUUID()
  targetTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Severidad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  @ApiPropertyOptional({ description: 'Detalles del hallazgo (JSON libre)' })
  @IsOptional()
  detailsJson?: unknown;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id de la fuente para enlazar provenance',
  })
  @IsOptional()
  @IsUUID()
  provenanceSourceId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de fuente de provenance (concept id)',
  })
  @IsOptional()
  @IsUUID()
  provenanceSourceTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional/agente de la derivación',
  })
  @IsOptional()
  @IsUUID()
  agentProfileId?: string;
}
