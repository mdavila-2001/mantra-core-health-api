import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DateTime } from 'luxon';
import {
  CONCEPTS,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  CareSpaces,
  PracticeSettings,
  type PracticeSites,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import {
  OperatingRoomAccessService,
  operatingRoomNotFound,
} from '../policies/operating-room-access.service';
import {
  blockMetrics,
  roomDayMetrics,
  round2,
  type BlockMetrics,
  type BlockRow,
  type CaseEpisode,
  type RoomDayMetrics,
} from '../domain/utilization';
import { OperatingRoomUtilizationEvents, ProcedureCases } from '../entities';
import { PeriopBlocksRepository } from '../repositories';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import type { OrUtilizationQueryDto, UtilizationGroupBy } from '../dto';

/** Claves de `practice_settings` de la utilización. */
export const SETTING_UTILIZATION_MAX_DAYS =
  'infra.or_utilization_max_range_days';
export const SETTING_FIRST_CASE_GRACE = 'infra.or_first_case_grace_minutes';
/** Valores por omisión de las claves anteriores. */
export const DEFAULT_UTILIZATION_MAX_DAYS = 93;
export const DEFAULT_FIRST_CASE_GRACE_MINUTES = 0;
const FALLBACK_TIME_ZONE = 'America/La_Paz';

/** Fila de utilización de una sala en un día. */
export interface RoomUtilizationRow extends RoomDayMetrics {
  operatingRoomId: string;
  date: string;
}

/** Fila de utilización de un bloque. */
export interface BlockUtilizationRow extends BlockMetrics {
  blockId: string;
  operatingRoomId: string;
  ownerKey: string;
  startsAt: Date;
  endsAt: Date;
  status: BlockRow['status'];
}

/** Fila agregada por dueño. */
export interface OwnerUtilizationRow {
  ownerKey: string;
  blocks: number;
  allocatedMinutes: number;
  releasedMinutes: number;
  usedInBlockMinutes: number;
  turnoverMinutes: number;
  blockUtilizationPct: number | null;
}

/** Respuesta de `GET /sites/:siteId/or-utilization`. */
export interface UtilizationResult {
  from: string;
  to: string;
  groupBy: UtilizationGroupBy;
  items: (RoomUtilizationRow | BlockUtilizationRow | OwnerUtilizationRow)[];
}

/** Concepto de evento de sala → campo del episodio. */
const EVENT_KINDS = [
  PERIOP.OR_EVENT_PATIENT_IN_ROOM,
  PERIOP.OR_EVENT_ANESTHESIA_START,
  PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
  PERIOP.OR_EVENT_CLEANUP_END,
  PERIOP.OR_EVENT_ROOM_READY,
  CONCEPTS.OR_EVENT_CASE_START,
];

/**
 * Utilización de quirófano y de bloque (`GET /sites/:siteId/or-utilization`), calculada sobre
 * los eventos reales de sala (CONTRATO-F2-F5 §F4.3). Las fórmulas viven en
 * `domain/utilization.ts`, donde se prueban al minuto; acá sólo se reúnen los datos del
 * tenant y se agrupan.
 *
 * La sesión de una sala es la suma de sus bloques no cancelados: la agenda abierta publicada
 * de los quirófanos no está modelada todavía (la agenda de salas es F5), así que no suma.
 */
@Injectable()
export class PeriopUtilizationService {
  /**
   * @param em - Contexto de lectura.
   * @param blocksRepo - Bloques.
   * @param access - Política de acceso al quirófano.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly blocksRepo: PeriopBlocksRepository,
    private readonly access: OperatingRoomAccessService,
  ) {}

  /**
   * Calcula la utilización de la sede en el rango.
   *
   * @param siteId - Sede de la ruta.
   * @param query - Rango (días inclusivos), sala opcional y agrupación.
   * @param actor - Quien lee.
   */
  async utilization(
    siteId: string,
    query: OrUtilizationQueryDto,
    actor: AuthenticatedUser,
  ): Promise<UtilizationResult> {
    const tenantId = requireTenantId();
    const site = await this.access.loadSite(this.em, siteId);
    if (!site) throw operatingRoomNotFound();
    await this.access.assertCan(this.em, actor, 'OR_UTILIZATION_VIEW', {
      site,
    });

    const zone = site.timeZone ?? FALLBACK_TIME_ZONE;
    const first = DateTime.fromISO(query.from, { zone }).startOf('day');
    const last = DateTime.fromISO(query.to, { zone }).startOf('day');
    if (!first.isValid || !last.isValid || last < first) {
      throw new PreconditionFailedException(
        'El rango no es válido',
        { from: query.from, to: query.to },
        Reason.OR_BLOCK_WINDOW_INVALID,
      );
    }
    const days = Math.round(last.diff(first, 'days').days) + 1;
    const maxDays = await this.setting(
      site,
      SETTING_UTILIZATION_MAX_DAYS,
      DEFAULT_UTILIZATION_MAX_DAYS,
    );
    if (days > maxDays) {
      throw new PreconditionFailedException(
        'El rango pedido es demasiado largo',
        { days, maxDays },
        Reason.INDICATOR_RANGE_TOO_LONG,
      );
    }
    const grace = await this.setting(
      site,
      SETTING_FIRST_CASE_GRACE,
      DEFAULT_FIRST_CASE_GRACE_MINUTES,
    );
    const groupBy = query.groupBy ?? 'room';

    const rooms = await this.em.find(CareSpaces, {
      tenantId,
      practiceSiteId: siteId,
      spaceTypeConceptId: PRAC.SPACE_FN_OPERATING_ROOM,
      ...(query.operatingRoomId ? { id: query.operatingRoomId } : {}),
    });
    if (query.operatingRoomId && rooms.length === 0)
      throw operatingRoomNotFound();
    const roomIds = rooms.map((r) => r.id);

    const rangeStart = first.toJSDate();
    const rangeEnd = last.plus({ days: 1 }).toJSDate();
    // Holgura de un día a cada lado: un caso puede cruzar la medianoche.
    const eventsFrom = first.minus({ days: 1 }).toJSDate();
    const eventsTo = last.plus({ days: 2 }).toJSDate();

    const blocks = await this.blocksRepo.list(this.em, tenantId, {
      roomIds,
      from: rangeStart,
      to: rangeEnd,
    });
    const rows: BlockRow[] = blocks.map((b) => ({
      id: b.id,
      roomId: b.operatingRoomId,
      ownerKey: this.ownerKey(b),
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status:
        b.statusConceptId === PERIOP.ORB_RELEASED
          ? 'RELEASED'
          : b.statusConceptId === PERIOP.ORB_CANCELLED
            ? 'CANCELLED'
            : 'ACTIVE',
      releasedMinutes: b.releasedMinutes ?? 0,
    }));

    const episodes = await this.episodes(
      tenantId,
      roomIds,
      eventsFrom,
      eventsTo,
    );

    let items: UtilizationResult['items'];
    if (groupBy === 'room') {
      items = [];
      for (const room of rooms) {
        for (let i = 0; i < days; i += 1) {
          const dayStart = first.plus({ days: i });
          const day = {
            start: dayStart.toJSDate(),
            end: dayStart.plus({ days: 1 }).toJSDate(),
          };
          const dayEpisodes = episodes.filter(
            (e) =>
              e.roomId === room.id &&
              (e.anesthesiaStart ?? e.inRoom ?? e.scheduledStart) !==
                undefined &&
              (e.anesthesiaStart ?? e.inRoom ?? e.scheduledStart)! >=
                day.start &&
              (e.anesthesiaStart ?? e.inRoom ?? e.scheduledStart)! < day.end,
          );
          items.push({
            operatingRoomId: room.id,
            date: dayStart.toISODate(),
            ...roomDayMetrics(
              rows.filter((b) => b.roomId === room.id),
              dayEpisodes,
              day,
              grace,
            ),
          });
        }
      }
    } else {
      const perBlock: BlockUtilizationRow[] = rows
        .filter((b) => b.status !== 'CANCELLED')
        .map((b) => ({
          blockId: b.id,
          operatingRoomId: b.roomId,
          ownerKey: b.ownerKey,
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          status: b.status,
          ...blockMetrics(
            b,
            episodes.filter((e) => e.blockId === b.id),
            episodes.filter((e) => e.roomId === b.roomId),
          ),
        }));
      items = groupBy === 'block' ? perBlock : this.byOwner(perBlock);
    }
    return { from: query.from, to: query.to, groupBy, items };
  }

  /** Reúne los hechos de sala de cada caso. */
  private async episodes(
    tenantId: string,
    roomIds: readonly string[],
    from: Date,
    to: Date,
  ): Promise<CaseEpisode[]> {
    if (roomIds.length === 0) return [];
    const events = await this.em.find(
      OperatingRoomUtilizationEvents,
      {
        tenantId,
        operatingRoomId: { $in: [...roomIds] },
        procedureCaseId: { $ne: null },
        eventTypeConceptId: { $in: EVENT_KINDS },
        occurredAt: { $gte: from, $lt: to },
      },
      { orderBy: { occurredAt: 'ASC' } },
    );
    const caseIds = [...new Set(events.map((e) => e.procedureCaseId!))];
    if (caseIds.length === 0) return [];
    const cases = await this.em.find(ProcedureCases, {
      custodianTenantId: tenantId,
      id: { $in: caseIds },
      statusConceptId: { $ne: CONCEPTS.CASE_CANCELLED },
    });
    const caseById = new Map(cases.map((c) => [c.id, c]));

    const byCase = new Map<string, OperatingRoomUtilizationEvents[]>();
    for (const e of events) {
      if (!caseById.has(e.procedureCaseId!)) continue;
      const list = byCase.get(e.procedureCaseId!) ?? [];
      list.push(e);
      byCase.set(e.procedureCaseId!, list);
    }
    const at = (list: OperatingRoomUtilizationEvents[], concept: string) =>
      list.find((e) => e.eventTypeConceptId === concept)?.occurredAt;
    return [...byCase.entries()].map(([caseId, list]) => {
      const c = caseById.get(caseId)!;
      return {
        caseId,
        roomId: c.operatingRoomId!,
        blockId: c.operatingRoomBlockId,
        scheduledStart: c.scheduledStartAt,
        inRoom: at(list, PERIOP.OR_EVENT_PATIENT_IN_ROOM),
        anesthesiaStart:
          at(list, PERIOP.OR_EVENT_ANESTHESIA_START) ??
          at(list, CONCEPTS.OR_EVENT_CASE_START),
        outOfRoom: at(list, PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM),
        cleanupEnd: at(list, PERIOP.OR_EVENT_CLEANUP_END),
        roomReady: at(list, PERIOP.OR_EVENT_ROOM_READY),
      };
    });
  }

  private byOwner(rows: readonly BlockUtilizationRow[]): OwnerUtilizationRow[] {
    const groups = new Map<string, OwnerUtilizationRow>();
    for (const r of rows) {
      const g = groups.get(r.ownerKey) ?? {
        ownerKey: r.ownerKey,
        blocks: 0,
        allocatedMinutes: 0,
        releasedMinutes: 0,
        usedInBlockMinutes: 0,
        turnoverMinutes: 0,
        blockUtilizationPct: null,
      };
      g.blocks += 1;
      g.allocatedMinutes += r.allocatedMinutes;
      g.releasedMinutes += r.releasedMinutes;
      g.usedInBlockMinutes += r.usedInBlockMinutes;
      g.turnoverMinutes += r.turnoverMinutes;
      groups.set(r.ownerKey, g);
    }
    return [...groups.values()].map((g) => {
      const available = g.allocatedMinutes - g.releasedMinutes;
      return {
        ...g,
        allocatedMinutes: round2(g.allocatedMinutes),
        releasedMinutes: round2(g.releasedMinutes),
        usedInBlockMinutes: round2(g.usedInBlockMinutes),
        turnoverMinutes: round2(g.turnoverMinutes),
        blockUtilizationPct:
          available > 0
            ? round2(
                ((g.usedInBlockMinutes + g.turnoverMinutes) / available) * 100,
              )
            : null,
      };
    });
  }

  private ownerKey(block: {
    ownerKindConceptId: string;
    clinicalUnitId?: string;
    surgicalSpecialtyConceptId?: string;
    surgeonProfileId?: string;
  }): string {
    return block.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON
      ? `SURGEON:${block.surgeonProfileId}`
      : `SERVICE:${block.clinicalUnitId ?? ''}:${block.surgicalSpecialtyConceptId ?? ''}`;
  }

  private async setting(
    site: PracticeSites,
    key: string,
    fallback: number,
  ): Promise<number> {
    const row = await this.em.findOne(PracticeSettings, {
      practiceId: site.practiceId,
      settingKey: key,
    });
    const value = Number(row?.valueJson);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
}
