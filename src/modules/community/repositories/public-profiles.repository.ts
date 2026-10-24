import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PublicProfiles, VerifiedBadges } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import { COMM } from '../community.concepts';
import {
  containsPattern,
  normalizeSearchText,
  sqlSearchKey,
} from '../../terminology/repositories/glossary-search.sql';

const SEARCH_ACCENTS: Readonly<Record<string, readonly string[]>> = {
  a: ['á'],
  e: ['é'],
  i: ['í'],
  o: ['ó'],
  u: ['ú', 'ü'],
  n: ['ñ'],
};

/**
 * Consulta por prefijo para el GIN existente de perfiles públicos.
 *
 * Incluye variantes castellanas de una tilde por palabra: así `maria`
 * selecciona `María` desde el índice antes de aplicar la comparación exacta
 * normalizada. Sólo interpola letras y números extraídos localmente; el valor
 * final sigue viajando como parámetro SQL.
 */
function prefixTsQuery(text: string): string {
  const tokens = normalizeSearchText(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (tokens.length === 0) return "'__sin_terminos__':*";

  return tokens
    .map((token) => {
      const variants = new Set([token]);
      [...token].forEach((letter, index) => {
        for (const accented of SEARCH_ACCENTS[letter] ?? []) {
          variants.add(
            `${token.slice(0, index)}${accented}${token.slice(index + 1)}`,
          );
        }
      });
      return `(${[...variants].map((variant) => `'${variant}':*`).join(' | ')})`;
    })
    .join(' & ');
}

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
   * Identificador asociado a visibility concept.
   *
   * Ausente deja la columna nula, que el directorio público lee como **no
   * publicado** (ver `PROFILE_VISIBILITY_CONCEPT_BY_CODE`). Aparecer en el
   * directorio es opt-in explícito, así que el alta no lo asume.
   */
  visibilityConceptId?: string;
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
  /** Archivo del avatar, ya subido. */
  avatarFileId?: string;
  /** Archivo de la portada, ya subido. */
  coverFileId?: string;
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
   * Varios perfiles por id, para hidratar autores de una página.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Perfiles a traer.
   * @returns Los perfiles existentes, sin orden garantizado.
   */
  listByIds(em: EntityManager, ids: string[]): Promise<PublicProfiles[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PublicProfiles, { id: { $in: ids } });
  }

  /**
   * Personas activas que se pueden elegir para iniciar un chat.
   *
   * Es una lectura autenticada y deliberadamente distinta del directorio
   * público: también incluye perfiles de pacientes (`PROFILE_TARGET_USER`),
   * pero sólo devuelve el ancla social mínima que necesita la mensajería.
   */
  searchChatContacts(
    em: EntityManager,
    options: { ownProfileId: string; q: string; limit: number },
  ): Promise<PublicProfiles[]> {
    return this.searchChatContactIds(em, options).then((ids) => {
      if (ids.length === 0) return [];
      return em.find(
        PublicProfiles,
        { id: { $in: ids } },
        { orderBy: { displayName: 'ASC', id: 'ASC' } },
      );
    });
  }

  /**
   * Filtra consentimiento y bloqueos antes de hidratar perfiles. Primero usa
   * el GIN `gin_public_profiles_search` para acotar por prefijos de palabras;
   * después confirma la coincidencia sin tildes con funciones nativas. Este
   * esquema no instala la extensión `unaccent`.
   */
  private async searchChatContactIds(
    em: EntityManager,
    options: { ownProfileId: string; q: string; limit: number },
  ): Promise<string[]> {
    const sql = `
      SELECT p.id
        FROM community.public_profiles p
       WHERE p.id <> ?
         AND p.status_concept_id = ?
         AND p.visibility_concept_id = ?
         AND p.target_type_concept_id IN (?, ?)
         AND to_tsvector(
               'simple',
               (coalesce(p.display_name, '') || ' ' || coalesce(p.headline, ''))
             ) @@ to_tsquery('simple', ?)
         AND ${sqlSearchKey('p.display_name')} LIKE ?
         AND NOT EXISTS (
           SELECT 1
             FROM community.user_blocks b
            WHERE b.status_concept_id = ?
              AND ((b.blocker_profile_id = ? AND b.blocked_profile_id = p.id)
                OR (b.blocker_profile_id = p.id AND b.blocked_profile_id = ?))
         )
       ORDER BY p.display_name ASC, p.id ASC
       LIMIT ?`;
    const params = [
      options.ownProfileId,
      CONCEPTS.STATE_ACTIVE,
      COMM.PROFILE_VISIBILITY_PUBLIC,
      COMM.PROFILE_TARGET_USER,
      COMM.PROFILE_TARGET_PRACTITIONER,
      prefixTsQuery(options.q),
      containsPattern(normalizeSearchText(options.q)),
      CONCEPTS.STATE_ACTIVE,
      options.ownProfileId,
      options.ownProfileId,
      options.limit,
    ];

    const rows = await em
      .getConnection()
      .execute<{ id: string }[]>(sql, params, 'all');
    return rows.map((row) => row.id);
  }

  /**
   * Sellos de verificación vigentes de un sujeto.
   *
   * No filtra por tipo de sujeto porque el módulo todavía no declara conceptos
   * para esa columna; el id del perfil ya es único, así que acotar por él es
   * exacto sin inventar un concepto que el modelo no tiene.
   *
   * Vigencia: se descartan los sellos cuya ventana `valid_from`/`valid_to` no
   * cubre el momento de la consulta — un sello vencido que se sigue mostrando
   * es peor que ninguno.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectRefId - Sujeto del sello (aquí, el perfil público).
   * @param activeStatusConceptId - Estado que cuenta como vigente.
   * @param now - Momento contra el que se evalúa la ventana.
   * @returns Sellos vigentes del sujeto.
   */
  listBadgesBySubject(
    em: EntityManager,
    subjectRefId: string,
    activeStatusConceptId: string,
    now: Date,
  ): Promise<VerifiedBadges[]> {
    return em.find(
      VerifiedBadges,
      {
        subjectRefId,
        statusConceptId: activeStatusConceptId,
        $and: [
          { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
          { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
        ],
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PublicProfiles`.
   */
  /**
   * Perfiles públicos de un tenant — la vitrina de la red social.
   *
   * Existía la escritura y ninguna lectura: se podían crear perfiles públicos y
   * no había forma de listarlos, así que la red social no se podía mostrar. Es
   * el mismo agujero que tenía el mayor contable.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Tenant obligatorio; tipo de sujeto y visibilidad opcionales.
   * @param limit - Tope de filas.
   * @returns Los perfiles, del más reciente al más antiguo.
   */
  findByTenant(
    em: EntityManager,
    filters: {
      tenantId: string;
      targetTypeConceptId?: string;
      visibilityConceptId?: string;
    },
    limit: number,
  ): Promise<PublicProfiles[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.targetTypeConceptId) {
      where.targetTypeConceptId = filters.targetTypeConceptId;
    }
    if (filters.visibilityConceptId) {
      where.visibilityConceptId = filters.visibilityConceptId;
    }
    return em.find(PublicProfiles, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
    });
  }

  /**
   * El perfil público de un sujeto concreto — un profesional, una organización.
   *
   * Es la lectura que hace falta para «ver el perfil de este médico»: se llega
   * por quién es, no por el id del perfil, que nadie conoce de antemano.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetId - Sujeto del perfil.
   * @returns El perfil, o `null` si ese sujeto no tiene vitrina.
   */
  findByTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, { targetId });
  }

  /**
   * El perfil público por su dirección legible.
   *
   * Es lo que hace falta para comprobar que un slug esté libre antes de
   * asignarlo: dos vitrinas con el mismo texto serían dos enlaces que llevan a
   * personas distintas según cuál resuelva primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param slug - La dirección legible.
   * @returns El perfil, o `null` si el slug está libre.
   */
  findBySlug(em: EntityManager, slug: string): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, { slug });
  }

  /**
   * Si un archivo es el avatar o la portada de alguna vitrina pública.
   *
   * Es la puerta de `GET /public/media/:id` (P2): antes de servir un archivo
   * al internet anónimo hay que saber que es de verdad la foto de **una
   * vitrina publicada**, y no cualquier imagen de sensibilidad normal que
   * alguien suba y adivine el id — `FileUploadService.downloadPublicMedia`
   * conoce el archivo, pero no sabe qué es una vitrina.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - El archivo a comprobar.
   */
  async isPublicMedia(em: EntityManager, fileId: string): Promise<boolean> {
    const row = await em.findOne(PublicProfiles, {
      $and: [
        { $or: [{ avatarFileId: fileId }, { coverFileId: fileId }] },
        { visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC },
        { statusConceptId: CONCEPTS.STATE_ACTIVE },
      ],
    });
    return row !== null;
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
        visibilityConceptId: data.visibilityConceptId,
        verificationStatusConceptId: CONCEPTS.STATE_PENDING,
        acceptsReviews: data.acceptsReviews ?? true,
        commentsDefaultEnabled: data.commentsDefaultEnabled ?? true,
        avatarFileId: data.avatarFileId,
        coverFileId: data.coverFileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
