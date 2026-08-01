import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Un concepto del catálogo, tal como lo devuelve la búsqueda. */
export class ConceptSearchItemDto {
  /**
   * Id del concepto: el valor que se manda en cualquier campo `*ConceptId`.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Valor a enviar en los campos `*ConceptId` del contrato',
  })
  conceptId!: string;

  /**
   * Código dentro de su sistema.
   */
  @ApiProperty({ description: 'Código del concepto', example: 'GENDER_FEMALE' })
  code!: string;

  /**
   * Denominación legible.
   */
  @ApiProperty({ description: 'Denominación principal' })
  display!: string;

  /**
   * Definición, si el catálogo la trae.
   */
  @ApiPropertyOptional({ description: 'Definición del concepto' })
  definition?: string;

  /**
   * Si el concepto puede seleccionarse (los abstractos agrupan, no se eligen).
   */
  @ApiPropertyOptional({ description: 'Si el concepto puede seleccionarse' })
  selectable?: boolean;

  /**
   * Versión del sistema de códigos a la que pertenece.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión del sistema de códigos',
  })
  codeSystemVersionId!: string;
}

/** Resultado paginado de la búsqueda de conceptos. */
export class SearchConceptsResponseDto {
  /**
   * Conceptos que casan con el filtro.
   */
  @ApiProperty({ type: [ConceptSearchItemDto] })
  items!: ConceptSearchItemDto[];

  /**
   * Número de elementos devueltos.
   */
  @ApiProperty({ description: 'Cantidad devuelta en esta página' })
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;
}
