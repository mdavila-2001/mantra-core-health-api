import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceScopeGrants } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un grant polimórfico sujeto→recurso (REC 3.1, sin FK). */
export interface CreateResourceScopeGrantData {
  subjectTypeConceptId: string;
  subjectId: string;
  permissionId: string;
  resourceTypeConceptId: string;
  resourceId: string;
  effectConceptId: string;
  tenantId?: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `authz.resource_scope_grants`. */
@Injectable()
export class ResourceScopeGrantsRepository {
  /** Grant duplicado (subject, permission, resource) si existe. */
  findExisting(
    em: EntityManager,
    subjectId: string,
    permissionId: string,
    resourceId: string,
  ): Promise<ResourceScopeGrants | null> {
    return em.findOne(ResourceScopeGrants, { subjectId, permissionId, resourceId });
  }

  /** Grants de un sujeto sobre un recurso concreto (para el PDP). */
  findForSubjectResource(
    em: EntityManager,
    subjectId: string,
    resourceId: string,
  ): Promise<ResourceScopeGrants[]> {
    return em.find(ResourceScopeGrants, { subjectId, resourceId });
  }

  create(em: EntityManager, data: CreateResourceScopeGrantData): ResourceScopeGrants {
    return em.create(
      ResourceScopeGrants,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectId: data.subjectId,
        permissionId: data.permissionId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceId: data.resourceId,
        effectConceptId: data.effectConceptId,
        tenantId: data.tenantId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
