import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import type { SocialPosts } from '../entities';
import {
  BlocksRepository,
  FollowsRepository,
  PublicProfilesRepository,
} from '../repositories';
import { COMM } from '../community.concepts';

/** Roles de plataforma que leen cualquier perfil. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN', 'SYSTEM'];

/**
 * Decide qué puede ver cada actor dentro de la red social.
 *
 * Las tres reglas que aplican a *toda* lectura del módulo viven acá y no
 * repetidas endpoint por endpoint, porque una regla de visibilidad que se
 * escribe catorce veces se olvida en la decimoquinta, y el que se olvida es el
 * caso que filtra:
 *
 * 1. **Propiedad**: las lecturas privadas (feed, marcadores, bloqueos,
 *    conversaciones, notificaciones) son del titular del perfil, no de
 *    cualquiera que sepa su uuid.
 * 2. **Bloqueo**: si media un bloqueo en *cualquier* dirección, ninguno de los
 *    dos ve el contenido del otro. Bloquear en un solo sentido dejaría al
 *    bloqueado leyendo a quien lo bloqueó, que es justo lo que se quiso evitar.
 * 3. **Visibilidad declarada**: `PUBLIC` la ve cualquiera, `FOLLOWERS` sólo
 *    quien sigue al autor con un follow activo, `PRIVATE` sólo el autor.
 *
 * Sobre la propiedad hay una limitación conocida: **no existe tabla que ate
 * `iam.users` con `community.public_profiles`**. El vínculo es polimórfico
 * (`target_type_concept_id` + `target_id`), así que el titular se reconoce por
 * `target_id = actor` (perfiles de usuario) o por `created_by_user_id = actor`
 * (los que alguien creó para sí). Un perfil de profesional u organización que
 * creó otro administrador no lo reconoce como propio: hasta que el modelo
 * declare el vínculo formal, ese caso pasa por rol de plataforma.
 */
@Injectable()
export class CommunityVisibilityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param profilesRepo - Perfiles públicos, de donde sale el titular.
   * @param followsRepo - Follows activos, que resuelven el nivel FOLLOWERS.
   * @param blocksRepo - Bloqueos entre perfiles.
   */
  constructor(
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly blocksRepo: BlocksRepository,
  ) {}

  /** `true` si el actor tiene un rol de plataforma. */
  isPlatform(actor: AuthenticatedUser): boolean {
    const roles = actor.roles ?? [];
    return PLATFORM_ROLES.some((role) => roles.includes(role));
  }

  /**
   * Exige que el perfil pertenezca al actor, o que el actor sea plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Perfil público cuyo contenido privado se quiere leer.
   * @param actor - Quien pide la lectura.
   * @throws ForbiddenException si el perfil no es suyo.
   */
  async assertOwnProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isPlatform(actor)) return;
    const profile = await this.profilesRepo.findById(em, profileId);
    if (
      profile &&
      (profile.targetId === actor.id || profile.createdByUserId === actor.id)
    )
      return;
    throw new ForbiddenException(
      'Sólo el titular del perfil puede leer su contenido privado',
    );
  }

  /** ¿Hay un bloqueo activo entre estos dos perfiles, en cualquier sentido? */
  async isBlockedBetween(
    em: EntityManager,
    profileA: string,
    profileB: string,
  ): Promise<boolean> {
    if (profileA === profileB) return false;
    const block = await this.blocksRepo.existsBetween(
      em,
      profileA,
      profileB,
      CONCEPTS.STATE_ACTIVE,
    );
    return block !== null;
  }

  /** ¿El seguidor sigue al perfil con un follow activo? */
  private async followsProfile(
    em: EntityManager,
    followerProfileId: string,
    followedProfileId: string,
  ): Promise<boolean> {
    const follow = await this.followsRepo.findByFollowerTarget(
      em,
      followerProfileId,
      COMM.FOLLOWABLE_PROFILE,
      followedProfileId,
    );
    return follow?.statusConceptId === CONCEPTS.STATE_ACTIVE;
  }

  /**
   * ¿Puede este actor leer este post?
   *
   * Un `visibility_concept_id` nulo se trata como público: son las
   * publicaciones anteriores a que el módulo declarara los conceptos de
   * visibilidad, y esconderlas ahora las haría desaparecer de muros donde ya
   * estaban.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param post - Post a evaluar.
   * @param actorProfileId - Perfil del lector, si tiene uno.
   * @returns `true` si el post es legible por ese lector.
   */
  async canViewPost(
    em: EntityManager,
    post: Pick<SocialPosts, 'authorPublicProfileId' | 'visibilityConceptId'>,
    actorProfileId?: string,
  ): Promise<boolean> {
    const author = post.authorPublicProfileId;
    if (actorProfileId === author) return true;

    if (
      actorProfileId &&
      (await this.isBlockedBetween(em, actorProfileId, author))
    )
      return false;

    switch (post.visibilityConceptId) {
      case COMM.POST_VISIBILITY_PRIVATE:
        return false;
      case COMM.POST_VISIBILITY_FOLLOWERS:
        return actorProfileId
          ? await this.followsProfile(em, actorProfileId, author)
          : false;
      default:
        return true;
    }
  }

  /**
   * Filtra una página de posts dejando sólo los que el lector puede ver.
   *
   * Resuelve los bloqueos y los follows de todos los autores de la página en
   * dos consultas, no en dos por post: un muro de cincuenta publicaciones no
   * puede costar cien viajes a la base.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param posts - Página de posts a filtrar.
   * @param actorProfileId - Perfil del lector, si tiene uno.
   * @returns Los posts visibles, en el mismo orden.
   */
  async filterVisiblePosts<
    T extends Pick<
      SocialPosts,
      'authorPublicProfileId' | 'visibilityConceptId'
    >,
  >(em: EntityManager, posts: T[], actorProfileId?: string): Promise<T[]> {
    if (posts.length === 0) return posts;
    if (!actorProfileId)
      return posts.filter(
        (post) =>
          post.visibilityConceptId !== COMM.POST_VISIBILITY_PRIVATE &&
          post.visibilityConceptId !== COMM.POST_VISIBILITY_FOLLOWERS,
      );

    const authors = [...new Set(posts.map((p) => p.authorPublicProfileId))];
    const [blocked, followed] = await Promise.all([
      this.blocksRepo.listBlockedPeers(
        em,
        actorProfileId,
        authors,
        CONCEPTS.STATE_ACTIVE,
      ),
      this.followsRepo.listFollowedProfileIds(
        em,
        actorProfileId,
        authors,
        COMM.FOLLOWABLE_PROFILE,
        CONCEPTS.STATE_ACTIVE,
      ),
    ]);
    const blockedSet = new Set(blocked);
    const followedSet = new Set(followed);

    return posts.filter((post) => {
      const author = post.authorPublicProfileId;
      if (author === actorProfileId) return true;
      if (blockedSet.has(author)) return false;
      switch (post.visibilityConceptId) {
        case COMM.POST_VISIBILITY_PRIVATE:
          return false;
        case COMM.POST_VISIBILITY_FOLLOWERS:
          return followedSet.has(author);
        default:
          return true;
      }
    });
  }
}
