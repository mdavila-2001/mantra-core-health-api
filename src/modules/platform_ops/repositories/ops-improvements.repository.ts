import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OperationalImprovementItems } from '../entities';
import { createdBy } from '../../../common';

export interface CreateImprovementData {
  tenantId?: string;
  serviceComponentId: string;
  postmortemActionItemId?: string;
  readinessReviewFindingId?: string;
  sourceTypeConceptId: string;
  title: string;
  description?: string;
  priorityConceptId: string;
  statusConceptId: string;
  ownerUserId: string;
  dueAt?: Date;
  actorUserId?: string;
}

/**
 * Acceso a `platform_ops.operational_improvement_items`.
 *
 * Tiene repositorio propio porque la tabla es el backlog común de tres fuentes
 * —postmortem, revisión de preparación y ejercicio de resiliencia—, y cada una
 * vive en un servicio distinto. Colgarla de cualquiera de ellos obligaría a los
 * otros dos a depender de un repositorio que no es suyo.
 */
@Injectable()
export class OpsImprovementsRepository {
  createImprovementItem(
    em: EntityManager,
    data: CreateImprovementData,
  ): OperationalImprovementItems {
    return em.create(
      OperationalImprovementItems,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        postmortemActionItemId: data.postmortemActionItemId,
        readinessReviewFindingId: data.readinessReviewFindingId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        title: data.title,
        description: data.description,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        ownerUserId: data.ownerUserId,
        dueAt: data.dueAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
