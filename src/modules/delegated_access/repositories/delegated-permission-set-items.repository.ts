import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedPermissionSetItems } from '../entities';

/** Un ítem de permiso dentro de un set delegado. */
export interface CreateSetItemData {
  /**
   * Identificador asociado a delegated permission set.
   */
  delegatedPermissionSetId: string;
  /**
   * Identificador asociado a permission.
   */
  permissionId: string;
  /**
   * Valor de constraint json mantenido por la instancia.
   */
  constraintJson?: unknown;
  /**
   * Valor de requires step up authentication mantenido por la instancia.
   */
  requiresStepUpAuthentication?: boolean;
}

/** Acceso a datos de `delegated_access.delegated_permission_set_items`. */
@Injectable()
export class DelegatedPermissionSetItemsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DelegatedPermissionSetItems`.
   */
  create(
    em: EntityManager,
    data: CreateSetItemData,
  ): DelegatedPermissionSetItems {
    return em.create(
      DelegatedPermissionSetItems,
      {
        delegatedPermissionSetId: data.delegatedPermissionSetId,
        permissionId: data.permissionId,
        constraintJson: data.constraintJson,
        requiresStepUpAuthentication:
          data.requiresStepUpAuthentication ?? false,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find by set.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param setId - Identificador de set.
   * @returns Resultado de find by set conforme al contrato `Promise<DelegatedPermissionSetItems[]>`.
   */
  findBySet(
    em: EntityManager,
    setId: string,
  ): Promise<DelegatedPermissionSetItems[]> {
    return em.find(DelegatedPermissionSetItems, {
      delegatedPermissionSetId: setId,
    });
  }

  /** Ítem concreto de un set para un permiso (evaluación de step-up). */
  findBySetAndPermission(
    em: EntityManager,
    setId: string,
    permissionId: string,
  ): Promise<DelegatedPermissionSetItems | null> {
    return em.findOne(DelegatedPermissionSetItems, {
      delegatedPermissionSetId: setId,
      permissionId,
    });
  }

  /** Reemplazo all-or-nothing: borra los ítems de la versión previa. */
  deleteBySet(em: EntityManager, setId: string): Promise<number> {
    return em.nativeDelete(DelegatedPermissionSetItems, {
      delegatedPermissionSetId: setId,
    });
  }
}
