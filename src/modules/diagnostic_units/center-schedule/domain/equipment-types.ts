import { DUNIT } from '../../diagnostic_units.concepts';
import type { ModalityCode } from './center-schedule.model';

/**
 * The catalog of equipment types a center picks from when it inventories a
 * device. One type per imaging modality plus the two laboratory ones. The
 * codes are the DICOM-like ones the frontend already uses for its modalities.
 */
export const EQUIPMENT_TYPE_CODES = [
  'US',
  'XR',
  'MR',
  'CT',
  'MG',
  'DX',
  'SAMPLING',
  'ANALYZER',
] as const;
export type EquipmentTypeCode = (typeof EQUIPMENT_TYPE_CODES)[number];

export interface EquipmentType {
  readonly code: EquipmentTypeCode;
  /** How the center names one device of this type. */
  readonly label: string;
  /** `null`: the type never limits appointments (an analyzer works in batches). */
  readonly modalityCode: ModalityCode | null;
  readonly conceptId: string;
}

export const EQUIPMENT_TYPES: readonly EquipmentType[] = [
  {
    code: 'US',
    label: 'Ecógrafo',
    modalityCode: 'ECO',
    conceptId: DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
  },
  {
    code: 'XR',
    label: 'Equipo de rayos X',
    modalityCode: 'RX',
    conceptId: DUNIT.EQUIPMENT_TYPE_XRAY,
  },
  {
    code: 'MR',
    label: 'Resonador',
    modalityCode: 'RM',
    conceptId: DUNIT.EQUIPMENT_TYPE_MRI,
  },
  {
    code: 'CT',
    label: 'Tomógrafo',
    modalityCode: 'TC',
    conceptId: DUNIT.EQUIPMENT_TYPE_CT,
  },
  {
    code: 'MG',
    label: 'Mamógrafo',
    modalityCode: 'MG',
    conceptId: DUNIT.EQUIPMENT_TYPE_MAMMOGRAPHY,
  },
  {
    code: 'DX',
    label: 'Densitómetro',
    modalityCode: 'DXA',
    conceptId: DUNIT.EQUIPMENT_TYPE_BONE_DENSITOMETRY,
  },
  {
    code: 'SAMPLING',
    label: 'Puesto de extracción',
    modalityCode: 'LAB',
    conceptId: DUNIT.EQUIPMENT_TYPE_SAMPLING_STATION,
  },
  {
    code: 'ANALYZER',
    label: 'Analizador',
    modalityCode: null,
    conceptId: DUNIT.EQUIPMENT_TYPE_ANALYZER,
  },
];

const BY_CODE = new Map(EQUIPMENT_TYPES.map((t) => [t.code, t]));
const BY_CONCEPT = new Map(EQUIPMENT_TYPES.map((t) => [t.conceptId, t]));

export function equipmentType(code: EquipmentTypeCode): EquipmentType {
  return BY_CODE.get(code)!;
}

/** `null` for a device registered with a concept outside this catalog. */
export function equipmentTypeOfConcept(
  conceptId: string | null | undefined,
): EquipmentType | null {
  return conceptId ? (BY_CONCEPT.get(conceptId) ?? null) : null;
}
