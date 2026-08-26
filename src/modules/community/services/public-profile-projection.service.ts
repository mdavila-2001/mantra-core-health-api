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
  /**
   * Qué clase de vitrina es. Omitirlo la proyecta como organización, que es lo
   * que hacían todas antes de que esto existiera.
   *
   * Importa porque **el buscador público filtra por este campo**: una farmacia
   * proyectada como organización aparece en `/public/search/organizations` y
   * deja `/public/search/pharmacies` en cero para siempre. Se vio sembrando
   * siete organizaciones y encontrando cero farmacias.
   */
  targetTypeConceptId?: string;
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
    // Idempotente: un sujeto tiene una vitrina, no una por vez que alguien
    // vuelva a verificarlo. Sin esto, reverificar dejaba dos filas para el
    // mismo sujeto —dos enlaces públicos a lo mismo— y el slug, que es único,
    // hacía caer la segunda con un error de base que no nombraba el problema.
    const existente = await this.profilesRepo.findByTarget(em, data.targetId);
    if (existente) return existente.id;

    const profile = this.profilesRepo.create(em, {
      tenantId: data.tenantId,
      targetTypeConceptId:
        data.targetTypeConceptId ?? COMM.PROFILE_TARGET_ORGANIZATION,
      targetId: data.targetId,
      slug: data.slug,
      displayName: data.displayName,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      // Explícita, y no por omisión: el buscador público filtra por
      // visibilidad, así que una vitrina proyectada sin ella queda publicada y
      // a la vez invisible — lo peor de los dos mundos, porque nadie la
      // encuentra y nadie sabe por qué.
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      acceptsReviews: true,
      actorUserId: data.actorUserId,
    });
    await em.flush();
    return profile.id;
  }
}
