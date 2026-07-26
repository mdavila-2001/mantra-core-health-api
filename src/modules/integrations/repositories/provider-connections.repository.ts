import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProviderConnections } from '../entities';
import { createdBy } from '../../../common';

/** Datos para aprovisionar una conexión de tenant (UC-12-02). */
export interface CreateConnectionData {
  providerId: string;
  tenantId: string;
  stateConceptId: string;
  environmentConceptId?: string;
  configJson?: unknown;
  validFrom?: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de `integrations.provider_connections`.
 *
 * Las mutaciones de estado (activación, pausa, cambio de credencial) se hacen
 * sobre la entidad cargada en el servicio (`touch` + asignación), no aquí.
 */
@Injectable()
export class ProviderConnectionsRepository {
  findById(em: EntityManager, id: string): Promise<ProviderConnections | null> {
    return em.findOne(ProviderConnections, { id });
  }

  create(em: EntityManager, data: CreateConnectionData): ProviderConnections {
    return em.create(
      ProviderConnections,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        stateConceptId: data.stateConceptId,
        environmentConceptId: data.environmentConceptId,
        configJson: data.configJson,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
