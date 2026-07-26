import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Resultado genérico de una operación de estado (verify, close, retire). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Respuesta tras crear una farmacia con su licencia inicial (UC-24-01). */
export class PharmacyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  legalName!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Concept id del estado de verificación', format: 'uuid' })
  verificationStatus!: string;

  @ApiProperty({ description: 'Id de la licencia inicial creada', format: 'uuid' })
  licenseId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras registrar una sede (UC-24-02). */
export class SiteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras publicar un producto (UC-24-04). */
export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty()
  productCode!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Nº de identificadores registrados' })
  identifierCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras crear una lista de precios (UC-24-05). */
export class PriceListResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ description: 'Concept id del tipo', format: 'uuid' })
  priceListType!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras versionar un precio (UC-24-06). */
export class PriceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyPriceListId!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  @ApiProperty({ description: 'Nº de versión de este precio' })
  versionNumber!: number;

  @ApiProperty({ description: 'Importe unitario' })
  unitAmount!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;
}

/** Respuesta tras establecer una conexión de integración (UC-24-07). */
export class ConnectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty({ format: 'uuid' })
  connectionId!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta tras mapear un producto externo (UC-24-08). */
export class MappingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyIntegrationConnectionId!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  @ApiProperty()
  externalProductCode!: string;

  @ApiProperty({ description: 'Concept id del estado de verificación', format: 'uuid' })
  verificationStatus!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Precio efectivo de un producto en la proyección de catálogo (UC-24-11). */
export class CatalogPriceDto {
  @ApiProperty({ format: 'uuid' })
  priceListId!: string;

  @ApiProperty()
  unitAmount!: string;

  @ApiProperty()
  versionNumber!: number;
}

/** Entrada de catálogo proyectada (UC-24-11). */
export class CatalogEntryDto {
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty()
  productCode!: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiProperty({ type: [CatalogPriceDto] })
  prices!: CatalogPriceDto[];
}

/** Proyección de catálogo y precios a read-model (UC-24-11). */
export class CatalogProjectionDto {
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty({ description: 'Nº de productos activos proyectados' })
  productCount!: number;

  @ApiProperty({ type: [CatalogEntryDto] })
  entries!: CatalogEntryDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  projectedAt!: Date;
}
