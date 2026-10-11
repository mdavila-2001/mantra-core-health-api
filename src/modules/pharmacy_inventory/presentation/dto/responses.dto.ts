import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica con solo el id del recurso creado. */
export class IdResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta al crear una orden de compra (UC-25-01). */
export class PurchaseOrderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  @ApiProperty()
  purchaseOrderNumber!: string;

  /**
   * Valor de line ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de las líneas creadas' })
  lineIds!: string[];
}

/** Respuesta al recepcionar mercancía (UC-25-02). */
export class GoodsReceiptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de receipt number mantenido por la instancia.
   */
  @ApiProperty()
  receiptNumber!: string;

  /**
   * Valor de lot ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de lotes afectados' })
  lotIds!: string[];

  /**
   * Valor de ledger entry ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de asientos del ledger' })
  ledgerEntryIds!: string[];
}

/** Respuesta al reservar / dispensar (UC-25-03/04). */
export class MovementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de line ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de líneas creadas' })
  lineIds!: string[];

  /**
   * Valor de ledger entry ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de asientos del ledger' })
  ledgerEntryIds!: string[];
}

/** Respuesta de la sesión de conteo (UC-25-06/07). */
export class CountSessionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de line ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de líneas de conteo' })
  lineIds!: string[];

  /**
   * Valor de adjustments mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de ajustes generados' })
  adjustments!: number;
}

/** Respuesta de una transferencia (UC-25-10). */
export class TransferResponseDto {
  /**
   * Identificador asociado a correlation.
   */
  @ApiProperty({ format: 'uuid' })
  correlationId!: string;

  /**
   * Identificador asociado a out ledger entry.
   */
  @ApiProperty({ format: 'uuid' })
  outLedgerEntryId!: string;

  /**
   * Identificador asociado a in ledger entry.
   */
  @ApiProperty({ format: 'uuid' })
  inLedgerEntryId!: string;
}

/** Respuesta del worker de expiración de reservas (UC-25-05). */
export class ExpireReservationsResponseDto {
  /**
   * Todo lo expirado en la corrida: reservas de mostrador más pedidos de
   * paciente (FAR-E1). El desglose de pedidos viaja aparte.
   */
  @ApiProperty({ description: 'Reservas y pedidos expirados en esta corrida' })
  expiredCount!: number;

  /**
   * Cuántos de los expirados eran pedidos de paciente (FAR-E1).
   */
  @ApiProperty({
    required: false,
    description: 'Pedidos de paciente vencidos en esta corrida',
  })
  expiredOrderCount?: number;
}

/** Respuesta de la reconciliación de sincronización (UC-25-12). */
export class ReconcileResponseDto {
  /**
   * Identificador asociado a batch.
   */
  @ApiProperty({ format: 'uuid' })
  batchId!: string;

  /**
   * Valor de items processed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Items procesados' })
  itemsProcessed!: number;

  /**
   * Valor de discrepancies mantenido por la instancia.
   */
  @ApiProperty({ description: 'Items marcados como discrepancia' })
  discrepancies!: number;
}

/** Respuesta al crear un lote de sincronización (bootstrap). */
export class SyncBatchResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de item ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de los items creados' })
  itemIds!: string[];
}

/** Respuesta simple de operación que cambia estado sin crear recurso. */
export class StatusResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;
}
