import type { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CONCEPTS, ResourceNotFoundException, touch } from '../../../common';
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
 * Lo editable de la vitrina de una organización ya proyectada.
 *
 * Cada campo es opcional y **omitirlo conserva lo que haya**: es la misma
 * regla que `PUT /community/profiles/me`, y la que deja que una pantalla que
 * sólo cambia la portada no borre la biografía sin quererlo. `null` explícito
 * sí quita el valor.
 */
export interface OrganizationVitrinaUpdate {
  /** Sujeto del perfil. Para una organización es su propio `tenantId`. */
  targetId: string;
  /** Nombre visible; omitido conserva el que proyectó la verificación. */
  displayName?: string;
  /** Titular corto: qué es este centro en una línea. */
  headline?: string | null;
  /** Presentación larga. */
  biography?: string | null;
  /** Logo, ya subido. */
  avatarFileId?: string | null;
  /** Portada, ya subida. */
  coverFileId?: string | null;
  /** Quién hace el cambio, para la auditoría. */
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

  /**
   * Llena la vitrina de una organización ya proyectada.
   *
   * ## El hueco que cierra
   *
   * `projectOrganization` escribe **nombre y slug, nada más**: es todo lo que
   * la verificación de un tenant sabe. Con eso, la ficha pública de una clínica
   * queda con el título y el resto en blanco —sin foto, sin portada, sin una
   * línea que diga qué es— y no había forma de completarla: un profesional
   * edita la suya por `PUT /community/profiles/me`, pero ese endpoint resuelve
   * el sujeto desde la sesión (perfil profesional o cuenta) y el sujeto de una
   * organización es el tenant, que ninguna sesión «es». Una organización no
   * podía llenar su propia vitrina por ninguna vía.
   *
   * Eso explicaba, entero, por qué el directorio de centros de salud se veía
   * vacío: no era la pantalla, era que no había nada que pintar.
   *
   * Idempotente y parcial: sólo escribe los campos presentes.
   *
   * @param em - Transacción activa del caso de uso llamador.
   * @param data - Sujeto y campos a cambiar.
   * @returns Identificador del perfil actualizado.
   * @throws ResourceNotFoundException si el sujeto no tiene vitrina proyectada.
   */
  async updateOrganizationVitrina(
    em: EntityManager,
    data: OrganizationVitrinaUpdate,
  ): Promise<string> {
    const profile = await this.profilesRepo.findByTarget(em, data.targetId);
    // Sin vitrina no hay nada que editar, y crearla acá saltearía la
    // verificación, que es lo único que decide si una organización es pública.
    if (!profile)
      throw new ResourceNotFoundException(
        'Esta organización todavía no tiene vitrina pública: se proyecta al verificarla',
        { targetId: data.targetId },
      );

    if (data.displayName !== undefined) profile.displayName = data.displayName;
    if (data.headline !== undefined)
      profile.headline = data.headline ?? undefined;
    if (data.biography !== undefined)
      profile.biography = data.biography ?? undefined;
    if (data.avatarFileId !== undefined)
      profile.avatarFileId = data.avatarFileId ?? undefined;
    if (data.coverFileId !== undefined)
      profile.coverFileId = data.coverFileId ?? undefined;

    touch(profile, data.actorUserId);
    await em.flush();
    return profile.id;
  }
}
