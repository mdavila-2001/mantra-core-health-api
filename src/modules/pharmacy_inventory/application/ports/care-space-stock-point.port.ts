import type {
  StockPointSpaceFacts,
  StockPointUnitFacts,
} from '../../domain/stock-points/stock-point-rules';
import type { UnitOfWork } from './unit-of-work';

/**
 * Espacios y unidades de `practice` vistos desde el inventario (§F5c). El
 * adaptador lee con el contexto de la transacción del llamador.
 */
export interface CareSpaceStockPointPort {
  /** El espacio, o `null` si no existe. */
  describeSpace(
    uow: UnitOfWork,
    careSpaceId: string,
  ): Promise<StockPointSpaceFacts | null>;
  /** La unidad, o `null` si no existe. */
  describeUnit(
    uow: UnitOfWork,
    clinicalUnitId: string,
  ): Promise<StockPointUnitFacts | null>;
  /** Sede de práctica de la sede de farmacia, o `null`. */
  practiceSiteOfPharmacySite(
    uow: UnitOfWork,
    pharmacySiteId: string,
  ): Promise<string | null>;
}

/** Token del puerto. */
export const CARE_SPACE_STOCK_POINT_PORT = Symbol(
  'CARE_SPACE_STOCK_POINT_PORT',
);
