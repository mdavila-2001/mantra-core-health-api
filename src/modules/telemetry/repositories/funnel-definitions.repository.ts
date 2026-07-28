import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FunnelDefinitions } from '../entities';

/** Datos de alta de un funnel (UC-28-10). */
export interface CreateFunnelData {
  /**
   * Valor de funnel code mantenido por la instancia.
   */
  funnelCode: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Identificador asociado a purpose definition.
   */
  purposeDefinitionId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `telemetry.funnel_definitions`. */
@Injectable()
export class FunnelDefinitionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<FunnelDefinitions | null>`.
   */
  findById(em: EntityManager, id: string): Promise<FunnelDefinitions | null> {
    return em.findOne(FunnelDefinitions, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param funnelCode - Valor de funnel code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<FunnelDefinitions | null>`.
   */
  findByCode(
    em: EntityManager,
    funnelCode: string,
  ): Promise<FunnelDefinitions | null> {
    return em.findOne(FunnelDefinitions, { funnelCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FunnelDefinitions`.
   */
  create(em: EntityManager, data: CreateFunnelData): FunnelDefinitions {
    const now = new Date();
    return em.create(
      FunnelDefinitions,
      {
        funnelCode: data.funnelCode,
        name: data.name,
        portalTypeConceptId: data.portalTypeConceptId,
        purposeDefinitionId: data.purposeDefinitionId,
        versionNumber: data.versionNumber,
        statusConceptId: data.statusConceptId,
        createdAt: now,
        updatedAt: now,
        createdByUserId: data.actorUserId,
        updatedByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
