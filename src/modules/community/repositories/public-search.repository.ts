import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import {
  PublicProfiles,
  ServiceReviews,
  SocialPosts,
  VerifiedBadges,
} from '../entities';
import { COMM } from '../community.concepts';
import { PROF } from '../../profiles/profiles.concepts';

/**
 * Los estados de un vínculo laboral que se publican en la ficha pública.
 *
 * `DECLARADO` y `APROBADO` —con sus dos alias de v4.1.9, ver
 * `ProfilesAffiliationsService.IDS_ACEPTADOS`—: un vínculo **declarado** sin
 * sede de la plataforma «publica igual, lo que no tiene es el sello de la
 * institución» (mismo criterio que ese servicio documenta), y es el caso más
 * común —una línea de currículum sin sede asociada—. `PENDIENTE`, `RECHAZADO`
 * y `REVOCADO` quedan fuera: no son un hecho confirmado que mostrarle a un
 * anónimo.
 */
const AFFILIATION_ESTADOS_PUBLICOS: readonly string[] = [
  PROF.AFFILIATION_DECLARED,
  PROF.AFFILIATION_APPROVED,
  PROF.AFFILIATION_ACTIVE,
];

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
/** Ciudad y punto de un sujeto; sin coordenadas, `lat`/`lng` van en nulo. */
export interface ProfileLocation {
  /**
   * La calle, tal como se escribe en un sobre.
   *
   * Es `common.addresses.lines`, y va aparte de la ciudad porque la ficha las
   * muestra juntas pero el mapa sólo entiende el punto: quien no tiene
   * coordenadas todavía puede leer dónde queda.
   */
  readonly address: string | null;
  /** Ciudad legible, tal como se muestra. */
  readonly city: string | null;
  /** Latitud, o `null` si la dirección no la tiene cargada. */
  readonly lat: number | null;
  /** Longitud, o `null` si la dirección no la tiene cargada. */
  readonly lng: number | null;
}

/** Un vínculo laboral de la trayectoria pública de un profesional. */
export interface ProfileAffiliation {
  /** Institución, tal como la declaró el profesional. */
  readonly organizationName: string;
  /** Cargo ejercido. */
  readonly roleTitle: string;
  /** Servicio o departamento, si lo declaró. */
  readonly departmentText: string | null;
  /** Inicio del vínculo, como fecha ISO (`YYYY-MM-DD`). */
  readonly startDate: string;
  /** Fin del vínculo, o `null` si sigue vigente. */
  readonly endDate: string | null;
}

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

  /**
   * Perfiles públicos con coordenadas dentro de una caja envolvente.
   *
   * Es la red de «lo más cercano» cuando el índice geográfico no responde. La
   * caja se calcula en grados —barata y con índice— y deja pasar las esquinas
   * que el radio real excluye; el recorte fino por distancia es del servicio,
   * con la misma fórmula que rotula la pantalla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param punto - Centro, radio en km y vertical opcional.
   * @param limit - Tope de filas candidatas.
   * @returns Perfiles con su punto y ciudad.
   */
  async nearbyProfiles(
    em: EntityManager,
    punto: {
      /** Latitud del observador. */
      lat: number;
      /** Longitud del observador. */
      lng: number;
      /** Radio en kilómetros. */
      radiusKm: number;
      /** Vertical al que acotar. */
      targetTypeConceptId?: string;
    },
    limit: number,
  ): Promise<
    Array<{
      /** El perfil público. */
      profile: PublicProfiles;
      /** Latitud de su dirección. */
      lat: number;
      /** Longitud de su dirección. */
      lng: number;
      /** Ciudad, o `null`. */
      city: string | null;
    }>
  > {
    // Un grado de latitud son ~111 km en cualquier parte; uno de longitud se
    // encoge con el coseno de la latitud, y cerca de los polos el divisor se
    // va a cero — de ahí el mínimo, que evita una caja infinita.
    const gradosLat = punto.radiusKm / 111;
    const cos = Math.max(Math.abs(Math.cos((punto.lat * Math.PI) / 180)), 0.01);
    const gradosLng = punto.radiusKm / (111 * cos);

    const filas = await em.getConnection().execute<
      {
        id: string;
        latitude: string;
        longitude: string;
        city: string | null;
      }[]
    >(
      `SELECT DISTINCT ON (pp.id)
                pp.id, a.latitude, a.longitude, a.city
           FROM community.public_profiles pp
           JOIN common.addresses a ON a.owner_id = pp.target_id
          WHERE pp.visibility_concept_id = ?
            AND pp.status_concept_id = ?
            AND (CAST(? AS uuid) IS NULL OR pp.target_type_concept_id = CAST(? AS uuid))
            AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
            AND a.latitude BETWEEN ? AND ?
            AND a.longitude BETWEEN ? AND ?
            AND (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
          ORDER BY pp.id, a.valid_from DESC NULLS LAST
          LIMIT ?`,
      [
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        punto.targetTypeConceptId ?? null,
        punto.targetTypeConceptId ?? null,
        punto.lat - gradosLat,
        punto.lat + gradosLat,
        punto.lng - gradosLng,
        punto.lng + gradosLng,
        limit,
      ],
      'all',
    );

    if (filas.length === 0) return [];

    const perfiles = await em.find(PublicProfiles, {
      id: { $in: filas.map((fila) => fila.id) },
    });
    const porId = new Map(perfiles.map((perfil) => [perfil.id, perfil]));

    return filas.flatMap((fila) => {
      const profile = porId.get(fila.id);
      if (!profile) return [];
      return [
        {
          profile,
          lat: Number(fila.latitude),
          lng: Number(fila.longitude),
          city: fila.city,
        },
      ];
    });
  }

  /**
   * Página de perfiles indexables, en orden estable por id.
   *
   * El reindexado recorre el directorio entero por lotes y no puede permitirse
   * ni saltarse ni repetir filas, así que pagina por clave (`id > after`) y no
   * por `offset`: con `offset`, una alta concurrente durante el barrido corre
   * todas las páginas siguientes y deja perfiles sin indexar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param after - Último id de la página anterior.
   * @param limit - Tamaño del lote.
   * @returns Los perfiles públicos y activos del lote.
   */
  listIndexable(
    em: EntityManager,
    after: string | undefined,
    limit: number,
  ): Promise<PublicProfiles[]> {
    const where: Record<string, unknown> = {
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    if (after) where.id = { $gt: after };
    return em.find(PublicProfiles, where, { orderBy: { id: 'ASC' }, limit });
  }

  /** Cuántos perfiles públicos hay: el denominador de «indexados N de N». */
  countIndexable(em: EntityManager): Promise<number> {
    return em.count(PublicProfiles, {
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Ciudad y coordenadas de cada sujeto, para el índice.
   *
   * Una consulta para todo el lote, no una por perfil: el reindexado completo
   * hace lo mismo que una página del buscador, sólo que muchas veces seguidas,
   * y ahí un viaje por fila sí se nota.
   *
   * Se descartan las direcciones cuya vigencia ya venció y se queda la más
   * reciente por sujeto: un profesional que se mudó aparece donde atiende hoy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ownerIds - Sujetos de los perfiles del lote (`target_id`).
   * @returns Mapa `ownerId → { city, lat, lng }`; sin dirección, no aparece.
   */
  async locationsByOwner(
    em: EntityManager,
    ownerIds: string[],
  ): Promise<Map<string, ProfileLocation>> {
    const salida = new Map<string, ProfileLocation>();
    if (ownerIds.length === 0) return salida;

    const filas = await em.getConnection().execute<
      {
        owner_id: string;
        lines: string | null;
        city: string | null;
        latitude: string | null;
        longitude: string | null;
      }[]
    >(
      `SELECT DISTINCT ON (owner_id) owner_id, lines, city, latitude, longitude
           FROM common.addresses
          WHERE owner_id IN (?)
            AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
          ORDER BY owner_id, valid_from DESC NULLS LAST, updated_at DESC`,
      [ownerIds],
      'all',
    );

    for (const fila of filas) {
      const lat = fila.latitude === null ? null : Number(fila.latitude);
      const lng = fila.longitude === null ? null : Number(fila.longitude);
      // Una dirección sin coordenadas todavía sirve para filtrar por ciudad;
      // lo que no puede es entrar como `geo_point`, que rechaza un nulo.
      const geoValida =
        lat !== null &&
        lng !== null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng);
      if (!geoValida) {
        // Sin punto pero con texto la dirección **sigue sirviendo**: la ficha
        // escribe dónde atiende aunque no pueda dibujar el mapa.
        if (fila.city || fila.lines) {
          salida.set(fila.owner_id, {
            address: fila.lines,
            city: fila.city,
            lat: null,
            lng: null,
          });
        }
        continue;
      }
      salida.set(fila.owner_id, {
        address: fila.lines,
        city: fila.city,
        lat,
        lng,
      });
    }
    return salida;
  }

  /**
   * Especialidades legibles de cada sujeto profesional.
   *
   * Devuelve el `display` del concepto y no su uuid: el índice es una copia
   * pública, y un identificador interno ahí es una fuga que después no se puede
   * deshacer. Se descartan las especialidades vencidas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Sujetos de los perfiles del lote.
   * @returns Mapa `practitionerProfileId → nombres de especialidad`.
   */
  async specialtiesByPractitioner(
    em: EntityManager,
    practitionerProfileIds: string[],
  ): Promise<Map<string, string[]>> {
    const salida = new Map<string, string[]>();
    if (practitionerProfileIds.length === 0) return salida;

    const filas = await em
      .getConnection()
      .execute<{ practitioner_profile_id: string; display: string }[]>(
        `SELECT ps.practitioner_profile_id, cc.display
           FROM profiles.practitioner_specialties ps
           JOIN terminology.catalog_concepts cc ON cc.id = ps.specialty_concept_id
          WHERE ps.practitioner_profile_id IN (?)
            AND (ps.valid_to IS NULL OR ps.valid_to >= CURRENT_DATE)
          ORDER BY ps.is_primary DESC NULLS LAST, cc.display ASC`,
        [practitionerProfileIds],
        'all',
      );

    for (const fila of filas) {
      if (!fila.display) continue;
      const previas = salida.get(fila.practitioner_profile_id) ?? [];
      if (!previas.includes(fila.display)) previas.push(fila.display);
      salida.set(fila.practitioner_profile_id, previas);
    }
    return salida;
  }

  /**
   * Trayectoria laboral pública de un profesional: dónde trabajó, con qué
   * cargo y en qué período. La misma tabla que `profiles.practitioner_affiliations`
   * (`GET /profiles/practitioners/me/affiliations`), leída sin sesión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Sujetos de los perfiles del lote.
   * @returns Mapa `practitionerProfileId → afiliaciones`, de la más reciente a la más antigua.
   */
  async affiliationsByPractitioner(
    em: EntityManager,
    practitionerProfileIds: string[],
  ): Promise<Map<string, ProfileAffiliation[]>> {
    const salida = new Map<string, ProfileAffiliation[]>();
    if (practitionerProfileIds.length === 0) return salida;

    const filas = await em.getConnection().execute<
      {
        practitioner_profile_id: string;
        organization_name: string;
        role_title: string;
        department_text: string | null;
        start_date: string;
        end_date: string | null;
      }[]
    >(
      `SELECT practitioner_profile_id, organization_name, role_title,
              department_text, start_date, end_date
         FROM profiles.practitioner_affiliations
        WHERE practitioner_profile_id IN (?)
          AND status_concept_id IN (?)
        ORDER BY start_date DESC`,
      [practitionerProfileIds, AFFILIATION_ESTADOS_PUBLICOS],
      'all',
    );

    for (const fila of filas) {
      const previas = salida.get(fila.practitioner_profile_id) ?? [];
      previas.push({
        organizationName: fila.organization_name,
        roleTitle: fila.role_title,
        departmentText: fila.department_text,
        startDate: fila.start_date,
        endDate: fila.end_date,
      });
      salida.set(fila.practitioner_profile_id, previas);
    }
    return salida;
  }

  /**
   * Agenda publicada y primer día con hueco, por sujeto profesional.
   *
   * Es lo que hace verdadera la promesa `PAC-CITA-001` («puedo agendar con lo
   * que veo»): sin este dato el resultado ofrece «Pedir turno» a ciegas, y el
   * paciente descubre que no hay agenda **después** de hacer clic.
   *
   * Dos cosas distintas y por eso dos columnas:
   *
   *  - `has_agenda` sale de `scheduling.practitioner_schedules` vigente: el
   *    profesional declaró horarios de atención.
   *  - `next_slot` sale de `scheduling.bookable_slots` con capacidad libre, y
   *    va **truncado a día**. La hora exacta cambia entre que la tarjeta se
   *    pinta y el paciente la toca, así que prometerla sería prometer de más.
   *
   * Un profesional puede tener agenda declarada y ningún hueco libre; se
   * muestran por separado para que el CTA diga la verdad en los dos casos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Sujetos de los perfiles del lote.
   * @returns Mapa `practitionerProfileId → { hasAgenda, nextAvailableDate }`.
   */
  async agendaByPractitioner(
    em: EntityManager,
    practitionerProfileIds: string[],
  ): Promise<
    Map<string, { hasAgenda: boolean; nextAvailableDate: string | null }>
  > {
    const salida = new Map<
      string,
      { hasAgenda: boolean; nextAvailableDate: string | null }
    >();
    if (practitionerProfileIds.length === 0) return salida;

    const filas = await em.getConnection().execute<
      {
        practitioner_profile_id: string;
        has_agenda: boolean;
        next_slot: string | null;
      }[]
    >(
      `SELECT s.practitioner_profile_id,
                TRUE AS has_agenda,
                (SELECT MIN(bs.start_at)
                   FROM scheduling.bookable_slots bs
                   JOIN scheduling.schedulable_resources sr ON sr.id = bs.resource_id
                  WHERE sr.resource_ref_id = s.practitioner_profile_id
                    AND bs.start_at >= now()
                    AND bs.remaining_capacity > 0
                    AND bs.status_concept_id = ?) AS next_slot
           FROM scheduling.practitioner_schedules s
          WHERE s.practitioner_profile_id IN (?)
            AND s.status_concept_id = ?
            AND (s.valid_from IS NULL OR s.valid_from <= CURRENT_DATE)
            AND (s.valid_to IS NULL OR s.valid_to >= CURRENT_DATE)
          GROUP BY s.practitioner_profile_id, s.status_concept_id`,
      [
        // El hueco se filtra por `SLOT_OPEN` y NO por el estado genérico
        // `ACTIVE`: `bookable_slots` tiene su propia máquina de estados
        // (`SLOT_OPEN` / `SLOT_BOOKED`), así que compararlo contra `ACTIVE` no
        // habría casado con **ningún** hueco y `nextAvailableDate` habría
        // salido siempre en nulo, en silencio. El parámetro va primero porque
        // la subconsulta aparece antes en el SQL.
        CONCEPTS.SLOT_OPEN,
        practitionerProfileIds,
        CONCEPTS.STATE_ACTIVE,
      ],
      'all',
    );

    for (const fila of filas) {
      const previo = salida.get(fila.practitioner_profile_id);
      const dia = fila.next_slot
        ? new Date(fila.next_slot).toISOString().slice(0, 10)
        : null;
      salida.set(fila.practitioner_profile_id, {
        hasAgenda: true,
        // Varias franjas por profesional: gana el primer hueco de todas.
        nextAvailableDate:
          previo?.nextAvailableDate && dia
            ? previo.nextAvailableDate < dia
              ? previo.nextAvailableDate
              : dia
            : (previo?.nextAvailableDate ?? dia),
      });
    }
    return salida;
  }

  /**
   * Sellos de verificación de varios perfiles a la vez.
   *
   * Uno por página y no uno por fila: el buscador pinta cincuenta tarjetas con
   * su sello, y cincuenta viajes por eso serían cincuenta de más.
   *
   * Trae los caídos además de los vigentes, porque la pantalla necesita
   * distinguir «nunca se verificó» de «se le venció»: sin los caídos, el
   * segundo caso se vería igual que el primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileIds - Perfiles de la página.
   * @returns Mapa `profileId → sellos`, del más reciente al más viejo.
   */
  async badgesByProfiles(
    em: EntityManager,
    profileIds: string[],
  ): Promise<Map<string, VerifiedBadges[]>> {
    const salida = new Map<string, VerifiedBadges[]>();
    if (profileIds.length === 0) return salida;

    const badges = await em.find(
      VerifiedBadges,
      { subjectRefId: { $in: profileIds } },
      { orderBy: { createdAt: 'DESC', id: 'DESC' } },
    );

    for (const badge of badges) {
      const previos = salida.get(badge.subjectRefId) ?? [];
      previos.push(badge);
      salida.set(badge.subjectRefId, previos);
    }
    return salida;
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

  /**
   * Las últimas publicaciones de **todas** las vitrinas públicas, mezcladas.
   *
   * Es el feed de la portada: quien entra sin sesión ve lo último que
   * escribieron los profesionales, sin tener que elegir a uno primero. Las
   * mismas condiciones de visibilidad que `listPublicPosts` —`PUBLIC`,
   * publicado, no moderado, ya publicado— más las dos del directorio sobre la
   * vitrina del autor: si un perfil se despublica, sus publicaciones salen del
   * feed con él.
   *
   * Va en SQL y no por el ORM porque necesita los datos del autor en la misma
   * fila: sin eso serían N lecturas de perfil para pintar N tarjetas.
   *
   * El cursor es `(published_at, id)` y no un `OFFSET`: con publicaciones
   * entrando mientras alguien pagina, un offset repite y saltea filas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param limit - Cuántas traer.
   * @param cursor - Desde dónde seguir, si se está paginando.
   * @returns Las publicaciones con su autor, de la más reciente a la más antigua.
   */
  async listFeedPublico(
    em: EntityManager,
    limit: number,
    cursor?: { publishedAt: Date; id: string },
  ): Promise<
    {
      id: string;
      bodyText: string;
      publishedAt: Date;
      authorSlug: string;
      authorDisplayName: string;
      authorHeadline: string | null;
      authorAvatarFileId: string | null;
      authorKindConceptId: string;
    }[]
  > {
    const parametros: unknown[] = [
      COMM.POST_VISIBILITY_PUBLIC,
      COMM.PUBLICATION_PUBLISHED,
      COMM.MODERATION_REMOVED,
      COMM.MODERATION_RESTRICTED,
      COMM.PROFILE_VISIBILITY_PUBLIC,
      CONCEPTS.STATE_ACTIVE,
    ];
    // `(a, b) < (c, d)` es comparación de tuplas de Postgres: ordena por
    // `published_at` y desempata por `id` en una sola condición, que es
    // exactamente el orden del `ORDER BY`.
    let condicionCursor = '';
    if (cursor) {
      condicionCursor = `AND (sp.published_at, sp.id) < (?, ?)`;
      parametros.push(cursor.publishedAt, cursor.id);
    }
    parametros.push(limit);

    const filas = await em.getConnection().execute<
      {
        id: string;
        body_text: string;
        published_at: Date;
        author_slug: string;
        author_display_name: string;
        author_headline: string | null;
        author_avatar_file_id: string | null;
        author_kind_concept_id: string;
      }[]
    >(
      `SELECT sp.id,
              sp.body_text,
              COALESCE(sp.published_at, sp.created_at) AS published_at,
              pp.slug                    AS author_slug,
              pp.display_name            AS author_display_name,
              pp.headline                AS author_headline,
              pp.avatar_file_id          AS author_avatar_file_id,
              pp.target_type_concept_id  AS author_kind_concept_id
         FROM community.social_posts sp
         JOIN community.public_profiles pp
           ON pp.id = sp.author_public_profile_id
        WHERE sp.visibility_concept_id = ?
          AND sp.publication_status_concept_id = ?
          AND sp.moderation_status_concept_id NOT IN (?, ?)
          AND sp.published_at <= NOW()
          AND pp.visibility_concept_id = ?
          AND pp.status_concept_id = ?
          ${condicionCursor}
        ORDER BY sp.published_at DESC, sp.id DESC
        LIMIT ?`,
      parametros,
      'all',
    );

    return filas.map((fila) => ({
      id: fila.id,
      bodyText: fila.body_text,
      publishedAt: new Date(fila.published_at),
      authorSlug: fila.author_slug,
      authorDisplayName: fila.author_display_name,
      authorHeadline: fila.author_headline,
      authorAvatarFileId: fila.author_avatar_file_id,
      authorKindConceptId: fila.author_kind_concept_id,
    }));
  }

  /**
   * Media, reacciones y comentarios de un lote de publicaciones, para la ficha.
   *
   * Una consulta por concepto en vez de tres viajes: `post_media` trae los
   * archivos de imagen en orden, y dos `COUNT` agrupados traen la interacción.
   * Las imágenes son las únicas que se publican —vídeo y documento se guardan
   * pero no se sirven al anónimo todavía—, y el orden es `ordinal` y después
   * `created_at`, el mismo con el que se subieron.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param postIds - Publicaciones del lote.
   * @returns Mapa `postId → { imageFileIds, reactionCount, commentCount }`.
   */
  async engagementByPost(
    em: EntityManager,
    postIds: string[],
  ): Promise<
    Map<
      string,
      {
        imageFileIds: string[];
        reactionCount: number;
        commentCount: number;
      }
    >
  > {
    const salida = new Map<
      string,
      { imageFileIds: string[]; reactionCount: number; commentCount: number }
    >();
    if (postIds.length === 0) return salida;

    const asegurar = (id: string) => {
      let fila = salida.get(id);
      if (!fila) {
        fila = { imageFileIds: [], reactionCount: 0, commentCount: 0 };
        salida.set(id, fila);
      }
      return fila;
    };

    const conn = em.getConnection();

    const medios = await conn.execute<
      { post_id: string; file_id: string }[]
    >(
      `SELECT post_id, file_id
         FROM community.post_media
        WHERE post_id IN (?)
          AND media_role_concept_id = ?
        ORDER BY COALESCE(ordinal, 0) ASC, created_at ASC`,
      [postIds, COMM.MEDIA_ROLE_IMAGE],
      'all',
    );
    for (const fila of medios) asegurar(fila.post_id).imageFileIds.push(fila.file_id);

    const reacciones = await conn.execute<
      { reactable_ref_id: string; total: string }[]
    >(
      `SELECT reactable_ref_id, COUNT(*) AS total
         FROM community.reactions
        WHERE reactable_ref_id IN (?)
          AND reactable_type_concept_id = ?
        GROUP BY reactable_ref_id`,
      [postIds, COMM.CONTENT_TYPE_POST],
      'all',
    );
    for (const fila of reacciones) {
      asegurar(fila.reactable_ref_id).reactionCount = Number(fila.total);
    }

    const comentarios = await conn.execute<
      { commentable_ref_id: string; total: string }[]
    >(
      `SELECT commentable_ref_id, COUNT(*) AS total
         FROM community.comments
        WHERE commentable_ref_id IN (?)
          AND commentable_type_concept_id = ?
          AND status_concept_id <> ?
        GROUP BY commentable_ref_id`,
      [postIds, COMM.CONTENT_TYPE_POST, COMM.MODERATION_REMOVED],
      'all',
    );
    for (const fila of comentarios) {
      asegurar(fila.commentable_ref_id).commentCount = Number(fila.total);
    }

    return salida;
  }

  /**
   * Si un archivo es una imagen adjunta a una publicación pública de una
   * vitrina publicada. Es la otra mitad de `PublicProfilesRepository.isPublicMedia`:
   * la primera cubre el avatar y la portada del perfil; ésta, las fotos que van
   * dentro de las publicaciones que ese perfil dejó a la vista de todos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - El archivo a comprobar.
   */
  async isPublicPostMedia(em: EntityManager, fileId: string): Promise<boolean> {
    const filas = await em.getConnection().execute<{ uno: number }[]>(
      `SELECT 1 AS uno
         FROM community.post_media pm
         JOIN community.social_posts sp ON sp.id = pm.post_id
         JOIN community.public_profiles pp ON pp.id = sp.author_public_profile_id
        WHERE pm.file_id = ?
          AND pm.media_role_concept_id = ?
          AND sp.visibility_concept_id = ?
          AND sp.publication_status_concept_id = ?
          AND sp.moderation_status_concept_id <> ?
          AND pp.visibility_concept_id = ?
          AND pp.status_concept_id = ?
        LIMIT 1`,
      [
        fileId,
        COMM.MEDIA_ROLE_IMAGE,
        COMM.POST_VISIBILITY_PUBLIC,
        COMM.PUBLICATION_PUBLISHED,
        COMM.MODERATION_REMOVED,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
      'all',
    );
    return filas.length > 0;
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
