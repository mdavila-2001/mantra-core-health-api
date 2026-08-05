import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignTemplateDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Práctica destino (practice.practices)',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Perfil del profesional destino',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marca esta asignación como default del scope',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/** Respuesta de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a template.
   */
  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @ApiProperty()
  isDefault!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado de la asignación',
    format: 'uuid',
  })
  statusConceptId!: string;
}
