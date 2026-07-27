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
  @ApiProperty({
    format: 'uuid',
    description: 'Archivo ya subido a object_storage (common.files)',
  })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({
    enum: ['PRIMARY', 'ATTACHMENT'],
    description: 'Rol de contenido',
  })
  @IsOptional()
  @IsIn(['PRIMARY', 'ATTACHMENT'])
  contentRole?: DocumentFileRole;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de paciente (profiles.patient_profiles)',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tenant propietario (directory.tenants)',
  })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Título del documento' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro clínico asociado',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de la categoría documental',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de la fuente del documento',
  })
  @IsOptional()
  @IsUUID()
  sourceConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de confidencialidad',
  })
  @IsOptional()
  @IsUUID()
  confidentialityConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de visibilidad para el paciente',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  @ApiPropertyOptional({ description: 'Autor libre (documentos externos)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorText?: string;

  @ApiPropertyOptional({
    description: 'true si el documento proviene de una fuente externa',
  })
  @IsOptional()
  @IsBoolean()
  isExternal?: boolean;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Concept id del estado del documento',
    format: 'uuid',
  })
  statusConceptId!: string;

  @ApiProperty({ description: 'Nº de archivos adjuntados' })
  fileCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
