/** Una posición de stock de un producto (y lote) en una ubicación. */
export interface SpaceStockPositionView {
  readonly productId: string;
  readonly productName: string | null;
  readonly lotNumber: string | null;
  readonly expiresAt: string | null;
  readonly onHand: number;
  readonly reserved: number;
  readonly quarantine: number;
  readonly available: number;
}

/** Una ubicación de inventario ligada al espacio (o a su subárbol), con sus existencias. */
export interface SpaceStockLocationView {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly locationType: 'SHELF' | 'WARD_STOCK' | 'OTHER';
  readonly status: 'ACTIVE' | 'OTHER';
  readonly careSpace: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  };
  readonly clinicalUnit: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  } | null;
  readonly pharmacySiteId: string;
  readonly rowVersion: number;
  readonly totals: {
    readonly onHand: number;
    readonly reserved: number;
    readonly available: number;
    readonly positions: number;
  };
  readonly positions: readonly SpaceStockPositionView[];
}

/** Pestaña «Stock» de la ficha de espacio (solo lectura). */
export interface SpaceStockView {
  readonly careSpaceId: string;
  readonly generatedAt: string;
  readonly locations: readonly SpaceStockLocationView[];
}
