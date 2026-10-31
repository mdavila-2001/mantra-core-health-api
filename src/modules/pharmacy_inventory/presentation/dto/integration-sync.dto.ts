import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Por qué un código externo no se tradujo. */
export const UNMAPPED_REASONS = ['NO_MAPPING', 'AMBIGUOUS_MAPPING'] as const;

/**
 * Por qué una línea con vínculo no se aplicó al stock de la sede. La línea
 * queda en el lote como rastro; la sede conserva lo que tenía.
 */
export const SYNC_SKIP_REASONS = [
  'PRODUCT_NOT_AVAILABLE',
  'PRODUCT_NOT_PUBLISHED',
  'PRODUCT_OUT_OF_STOCK_DECLARED',
  'SITE_PRODUCT_KEPT_BY_LOTS',
  'SITE_MARKED_NOT_AVAILABLE',
  'UNIT_MISMATCH',
  'UNIT_NOT_REPORTED',
] as const;

/** Motivo de una línea no aplicada (ver {@link SYNC_SKIP_REASONS}). */
export type SyncSkipReason = (typeof SYNC_SKIP_REASONS)[number];

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

  /**
   * `NO_MAPPING`: ningún vínculo lo nombra (se vincula). `AMBIGUOUS_MAPPING`:
   * lo nombran vínculos a más de un producto (se deshacen los que sobran).
   */
  @ApiProperty({ enum: UNMAPPED_REASONS })
  reason!: (typeof UNMAPPED_REASONS)[number];

  /**
   * Productos que se disputan el código; vacío con `NO_MAPPING`.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  productIds!: string[];
}

/** Cuentas de una sede en la corrida: cuadran entre sí. */
export class IntegrationSyncSiteDto {
  /**
   * Sede de la farmacia.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Código de la sede (el que se le pidió al sistema externo).
   */
  @ApiProperty()
  siteCode!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Líneas recibidas para esta sede: `mapped + unmapped`.
   */
  @ApiProperty()
  received!: number;

  /**
   * Líneas con vínculo único: `applied + unchanged + skipped`.
   */
  @ApiProperty()
  mapped!: number;

  /**
   * Líneas sin vínculo único.
   */
  @ApiProperty()
  unmapped!: number;

  /**
   * Líneas que cambiaron el stock de la sede.
   */
  @ApiProperty()
  applied!: number;

  /**
   * Líneas escritas que no cambiaron nada (el stock ya era ese).
   */
  @ApiProperty()
  unchanged!: number;

  /**
   * Líneas con vínculo que no se aplicaron (detalle en `skipped`).
   */
  @ApiProperty()
  skipped!: number;
}

/** Una línea con vínculo que no se aplicó, y por qué. */
export class IntegrationSyncSkippedDto {
  /**
   * Sede de la línea.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Código de esa sede.
   */
  @ApiProperty()
  siteCode!: string;

  /**
   * Código del producto en el sistema externo.
   */
  @ApiProperty()
  externalCode!: string;

  /**
   * Producto vinculado.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  /**
   * Cantidad que informó el sistema externo (no se asentó).
   */
  @ApiProperty()
  quantity!: number;

  /**
   * - `PRODUCT_NOT_AVAILABLE`: el producto ya no es de la farmacia.
   * - `PRODUCT_NOT_PUBLISHED`: es un borrador o está retirado.
   * - `PRODUCT_OUT_OF_STOCK_DECLARED`: el catálogo lo marca sin stock.
   * - `SITE_PRODUCT_KEPT_BY_LOTS`: la sede lo lleva por lotes.
   * - `SITE_MARKED_NOT_AVAILABLE`: la sede marcó «No lo tengo» a mano y la
   *   sincronización no lo pisa; se cambia desde la sede.
   * - `UNIT_MISMATCH`: el sistema externo cuenta en otra unidad que la del
   *   vínculo; no se convierte.
   * - `UNIT_NOT_REPORTED`: el vínculo declara unidad y el sistema externo no
   *   dice en cuál cuenta.
   */
  @ApiProperty({ enum: SYNC_SKIP_REASONS })
  reason!: SyncSkipReason;

  /**
   * Unidad que declara el vínculo (solo con los motivos de unidad).
   */
  @ApiPropertyOptional({ nullable: true })
  mappingUnitCode?: string | null;

  /**
   * Unidad que informa el sistema externo (solo con los motivos de unidad).
   */
  @ApiPropertyOptional({ nullable: true })
  externalUnitCode?: string | null;
}

/** Un código vinculado que el sistema externo no mandó para una sede. */
export class IntegrationSyncNotSentDto {
  /**
   * Sede para la que no vino.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Código de esa sede.
   */
  @ApiProperty()
  siteCode!: string;

  /**
   * Código del producto en el sistema externo.
   */
  @ApiProperty()
  externalCode!: string;

  /**
   * Producto vinculado: conserva lo último que se asentó.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;
}

/**
 * Resultado de `POST …/integration-connections/:connectionId/sync`.
 *
 * Las líneas son código × sede: con dos sedes, un producto cuenta dos veces.
 * `received = mapped + unmappedLines` y, por sede, ver
 * {@link IntegrationSyncSiteDto}.
 */
export class IntegrationSyncResponseDto {
  /**
   * Lote de sincronización que dejó la corrida.
   */
  @ApiProperty({ format: 'uuid' })
  batchId!: string;

  /**
   * Líneas de stock recibidas del sistema externo (código × sede, todas las sedes).
   */
  @ApiProperty()
  received!: number;

  /**
   * Líneas traducidas a un producto de la farmacia.
   */
  @ApiProperty()
  mapped!: number;

  /**
   * Líneas sin un vínculo único: `received - mapped`.
   */
  @ApiProperty()
  unmappedLines!: number;

  /**
   * Códigos externos sin un vínculo único, una vez cada uno.
   */
  @ApiProperty({ type: [UnmappedExternalProductDto] })
  unmapped!: UnmappedExternalProductDto[];

  /**
   * Líneas que cambiaron el stock (las iguales no cuentan).
   */
  @ApiProperty()
  applied!: number;

  /**
   * Cuentas por sede, en el orden en que se sincronizaron.
   */
  @ApiProperty({ type: [IntegrationSyncSiteDto] })
  sites!: IntegrationSyncSiteDto[];

  /**
   * Líneas con vínculo que no se aplicaron, con su motivo.
   */
  @ApiProperty({ type: [IntegrationSyncSkippedDto] })
  skipped!: IntegrationSyncSkippedDto[];

  /**
   * Códigos vinculados que el sistema externo no mandó para alguna sede.
   */
  @ApiProperty({ type: [IntegrationSyncNotSentDto] })
  notSent!: IntegrationSyncNotSentDto[];
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
   * Unidad del sistema externo que equivale a una del producto; `null` si el
   * vínculo no la declaró (entonces no se comprueba al sincronizar).
   */
  @ApiPropertyOptional({ nullable: true })
  externalUnitCode!: string | null;

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

  /**
   * `MAPPED` (un producto), `UNMAPPED` (ninguno) o `AMBIGUOUS` (más de uno).
   */
  @ApiProperty({ enum: ['MAPPED', 'UNMAPPED', 'AMBIGUOUS'] })
  mappingStatus!: 'MAPPED' | 'UNMAPPED' | 'AMBIGUOUS';

  /**
   * Productos vinculados al código: uno con `MAPPED`, varios con `AMBIGUOUS`.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  mappedProductIds!: string[];
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
