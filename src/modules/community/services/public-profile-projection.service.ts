import type { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { PublicProfilesRepository } from '../repositories';

/** Datos mínimos para proyectar una organización en el directorio público. */
export interface OrganizationPublicProfileProjection {
  /** Tenant propietario de la organización. */
  tenantId: string;
  /** Identificador del agregado de organización. */
  targetId: string;
  /** Slug público único. */
  slug: string;
  /** Nombre que se mostrará públicamente. */
  displayName: string;
  /** Usuario responsable de la proyección. */
  actorUserId: string;
}

/**
 * Puerto de aplicación para que otros módulos creen perfiles públicos sin
 * depender de entidades ni repositorios internos de Community.
 */
@Injectable()
export class PublicProfileProjectionService {
  /**
   * Inicializa el proyector.
   *
   * @param profilesRepo - Persistencia encapsulada de perfiles públicos.
   */
  constructor(private readonly profilesRepo: PublicProfilesRepository) {}

  /**
   * Proyecta una organización dentro de la transacción del caso de uso llamador.
   *
   * @param em - Transacción activa compartida.
   * @param data - Datos públicos de la organización.
   * @returns Identificador del perfil público persistido.
   */
  async projectOrganization(
    em: EntityManager,
    data: OrganizationPublicProfileProjection,
  ): Promise<string> {
    const profile = this.profilesRepo.create(em, {
      tenantId: data.tenantId,
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      targetId: data.targetId,
      slug: data.slug,
      displayName: data.displayName,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      acceptsReviews: true,
      actorUserId: data.actorUserId,
    });
    await em.flush();
    return profile.id;
  }
}
