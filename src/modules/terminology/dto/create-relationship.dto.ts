import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

/** Tipos de relación admitidos entre conceptos. */
export type RelationshipType = 'IS_A' | 'PART_OF';

/** Alta de una relación entre conceptos (UC-03-06). */
export class CreateRelationshipDto {
  @ApiProperty({ description: 'Id del concepto destino' })
  @IsUUID()
  targetConceptId!: string;

  @ApiProperty({ description: 'Tipo de relación', enum: ['IS_A', 'PART_OF'] })
  @IsIn(['IS_A', 'PART_OF'])
  relationshipType!: RelationshipType;

  @ApiPropertyOptional({ description: 'Orden dentro de las relaciones del mismo tipo' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Respuesta del alta de relación. */
export class RelationshipResponseDto {
  @ApiProperty({ description: 'Id de la relación creada' })
  id!: string;

  @ApiProperty({ description: 'Id del concepto origen' })
  sourceConceptId!: string;

  @ApiProperty({ description: 'Id del concepto destino' })
  targetConceptId!: string;

  @ApiProperty({ description: 'Tipo de relación (concepto)' })
  relationshipTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Orden dentro de las relaciones del mismo tipo' })
  ordinal?: number;
}
