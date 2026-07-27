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
  @ApiProperty({
    description: 'Campo fuente que dispara la condición',
    format: 'uuid',
  })
  @IsUUID()
  sourceFieldId!: string;

  @ApiProperty({
    enum: ['EQ', 'NEQ', 'GT', 'LT'],
    description: 'Operador de comparación',
  })
  @IsIn(['EQ', 'NEQ', 'GT', 'LT'])
  operator!: 'EQ' | 'NEQ' | 'GT' | 'LT';

  @ApiProperty({
    enum: ['SHOW', 'HIDE', 'REQUIRE'],
    description: 'Comportamiento aplicado',
  })
  @IsIn(['SHOW', 'HIDE', 'REQUIRE'])
  behavior!: 'SHOW' | 'HIDE' | 'REQUIRE';

  @ApiPropertyOptional({
    description: 'Valor de comparación (json)',
    type: Object,
  })
  @IsOptional()
  comparisonValue?: unknown;

  @ApiPropertyOptional({
    description: 'Grupo lógico de la condición',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  logicalGroup?: string;

  @ApiPropertyOptional({ description: 'Orden de evaluación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}
