import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GLOSSARY_RELATION_TYPES,
  type GlossaryRelationType,
} from '../glossary.constants';

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

  /* Los seis campos que siguen sólo se informan cuando el resultado está
     acotado al glosario médico —esto es, `valueSetId` referencia el value set
     paraguas, una categoría o una etiqueta (`glossary-*`)—. Fuera de ese caso
     la respuesta es exactamente la histórica: ningún otro consumidor de esta
     búsqueda (agenda, perfil profesional, diagnósticos, ficha clínica) paga
     el costo de estas consultas extra ni ve un campo de más. */

  /** Slug kebab-case del término, único en el glosario. */
  @ApiPropertyOptional({ example: 'hipertension-arterial' })
  slug?: string;

  /** Categoría del término, o `null` si —siendo del glosario— no tiene ninguna asignada. */
  @ApiPropertyOptional({ type: () => ConceptTaxonomyRefDto, nullable: true })
  category?: ConceptTaxonomyRefDto | null;

  /** Resumen en lenguaje llano, para la columna «definición corta» de la tabla. */
  @ApiPropertyOptional()
  shortDefinition?: string;

  /** Nombres de las etiquetas del término (la categoría no se repite acá). */
  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  /** Cuántas relaciones tipadas tiene el término; la lista completa vive en la ficha. */
  @ApiPropertyOptional()
  relationsCount?: number;

  /** Estado publicado del término (`active`, hoy el único que puede llegar al glosario público). */
  @ApiPropertyOptional({ example: 'active' })
  status?: string;
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

/**
 * Referencia liviana a una categoría del glosario, tal como aparece en la fila
 * de la búsqueda (`ConceptSearchItemDto.category`). Sin `valueSetId`: la
 * búsqueda ya no necesita el uuid del conjunto para pintar la tabla — quien sí
 * lo necesita (para armar el enlace a la categoría) usa la ficha
 * (`ConceptDetailDto.category`, que sí lo trae).
 */
export class ConceptTaxonomyRefDto {
  /** Código interno estable, como `glossary-category-anatomy`. */
  @ApiProperty({ example: 'glossary-category-anatomy' })
  internalCode!: string;

  /** Nombre legible de la categoría. */
  @ApiProperty({ example: 'Anatomía' })
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
 * Referencia a una categoría o etiqueta con su uuid, tal como aparece en la
 * ficha del término (`ConceptDetailDto.category`/`.tags`). A diferencia de
 * {@link ConceptTaxonomyRefDto} sí trae `valueSetId`: la ficha es la lectura
 * que arma enlaces hacia «ver toda la categoría», y para eso necesita el uuid.
 */
export class ConceptCategoryRefDto {
  /** Identificador del value set. */
  @ApiProperty({ format: 'uuid' })
  valueSetId!: string;

  /** Código interno estable. */
  @ApiProperty({ example: 'glossary-category-anatomy' })
  internalCode!: string;

  /** Nombre legible. */
  @ApiProperty({ example: 'Anatomía' })
  name!: string;
}

/**
 * Un texto del glosario en el idioma pedido, con si vino efectivamente
 * traducido o cayó a castellano por no haber traducción cargada.
 */
export class ConceptTextDto {
  /** El texto, en el idioma pedido o su respaldo en castellano. */
  @ApiProperty()
  text!: string;

  /**
   * Si `text` vino en el idioma pedido. En `false`, es el texto en castellano
   * —siempre presente, es obligatorio en el catálogo curado— porque no hay
   * traducción cargada para ese idioma.
   */
  @ApiProperty()
  translated!: boolean;
}

/** Una relación tipada del glosario, con el término destino ya resuelto. */
export class ConceptRelationDto {
  /** Tipo de relación. */
  @ApiProperty({ enum: GLOSSARY_RELATION_TYPES })
  type!: GlossaryRelationType;

  /** Id del concepto destino. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Slug del término destino. */
  @ApiProperty()
  slug!: string;

  /** Denominación del término destino (EN, `CatalogConcepts.display`). */
  @ApiProperty()
  display!: string;
}

/**
 * Imagen ilustrativa de un término. El tipo existe para que el contrato pueda
 * cargarla en el futuro; hoy ningún término del catálogo curado la trae (no
 * hay política de licencia/origen para imágenes médicas externas en este
 * repositorio — ver `glossary.constants.ts`).
 */
export class ConceptImageDto {
  /** URL o referencia del activo. */
  @ApiProperty()
  source!: string;

  /** Licencia bajo la que se usa la imagen. */
  @ApiProperty()
  license!: string;

  /** A quién atribuir la imagen. */
  @ApiProperty()
  attribution!: string;

  /** Texto alternativo, para accesibilidad. */
  @ApiProperty()
  alt!: string;

  /** Estado de revisión de la imagen. */
  @ApiProperty({ enum: ['approved', 'pending', 'rejected'] })
  status!: 'approved' | 'pending' | 'rejected';
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

  /* Los siete campos que siguen son la extensión del glosario médico (Carril
     03). Se resuelven siempre —ésta es una lectura de una sola fila, no una
     lista, así que el costo de las consultas extra es despreciable— y son
     `undefined`/`null`/`[]` para cualquiera de los ~1.310 conceptos que no
     forman parte del glosario: ausencia de dato, no un campo que cambie de
     forma según quién pregunte. */

  /** Slug del término, si es un término del glosario. */
  @ApiPropertyOptional({ example: 'hipertension-arterial' })
  slug?: string;

  /** Definición clínica, si el término la tiene cargada. */
  @ApiPropertyOptional({ type: () => ConceptTextDto })
  clinicalDefinition?: ConceptTextDto;

  /** Resumen en lenguaje llano, si el término lo tiene cargado. */
  @ApiPropertyOptional({ type: () => ConceptTextDto })
  plainSummary?: ConceptTextDto;

  /** Categoría del glosario a la que pertenece, o `null` si no pertenece a ninguna. */
  @ApiProperty({ type: () => ConceptCategoryRefDto, nullable: true })
  category!: ConceptCategoryRefDto | null;

  /** Etiquetas del glosario (la categoría no se repite acá). */
  @ApiProperty({ type: () => [ConceptCategoryRefDto] })
  tags!: ConceptCategoryRefDto[];

  /** Relaciones tipadas salientes, con el término destino ya resuelto. */
  @ApiProperty({ type: () => [ConceptRelationDto] })
  relations!: ConceptRelationDto[];

  /**
   * Imagen ilustrativa. Siempre ausente hoy (ver {@link ConceptImageDto}); el
   * campo existe para que un carril futuro pueda adjuntar una sin romper el
   * contrato.
   */
  @ApiPropertyOptional({ type: () => ConceptImageDto })
  image?: ConceptImageDto;
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
