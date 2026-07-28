import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Rol de contenido de un archivo dentro de un documento. */
export type DocumentFileRole = 'PRIMARY' | 'ATTACHMENT';

/** Un archivo gobernado adjunto al documento (UC-15-09). */
export class DocumentFileInputDto {
  /**
   * Identificador asociado a file.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Archivo ya subido a object_storage (common.files)',
  })
  @IsUUID()
  fileId!: string;

  /**
   * Valor de content role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['PRIMARY', 'ATTACHMENT'],
    description: 'Rol de contenido',
  })
  @IsOptional()
  @IsIn(['PRIMARY', 'ATTACHMENT'])
  contentRole?: DocumentFileRole;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 0,
    description: 'Orden del archivo dentro del documento',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /charts/documents` (UC-15-09). */
export class CreateDocumentDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de paciente (profiles.patient_profiles)',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tenant propietario (directory.tenants)',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título del documento' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro clínico asociado',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de la categoría documental',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a source concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de la fuente del documento',
  })
  @IsOptional()
  @IsUUID()
  sourceConceptId?: string;

  /**
   * Identificador asociado a confidentiality concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de confidencialidad',
  })
  @IsOptional()
  @IsUUID()
  confidentialityConceptId?: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de visibilidad para el paciente',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  /**
   * Valor de author text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Autor libre (documentos externos)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorText?: string;

  /**
   * Valor de is external mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si el documento proviene de una fuente externa',
  })
  @IsOptional()
  @IsBoolean()
  isExternal?: boolean;

  /**
   * Valor de files mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [DocumentFileInputDto],
    description: 'Archivos gobernados (0..n)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentFileInputDto)
  files?: DocumentFileInputDto[];
}

/** Respuesta de `POST /charts/documents` (UC-15-09). */
export class DocumentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado del documento',
    format: 'uuid',
  })
  statusConceptId!: string;

  /**
   * Valor de file count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de archivos adjuntados' })
  fileCount!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
