import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { RowVersionMismatchException } from '../../domain/row-version';
import { LocationsRepository } from '../../infrastructure/repositories';
import type { RelocateLocationDto } from '../../presentation/dto/relocate-location.dto';
import type { LocationResponseDto } from '../../presentation/dto/responses.dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason as Reason } from '../../pharmacy_inventory.error-reasons';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import { InventoryLocationEvents } from './inventory-location-events';
import {
  STOCK_POINT_ACCESS_PORT,
  type StockPointAccessPort,
} from '../ports/stock-point-access.port';

/**
 * Reubica una ubicación de inventario en otro espacio (CONTRATO-F2-F5 F5c).
 *
 * El stock **sigue** a la ubicación: no se mueve ninguna línea del ledger ni se toca
 * ninguna posición; sólo cambia el espacio de la ubicación. Queda auditado
 * (`@Audited` en el controlador) y publica
 * `pharmacy_inventory.location.relocated` en la misma transacción.
 */
@Injectable()
export class RelocateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
    @Inject(STOCK_POINT_ACCESS_PORT)
    private readonly access: StockPointAccessPort,
    private readonly events: InventoryLocationEvents,
  ) {}

  /**
   * @param locationId - Ubicación a reubicar.
   * @param dto - Espacio nuevo.
   * @param expectedRowVersion - `If-Match` (412 si la ubicación cambió).
   * @param actor - Quien lo pide.
   */
  execute(
    locationId: string,
    dto: RelocateLocationDto,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
  ): Promise<LocationResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.location.relocate', locationId },
      'Relocating inventory location',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const location = await this.locations.findById(tx, locationId);
      if (!location) {
        // Se exige el tenant igual que en el camino feliz: ausente y ajena no se distinguen.
        throw this.scope.notAvailable();
      }
      // La farmacia de la ubicación tiene que ser una que el actor administra.
      const site = await this.scope.requireManagedSite(
        tx,
        location.pharmacySiteId,
        actor,
      );
      const practiceSiteId = await this.access.practiceSiteOf(
        tx,
        location.pharmacySiteId,
      );
      if (!practiceSiteId) throw this.scope.notAvailable();
      await this.access.assertCanManage(tx, actor, tenantId, practiceSiteId);

      if (location.statusConceptId !== PINV.LOCATION_ACTIVE) {
        throw new PreconditionFailedException(
          'Sólo se reubica una ubicación vigente',
          undefined,
          Reason.STOCK_LOCATION_NOT_ACTIVE,
        );
      }
      if (location.rowVersion !== expectedRowVersion) {
        throw new RowVersionMismatchException(location.rowVersion);
      }
      const point = await this.access.resolve(tx, tenantId, practiceSiteId, {
        careSpaceId: dto.careSpaceId,
        clinicalUnitId: location.clinicalUnitId,
      });
      const from = location.careSpaceId ?? null;
      if (from === point.careSpaceId) {
        return this.view(location);
      }

      Object.assign(location, { careSpaceId: point.careSpaceId });
      touch(location, actor.id);
      await tx.flush();
      await this.events.relocated(tx, {
        tenantId,
        locationId: location.id,
        pharmacySiteId: site.siteId,
        practiceSiteId,
        locationType:
          location.locationTypeConceptId === PINV.LOCATION_TYPE_WARD_STOCK
            ? 'WARD_STOCK'
            : 'SHELF',
        clinicalUnitId: location.clinicalUnitId ?? null,
        fromCareSpaceId: from,
        toCareSpaceId: point.careSpaceId!,
        actorUserId: actor.id,
        rowVersion: location.rowVersion,
      });
      return this.view(location);
    });
  }

  private view(location: {
    id: string;
    rowVersion: number;
    locationTypeConceptId: string;
    careSpaceId?: string | null;
    clinicalUnitId?: string | null;
  }): LocationResponseDto {
    return {
      id: location.id,
      rowVersion: location.rowVersion,
      locationType:
        location.locationTypeConceptId === PINV.LOCATION_TYPE_WARD_STOCK
          ? 'WARD_STOCK'
          : 'SHELF',
      ...(location.careSpaceId ? { careSpaceId: location.careSpaceId } : {}),
      ...(location.clinicalUnitId
        ? { clinicalUnitId: location.clinicalUnitId }
        : {}),
    };
  }
}
