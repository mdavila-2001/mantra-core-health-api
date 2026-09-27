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
  /** Motivo del grant en texto libre (CL-50). */
  reasonText?: string;
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
   * Grants sobre un recurso, para un permiso concreto.
   *
   * Es la lectura que necesita quien concedió: «¿con quién compartí esto y hasta
   * cuándo?». El PDP pregunta por (sujeto, recurso) porque resuelve el acceso de
   * alguien; acá la pregunta es la inversa —el recurso primero— y por eso no
   * alcanzaba con {@link findForSubjectResource}.
   *
   * @param em - Contexto de persistencia.
   * @param resourceId - Recurso compartido.
   * @param permissionId - Permiso concedido.
   * @returns Los grants, del más nuevo al más viejo.
   */
  findForResource(
    em: EntityManager,
    resourceId: string,
    permissionId: string,
  ): Promise<ResourceScopeGrants[]> {
    return em.find(
      ResourceScopeGrants,
      { resourceId, permissionId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Un grant concreto sobre un recurso, para poder revocarlo.
   *
   * Lleva el `resourceId` además del id a propósito: revocar es una operación
   * sobre «lo que compartí», y comprobar que el grant pertenece al recurso que
   * el llamador dice evita que un id suelto revoque el permiso de otra cosa.
   *
   * @param em - Contexto de persistencia.
   * @param id - Grant buscado.
   * @param resourceId - Recurso al que debe pertenecer.
   * @returns El grant, o `null` si no existe o no es de ese recurso.
   */
  findByIdForResource(
    em: EntityManager,
    id: string,
    resourceId: string,
  ): Promise<ResourceScopeGrants | null> {
    return em.findOne(ResourceScopeGrants, { id, resourceId });
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
        reasonText: data.reasonText,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
