import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Resultado genérico de una operación de estado (verify, close, retire). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Respuesta tras crear una farmacia con su licencia inicial (UC-24-01). */
export class PharmacyResponseDto {
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
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty()
  legalName!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Identificador asociado a license.
   */
  @ApiProperty({
    description: 'Id de la licencia inicial creada',
    format: 'uuid',
  })
  licenseId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras registrar una sede (UC-24-02). */
export class SiteResponseDto {
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
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras publicar un producto (UC-24-04). */
export class ProductResponseDto {
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
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de identifier count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de identificadores registrados' })
  identifierCount!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras crear una lista de precios (UC-24-05). */
export class PriceListResponseDto {
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
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de price list type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del tipo', format: 'uuid' })
  priceListType!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras versionar un precio (UC-24-06). */
export class PriceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pharmacy price list.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyPriceListId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de versión de este precio' })
  versionNumber!: number;

  /**
   * Valor de unit amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe unitario' })
  unitAmount!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;
}

/** Respuesta tras establecer una conexión de integración (UC-24-07). */
export class ConnectionResponseDto {
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
   * Identificador asociado a connection.
   */
  @ApiProperty({ format: 'uuid' })
  connectionId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras mapear un producto externo (UC-24-08). */
export class MappingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pharmacy integration connection.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyIntegrationConnectionId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  /**
   * Valor de external product code mantenido por la instancia.
   */
  @ApiProperty()
  externalProductCode!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Precio efectivo de un producto en la proyección de catálogo (UC-24-11). */
export class CatalogPriceDto {
  /**
   * Identificador asociado a price list.
   */
  @ApiProperty({ format: 'uuid' })
  priceListId!: string;

  /**
   * Valor de unit amount mantenido por la instancia.
   */
  @ApiProperty()
  unitAmount!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;
}

/** Entrada de catálogo proyectada (UC-24-11). */
export class CatalogEntryDto {
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
  @ApiPropertyOptional()
  brandName?: string;

  /**
   * Valor de prices mantenido por la instancia.
   */
  @ApiProperty({ type: [CatalogPriceDto] })
  prices!: CatalogPriceDto[];
}

/** Proyección de catálogo y precios a read-model (UC-24-11). */
export class CatalogProjectionDto {
  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Valor de product count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de productos activos proyectados' })
  productCount!: number;

  /**
   * Valor de entries mantenido por la instancia.
   */
  @ApiProperty({ type: [CatalogEntryDto] })
  entries!: CatalogEntryDto[];

  /**
   * Valor de projected at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  projectedAt!: Date;
}
