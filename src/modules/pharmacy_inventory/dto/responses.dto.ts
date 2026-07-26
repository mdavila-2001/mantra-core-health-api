import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica con solo el id del recurso creado. */
export class IdResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta al crear una orden de compra (UC-25-01). */
export class PurchaseOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  purchaseOrderNumber!: string;

  @ApiProperty({ type: [String], description: 'Ids de las líneas creadas' })
  lineIds!: string[];
}

/** Respuesta al recepcionar mercancía (UC-25-02). */
export class GoodsReceiptResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  receiptNumber!: string;

  @ApiProperty({ type: [String], description: 'Ids de lotes afectados' })
  lotIds!: string[];

  @ApiProperty({ type: [String], description: 'Ids de asientos del ledger' })
  ledgerEntryIds!: string[];
}

/** Respuesta al reservar / dispensar (UC-25-03/04). */
export class MovementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String], description: 'Ids de líneas creadas' })
  lineIds!: string[];

  @ApiProperty({ type: [String], description: 'Ids de asientos del ledger' })
  ledgerEntryIds!: string[];
}

/** Respuesta de la sesión de conteo (UC-25-06/07). */
export class CountSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String], description: 'Ids de líneas de conteo' })
  lineIds!: string[];

  @ApiProperty({ description: 'Número de ajustes generados' })
  adjustments!: number;
}

/** Respuesta de una transferencia (UC-25-10). */
export class TransferResponseDto {
  @ApiProperty({ format: 'uuid' })
  correlationId!: string;

  @ApiProperty({ format: 'uuid' })
  outLedgerEntryId!: string;

  @ApiProperty({ format: 'uuid' })
  inLedgerEntryId!: string;
}

/** Respuesta del worker de expiración de reservas (UC-25-05). */
export class ExpireReservationsResponseDto {
  @ApiProperty({ description: 'Reservas expiradas en esta corrida' })
  expiredCount!: number;
}

/** Respuesta de la reconciliación de sincronización (UC-25-12). */
export class ReconcileResponseDto {
  @ApiProperty({ format: 'uuid' })
  batchId!: string;

  @ApiProperty({ description: 'Items procesados' })
  itemsProcessed!: number;

  @ApiProperty({ description: 'Items marcados como discrepancia' })
  discrepancies!: number;
}

/** Respuesta al crear un lote de sincronización (bootstrap). */
export class SyncBatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String], description: 'Ids de los items creados' })
  itemIds!: string[];
}

/** Respuesta simple de operación que cambia estado sin crear recurso. */
export class StatusResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;
}
