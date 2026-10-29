import {
  mergeIntervals,
  median,
  minutesOf,
  totalMinutes,
  type Interval,
} from './or-window';

/** Los hechos de un caso en sala, ya reunidos (los instantes que no ocurrieron son `undefined`). */
export interface CaseEpisode {
  readonly caseId: string;
  readonly roomId: string;
  readonly blockId?: string;
  /** Inicio programado del caso (para «primer caso a tiempo»). */
  readonly scheduledStart?: Date;
  readonly inRoom?: Date;
  /** Inicio de anestesia: el evento de sala o, si falta, el inicio de caso de la inducción. */
  readonly anesthesiaStart?: Date;
  readonly outOfRoom?: Date;
  readonly cleanupEnd?: Date;
  readonly roomReady?: Date;
}

/** Un bloque, como lo necesita el cálculo. */
export interface BlockRow {
  readonly id: string;
  readonly roomId: string;
  /** Clave estable del dueño (para agrupar). */
  readonly ownerKey: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  /** `ACTIVE`, `RELEASED` (se cuenta como sesión: el tiempo vuelve a la agenda abierta) o `CANCELLED` (no). */
  readonly status: 'ACTIVE' | 'RELEASED' | 'CANCELLED';
  readonly releasedMinutes: number;
}

/** Métricas de una sala en un día. */
export interface RoomDayMetrics {
  readonly sessionMinutes: number;
  readonly touchMinutes: number;
  readonly roomUtilizationPct: number | null;
  readonly turnoverMinutesP50: number | null;
  readonly firstCaseOnTimePct: number | null;
  readonly casesCount: number;
}

/** Redondeo a dos decimales. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Sesión de la sala en el día: bloques no cancelados, unidos y acotados al día. */
export function sessionIntervals(
  blocks: readonly BlockRow[],
  day: Interval,
): Interval[] {
  return mergeIntervals(
    blocks
      .filter((b) => b.status !== 'CANCELLED')
      .map((b) => ({
        start: b.startsAt > day.start ? b.startsAt : day.start,
        end: b.endsAt < day.end ? b.endsAt : day.end,
      })),
  );
}

/**
 * Métricas de una sala y un día (CONTRATO-F2-F5 §F4.3):
 *
 * - `sessionMinutes`: minutos ofrecidos (bloques del día).
 * - `touchMinutes`: Σ (salida de sala − inicio de anestesia) de cada caso, acotado a la sesión.
 * - `roomUtilizationPct` = touch ÷ sesión (nulo sin sesión).
 * - `turnoverMinutesP50`: mediana de (salida del paciente → entrada del siguiente) entre casos
 *   consecutivos de la sala.
 * - `firstCaseOnTimePct`: el primer caso del día (por hora programada) entró a sala a más tardar
 *   a su hora programada más la gracia.
 *
 * @param blocks - Bloques de la sala.
 * @param episodes - Casos de la sala cuyo inicio de anestesia o entrada cae en el día.
 * @param day - El día en la zona de la sede.
 * @param graceMinutes - Gracia del primer caso (`infra.or_first_case_grace_minutes`).
 */
export function roomDayMetrics(
  blocks: readonly BlockRow[],
  episodes: readonly CaseEpisode[],
  day: Interval,
  graceMinutes = 0,
): RoomDayMetrics {
  const session = sessionIntervals(blocks, day);
  const sessionMinutes = totalMinutes(session);

  let touchMinutes = 0;
  for (const e of episodes) {
    if (!e.anesthesiaStart || !e.outOfRoom || e.outOfRoom <= e.anesthesiaStart)
      continue;
    for (const s of session) {
      touchMinutes += minutesOf(
        { start: e.anesthesiaStart, end: e.outOfRoom },
        s,
      );
    }
  }

  const ordered = episodes
    .filter((e) => e.inRoom)
    .sort((a, b) => a.inRoom!.getTime() - b.inRoom!.getTime());
  const turnovers: number[] = [];
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1];
    const next = ordered[i];
    if (prev.outOfRoom && next.inRoom && next.inRoom >= prev.outOfRoom) {
      turnovers.push(
        (next.inRoom.getTime() - prev.outOfRoom.getTime()) / 60_000,
      );
    }
  }

  const byScheduled = episodes
    .filter((e) => e.scheduledStart)
    .sort((a, b) => a.scheduledStart!.getTime() - b.scheduledStart!.getTime());
  const first = byScheduled[0];
  const firstCaseOnTimePct =
    first && first.inRoom
      ? first.inRoom.getTime() <=
        first.scheduledStart!.getTime() + graceMinutes * 60_000
        ? 100
        : 0
      : null;

  const p50 = median(turnovers);
  return {
    sessionMinutes: round2(sessionMinutes),
    touchMinutes: round2(touchMinutes),
    roomUtilizationPct:
      sessionMinutes > 0 ? round2((touchMinutes / sessionMinutes) * 100) : null,
    turnoverMinutesP50: p50 === null ? null : round2(p50),
    firstCaseOnTimePct,
    casesCount: episodes.length,
  };
}

/** Métricas de un bloque. */
export interface BlockMetrics {
  readonly allocatedMinutes: number;
  readonly releasedMinutes: number;
  readonly usedInBlockMinutes: number;
  readonly turnoverMinutes: number;
  readonly blockUtilizationPct: number | null;
}

/**
 * Métricas de un bloque: `blockUtilizationPct = (usado + recambio) ÷ (asignado − liberado)`.
 *
 * - `usado`: Σ (salida − entrada a sala) de los casos ligados, acotado al bloque.
 * - `recambio`: tras cada caso ligado, desde la salida del paciente hasta que el quirófano
 *   queda listo (`ROOM_READY`, o el fin de limpieza, o la entrada del siguiente caso de la
 *   sala), acotado al bloque.
 *
 * @param block - El bloque.
 * @param linked - Casos ligados al bloque.
 * @param roomEpisodes - Todos los casos de la sala (para hallar «el siguiente»).
 */
export function blockMetrics(
  block: BlockRow,
  linked: readonly CaseEpisode[],
  roomEpisodes: readonly CaseEpisode[],
): BlockMetrics {
  const window: Interval = { start: block.startsAt, end: block.endsAt };
  const allocated = minutesOf(window);
  const released = block.status === 'RELEASED' ? block.releasedMinutes : 0;

  let used = 0;
  let turnover = 0;
  for (const e of linked) {
    if (!e.inRoom || !e.outOfRoom || e.outOfRoom <= e.inRoom) continue;
    used += minutesOf({ start: e.inRoom, end: e.outOfRoom }, window);
    const next = roomEpisodes
      .filter(
        (o) => o.caseId !== e.caseId && o.inRoom && o.inRoom >= e.outOfRoom!,
      )
      .sort((a, b) => a.inRoom!.getTime() - b.inRoom!.getTime())[0];
    const end = e.roomReady ?? e.cleanupEnd ?? next?.inRoom;
    if (end && end > e.outOfRoom) {
      turnover += minutesOf({ start: e.outOfRoom, end }, window);
    }
  }
  const available = allocated - released;
  return {
    allocatedMinutes: round2(allocated),
    releasedMinutes: round2(released),
    usedInBlockMinutes: round2(used),
    turnoverMinutes: round2(turnover),
    blockUtilizationPct:
      available > 0 ? round2(((used + turnover) / available) * 100) : null,
  };
}
