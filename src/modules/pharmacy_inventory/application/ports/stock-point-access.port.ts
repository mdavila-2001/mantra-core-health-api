import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/** Lo que el cuerpo dice sobre dónde queda la ubicación. */
export interface StockPointInput {
  readonly careSpaceId?: string | null;
  readonly clinicalUnitId?: string | null;
}

/** El punto de stock ya resuelto en el tenant. */
export interface ResolvedStockPoint {
  readonly careSpaceId: string | null;
  readonly clinicalUnitId: string | null;
}

/**
 * Quién puede ubicar stock en un espacio y qué espacios y unidades son un punto de
 * stock válido (CONTRATO-F2-F5 F5c). La estructura física es de otro contexto
 * (`practice`): el puerto la oculta al caso de uso.
 */
export interface StockPointAccessPort {
  /** ¿Es personal de farmacia (o plataforma) del tenant? Opera el stock sin pasar por la estructura. */
  isPharmacyOperator(actor: AuthenticatedUser, tenantId: string): boolean;

  /** Sede de práctica de una sede de farmacia, o `null` si no existe. */
  practiceSiteOf(
    tx: UnitOfWork,
    pharmacySiteId: string,
  ): Promise<string | null>;

  /**
   * Autoriza ubicar o reubicar stock en la sede de práctica de la farmacia.
   *
   * @throws ResourceNotFoundException (404) fuera del tenant o de la sucursal del actor.
   * @throws InsufficientRoleException (403 `INFRA_ACTION_NOT_ALLOWED`) si ve la sede pero ningún rol permite la acción.
   */
  assertCanManage(
    tx: UnitOfWork,
    actor: AuthenticatedUser,
    tenantId: string,
    practiceSiteId: string,
  ): Promise<void>;

  /**
   * Autoriza ver las ubicaciones de un espacio.
   *
   * @throws ResourceNotFoundException (404) si el espacio no es del tenant o está fuera del alcance.
   */
  assertCanView(
    tx: UnitOfWork,
    actor: AuthenticatedUser,
    tenantId: string,
    careSpaceId: string,
  ): Promise<void>;

  /**
   * Resuelve el espacio y la unidad del cuerpo como un punto de stock válido de la
   * sede de práctica de la farmacia.
   *
   * @throws ResourceNotFoundException (404) si el espacio o la unidad no son del tenant.
   * @throws PreconditionFailedException (422) por sede, perfil, vigencia o unidad incoherentes.
   */
  resolve(
    tx: UnitOfWork,
    tenantId: string,
    practiceSiteId: string,
    input: StockPointInput,
  ): Promise<ResolvedStockPoint>;
}

/** Token de inyección del acceso a puntos de stock. */
export const STOCK_POINT_ACCESS_PORT = Symbol('STOCK_POINT_ACCESS_PORT');
