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
import { PRAC } from '../../practice/practice.concepts';
import type { PublicTerritoryFilter } from '../services/public-territory-filter.service';

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
const AFFILIATION_PUBLIC_STATES: readonly string[] = [
  PROF.AFFILIATION_DECLARED,
  PROF.AFFILIATION_APPROVED,
  PROF.AFFILIATION_ACTIVE,
];

/**
 * Qué hace **pública** a una publicación, escrito una sola vez.
 *
 * Es la condición que ya aplicaba `listFeedPublico`, extraída para que las
 * lecturas sociales públicas —quién reaccionó, el hilo de comentarios, las
 * respuestas de un comentario— la compartan literalmente en vez de repetirla.
 * Una regla de visibilidad copiada en cuatro consultas se olvida en la quinta, y
 * la que se olvida es la que publica un borrador.
 *
 * Presupone que la consulta une `community.social_posts sp` con
 * `community.public_profiles pp` por `pp.id = sp.author_public_profile_id`: son
 * las dos condiciones del post y las dos del directorio sobre la vitrina de su
 * autor. Si un perfil se despublica, todo lo suyo sale con él.
 *
 * No es lo mismo que `CommunityVisibilityService.canViewPost`, y no puede
 * serlo: aquélla decide qué ve **un lector** —tiene bloqueos y follows que
 * evaluar— y acá no hay lector. Sin sesión sólo califica `PUBLIC`, y además
 * tiene que estar publicado y no moderado, que es lo que `canViewPost` no mira
 * porque quien la llama ya viene de un listado que sí lo hizo.
 */
const POST_PUBLIC_SQL = `sp.visibility_concept_id = ?
          AND sp.publication_status_concept_id = ?
          AND sp.moderation_status_concept_id NOT IN (?, ?)
          AND sp.published_at <= NOW()
          AND pp.visibility_concept_id = ?
          AND pp.status_concept_id = ?`;

/** Los parámetros de {@link POST_PUBLIC_SQL}, en su orden. */
const POST_PUBLIC_PARAMS: readonly unknown[] = [
  COMM.POST_VISIBILITY_PUBLIC,
  COMM.PUBLICATION_PUBLISHED,
  COMM.MODERATION_REMOVED,
  COMM.MODERATION_RESTRICTED,
  COMM.PROFILE_VISIBILITY_PUBLIC,
  CONCEPTS.STATE_ACTIVE,
];

/**
 * Qué hace pública a la vitrina del autor de un comentario o de una reacción.
 *
 * Se compara por igualdad —y no con «distinto de privado»— por lo mismo que el
 * resto del directorio: un valor nulo, o uno que todavía no existe como
 * concepto, tiene que quedar fuera.
 */
const PUBLIC_AUTHOR_SQL = `pp.visibility_concept_id = ?
          AND pp.status_concept_id = ?`;

/** Los parámetros de {@link PUBLIC_AUTHOR_SQL}, en su orden. */
const PUBLIC_AUTHOR_PARAMS: readonly unknown[] = [
  COMM.PROFILE_VISIBILITY_PUBLIC,
  CONCEPTS.STATE_ACTIVE,
];

/** Las columnas del autor que la superficie pública sirve, y ninguna más. */
const PUBLIC_COLUMNS_AUTHOR = `pp.slug                    AS author_slug,
              pp.display_name            AS author_display_name,
              pp.headline                AS author_headline,
              pp.avatar_file_id          AS author_avatar_file_id,
              pp.target_type_concept_id  AS author_kind_concept_id`;

/** Una persona de la superficie pública, tal como sale de la consulta. */
export interface PublicSocialActorRow {
  /** Slug estable del perfil. */
  readonly authorSlug: string;
  /** Nombre visible. */
  readonly authorDisplayName: string;
  /** Titular corto, o `null`. */
  readonly authorHeadline: string | null;
  /** Archivo del avatar, que el servicio resuelve a URL. */
  readonly authorAvatarFileId: string | null;
  /** Concepto de vertical del perfil. */
  readonly authorKindConceptId: string;
}

/** Una reacción con la persona que la dejó. */
export interface PublicReactionRow extends PublicSocialActorRow {
  /** Identificador de la reacción; alimenta el cursor, no la respuesta. */
  readonly id: string;
  /** Cuándo se dejó; alimenta el cursor, no la respuesta. */
  readonly createdAt: Date;
  /** Concepto del tipo de reacción, que el servicio traduce a código. */
  readonly reactionTypeConceptId: string;
}

/** Un adjunto de comentario público (REQ-01-011), tal como sale de la fila. */
export interface PublicCommentMediaRow {
  /** Archivo en `common.files`; el servicio lo resuelve a `/public/media/:fileId`. */
  readonly fileId: string;
  /** Concept id del rol (imagen, sticker, GIF); el servicio lo resuelve al código. */
  readonly mediaRoleConceptId: string;
  /** Texto alternativo, si se aportó. */
  readonly altText: string | null;
}

/** Un comentario público con su autor. */
export interface PublicCommentRow extends PublicSocialActorRow {
  /** Identificador del comentario. */
  readonly id: string;
  /** Texto. */
  readonly bodyText: string;
  /** Cuándo se escribió. */
  readonly createdAt: Date;
  /** Cuántas respuestas cuelgan de él. */
  readonly replyCount: number;
  /** Adjuntos, en orden de despliegue (REQ-01-011). */
  readonly media: readonly PublicCommentMediaRow[];
}

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

/**
 * Un lugar donde atiende un profesional, ya proyectado para la ficha pública.
 *
 * Es el `PublicPracticeSiteDto` del contrato, sin decoradores.
 */
export interface ProfilePracticeSite {
  readonly id: string;
  readonly name: string;
  /** Dirección en una línea, o `null` si la sede no cargó ninguna. */
  readonly addressText: string | null;
  /** Punto de la sede, o `null` si le falta cualquiera de las coordenadas. */
  readonly location: { readonly lat: number; readonly lng: number } | null;
  /** Consultorio propio del profesional, no sede de una organización. */
  readonly isOwn: boolean;
}

/**
 * Una fila de {@link PublicSearchRepository.practiceSitesByPractitioner}: una
 * asignación de rol con su sede, la práctica de esa sede, su dirección y **uno**
 * de los vínculos de cuenta de la persona. Sin vínculos, los dos últimos van en
 * nulo.
 *
 * Trae hechos y no decisiones: qué asignación cuenta y qué sede es propia lo
 * resuelve {@link publicSitesOf}, que así se puede probar sin base.
 */
export interface SitePublicRow {
  readonly practitioner_profile_id: string;
  readonly assignment_status_concept_id: string;
  readonly assignment_valid_to: string | Date | null;
  readonly site_id: string;
  readonly site_name: string;
  readonly practice_type_concept_id: string;
  readonly practice_admin_user_id: string;
  readonly lines: string | null;
  readonly city: string | null;
  readonly postal_code: string | null;
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly link_user_id: string | null;
  readonly link_status_concept_id: string | null;
}

/**
 * Las sedes públicas de cada profesional, a partir de las filas de la consulta.
 *
 * ## Qué asignación cuenta
 *
 * La misma que `PractitionerRoleAssignmentsRepository.findCurrentWithSite`, que
 * es la que responde «¿dónde atiende hoy?» con sesión: estado
 * `ROLE_ASSIGNMENT_ACTIVE`, `valid_to` nulo y sede declarada —esto último lo
 * garantiza el `JOIN` de la consulta—. No se agrega ningún criterio que aquélla
 * no tenga. Lo único que **no** se copia es el filtro de tenant: esta superficie
 * lee a través de todos (`openapi/CONTRATO-PUBLICO.md` §0, regla 1).
 *
 * ## Qué sede es propia
 *
 * La regla de `PracticesRepository.findOwnOffice`, sin el tenant: la práctica
 * es de tipo consultorio (`PRACTICE_TYPE_OFFICE`) **y** la administra la cuenta
 * que encarna al profesional —la de un vínculo de cuenta activo—. El tipo solo
 * no alcanza, porque `POST /practices` acepta cualquier concepto; y el tipo de
 * **sede** no sirve, porque el alta de unidades diagnósticas también usa
 * `SITE_TYPE_OFFICE`.
 *
 * ## Orden
 *
 * Los consultorios propios primero, que es lo único que el contrato pide. Entre
 * iguales, por identificador de sede: no significa nada, y por eso mismo no
 * cambia de una lectura a la siguiente.
 *
 * @param rows - Lo que devolvió la consulta, para uno o varios profesionales.
 * @returns Mapa `practitionerProfileId → sedes`; quien no tiene ninguna no aparece.
 */
export function publicSitesOf(
  rows: readonly SitePublicRow[],
): Map<string, ProfilePracticeSite[]> {
  // Las cuentas que hoy encarnan a cada profesional. Se juntan de todas sus
  // filas y no sólo de las vigentes: el vínculo es de la persona, no de la
  // asignación.
  const activeAccounts = new Map<string, Set<string>>();
  for (const row of rows) {
    if (
      row.link_user_id === null ||
      row.link_status_concept_id !== PROF.ACCOUNT_LINK_ACTIVE
    )
      continue;
    const accounts =
      activeAccounts.get(row.practitioner_profile_id) ?? new Set<string>();
    accounts.add(row.link_user_id);
    activeAccounts.set(row.practitioner_profile_id, accounts);
  }

  const byProfessional = new Map<string, Map<string, ProfilePracticeSite>>();
  for (const row of rows) {
    if (
      row.assignment_status_concept_id !== PRAC.ROLE_ASSIGNMENT_ACTIVE ||
      row.assignment_valid_to !== null
    )
      continue;
    const sites =
      byProfessional.get(row.practitioner_profile_id) ??
      new Map<string, ProfilePracticeSite>();
    // Dos asignaciones vigentes en la misma sede —dos cargos, por ejemplo— son
    // un solo lugar al que ir.
    if (!sites.has(row.site_id)) {
      sites.set(row.site_id, {
        id: row.site_id,
        name: row.site_name,
        addressText: addressText(row),
        location: pointOf(row),
        isOwn:
          row.practice_type_concept_id === PRAC.PRACTICE_TYPE_OFFICE &&
          (activeAccounts
            .get(row.practitioner_profile_id)
            ?.has(row.practice_admin_user_id) ??
            false),
      });
    }
    byProfessional.set(row.practitioner_profile_id, sites);
  }

  const output = new Map<string, ProfilePracticeSite[]>();
  for (const [practitionerProfileId, sites] of byProfessional) {
    output.set(
      practitionerProfileId,
      [...sites.values()].sort(
        (a, b) => Number(b.isOwn) - Number(a.isOwn) || compareIds(a.id, b.id),
      ),
    );
  }
  return output;
}

/**
 * La dirección en una línea, o `null` si no tiene nada que decir.
 *
 * Compuesta igual que `addressText` de `PractitionerSitesService` —calle,
 * ciudad, código postal—, para que la ficha anónima diga lo mismo que la
 * lectura de sedes con sesión.
 */
function addressText(row: SitePublicRow): string | null {
  const parts = [row.lines, row.city, row.postal_code]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(', ');
}

/**
 * El punto de la sede, o `null` si le falta cualquiera de las dos coordenadas.
 *
 * Mismo criterio que `locationsByOwner`: media coordenada no es un lugar, y
 * convertir un nulo en `0` dibujaría un pin en medio del océano.
 */
function pointOf(row: SitePublicRow): ProfilePracticeSite['location'] {
  const lat = row.latitude === null ? null : Number(row.latitude);
  const lng = row.longitude === null ? null : Number(row.longitude);
  if (
    lat === null ||
    lng === null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  )
    return null;
  return { lat, lng };
}

/** Orden por unidad de código, sin depender del idioma de la máquina. */
function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

@Injectable()
export class PublicSearchRepository {
  /**
   * Si la base tiene `unaccent`. Se pregunta UNA vez a `pg_extension` en vez de
   * intentar cada consulta con la función y reintentarla sin ella: ese
   * `try/catch` ocultaba la extensión faltante y, dentro de una transacción,
   * el primer intento fallido deja la transacción abortada.
   */
  private unaccentAvailable: Promise<boolean> | null = null;

  private async normalizer(em: EntityManager): Promise<string> {
    this.unaccentAvailable ??= em
      .getConnection()
      .execute<{ present: boolean }[]>(
        `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') AS present`,
        [],
        'all',
      )
      .then((rows) => rows[0]?.present === true);
    return (await this.unaccentAvailable) ? 'unaccent' : '';
  }

  /**
   * Página del directorio público, filtrada por texto, ciudad, especialidad y tipo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Texto, ciudad, especialidad, tipo de sujeto y verificación.
   * @param limit - Tope de filas; se pide una de más para saber si hay página.
   * @returns Los perfiles públicos que coinciden.
   */
  async searchProfiles(
    em: EntityManager,
    filters: {
      /** Texto libre, ya recortado. */
      q?: string;
      /** Tipo de sujeto al que acotar. */
      targetTypeConceptId?: string;
      /** Sólo verificados. */
      verified?: boolean;
      /** Ciudad exacta, sin distinguir tildes ni mayúsculas. */
      city?: string;
      /** Departamento o municipio del catálogo, ya validado (2.3). */
      territory?: PublicTerritoryFilter;
      /** Especialidad médica de `VS_MEDICAL_SPECIALTY`, ya validada. */
      specialtyConceptId?: string;
      /** Clave de continuación `(displayName, id)`. */
      after?: { displayName: string; id: string };
    },
    limit: number,
  ): Promise<PublicProfiles[]> {
    const where: Record<string, unknown> = {
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    if (filters.targetTypeConceptId)
      where.targetTypeConceptId = filters.targetTypeConceptId;
    if (filters.verified)
      where.verificationStatusConceptId = CONCEPTS.STATE_ACTIVE;

    // La ciudad vive en `common.addresses`, no en el perfil: se resuelve a
    // sujetos primero y se acota la búsqueda a ésos. Va **antes** de paginar,
    // por lo mismo que el filtro de texto: acotar después de traer la página
    // devolvería páginas de menos, y un directorio que muestra tres de veinte
    // resultados se lee como un directorio con tres resultados.
    //
    // Ninguno es la respuesta honesta a «filtrá por una ciudad donde no hay
    // nada», y por eso corta acá en vez de dejar caer el filtro: dejarlo caer
    // devolvería el directorio entero y le diría a quien filtró, sin decírselo,
    // que todos esos centros están en esa ciudad.
    //
    // La especialidad entra por la misma puerta y por lo mismo: vive en
    // `profiles.practitioner_specialties`, no en el perfil. Los dos filtros
    // acotan el **mismo eje** —el sujeto—, así que se intersecan en vez de
    // pisarse: con el segundo sobreescribiendo al primero, «cardiólogos en
    // Cochabamba» habría devuelto los cardiólogos del país entero.
    const subjectsSets: string[][] = [];
    if (filters.city) {
      subjectsSets.push(await this.targetIdsByCity(em, filters.city));
    }
    // El lugar del catálogo acota el mismo eje —el sujeto— y por la misma
    // puerta que la ciudad: «cardiólogos en Cochabamba» interseca, no pisa.
    if (filters.territory) {
      subjectsSets.push(await this.targetIdsByTerritory(em, filters.territory));
    }
    if (filters.specialtyConceptId) {
      subjectsSets.push(
        await this.practitionerIdsBySpecialty(em, filters.specialtyConceptId),
      );
    }
    if (subjectsSets.length > 0) {
      const subjects = subjectsSets.reduce((accumulated, next) => {
        const present = new Set(next);
        return accumulated.filter((id) => present.has(id));
      });
      if (subjects.length === 0) return [];
      where.targetId = { $in: subjects };
    }

    // El keyset va sobre `(display_name, id)`: `display_name` solo no es único
    // —hay homónimos— y una página que empieza en un empate se saltea filas.
    if (filters.after) {
      where.$or = [
        { displayName: { $gt: filters.after.displayName } },
        {
          displayName: filters.after.displayName,
          id: { $gt: filters.after.id },
        },
      ];
    }

    const rows = await em.find(PublicProfiles, where, {
      orderBy: { displayName: 'ASC', id: 'ASC' },
      limit,
    });

    if (!filters.q) return rows;

    // El filtro de texto se aplica sobre los ids candidatos y no en memoria
    // sobre la página: filtrar después de paginar devolvería páginas de menos.
    const ids = await this.matchIdsByText(em, filters.q, where, limit);
    const allowed = new Set(ids);
    return rows.filter((row) => allowed.has(row.id));
  }

  /**
   * Los sujetos con una dirección vigente en esa ciudad.
   *
   * Es el filtro de ciudad del buscador público por la vía SQL. Existe porque
   * el índice puede no responder, y un filtro que sólo funciona cuando
   * OpenSearch está arriba es peor que ninguno: el día que se cae, la lista
   * deja de acotar **sin avisar** y quien filtró «Cochabamba» recibe el
   * directorio entero creyendo que es Cochabamba.
   *
   * Compara sin tildes y sin distinguir mayúsculas —«la paz» y «La Paz» son la
   * misma ciudad—, con la misma degradación que el filtro de texto: si
   * `unaccent` no está instalada, cae a `lower(...)` en vez de romper.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param city - Ciudad tal como la escribió quien filtra.
   * @returns Los `owner_id` con dirección vigente en esa ciudad.
   */
  private async targetIdsByCity(
    em: EntityManager,
    city: string,
  ): Promise<string[]> {
    const base = `
      SELECT DISTINCT owner_id FROM common.addresses
       WHERE (valid_to IS NULL OR valid_to >= CURRENT_DATE)
         AND %NORM%(lower(coalesce(city, ''))) = %NORM%(lower(?))
       LIMIT ?`;
    // El tope existe para que el `IN` no crezca sin límite en una ciudad
    // grande. Es holgado a propósito: por debajo del tamaño de cualquier
    // directorio de una ciudad real, y muy por encima del de éste.
    const params = [city, 5000];
    const norm = await this.normalizer(em);
    const rows = await em
      .getConnection()
      .execute<{ owner_id: string }[]>(
        base.replace(/%NORM%/g, norm),
        params,
        'all',
      );
    return rows.map((f) => f.owner_id);
  }

  /**
   * Los sujetos con una dirección vigente en ese municipio o departamento.
   *
   * Es el filtro territorial en dos pasos (subtarea 2.3). Compara conceptos del
   * catálogo, no el texto de `city`, que es libre y no garantiza consistencia.
   *
   * Un departamento se reconoce por `administrative_area_concept_id` **o** por
   * el prefijo del código de su municipio (`SC-…` o `geo:bo:municipality:07…`):
   * hay direcciones que traen sólo el municipio —en la base de desarrollo, todas—
   * y quedarse con la columna del departamento dejaría afuera, sin avisar, a
   * quien no la tiene.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param territory - Municipio, o departamento con su sigla, ya validados.
   * @returns Los `owner_id` con dirección vigente en ese lugar.
   */
  private async targetIdsByTerritory(
    em: EntityManager,
    territory: PublicTerritoryFilter,
  ): Promise<string[]> {
    // Mismo tope que el de ciudad, por el mismo motivo.
    const tope = 5000;
    const rows =
      'municipalityConceptId' in territory
        ? await em.getConnection().execute<{ owner_id: string }[]>(
            `SELECT DISTINCT owner_id FROM common.addresses
              WHERE (valid_to IS NULL OR valid_to >= CURRENT_DATE)
                AND municipality_concept_id = ?
              LIMIT ?`,
            [territory.municipalityConceptId, tope],
            'all',
          )
        : await em.getConnection().execute<{ owner_id: string }[]>(
            `SELECT DISTINCT a.owner_id FROM common.addresses a
              WHERE (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
                AND (a.administrative_area_concept_id = ?
                     OR a.municipality_concept_id IN (
                          SELECT c.id FROM terminology.catalog_concepts c
                           WHERE c.code LIKE ANY (ARRAY[?])))
              LIMIT ?`,
            [
              territory.departmentConceptId,
              territory.municipalityCodePrefixes.map((prefix) => `${prefix}%`),
              tope,
            ],
            'all',
          );
    return rows.map((f) => f.owner_id);
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
    const pattern = `%${q.toLowerCase()}%`;
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
      pattern,
      pattern,
      limit,
    ];
    const norm = await this.normalizer(em);
    const rows = await em
      .getConnection()
      .execute<{ id: string }[]>(base.replace(/%NORM%/g, norm), params, 'all');
    return rows.map((f) => f.id);
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
    const degreesLat = punto.radiusKm / 111;
    const cos = Math.max(Math.abs(Math.cos((punto.lat * Math.PI) / 180)), 0.01);
    const degreesLng = punto.radiusKm / (111 * cos);

    const rows = await em.getConnection().execute<
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
        punto.lat - degreesLat,
        punto.lat + degreesLat,
        punto.lng - degreesLng,
        punto.lng + degreesLng,
        limit,
      ],
      'all',
    );

    if (rows.length === 0) return [];

    const profiles = await em.find(PublicProfiles, {
      id: { $in: rows.map((row) => row.id) },
    });
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));

    return rows.flatMap((row) => {
      const profile = byId.get(row.id);
      if (!profile) return [];
      return [
        {
          profile,
          lat: Number(row.latitude),
          lng: Number(row.longitude),
          city: row.city,
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
    const output = new Map<string, ProfileLocation>();
    if (ownerIds.length === 0) return output;

    const rows = await em.getConnection().execute<
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

    for (const row of rows) {
      const lat = row.latitude === null ? null : Number(row.latitude);
      const lng = row.longitude === null ? null : Number(row.longitude);
      // Una dirección sin coordenadas todavía sirve para filtrar por ciudad;
      // lo que no puede es entrar como `geo_point`, que rechaza un nulo.
      const geoValid =
        lat !== null &&
        lng !== null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng);
      if (!geoValid) {
        // Sin punto pero con texto la dirección **sigue sirviendo**: la ficha
        // escribe dónde atiende aunque no pueda dibujar el mapa.
        if (row.city || row.lines) {
          output.set(row.owner_id, {
            address: row.lines,
            city: row.city,
            lat: null,
            lng: null,
          });
        }
        continue;
      }
      output.set(row.owner_id, {
        address: row.lines,
        city: row.city,
        lat,
        lng,
      });
    }
    return output;
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
    const output = new Map<string, string[]>();
    if (practitionerProfileIds.length === 0) return output;

    const rows = await em
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

    for (const row of rows) {
      if (!row.display) continue;
      const previous = output.get(row.practitioner_profile_id) ?? [];
      if (!previous.includes(row.display)) previous.push(row.display);
      output.set(row.practitioner_profile_id, previous);
    }
    return output;
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
    const output = new Map<string, ProfileAffiliation[]>();
    if (practitionerProfileIds.length === 0) return output;

    const rows = await em.getConnection().execute<
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
      [practitionerProfileIds, AFFILIATION_PUBLIC_STATES],
      'all',
    );

    for (const row of rows) {
      const previous = output.get(row.practitioner_profile_id) ?? [];
      previous.push({
        organizationName: row.organization_name,
        roleTitle: row.role_title,
        departmentText: row.department_text,
        startDate: row.start_date,
        endDate: row.end_date,
      });
      output.set(row.practitioner_profile_id, previous);
    }
    return output;
  }

  /**
   * Dónde atiende cada profesional, para su ficha pública (P16).
   *
   * Una sola consulta para el lote, acotada a los sujetos pedidos: la ficha la
   * llama con el único profesional que ya resolvió por slug, y nada de acá lee
   * de otro. Qué asignación cuenta, qué sede es propia y en qué orden salen lo
   * decide {@link publicSitesOf}, no el SQL.
   *
   * Los vínculos de cuenta entran con `LEFT JOIN` y multiplican las filas por
   * vínculo: una persona tiene casi siempre uno solo, y la deduplicación por
   * sede hace falta de todos modos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Sujetos de los perfiles del lote.
   * @returns Mapa `practitionerProfileId → sedes`, los consultorios propios primero.
   */
  async practiceSitesByPractitioner(
    em: EntityManager,
    practitionerProfileIds: string[],
  ): Promise<Map<string, ProfilePracticeSite[]>> {
    if (practitionerProfileIds.length === 0) return new Map();

    const rows = await em.getConnection().execute<SitePublicRow[]>(
      `SELECT pra.practitioner_profile_id,
              pra.status_concept_id AS assignment_status_concept_id,
              pra.valid_to AS assignment_valid_to,
              ps.id AS site_id,
              ps.name AS site_name,
              p.type_concept_id AS practice_type_concept_id,
              p.admin_user_id AS practice_admin_user_id,
              a.lines, a.city, a.postal_code, a.latitude, a.longitude,
              pal.user_id AS link_user_id,
              pal.status_concept_id AS link_status_concept_id
         FROM practice.practitioner_role_assignments pra
         JOIN practice.practice_sites ps ON ps.id = pra.practice_site_id
         JOIN practice.practices p ON p.id = ps.practice_id
         LEFT JOIN common.addresses a ON a.id = ps.address_id
         LEFT JOIN profiles.person_account_links pal
                ON pal.person_id = pra.practitioner_profile_id
        WHERE pra.practitioner_profile_id IN (?)`,
      [practitionerProfileIds],
      'all',
    );
    return publicSitesOf(rows);
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
    const output = new Map<
      string,
      { hasAgenda: boolean; nextAvailableDate: string | null }
    >();
    if (practitionerProfileIds.length === 0) return output;

    const rows = await em.getConnection().execute<
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

    for (const row of rows) {
      const previous = output.get(row.practitioner_profile_id);
      const day = row.next_slot
        ? new Date(row.next_slot).toISOString().slice(0, 10)
        : null;
      output.set(row.practitioner_profile_id, {
        hasAgenda: true,
        // Varias franjas por profesional: gana el primer hueco de todas.
        nextAvailableDate:
          previous?.nextAvailableDate && day
            ? previous.nextAvailableDate < day
              ? previous.nextAvailableDate
              : day
            : (previous?.nextAvailableDate ?? day),
      });
    }
    return output;
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
    const output = new Map<string, VerifiedBadges[]>();
    if (profileIds.length === 0) return output;

    const badges = await em.find(
      VerifiedBadges,
      { subjectRefId: { $in: profileIds } },
      { orderBy: { createdAt: 'DESC', id: 'DESC' } },
    );

    for (const badge of badges) {
      const previous = output.get(badge.subjectRefId) ?? [];
      previous.push(badge);
      output.set(badge.subjectRefId, previous);
    }
    return output;
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
    const output = new Map<string, { average: number; count: number }>();
    if (profileIds.length === 0) return output;

    const rows = await em
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

    for (const row of rows) {
      output.set(row.target_public_profile_id, {
        // Una decimal: el contrato lo promete y un 4.333333 en pantalla es ruido.
        average: Math.round(Number(row.avg) * 10) / 10,
        count: Number(row.total),
      });
    }
    return output;
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
  async listFeedPublic(
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
    const params: unknown[] = [...POST_PUBLIC_PARAMS];
    // `(a, b) < (c, d)` es comparación de tuplas de Postgres: ordena por
    // `published_at` y desempata por `id` en una sola condición, que es
    // exactamente el orden del `ORDER BY`.
    let conditionCursor = '';
    if (cursor) {
      conditionCursor = `AND (sp.published_at, sp.id) < (?, ?)`;
      params.push(cursor.publishedAt, cursor.id);
    }
    params.push(limit);

    const rows = await em.getConnection().execute<
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
              ${PUBLIC_COLUMNS_AUTHOR}
         FROM community.social_posts sp
         JOIN community.public_profiles pp
           ON pp.id = sp.author_public_profile_id
        WHERE ${POST_PUBLIC_SQL}
          ${conditionCursor}
        ORDER BY sp.published_at DESC, sp.id DESC
        LIMIT ?`,
      params,
      'all',
    );

    return rows.map((row) => ({
      id: row.id,
      bodyText: row.body_text,
      publishedAt: new Date(row.published_at),
      authorSlug: row.author_slug,
      authorDisplayName: row.author_display_name,
      authorHeadline: row.author_headline,
      authorAvatarFileId: row.author_avatar_file_id,
      authorKindConceptId: row.author_kind_concept_id,
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
    const output = new Map<
      string,
      { imageFileIds: string[]; reactionCount: number; commentCount: number }
    >();
    if (postIds.length === 0) return output;

    const ensure = (id: string) => {
      let row = output.get(id);
      if (!row) {
        row = { imageFileIds: [], reactionCount: 0, commentCount: 0 };
        output.set(id, row);
      }
      return row;
    };

    const conn = em.getConnection();

    const media = await conn.execute<{ post_id: string; file_id: string }[]>(
      `SELECT post_id, file_id
         FROM community.post_media
        WHERE post_id IN (?)
          AND media_role_concept_id = ?
        ORDER BY COALESCE(ordinal, 0) ASC, created_at ASC`,
      [postIds, COMM.MEDIA_ROLE_IMAGE],
      'all',
    );
    for (const row of media) ensure(row.post_id).imageFileIds.push(row.file_id);

    const reactions = await conn.execute<
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
    for (const row of reactions) {
      ensure(row.reactable_ref_id).reactionCount = Number(row.total);
    }

    const comments = await conn.execute<
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
    for (const row of comments) {
      ensure(row.commentable_ref_id).commentCount = Number(row.total);
    }

    return output;
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
    const rows = await em.getConnection().execute<{ uno: number }[]>(
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
    return rows.length > 0;
  }

  /**
   * Si un archivo es un adjunto (imagen, sticker o GIF) de un comentario
   * público (REQ-01-011). Tercera pieza del mismo trío que `isPublicMedia`
   * (avatar/portada) e `isPublicPostMedia` (fotos del cuerpo del post):
   * `PublicCommentMediaDto.url` sirve `/public/media/:fileId`, y sin esta
   * comprobación esa URL sería un 404 para cualquier anónimo — la miniatura
   * se vería en la propia sesión de quien comentó y rota para todos los demás.
   *
   * Dos vitrinas tienen que ser públicas a la vez, no una: la de quien
   * **comentó** (si su perfil se privatiza, su adjunto deja de servirse con
   * él, igual que su texto) y la de quien **publicó** el post comentado
   * (mismo criterio que `POST_PUBLICO_SQL`). Cubre respuestas igual que
   * comentarios raíz: ambas guardan el mismo `commentable_ref_id` — el post—,
   * la única diferencia es `parent_comment_id`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - El archivo a comprobar.
   */
  async isPublicCommentMedia(
    em: EntityManager,
    fileId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<{ uno: number }[]>(
      `SELECT 1 AS uno
         FROM community.comment_media cm
         JOIN community.comments c ON c.id = cm.comment_id
         JOIN community.public_profiles author ON author.id = c.author_profile_id
         JOIN community.social_posts sp ON sp.id = c.commentable_ref_id
         JOIN community.public_profiles post_author ON post_author.id = sp.author_public_profile_id
        WHERE cm.file_id = ?
          AND c.commentable_type_concept_id = ?
          AND c.status_concept_id = ?
          AND author.visibility_concept_id = ?
          AND author.status_concept_id = ?
          AND sp.visibility_concept_id = ?
          AND sp.publication_status_concept_id = ?
          AND sp.moderation_status_concept_id <> ?
          AND post_author.visibility_concept_id = ?
          AND post_author.status_concept_id = ?
        LIMIT 1`,
      [
        fileId,
        COMM.CONTENT_TYPE_POST,
        CONCEPTS.STATE_ACTIVE,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        COMM.POST_VISIBILITY_PUBLIC,
        COMM.PUBLICATION_PUBLISHED,
        COMM.MODERATION_REMOVED,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
      'all',
    );
    return rows.length > 0;
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

  /**
   * ¿Esta publicación es visible para un anónimo?
   *
   * Es la puerta de las tres lecturas sociales públicas y aplica
   * {@link POST_PUBLIC_SQL}, exactamente el mismo predicado con el que el feed
   * la habría servido. Una publicación que no pasa por acá es indistinguible de
   * una que no existe: quien pregunta no se entera de si es un borrador, si está
   * moderada o si el autor se despublicó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param postId - Publicación preguntada.
   * @returns `true` si el feed público la serviría.
   */
  async isPostPublic(em: EntityManager, postId: string): Promise<boolean> {
    const rows = await em.getConnection().execute<{ uno: number }[]>(
      `SELECT 1 AS uno
         FROM community.social_posts sp
         JOIN community.public_profiles pp
           ON pp.id = sp.author_public_profile_id
        WHERE sp.id = ?
          AND ${POST_PUBLIC_SQL}
        LIMIT 1`,
      [postId, ...POST_PUBLIC_PARAMS],
      'all',
    );
    return rows.length > 0;
  }

  /**
   * Quién reaccionó a una publicación, de la reacción más reciente a la más
   * vieja (AC-01-9).
   *
   * El `JOIN` con la vitrina no es decoración: es lo que deja fuera a quien no
   * tiene perfil público y activo. Filtrar eso en memoria, después de traer la
   * página, devolvería páginas de menos y —lo que más importa acá— dependería de
   * que nadie olvidara el filtro. En la consulta no se olvida.
   *
   * El keyset va sobre `(created_at, id)` porque dos personas pueden reaccionar
   * en el mismo instante y `created_at` solo saltearía a una de las dos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param postId - Publicación reaccionada.
   * @param limit - Tope de filas; se pide una de más para saber si hay página.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @returns Las reacciones de perfiles públicos, con su autor.
   */
  async listPostReactors(
    em: EntityManager,
    postId: string,
    limit: number,
    after?: { createdAt: string; id: string },
  ): Promise<PublicReactionRow[]> {
    const params: unknown[] = [
      COMM.CONTENT_TYPE_POST,
      postId,
      ...PUBLIC_AUTHOR_PARAMS,
    ];
    let conditionCursor = '';
    if (after) {
      conditionCursor = 'AND (r.created_at, r.id) < (?, ?)';
      params.push(new Date(after.createdAt), after.id);
    }
    params.push(limit);

    const rows = await em.getConnection().execute<
      {
        id: string;
        created_at: Date;
        reaction_type_concept_id: string;
        author_slug: string;
        author_display_name: string;
        author_headline: string | null;
        author_avatar_file_id: string | null;
        author_kind_concept_id: string;
      }[]
    >(
      `SELECT r.id,
              r.created_at,
              r.reaction_type_concept_id,
              ${PUBLIC_COLUMNS_AUTHOR}
         FROM community.reactions r
         JOIN community.public_profiles pp ON pp.id = r.actor_profile_id
        WHERE r.reactable_type_concept_id = ?
          AND r.reactable_ref_id = ?
          AND ${PUBLIC_AUTHOR_SQL}
          ${conditionCursor}
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ?`,
      params,
      'all',
    );

    return rows.map((row) => ({
      id: row.id,
      createdAt: new Date(row.created_at),
      reactionTypeConceptId: row.reaction_type_concept_id,
      authorSlug: row.author_slug,
      authorDisplayName: row.author_display_name,
      authorHeadline: row.author_headline,
      authorAvatarFileId: row.author_avatar_file_id,
      authorKindConceptId: row.author_kind_concept_id,
    }));
  }

  /**
   * Los comentarios raíz de una publicación, del más viejo al más nuevo.
   *
   * Pagina sólo las raíces por lo mismo que `CommentsRepository.listRootsPage`:
   * si la página contara también las respuestas, un hilo largo se comería el
   * tope y las demás conversaciones no aparecerían nunca.
   *
   * El estado se compara **por igualdad con `STATE_ACTIVE`** y no con «distinto
   * de removido», que es lo que hace el recuento del feed. La diferencia importa
   * en una superficie anónima: un comentario restringido, o en un estado que el
   * módulo todavía no declara, no se publica por omisión. El precio conocido es
   * que el `commentCount` de `GET /public/posts` puede ser mayor que la cantidad
   * de comentarios servidos acá — cuenta todo lo no removido, incluidos los de
   * autores despublicados.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param postId - Publicación comentada.
   * @param limit - Tope de raíces; se pide una de más para saber si hay página.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @returns Los comentarios raíz de autores públicos, con su autor.
   */
  listPublicRootComments(
    em: EntityManager,
    postId: string,
    limit: number,
    after?: { createdAt: string; id: string },
  ): Promise<PublicCommentRow[]> {
    return this.listPublicComments(
      em,
      {
        sql: `c.commentable_type_concept_id = ?
          AND c.commentable_ref_id = ?
          AND c.parent_comment_id IS NULL`,
        params: [COMM.CONTENT_TYPE_POST, postId],
      },
      limit,
      after,
    );
  }

  /**
   * Las respuestas directas de un comentario, del más viejo al más nuevo
   * (AC-01-12, «Ver N respuestas»).
   *
   * Cuelga de `parent_comment_id` y no de `root_comment_id`: «las respuestas de
   * este comentario» son las suyas, no las de todo el hilo al que pertenece.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param commentId - Comentario respondido.
   * @param limit - Tope de respuestas; se pide una de más para saber si hay página.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @returns Las respuestas de autores públicos, con su autor.
   */
  listPublicCommentReplies(
    em: EntityManager,
    commentId: string,
    limit: number,
    after?: { createdAt: string; id: string },
  ): Promise<PublicCommentRow[]> {
    return this.listPublicComments(
      em,
      { sql: 'c.parent_comment_id = ?', params: [commentId] },
      limit,
      after,
    );
  }

  /**
   * De qué publicación cuelga un comentario público, o `null`.
   *
   * Devuelve el sujeto y no el comentario entero porque lo único que el llamador
   * puede hacer con él es comprobar la publicación: la visibilidad de un
   * comentario es la de aquello que comenta, y preguntarla al revés —«¿es
   * público este comentario?»— dejaría abierta la puerta de leer el hilo de un
   * borrador conociendo el uuid de uno de sus comentarios.
   *
   * `null` también cuando el comentario cuelga de algo que no es una publicación
   * (una reseña, por ejemplo): esta superficie sólo sabe de publicaciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param commentId - Comentario preguntado.
   * @returns El id de la publicación comentada, o `null`.
   */
  async findPostOfPublicComment(
    em: EntityManager,
    commentId: string,
  ): Promise<string | null> {
    const rows = await em
      .getConnection()
      .execute<{ commentable_ref_id: string }[]>(
        `SELECT c.commentable_ref_id
         FROM community.comments c
         JOIN community.public_profiles pp ON pp.id = c.author_profile_id
        WHERE c.id = ?
          AND c.commentable_type_concept_id = ?
          AND c.status_concept_id = ?
          AND ${PUBLIC_AUTHOR_SQL}
        LIMIT 1`,
        [
          commentId,
          COMM.CONTENT_TYPE_POST,
          CONCEPTS.STATE_ACTIVE,
          ...PUBLIC_AUTHOR_PARAMS,
        ],
        'all',
      );
    return rows[0]?.commentable_ref_id ?? null;
  }

  /**
   * Los sujetos profesionales que declaran una especialidad vigente (AC-02-7).
   *
   * La especialidad vive en `profiles.practitioner_specialties` y no en el
   * perfil público, así que se resuelve a sujetos primero y la búsqueda se acota
   * a ésos — el mismo camino que `targetIdsByCity` hace con la ciudad, y por la
   * misma razón: acotar después de paginar devuelve páginas de menos.
   *
   * Ninguno es la respuesta honesta a «filtrá por una especialidad que nadie
   * declara»: dejar caer el filtro devolvería el directorio entero y le diría a
   * quien filtró, sin decírselo, que todos ésos son cardiólogos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param specialtyConceptId - Concepto de `VS_MEDICAL_SPECIALTY`, ya validado.
   * @returns Los `practitioner_profile_id` con esa especialidad vigente.
   */
  async practitionerIdsBySpecialty(
    em: EntityManager,
    specialtyConceptId: string,
  ): Promise<string[]> {
    const rows = await em
      .getConnection()
      .execute<{ practitioner_profile_id: string }[]>(
        `SELECT DISTINCT ps.practitioner_profile_id
           FROM profiles.practitioner_specialties ps
          WHERE ps.specialty_concept_id = ?
            AND (ps.valid_to IS NULL OR ps.valid_to >= CURRENT_DATE)
          LIMIT ?`,
        // El mismo tope holgado que el filtro de ciudad, y por lo mismo: que el
        // `IN` no crezca sin límite en una especialidad muy poblada.
        [specialtyConceptId, 5000],
        'all',
      );
    return rows.map((row) => row.practitioner_profile_id);
  }

  /**
   * El cuerpo compartido de las dos lecturas de comentarios públicos.
   *
   * Las raíces y las respuestas se diferencian en una línea del `WHERE` y en
   * nada más: mismas columnas, mismo `JOIN` con la vitrina, mismo estado exigido
   * y mismo keyset. Escribirlas dos veces serían dos oportunidades de que una de
   * las dos olvidara el `JOIN`.
   */
  private async listPublicComments(
    em: EntityManager,
    scope: { sql: string; params: unknown[] },
    limit: number,
    after?: { createdAt: string; id: string },
  ): Promise<PublicCommentRow[]> {
    const params: unknown[] = [
      ...scope.params,
      CONCEPTS.STATE_ACTIVE,
      ...PUBLIC_AUTHOR_PARAMS,
    ];
    let conditionCursor = '';
    if (after) {
      conditionCursor = 'AND (c.created_at, c.id) > (?, ?)';
      params.push(new Date(after.createdAt), after.id);
    }
    params.push(limit);

    const rows = await em.getConnection().execute<
      {
        id: string;
        body_text: string;
        created_at: Date;
        reply_count: number | null;
        author_slug: string;
        author_display_name: string;
        author_headline: string | null;
        author_avatar_file_id: string | null;
        author_kind_concept_id: string;
      }[]
    >(
      `SELECT c.id,
              c.body_text,
              c.created_at,
              c.reply_count,
              ${PUBLIC_COLUMNS_AUTHOR}
         FROM community.comments c
         JOIN community.public_profiles pp ON pp.id = c.author_profile_id
        WHERE ${scope.sql}
          AND c.status_concept_id = ?
          AND ${PUBLIC_AUTHOR_SQL}
          ${conditionCursor}
        ORDER BY c.created_at ASC, c.id ASC
        LIMIT ?`,
      params,
      'all',
    );

    const mediaByComment = await this.listPublicCommentMedia(
      em,
      rows.map((row) => row.id),
    );

    return rows.map((row) => ({
      id: row.id,
      bodyText: row.body_text,
      createdAt: new Date(row.created_at),
      replyCount: Number(row.reply_count ?? 0),
      authorSlug: row.author_slug,
      authorDisplayName: row.author_display_name,
      authorHeadline: row.author_headline,
      authorAvatarFileId: row.author_avatar_file_id,
      authorKindConceptId: row.author_kind_concept_id,
      media: mediaByComment.get(row.id) ?? [],
    }));
  }

  /**
   * Adjuntos de un lote de comentarios públicos, agrupados por comentario
   * (REQ-01-011).
   *
   * No hay `JOIN` con `pp`/`AUTOR_PUBLICO_SQL` acá: los `commentIds` ya
   * salieron de `listPublicComments`, que sólo devolvió comentarios de
   * autores públicos — repetir el filtro sería repetir un chequeo que la
   * fila que lo pide ya pasó.
   */
  private async listPublicCommentMedia(
    em: EntityManager,
    commentIds: string[],
  ): Promise<Map<string, PublicCommentMediaRow[]>> {
    const byComment = new Map<string, PublicCommentMediaRow[]>();
    if (commentIds.length === 0) return byComment;
    const markers = commentIds.map(() => '?').join(', ');
    const rows = await em.getConnection().execute<
      {
        comment_id: string;
        file_id: string;
        media_role_concept_id: string;
        alt_text: string | null;
      }[]
    >(
      `SELECT comment_id, file_id, media_role_concept_id, alt_text
         FROM community.comment_media
        WHERE comment_id IN (${markers})
        ORDER BY ordinal ASC NULLS LAST, id ASC`,
      commentIds,
      'all',
    );
    for (const row of rows) {
      const list = byComment.get(row.comment_id) ?? [];
      list.push({
        fileId: row.file_id,
        mediaRoleConceptId: row.media_role_concept_id,
        altText: row.alt_text,
      });
      byComment.set(row.comment_id, list);
    }
    return byComment;
  }
}
