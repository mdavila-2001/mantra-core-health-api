import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import type { PharmacyOnCallShifts, PharmacySites } from '../entities';
import { PHARM } from '../pharmacy.concepts';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import {
  PharmaciesRepository,
  PharmacyOnCallShiftsRepository,
  PharmacyReadRepository,
  PharmacySitesRepository,
  type OpenNowRow,
} from '../repositories';
import type {
  CreateOnCallShiftDto,
  OnCallShiftDto,
  OnCallShiftSource,
  OpenNowMode,
  PharmacyOpeningHoursDto,
  PublicOpenNowItemDto,
  PublicOpenNowPageDto,
  SetOpen24hDto,
  SiteOpeningHoursDto,
} from '../dto';
import {
  BOLIVIA_TIME_ZONE,
  MAX_ON_CALL_SHIFT_HOURS,
  MAX_ON_CALL_SHIFT_LEAD_DAYS,
  onCallWindowProblem,
  siteTimeZone,
  toZonedIso,
} from './opening-hours.time';
import {
  assertReferenceInScope,
  requireManagedPharmacy,
} from './pharmacy-scope';
import { haversineKm, type GeoPoint } from './pharmacy-read.service';

/** Página por defecto y techo de `open-now`. */
const OPEN_NOW_DEFAULT_LIMIT = 20;
const OPEN_NOW_MAX_LIMIT = 50;

/** El mensaje de cada problema de ventana, en palabras de quien carga el turno. */
const WINDOW_MESSAGES: Record<
  NonNullable<ReturnType<typeof onCallWindowProblem>>,
  string
> = {
  END_NOT_AFTER_START: 'El fin del turno tiene que ser posterior al inicio',
  TOO_LONG: `Un turno dura como mucho ${MAX_ON_CALL_SHIFT_HOURS} horas`,
  ALREADY_ENDED: 'Ese turno ya terminó: un turno vencido no se publica',
  TOO_FAR_AHEAD: `Un turno se declara con ${MAX_ON_CALL_SHIFT_LEAD_DAYS} días de anticipación como mucho`,
};

/** Si `error` es la exclusión de solape de turnos (`23P01`), en la cadena de causas. */
function isOverlapViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === '23P01') return true;
    current = candidate.cause;
  }
  return false;
}

/**
 * Si quien carga es la plataforma y no la farmacia (D1): los mismos roles que
 * `PharmacyTenantScopeGuard` deja pasar sin acotar a una farmacia.
 */
function isPlatformActor(actor: AuthenticatedUser): boolean {
  const roles = actor.roles ?? [];
  return roles.includes('SECURITY_ADMIN') || roles.includes('SUPERADMIN');
}

/** Procedencia de un concepto de origen. */
function sourceOf(conceptId: string): OnCallShiftSource {
  return conceptId === PHARM.ON_CALL_SOURCE_PLATFORM ? 'PLATFORM' : 'PHARMACY';
}

/**
 * Horario declarado de las sedes de farmacia (P34): «abre 24 h» y los turnos de
 * guardia, y su lectura pública «abiertas ahora».
 *
 * ## Las tres decisiones del P34 que viven acá
 *
 * - **Quién carga (D1):** la propia farmacia, por su personal; la plataforma
 *   (`SECURITY_ADMIN`/`SUPERADMIN`) puede cargar en su nombre, y el turno queda
 *   marcado `PLATFORM`. El rol del colegio de bioquímica y farmacia no se
 *   importa: no hay fuente con procedencia.
 * - **Granularidad (D2):** el turno es de una sede, no de una zona. La zona sale
 *   de la dirección de la sede.
 * - **Turno vencido (D3):** no se acepta uno que ya terminó, ni uno de más de
 *   72 h, ni uno a más de 62 días; y la lectura pública sólo cuenta los que
 *   están vigentes en el instante de la consulta.
 */
@Injectable()
export class PharmacyOpeningHoursService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param pharmaciesRepo - Farmacias (alcance del actor).
   * @param sitesRepo - Sedes.
   * @param shiftsRepo - Turnos de guardia.
   * @param readRepo - Lecturas compartidas (sedes activas, sedes de práctica).
   * @param logger - Registro estructurado (sin datos de personas).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly sitesRepo: PharmacySitesRepository,
    private readonly shiftsRepo: PharmacyOnCallShiftsRepository,
    private readonly readRepo: PharmacyReadRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyOpeningHoursService.name);
  }

  /**
   * El horario declarado de todas las sedes activas de la farmacia.
   *
   * @param pharmacyId - Farmacia de la ruta.
   * @param actor - Sujeto autenticado.
   * @param now - Instante de referencia (inyectable para las pruebas).
   */
  async getOpeningHours(
    pharmacyId: string,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<PharmacyOpeningHoursDto> {
    const em = this.em.fork();
    await requireManagedPharmacy(this.pharmaciesRepo, em, pharmacyId, actor);
    const sites = await this.readRepo.findActiveSites(em, [pharmacyId]);
    const [zones, shifts] = await Promise.all([
      this.timeZonesOf(em, sites),
      this.shiftsRepo.findUpcomingBySites(
        em,
        sites.map((site) => site.id),
        now,
      ),
    ]);
    return {
      pharmacyId,
      asOf: now.toISOString(),
      sites: sites.map((site) =>
        this.toSiteHours(
          site,
          zones.get(site.id) ?? BOLIVIA_TIME_ZONE,
          shifts.filter((shift) => shift.pharmacySiteId === site.id),
          now,
        ),
      ),
    };
  }

  /**
   * Declara (o retira) que la sede abre 24 h.
   *
   * @param pharmacyId - Farmacia de la ruta.
   * @param siteId - Sede de la ruta; tiene que ser de esa farmacia.
   * @param dto - `open24h`: `true`, `false` o `null`.
   * @param actor - Sujeto autenticado.
   */
  async setOpen24h(
    pharmacyId: string,
    siteId: string,
    dto: SetOpen24hDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<SiteOpeningHoursDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const site = await this.requireSite(tx, pharmacyId, siteId);
      // `null` vuelve la columna a NULL: «no declarado», no «cierra de noche».
      (site as { open24h?: boolean | null }).open24h = dto.open24h;
      site.updatedByUserId = actor.id;
      site.updatedAt = now;
      await tx.flush();
      this.logger.info(
        { operation: 'pharmacy.site.open24h', pharmacyId, siteId },
        'Pharmacy site 24 h declaration updated',
      );
      const [zones, shifts] = await Promise.all([
        this.timeZonesOf(tx, [site]),
        this.shiftsRepo.findUpcomingBySites(tx, [site.id], now),
      ]);
      return this.toSiteHours(
        site,
        zones.get(site.id) ?? BOLIVIA_TIME_ZONE,
        shifts,
        now,
      );
    });
  }

  /**
   * Registra un turno de guardia de la sede.
   *
   * @throws PreconditionFailedException (`ON_CALL_SHIFT_WINDOW_INVALID`) si la ventana no se acepta.
   * @throws ConflictException (`ON_CALL_SHIFT_OVERLAP`) si se solapa con otro turno activo de la sede.
   */
  async createShift(
    pharmacyId: string,
    siteId: string,
    dto: CreateOnCallShiftDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<OnCallShiftDto> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new PreconditionFailedException(
        'La fecha del turno no es válida',
        undefined,
        PharmacyErrorReason.ON_CALL_SHIFT_WINDOW_INVALID,
      );
    }
    const problem = onCallWindowProblem(startsAt, endsAt, now);
    if (problem) {
      throw new PreconditionFailedException(
        WINDOW_MESSAGES[problem],
        { problem },
        PharmacyErrorReason.ON_CALL_SHIFT_WINDOW_INVALID,
      );
    }

    try {
      return await this.em.transactional(async (tx) => {
        await requireManagedPharmacy(
          this.pharmaciesRepo,
          tx,
          pharmacyId,
          actor,
        );
        const site = await this.requireSite(tx, pharmacyId, siteId);
        const clash = await this.shiftsRepo.findOverlapping(
          tx,
          site.id,
          startsAt,
          endsAt,
        );
        if (clash) throw this.overlap();

        const shift = this.shiftsRepo.create(tx, {
          pharmacySiteId: site.id,
          startsAt,
          endsAt,
          sourceConceptId: isPlatformActor(actor)
            ? PHARM.ON_CALL_SOURCE_PLATFORM
            : PHARM.ON_CALL_SOURCE_PHARMACY,
          actorUserId: actor.id,
        });
        await tx.flush();
        this.logger.info(
          {
            operation: 'pharmacy.onCallShift.create',
            pharmacyId,
            siteId,
            shiftId: shift.id,
          },
          'Pharmacy on-call shift created',
        );
        const zones = await this.timeZonesOf(tx, [site]);
        return this.toShift(
          shift,
          zones.get(site.id) ?? BOLIVIA_TIME_ZONE,
          now,
        );
      });
    } catch (error) {
      // Dos altas simultáneas pasan la lectura previa; la exclusión de la base
      // (`ex_pharmacy_on_call_shifts_site_overlap`) rechaza la segunda.
      if (isOverlapViolation(error)) throw this.overlap();
      throw error;
    }
  }

  /**
   * Cancela un turno que todavía no terminó. Un turno no se borra: queda
   * `CANCELLED` y deja de publicarse.
   *
   * @throws PreconditionFailedException (`ON_CALL_SHIFT_NOT_CANCELLABLE`) si ya terminó o ya estaba cancelado.
   */
  async cancelShift(
    pharmacyId: string,
    shiftId: string,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<OnCallShiftDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const shift = await this.shiftsRepo.findById(tx, shiftId);
      const site = shift
        ? await this.sitesRepo.findById(tx, shift.pharmacySiteId)
        : null;
      // Un turno de otra farmacia responde igual que uno inexistente.
      assertReferenceInScope(Boolean(site && site.pharmacyId === pharmacyId));
      if (
        shift!.statusConceptId !== PHARM.ON_CALL_SHIFT_ACTIVE ||
        shift!.endsAt.getTime() <= now.getTime()
      ) {
        throw new PreconditionFailedException(
          'El turno ya terminó o ya estaba cancelado',
          undefined,
          PharmacyErrorReason.ON_CALL_SHIFT_NOT_CANCELLABLE,
        );
      }
      shift!.statusConceptId = PHARM.ON_CALL_SHIFT_CANCELLED;
      shift!.updatedByUserId = actor.id;
      shift!.updatedAt = now;
      await tx.flush();
      this.logger.info(
        { operation: 'pharmacy.onCallShift.cancel', pharmacyId, shiftId },
        'Pharmacy on-call shift cancelled',
      );
      const zones = await this.timeZonesOf(tx, [site!]);
      return this.toShift(
        shift!,
        zones.get(site!.id) ?? BOLIVIA_TIME_ZONE,
        now,
      );
    });
  }

  /**
   * Las sedes publicadas abiertas ahora, paginadas.
   *
   * Orden: por distancia si viajó el origen (las sin coordenadas al final),
   * después por nombre de farmacia y de sede, con el id de la sede como
   * desempate estable. El cursor guarda esa clave, así que la página siguiente
   * no repite ni salta sedes aunque cambie el conjunto entre pedidos.
   *
   * @param query - Modo, ciudad, origen, cursor y tope.
   * @param now - Instante de referencia (inyectable para las pruebas).
   */
  async openNow(
    query: {
      mode?: OpenNowMode;
      city?: string;
      origin?: GeoPoint;
      cursor?: string;
      limit?: number;
    },
    now: Date = new Date(),
  ): Promise<PublicOpenNowPageDto> {
    const limit = Math.min(
      Math.max(query.limit ?? OPEN_NOW_DEFAULT_LIMIT, 1),
      OPEN_NOW_MAX_LIMIT,
    );
    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const rows = await this.shiftsRepo.findOpenNow(this.em.fork(), {
      now,
      mode: query.mode ?? 'any',
      city: query.city,
    });

    const items = rows
      .map((row) => this.toPublicItem(row, query.origin))
      .sort(compareOpenNow);
    const start = after
      ? items.findIndex(
          (item) =>
            compareOpenNow(item, {
              distanceKm: typeof after.d === 'number' ? after.d : null,
              pharmacyName: String(after.n ?? ''),
              siteName: String(after.s ?? ''),
              siteId: String(after.id ?? ''),
            }) > 0,
        )
      : 0;
    const page = start < 0 ? [] : items.slice(start, start + limit);
    const last = page.at(-1);
    const hasMore = start >= 0 && start + limit < items.length;
    return {
      items: page,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              d: last.distanceKm,
              n: last.pharmacyName,
              s: last.siteName,
              id: last.siteId,
            })
          : null,
      asOf: now.toISOString(),
      asOfLocal: toZonedIso(now, BOLIVIA_TIME_ZONE),
      timeZone: BOLIVIA_TIME_ZONE,
    };
  }

  /** La sede de la ruta, que tiene que ser de la farmacia de la ruta. */
  private async requireSite(
    em: EntityManager,
    pharmacyId: string,
    siteId: string,
  ): Promise<PharmacySites> {
    const site = await this.sitesRepo.findById(em, siteId);
    assertReferenceInScope(
      Boolean(
        site &&
        site.pharmacyId === pharmacyId &&
        site.statusConceptId === PHARM.SITE_ACTIVE,
      ),
    );
    return site!;
  }

  /** Huso de cada sede, desde su sede de práctica. */
  private async timeZonesOf(
    em: EntityManager,
    sites: readonly PharmacySites[],
  ): Promise<Map<string, string>> {
    const practiceSites = await this.readRepo.findPracticeSites(em, [
      ...new Set(sites.map((site) => site.practiceSiteId)),
    ]);
    const zoneByPracticeSite = new Map(
      practiceSites.map((ps) => [ps.id, siteTimeZone(ps.timeZone)]),
    );
    return new Map(
      sites.map((site) => [
        site.id,
        zoneByPracticeSite.get(site.practiceSiteId) ?? BOLIVIA_TIME_ZONE,
      ]),
    );
  }

  private toSiteHours(
    site: PharmacySites,
    timeZone: string,
    shifts: readonly PharmacyOnCallShifts[],
    now: Date,
  ): SiteOpeningHoursDto {
    return {
      siteId: site.id,
      siteName: site.name,
      timeZone,
      open24h: site.open24h ?? null,
      shifts: shifts.map((shift) => this.toShift(shift, timeZone, now)),
    };
  }

  private toShift(
    shift: PharmacyOnCallShifts,
    timeZone: string,
    now: Date,
  ): OnCallShiftDto {
    const active = shift.statusConceptId === PHARM.ON_CALL_SHIFT_ACTIVE;
    return {
      id: shift.id,
      siteId: shift.pharmacySiteId,
      startsAt: shift.startsAt.toISOString(),
      endsAt: shift.endsAt.toISOString(),
      startsAtLocal: toZonedIso(shift.startsAt, timeZone),
      endsAtLocal: toZonedIso(shift.endsAt, timeZone),
      timeZone,
      source: sourceOf(shift.sourceConceptId),
      status: active ? 'ACTIVE' : 'CANCELLED',
      current:
        active &&
        shift.startsAt.getTime() <= now.getTime() &&
        now.getTime() < shift.endsAt.getTime(),
    };
  }

  private toPublicItem(
    row: OpenNowRow,
    origin: GeoPoint | undefined,
  ): PublicOpenNowItemDto {
    const timeZone = siteTimeZone(row.timeZone);
    const addressText =
      [row.addressLines, row.city]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(', ') || null;
    return {
      siteId: row.siteId,
      siteName: row.siteName,
      pharmacyName: row.pharmacyName,
      pharmacySlug: row.pharmacySlug,
      addressText,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm:
        origin && row.latitude !== null && row.longitude !== null
          ? haversineKm(origin, { lat: row.latitude, lng: row.longitude })
          : null,
      open24h: row.open24h,
      onCall: row.shift
        ? {
            startsAt: row.shift.startsAt.toISOString(),
            endsAt: row.shift.endsAt.toISOString(),
            endsAtLocal: toZonedIso(row.shift.endsAt, timeZone),
            source: sourceOf(row.shift.sourceConceptId),
          }
        : null,
      timeZone,
    };
  }

  private overlap(): ConflictException {
    return new ConflictException(
      'La sede ya tiene un turno activo en ese horario',
      undefined,
      PharmacyErrorReason.ON_CALL_SHIFT_OVERLAP,
    );
  }
}

/** Orden total de `open-now`: distancia (nulas al final), farmacia, sede, id. */
function compareOpenNow(
  a: Pick<
    PublicOpenNowItemDto,
    'distanceKm' | 'pharmacyName' | 'siteName' | 'siteId'
  >,
  b: Pick<
    PublicOpenNowItemDto,
    'distanceKm' | 'pharmacyName' | 'siteName' | 'siteId'
  >,
): number {
  const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
  const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
  if (da !== db) return da < db ? -1 : 1;
  return (
    a.pharmacyName.localeCompare(b.pharmacyName, 'es') ||
    a.siteName.localeCompare(b.siteName, 'es') ||
    (a.siteId < b.siteId ? -1 : a.siteId > b.siteId ? 1 : 0)
  );
}
