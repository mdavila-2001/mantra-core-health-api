import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuestas de la cara de lectura del módulo 25 (carril E2): stock por sede y
 * disponibilidad multi-sede. Igual que el directorio de farmacias, todo viaja
 * legible: conceptos resueltos a `{code, display}`, nombres y presentaciones
 * junto a cada id, y cantidades como números — quien consume esto decide dónde
 * comprar, no audita un ledger.
 */

/** Un concepto ya resuelto a su forma legible. */
export class InventoryConceptDto {
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

/** El stock de un producto en una sede, agregado sobre sus ubicaciones. */
export class SiteStockItemDto {
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
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  medication!: InventoryConceptDto | null;

  /**
   * Existencia física total en la sede.
   */
  @ApiProperty()
  onHandQuantity!: number;

  /**
   * Reservado para dispensaciones en curso.
   */
  @ApiProperty()
  reservedQuantity!: number;

  /**
   * Lo realmente vendible: la columna `available` que mantiene el ledger, que
   * ya descuenta reservas y cuarentenas — el detalle de cuarentena es estado
   * interno y no se sirve.
   */
  @ApiProperty()
  availableQuantity!: number;

  /**
   * En cuántas ubicaciones de la sede hay posición de este producto.
   */
  @ApiProperty()
  locationCount!: number;
}

/** El stock disponible de una sede, producto por producto. */
export class SiteStockResponseDto {
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
  @ApiProperty({ type: [SiteStockItemDto] })
  items!: SiteStockItemDto[];

  /**
   * Cantidad de productos servidos.
   */
  @ApiProperty()
  count!: number;
}

/** El precio vigente con que una sede ofrece un producto disponible. */
export class AvailabilityPriceDto {
  /**
   * Precio unitario, como texto exacto (numeric de BD).
   */
  @ApiProperty()
  unitAmount!: string;

  /**
   * Lo que paga el paciente, si la lista lo distingue.
   */
  @ApiPropertyOptional({ nullable: true })
  patientAmount!: string | null;

  /**
   * Moneda de la lista, resuelta.
   */
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  currency!: InventoryConceptDto | null;

  /**
   * Código de la lista que publica el precio.
   */
  @ApiProperty()
  priceListCode!: string;
}

/** Un producto solicitado, tal como una sede lo puede servir. */
export class AvailabilityProductDto {
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
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  medication!: InventoryConceptDto | null;

  /**
   * Disponible en la sede (suma de sus ubicaciones).
   */
  @ApiProperty()
  availableQuantity!: number;

  /**
   * Precio público vigente en esa sede, si hay uno publicado.
   */
  @ApiPropertyOptional({ type: AvailabilityPriceDto, nullable: true })
  price!: AvailabilityPriceDto | null;
}

/** Una sede candidata para surtir el pedido, con su cobertura y su costo. */
export class AvailabilitySiteDto {
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
   * Latitud WGS84 de la sede, si su dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  /**
   * Longitud WGS84 de la sede, si su dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  /**
   * Distancia Haversine en km al punto consultado, con un decimal. null si la
   * consulta no trajo `lat`/`lng` o la sede no tiene coordenadas.
   */
  @ApiPropertyOptional({ nullable: true })
  distanceKm!: number | null;

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

  /**
   * true si la sede tiene disponible TODO lo solicitado.
   */
  @ApiProperty()
  complete!: boolean;

  /**
   * Cuántos de los productos solicitados tiene disponibles.
   */
  @ApiProperty()
  availableCount!: number;

  /**
   * Los solicitados que esta sede NO tiene disponibles.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  missingProductIds!: string[];

  /**
   * Suma de los precios vigentes (lo que paga el paciente) de los productos
   * disponibles. null si a alguno le falta precio publicado o si las listas
   * mezclan monedas: una suma que mezcla monedas o esconde huecos miente.
   */
  @ApiPropertyOptional({ nullable: true })
  totalAmount!: string | null;

  /**
   * Moneda del total, cuando todos los precios comparten una.
   */
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  currency!: InventoryConceptDto | null;

  /**
   * El detalle por producto solicitado que la sede tiene disponible.
   */
  @ApiProperty({ type: [AvailabilityProductDto] })
  products!: AvailabilityProductDto[];
}

/** La respuesta de disponibilidad: sedes candidatas, ya ordenadas. */
export class AvailabilityResponseDto {
  /**
   * Los productos consultados, tal como llegaron (deduplicados).
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  requestedProductIds!: string[];

  /**
   * Sedes con al menos un solicitado disponible. Orden: completas primero;
   * después por distancia ascendente (si la consulta trajo coordenadas; sin
   * coordenadas van al final); después por total ascendente (sin total al
   * final); después por nombre.
   */
  @ApiProperty({ type: [AvailabilitySiteDto] })
  items!: AvailabilitySiteDto[];

  /**
   * Cantidad de sedes servidas.
   */
  @ApiProperty()
  count!: number;
}
