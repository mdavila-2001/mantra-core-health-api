import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /forms/fields/{id}/dependencies` (UC-09-04). */
export class CreateFieldDependencyDto {
  /**
   * Identificador asociado a source field.
   */
  @ApiProperty({
    description: 'Campo fuente que dispara la condición',
    format: 'uuid',
  })
  @IsUUID()
  sourceFieldId!: string;

  /**
   * Valor de operator mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['EQ', 'NEQ', 'GT', 'LT'],
    description: 'Operador de comparación',
  })
  @IsIn(['EQ', 'NEQ', 'GT', 'LT'])
  operator!: 'EQ' | 'NEQ' | 'GT' | 'LT';

  /**
   * Valor de behavior mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['SHOW', 'HIDE', 'REQUIRE'],
    description: 'Comportamiento aplicado',
  })
  @IsIn(['SHOW', 'HIDE', 'REQUIRE'])
  behavior!: 'SHOW' | 'HIDE' | 'REQUIRE';

  /**
   * Valor de comparison value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor de comparación (json)',
    type: Object,
  })
  @IsOptional()
  comparisonValue?: unknown;

  /**
   * Valor de logical group mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Grupo lógico de la condición',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  logicalGroup?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden de evaluación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}
