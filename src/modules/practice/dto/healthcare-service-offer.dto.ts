import { ApiProperty } from '@nestjs/swagger';

/** Unidades en que el nomenclador expresa el precio de referencia. */
export const REFERENCE_UNITS = ['UMA', 'USD'] as const;

/** Un procedimiento que una sede ofrece, con su precio y su referencia. */
export class HealthcareServiceOfferDto {
  /**
   * Identificador del servicio ofrecido.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Sede que lo ofrece.
   */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  /**
   * Concepto del nomenclador.
   */
  @ApiProperty({ format: 'uuid' }) serviceConceptId!: string;
  /**
   * Nombre del procedimiento para mostrar.
   */
  @ApiProperty() serviceDisplay!: string;
  /**
   * Ítem del catálogo de precios que lo respalda; `null` si no tiene.
   */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  serviceCatalogId!: string | null;
  /**
   * Precio propio de la sede; `null` si no tiene ítem de catálogo.
   */
  @ApiProperty({ nullable: true, type: Number }) price!: number | null;
  /**
   * Moneda del precio propio; `null` si no tiene.
   */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  currencyConceptId!: string | null;
  /**
   * Precio de referencia del nomenclador.
   */
  @ApiProperty({ nullable: true, type: Number }) referencePrice!: number | null;
  /**
   * Unidad del precio de referencia.
   */
  @ApiProperty({ enum: REFERENCE_UNITS, nullable: true, type: String })
  referenceUnit!: (typeof REFERENCE_UNITS)[number] | null;
  /**
   * Aviso de sobreprecio. Siempre `null` mientras no se fije el margen (A-1/A-2).
   */
  @ApiProperty({ nullable: true, type: Boolean })
  overMargin!: boolean | null;
  /**
   * Si la búsqueda del paciente puede mostrarlo: activo y con precio.
   */
  @ApiProperty() visibleInSearch!: boolean;
  /**
   * Si la sede lo ofrece hoy.
   */
  @ApiProperty() active!: boolean;
}

/** Respuesta de `GET /practices/{practiceId}/healthcare-services`. */
export class HealthcareServiceOffersResponseDto {
  /**
   * Procedimientos ofrecidos, en el orden de publicación.
   */
  @ApiProperty({ type: () => [HealthcareServiceOfferDto] })
  items!: HealthcareServiceOfferDto[];
}
