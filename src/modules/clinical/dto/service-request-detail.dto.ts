import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsConceptId } from './concept-id.validator';

/**
 * Detalle de imagen de una orden (v4.2.80). Todos los campos son opcionales en
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
}
