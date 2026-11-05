import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PharmacyIntegrationConnections } from '../entities';
import { createdBy } from '../../../common';
import { PHARM } from '../pharmacy.concepts';

/** Datos para establecer una conexión de integración (UC-24-07). */
export interface CreateConnectionData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId?: string;
  /**
   * Id de la conexión registrada en `integrations.provider_connections`.
   * `connection_id` es opcional: sin valor, la farmacia todavía no tiene
   * configurado su sistema externo y trabaja en manual.
   */
  connectionId?: string;
  /**
   * Identificador asociado a integration mode concept.
   */
  integrationModeConceptId: string;
  /**
   * Identificador asociado a inventory authority concept.
   */
  inventoryAuthorityConceptId?: string;
  /**
   * Valor de supports stock query mantenido por la instancia.
   */
  supportsStockQuery?: boolean;
  /**
   * Valor de supports price query mantenido por la instancia.
   */
  supportsPriceQuery?: boolean;
  /**
   * Valor de supports reservation mantenido por la instancia.
   */
  supportsReservation?: boolean;
  /**
   * Valor de supports dispense confirmation mantenido por la instancia.
   */
  supportsDispenseConfirmation?: boolean;
  /**
   * Valor de manual fallback allowed mantenido por la instancia.
   */
  manualFallbackAllowed?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_integration_connections`. */
@Injectable()
export class PharmacyIntegrationConnectionsRepository {
  /** Busca una conexión por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyIntegrationConnections | null> {
    return em.findOne(PharmacyIntegrationConnections, { id });
  }

  /** Busca una conexión por (pharmacy, connection_id) para validar unicidad. */
  findByPharmacyAndConnection(
    em: EntityManager,
    pharmacyId: string,
    connectionId: string,
  ): Promise<PharmacyIntegrationConnections | null> {
    return em.findOne(PharmacyIntegrationConnections, {
      pharmacyId,
      connectionId,
    });
  }

  /**
   * Conexiones activas con consulta de stock del mismo nivel y alcance: las de
   * la sucursal indicada o, sin sucursal, las de toda la farmacia.
   */
  findActiveStockInScope(
    em: EntityManager,
    pharmacyId: string,
    pharmacySiteId: string | null,
  ): Promise<PharmacyIntegrationConnections[]> {
    return em.find(PharmacyIntegrationConnections, {
      pharmacyId,
      pharmacySiteId,
      statusConceptId: PHARM.CONNECTION_ACTIVE,
      supportsStockQuery: true,
    });
  }

  /** Crea la conexión en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateConnectionData,
  ): PharmacyIntegrationConnections {
    const id = randomUUID();
    return em.create(
      PharmacyIntegrationConnections,
      {
        id,
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        connectionId: data.connectionId,
        integrationModeConceptId: data.integrationModeConceptId,
        inventoryAuthorityConceptId: data.inventoryAuthorityConceptId,
        supportsStockQuery: data.supportsStockQuery,
        supportsPriceQuery: data.supportsPriceQuery,
        supportsReservation: data.supportsReservation,
        supportsDispenseConfirmation: data.supportsDispenseConfirmation,
        manualFallbackAllowed: data.manualFallbackAllowed,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
