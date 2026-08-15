import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReviewsRepository } from '../repositories';
import { COMM } from '../community.concepts';

/** La nota pública de un perfil y cuántas reseñas la sostienen. */
export interface PublicProfileRating {
  /** Media de las reseñas publicadas, en la escala de `overall_rating`. */
  average: number;
  /** Cuántas reseñas publicadas la componen. */
  count: number;
}

/**
 * La calificación pública de un perfil, para quien la muestra desde fuera.
 *
 * Existe para que otros dominios —el buscador de centros de diagnóstico, hoy—
 * puedan ordenar y filtrar por calificación **sin leer `community.service_reviews`
 * por su cuenta**. La regla de qué reseña cuenta (sólo las publicadas) es de
 * este módulo y tiene que seguir siéndolo: si cada consumidor la reimplementa,
 * el día que moderación retire una reseña habrá pantallas que la sigan sumando.
 *
 * Es la contraparte de lectura de `PublicProfileProjectionService`, que ya
 * encapsula la proyección del perfil por el mismo motivo.
 */
@Injectable()
export class CommunityRatingsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reviewsRepo - Acceso a las reseñas de servicio.
   */
  constructor(private readonly reviewsRepo: ReviewsRepository) {}

  /**
   * Calificación media de varios perfiles públicos.
   *
   * @param em - Contexto de persistencia del llamador.
   * @param publicProfileIds - Perfiles cuya nota se pide.
   * @returns La nota por perfil; los perfiles sin reseñas publicadas no figuran.
   */
  ratingsByProfiles(
    em: EntityManager,
    publicProfileIds: readonly string[],
  ): Promise<Map<string, PublicProfileRating>> {
    return this.reviewsRepo.averageByTargets(
      em,
      publicProfileIds,
      COMM.PUBLICATION_PUBLISHED,
    );
  }
}
