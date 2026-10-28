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
// Directo y no por el barrel: el barrel re-exporta servicios que importan éste.
import { CommunityOrganizationStaffService } from './community-organization-staff.service';

/** Por qué un actor puede leer la mensajería de un perfil. */
export type MessagingProfileAccess =
  'PLATFORM' | 'HOLDER' | 'ORGANIZATION_STAFF';

/** Lo que hace falta de un perfil para decidir su titularidad. */
type HolderProfile = {
  targetId: string;
  targetTypeConceptId: string;
  statusConceptId: string;
  createdByUserId?: string | null;
};

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
 * los sujetos que el token ya declara —el usuario (`sub`) y su perfil
 * profesional (`hpid`)— o por `created_by_user_id = actor` (los que alguien creó
 * para sí). La vitrina de un **tenant** (farmacia, clínica) es la excepción:
 * su titularidad es una membresía activa OWNER/ADMIN, no quien la creó (ver
 * `isHolder`), y su bandeja la atiende además el STAFF (sólo mensajería).
 */
@Injectable()
export class CommunityVisibilityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param profilesRepo - Perfiles públicos, de donde sale el titular.
   * @param followsRepo - Follows activos, que resuelven el nivel FOLLOWERS.
   * @param blocksRepo - Bloqueos entre perfiles.
   * @param organizationStaff - Quién atiende la bandeja de una organización.
   */
  constructor(
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly organizationStaff: CommunityOrganizationStaffService,
  ) {}

  /** `true` si el actor tiene un rol de plataforma. */
  isPlatform(actor: AuthenticatedUser): boolean {
    const roles = actor.roles ?? [];
    return PLATFORM_ROLES.some((role) => roles.includes(role));
  }

  /**
   * Los sujetos que una sesión representa en el grafo social.
   *
   * Un profesional es su **perfil profesional** —así su vitrina sobrevive a un
   * cambio de cuenta y apunta a quien ejerce, no a quien inicia sesión—; toda
   * cuenta se representa además a sí misma. Los dos claims (`hpid` y `sub`) ya
   * viajan en el token, así que no hace falta preguntarle nada a `profiles`.
   *
   * **Por qué es una lista y no un valor.** Antes cada cara del módulo resolvía
   * el sujeto por su cuenta y las dos no coincidían: la escritura creaba la
   * vitrina de un profesional con `target_id = hpid` y la lectura la buscaba por
   * `target_id = sub`. El resultado era que un profesional no resolvía su propio
   * perfil al leer, y sus publicaciones `FOLLOWERS` o `PRIVATE` desaparecían de
   * su propio muro: `canViewPost` recibía un lector sin perfil y ningún perfil
   * puede seguirse a sí mismo. Con una sola resolución compartida, las dos caras
   * hablan del mismo sujeto.
   *
   * El orden importa: el perfil profesional va primero porque es el sujeto que
   * el módulo escribe cuando existe.
   */
  private subjects(actor: AuthenticatedUser): string[] {
    return actor.practitionerProfileId
      ? [actor.practitionerProfileId, actor.id]
      : [actor.id];
  }

  /**
   * `true` si el perfil es de alguno de los sujetos que la sesión representa.
   *
   * ## La vitrina de un tenant no es de quien la creó
   *
   * `created_by_user_id = actor` reconoce los perfiles que alguien creó para
   * sí. Pero la vitrina de una organización (farmacia, clínica) la crea el
   * administrador de plataforma que verificó el tenant, o quien subió su logo,
   * que puede haber dejado la organización. Con esa cláusula los dos firmaban
   * como la farmacia para siempre. Para una vitrina **de tenant**
   * ({@link CommunityOrganizationStaffService.isTenantBacked}) la titularidad
   * es una membresía activa OWNER o ADMIN; `created_by_user_id` no cuenta.
   *
   * Las vitrinas de tipo organización que no son de un tenant (SupportAdmin,
   * con `target_id` = la cuenta del sistema; una unidad diagnóstica) siguen la
   * regla de siempre.
   */
  private async isHolder(
    em: EntityManager,
    profile: HolderProfile | null,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (!profile) return false;
    if (this.subjects(actor).includes(profile.targetId)) return true;
    if (await this.organizationStaff.isTenantBacked(em, profile)) {
      return this.organizationStaff.canAdminister(em, profile, actor);
    }
    return profile.createdByUserId === actor.id;
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
    if (await this.isHolder(em, profile, actor)) return;
    throw new ForbiddenException(
      'Sólo el titular del perfil puede leer su contenido privado',
    );
  }

  /**
   * Exige que el actor pueda **actuar como** ese perfil, sin excepción de rol.
   *
   * Es la versión de {@link assertOwnProfile} que gobierna las escrituras, y se
   * distingue en una sola cosa: **no hay atajo de plataforma**.
   *
   * Leer el contenido de otro con rol de moderación es el trabajo de un
   * moderador; escribir en nombre de otro no lo es de nadie. Si `SECURITY_ADMIN`
   * pasara por acá, un administrador podría publicar, comentar, reaccionar,
   * seguir o bloquear firmando con el perfil de cualquier profesional, y la
   * autoría del muro dejaría de significar algo. La suplantación no es un
   * privilegio de moderación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Perfil con el que el actor pretende escribir.
   * @param actor - Quien pide la escritura.
   * @throws ForbiddenException si ese perfil no es suyo.
   */
  async assertActsAsProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const profile = await this.profilesRepo.findById(em, profileId);
    if (await this.isHolder(em, profile, actor)) return;
    throw new ForbiddenException(
      'No se puede escribir en el grafo social con un perfil ajeno',
    );
  }

  /**
   * {@link assertOwnProfile} para la **mensajería**: además del titular, pasa
   * el personal que atiende la bandeja de una vitrina de organización
   * (ver {@link CommunityOrganizationStaffService.canAttend}).
   *
   * Sólo la mensajería lo usa. Publicar, reseñar, seguir o bloquear como la
   * organización exigen la titularidad estricta, que para una vitrina de
   * tenant es membresía OWNER/ADMIN: el STAFF atiende el chat, no firma el muro.
   *
   * @returns Por qué pasa. `ORGANIZATION_STAFF` es un acceso **revocable**
   *   (depende de una membresía): quien lo conserve en el tiempo —el gateway,
   *   con un socket abierto— tiene que volver a validarlo.
   * @throws ForbiddenException si el perfil no es suyo ni de una organización
   *   cuya bandeja atiende.
   */
  async assertOwnMessagingProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<MessagingProfileAccess> {
    if (this.isPlatform(actor)) return 'PLATFORM';
    const profile = await this.profilesRepo.findById(em, profileId);
    const access = await this.messagingAccess(em, profile, actor);
    if (access) return access;
    throw new ForbiddenException(
      'Sólo el titular del perfil puede leer su contenido privado',
    );
  }

  /**
   * {@link assertActsAsProfile} para la **mensajería**: escribir en un hilo
   * como el perfil. Sin atajo de plataforma; además del titular pasa el
   * personal que atiende la bandeja de una vitrina de organización.
   *
   * @throws ForbiddenException si no puede escribir con ese perfil.
   */
  async assertActsAsMessagingProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const profile = await this.profilesRepo.findById(em, profileId);
    if (await this.messagingAccess(em, profile, actor)) return;
    throw new ForbiddenException(
      'No se puede escribir en el grafo social con un perfil ajeno',
    );
  }

  /**
   * Por qué el actor puede usar ese perfil en la mensajería, o `null`.
   *
   * La vitrina de un tenant se decide **sólo** por membresía
   * ({@link CommunityOrganizationStaffService.canAttend}) y es siempre un
   * acceso revocable (`ORGANIZATION_STAFF`), también para OWNER y ADMIN: el
   * gateway lo vuelve a validar mientras el socket viva.
   */
  private async messagingAccess(
    em: EntityManager,
    profile: HolderProfile | null,
    actor: AuthenticatedUser,
  ): Promise<'HOLDER' | 'ORGANIZATION_STAFF' | null> {
    if (!profile) return null;
    if (this.subjects(actor).includes(profile.targetId)) return 'HOLDER';
    if (await this.organizationStaff.isTenantBacked(em, profile)) {
      return (await this.organizationStaff.canAttend(em, profile, actor))
        ? 'ORGANIZATION_STAFF'
        : null;
    }
    return profile.createdByUserId === actor.id ? 'HOLDER' : null;
  }

  /**
   * Resuelve, contra la sesión, con qué perfil está leyendo el actor.
   *
   * **Por qué existe.** Las lecturas del módulo recibían el perfil del lector en
   * un parámetro de consulta (`?actorProfileId=`), y ninguna lo verificaba. Como
   * `canViewPost` concede la lectura de entrada cuando el lector *es* el autor,
   * bastaba con pasar el id del autor para leer una publicación `PRIVATE` ajena
   * —y con omitir el parámetro para que no se evaluara ningún bloqueo—. La regla
   * de visibilidad estaba bien escrita; lo que estaba mal era de dónde venía su
   * insumo. **La identidad del lector no puede llegar en la petición.**
   *
   * Se sigue admitiendo el parámetro porque un actor puede tener más de un
   * perfil (el suyo de usuario y el de la organización que administra) y hace
   * falta poder elegir; pero se admite sólo si es **suyo**, con la misma prueba
   * de titularidad que `assertOwnProfile`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Quien pide la lectura.
   * @param requested - Perfil que el cliente pidió usar, si pidió alguno.
   * @returns El perfil con el que se evalúa la visibilidad, o `undefined` si el
   *   actor no tiene perfil público (lee como cualquier sesión, sin privilegio).
   * @throws ForbiddenException si pidió un perfil que no es suyo.
   */
  async resolveActorProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
    requested?: string,
  ): Promise<string | undefined> {
    if (requested) {
      // La plataforma puede mirar con cualquier perfil: es su trabajo moderar.
      if (this.isPlatform(actor)) return requested;
      await this.assertOwnProfile(em, requested, actor);
      return requested;
    }
    // Se prueban los sujetos en orden —perfil profesional antes que cuenta—
    // porque es el orden en que el módulo los escribe.
    for (const subject of this.subjects(actor)) {
      const own = await this.profilesRepo.findByTarget(em, subject);
      if (own) return own.id;
    }
    return undefined;
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
