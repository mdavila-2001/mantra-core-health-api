import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FormInstances } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una instancia de formulario para un recurso. */
export interface CreateInstanceData {
  resourceTypeConceptId: string;
  resourceId: string;
  tenantContextId?: string;
  schemaVersion: number;
  stateConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `forms.form_instances`. */
@Injectable()
export class FormInstancesRepository {
  findById(em: EntityManager, id: string): Promise<FormInstances | null> {
    return em.findOne(FormInstances, { id });
  }

  findByResourceAndVersion(
    em: EntityManager,
    resourceTypeConceptId: string,
    resourceId: string,
    schemaVersion: number,
  ): Promise<FormInstances | null> {
    return em.findOne(FormInstances, { resourceTypeConceptId, resourceId, schemaVersion });
  }

  create(em: EntityManager, data: CreateInstanceData): FormInstances {
    const { actorUserId, ...rest } = data;
    return em.create(FormInstances, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }
}
