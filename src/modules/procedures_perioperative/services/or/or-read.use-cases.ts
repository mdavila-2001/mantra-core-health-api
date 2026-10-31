import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { PRAC } from '../../../practice/practice.concepts';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../../practice/services/care-space-ops.port';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import {
  OperatingRoomBlocks,
  OperatingRoomUtilizationEvents,
  ProcedureCases,
} from '../../entities';
import { PERIOP } from '../../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as R } from '../../procedures_perioperative.error-reasons';

/** Mediana simple. */
function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}

/**
 * Lecturas de quirófanos (§F4.3): salas de la sede con su recurso y estado
 * de F2, y utilización (sesión, tiempo de uso, recambio, bloques).
 */
@Injectable()
export class OperatingRoomsReadUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /** Quirófanos de la sede. */
  private rooms(em: EntityManager, siteId: string) {
    return em.execute<
      {
        id: string;
        code: string;
        name: string;
        prep_minutes: number | null;
        cleanup_minutes: number | null;
        resource_id: string | null;
      }[]
    >(
      `SELECT c.id, c.code, c.name, c.prep_minutes, c.cleanup_minutes,
              (SELECT r.id FROM scheduling.schedulable_resources r
                WHERE r.care_space_id = c.id AND r.state_concept_id = ? LIMIT 1) AS resource_id
         FROM practice.care_spaces c
        WHERE c.practice_site_id = ? AND c.space_type_concept_id = ? AND c.status_concept_id <> ?
        ORDER BY c.code`,
      [
        CONCEPTS.STATE_ACTIVE,
        siteId,
        PRAC.SPACE_FN_OPERATING_ROOM,
        PRAC.SPACE_RETIRED,
      ],
      'all',
    );
  }

  /**
   * `GET /sites/:siteId/operating-rooms`.
   *
   * @param siteId - Sede.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async list(siteId: string, actor: AuthenticatedUser, tenantId: string) {
    const em = this.em.fork();
    const filter = await this.access.scopeFilter(
      actor,
      'f4.or.read',
      siteId,
      em,
      tenantId,
    );
    // Sin rol de sede u organización, sólo las salas del alcance.
    const rooms = (await this.rooms(em, siteId)).filter((r) =>
      filter.allowsSpace(r.id),
    );
    const dayStart = new Date(new Date().toISOString().slice(0, 10));
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const out = [];
    for (const r of rooms) {
      const [todayCases, todayBlocks] = await Promise.all([
        em.count(ProcedureCases, {
          operatingRoomId: r.id,
          scheduledStartAt: { $gte: dayStart, $lt: dayEnd },
          statusConceptId: { $ne: CONCEPTS.CASE_CANCELLED },
        }),
        em.count(OperatingRoomBlocks, {
          operatingRoomId: r.id,
          startsAt: { $gte: dayStart, $lt: dayEnd },
          statusConceptId: PERIOP.ORB_ACTIVE,
        }),
      ]);
      out.push({
        careSpace: { id: r.id, code: r.code, name: r.name },
        resourceId: r.resource_id,
        prepMinutes: r.prep_minutes ?? 0,
        cleanupMinutes: r.cleanup_minutes ?? 0,
        cell: await this.ops.getOperationalState(em, r.id),
        todayCases,
        todayBlocks,
      });
    }
    return out;
  }

  /**
   * `GET /sites/:siteId/or-utilization?from&to&operatingRoomId`.
   *
   * @param siteId - Sede.
   * @param q - Rango y sala.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async utilization(
    siteId: string,
    q: { from: string; to: string; operatingRoomId?: string },
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    const em = this.em.fork();
    const filter = await this.access.scopeFilter(
      actor,
      'f4.utilization.read',
      siteId,
      em,
      tenantId,
    );
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(q.from ?? '') ||
      !/^\d{4}-\d{2}-\d{2}$/.test(q.to ?? '')
    ) {
      throw new PreconditionFailedException(
        'Rango de fechas inválido',
        {},
        R.INDICATOR_RANGE_TOO_LONG,
      );
    }
    const from = new Date(`${q.from}T00:00:00Z`);
    const to = new Date(new Date(`${q.to}T00:00:00Z`).getTime() + 86_400_000);
    if (!(to > from) || (to.getTime() - from.getTime()) / 86_400_000 > 366) {
      throw new PreconditionFailedException(
        'El rango no puede superar 366 días',
        {},
        R.INDICATOR_RANGE_TOO_LONG,
      );
    }
    const allowed = (await this.rooms(em, siteId)).filter((r) =>
      filter.allowsSpace(r.id),
    );
    if (q.operatingRoomId && !allowed.some((r) => r.id === q.operatingRoomId)) {
      throw new ResourceNotFoundException('Quirófano no encontrado', {
        operatingRoomId: q.operatingRoomId,
      });
    }
    const rooms = allowed.filter(
      (r) => !q.operatingRoomId || r.id === q.operatingRoomId,
    );
    const result = [];
    for (const r of rooms) {
      const blocks = await em.find(OperatingRoomBlocks, {
        operatingRoomId: r.id,
        startsAt: { $lt: to },
        endsAt: { $gt: from },
      });
      const events = await em.find(
        OperatingRoomUtilizationEvents,
        { operatingRoomId: r.id, occurredAt: { $gte: from, $lt: to } },
        { orderBy: { occurredAt: 'asc' } },
      );
      const byCase = new Map<string, Record<string, Date>>();
      for (const e of events) {
        if (!e.procedureCaseId) continue;
        const m = byCase.get(e.procedureCaseId) ?? {};
        m[e.eventTypeConceptId] = e.occurredAt;
        byCase.set(e.procedureCaseId, m);
      }
      const minutes = (a?: Date, b?: Date) =>
        a && b ? (b.getTime() - a.getTime()) / 60_000 : 0;
      const sessionMinutes = blocks
        .filter((b) => b.statusConceptId === PERIOP.ORB_ACTIVE)
        .reduce((a, b) => a + minutes(b.startsAt, b.endsAt), 0);
      const touchMinutes = [...byCase.values()].reduce(
        (a, m) =>
          a +
          minutes(
            m[PERIOP.OR_EVENT_ANESTHESIA_START],
            m[PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM],
          ),
        0,
      );
      const sorted = [...byCase.values()]
        .filter((m) => m[PERIOP.OR_EVENT_PATIENT_IN_ROOM])
        .sort(
          (a, b) =>
            a[PERIOP.OR_EVENT_PATIENT_IN_ROOM].getTime() -
            b[PERIOP.OR_EVENT_PATIENT_IN_ROOM].getTime(),
        );
      const turnovers: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const out = sorted[i - 1][PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM];
        if (out)
          turnovers.push(
            minutes(out, sorted[i][PERIOP.OR_EVENT_PATIENT_IN_ROOM]),
          );
      }
      const allocated = blocks.reduce(
        (a, b) => a + minutes(b.startsAt, b.endsAt),
        0,
      );
      const released = blocks.reduce((a, b) => a + (b.releasedMinutes ?? 0), 0);
      result.push({
        operatingRoomId: r.id,
        code: r.code,
        sessionMinutes,
        touchMinutes,
        roomUtilizationPct:
          sessionMinutes > 0 ? (touchMinutes / sessionMinutes) * 100 : null,
        turnoverMinutesP50: median(turnovers),
        blocks: {
          allocated,
          released,
          blockUtilizationPct:
            allocated - released > 0
              ? (touchMinutes / (allocated - released)) * 100
              : null,
        },
      });
    }
    return { from: q.from, to: q.to, rooms: result };
  }
}
