import { PINV } from '../pharmacy_inventory.concepts';

export interface SyncItemReconciliation {
  readonly statusConceptId: string;
  readonly normalizedQuantity?: string;
  readonly errorCode?: string;
  readonly errorDetail?: string;
}

/** Clasifica el resultado de reconciliar un item recibido contra el catálogo. */
export function reconcileSyncItem(
  pharmacyProductId: string | null | undefined,
  externalQuantity: string | null | undefined,
): SyncItemReconciliation {
  if (pharmacyProductId) {
    return {
      statusConceptId: PINV.SYNC_ITEM_MATCHED,
      normalizedQuantity: externalQuantity ?? '0',
    };
  }
  return {
    statusConceptId: PINV.SYNC_ITEM_DISCREPANCY,
    errorCode: 'UNMAPPED_PRODUCT',
    errorDetail: 'No se encontró un producto para el código externo',
  };
}
