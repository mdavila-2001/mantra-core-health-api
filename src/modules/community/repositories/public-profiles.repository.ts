import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PublicProfiles, VerifiedBadges } from '../entities';
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
   * Archivo de la foto de perfil, si la vitrina nace con una.
   */
  avatarFileId?: string;
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
   * @param filtros - Tenant obligatorio; tipo de sujeto y visibilidad opcionales.
   * @param limit - Tope de filas.
   * @returns Los perfiles, del más reciente al más antiguo.
   */
  findByTenant(
    em: EntityManager,
    filtros: {
      tenantId: string;
      targetTypeConceptId?: string;
      visibilityConceptId?: string;
    },
    limit: number,
  ): Promise<PublicProfiles[]> {
    const where: Record<string, unknown> = { tenantId: filtros.tenantId };
    if (filtros.targetTypeConceptId) {
      where.targetTypeConceptId = filtros.targetTypeConceptId;
    }
    if (filtros.visibilityConceptId) {
      where.visibilityConceptId = filtros.visibilityConceptId;
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
   * La vitrina **publicada** que usa ese archivo como retrato o portada.
   *
   * Es lo que autoriza a servir esos bytes sin sesión: no se pregunta «¿existe
   * este archivo?» sino «¿lo está publicando alguien?». Un archivo que nadie
   * publica no se sirve, y por eso `/public/media` no es un servidor de
   * archivos abierto sino la cara visible de una vitrina.
   *
   * La visibilidad se compara acá y no en el servicio: una consulta que
   * devolviera perfiles privados dejaría la decisión en manos de quien la use,
   * y basta olvidarla una vez.
   */
  findPublicByMedia(
    em: EntityManager,
    fileId: string,
    visibilidadPublica: string,
  ): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, {
      visibilityConceptId: visibilidadPublica,
      $or: [{ avatarFileId: fileId }, { coverFileId: fileId }],
    });
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
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
