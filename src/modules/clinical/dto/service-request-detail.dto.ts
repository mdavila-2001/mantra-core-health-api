import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsConceptId } from './concept-id.validator';

/**
 * Detalle de imagen de una orden (v4.2.82). Todos los campos son opcionales en
 * el cuerpo; cuáles son obligatorios lo decide el catálogo del estudio
 * (V5–V9, `StudyDetailReason`), no el DTO.
 */
export class ImagingDetailDto {
  @ApiPropertyOptional({
    description:
      'Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  modalityConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED)',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE)',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  lateralityConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY)',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  contrastConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Estructura marcada en el modelo 3D del cuerpo (`UBERON:<n>`). 422 BODY_STRUCTURE_FORMAT_INVALID si la forma no es esa; no se verifica contra el atlas',
    maxLength: 64,
    example: 'UBERON:0000955',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bodyStructureUberon?: string;

  @ApiPropertyOptional({
    description:
      'Malla marcada en el modelo 3D (id alfanumérico, p. ej. `BP44`). 422 BODY_MESH_ID_FORMAT_INVALID si no lo es',
    maxLength: 64,
    example: 'BP44',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bodyMeshId?: string;

  @ApiPropertyOptional({
    description:
      'Tipo de hueso (value set `bone-type`; lo elige el médico, no se deriva). Exige región o estructura UBERON (422 BONE_TYPE_REQUIRES_BODY_STRUCTURE / BONE_TYPE_NOT_IN_CATALOG)',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  boneTypeConceptId?: string;
}

/**
 * Los mismos datos de región en el nivel superior del alta (lo que manda el
 * visor 3D). Equivalen a su par dentro de `imaging`; si viajan en los dos
 * lugares con valores distintos: 422 IMAGING_FIELD_CONFLICT.
 */
export class ImagingFlatInputDto {
  @ApiPropertyOptional({
    description: 'Equivale a `imaging.modalityConceptId`',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  modalityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Equivale a `imaging.bodySiteConceptId`',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    description: 'Equivale a `imaging.lateralityConceptId`',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  lateralityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Equivale a `imaging.bodyStructureUberon`',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bodyStructureUberon?: string;

  @ApiPropertyOptional({
    description: 'Equivale a `imaging.bodyMeshId`',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bodyMeshId?: string;

  @ApiPropertyOptional({
    description: 'Equivale a `imaging.boneTypeConceptId`',
    format: 'uuid',
  })
  @IsOptional()
  @IsConceptId()
  boneTypeConceptId?: string;
}

/** Un componente marcado de un panel de laboratorio. */
export class ServiceRequestComponentDto {
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty({ description: 'Nombre legible (castellano si existe)' })
  display!: string;

  @ApiProperty({
    description: 'Posición, desde 1, en el orden en que se marcó',
  })
  ordinal!: number;
}

/** El detalle de imagen tal como vuelve: ids y nombre legible. */
export class ServiceRequestImagingDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  modalityConceptId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  modalityDisplay!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  bodySiteConceptId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodySiteDisplay!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  lateralityConceptId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  lateralityDisplay!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  contrastConceptId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  contrastDisplay!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodyStructureUberon!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodyMeshId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  boneTypeConceptId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  boneTypeDisplay!: string | null;
}

/**
 * Los datos de región, en el nivel superior de la respuesta de una orden de
 * imagen (además de dentro de `imaging`). Ausentes si la orden no es de imagen.
 */
export class ServiceRequestImagingFlatDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  modalityConceptId?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  modalityDisplay?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  bodySiteConceptId?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodySiteDisplay?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  lateralityConceptId?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  lateralityDisplay?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodyStructureUberon?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bodyMeshId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  boneTypeConceptId?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  boneTypeDisplay?: string | null;
}
