import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FunnelDefinitions } from '../entities';

/** Datos de alta de un funnel (UC-28-10). */
export interface CreateFunnelData {
  funnelCode: string;
  name: string;
  portalTypeConceptId: string;
  purposeDefinitionId: string;
  versionNumber: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a `telemetry.funnel_definitions`. */
@Injectable()
export class FunnelDefinitionsRepository {
  findById(em: EntityManager, id: string): Promise<FunnelDefinitions | null> {
    return em.findOne(FunnelDefinitions, { id });
  }

  findByCode(
    em: EntityManager,
    funnelCode: string,
  ): Promise<FunnelDefinitions | null> {
    return em.findOne(FunnelDefinitions, { funnelCode });
  }

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
