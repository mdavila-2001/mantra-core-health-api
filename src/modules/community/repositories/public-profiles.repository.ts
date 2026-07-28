import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PublicProfiles } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para dar de alta un perfil público (anchor social del módulo). */
export interface CreatePublicProfileData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Valor de slug mantenido por la instancia.
   */
  slug: string;
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Valor de headline mantenido por la instancia.
   */
  headline?: string;
  /**
   * Valor de biography mantenido por la instancia.
   */
  biography?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de accepts reviews mantenido por la instancia.
   */
  acceptsReviews?: boolean;
  /**
   * Valor de comments default enabled mantenido por la instancia.
   */
  commentsDefaultEnabled?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `community.public_profiles`. Es el nodo raíz al que apuntan
 * casi todas las FK `*_profile_id` del módulo; el resto de recursos sociales lo
 * exigen como padre.
 */
@Injectable()
export class PublicProfilesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PublicProfiles | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PublicProfiles`.
   */
  create(em: EntityManager, data: CreatePublicProfileData): PublicProfiles {
    return em.create(
      PublicProfiles,
      {
        tenantId: data.tenantId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        slug: data.slug,
        displayName: data.displayName,
        headline: data.headline,
        biography: data.biography,
        statusConceptId: data.statusConceptId,
        verificationStatusConceptId: CONCEPTS.STATE_PENDING,
        acceptsReviews: data.acceptsReviews ?? true,
        commentsDefaultEnabled: data.commentsDefaultEnabled ?? true,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
