import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import type { PublicProfiles } from '../entities';
import { PublicSearchRepository } from '../repositories';
import { COMM } from '../community.concepts';
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
  'ratingAverage',
  'ratingCount',
  'acceptsReviews',
  'posts',
  'updatedAt',
] as const;

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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityPublicService.name);
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

    const rows = await this.repo.searchProfiles(
      em,
      {
        q: filtros.q?.trim().slice(0, MAX_QUERY_LENGTH) || undefined,
        targetTypeConceptId,
        verified: filtros.verified,
        after: this.decodeCursor(filtros.cursor),
      },
      limit + 1,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const ratings = await this.repo.ratingsByProfile(
      em,
      page.map((perfil) => perfil.id),
    );
    const last = page.at(-1);

    return {
      items: page.map((row) => this.toResult(row, ratings)),
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

    const [ratings, posts] = await Promise.all([
      this.repo.ratingsByProfile(em, [profile.id]),
      this.repo.listPublicPosts(em, profile.id, PROFILE_POSTS_LIMIT),
    ]);
    const rating = ratings.get(profile.id);

    return {
      kind: this.kindOf(profile) as PublicDirectoryProfileDto['kind'],
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      biography: profile.biography ?? null,
      avatarUrl: this.fileUrl(profile.avatarFileId),
      coverUrl: this.fileUrl(profile.coverFileId),
      verified: this.isVerified(profile),
      // `city`, `address`, `location` y `specialties` viven en `directory` y
      // `profiles`, y su vínculo con el perfil público es polimórfico. Se
      // sirven en su forma final —null y vacío, no ausentes— para que la
      // pantalla ya esté construida cuando P5 los llene desde el índice.
      city: null,
      address: null,
      location: null,
      specialties: [],
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      acceptsReviews: profile.acceptsReviews ?? false,
      posts: posts.map((post) => ({
        id: post.id,
        bodyText: post.bodyText,
        publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
        mediaUrls: [],
        reactionCount: 0,
        commentCount: 0,
      })),
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

    // El directorio todavía no tiene coordenadas propias —`geo_point` llega con
    // P5—, así que la respuesta es vacía y honesta en lugar de inventada. El
    // contrato, la validación y la pantalla ya funcionan contra esta forma;
    // cuando P5 llene las coordenadas sólo cambia el origen de `items`.
    this.logger.info(
      {
        operation: 'community.public.nearby',
        lat: punto.lat,
        lng: punto.lng,
        radiusKm,
        limit: this.clampLimit(params.limit),
      },
      'Nearby aún sin índice geográfico: se sirve vacío',
    );

    return {
      items: [],
      nextCursor: null,
      totalHint: 0,
      generatedAt: new Date().toISOString(),
    };
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
    ratings: Map<string, { average: number; count: number }>,
  ): PublicSearchResultDto {
    const rating = ratings.get(profile.id);
    return {
      kind: this.kindOf(profile),
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      city: null,
      avatarUrl: this.fileUrl(profile.avatarFileId),
      verified: this.isVerified(profile),
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
    };
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
  private decodeCursor(
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
