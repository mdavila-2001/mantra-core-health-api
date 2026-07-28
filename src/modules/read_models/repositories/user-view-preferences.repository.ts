import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserViewPreferences } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una preferencia de vista de usuario. */
export interface CreateUserViewPreferenceData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a frontend page view.
   */
  frontendPageViewId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de visible fields json mantenido por la instancia.
   */
  visibleFieldsJson?: unknown;
  /**
   * Valor de field order json mantenido por la instancia.
   */
  fieldOrderJson?: unknown;
  /**
   * Valor de active filter json mantenido por la instancia.
   */
  activeFilterJson?: unknown;
  /**
   * Valor de sort code mantenido por la instancia.
   */
  sortCode?: string;
  /**
   * Identificador asociado a density concept.
   */
  densityConceptId?: string;
  /**
   * Valor de page size mantenido por la instancia.
   */
  pageSize?: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `read_models.user_view_preferences`. */
@Injectable()
export class UserViewPreferencesRepository {
  /**
   * Obtiene find by user and view.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Identificador de user.
   * @param frontendPageViewId - Identificador de frontend page view.
   * @returns Resultado de find by user and view conforme al contrato `Promise<UserViewPreferences | null>`.
   */
  findByUserAndView(
    em: EntityManager,
    userId: string,
    frontendPageViewId: string,
  ): Promise<UserViewPreferences | null> {
    return em.findOne(UserViewPreferences, { userId, frontendPageViewId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserViewPreferences`.
   */
  create(
    em: EntityManager,
    data: CreateUserViewPreferenceData,
  ): UserViewPreferences {
    const { actorUserId, ...rest } = data;
    return em.create(
      UserViewPreferences,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
