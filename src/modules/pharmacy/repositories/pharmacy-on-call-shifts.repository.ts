import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PharmacyOnCallShifts } from '../entities';
import { PHARM } from '../pharmacy.concepts';

/** Datos para registrar un turno de guardia. */
export interface CreateOnCallShiftData {
  /** Sede del turno. */
  pharmacySiteId: string;
  /** Inicio. */
  startsAt: Date;
  /** Fin, exclusivo. */
  endsAt: Date;
  /** Quién lo declara (concepto). */
  sourceConceptId: string;
  /** Actor. */
  actorUserId?: string;
}

/** Una sede abierta ahora, tal como sale de la base (sin ordenar ni paginar). */
export interface OpenNowRow {
  /** Sede. */
  siteId: string;
  /** Nombre de la sede. */
  siteName: string;
  /** Nombre comercial de la farmacia. */
  pharmacyName: string;
  /** Slug del perfil público. */
  pharmacySlug: string;
  /** `pharmacy_sites.open_24h`. */
  open24h: boolean;
  /** `practice_sites.time_zone`. */
  timeZone: string | null;
  /** Dirección (línea). */
  addressLines: string | null;
  /** Ciudad. */
  city: string | null;
  /** Latitud. */
  latitude: number | null;
  /** Longitud. */
  longitude: number | null;
  /** Turno vigente, si hay. */
  shift: {
    startsAt: Date;
    endsAt: Date;
    sourceConceptId: string;
  } | null;
}

/**
 * Acceso a `pharmacy.pharmacy_on_call_shifts` (P34).
 *
 * Toda lectura que «publica» un turno filtra por `starts_at <= now < ends_at` y
 * por estado activo **en la consulta**: un turno vencido no llega ni a la memoria
 * del servicio, así que ningún camino puede mostrarlo por error (D3).
 */
@Injectable()
export class PharmacyOnCallShiftsRepository {
  /** Un turno por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyOnCallShifts | null> {
    return em.findOne(PharmacyOnCallShifts, { id });
  }

  /**
   * Turnos activos de las sedes que todavía no terminaron (vigentes y próximos),
   * del más próximo al más lejano.
   */
  findUpcomingBySites(
    em: EntityManager,
    siteIds: readonly string[],
    now: Date,
  ): Promise<PharmacyOnCallShifts[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      PharmacyOnCallShifts,
      {
        pharmacySiteId: { $in: [...siteIds] },
        statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
        endsAt: { $gt: now },
      },
      { orderBy: { startsAt: 'asc', id: 'asc' } },
    );
  }

  /** Turnos activos vigentes en `now` de las sedes. */
  findCurrentBySites(
    em: EntityManager,
    siteIds: readonly string[],
    now: Date,
  ): Promise<PharmacyOnCallShifts[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(PharmacyOnCallShifts, {
      pharmacySiteId: { $in: [...siteIds] },
      statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    });
  }

  /** Un turno activo de la sede que se solapa con `[startsAt, endsAt)`, si hay. */
  findOverlapping(
    em: EntityManager,
    siteId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<PharmacyOnCallShifts | null> {
    return em.findOne(PharmacyOnCallShifts, {
      pharmacySiteId: siteId,
      statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
    });
  }

  /** Crea el turno activo en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateOnCallShiftData): PharmacyOnCallShifts {
    return em.create(
      PharmacyOnCallShifts,
      {
        pharmacySiteId: data.pharmacySiteId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        sourceConceptId: data.sourceConceptId,
        statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Las sedes **publicadas** abiertas en `now`: 24 h declarado o turno vigente.
   *
   * Publicada es lo mismo que en la vitrina de medicamentos: farmacia activa y
   * verificada, sede activa y perfil público visible y activo. Es anónima y
   * cruza tenants a propósito — quien busca una farmacia de turno no tiene
   * sesión —, y por eso no devuelve nada que no esté ya en la ficha pública.
   *
   * @param em - Contexto de persistencia.
   * @param filter - Instante, modo y ciudad (comparación sin mayúsculas).
   * @returns Las filas, sin orden de presentación.
   */
  async findOpenNow(
    em: EntityManager,
    filter: { now: Date; mode: 'any' | '24h' | 'on-call'; city?: string },
  ): Promise<OpenNowRow[]> {
    const city = filter.city?.trim() || null;
    const rows = await em.getConnection().execute<
      Array<{
        site_id: string;
        site_name: string;
        pharmacy_name: string;
        pharmacy_slug: string;
        open_24h: boolean | null;
        time_zone: string | null;
        address_lines: string | null;
        city: string | null;
        latitude: string | null;
        longitude: string | null;
        shift_starts_at: Date | string | null;
        shift_ends_at: Date | string | null;
        shift_source: string | null;
      }>
    >(
      `SELECT site.id                AS site_id,
              site.name              AS site_name,
              COALESCE(ph.trade_name, ph.legal_name) AS pharmacy_name,
              prof.slug              AS pharmacy_slug,
              site.open_24h          AS open_24h,
              ps.time_zone           AS time_zone,
              addr.lines             AS address_lines,
              addr.city              AS city,
              addr.latitude::text    AS latitude,
              addr.longitude::text   AS longitude,
              shift.starts_at        AS shift_starts_at,
              shift.ends_at          AS shift_ends_at,
              shift.source_concept_id AS shift_source
         FROM pharmacy.pharmacy_sites site
         JOIN pharmacy.pharmacies ph
           ON ph.id = site.pharmacy_id
          AND ph.status_concept_id = ?
          AND ph.verification_status_concept_id = ?
         JOIN community.public_profiles prof
           ON prof.id = ph.public_profile_id
          AND prof.visibility_concept_id = ?
          AND prof.status_concept_id = ?
    LEFT JOIN practice.practice_sites ps
           ON ps.id = site.practice_site_id
    LEFT JOIN common.addresses addr
           ON addr.id = ps.address_id
    LEFT JOIN LATERAL (
                SELECT s.starts_at, s.ends_at, s.source_concept_id
                  FROM pharmacy.pharmacy_on_call_shifts s
                 WHERE s.pharmacy_site_id = site.id
                   AND s.status_concept_id = ?
                   AND s.starts_at <= CAST(? AS timestamptz)
                   AND s.ends_at   >  CAST(? AS timestamptz)
                 ORDER BY s.ends_at DESC
                 LIMIT 1
              ) shift ON true
        WHERE site.status_concept_id = ?
          AND (
                (CAST(? AS text) IN ('any', '24h') AND site.open_24h IS TRUE)
             OR (CAST(? AS text) IN ('any', 'on-call') AND shift.starts_at IS NOT NULL)
          )
          AND (CAST(? AS text) IS NULL OR lower(addr.city) = lower(CAST(? AS text)))`,
      [
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        PHARM.ON_CALL_SHIFT_ACTIVE,
        filter.now.toISOString(),
        filter.now.toISOString(),
        PHARM.SITE_ACTIVE,
        filter.mode,
        filter.mode,
        city,
        city,
      ],
      'all',
    );

    return rows.map((row) => ({
      siteId: row.site_id,
      siteName: row.site_name,
      pharmacyName: row.pharmacy_name,
      pharmacySlug: row.pharmacy_slug,
      open24h: row.open_24h === true,
      timeZone: row.time_zone,
      addressLines: row.address_lines,
      city: row.city,
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
      shift:
        row.shift_starts_at !== null &&
        row.shift_ends_at !== null &&
        row.shift_source !== null
          ? {
              startsAt: new Date(row.shift_starts_at),
              endsAt: new Date(row.shift_ends_at),
              sourceConceptId: row.shift_source,
            }
          : null,
    }));
  }
}

/** Un `numeric` de la base como número, o `null`. */
function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
