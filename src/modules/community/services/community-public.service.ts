import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import type { PublicProfiles, VerifiedBadges } from '../entities';
import { PublicProfilesRepository, PublicSearchRepository } from '../repositories';
import { FileUploadService } from '../../common/services';
import type { FileContentDto } from '../../common/dto';
import type {
  ProfileAffiliation,
  ProfileLocation,
} from '../repositories/public-search.repository';
import {
  COMMUNITY_PUBLIC_PROFILES_INDEX,
  PUBLIC_DIRECTORY_TENANT,
} from '../../search_platform/constants';
import {
  SearchIndexService,
  type SearchHit,
} from '../../search_platform/services';
import { COMM } from '../community.concepts';
import {
  CommunityVerificationService,
  type VerifiedBadgeDto,
} from './community-verification.service';
import { CommunityProfileStatsService } from './community-profile-stats.service';
import type {
  PublicDirectoryProfileDto,
  PublicNearbyPageDto,
  PublicResultKind,
  PublicSearchPageDto,
  PublicSearchResultDto,
} from '../dto';

/** Tope duro de página. Un anónimo no elige cuánto le cuesta al servidor. */
const MAX_LIMIT = 50;
/** Página por omisión. */
const DEFAULT_LIMIT = 20;
/** Publicaciones que acompañan a una ficha pública. */
const PROFILE_POSTS_LIMIT = 20;
/** Radio por omisión de «lo más cercano», en kilómetros. */
const DEFAULT_RADIUS_KM = 5;
/** Radio máximo: más allá deja de ser «cercano» y pasa a ser el catálogo. */
const MAX_RADIUS_KM = 50;
/** Radio de la Tierra en km, para la distancia en línea recta. */
const EARTH_RADIUS_KM = 6371;
/** Largo máximo del texto buscado. */
const MAX_QUERY_LENGTH = 120;

/** Tipo de sujeto → tipo de resultado del contrato público. */
const KIND_BY_TARGET_CONCEPT: Record<string, PublicResultKind> = {
  [COMM.PROFILE_TARGET_PRACTITIONER]: 'PRACTITIONER',
  [COMM.PROFILE_TARGET_ORGANIZATION]: 'ORGANIZATION',
  [COMM.PROFILE_TARGET_PHARMACY]: 'PHARMACY',
  [COMM.PROFILE_TARGET_DIAGNOSTIC_UNIT]: 'DIAGNOSTIC_UNIT',
  [COMM.PROFILE_TARGET_INSURER]: 'INSURER',
};

/** Prefijo de ruta corta → tipo de sujeto que ese prefijo promete. */
export const TARGET_CONCEPT_BY_SLUG_PREFIX: Record<string, string> = {
  p: COMM.PROFILE_TARGET_PRACTITIONER,
  o: COMM.PROFILE_TARGET_ORGANIZATION,
  f: COMM.PROFILE_TARGET_PHARMACY,
  l: COMM.PROFILE_TARGET_DIAGNOSTIC_UNIT,
  s: COMM.PROFILE_TARGET_INSURER,
};

/**
 * Las claves que la fila del buscador puede tener. Nada más.
 *
 * La prueba compara la salida real contra esta lista y falla si aparece una
 * clave de más. No es redundante con el DTO: el DTO declara la *intención*, y
 * esto verifica lo que efectivamente se serializa.
 */
export const PUBLIC_RESULT_KEYS = [
  'kind',
  'slug',
  'displayName',
  'headline',
  'city',
  'avatarUrl',
  'verified',
  'ratingAverage',
  'ratingCount',
  // P13. `verified` se mantiene porque el front ya lo consume, pero es el
  // resumen booleano de `verifiedBadge.status`, no una segunda verdad.
  'verifiedBadge',
  'hasPublishedAgenda',
  'nextAvailableDate',
] as const;

/** Las claves que la ficha pública puede tener. Nada más. */
export const PUBLIC_PROFILE_KEYS = [
  'kind',
  'slug',
  'displayName',
  'headline',
  'biography',
  'avatarUrl',
  'coverUrl',
  'verified',
  'city',
  'address',
  'location',
  'specialties',
  'trajectory',
  'ratingAverage',
  'ratingCount',
  'acceptsReviews',
  'verifiedBadge',
  'hasPublishedAgenda',
  'nextAvailableDate',
  'posts',
  'updatedAt',
] as const;

/** Todo lo que una página de resultados necesita, resuelto en bloque. */
interface ProfileSignals {
  /** Promedio y cantidad de reseñas, por perfil. */
  readonly ratings: Map<string, { average: number; count: number }>;
  /** Sellos (vigentes y caídos), por perfil. */
  readonly badges: Map<string, VerifiedBadges[]>;
  /** Agenda publicada y primer día con hueco, por sujeto. */
  readonly agenda: Map<
    string,
    { hasAgenda: boolean; nextAvailableDate: string | null }
  >;
  /** Ciudad y punto, por sujeto. */
  readonly locations: Map<string, ProfileLocation>;
}

/**
 * Sirve el buscador público (P2). Sin sesión, sin tenant, sin PHI.
 *
 * ## La proyección es la barrera
 *
 * `@Public()` exime del contexto de tenant, así que estas lecturas atraviesan
 * todas las organizaciones y el aislamiento habitual no protege nada acá. Lo
 * único que separa lo publicable de lo interno es que **la proyección se arma
 * campo por campo en este archivo**, nunca serializando la entidad.
 *
 * Por eso `toResult()` y `getBySlug()` enumeran claves a mano en vez de hacer
 * un *spread*. Un `...profile` traería `tenantId`, `targetId`, cinco
 * `*ConceptId` y dos `*FileId` —identificadores internos— a una respuesta
 * anónima, y nadie lo notaría hasta que alguien los usara. El spec compara las
 * claves de la salida contra `PUBLIC_RESULT_KEYS` y `PUBLIC_PROFILE_KEYS`, y
 * falla si aparece una de más: es la prueba que P3 exige, y la que hace que
 * agregar un campo sea una decisión y no un descuido.
 *
 * ## Nada revela existencia
 *
 * Un slug inexistente y uno despublicado devuelven **el mismo 404**. No hay
 * 403 en esta superficie: un 403 confirmaría que el recurso existe.
 */
@Injectable()
export class CommunityPublicService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas del directorio público.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PublicSearchRepository,
    private readonly profiles: PublicProfilesRepository,
    private readonly files: FileUploadService,
    private readonly searchIndex: SearchIndexService,
    private readonly verification: CommunityVerificationService,
    private readonly stats: CommunityProfileStatsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityPublicService.name);
  }

  /**
   * Sirve una imagen de la superficie pública: el avatar o la portada de una
   * vitrina publicada, o una foto adjunta a una de sus publicaciones.
   *
   * No hay actor que demuestre nada —es una lectura anónima—, así que lo que
   * autoriza es qué **es** el archivo. Un id que no pasa ninguna de las dos
   * puertas devuelve el mismo 404 que uno inexistente: a quien prueba ids al
   * azar no se le confirma cuáles corresponden a algo real.
   *
   * @param fileId - Identificador del archivo pedido.
   * @returns Bytes y tipo MIME para servir por HTTP.
   * @throws ResourceNotFoundException si el archivo no está colgado de nada público.
   */
  async getPublicMedia(fileId: string): Promise<FileContentDto> {
    const em = this.em.fork();
    const permitido =
      (await this.profiles.isPublicMedia(em, fileId)) ||
      (await this.repo.isPublicPostMedia(em, fileId));
    if (!permitido) {
      throw new ResourceNotFoundException('Archivo no encontrado', { fileId });
    }
    return this.files.downloadPublicMedia(fileId);
  }

  /**
   * Búsqueda unificada y sus verticales.
   *
   * @param filtros - Texto, vertical, verificación, cursor y tope.
   * @returns Página de resultados públicos.
   */
  async search(filtros: {
    /** Texto libre. */
    q?: string;
    /** Vertical al que acotar; ausente = búsqueda unificada. */
    kind?: PublicResultKind;
    /** Sólo prestadores verificados. */
    verified?: boolean;
    /** Cursor opaco. */
    cursor?: string;
    /** Tope pedido. */
    limit?: number;
  }): Promise<PublicSearchPageDto> {
    const em = this.em.fork();
    const limit = this.clampLimit(filtros.limit);

    const targetTypeConceptId = filtros.kind
      ? Object.keys(KIND_BY_TARGET_CONCEPT).find(
          (id) => KIND_BY_TARGET_CONCEPT[id] === filtros.kind,
        )
      : undefined;

    // Un vertical pedido que no tiene concepto de sujeto **no se puede
    // filtrar**, y dejar caer el filtro devuelve el directorio entero: era lo
    // que hacía `/public/search/medications`, que servía la lista completa de
    // profesionales a quien buscaba un remedio. Un medicamento no es un perfil
    // —vive en el catálogo de farmacia, no en `community.public_profiles`—, así
    // que acá no hay nada que devolver y la respuesta honesta es vacía, como ya
    // hace `nearby` mientras no existan las coordenadas.
    if (filtros.kind !== undefined && targetTypeConceptId === undefined) {
      this.logger.info(
        { operation: 'community.public.search', kind: filtros.kind },
        'Vertical sin sujeto en el directorio: se sirve vacío en vez del directorio completo',
      );
      return {
        items: [],
        nextCursor: null,
        totalHint: 0,
        generatedAt: new Date().toISOString(),
      };
    }

    const q = filtros.q?.trim().slice(0, MAX_QUERY_LENGTH) || undefined;

    // El índice primero; el SQL queda como red. Si OpenSearch no responde el
    // buscador **encuentra menos y peor**, que es un defecto; devolver 500
    // sería una caída de la portada pública.
    const desdeIndice = await this.searchFromIndex({
      q,
      kind: filtros.kind,
      verified: filtros.verified,
      cursor: filtros.cursor,
      limit,
    });
    if (desdeIndice) return desdeIndice;

    const rows = await this.repo.searchProfiles(
      em,
      {
        q,
        targetTypeConceptId,
        verified: filtros.verified,
        after: this.decodeSqlCursor(filtros.cursor),
      },
      limit + 1,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const señales = await this.señalesDe(em, page);
    const last = page.at(-1);

    // Aparecer no es lo mismo que ser abierto, y el profesional necesita ver
    // las dos: «apareciste 200 veces y te abrieron 3» es un problema de la
    // tarjeta, no de la búsqueda.
    for (const row of page) {
      this.stats.recordImpressions(row.tenantId, [row.id]);
    }

    return {
      items: page.map((row) => this.toResult(row, señales)),
      nextCursor: hasMore && last ? this.encodeCursor(last) : null,
      totalHint: null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Ficha pública por slug, acotada al tipo que promete el prefijo de la ruta.
   *
   * @param slug - Slug estable del perfil.
   * @param expectedTargetConceptId - Tipo que exige el prefijo (`/p/`, `/o/`…).
   * @returns Ficha pública con sus publicaciones.
   * @throws ResourceNotFoundException si no existe, no es público o es de otro tipo.
   */
  async getBySlug(
    slug: string,
    expectedTargetConceptId?: string,
  ): Promise<PublicDirectoryProfileDto> {
    const em = this.em.fork();
    const profile = await this.repo.findPublicBySlug(em, slug);

    // Un slug del tipo equivocado es un 404 y no una redirección: `/p/` promete
    // un profesional, y servir una farmacia ahí rompería el JSON-LD de la
    // página, que declara `Physician`.
    if (
      !profile ||
      (expectedTargetConceptId &&
        profile.targetTypeConceptId !== expectedTargetConceptId)
    )
      throw new ResourceNotFoundException('No encontrado', { slug });

    const kind = this.kindOf(profile) as PublicDirectoryProfileDto['kind'];
    // Sólo un profesional tiene especialidad y trayectoria laboral; pedirlas
    // para el resto sería un viaje que siempre vuelve vacío.
    const [señales, posts, especialidades, trayectoria] = await Promise.all([
      this.señalesDe(em, [profile]),
      this.repo.listPublicPosts(em, profile.id, PROFILE_POSTS_LIMIT),
      kind === 'PRACTITIONER'
        ? this.repo.specialtiesByPractitioner(em, [profile.targetId])
        : Promise.resolve(new Map<string, string[]>()),
      kind === 'PRACTITIONER'
        ? this.repo.affiliationsByPractitioner(em, [profile.targetId])
        : Promise.resolve(new Map<string, ProfileAffiliation[]>()),
    ]);
    // La interacción de cada publicación: sus imágenes, y cuántas reacciones y
    // comentarios lleva. Un solo viaje para todo el lote.
    const engagement = await this.repo.engagementByPost(
      em,
      posts.map((post) => post.id),
    );

    const rating = señales.ratings.get(profile.id);
    const badge = this.verification.readBadge(
      profile,
      señales.badges.get(profile.id) ?? [],
    );
    const agenda = señales.agenda.get(profile.targetId);
    const ubicacion = señales.locations.get(profile.targetId);

    // ORG-PUB-005. No se espera: la ficha de un profesional no puede caerse
    // ni tardar más porque el contador esté ocupado.
    this.stats.recordView(profile.tenantId, profile.id);

    return {
      kind,
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      biography: profile.biography ?? null,
      avatarUrl: this.fileUrl(profile.avatarFileId),
      coverUrl: this.fileUrl(profile.coverFileId),
      verified: badge.status === 'VERIFIED',
      city: ubicacion?.city ?? null,
      address: ubicacion?.address ?? null,
      location:
        ubicacion?.lat != null && ubicacion?.lng != null
          ? { lat: ubicacion.lat, lng: ubicacion.lng }
          : null,
      specialties: especialidades.get(profile.targetId) ?? [],
      trajectory: trayectoria.get(profile.targetId) ?? [],
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      acceptsReviews: profile.acceptsReviews ?? false,
      verifiedBadge: badge,
      hasPublishedAgenda: agenda?.hasAgenda ?? false,
      nextAvailableDate: agenda?.nextAvailableDate ?? null,
      posts: posts.map((post) => {
        const extra = engagement.get(post.id);
        return {
          id: post.id,
          bodyText: post.bodyText,
          publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
          mediaUrls: (extra?.imageFileIds ?? [])
            .map((fileId) => this.fileUrl(fileId))
            .filter((url): url is string => url !== null),
          reactionCount: extra?.reactionCount ?? 0,
          commentCount: extra?.commentCount ?? 0,
        };
      }),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Lo más cercano a un punto, por distancia en línea recta.
   *
   * Coordenadas ausentes o fuera de rango dan **400**, no una página vacía: es
   * el único caso de esta superficie donde el cliente puede estar equivocado de
   * forma no ambigua, y devolver vacío lo haría parecer un catálogo sin datos.
   *
   * @param params - Punto, radio, vertical y tope.
   * @returns Página ordenada de menor a mayor distancia.
   * @throws BadRequestException si las coordenadas no son válidas.
   */
  async nearby(params: {
    /** Latitud. */
    lat?: number;
    /** Longitud. */
    lng?: number;
    /** Radio en kilómetros. */
    radiusKm?: number;
    /** Vertical al que acotar. */
    kind?: PublicResultKind;
    /** Tope pedido. */
    limit?: number;
  }): Promise<PublicNearbyPageDto> {
    const punto = this.requireCoordinates(params.lat, params.lng);
    const radiusKm = Math.min(
      Math.max(params.radiusKm ?? DEFAULT_RADIUS_KM, 1),
      MAX_RADIUS_KM,
    );

    const limit = this.clampLimit(params.limit);

    // `geo_distance` sobre el `geo_point` del índice: el orden lo calcula
    // OpenSearch sobre todo el directorio, no este proceso sobre una página ya
    // recortada. La diferencia importa — ordenar en memoria la página que
    // devolvió el SQL da «la más cercana de las veinte primeras alfabéticas»,
    // que no es la más cercana.
    try {
      const result = await this.searchIndex.search(
        COMMUNITY_PUBLIC_PROFILES_INDEX,
        {
          tenantId: PUBLIC_DIRECTORY_TENANT,
          filters: params.kind
            ? [{ field: 'kind', values: [params.kind] }]
            : undefined,
          size: limit,
          geo: {
            field: 'location',
            lat: punto.lat,
            lng: punto.lng,
            radiusKm,
            sortByDistance: true,
          },
        },
      );

      this.logger.info(
        {
          operation: 'community.public.nearby',
          radiusKm,
          limit,
          total: result.total,
        },
        'Nearby resuelto por el índice geográfico',
      );

      return {
        items: result.hits.flatMap((hit) => {
          const punto = this.pointOf(hit.source.location);
          // Un acierto sin punto no puede existir bajo `geo_distance`, pero si
          // apareciera se descarta: el DTO promete `location` y `distanceKm`, y
          // servirlos inventados es peor que servir un resultado menos.
          if (!punto || hit.distanceKm === undefined) return [];
          return [
            {
              ...this.hitToResult(hit),
              distanceKm: hit.distanceKm,
              location: punto,
            },
          ];
        }),
        nextCursor: null,
        totalHint: result.total,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Degradar, no romper: el SQL calcula la misma distancia en línea recta
      // sobre `common.addresses`, acotado por una caja envolvente para no leer
      // el país entero.
      this.logger.warn(
        {
          operation: 'community.public.nearby',
          err: error instanceof Error ? error.message : String(error),
        },
        'El índice geográfico no respondió: se degrada a SQL',
      );
      return this.nearbyFromSql(punto, radiusKm, limit, params.kind);
    }
  }

  /**
   * «Más cercana» sin índice: caja envolvente en SQL + haversine en memoria.
   *
   * La caja acota por latitud y longitud antes de traer nada, así que el coste
   * no depende del tamaño del directorio sino del de la zona; el orden fino lo
   * hace `haversineKm`, que es la misma fórmula que rotula la pantalla.
   */
  private async nearbyFromSql(
    punto: { lat: number; lng: number },
    radiusKm: number,
    limit: number,
    kind?: PublicResultKind,
  ): Promise<PublicNearbyPageDto> {
    const em = this.em.fork();
    const targetTypeConceptId = kind
      ? Object.keys(KIND_BY_TARGET_CONCEPT).find(
          (id) => KIND_BY_TARGET_CONCEPT[id] === kind,
        )
      : undefined;

    const filas = await this.repo.nearbyProfiles(
      em,
      { ...punto, radiusKm, targetTypeConceptId },
      // Se piden de más porque la caja envolvente incluye esquinas que el
      // radio real deja fuera; el recorte fino es el haversine de abajo.
      limit * 4,
    );

    const señales = await this.señalesDe(
      em,
      filas.map((fila) => fila.profile),
    );

    const items = filas
      .map((fila) => ({
        fila,
        distanceKm: haversineKm(punto, { lat: fila.lat, lng: fila.lng }),
      }))
      .filter((entrada) => entrada.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit)
      .map((entrada) => ({
        ...this.toResult(entrada.fila.profile, señales),
        city: entrada.fila.city,
        distanceKm: entrada.distanceKm,
        location: { lat: entrada.fila.lat, lng: entrada.fila.lng },
      }));

    return {
      items,
      nextCursor: null,
      totalHint: items.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /** El `geo_point` de un documento, si es un punto utilizable. */
  private pointOf(valor: unknown): { lat: number; lng: number } | null {
    if (typeof valor !== 'object' || valor === null) return null;
    const bruto = valor as { lat?: unknown; lon?: unknown; lng?: unknown };
    const lat = bruto.lat;
    const lng = bruto.lon ?? bruto.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  /**
   * Búsqueda contra el índice, o `null` si el índice no puede servirla.
   *
   * Devolver `null` en vez de lanzar es deliberado: quien llama no tiene que
   * saber si hubo índice, sólo que tiene que seguir por SQL. Cualquier fallo
   * —cluster caído, índice todavía sin crear, timeout— cae por el mismo lado.
   *
   * @param filtros - Texto, vertical, verificación, cursor y tope.
   * @returns La página, o `null` para que el llamador degrade a SQL.
   */
  private async searchFromIndex(filtros: {
    /** Texto libre, ya recortado. */
    q?: string;
    /** Vertical al que acotar. */
    kind?: PublicResultKind;
    /** Sólo verificados. */
    verified?: boolean;
    /** Cursor opaco. */
    cursor?: string;
    /** Tope ya acotado. */
    limit: number;
  }): Promise<PublicSearchPageDto | null> {
    try {
      const filtrosIndice: Array<{ field: string; values: string[] }> = [];
      if (filtros.kind) {
        filtrosIndice.push({ field: 'kind', values: [filtros.kind] });
      }
      if (filtros.verified) {
        filtrosIndice.push({ field: 'verified', values: ['true'] });
      }

      const result = await this.searchIndex.search(
        COMMUNITY_PUBLIC_PROFILES_INDEX,
        {
          tenantId: PUBLIC_DIRECTORY_TENANT,
          query: filtros.q,
          filters: filtrosIndice,
          size: filtros.limit + 1,
          searchAfter: this.decodeIndexCursor(filtros.cursor),
          // Decisión D7: los no verificados se indexan y **rankean después**. Sin
          // texto no hay relevancia que ordenar, así que manda el alfabético —el
          // mismo orden que sirve el SQL, para que la primera página no cambie
          // según quién respondió.
          sort: filtros.q
            ? [{ field: 'verified', direction: 'desc' }]
            : [
                { field: 'verified', direction: 'desc' },
                { field: 'displayName.raw', direction: 'asc' },
              ],
        },
      );

      const hasMore = result.hits.length > filtros.limit;
      const page = hasMore ? result.hits.slice(0, filtros.limit) : result.hits;
      const last = page.at(-1);

      return {
        items: page.map((hit) => this.hitToResult(hit)),
        nextCursor:
          hasMore && last?.sort ? this.encodeIndexCursor(last.sort) : null,
        totalHint: result.total,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(
        {
          operation: 'community.public.search',
          err: error instanceof Error ? error.message : String(error),
        },
        'El índice de búsqueda no respondió: se degrada a SQL',
      );
      return null;
    }
  }

  /**
   * Proyecta un acierto del índice a la fila del buscador.
   *
   * **Enumera las claves a mano**, igual que `toResult()`. El documento
   * indexado ya está acotado por `documentKeys`, pero eso protege la escritura;
   * esto protege la lectura, y las dos barreras tienen que existir para que
   * añadir un campo al índice no lo publique solo.
   */
  private hitToResult(hit: SearchHit): PublicSearchResultDto {
    const source = hit.source;
    const texto = (clave: string): string | null => {
      const valor = source[clave];
      return typeof valor === 'string' && valor.length > 0 ? valor : null;
    };
    const numero = (clave: string): number | null => {
      const valor = source[clave];
      return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
    };

    // El sello viaja al índice descompuesto en campos planos —OpenSearch no
    // gana nada indexando un objeto anidado que nadie filtra— y se recompone
    // acá en la MISMA forma que sirve el camino SQL. Si las dos formas
    // divergieran, el mismo perfil se vería distinto según quién respondió.
    const estado = texto('verifiedBadgeStatus');
    const verifiedBadge: VerifiedBadgeDto = {
      status:
        estado === 'VERIFIED' || estado === 'EXPIRED'
          ? estado
          : source.verified === true
            ? 'VERIFIED'
            : 'NONE',
      badgeTypeConceptId: texto('badgeTypeConceptId'),
      verificationMethodConceptId: texto('verificationMethodConceptId'),
      verifiedAt: texto('verifiedAt'),
      validUntil: texto('validUntil'),
    };

    return {
      kind: (texto('kind') ?? 'PRACTITIONER') as PublicResultKind,
      slug: texto('slug') ?? '',
      displayName: texto('displayName') ?? '',
      headline: texto('headline'),
      city: texto('city'),
      avatarUrl: texto('avatarUrl'),
      verified: verifiedBadge.status === 'VERIFIED',
      ratingAverage: numero('ratingAverage'),
      ratingCount: numero('ratingCount') ?? 0,
      verifiedBadge,
      hasPublishedAgenda: source.hasPublishedAgenda === true,
      nextAvailableDate: texto('nextAvailableDate'),
    };
  }

  /** Cursor del índice: las claves de orden del último acierto. */
  private encodeIndexCursor(sort: unknown[]): string {
    return Buffer.from(JSON.stringify({ s: sort })).toString('base64url');
  }

  /**
   * Claves de `search_after` de un cursor, si lo es.
   *
   * Un cursor de la variante SQL (`{d, i}`) devuelve `undefined` en vez de
   * romper: entre dos peticiones el índice puede haberse caído o vuelto, y el
   * cliente no tiene por qué enterarse — pierde la continuación, no la página.
   */
  private decodeIndexCursor(cursor?: string): unknown[] | undefined {
    if (!cursor) return undefined;
    try {
      const crudo: unknown = JSON.parse(
        Buffer.from(cursor, 'base64url').toString(),
      );
      const claves = (crudo as { s?: unknown })?.s;
      return Array.isArray(claves) && claves.length > 0 ? claves : undefined;
    } catch {
      return undefined;
    }
  }

  /** Exige coordenadas válidas, o 400. */
  private requireCoordinates(
    lat?: number,
    lng?: number,
  ): { lat: number; lng: number } {
    const valida = (valor: number | undefined, tope: number): boolean =>
      valor !== undefined &&
      Number.isFinite(valor) &&
      valor >= -tope &&
      valor <= tope;

    if (!valida(lat, 90) || !valida(lng, 180))
      throw new BadRequestException(
        'Se requieren coordenadas válidas: lat en [-90,90] y lng en [-180,180]',
      );
    return { lat: lat as number, lng: lng as number };
  }

  /**
   * Proyecta un perfil a la fila del buscador.
   *
   * **Enumera las claves a mano y no hace *spread*.** Ver la nota de la clase:
   * es la única barrera entre lo publicable y lo interno.
   */
  private toResult(
    profile: PublicProfiles,
    señales: ProfileSignals,
  ): PublicSearchResultDto {
    const rating = señales.ratings.get(profile.id);
    const badge = this.verification.readBadge(
      profile,
      señales.badges.get(profile.id) ?? [],
    );
    const agenda = señales.agenda.get(profile.targetId);
    return {
      kind: this.kindOf(profile),
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      city: señales.locations.get(profile.targetId)?.city ?? null,
      avatarUrl: this.fileUrl(profile.avatarFileId),
      // El booleano deriva del sello, no de la columna resumen: si las dos se
      // desincronizaran, manda el que tiene la evidencia detrás.
      verified: badge.status === 'VERIFIED',
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      verifiedBadge: badge,
      hasPublishedAgenda: agenda?.hasAgenda ?? false,
      nextAvailableDate: agenda?.nextAvailableDate ?? null,
    };
  }

  /**
   * Resuelve en bloque todo lo que una página de resultados necesita.
   *
   * Cuatro consultas por página, no cuatro por fila: una tarjeta del buscador
   * muestra reseñas, sello, ciudad y agenda, y un listado de cincuenta
   * prestadores no puede costar doscientos viajes.
   */
  private async señalesDe(
    em: EntityManager,
    page: PublicProfiles[],
  ): Promise<ProfileSignals> {
    const ids = page.map((perfil) => perfil.id);
    const targetIds = page.map((perfil) => perfil.targetId);

    const [ratings, badges, agenda, locations] = await Promise.all([
      this.repo.ratingsByProfile(em, ids),
      this.repo.badgesByProfiles(em, ids),
      this.repo.agendaByPractitioner(em, targetIds),
      this.repo.locationsByOwner(em, targetIds),
    ]);
    return { ratings, badges, agenda, locations };
  }

  /** Tipo de resultado; un perfil de usuario se sirve como profesional. */
  private kindOf(profile: PublicProfiles): PublicResultKind {
    return (
      KIND_BY_TARGET_CONCEPT[profile.targetTypeConceptId] ?? 'PRACTITIONER'
    );
  }

  /**
   * Un perfil está verificado cuando su verificación está activa.
   *
   * `STATE_PENDING` —el valor con que nacen los perfiles— cuenta como **no**
   * verificado. Es la mitad de la decisión D7: los no verificados aparecen en
   * el directorio, porque excluirlos lo dejaría vacío, pero nunca se muestran
   * como verificados. La jerarquía la pone `verified`, no la ausencia.
   */
  private isVerified(profile: PublicProfiles): boolean {
    return profile.verificationStatusConceptId === CONCEPTS.STATE_ACTIVE;
  }

  /**
   * URL pública de un archivo, o `null`.
   *
   * Devuelve una ruta servida por la propia API y **nunca el identificador del
   * archivo**: un uuid interno regalado a un anónimo es un dato que no se puede
   * volver a esconder.
   */
  private fileUrl(fileId?: string): string | null {
    return fileId ? `/public/media/${fileId}` : null;
  }

  /** Recorta el tope pedido en vez de rechazarlo: el contrato lo promete así. */
  private clampLimit(limit?: number): number {
    if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
    return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
  }

  /**
   * Cursor opaco de continuación.
   *
   * Va como JSON y no como `"nombre id"`: **todo nombre visible tiene espacios**
   * —«Dra. Marisol Quispe Ticona»—, así que partir por espacio devolvía «Dra.»
   * como clave y saltaba a una página equivocada en la segunda pantalla.
   */
  private encodeCursor(row: PublicProfiles): string {
    return Buffer.from(
      JSON.stringify({ d: row.displayName, i: row.id }),
    ).toString('base64url');
  }

  /** Descompone el cursor; uno corrupto se ignora, no rompe la página. */
  private decodeSqlCursor(
    cursor?: string,
  ): { displayName: string; id: string } | undefined {
    if (!cursor) return undefined;
    try {
      const crudo: unknown = JSON.parse(
        Buffer.from(cursor, 'base64url').toString(),
      );
      if (
        typeof crudo === 'object' &&
        crudo !== null &&
        typeof (crudo as { d?: unknown }).d === 'string' &&
        typeof (crudo as { i?: unknown }).i === 'string'
      )
        return {
          displayName: (crudo as { d: string }).d,
          id: (crudo as { i: string }).i,
        };
      return undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Distancia en línea recta entre dos puntos, en kilómetros y con una decimal.
 *
 * En línea recta, no de recorrido: la ficha V65-12 exige ese rótulo en pantalla
 * y el cálculo tiene que decir lo mismo que el rótulo.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (grados: number): number => (grados * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)) * 10) / 10;
}
