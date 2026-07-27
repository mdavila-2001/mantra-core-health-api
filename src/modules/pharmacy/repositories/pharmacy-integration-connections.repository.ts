import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PharmacyIntegrationConnections } from '../entities';
import { createdBy } from '../../../common';

/** Datos para establecer una conexión de integración (UC-24-07). */
export interface CreateConnectionData {
  pharmacyId: string;
  pharmacySiteId?: string;
  /**
   * Id de la conexión de integración externa. `connection_id` es una FK NOT NULL
   * (auto-referencia a esta misma tabla): si el cliente no aporta una conexión
   * existente, la fila se auto-referencia usando su propio id.
   */
  connectionId?: string;
  integrationModeConceptId: string;
  inventoryAuthorityConceptId?: string;
  supportsStockQuery?: boolean;
  supportsPriceQuery?: boolean;
  supportsReservation?: boolean;
  supportsDispenseConfirmation?: boolean;
  manualFallbackAllowed?: boolean;
  statusConceptId: string;
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
