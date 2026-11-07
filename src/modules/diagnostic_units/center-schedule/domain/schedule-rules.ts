import {
  localTimeToUtc,
  matchingLocalDays,
} from '../../../scheduling/domain/time/scheduling-time';
import type {
  CenterEquipment,
  CenterKind,
  CenterSchedule,
  ModalityCode,
  ScheduleBlock,
  ScheduleOrigin,
} from './center-schedule.model';
import { windowTiming } from './center-schedule.model';

/**
 * Pure rules of a center's schedule, the server twin of the frontend's
 * `center-schedule.rules.ts`. Resolution goes from the most specific level to
 * the most general one: study → modality → general.
 */

export interface ResolvedBlock {
  readonly block: ScheduleBlock;
  readonly origin: ScheduleOrigin;
}

export function resolveBlock(
  schedule: CenterSchedule,
  studyCode: string | null,
  modalityCode: ModalityCode | null,
): ResolvedBlock {
  const own = schedule.studies.find((s) => s.studyCode === studyCode);
  if (own) return { block: own.schedule, origin: 'STUDY' };
  const byModality = schedule.modalities.find(
    (m) => m.modalityCode === modalityCode,
  );
  if (byModality) return { block: byModality.schedule, origin: 'MODALITY' };
  return { block: schedule.general, origin: 'GENERAL' };
}

/** `HH:MM` → minutes since midnight, or `null` when it is not a valid time. */
export function minutesOf(time: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes;
}

export interface ScheduleProblem {
  /** `general`, a modality code or a study code. */
  readonly field: string;
  readonly problem: string;
}

/** What prevents publishing a schedule; empty when it is complete. */
export function validateSchedule(schedule: CenterSchedule): ScheduleProblem[] {
  const problems: ScheduleProblem[] = [];
  const check = (field: string, block: ScheduleBlock): void => {
    if (block.windows.length === 0) {
      problems.push({ field, problem: 'Marque al menos un día de atención.' });
    }
    for (const w of block.windows) {
      const from = minutesOf(w.startTime);
      const to = minutesOf(w.endTime);
      if (from === null || to === null) {
        problems.push({
          field,
          problem: 'Complete la hora de inicio y de fin.',
        });
      } else if (to <= from) {
        problems.push({
          field,
          problem: 'La hora de fin tiene que ser posterior a la de inicio.',
        });
      } else if (to - from < windowTiming(block, w).slot) {
        problems.push({
          field,
          problem: `No entra ni una cita de ${windowTiming(block, w).slot} min.`,
        });
      }
    }
  };
  check('general', schedule.general);
  for (const m of schedule.modalities) check(m.modalityCode, m.schedule);
  for (const s of schedule.studies) check(s.studyCode, s.schedule);
  for (const e of schedule.equipment) check(e.equipmentId, e.schedule);
  return problems;
}

export interface SlotInstant {
  readonly startAt: Date;
  readonly endAt: Date;
}

/**
 * Every slot of a block whose start falls in `[from, to]`, in the center's
 * zone. A slot exists only if it fits entirely before its window closes.
 */
export function slotsBetween(
  block: ScheduleBlock,
  from: Date,
  to: Date,
  zone: string,
): SlotInstant[] {
  const slots: SlotInstant[] = [];
  for (const w of block.windows) {
    const { slot, gap } = windowTiming(block, w);
    const length = slot * 60_000;
    // Each appointment is followed by its rest, as in the practitioner's agenda.
    const step = (slot + gap) * 60_000;
    if (length <= 0) continue;
    // ISO 7 (Sunday) is 0 in the scheduling module's convention.
    for (const day of matchingLocalDays(from, to, w.dayOfWeek % 7, zone)) {
      const open = localTimeToUtc(day, w.startTime, zone).getTime();
      const close = localTimeToUtc(day, w.endTime, zone).getTime();
      for (let t = open; t + length <= close; t += step) {
        if (t < from.getTime() || t > to.getTime()) continue;
        slots.push({ startAt: new Date(t), endAt: new Date(t + length) });
      }
    }
  }
  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

/** Whether `instant` is exactly the start of a slot of the block. */
export function isSlotStart(
  block: ScheduleBlock,
  instant: Date,
  zone: string,
): boolean {
  return slotsBetween(block, instant, instant, zone).some(
    (s) => s.startAt.getTime() === instant.getTime(),
  );
}

/**
 * Patients that fit in the same slot of a modality. With equipment registered
 * for the modality, only the operational ones count (maintenance lowers the
 * quota without touching the schedule). Without any, the template's declared
 * capacity applies, so a center that has not inventoried its equipment yet
 * stays bookable.
 */
export function capacityOf(
  equipment: readonly CenterEquipment[],
  modalityCode: ModalityCode | null,
  declaredCapacity: number,
): number {
  if (modalityCode === null) return declaredCapacity;
  const registered = equipment.filter((e) => e.modalityCode === modalityCode);
  if (registered.length === 0) return declaredCapacity;
  return registered.filter((e) => e.status === 'OPERATIONAL').length;
}

/** The schedule a center starts with until it publishes its own. */
export function defaultSchedule(kind: CenterKind): CenterSchedule {
  const week = (days: number[], start: string, end: string, slot: number) => ({
    windows: days.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: start,
      endTime: end,
    })),
    slotMinutes: slot,
  });
  return kind === 'LABORATORY'
    ? {
        general: week([1, 2, 3, 4, 5, 6], '07:00', '10:00', 15),
        modalities: [],
        studies: [],
        equipment: [],
      }
    : {
        general: week([1, 2, 3, 4, 5], '08:00', '17:00', 30),
        modalities: [],
        studies: [],
        equipment: [],
      };
}

/** Template names carry the level of each block: `MODALITY:ECO`, `STUDY:<code>`, `EQUIPMENT:<id>`. */
export type TemplateScope =
  | { readonly level: 'GENERAL' }
  | {
      readonly level: 'MODALITY' | 'STUDY' | 'EQUIPMENT';
      readonly key: string;
    };

export function templateName(scope: TemplateScope): string {
  return scope.level === 'GENERAL' ? 'GENERAL' : `${scope.level}:${scope.key}`;
}

/** Any other name (e.g. the seeded «Horario de …») is a general template. */
export function scopeOfTemplate(name: string): TemplateScope {
  const match = /^(MODALITY|STUDY|EQUIPMENT):(.+)$/.exec(name);
  if (!match) return { level: 'GENERAL' };
  return {
    level: match[1] as 'MODALITY' | 'STUDY' | 'EQUIPMENT',
    key: match[2],
  };
}
