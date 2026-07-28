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
  /**
   * Identificador asociado a value set version.
   */
  @ApiProperty({
    description: 'Versión del conjunto de valores a expandir',
    format: 'uuid',
  })
  @IsUUID()
  valueSetVersionId!: string;

  /**
   * Valor de activate mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Activa la versión al expandirla (draft -> active)',
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;

  /**
   * Valor de make default mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a value set.
   */
  @ApiProperty({ description: 'Id del conjunto de valores' })
  valueSetId!: string;

  /**
   * Identificador asociado a value set version.
   */
  @ApiProperty({ description: 'Id de la versión expandida' })
  valueSetVersionId!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ description: 'Estado en el que queda la versión' })
  stateConceptId!: string;

  /**
   * Valor de rules evaluated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Reglas evaluadas' })
  rulesEvaluated!: number;

  /**
   * Valor de included members mantenido por la instancia.
   */
  @ApiProperty({ description: 'Conceptos incluidos en la expansión' })
  includedMembers!: number;

  /**
   * Valor de replaced members mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Miembros de la expansión anterior que se reemplazaron',
  })
  replacedMembers!: number;
}
