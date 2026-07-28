import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

/** Tipos de relación admitidos entre conceptos. */
export type RelationshipType = 'IS_A' | 'PART_OF';

/** Alta de una relación entre conceptos (UC-03-06). */
export class CreateRelationshipDto {
  /**
   * Identificador asociado a target concept.
   */
  @ApiProperty({ description: 'Id del concepto destino' })
  @IsUUID()
  targetConceptId!: string;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de relación', enum: ['IS_A', 'PART_OF'] })
  @IsIn(['IS_A', 'PART_OF'])
  relationshipType!: RelationshipType;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orden dentro de las relaciones del mismo tipo',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Respuesta del alta de relación. */
export class RelationshipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la relación creada' })
  id!: string;

  /**
   * Identificador asociado a source concept.
   */
  @ApiProperty({ description: 'Id del concepto origen' })
  sourceConceptId!: string;

  /**
   * Identificador asociado a target concept.
   */
  @ApiProperty({ description: 'Id del concepto destino' })
  targetConceptId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @ApiProperty({ description: 'Tipo de relación (concepto)' })
  relationshipTypeConceptId!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orden dentro de las relaciones del mismo tipo',
  })
  ordinal?: number;
}
