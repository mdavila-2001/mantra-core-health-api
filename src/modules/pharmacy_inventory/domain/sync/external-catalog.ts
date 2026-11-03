/** Un producto tal como lo lista el sistema de la farmacia externa. */
export interface ExternalProduct {
  /** Código propio del sistema externo. */
  readonly code: string;
  readonly name: string;
  readonly presentation?: string;
  readonly unitCode?: string;
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
  constructor(
    readonly detail: string,
    readonly errorReason: ExternalSystemErrorReason = 'UNREACHABLE',
  ) {
    super(`External pharmacy catalog unavailable: ${detail}`);
    this.name = 'ExternalCatalogUnavailableError';
  }
}

export type ExternalSystemErrorReason = 'AUTH_REJECTED' | 'UNREACHABLE';
export type ExternalSystemCheckResult = 'OK' | ExternalSystemErrorReason;
export interface ExternalSystemLastCheck {
  readonly status: 'ACTIVE' | 'ERROR';
  readonly errorReason: ExternalSystemErrorReason | null;
  readonly checkedAt: string;
}
export function externalSystemLastCheck(
  result: ExternalSystemCheckResult,
): ExternalSystemLastCheck {
  return {
    status: result === 'OK' ? 'ACTIVE' : 'ERROR',
    errorReason: result === 'OK' ? null : result,
    checkedAt: new Date().toISOString(),
  };
}
