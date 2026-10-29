import { Inject, Injectable } from '@nestjs/common';
import type { UnitOfWork } from '../ports/unit-of-work';
import {
  DOMAIN_EVENT_PUBLISHER_PORT,
  type DomainEventPublisherPort,
} from '../ports/domain-event-publisher.port';

/** Eventos de la ubicación del stock (CONTRATO-F2-F5 F5c; `asyncapi/fragments/f5ops.yaml`). */
export const INVENTORY_LOCATION_EVENTS = {
  /** Una ubicación de inventario quedó ligada a un espacio o a una unidad. */
  located: 'pharmacy_inventory.location.located',
  /** Una ubicación cambió de espacio: el stock la sigue, no se mueve ninguna línea del ledger. */
  relocated: 'pharmacy_inventory.location.relocated',
} as const;

/** Datos comunes de los hechos de ubicación: ids y códigos, nunca nombres ni existencias de pacientes. */
export interface InventoryLocationFact {
  readonly tenantId: string;
  readonly locationId: string;
  readonly pharmacySiteId: string;
  readonly practiceSiteId: string;
  readonly locationType: 'SHELF' | 'WARD_STOCK';
  readonly clinicalUnitId: string | null;
  readonly actorUserId: string;
  /** Versión de la fila resultante: distingue dos hechos seguidos de la misma ubicación. */
  readonly rowVersion: number;
}

/** Publica los hechos de ubicación al outbox dentro de la transacción de la mutación. */
@Injectable()
export class InventoryLocationEvents {
  /**
   * @param publisher - Puerto del outbox de mensajería.
   */
  constructor(
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT)
    private readonly publisher: DomainEventPublisherPort,
  ) {}

  /** `pharmacy_inventory.location.located`. */
  located(
    tx: UnitOfWork,
    fact: InventoryLocationFact & { readonly careSpaceId: string | null },
  ): Promise<void> {
    return this.publish(tx, INVENTORY_LOCATION_EVENTS.located, fact, {
      careSpaceId: fact.careSpaceId,
    });
  }

  /** `pharmacy_inventory.location.relocated`. */
  relocated(
    tx: UnitOfWork,
    fact: InventoryLocationFact & {
      readonly fromCareSpaceId: string | null;
      readonly toCareSpaceId: string;
    },
  ): Promise<void> {
    return this.publish(tx, INVENTORY_LOCATION_EVENTS.relocated, fact, {
      fromCareSpaceId: fact.fromCareSpaceId,
      toCareSpaceId: fact.toCareSpaceId,
    });
  }

  private publish(
    tx: UnitOfWork,
    eventType: string,
    fact: InventoryLocationFact,
    extra: Record<string, unknown>,
  ): Promise<void> {
    return this.publisher.publish(tx, {
      tenantId: fact.tenantId,
      eventType,
      aggregateType: 'pharmacy_inventory.inventory_location',
      aggregateId: fact.locationId,
      actorUserId: fact.actorUserId,
      payloadJson: {
        locationId: fact.locationId,
        tenantId: fact.tenantId,
        pharmacySiteId: fact.pharmacySiteId,
        practiceSiteId: fact.practiceSiteId,
        locationType: fact.locationType,
        clinicalUnitId: fact.clinicalUnitId,
        rowVersion: fact.rowVersion,
        ...extra,
      },
      idempotencyKey: `${eventType}:${fact.locationId}:${fact.rowVersion}`,
    });
  }
}
