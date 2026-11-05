import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../../common';
import {
  judgeStockPoint,
  type LocationTypeCode,
} from '../../domain/stock-points/stock-point-rules';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import {
  CARE_SPACE_STOCK_POINT_PORT,
  type CareSpaceStockPointPort,
} from '../ports/care-space-stock-point.port';
import type { UnitOfWork } from '../ports/unit-of-work';
import {
  PharmacyInventoryScopePolicy,
  type SiteScope,
} from '../scope/pharmacy-inventory-scope.policy';

const MESSAGES: Record<string, string> = {
  STOCK_POINT_SITE_MISMATCH:
    'El espacio o la unidad no son de la sede de esta farmacia',
  SPACE_NOT_STOCK_POINT: 'El espacio no puede guardar stock',
  WARD_STOCK_REQUIRES_UNIT: 'Un botiquín necesita su unidad clínica',
};

/**
 * Valida el espacio y la unidad de una ubicación (§F5c) y traduce la unicidad
 * del botiquín por unidad. Ausente y ajeno responden igual (404 de la política
 * de ámbito).
 */
@Injectable()
export class StockPointGuard {
  constructor(
    @Inject(CARE_SPACE_STOCK_POINT_PORT)
    private readonly spaces: CareSpaceStockPointPort,
    private readonly scope: PharmacyInventoryScopePolicy,
  ) {}

  /**
   * @param uow - Transacción.
   * @param site - Sede de farmacia ya administrada por el actor.
   * @param input - Espacio, unidad y tipo pedidos.
   */
  async assert(
    uow: UnitOfWork,
    site: SiteScope,
    input: {
      careSpaceId?: string | null;
      clinicalUnitId?: string | null;
      locationType: LocationTypeCode;
    },
  ): Promise<void> {
    const practiceSiteId = await this.spaces.practiceSiteOfPharmacySite(
      uow,
      site.siteId,
    );
    if (!practiceSiteId) throw this.scope.notAvailable();
    const verdict = judgeStockPoint({
      tenantId: site.tenantId,
      pharmacyPracticeSiteId: practiceSiteId,
      locationType: input.locationType,
      careSpaceId: input.careSpaceId,
      space: input.careSpaceId
        ? await this.spaces.describeSpace(uow, input.careSpaceId)
        : null,
      clinicalUnitId: input.clinicalUnitId,
      unit: input.clinicalUnitId
        ? await this.spaces.describeUnit(uow, input.clinicalUnitId)
        : null,
    });
    if (verdict.ok) return;
    if (verdict.reason === 'NOT_AVAILABLE') throw this.scope.notAvailable();
    throw new PreconditionFailedException(
      MESSAGES[verdict.reason],
      {},
      PharmacyInventoryErrorReason[verdict.reason],
    );
  }

  /**
   * Traduce la carrera sobre `ux_inventory_locations_ward_stock_unit` a 409.
   *
   * @param error - Error del `flush`.
   */
  translate(error: unknown): unknown {
    let current: unknown = error;
    for (let d = 0; d < 5 && current; d += 1) {
      const c = current as {
        code?: unknown;
        constraint?: unknown;
        message?: unknown;
        cause?: unknown;
      };
      if (
        c.code === '23505' &&
        (c.constraint === 'ux_inventory_locations_ward_stock_unit' ||
          (typeof c.message === 'string' ? c.message : '').includes(
            'ux_inventory_locations_ward_stock_unit',
          ))
      )
        return wardStockTaken();
      current = c.cause;
    }
    return error;
  }
}

/** 409 `WARD_STOCK_ALREADY_EXISTS`. */
export function wardStockTaken(): ConflictException {
  return new ConflictException(
    'La unidad ya tiene un botiquín activo',
    {},
    PharmacyInventoryErrorReason.WARD_STOCK_ALREADY_EXISTS,
  );
}
