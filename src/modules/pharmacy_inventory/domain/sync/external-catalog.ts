/** Un producto tal como lo lista el sistema de la farmacia externa. */
export interface ExternalProduct {
  /** Código propio del sistema externo. */
  readonly code: string;
  readonly name: string;
  readonly presentation?: string;
  readonly unitCode?: string;
}

/** Precio unitario de un producto externo (FAR-C9). */
export interface ExternalPrice {
  readonly code: string;
  /** En la moneda de la farmacia, con decimales. */
  readonly unitPrice: number;
  readonly currency: string;
}

/** Unidades de un producto externo en una sucursal. */
export interface ExternalStockLine {
  readonly code: string;
  readonly quantity: number;
}

/**
 * El sistema de la farmacia externa no respondió, respondió con error o con
 * algo que no se entiende. El caso de uso lo traduce a un 502 sin crear lote.
 */
export class ExternalCatalogUnavailableError extends Error {
  /**
   * @param detail - Qué falló, para el log (nunca la clave).
   * @param kind - Si el sistema no respondió o rechazó la clave (FAR-C9). Por
   *   defecto, que no respondió.
   */
  constructor(
    readonly detail: string,
    readonly kind: 'UNREACHABLE' | 'AUTH_REJECTED' = 'UNREACHABLE',
  ) {
    super(`External pharmacy catalog unavailable: ${detail}`);
    this.name = 'ExternalCatalogUnavailableError';
  }
}
