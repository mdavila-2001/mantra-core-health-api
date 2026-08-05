import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FormInstances } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una instancia de formulario para un recurso. */
export interface CreateInstanceData {
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a tenant context.
   */
  tenantContextId?: string;
  /**
   * Valor de schema version mantenido por la instancia.
   */
  schemaVersion: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `forms.form_instances`. */
@Injectable()
export class FormInstancesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<FormInstances | null>`.
   */
  findById(em: EntityManager, id: string): Promise<FormInstances | null> {
    return em.findOne(FormInstances, { id });
  }

  /**
   * Obtiene find by resource and version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceTypeConceptId - Identificador de resource type concept.
   * @param resourceId - Identificador de resource.
   * @param schemaVersion - Valor de schema version requerido por la operación.
   * @returns Resultado de find by resource and version conforme al contrato `Promise<FormInstances | null>`.
   */
  findByResourceAndVersion(
    em: EntityManager,
    resourceTypeConceptId: string,
    resourceId: string,
    schemaVersion: number,
  ): Promise<FormInstances | null> {
    return em.findOne(FormInstances, {
      resourceTypeConceptId,
      resourceId,
      schemaVersion,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FormInstances`.
   */
  create(em: EntityManager, data: CreateInstanceData): FormInstances {
    const { actorUserId, ...rest } = data;
    return em.create(
      FormInstances,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
