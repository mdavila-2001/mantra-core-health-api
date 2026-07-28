import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceScopeGrants } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un grant polimórfico sujeto→recurso (REC 3.1, sin FK). */
export interface CreateResourceScopeGrantData {
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject.
   */
  subjectId: string;
  /**
   * Identificador asociado a permission.
   */
  permissionId: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a effect concept.
   */
  effectConceptId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
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
    return em.findOne(ResourceScopeGrants, {
      subjectId,
      permissionId,
      resourceId,
    });
  }

  /** Grants de un sujeto sobre un recurso concreto (para el PDP). */
  findForSubjectResource(
    em: EntityManager,
    subjectId: string,
    resourceId: string,
  ): Promise<ResourceScopeGrants[]> {
    return em.find(ResourceScopeGrants, { subjectId, resourceId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ResourceScopeGrants`.
   */
  create(
    em: EntityManager,
    data: CreateResourceScopeGrantData,
  ): ResourceScopeGrants {
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
