import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un conjunto de valores en el listado, con su versión vigente ya resuelta.
 *
 * Trae `defaultVersionId` porque el consumidor típico encadena esta llamada con
 * `GET /terminology/value-sets/:id/$expand`: sin la versión tendría que pedirla
 * aparte para saber qué está leyendo.
 */
export class ValueSetListItemDto {
  /**
   * Identificador del conjunto de valores.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código interno estable. Es la clave por la que se busca sin conocer el uuid.
   */
  @ApiProperty({ example: 'administrative-gender' })
  internalCode!: string;

  /**
   * Nombre legible.
   */
  @ApiProperty()
  name!: string;

  /**
   * URL canónica FHIR del conjunto.
   */
  @ApiProperty()
  canonicalUrl!: string;

  /**
   * Descripción de qué agrupa.
   */
  @ApiPropertyOptional()
  description?: string;

  /**
   * Estado del conjunto en el ciclo de vida de terminología.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  stateConceptId?: string;

  /**
   * Versión marcada por defecto, o `null` si todavía no hay ninguna.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  defaultVersionId!: string | null;
}

/** Página del listado de conjuntos de valores. */
export class SearchValueSetsResponseDto {
  /**
   * Conjuntos de esta página, ordenados por código interno.
   */
  @ApiProperty({ type: [ValueSetListItemDto] })
  items!: ValueSetListItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Cursor opaco de continuación, o `null` si ésta es la última página.
   */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}
