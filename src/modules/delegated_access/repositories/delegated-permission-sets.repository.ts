import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedPermissionSets } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar la versión 1 de un set de permisos delegados. */
export interface CreatePermissionSetData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a delegate type concept.
   */
  delegateTypeConceptId: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.delegated_permission_sets`. */
@Injectable()
export class DelegatedPermissionSetsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DelegatedPermissionSets | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DelegatedPermissionSets | null> {
    return em.findOne(DelegatedPermissionSets, { id });
  }

  /** Set por (tenant, code): la unicidad es por tenant. */
  findByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<DelegatedPermissionSets | null> {
    return em.findOne(DelegatedPermissionSets, { tenantId, code });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DelegatedPermissionSets`.
   */
  create(
    em: EntityManager,
    data: CreatePermissionSetData,
  ): DelegatedPermissionSets {
    return em.create(
      DelegatedPermissionSets,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        delegateTypeConceptId: data.delegateTypeConceptId,
        description: data.description,
        statusConceptId: data.statusConceptId,
        versionNumber: 1,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
