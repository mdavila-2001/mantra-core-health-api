import { DUNIT } from '../../diagnostic_units.concepts';

/**
 * Wire model of a diagnostic center's opening hours, equipment and order
 * bookings (`P-CENTRO-HORARIOS`). Names and shapes follow the frontend
 * contract in `center-schedule.types.ts`; days are ISO (1 = Monday … 7 = Sunday)
 * and times are wall-clock `HH:MM` in the center's time zone.
 */

/** Modalities the API can resolve from a concept. ECG has no concept yet. */
export const MODALITY_CODES = [
  'ECO',
  'RX',
  'RM',
  'TC',
  'MG',
  'DXA',
  'LAB',
] as const;
export type ModalityCode = (typeof MODALITY_CODES)[number];

export const EQUIPMENT_STATUSES = [
  'OPERATIONAL',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

/**
 * Which level gave a study its schedule. `EQUIPMENT` is a device's own
 * schedule; `MODALITY` only survives for schedules published before devices
 * had their own (they migrate on the next publish).
 */
export type ScheduleOrigin = 'STUDY' | 'EQUIPMENT' | 'MODALITY' | 'GENERAL';
export type CenterKind = 'LABORATORY' | 'IMAGING';

export interface ScheduleWindow {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
}

export interface ScheduleBlock {
  readonly windows: ScheduleWindow[];
  readonly slotMinutes: number;
}

export interface CenterSchedule {
  readonly general: ScheduleBlock;
  readonly modalities: {
    readonly modalityCode: ModalityCode;
    readonly schedule: ScheduleBlock;
  }[];
  readonly studies: {
    readonly studyCode: string;
    readonly schedule: ScheduleBlock;
  }[];
}

export interface CenterEquipment {
  readonly id: string;
  readonly name: string;
  /** Catalog type; `null` for a device registered with a concept outside it. */
  readonly typeCode: string | null;
  readonly manufacturer: string | null;
  readonly model: string | null;
  readonly serialNumber: string | null;
  readonly modalityCode: ModalityCode | null;
  readonly status: EquipmentStatus;
  /** The device's own schedule; `null` while it follows the center's general one. */
  readonly schedule: ScheduleBlock | null;
  readonly glossaryConceptId: string | null;
}

/** A device as the server works with it: the equipment plus its scheduling resource. */
export interface CenterDevice extends CenterEquipment {
  /** `null` until the device gets its own schedule or its first booking. */
  readonly resourceId: string | null;
}

export interface CenterStudy {
  readonly code: string;
  readonly name: string;
  readonly modalityCode: ModalityCode;
  readonly price: number | null;
  readonly currency: string | null;
  readonly preparation: string | null;
}

/** A free start for a study, with the capacity left in that slot. */
export interface StudyStart {
  readonly startAt: string;
  readonly endAt: string;
  readonly remaining: number;
  readonly capacity: number;
}

/** Modality code ↔ the `DUNIT.MODALITY_*` concept stored on offerings and equipment. */
export const MODALITY_CONCEPT: Readonly<Record<ModalityCode, string>> = {
  ECO: DUNIT.MODALITY_ULTRASOUND,
  RX: DUNIT.MODALITY_XRAY,
  RM: DUNIT.MODALITY_MRI,
  TC: DUNIT.MODALITY_CT,
  MG: DUNIT.MODALITY_MAMMOGRAPHY,
  DXA: DUNIT.MODALITY_BONE_DENSITOMETRY,
  LAB: DUNIT.MODALITY_LABORATORY,
};

/** How the patient and the center name each modality. */
export const MODALITY_LABEL: Readonly<Record<ModalityCode, string>> = {
  ECO: 'Ecografía',
  RX: 'Radiografía',
  RM: 'Resonancia magnética',
  TC: 'Tomografía computarizada',
  MG: 'Mamografía',
  DXA: 'Densitometría ósea',
  LAB: 'Toma de muestras',
};

const MODALITY_BY_CONCEPT = new Map(
  Object.entries(MODALITY_CONCEPT).map(([code, id]) => [
    id,
    code as ModalityCode,
  ]),
);

export function modalityOfConcept(
  conceptId: string | null | undefined,
): ModalityCode | null {
  return conceptId ? (MODALITY_BY_CONCEPT.get(conceptId) ?? null) : null;
}

export const EQUIPMENT_STATUS_CONCEPT: Readonly<
  Record<EquipmentStatus, string>
> = {
  OPERATIONAL: DUNIT.EQUIPMENT_OPERATIONAL,
  MAINTENANCE: DUNIT.EQUIPMENT_MAINTENANCE,
  OUT_OF_SERVICE: DUNIT.EQUIPMENT_OUT_OF_SERVICE,
};

/** An unknown status concept never counts as capacity. */
export function equipmentStatusOfConcept(conceptId: string): EquipmentStatus {
  if (conceptId === DUNIT.EQUIPMENT_OPERATIONAL) return 'OPERATIONAL';
  if (conceptId === DUNIT.EQUIPMENT_MAINTENANCE) return 'MAINTENANCE';
  return 'OUT_OF_SERVICE';
}

/** Default wall-clock zone when neither the resource nor the site declares one. */
export const DEFAULT_TIME_ZONE = 'America/La_Paz';

/** How far ahead availability is offered when the caller gives no `to`. */
export const AVAILABILITY_DAYS = 14;

/** A start closer than this to now is no longer offered. */
export const BOOKING_MARGIN_MINUTES = 30;
