import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PermissionCategories } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de una categoría de permiso (catálogo de sistema). */
export interface CreatePermissionCategoryData {
  code: string;
  name: string;
  description?: string;
  ordinal?: number;
  actorUserId?: string;
}

/** Acceso a datos de `authz.permission_categories` (catálogo global, sin tenant). */
@Injectable()
export class PermissionCategoriesRepository {
  findByCode(em: EntityManager, code: string): Promise<PermissionCategories | null> {
    return em.findOne(PermissionCategories, { code });
  }

  findById(em: EntityManager, id: string): Promise<PermissionCategories | null> {
    return em.findOne(PermissionCategories, { id });
  }

  /** Crea la categoría (sin flush). */
  create(em: EntityManager, data: CreatePermissionCategoryData): PermissionCategories {
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
