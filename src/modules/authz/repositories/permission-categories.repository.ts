import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PermissionCategories } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de una categoría de permiso (catálogo de sistema). */
export interface CreatePermissionCategoryData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.permission_categories` (catálogo global, sin tenant). */
@Injectable()
export class PermissionCategoriesRepository {
  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<PermissionCategories | null>`.
   */
  findByCode(
    em: EntityManager,
    code: string,
  ): Promise<PermissionCategories | null> {
    return em.findOne(PermissionCategories, { code });
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PermissionCategories | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PermissionCategories | null> {
    return em.findOne(PermissionCategories, { id });
  }

  /** Crea la categoría (sin flush). */
  create(
    em: EntityManager,
    data: CreatePermissionCategoryData,
  ): PermissionCategories {
    return em.create(
      PermissionCategories,
      {
        code: data.code,
        name: data.name,
        description: data.description,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
