import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserViewPreferences } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una preferencia de vista de usuario. */
export interface CreateUserViewPreferenceData {
  userId: string;
  frontendPageViewId: string;
  tenantId?: string;
  visibleFieldsJson?: unknown;
  fieldOrderJson?: unknown;
  activeFilterJson?: unknown;
  sortCode?: string;
  densityConceptId?: string;
  pageSize?: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `read_models.user_view_preferences`. */
@Injectable()
export class UserViewPreferencesRepository {
  findByUserAndView(
    em: EntityManager,
    userId: string,
    frontendPageViewId: string,
  ): Promise<UserViewPreferences | null> {
    return em.findOne(UserViewPreferences, { userId, frontendPageViewId });
  }

  create(em: EntityManager, data: CreateUserViewPreferenceData): UserViewPreferences {
    const { actorUserId, ...rest } = data;
    return em.create(UserViewPreferences, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }
}
