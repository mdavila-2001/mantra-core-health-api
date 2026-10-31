import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import {
  InventoryScopeRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { numericQuantity } from '../../domain/counting/stock-quantity';
import { defaultAvailableQuantity } from '../../domain/site-availability/initial-quantity';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import type { PharmacyProducts } from '../../../pharmacy/entities';
import type {
  SetSiteAvailabilityDto,
  SiteAvailabilityResponseDto,
} from '../../presentation/dto';
import {
  PharmacyInventoryScopePolicy,
  type SiteScope,
} from '../scope/pharmacy-inventory-scope.policy';
import { SiteStockWriter } from './site-stock-writer';

/** Ruta del recurso, tal como llega del controlador. */
export interface SiteProductRef {
  readonly pharmacyId: string;
  readonly siteId: string;
  readonly productId: string;
}

/** 422 con el motivo también en `details.reason`, como lo lee el front. */
function rejected(
  message: string,
  reason: PharmacyInventoryErrorReason,
): PreconditionFailedException {
  return new PreconditionFailedException(message, { reason }, reason);
}

/**
 * «Lo tengo / No lo tengo» de un producto en una sede (FAR-06).
 *
 * Resuelve farmacia → sede → producto dentro del ámbito del actor (lo ajeno y
 * lo inexistente responden el mismo 404), rechaza sin escribir lo que la sede
 * no puede decidir y escribe por `SiteStockWriter` sólo ese producto: los demás
 * siguen lo que declara el catálogo.
 */
@Injectable()
export class SetSiteProductAvailabilityUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly scopeRepo: InventoryScopeRepository,
    private readonly positions: StockPositionsRepository,
    private readonly writer: SiteStockWriter,
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    ref: SiteProductRef,
    dto: SetSiteAvailabilityDto,
    actor: AuthenticatedUser,
  ): Promise<SiteAvailabilityResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.site_availability.set',
        pharmacyId: ref.pharmacyId,
        siteId: ref.siteId,
        productId: ref.productId,
        available: dto.available,
      },
      'Setting site product availability',
    );
    assertQuantity(dto);
    return this.em.transactional(async (tx) => {
      const pharmacy = await this.scope.requireManagedPharmacy(
        tx,
        ref.pharmacyId,
        actor,
      );
      const site = await this.scope.requireSite(tx, pharmacy, ref.siteId);
      const product = await this.scopeRepo.findProductInPharmacy(
        tx,
        ref.productId,
        pharmacy.pharmacyId,
      );
      if (!product) throw this.scope.notAvailable();
      const { response } = await this.writeInSite(
        tx,
        site,
        product,
        dto,
        actor,
      );
      return response;
    });
  }

  /**
   * Lo mismo, en una transacción ya abierta y con la sede y el producto ya
   * resueltos en el ámbito del actor: es lo que corre cada fila de la carga por
   * sucursal. Dice además si la escritura dejó asiento (si cambió algo).
   */
  async writeInSite(
    tx: EntityManager,
    site: SiteScope,
    product: PharmacyProducts,
    dto: SetSiteAvailabilityDto,
    actor: AuthenticatedUser,
  ): Promise<{ response: SiteAvailabilityResponseDto; changed: boolean }> {
    assertQuantity(dto);
    if (product.statusConceptId !== PHARM.PRODUCT_ACTIVE) {
      throw rejected(
        'El producto no está publicado: un borrador o un retirado no se ofrece en ninguna sucursal',
        PharmacyInventoryErrorReason.PRODUCT_NOT_PUBLISHED,
      );
    }
    if (dto.available && product.outOfStockDeclared) {
      throw rejected(
        'El producto está marcado sin stock en el catálogo de la farmacia: esa marca se quita desde el catálogo',
        PharmacyInventoryErrorReason.PRODUCT_OUT_OF_STOCK_DECLARED,
      );
    }
    const lotPositions = await this.positions.countLotPositionsInSite(
      tx,
      site.siteId,
      product.id,
    );
    if (lotPositions > 0) {
      throw rejected(
        'La sucursal lleva este producto por lotes: su existencia cambia con recepciones y conteos',
        PharmacyInventoryErrorReason.SITE_PRODUCT_KEPT_BY_LOTS,
      );
    }

    const quantity = dto.available
      ? (dto.quantity ?? defaultAvailableQuantity(product.stockQuantity))
      : 0;
    const [result] = await this.writer.write(
      tx,
      site,
      [{ productId: product.id, availableQuantity: quantity }],
      {
        movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
        actorUserId: actor.id,
      },
    );
    const available = numericQuantity(result.position.availableQuantity);
    return {
      changed: result.changed,
      response: {
        siteId: site.siteId,
        productId: product.id,
        available: available > 0,
        quantity: available,
        stockUpdatedAt: result.position.updatedAt.toISOString(),
      },
    };
  }
}

/** «Lo tengo» con cero unidades se contradice: 400 antes de tocar nada. */
function assertQuantity(dto: SetSiteAvailabilityDto): void {
  if (dto.available && dto.quantity === 0) {
    throw new DomainException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      '«Lo tengo» necesita una cantidad mayor que cero',
      {
        reason: PharmacyInventoryErrorReason.SITE_AVAILABILITY_QUANTITY_INVALID,
        fields: ['quantity'],
      },
      PharmacyInventoryErrorReason.SITE_AVAILABILITY_QUANTITY_INVALID,
    );
  }
}
