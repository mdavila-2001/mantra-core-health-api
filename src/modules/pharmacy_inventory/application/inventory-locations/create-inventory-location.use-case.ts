import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { LocationsRepository } from '../../infrastructure/repositories';
import type { CreateLocationDto } from '../../presentation/dto';
import type { LocationResponseDto } from '../../presentation/dto/responses.dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason as Reason } from '../../pharmacy_inventory.error-reasons';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import { InventoryLocationEvents } from './inventory-location-events';
import { StockPointAccessService } from './stock-point-access.service';

/** Tipos de ubicación que se pueden crear por la API. */
const TYPE_CONCEPT = {
  SHELF: PINV.LOCATION_TYPE_SHELF,
  WARD_STOCK: PINV.LOCATION_TYPE_WARD_STOCK,
} as const;

/**
 * Crea una ubicación activa para la sede dentro de una transacción.
 *
 * Sin espacio ni unidad es el estante de siempre. Con `careSpaceId` o `clinicalUnitId`
 * (F5c) la ubicación queda ligada a un punto de stock de la sede de práctica de la
 * farmacia, o es el botiquín de piso de una unidad.
 */
@Injectable()
export class CreateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
    private readonly access: StockPointAccessService,
    private readonly events: InventoryLocationEvents,
  ) {}

  execute(
    pharmacySiteId: string,
    dto: CreateLocationDto,
    actor: AuthenticatedUser,
  ): Promise<LocationResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.location.create',
        pharmacySiteId,
        code: dto.code,
      },
      'Creating inventory location',
    );
    const typeCode = dto.locationTypeCode ?? 'SHELF';
    const typeConceptId = TYPE_CONCEPT[typeCode];
    if (!typeConceptId) {
      throw new PreconditionFailedException(
        'El tipo de ubicación no existe',
        { allowed: Object.keys(TYPE_CONCEPT) },
        Reason.LOCATION_TYPE_INVALID,
      );
    }
    return this.em.transactional(async (tx) => {
      // La sede de la ruta debe ser de una farmacia que el actor administra, y
      // la ubicación padre, de esa misma sede.
      const site = await this.scope.requireManagedSite(
        tx,
        pharmacySiteId,
        actor,
      );
      if (dto.parentLocationId) {
        await this.scope.requireLocation(tx, site, dto.parentLocationId);
      }
      // La autoridad es la sede de práctica de la farmacia, no lo que diga el cuerpo.
      const tenantId = requireTenantId();
      const practiceSiteId = await this.access.practiceSiteOf(
        tx,
        pharmacySiteId,
      );
      if (!practiceSiteId) throw this.scope.notAvailable();
      await this.access.assertCanManage(tx, actor, tenantId, practiceSiteId);

      if (typeCode === 'WARD_STOCK' && !dto.clinicalUnitId) {
        throw new PreconditionFailedException(
          'El botiquín de piso se crea para una unidad',
          { requiredTarget: 'clinicalUnitId' },
          Reason.WARD_STOCK_UNIT_REQUIRED,
        );
      }
      const point = await this.access.resolve(tx, tenantId, practiceSiteId, {
        careSpaceId: dto.careSpaceId,
        clinicalUnitId: dto.clinicalUnitId,
      });
      if (typeCode === 'WARD_STOCK' && point.clinicalUnitId) {
        const taken = await tx.execute<{ id: string }[]>(
          `select id from pharmacy_inventory.inventory_locations
            where clinical_unit_id = ? and location_type_concept_id = ? and status_concept_id = ?
            limit 1`,
          [
            point.clinicalUnitId,
            PINV.LOCATION_TYPE_WARD_STOCK,
            PINV.LOCATION_ACTIVE,
          ],
        );
        if (taken.length > 0) {
          throw new ConflictException(
            'La unidad ya tiene un botiquín de piso vigente',
            undefined,
            Reason.WARD_STOCK_ALREADY_EXISTS,
          );
        }
      }

      const location = this.locations.create(tx, {
        pharmacySiteId,
        parentLocationId: dto.parentLocationId,
        code: dto.code,
        name: dto.name,
        locationTypeConceptId: typeConceptId,
        temperatureZoneConceptId: PINV.TEMPERATURE_ZONE_AMBIENT,
        controlledAccess: dto.controlledAccess,
        statusConceptId: PINV.LOCATION_ACTIVE,
        careSpaceId: point.careSpaceId ?? undefined,
        clinicalUnitId: point.clinicalUnitId ?? undefined,
        actorUserId: actor.id,
      });
      await tx.flush();
      if (point.careSpaceId || point.clinicalUnitId) {
        await this.events.located(tx, {
          tenantId,
          locationId: location.id,
          pharmacySiteId,
          practiceSiteId,
          locationType: typeCode,
          clinicalUnitId: point.clinicalUnitId,
          careSpaceId: point.careSpaceId,
          actorUserId: actor.id,
          rowVersion: location.rowVersion ?? 1,
        });
      }
      return {
        id: location.id,
        ...(location.rowVersion !== undefined
          ? { rowVersion: location.rowVersion }
          : {}),
        ...(point.careSpaceId ? { careSpaceId: point.careSpaceId } : {}),
        ...(point.clinicalUnitId
          ? { clinicalUnitId: point.clinicalUnitId }
          : {}),
        ...(point.careSpaceId || point.clinicalUnitId
          ? { locationType: typeCode }
          : {}),
      };
    });
  }
}
