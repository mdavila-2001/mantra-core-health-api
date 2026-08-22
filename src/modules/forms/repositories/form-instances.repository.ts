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
    resourceId: string,
    schemaVersion: number,
  ): Promise<FormInstances | null> {
    return em.findOne(FormInstances, {
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

  /**
   * Instancias adjuntas a un recurso, de la más reciente a la más antigua.
   *
   * Se filtra solo por `resource_id`: las instancias reales de hoy llevan el
   * tipo por defecto (paciente) aunque el recurso sea un encuentro —deuda
   * declarada del contrato de apertura—, así que acotar por tipo dejaría fuera
   * exactamente las filas que se buscan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceId - Recurso al que se adjuntaron los formularios.
   * @param limit - Tope de filas (el llamador pide una de más para declarar el recorte).
   * @returns Instancias del recurso.
   */
  findByResourceId(
    em: EntityManager,
    resourceId: string,
    limit: number,
  ): Promise<FormInstances[]> {
    return em.find(
      FormInstances,
      { resourceId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Instancias adjuntas a cualquiera de los recursos, en un solo lote `$in`
   * (una consulta para todos los encuentros del paciente, no una por cada uno).
   * Mismo criterio que {@link findByResourceId}: solo `resource_id`, de la más
   * reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceIds - Recursos a los que se adjuntaron los formularios.
   * @param limit - Tope de filas (el llamador pide una de más para declarar el recorte).
   * @returns Instancias de esos recursos.
   */
  findByResourceIds(
    em: EntityManager,
    resourceIds: readonly string[],
    limit: number,
  ): Promise<FormInstances[]> {
    if (resourceIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      FormInstances,
      { resourceId: { $in: [...resourceIds] } },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }
}
