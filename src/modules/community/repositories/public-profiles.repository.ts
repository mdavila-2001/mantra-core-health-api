import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PublicProfiles } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para dar de alta un perfil público (anchor social del módulo). */
export interface CreatePublicProfileData {
  tenantId: string;
  targetTypeConceptId: string;
  targetId: string;
  slug: string;
  displayName: string;
  headline?: string;
  biography?: string;
  statusConceptId: string;
  acceptsReviews?: boolean;
  commentsDefaultEnabled?: boolean;
  actorUserId?: string;
}

/**
 * Acceso a datos de `community.public_profiles`. Es el nodo raíz al que apuntan
 * casi todas las FK `*_profile_id` del módulo; el resto de recursos sociales lo
 * exigen como padre.
 */
@Injectable()
export class PublicProfilesRepository {
  findById(em: EntityManager, id: string): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, { id });
  }

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
