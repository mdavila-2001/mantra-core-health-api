import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticStudyComponents } from '../entities';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de un componente de un panel compuesto (UC-23-05). */
export interface CreateComponentData {
  parentOfferingId: string;
  componentOfferingId: string;
  componentRoleConceptId?: string;
  quantity?: string;
  ordinal?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos de `diagnostic_units.diagnostic_study_components`. La tabla solo
 * tiene marca de creación (append-only), así que se puebla `created_at` a mano.
 */
@Injectable()
export class DiagnosticStudyComponentsRepository {
  create(
    em: EntityManager,
    data: CreateComponentData,
  ): DiagnosticStudyComponents {
    const now = new Date();
    return em.create(
      DiagnosticStudyComponents,
      {
        parentOfferingId: data.parentOfferingId,
        componentOfferingId: data.componentOfferingId,
        componentRoleConceptId:
          data.componentRoleConceptId ?? DUNIT.COMPONENT_ROLE_PANEL,
        quantity: data.quantity,
        ordinal: data.ordinal,
        createdAt: now,
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
