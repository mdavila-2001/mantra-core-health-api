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
  /**
   * Identificador asociado a annotation type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de anotación (concept id)',
  })
  @IsOptional()
  @IsUUID()
  annotationTypeConceptId?: string;

  /**
   * Valor de label text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Etiqueta textual' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  labelText?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Score de confianza (0..1)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  confidenceScore?: string;

  /**
   * Valor de algorithm model reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del modelo/algoritmo IA' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  algorithmModelReference?: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Autor de la anotación' })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;
}

/** Cuerpo de `POST /diagnostics/clinical-media` (UC-20-12). */
export class AttachClinicalMediaDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño de la media' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a file.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Archivo ya cargado (common.files)',
  })
  @IsUUID()
  fileId!: string;

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
   * Identificador asociado a media type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de media (concept id)',
  })
  @IsOptional()
  @IsUUID()
  mediaTypeConceptId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico (concept id)',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a view concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Vista/proyección (concept id)',
  })
  @IsOptional()
  @IsUUID()
  viewConceptId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Informe diagnóstico al que se adjunta',
  })
  @IsOptional()
  @IsUUID()
  diagnosticReportId?: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Visibilidad al paciente (concept id)',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  /**
   * Identificador asociado a captured by profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que captura',
  })
  @IsOptional()
  @IsUUID()
  capturedByProfileId?: string;

  /**
   * Valor de annotations mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a target.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Id del objetivo (specimen/observation/study)',
  })
  @IsUUID()
  targetId!: string;

  /**
   * Valor de rule code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de regla de calidad' })
  @IsString()
  @MaxLength(120)
  ruleCode!: string;

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
   * Identificador asociado a target type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de objetivo (concept id)',
  })
  @IsOptional()
  @IsUUID()
  targetTypeConceptId?: string;

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
   * Valor de details json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalles del hallazgo (JSON libre)' })
  @IsOptional()
  detailsJson?: unknown;

  /**
   * Identificador asociado a provenance source.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id de la fuente para enlazar provenance',
  })
  @IsOptional()
  @IsUUID()
  provenanceSourceId?: string;

  /**
   * Identificador asociado a provenance source type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de fuente de provenance (concept id)',
  })
  @IsOptional()
  @IsUUID()
  provenanceSourceTypeConceptId?: string;

  /**
   * Identificador asociado a agent profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional/agente de la derivación',
  })
  @IsOptional()
  @IsUUID()
  agentProfileId?: string;
}
