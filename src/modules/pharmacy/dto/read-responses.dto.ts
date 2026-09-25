import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuestas de la cara de lectura del módulo (carril E2: lecturas de
 * farmacia). A diferencia de las respuestas administrativas, acá los
 * `*_concept_id` no viajan crudos: cada concepto se resuelve a `{code,
 * display}` y las sedes llevan su dirección en texto — quien consume el
 * directorio no tiene catálogo con qué resolver un uuid.
 */

/** Un concepto ya resuelto a su forma legible. */
export class PharmacyConceptDto {
  /**
   * Código canónico del concepto.
   */
  @ApiProperty()
  code!: string;

  /**
   * Etiqueta legible del concepto.
   */
  @ApiProperty()
  display!: string;
}

/** Una sede dispensadora, con su dirección resuelta. */
export class PharmacySiteReadDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Dirección en una línea, o null si la sede no la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  addressText!: string | null;

  /**
   * Latitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  /**
   * Longitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  /**
   * Modo de dispensación, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  dispensingMode!: PharmacyConceptDto | null;

  /**
   * Valor de home delivery available mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * Valor de pickup available mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;
}

/** Una farmacia del directorio, con sus números de resumen. */
export class PharmacyDirectoryItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre para mostrar: el comercial si existe, si no la razón social.
   */
  @ApiProperty()
  name!: string;

  /**
   * Razón social registrada.
   */
  @ApiProperty()
  legalName!: string;

  /**
   * Tipo de farmacia, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  type!: PharmacyConceptDto | null;

  /**
   * Sedes activas de la farmacia.
   */
  @ApiProperty()
  siteCount!: number;

  /**
   * Productos activos publicados en su catálogo.
   */
  @ApiProperty()
  productCount!: number;

  /**
   * true si alguna sede ofrece entrega a domicilio.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * true si alguna sede ofrece retiro en mostrador.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;
}

/** El directorio de farmacias publicadas del tenant activo. */
export class PharmacyDirectoryResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacyDirectoryItemDto] })
  items!: PharmacyDirectoryItemDto[];

  /**
   * Cantidad de farmacias servidas.
   */
  @ApiProperty()
  count!: number;
}

/** El perfil de una farmacia: su ficha y sus sedes con dirección. */
export class PharmacyDetailDto extends PharmacyDirectoryItemDto {
  /**
   * Valor de sites mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySiteReadDto] })
  sites!: PharmacySiteReadDto[];
}

/** Un producto del catálogo, con su medicamento del vademécum resuelto. */
export class PharmacyProductReadDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia dueña del catálogo.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  genericName!: string | null;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  packageSizeText!: string | null;

  /**
   * Forma farmacéutica, resuelta.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  dosageForm!: PharmacyConceptDto | null;

  /**
   * Medicamento del vademécum (`medication_concept_id`), resuelto a su código
   * ATC y su nombre. null cuando el producto no está amarrado al vademécum.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  medication!: PharmacyConceptDto | null;

  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  requiresPrescription!: boolean | null;
}

/** Resultado de la búsqueda de productos, acotado y con el recorte declarado. */
export class PharmacyProductSearchResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacyProductReadDto] })
  items!: PharmacyProductReadDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron productos fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/** Un precio vigente de un producto en una sede. */
export class PharmacySitePriceDto {
  /**
   * Identificador asociado a product.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  genericName!: string | null;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  packageSizeText!: string | null;

  /**
   * Medicamento del vademécum, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  medication!: PharmacyConceptDto | null;

  /**
   * Si el producto exige receta médica para despacharse.
   */
  @ApiPropertyOptional({ nullable: true })
  requiresPrescription!: boolean | null;

  /**
   * Identificador asociado a price list.
   */
  @ApiProperty({ format: 'uuid' })
  priceListId!: string;

  /**
   * Código de la lista que publica el precio.
   */
  @ApiProperty()
  priceListCode!: string;

  /**
   * Moneda de la lista, resuelta.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  currency!: PharmacyConceptDto | null;

  /**
   * Precio unitario, como texto exacto (numeric de BD).
   */
  @ApiProperty()
  unitAmount!: string;

  /**
   * Impuesto, si la lista lo desglosa.
   */
  @ApiPropertyOptional({ nullable: true })
  taxAmount!: string | null;

  /**
   * Lo que paga el paciente, si difiere del unitario.
   */
  @ApiPropertyOptional({ nullable: true })
  patientAmount!: string | null;

  /**
   * Cantidad mínima de compra, si la lista la exige.
   */
  @ApiPropertyOptional({ nullable: true })
  minimumQuantity!: string | null;

  /**
   * Desde cuándo rige este precio.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;

  /**
   * Hasta cuándo rige, si la versión declara fin.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo!: Date | null;
}

/** Los precios públicos vigentes de una sede. */
export class PharmacySitePricesResponseDto {
  /**
   * Identificador asociado a site.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySitePriceDto] })
  items!: PharmacySitePriceDto[];

  /**
   * Cantidad de precios servidos.
   */
  @ApiProperty()
  count!: number;
}

/**
 * Una sede publicada, suelta, tal como la lista `GET /pharmacy/sites`
 * (carril A, H4). Campos idénticos a `PharmacySite` del front, para que el
 * front pueda dejar de simularla sin renombrar nada.
 */
export class PharmacySiteListItemDto {
  /**
   * Identificador asociado a site.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Dirección en una línea, o null si la sede no la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  addressText!: string | null;

  /**
   * Latitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  /**
   * Longitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  /**
   * Distancia Haversine en km al origen consultado, con un decimal. `null`
   * sin origen o sin coordenadas.
   */
  @ApiPropertyOptional({ nullable: true })
  distanceKm!: number | null;

  /**
   * true si la sede ofrece entrega a domicilio.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * true si la sede ofrece retiro en mostrador.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;

  /**
   * Productos activos publicados por la farmacia dueña de esta sede.
   */
  @ApiProperty()
  productCount!: number;
}

/** Las sedes publicadas del tenant activo, sueltas. */
export class PharmacySiteListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySiteListItemDto] })
  items!: PharmacySiteListItemDto[];

  /**
   * Cantidad de sedes servidas.
   */
  @ApiProperty()
  count!: number;
}
