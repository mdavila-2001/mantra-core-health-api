import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * Expansión de un conjunto de valores (UC-03-08).
 *
 * La expansión evalúa las reglas de la versión contra los conceptos activos y
 * **reemplaza** los miembros: no acumula. Conservar los anteriores dejaría dentro
 * códigos que las reglas ya no seleccionan.
 */
export class ExpandValueSetDto {
  @ApiProperty({
    description: 'Versión del conjunto de valores a expandir',
    format: 'uuid',
  })
  @IsUUID()
  valueSetVersionId!: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Activa la versión al expandirla (draft -> active)',
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Marca la versión como la vigente por defecto del conjunto',
  })
  @IsOptional()
  @IsBoolean()
  makeDefault?: boolean;
}

/** Resultado de la expansión. */
export class ExpandValueSetResponseDto {
  @ApiProperty({ description: 'Id del conjunto de valores' })
  valueSetId!: string;

  @ApiProperty({ description: 'Id de la versión expandida' })
  valueSetVersionId!: string;

  @ApiProperty({ description: 'Estado en el que queda la versión' })
  stateConceptId!: string;

  @ApiProperty({ description: 'Reglas evaluadas' })
  rulesEvaluated!: number;

  @ApiProperty({ description: 'Conceptos incluidos en la expansión' })
  includedMembers!: number;

  @ApiProperty({
    description: 'Miembros de la expansión anterior que se reemplazaron',
  })
  replacedMembers!: number;
}
