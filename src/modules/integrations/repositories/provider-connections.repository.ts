import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProviderConnections } from '../entities';
import { createdBy } from '../../../common';

/** Datos para aprovisionar una conexión de tenant (UC-12-02). */
export interface CreateConnectionData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a environment concept.
   */
  environmentConceptId?: string;
  /**
   * Valor de config json mantenido por la instancia.
   */
  configJson?: unknown;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Identificador asociado a actor user.
   */
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
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ProviderConnections | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ProviderConnections | null> {
    return em.findOne(ProviderConnections, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ProviderConnections`.
   */
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
