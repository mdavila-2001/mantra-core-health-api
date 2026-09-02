import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import {
  COMMUNITY_PUBLIC_PROFILES_INDEX,
  PUBLIC_DIRECTORY_TENANT,
} from '../../search_platform/constants';
import { SearchIndexService } from '../../search_platform/services';
import { PublicProfiles } from '../entities';
import { PublicSearchRepository } from '../repositories';
import {
  CommunityVerificationService,
  type VerifiedBadgeDto,
} from './community-verification.service';
import type { ProfileLocation } from '../repositories/public-search.repository';
import type { SearchIndexHealthDto } from '../dto';
import { COMM } from '../community.concepts';

/** Perfiles por lote del reindexado. Ni tan chico que multiplique viajes ni tan
 * grande que un lote fallido cueste rehacer medio directorio. */
const BATCH_SIZE = 200;

/** Tope de lotes de un reindexado: cota dura contra un bucle que no avanza. */
const MAX_BATCHES = 5_000;

/**
 * Tipo de sujeto → vertical del contrato público.
 *
 * Es la misma tabla que usa `CommunityPublicService`, y tiene que serlo: si el
 * índice dijera `ORGANIZATION` donde el DTO dice `PRACTITIONER`, el mismo perfil
 * aparecería en una pestaña distinta según respondiera el índice o el SQL.
 */
const KIND_BY_TARGET_CONCEPT: Record<string, string> = {
  [COMM.PROFILE_TARGET_PRACTITIONER]: 'PRACTITIONER',
  [COMM.PROFILE_TARGET_ORGANIZATION]: 'ORGANIZATION',
  [COMM.PROFILE_TARGET_PHARMACY]: 'PHARMACY',
  [COMM.PROFILE_TARGET_DIAGNOSTIC_UNIT]: 'DIAGNOSTIC_UNIT',
  [COMM.PROFILE_TARGET_INSURER]: 'INSURER',
};

/**
 * Documento del directorio público tal como se indexa.
 *
 * Sus claves son exactamente `documentKeys` del índice, y `SearchIndexService`
 * rechaza la escritura si aparece una de más. No hay `tenantId` real, ni
 * `targetId`, ni ningún `*ConceptId`: el índice es la copia que se consulta sin
 * sesión, y un uuid interno ahí no se puede volver a esconder.
 */
export interface PublicProfileDocument {
  /** Vertical del resultado (`PRACTITIONER`, `ORGANIZATION`…). */
  kind: string;
  /** Dirección legible y estable del perfil. */
  slug: string;
  /** Nombre que se muestra. */
  displayName: string;
  /** Titular corto, o `null`. */
  headline: string | null;
  /** Biografía pública, o `null`. */
  biography: string | null;
  /** Especialidades legibles (nunca sus conceptos). */
  specialties: string[];
  /** Ciudad legible, o `null`. */
  city: string | null;
  /** Ruta servida por la API, nunca el id del archivo. */
  avatarUrl: string | null;
  /** Portada, como ruta servida por la API. Misma regla que el avatar. */
  coverUrl: string | null;
  /** Calle legible de la dirección vigente, o `null`. */
  address: string | null;
  /** Si el sello de verificado está vigente. Resumen de `verifiedBadgeStatus`. */
  verified: boolean;
  /** Estado del sello: `VERIFIED`, `EXPIRED` o `NONE`. */
  verifiedBadgeStatus: string;
  /** Qué se verificó, o `null`. */
  badgeTypeConceptId: string | null;
  /** Cómo se verificó, o `null`. */
  verificationMethodConceptId: string | null;
  /** Desde cuándo vale el sello, en ISO. */
  verifiedAt: string | null;
  /** Hasta cuándo vale el sello, en ISO. */
  validUntil: string | null;
  /** Si tiene agenda publicada (`PAC-CITA-001`). */
  hasPublishedAgenda: boolean;
  /** Primer día con hueco (`YYYY-MM-DD`), o `null`. */
  nextAvailableDate: string | null;
  /** Promedio de reseñas publicadas, o `null`. */
  ratingAverage: number | null;
  /** Cantidad de reseñas publicadas. */
  ratingCount: number;
  /** Punto `geo_point`, o `null` si la dirección no tiene coordenadas. */
  location: { lat: number; lon: number } | null;
  /** Última modificación del perfil, en ISO. */
  updatedAt: string;
}

/** Resultado de un reindexado completo. */
export interface ReindexOutcome {
  /** Documentos efectivamente indexados. */
  indexed: number;
  /** Perfiles públicos que había que indexar. */
  total: number;
  /** Documentos que el índice confirma tener al terminar. */
  confirmed: number;
  /** Si algún lote reportó errores parciales. */
  errors: boolean;
}

/**
 * Proyecta el directorio público hacia OpenSearch (P10).
 *
 * ## Qué resuelve
 *
 * `search_platform` corría en `:9201` desde el primer día y no tenía un solo
 * documento: el buscador público filtraba en SQL con `LIKE`, sin stemming, sin
 * ranking y con «más cercana» calculada en memoria sobre coordenadas que no
 * existían. Este servicio es el que llena el índice; `CommunityPublicService`
 * es el que lo consulta.
 *
 * ## La proyección es la barrera, otra vez
 *
 * `toDocument()` enumera las claves a mano, igual que `toResult()` en el
 * servicio público y por la misma razón. Acá pesa más: el índice sobrevive al
 * request, se puede volcar entero y no lo protege ningún guard. Por eso el
 * índice declara `documentKeys` y la escritura falla —no filtra en silencio—
 * si el documento gana un campo.
 *
 * ## Idempotencia
 *
 * El id del documento es el id del perfil público, así que reindexar dos veces
 * deja el índice igual. Un tick del worker que se solape con el anterior, o un
 * reintento tras un fallo parcial, no duplican nada.
 */
@Injectable()
export class CommunitySearchIndexService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas del directorio público.
   * @param search - Servicio de indexación de `search_platform`.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PublicSearchRepository,
    private readonly search: SearchIndexService,
    private readonly verification: CommunityVerificationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySearchIndexService.name);
  }

  /**
   * Reindexa el directorio público entero, desde cero.
   *
   * Recrea el índice antes de empezar —es la única forma de que un cambio de
   * analizador o de mapping tenga efecto— y recorre los perfiles por clave, no
   * por `offset`. Termina comparando lo indexado contra lo que el índice dice
   * tener: «indexados N de N» sólo vale si el índice lo confirma.
   *
   * @param opts - `recreate: false` reutiliza el índice existente (upsert).
   * @returns Conteos del barrido.
   */
  async reindexAll(opts?: { recreate?: boolean }): Promise<ReindexOutcome> {
    const recreate = opts?.recreate !== false;
    if (recreate) {
      await this.search.recreateIndex(COMMUNITY_PUBLIC_PROFILES_INDEX);
    } else {
      await this.search.ensureIndex(COMMUNITY_PUBLIC_PROFILES_INDEX);
    }

    const em = this.em.fork();
    const total = await this.repo.countIndexable(em);

    let indexed = 0;
    let errors = false;
    let after: string | undefined;

    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const rows = await this.repo.listIndexable(em, after, BATCH_SIZE);
      if (rows.length === 0) break;

      const documents = await this.buildDocuments(em, rows);
      const result = await this.search.bulkIndex(
        COMMUNITY_PUBLIC_PROFILES_INDEX,
        PUBLIC_DIRECTORY_TENANT,
        documents,
      );
      indexed += result.indexed;
      errors = errors || result.errors;
      after = rows.at(-1)?.id;

      // El lote incompleto es el último: pedir otro sólo suma un viaje vacío.
      if (rows.length < BATCH_SIZE) break;
    }

    const confirmed = await this.search.countDocuments(
      COMMUNITY_PUBLIC_PROFILES_INDEX,
      PUBLIC_DIRECTORY_TENANT,
    );

    this.logger.info(
      {
        operation: 'community.search.reindex',
        indexed,
        total,
        confirmed,
        errors,
      },
      `Reindexado del directorio público: indexados ${indexed} de ${total} (el índice confirma ${confirmed})`,
    );

    return { indexed, total, confirmed, errors };
  }

  /**
   * Indexa un perfil suelto (alta o edición).
   *
   * Un perfil que dejó de ser público o activo **se borra del índice** en vez
   * de reindexarse: dejarlo con `status` viejo lo mantendría en resultados
   * anónimos después de que su dueño lo despublicó, que es el peor final
   * posible para esta superficie.
   *
   * @param profileId - Perfil público a proyectar.
   * @returns Qué se hizo con el documento.
   */
  async indexProfile(
    profileId: string,
  ): Promise<{ action: 'indexed' | 'removed' }> {
    const em = this.em.fork();
    const profile = await em.findOne(PublicProfiles, { id: profileId });

    const publicable =
      profile !== null &&
      profile.visibilityConceptId === COMM.PROFILE_VISIBILITY_PUBLIC &&
      profile.statusConceptId === CONCEPTS.STATE_ACTIVE;

    if (!publicable) {
      await this.removeProfile(profileId);
      return { action: 'removed' };
    }

    const [document] = await this.buildDocuments(em, [profile]);
    await this.search.indexDocument(
      COMMUNITY_PUBLIC_PROFILES_INDEX,
      PUBLIC_DIRECTORY_TENANT,
      document.id,
      document.document,
    );
    return { action: 'indexed' };
  }

  /** Saca un perfil del índice; que no estuviera no es un error. */
  async removeProfile(profileId: string): Promise<{ deleted: boolean }> {
    return this.search.deleteDocument(
      COMMUNITY_PUBLIC_PROFILES_INDEX,
      PUBLIC_DIRECTORY_TENANT,
      profileId,
    );
  }

  /**
   * Estado del índice frente a la base.
   *
   * `serving` responde la pregunta operativa —«¿el buscador está sirviendo el
   * índice o el SQL?»— sin provocar una búsqueda: un índice disponible pero
   * vacío **no** está sirviendo, aunque el cluster responda en verde.
   *
   * @returns Disponibilidad y conteos.
   */
  async health(): Promise<SearchIndexHealthDto> {
    const em = this.em.fork();
    const profiles = await this.repo.countIndexable(em);

    try {
      await this.search.ping();
      // El índice puede no existir todavía (cluster nuevo, o antes del primer
      // reindexado). Eso no es «el cluster no responde»: es cero documentos, y
      // distinguirlos es lo que evita mandar a reiniciar OpenSearch cuando lo
      // que falta es correr `search:reindex`.
      const documents = await this.search
        .countDocuments(
          COMMUNITY_PUBLIC_PROFILES_INDEX,
          PUBLIC_DIRECTORY_TENANT,
        )
        .catch(() => 0);
      return {
        available: true,
        profiles,
        documents,
        serving: documents > 0,
      };
    } catch (error) {
      this.logger.warn(
        {
          operation: 'community.search.health',
          err: error instanceof Error ? error.message : String(error),
        },
        'El índice de búsqueda no responde',
      );
      return { available: false, profiles, documents: null, serving: false };
    }
  }

  // --- Internos -------------------------------------------------------------

  /**
   * Arma los documentos de un lote resolviendo en bloque lo que cada perfil
   * necesita: reseñas, ubicación y especialidades. Tres consultas por lote, no
   * tres por perfil.
   */
  private async buildDocuments(
    em: EntityManager,
    rows: PublicProfiles[],
  ): Promise<Array<{ id: string; document: Record<string, unknown> }>> {
    const ids = rows.map((row) => row.id);
    const targetIds = rows.map((row) => row.targetId);

    const [ratings, locations, specialties, badges, agenda] = await Promise.all(
      [
        this.repo.ratingsByProfile(em, ids),
        this.repo.locationsByOwner(em, targetIds),
        this.repo.specialtiesByPractitioner(em, targetIds),
        this.repo.badgesByProfiles(em, ids),
        this.repo.agendaByPractitioner(em, targetIds),
      ],
    );

    return rows.map((row) => ({
      id: row.id,
      document: this.toDocument(
        row,
        ratings.get(row.id) ?? null,
        locations.get(row.targetId) ?? null,
        specialties.get(row.targetId) ?? [],
        // El sello se calcula con el MISMO servicio que sirve el camino SQL:
        // si el índice derivara el estado por su cuenta, el mismo perfil se
        // vería verificado o vencido según quién respondiera la búsqueda.
        this.verification.readBadge(row, badges.get(row.id) ?? []),
        agenda.get(row.targetId) ?? null,
      ) as unknown as Record<string, unknown>,
    }));
  }

  /**
   * Proyecta un perfil al documento del índice.
   *
   * **Enumera las claves a mano y no hace *spread*.** Ver la nota de la clase.
   */
  private toDocument(
    profile: PublicProfiles,
    rating: { average: number; count: number } | null,
    location: ProfileLocation | null,
    specialties: string[],
    badge: VerifiedBadgeDto,
    agenda: { hasAgenda: boolean; nextAvailableDate: string | null } | null,
  ): PublicProfileDocument {
    return {
      kind: this.kindOf(profile),
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      biography: profile.biography ?? null,
      specialties,
      city: location?.city ?? null,
      avatarUrl: profile.avatarFileId
        ? `/public/media/${profile.avatarFileId}`
        : null,
      coverUrl: profile.coverFileId
        ? `/public/media/${profile.coverFileId}`
        : null,
      address: location?.address ?? null,
      verified: badge.status === 'VERIFIED',
      verifiedBadgeStatus: badge.status,
      badgeTypeConceptId: badge.badgeTypeConceptId,
      verificationMethodConceptId: badge.verificationMethodConceptId,
      verifiedAt: badge.verifiedAt,
      validUntil: badge.validUntil,
      hasPublishedAgenda: agenda?.hasAgenda ?? false,
      nextAvailableDate: agenda?.nextAvailableDate ?? null,
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      location:
        location && location.lat !== null && location.lng !== null
          ? { lat: location.lat, lon: location.lng }
          : null,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /** Vertical del perfil; un perfil de usuario se sirve como profesional. */
  private kindOf(profile: PublicProfiles): string {
    return (
      KIND_BY_TARGET_CONCEPT[profile.targetTypeConceptId] ?? 'PRACTITIONER'
    );
  }
}
