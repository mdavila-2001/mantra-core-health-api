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

  /* Los dos campos que siguen se añaden **al final** y sólo aparecen cuando la
     petición los pide (`lang`, `includeValueSets`). Sin esos parámetros la
     respuesta es idéntica a la de siempre: esta lectura la consumen la agenda,
     el perfil profesional, los diagnósticos y la ficha clínica, y ninguna puede
     cambiar de forma porque el glosario necesite dos datos más. */

  /**
   * Si `display` y `definition` vienen en el idioma pedido.
   *
   * Sólo se informa cuando la petición trae `lang`. En `false`, los textos son
   * los del sistema de codificación —el original— porque el concepto no tiene
   * designación cargada en ese idioma. Se publica para que la pantalla pueda
   * decir que falta la traducción en vez de mostrar el inglés como si fuera lo
   * pedido.
   */
  @ApiPropertyOptional({
    description:
      'Si los textos vienen en el idioma pedido. `false` significa que se devolvió el original del sistema de codificación porque falta la designación',
  })
  translated?: boolean;

  /**
   * Conjuntos de valores a los que pertenece el concepto.
   *
   * Sólo se informa con `includeValueSets=true`. Son las categorías bajo las
   * cuales el término tiene sentido —«Diagnóstico», «Severidad», «Vía de
   * administración»— y es lo que el glosario pinta como etiquetas.
   */
  @ApiPropertyOptional({ type: () => [ConceptValueSetRefDto] })
  valueSets?: ConceptValueSetRefDto[];
}

/**
 * Un conjunto de valores nombrado desde un concepto que le pertenece.
 *
 * Es el camino inverso al de `$expand`, que va de conjunto a conceptos. Sin él,
 * un cliente que quisiera saber a qué categorías pertenece un término tendría
 * que expandir el catálogo entero y armar el índice a mano: cientos de llamadas
 * para un dato que la base resuelve en una.
 *
 * Trae lo justo para pintar una etiqueta y poder navegarla; quien necesite el
 * conjunto completo tiene `GET /terminology/value-sets`.
 */
export class ConceptValueSetRefDto {
  /**
   * Identificador del conjunto de valores.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código interno estable, como `condition-severity`.
   */
  @ApiProperty({ example: 'condition-severity' })
  internalCode!: string;

  /**
   * Nombre legible del conjunto. Es el texto de la etiqueta.
   */
  @ApiProperty({ example: 'Severidad' })
  name!: string;
}

/** Una denominación alternativa del concepto: su sinónimo en algún idioma. */
export class ConceptSynonymDto {
  /**
   * El texto de la denominación.
   */
  @ApiProperty()
  value!: string;

  /**
   * Idioma de la denominación, cuando el catálogo lo declara.
   */
  @ApiPropertyOptional({ enum: ['ES', 'EN'], example: 'ES' })
  language?: string;

  /**
   * Si es la denominación preferida de su idioma.
   */
  @ApiPropertyOptional()
  preferred?: boolean;
}

/**
 * La ficha completa de un término, tal como la lee el glosario.
 *
 * Existe porque `$lookup` —la única lectura que devolvía designaciones— exige
 * conocer la URL canónica del sistema de codificación **y** el código, y un
 * cliente que llegó a un término desde un listado sólo tiene su `conceptId`.
 * Resolver el sistema a partir de la versión para poder volver a preguntar
 * serían tres llamadas para abrir una ficha.
 */
export class ConceptDetailDto {
  /**
   * Id del concepto.
   */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /**
   * Código dentro de su sistema.
   */
  @ApiProperty({ example: 'I10' })
  code!: string;

  /**
   * Denominación, en el idioma pedido si la hay.
   */
  @ApiProperty()
  display!: string;

  /**
   * Definición, en el idioma pedido si la hay.
   */
  @ApiPropertyOptional()
  definition?: string;

  /**
   * Si el concepto puede seleccionarse.
   */
  @ApiPropertyOptional()
  selectable?: boolean;

  /**
   * Versión del sistema de códigos a la que pertenece.
   */
  @ApiProperty({ format: 'uuid' })
  codeSystemVersionId!: string;

  /**
   * Si los textos vienen en el idioma pedido; ver {@link ConceptSearchItemDto.translated}.
   */
  @ApiPropertyOptional()
  translated?: boolean;

  /**
   * Categorías a las que pertenece el término.
   */
  @ApiProperty({ type: () => [ConceptValueSetRefDto] })
  valueSets!: ConceptValueSetRefDto[];

  /**
   * Otras formas de nombrar lo mismo.
   *
   * Se excluye la designación que ya se está mostrando como `display`: repetirla
   * bajo el título «también se le dice» no informa de nada.
   */
  @ApiProperty({ type: () => [ConceptSynonymDto] })
  synonyms!: ConceptSynonymDto[];
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
