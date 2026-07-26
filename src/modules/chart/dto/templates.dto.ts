import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignTemplateDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Práctica destino (practice.practices)' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Perfil del profesional destino' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  @ApiPropertyOptional({ description: 'Marca esta asignación como default del scope', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/** Respuesta de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({ description: 'Concept id del estado de la asignación', format: 'uuid' })
  statusConceptId!: string;
}
