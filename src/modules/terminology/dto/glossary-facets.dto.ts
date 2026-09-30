import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una etiqueta del glosario con cuántos términos publicados la llevan. */
export class GlossaryFacetTagDto {
  /** Identificador del conjunto de valores de la etiqueta. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código interno estable, como `glossary-tag-cardiovascular`. */
  @ApiProperty({ example: 'glossary-tag-cardiovascular' })
  internalCode!: string;

  /** Nombre legible. */
  @ApiProperty({ example: 'Cardiovascular' })
  name!: string;

  /** Términos publicados que la llevan (en la categoría, dentro de una categoría). */
  @ApiProperty()
  count!: number;
}

/** Una categoría del glosario con su conteo y las etiquetas que aparecen adentro. */
export class GlossaryFacetCategoryDto {
  /** Identificador del conjunto de valores de la categoría. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código interno estable, como `glossary-category-pharmacology`. */
  @ApiProperty({ example: 'glossary-category-pharmacology' })
  internalCode!: string;

  /** Nombre legible. */
  @ApiProperty({ example: 'Farmacología clínica' })
  name!: string;

  /** Qué agrupa, si el catálogo lo declara. */
  @ApiPropertyOptional()
  description?: string;

  /** Términos publicados de la categoría. */
  @ApiProperty()
  count!: number;

  /** Etiquetas que llevan sus términos, de la más frecuente a la menos. */
  @ApiProperty({ type: () => [GlossaryFacetTagDto] })
  tags!: GlossaryFacetTagDto[];
}

/**
 * Las facetas del glosario: lo que pinta la rejilla de categorías sin traer un
 * solo término. Sale de una consulta agregada, no de recorrer el corpus.
 */
export class GlossaryFacetsResponseDto {
  /** Las categorías con al menos un término publicado. */
  @ApiProperty({ type: () => [GlossaryFacetCategoryDto] })
  categories!: GlossaryFacetCategoryDto[];

  /** Las etiquetas con al menos un término publicado, en todo el glosario. */
  @ApiProperty({ type: () => [GlossaryFacetTagDto] })
  tags!: GlossaryFacetTagDto[];

  /** Términos publicados en todo el glosario (miembros del paraguas). */
  @ApiProperty()
  total!: number;
}
