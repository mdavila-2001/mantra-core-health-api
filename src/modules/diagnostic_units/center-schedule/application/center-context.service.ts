import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DUNIT } from '../../diagnostic_units.concepts';
import {
  DEFAULT_TIME_ZONE,
  MODALITY_CODES,
  equipmentStatusOfConcept,
  modalityOfConcept,
  type CenterEquipment,
  type CenterKind,
  type CenterSchedule,
  type CenterStudy,
  type ModalityCode,
  type ScheduleBlock,
} from '../domain/center-schedule.model';
import { defaultSchedule, scopeOfTemplate } from '../domain/schedule-rules';
import type { OccupyingBooking } from '../domain/availability';
import {
  CenterScheduleRepository,
  type SiteRow,
  type TemplateRuleRow,
  type UnitRow,
} from '../infrastructure/center-schedule.repository';
import {
  CenterStudiesRepository,
  currencyOf,
  type StudyRow,
} from '../infrastructure/center-studies.repository';
import type { OccupyingRow } from '../infrastructure/center-bookings.repository';

/** Everything the center screens and the booking flow read about one unit. */
export interface CenterContext {
  readonly unit: UnitRow;
  readonly kind: CenterKind;
  readonly zone: string;
  readonly resourceId: string | null;
  readonly site: SiteRow | null;
  readonly schedule: CenterSchedule;
  readonly updatedAt: Date | null;
  /** Patients per slot when a modality has no equipment registered. */
  readonly declaredCapacity: number;
  readonly studies: CenterStudy[];
  readonly studyRows: readonly StudyRow[];
  readonly equipment: CenterEquipment[];
}

export function kindOf(unit: UnitRow): CenterKind {
  return unit.type_concept_id === DUNIT.UNIT_TYPE_LABORATORY
    ? 'LABORATORY'
    : 'IMAGING';
}

/** An offering's modality; a laboratory's offerings without one are sampling. */
export function studyModality(
  row: StudyRow,
  kind: CenterKind,
): ModalityCode | null {
  return (
    modalityOfConcept(row.modality_concept_id) ??
    (kind === 'LABORATORY' ? 'LAB' : null)
  );
}

export function toStudy(
  row: StudyRow,
  modalityCode: ModalityCode,
): CenterStudy {
  return {
    code: row.study_code,
    name: row.display_name,
    modalityCode,
    price: row.amount === null ? null : Number(row.amount),
    currency: currencyOf(row.currency_code),
    preparation: row.preparation_instructions,
  };
}

export function toOccupying(row: OccupyingRow): OccupyingBooking {
  const modality = row.modality_code as ModalityCode | null;
  return {
    id: row.id,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    modalityCode:
      modality !== null && MODALITY_CODES.includes(modality) ? modality : null,
    studyCode: row.study_code,
  };
}

function scheduleFrom(rows: readonly TemplateRuleRow[], kind: CenterKind) {
  const blocks = new Map<string, { name: string; block: ScheduleBlock }>();
  for (const row of rows) {
    const current = blocks.get(row.template_id) ?? {
      name: row.name,
      block: { windows: [], slotMinutes: row.slot_minutes ?? 30 },
    };
    if (row.day_of_week !== null && row.start_time && row.end_time) {
      current.block = {
        ...current.block,
        windows: [
          ...current.block.windows,
          {
            dayOfWeek: row.day_of_week === 0 ? 7 : row.day_of_week,
            startTime: row.start_time.slice(0, 5),
            endTime: row.end_time.slice(0, 5),
          },
        ],
      };
    }
    blocks.set(row.template_id, current);
  }
  // Rows come newest first: the first block of each level wins.
  let general: ScheduleBlock | null = null;
  const modalities = new Map<ModalityCode, ScheduleBlock>();
  const studies = new Map<string, ScheduleBlock>();
  const equipment = new Map<string, ScheduleBlock>();
  for (const { name, block } of blocks.values()) {
    const scope = scopeOfTemplate(name);
    if (scope.level === 'GENERAL') general ??= block;
    else if (scope.level === 'EQUIPMENT') {
      if (!equipment.has(scope.key)) equipment.set(scope.key, block);
    } else if (scope.level === 'STUDY') {
      if (!studies.has(scope.key)) studies.set(scope.key, block);
    } else if (MODALITY_CODES.includes(scope.key as ModalityCode)) {
      const code = scope.key as ModalityCode;
      if (!modalities.has(code)) modalities.set(code, block);
    }
  }
  const schedule: CenterSchedule = {
    general: general ?? defaultSchedule(kind).general,
    modalities: [...modalities].map(([modalityCode, schedule]) => ({
      modalityCode,
      schedule,
    })),
    studies: [...studies].map(([studyCode, schedule]) => ({
      studyCode,
      schedule,
    })),
    equipment: [...equipment].map(([equipmentId, schedule]) => ({
      equipmentId,
      schedule,
    })),
  };
  return schedule;
}

/** Loads a unit's schedule, studies and equipment in one place. */
@Injectable()
export class CenterContextService {
  constructor(
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly studiesRepo: CenterStudiesRepository,
  ) {}

  async load(em: EntityManager, unit: UnitRow): Promise<CenterContext> {
    const kind = kindOf(unit);
    const [resource, [site], studyRows, equipmentRows] = await Promise.all([
      this.scheduleRepo.findResource(em, unit.id),
      this.scheduleRepo.findMainSites(em, [unit.id]),
      this.studiesRepo.findForUnit(em, unit.id),
      this.scheduleRepo.findEquipment(em, unit.id),
    ]);
    const rules = resource
      ? await this.scheduleRepo.findTemplateRules(em, resource.id)
      : [];
    const studies: CenterStudy[] = [];
    for (const row of studyRows) {
      const modality = studyModality(row, kind);
      if (modality === null || studies.some((s) => s.code === row.study_code))
        continue;
      studies.push(toStudy(row, modality));
    }
    const equipment = equipmentRows.map((e): CenterEquipment => ({
      id: e.id,
      // What the center calls it (its model) before the catalog's type name.
      name: e.model?.trim() || e.type_display || 'Equipo',
      manufacturer: e.manufacturer,
      model: e.model,
      serialNumber: e.serial_number,
      // An analyzer processes samples in batches: it never limits a slot.
      modalityCode:
        e.type_concept_id === DUNIT.EQUIPMENT_TYPE_ANALYZER
          ? null
          : modalityOfConcept(e.modality_concept_id),
      status: equipmentStatusOfConcept(e.status_concept_id),
      glossaryConceptId: null,
    }));
    const declared = rules.find((r) => r.capacity_per_slot !== null);
    const loaded =
      rules.length === 0 ? defaultSchedule(kind) : scheduleFrom(rules, kind);
    // A shift of a device that left the center is not part of the schedule.
    const schedule: CenterSchedule = {
      ...loaded,
      equipment: loaded.equipment.filter((s) =>
        equipment.some((e) => e.id === s.equipmentId),
      ),
    };
    return {
      unit,
      kind,
      zone: resource?.time_zone ?? site?.time_zone ?? DEFAULT_TIME_ZONE,
      resourceId: resource?.id ?? null,
      site: site ?? null,
      schedule,
      updatedAt: rules[0]?.updated_at ?? null,
      declaredCapacity: declared?.capacity_per_slot ?? 1,
      studies,
      studyRows,
      equipment,
    };
  }
}
