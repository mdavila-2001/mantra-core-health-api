import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Un código externo que la sincronización no pudo traducir. */
export class UnmappedExternalProductDto {
  /**
   * Código del producto en el sistema externo.
   */
  @ApiProperty()
  externalCode!: string;

  /**
   * Nombre que le da el catálogo externo.
   */
  @ApiProperty()
  name!: string;
}

/** Resultado de `POST …/integration-connections/:connectionId/sync`. */
export class IntegrationSyncResponseDto {
  /**
   * Lote de sincronización que dejó la corrida.
   */
  @ApiProperty({ format: 'uuid' })
  batchId!: string;

  /**
   * Líneas de stock recibidas del sistema externo (todas las sedes).
   */
  @ApiProperty()
  received!: number;

  /**
   * Líneas traducidas a un producto de la farmacia.
   */
  @ApiProperty()
  mapped!: number;

  /**
   * Códigos externos sin un vínculo único, una vez cada uno.
   */
  @ApiProperty({ type: [UnmappedExternalProductDto] })
  unmapped!: UnmappedExternalProductDto[];

  /**
   * Posiciones de stock que cambiaron (las iguales no cuentan).
   */
  @ApiProperty()
  applied!: number;
}

/** Una conexión de integración de la farmacia, legible. */
export class IntegrationConnectionDto {
  /**
   * Identificador de la conexión.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Sede a la que se acota; `null` = todas las sedes activas.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  pharmacySiteId!: string | null;

  /**
   * Nombre de esa sede.
   */
  @ApiPropertyOptional({ nullable: true })
  siteName!: string | null;

  /**
   * `BATCH` o `REALTIME`.
   */
  @ApiProperty({ enum: ['BATCH', 'REALTIME'] })
  integrationMode!: 'BATCH' | 'REALTIME';

  /**
   * Si la conexión admite consultar stock.
   */
  @ApiProperty()
  supportsStockQuery!: boolean;

  /**
   * `ACTIVE` o `INACTIVE`.
   */
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status!: 'ACTIVE' | 'INACTIVE';

  /**
   * Si la API sabe dónde está el sistema externo.
   */
  @ApiProperty()
  providerConfigured!: boolean;

  /**
   * Alta de la conexión.
   */
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/** Lista de conexiones de la farmacia. */
export class IntegrationConnectionListDto {
  /**
   * Conexiones, de la más nueva a la más vieja.
   */
  @ApiProperty({ type: [IntegrationConnectionDto] })
  items!: IntegrationConnectionDto[];

  /**
   * Si la API sabe dónde está el sistema externo.
   */
  @ApiProperty()
  providerConfigured!: boolean;
}

/** Un vínculo código externo ↔ producto. */
export class IntegrationMappingDto {
  /**
   * Identificador del vínculo.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código del producto en el sistema externo.
   */
  @ApiProperty()
  externalProductCode!: string;

  /**
   * Producto de la farmacia.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  /**
   * Código del producto en la farmacia.
   */
  @ApiPropertyOptional({ nullable: true })
  productCode!: string | null;

  /**
   * Nombre del producto en la farmacia.
   */
  @ApiPropertyOptional({ nullable: true })
  productName!: string | null;

  /**
   * Alta del vínculo.
   */
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/** Vínculos de una conexión. */
export class IntegrationMappingListDto {
  /**
   * Vínculos, por código externo.
   */
  @ApiProperty({ type: [IntegrationMappingDto] })
  items!: IntegrationMappingDto[];
}

/** Un producto del catálogo externo, con su vínculo si tiene uno único. */
export class ExternalCatalogProductDto {
  /**
   * Código del producto en el sistema externo.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre en el sistema externo.
   */
  @ApiProperty()
  name!: string;

  /**
   * Presentación en el sistema externo.
   */
  @ApiPropertyOptional({ nullable: true })
  presentation!: string | null;

  /**
   * Unidad en el sistema externo.
   */
  @ApiPropertyOptional({ nullable: true })
  unitCode!: string | null;

  /**
   * Producto de la farmacia vinculado; `null` si no tiene o es ambiguo.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  mappedProductId!: string | null;
}

/** Catálogo del sistema externo. */
export class ExternalCatalogListDto {
  /**
   * Productos del sistema externo.
   */
  @ApiProperty({ type: [ExternalCatalogProductDto] })
  items!: ExternalCatalogProductDto[];
}

/** Un lote de sincronización de la conexión. */
export class IntegrationSyncBatchDto {
  /**
   * Identificador del lote.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * `RECEIVED` o `COMPLETED`.
   */
  @ApiProperty({ enum: ['RECEIVED', 'COMPLETED'] })
  status!: 'RECEIVED' | 'COMPLETED';

  /**
   * Cuándo se recibió.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  receivedAt!: string | null;

  /**
   * Cuándo se concilió.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  completedAt!: string | null;

  /**
   * Ítems del lote.
   */
  @ApiProperty()
  itemCount!: number;

  /**
   * Ítems sin producto (códigos sin vínculo).
   */
  @ApiProperty()
  discrepancies!: number;
}

/** Últimos lotes de la conexión. */
export class IntegrationSyncBatchListDto {
  /**
   * Lotes, del más nuevo al más viejo.
   */
  @ApiProperty({ type: [IntegrationSyncBatchDto] })
  items!: IntegrationSyncBatchDto[];
}
