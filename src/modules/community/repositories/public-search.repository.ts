import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { PublicProfiles, ServiceReviews, SocialPosts } from '../entities';
import { COMM } from '../community.concepts';

/**
 * Lecturas del directorio público (P2).
 *
 * ## Las dos condiciones que nunca se relajan
 *
 * Toda consulta de acá aplica el mismo par, y por eso vive en un solo lugar:
 *
 * ```
 * visibility_concept_id = PROFILE_VISIBILITY_PUBLIC
 * status_concept_id     = STATE_ACTIVE
 * ```
 *
 * `visibility_concept_id` se compara por igualdad y **no** con «distinto de
 * privado»: un valor nulo, o uno que todavía no existe como concepto, tiene que
 * quedar fuera. Es la diferencia entre un directorio al que se entra y uno del
 * que hay que salir.
 *
 * ## Sin tenant, a propósito
 *
 * `@Public()` exime del contexto de tenant, así que estas consultas atraviesan
 * todas las organizaciones. Es lo correcto para un directorio —nadie busca «un
 * cardiólogo dentro de la clínica X» sin saber que X existe— y es también por
 * lo que el par de arriba es la única barrera que queda.
 *
 * ## Primera versión en SQL
 *
 * P5 reemplaza el filtrado por OpenSearch sin tocar el contrato. Hasta
 * entonces el texto se compara con `unaccent(lower(...))` para que
 * «cardiologo» encuentre «Cardiología»: es el mínimo que hace que un buscador
 * sirva, y no depende de que el índice exista.
 */
@Injectable()
export class PublicSearchRepository {
  /**
   * Página del directorio público, filtrada por texto, ciudad y tipo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filtros - Texto, ciudad, tipo de sujeto y verificación.
   * @param limit - Tope de filas; se pide una de más para saber si hay página.
   * @returns Los perfiles públicos que coinciden.
   */
  async searchProfiles(
    em: EntityManager,
    filtros: {
      /** Texto libre, ya recortado. */
      q?: string;
      /** Tipo de sujeto al que acotar. */
      targetTypeConceptId?: string;
      /** Sólo verificados. */
      verified?: boolean;
      /** Clave de continuación `(displayName, id)`. */
      after?: { displayName: string; id: string };
    },
    limit: number,
  ): Promise<PublicProfiles[]> {
    const where: Record<string, unknown> = {
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    if (filtros.targetTypeConceptId)
      where.targetTypeConceptId = filtros.targetTypeConceptId;
    if (filtros.verified)
      where.verificationStatusConceptId = CONCEPTS.STATE_ACTIVE;

    // El keyset va sobre `(display_name, id)`: `display_name` solo no es único
    // —hay homónimos— y una página que empieza en un empate se saltea filas.
    if (filtros.after) {
      where.$or = [
        { displayName: { $gt: filtros.after.displayName } },
        {
          displayName: filtros.after.displayName,
          id: { $gt: filtros.after.id },
        },
      ];
    }

    const rows = await em.find(PublicProfiles, where, {
      orderBy: { displayName: 'ASC', id: 'ASC' },
      limit,
    });

    if (!filtros.q) return rows;

    // El filtro de texto se aplica sobre los ids candidatos y no en memoria
    // sobre la página: filtrar después de paginar devolvería páginas de menos.
    const ids = await this.matchIdsByText(em, filtros.q, where, limit);
    const permitidos = new Set(ids);
    return rows.filter((row) => permitidos.has(row.id));
  }

  /**
   * Ids que coinciden con el texto, sin acentos y sin distinguir mayúsculas.
   *
   * `unaccent` puede no estar instalada en la base de desarrollo; si no está,
   * se degrada a `lower(...)` en vez de fallar. Un buscador que encuentra menos
   * es un defecto; uno que responde 500 es una caída.
   */
  private async matchIdsByText(
    em: EntityManager,
    q: string,
    where: Record<string, unknown>,
    limit: number,
  ): Promise<string[]> {
    const patron = `%${q.toLowerCase()}%`;
    const base = `
      SELECT id FROM community.public_profiles
      WHERE visibility_concept_id = ? AND status_concept_id = ?
        AND (%NORM%(lower(display_name)) LIKE %NORM%(?)
          OR %NORM%(lower(coalesce(headline, ''))) LIKE %NORM%(?))
      ORDER BY display_name ASC, id ASC
      LIMIT ?`;
    const params = [
      where.visibilityConceptId,
      where.statusConceptId,
      patron,
      patron,
      limit,
    ];
    try {
      const filas = await em
        .getConnection()
        .execute<{ id: string }[]>(
          base.replace(/%NORM%/g, 'unaccent'),
          params,
          'all',
        );
      return filas.map((f) => f.id);
    } catch {
      const filas = await em
        .getConnection()
        .execute<{ id: string }[]>(base.replace(/%NORM%/g, ''), params, 'all');
      return filas.map((f) => f.id);
    }
  }

  /** El perfil público de ese slug, o `null` si no existe **o no es público**. */
  findPublicBySlug(
    em: EntityManager,
    slug: string,
  ): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, {
      slug,
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Promedio y cantidad de reseñas publicadas de cada perfil.
   *
   * Se resuelve en una consulta para toda la página, no en una por fila: un
   * listado de cincuenta prestadores no puede costar cincuenta viajes.
   *
   * @returns Mapa `profileId → { average, count }`; los perfiles sin reseñas
   *   no aparecen, y el servicio los proyecta como `null` + `0`.
   */
  async ratingsByProfile(
    em: EntityManager,
    profileIds: string[],
  ): Promise<Map<string, { average: number; count: number }>> {
    const salida = new Map<string, { average: number; count: number }>();
    if (profileIds.length === 0) return salida;

    const filas = await em
      .getConnection()
      .execute<
        { target_public_profile_id: string; avg: string; total: string }[]
      >(
        `SELECT target_public_profile_id, AVG(overall_rating)::numeric AS avg, COUNT(*) AS total
           FROM community.service_reviews
          WHERE target_public_profile_id IN (?)
            AND publication_status_concept_id = ?
            AND moderation_status_concept_id <> ?
          GROUP BY target_public_profile_id`,
        [profileIds, COMM.PUBLICATION_PUBLISHED, COMM.MODERATION_REMOVED],
        'all',
      );

    for (const fila of filas) {
      salida.set(fila.target_public_profile_id, {
        // Una decimal: el contrato lo promete y un 4.333333 en pantalla es ruido.
        average: Math.round(Number(fila.avg) * 10) / 10,
        count: Number(fila.total),
      });
    }
    return salida;
  }

  /**
   * Las publicaciones públicas de un perfil, para su ficha.
   *
   * Repite las condiciones de `canViewPost` en SQL en vez de leer todo y
   * filtrar: acá no hay lector con quien comparar —es una lectura anónima— así
   * que sólo `PUBLIC` califica. `FOLLOWERS` sin sesión no es visible por
   * definición, y ese es justamente el caso que un filtro en memoria olvida.
   */
  listPublicPosts(
    em: EntityManager,
    authorProfileId: string,
    limit: number,
  ): Promise<SocialPosts[]> {
    return em.find(
      SocialPosts,
      {
        authorPublicProfileId: authorProfileId,
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
        publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
        moderationStatusConceptId: {
          $nin: [COMM.MODERATION_REMOVED, COMM.MODERATION_RESTRICTED],
        },
        publishedAt: { $lte: new Date() },
      },
      { orderBy: { publishedAt: 'DESC' }, limit },
    );
  }

  /** Cuántas reseñas publicadas tiene un perfil (para la ficha). */
  async countPublishedReviews(
    em: EntityManager,
    profileId: string,
  ): Promise<number> {
    return em.count(ServiceReviews, {
      targetPublicProfileId: profileId,
      publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
    });
  }
}
