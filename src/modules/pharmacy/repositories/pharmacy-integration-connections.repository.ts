import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PharmacyIntegrationConnections } from '../entities';
import { createdBy } from '../../../common';

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
   * Id de la conexión de integración externa. `connection_id` es una FK NOT NULL
   * (auto-referencia a esta misma tabla): si el cliente no aporta una conexión
   * existente, la fila se auto-referencia usando su propio id.
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
        // Auto-referencia si no se aporta una conexión externa registrada.
        connectionId: data.connectionId ?? id,
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
