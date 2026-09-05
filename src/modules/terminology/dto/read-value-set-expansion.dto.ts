import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un miembro de la expansión, con el concepto ya resuelto.
 *
 * Trae `code` y `display` además del id porque el consumidor típico es un campo
 * de formulario: con sólo el `conceptId` habría que pedir cada concepto por
 * separado para poder pintar la lista.
 */
export class ValueSetExpansionItemDto {
  /**
   * Id del concepto: el valor que se envía en los campos `*ConceptId`.
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

  /**
   * Posición del miembro dentro de la expansión.
   */
  @ApiPropertyOptional({
    description: 'Posición del miembro dentro de la expansión',
  })
  ordinal?: number;

  /**
   * Las propiedades del concepto, indexadas por código.
   *
   * **Sólo viaja con `includeProperties=true`.** Es opt-in y no por omisión
   * porque la mayoría de los consumidores de una expansión pinta una lista de
   * opciones y no necesita nada más que código y etiqueta: mandárselas a todos
   * engordaría respuestas que hoy son chicas.
   *
   * Existe porque hay catálogos cuyo dato útil ESTÁ en las propiedades. El
   * nomenclador de procedimientos son 4 408 conceptos con su especialidad, su
   * precio de referencia y su unidad ahí guardados; sin esto, pintarlo obliga a
   * pedir 4 408 detalles, uno por fila.
   *
   * Se lee por nombre (`properties.specialty`), nunca recorriéndolo.
   */
  @ApiPropertyOptional({
    description: 'Propiedades del concepto; sólo con includeProperties=true',
    type: 'object',
    additionalProperties: true,
  })
  properties?: Record<string, unknown>;
}

/** Página de la expansión vigente de un conjunto de valores. */
export class ReadValueSetExpansionResponseDto {
  /**
   * Identificador asociado a value set.
   */
  @ApiProperty({ format: 'uuid', description: 'Id del conjunto de valores' })
  valueSetId!: string;

  /**
   * Identificador asociado a value set version.
   */
  @ApiProperty({ format: 'uuid', description: 'Id de la versión leída' })
  valueSetVersionId!: string;

  /**
   * Etiqueta de la versión leída.
   */
  @ApiProperty({ description: 'Etiqueta de la versión', example: '1.0.0' })
  version!: string;

  /**
   * Miembros de esta página.
   */
  @ApiProperty({ type: [ValueSetExpansionItemDto] })
  items!: ValueSetExpansionItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty({ description: 'Cantidad devuelta en esta página' })
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;

  /**
   * Cursor de continuación, o `null` si esta es la última página.
   *
   * Es opaco: se reenvía tal cual en `?cursor=`. No hay total porque contarlo
   * exigiría una segunda pasada sobre la tabla en cada página, y quien rellena
   * un desplegable no necesita el total, necesita la siguiente página.
   */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Cursor opaco para pedir la página siguiente',
  })
  nextCursor!: string | null;
}
