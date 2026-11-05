import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DUNIT } from '../../diagnostic_units.concepts';
import {
  DEFAULT_TIME_ZONE,
  MODALITY_CODES,
  equipmentStatusOfConcept,
  modalityOfConcept,
  type CenterDevice,
  type CenterKind,
  type CenterSchedule,
  type CenterStudy,
  type ModalityCode,
  type ScheduleBlock,
} from '../domain/center-schedule.model';
import { equipmentTypeOfConcept } from '../domain/equipment-types';
import { defaultSchedule, scopeOfTemplate } from '../domain/schedule-rules';
import type { OccupyingBooking } from '../domain/availability';
import {
  CenterScheduleRepository,
  type EquipmentRow,
  type SiteRow,
  type TemplateRuleRow,
  type UnitRow,
} from '../infrastructure/center-schedule.repository';
import { DeviceResourcesRepository } from '../infrastructure/device-resources.repository';
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
  /** Every device of the unit, with its own schedule and resource when it has them. */
  readonly equipment: CenterDevice[];
}

/** The center's resource plus every device's: where its bookings can live. */
export function resourceIdsOf(ctx: CenterContext): string[] {
  return [
    ...(ctx.resourceId ? [ctx.resourceId] : []),
    ...ctx.equipment.flatMap((e) => (e.resourceId ? [e.resourceId] : [])),
  ];
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
    slotId: row.slot_id,
    resourceId: row.resource_id,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    modalityCode:
      modality !== null && MODALITY_CODES.includes(modality) ? modality : null,
    studyCode: row.study_code,
    equipmentId: row.equipment_id,
  };
}

/** The blocks of a resource's published templates, newest first. */
function blocksOf(rows: readonly TemplateRuleRow[]) {
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
  return blocks;
}

function scheduleFrom(rows: readonly TemplateRuleRow[], kind: CenterKind) {
  const blocks = blocksOf(rows);
  // Rows come newest first: the first block of each level wins.
  let general: ScheduleBlock | null = null;
  const modalities = new Map<ModalityCode, ScheduleBlock>();
  const studies = new Map<string, ScheduleBlock>();
  for (const { name, block } of blocks.values()) {
    const scope = scopeOfTemplate(name);
    if (scope.level === 'GENERAL') general ??= block;
    else if (scope.level === 'STUDY') {
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
  };
  return schedule;
}

/** A device's own hours: the first general-scope template on its resource. */
function ownBlockOf(rows: readonly TemplateRuleRow[]): ScheduleBlock | null {
  for (const { name, block } of blocksOf(rows).values()) {
    if (scopeOfTemplate(name).level === 'GENERAL') return block;
  }
  return null;
}

/** How the center and the patient name a device. */
export function deviceName(row: EquipmentRow): string {
  const type = equipmentTypeOfConcept(row.type_concept_id);
  const label = type?.label ?? row.type_display ?? 'Equipo';
  const make = [row.manufacturer, row.model].filter(Boolean).join(' ');
  return make ? `${label} ${make}` : label;
}

/** Loads a unit's schedule, studies and equipment in one place. */
@Injectable()
export class CenterContextService {
  constructor(
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly studiesRepo: CenterStudiesRepository,
    private readonly devicesRepo: DeviceResourcesRepository,
  ) {}

  async load(em: EntityManager, unit: UnitRow): Promise<CenterContext> {
    const kind = kindOf(unit);
    const [resource, [site], studyRows, equipmentRows] = await Promise.all([
      this.scheduleRepo.findResource(em, unit.id),
      this.scheduleRepo.findMainSites(em, [unit.id]),
      this.studiesRepo.findForUnit(em, unit.id),
      this.scheduleRepo.findEquipment(em, unit.id),
    ]);
    const deviceResources = await this.devicesRepo.findResources(
      em,
      equipmentRows.map((e) => e.id),
    );
    const [rules, deviceRules] = await Promise.all([
      resource ? this.scheduleRepo.findTemplateRules(em, resource.id) : [],
      this.devicesRepo.findTemplateRules(
        em,
        deviceResources.map((r) => r.id),
      ),
    ]);
    const studies: CenterStudy[] = [];
    for (const row of studyRows) {
      const modality = studyModality(row, kind);
      if (modality === null || studies.some((s) => s.code === row.study_code))
        continue;
      studies.push(toStudy(row, modality));
    }
    const equipment = equipmentRows.map((e): CenterDevice => {
      const type = equipmentTypeOfConcept(e.type_concept_id);
      const resourceId =
        deviceResources.find((r) => r.equipment_id === e.id)?.id ?? null;
      return {
        id: e.id,
        name: deviceName(e),
        typeCode: type?.code ?? null,
        manufacturer: e.manufacturer,
        model: e.model,
        serialNumber: e.serial_number,
        // An analyzer processes samples in batches: it never limits a slot.
        modalityCode:
          e.type_concept_id === DUNIT.EQUIPMENT_TYPE_ANALYZER
            ? null
            : (type?.modalityCode ?? modalityOfConcept(e.modality_concept_id)),
        status: equipmentStatusOfConcept(e.status_concept_id),
        schedule: resourceId
          ? ownBlockOf(deviceRules.filter((r) => r.resource_id === resourceId))
          : null,
        resourceId,
        glossaryConceptId: null,
      };
    });
    const declared = rules.find((r) => r.capacity_per_slot !== null);
    return {
      unit,
      kind,
      zone: resource?.time_zone ?? site?.time_zone ?? DEFAULT_TIME_ZONE,
      resourceId: resource?.id ?? null,
      site: site ?? null,
      schedule:
        rules.length === 0 ? defaultSchedule(kind) : scheduleFrom(rules, kind),
      updatedAt: rules[0]?.updated_at ?? null,
      declaredCapacity: declared?.capacity_per_slot ?? 1,
      studies,
      studyRows,
      equipment,
    };
  }
}
