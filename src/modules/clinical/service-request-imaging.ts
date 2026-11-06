import { PreconditionFailedException } from '../../common';
import { StudyDetailReason } from './clinical.error-reasons';
import type {
  ServiceRequestImagingDto,
  ServiceRequestImagingFlatDto,
} from './dto/service-request-detail.dto';
import type { ServiceRequests } from './entities';
import {
  IMAGING_BONE_TYPE_VALUE_SET,
  type StudyValueSetCode,
} from './study-catalog.port';

/*
 * Región de una orden de imagen que llega del visor 3D del cuerpo (estructura
 * Uberon y malla) más tipo de hueso. Funciones puras: la validación contra
 * el catálogo entra por `isInValueSet`, la escritura y la lectura no tocan el ORM.
 */

/** Estructura elegida en el visor 3D: `UBERON:<n>`. */
export const BODY_STRUCTURE_PATTERN = /^UBERON:\d{1,12}$/;
/** Malla del atlas (`BP44`): alfanumérica acotada. */
export const BODY_MESH_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** El detalle de imagen tal como lo recibe la validación (todo opcional). */
export interface ImagingInput {
  modalityConceptId?: string;
  bodySiteConceptId?: string;
  lateralityConceptId?: string;
  contrastConceptId?: string;
  bodyStructureUberon?: string;
  bodyMeshId?: string;
  boneTypeConceptId?: string;
}

/** Los campos de imagen que también pueden viajar en el nivel superior del alta. */
const FLAT_KEYS = [
  'modalityConceptId',
  'bodySiteConceptId',
  'lateralityConceptId',
  'bodyStructureUberon',
  'bodyMeshId',
  'boneTypeConceptId',
] as const satisfies readonly (keyof ImagingInput)[];

export type FlatImagingSource = {
  [K in (typeof FLAT_KEYS)[number]]?: string;
} & {
  imaging?: ImagingInput;
};

/** `true` si algún campo de imagen trae valor. */
export function hasImagingFields(imaging: ImagingInput | undefined): boolean {
  return (
    imaging !== undefined &&
    Object.values(imaging).some((value) => value !== undefined)
  );
}

/**
 * Une los campos de imagen del nivel superior con los de `imaging`. Un campo
 * en los dos lugares con el mismo valor es lo mismo; con valores distintos, 422
 * `IMAGING_FIELD_CONFLICT` (no se elige uno en silencio).
 */
export function mergeImagingInput(
  source: FlatImagingSource,
): ImagingInput | undefined {
  const nested = source.imaging;
  if (FLAT_KEYS.every((key) => source[key] === undefined)) return nested;
  const merged: ImagingInput = { ...nested };
  for (const key of FLAT_KEYS) {
    const flat = source[key];
    if (flat === undefined) continue;
    if (merged[key] !== undefined && merged[key] !== flat) {
      throw new PreconditionFailedException(
        'El mismo dato de imagen viene dos veces con valores distintos',
        {
          reason: StudyDetailReason.IMAGING_FIELD_CONFLICT,
          field: key,
        },
      );
    }
    merged[key] = flat;
  }
  return merged;
}

/** 422 si la orden trae muestra (laboratorio) y datos de imagen (imagenología) a la vez. */
export function assertSpecimenImagingExclusive(
  specimenTypeConceptId: string | undefined,
  imaging: ImagingInput | undefined,
): void {
  if (specimenTypeConceptId === undefined || !hasImagingFields(imaging)) {
    return;
  }
  throw new PreconditionFailedException(
    'Una orden lleva muestra (laboratorio) o datos de imagen, no las dos cosas',
    {
      reason: StudyDetailReason.SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE,
      field: 'specimenTypeConceptId',
    },
  );
}

/**
 * Formato de la estructura y la malla del atlas, y tipo de hueso: sólo con
 * región o estructura UBERON (lo mismo que exige el CHECK de la base) y de `bone-type`.
 * El atlas no se consulta: se valida la forma, no que la estructura exista.
 */
export async function assertStructureFields(
  imaging: ImagingInput | undefined,
  isInValueSet: (valueSet: StudyValueSetCode, id: string) => Promise<boolean>,
): Promise<void> {
  const fail = (
    reason: (typeof StudyDetailReason)[keyof typeof StudyDetailReason],
    message: string,
    field: string,
    extra: Record<string, unknown> = {},
  ): never => {
    throw new PreconditionFailedException(message, { reason, field, ...extra });
  };
  const uberon = imaging?.bodyStructureUberon;
  if (uberon !== undefined && !BODY_STRUCTURE_PATTERN.test(uberon)) {
    fail(
      StudyDetailReason.BODY_STRUCTURE_FORMAT_INVALID,
      'La estructura corporal debe tener la forma UBERON:<número>',
      'imaging.bodyStructureUberon',
    );
  }
  const mesh = imaging?.bodyMeshId;
  if (mesh !== undefined && !BODY_MESH_ID_PATTERN.test(mesh)) {
    fail(
      StudyDetailReason.BODY_MESH_ID_FORMAT_INVALID,
      'La malla del modelo 3D debe ser alfanumérica (hasta 64 caracteres)',
      'imaging.bodyMeshId',
    );
  }
  const bone = imaging?.boneTypeConceptId;
  if (bone === undefined) return;
  if (imaging?.bodySiteConceptId === undefined && uberon === undefined) {
    fail(
      StudyDetailReason.BONE_TYPE_REQUIRES_BODY_STRUCTURE,
      'El tipo de hueso exige indicar la región o la estructura UBERON',
      'imaging.boneTypeConceptId',
    );
  }
  if (!(await isInValueSet(IMAGING_BONE_TYPE_VALUE_SET, bone))) {
    fail(
      StudyDetailReason.BONE_TYPE_NOT_IN_CATALOG,
      'El tipo de hueso no pertenece al catálogo de tipos de hueso',
      'imaging.boneTypeConceptId',
      { catalog: IMAGING_BONE_TYPE_VALUE_SET },
    );
  }
}

/** Las columnas de detalle (muestra e imagen) que se escriben en la orden. */
export function detailColumnsOf(
  prepared: ImagingInput & { specimenTypeConceptId?: string },
): ImagingInput & { specimenTypeConceptId?: string } {
  return {
    specimenTypeConceptId: prepared.specimenTypeConceptId,
    modalityConceptId: prepared.modalityConceptId,
    bodySiteConceptId: prepared.bodySiteConceptId,
    lateralityConceptId: prepared.lateralityConceptId,
    contrastConceptId: prepared.contrastConceptId,
    bodyStructureUberon: prepared.bodyStructureUberon,
    bodyMeshId: prepared.bodyMeshId,
    boneTypeConceptId: prepared.boneTypeConceptId,
  };
}

/** El detalle de imagen guardado en la orden, con nombres; `null` si no trae nada. */
export function imagingViewOf(
  request: ServiceRequests,
  name: (id: string | null | undefined) => string | null,
): ServiceRequestImagingDto | null {
  const stored = [
    request.modalityConceptId,
    request.bodySiteConceptId,
    request.lateralityConceptId,
    request.contrastConceptId,
    request.bodyStructureUberon,
    request.bodyMeshId,
    request.boneTypeConceptId,
  ];
  if (!stored.some(Boolean)) return null;
  return {
    modalityConceptId: request.modalityConceptId ?? null,
    modalityDisplay: name(request.modalityConceptId),
    bodySiteConceptId: request.bodySiteConceptId ?? null,
    bodySiteDisplay: name(request.bodySiteConceptId),
    lateralityConceptId: request.lateralityConceptId ?? null,
    lateralityDisplay: name(request.lateralityConceptId),
    contrastConceptId: request.contrastConceptId ?? null,
    contrastDisplay: name(request.contrastConceptId),
    bodyStructureUberon: request.bodyStructureUberon ?? null,
    bodyMeshId: request.bodyMeshId ?? null,
    boneTypeConceptId: request.boneTypeConceptId ?? null,
    boneTypeDisplay: name(request.boneTypeConceptId),
  };
}

/**
 * Los campos de imagen en el nivel superior de la respuesta (lo que pide el
 * visor), derivados de `imaging`. Sin detalle de imagen no agrega ninguno: la
 * respuesta de una orden de laboratorio queda igual que antes.
 */
export function flatImagingOf(
  imaging: ServiceRequestImagingDto | null | undefined,
): ServiceRequestImagingFlatDto {
  if (!imaging) return {};
  return {
    modalityConceptId: imaging.modalityConceptId,
    modalityDisplay: imaging.modalityDisplay,
    bodySiteConceptId: imaging.bodySiteConceptId,
    bodySiteDisplay: imaging.bodySiteDisplay,
    lateralityConceptId: imaging.lateralityConceptId,
    lateralityDisplay: imaging.lateralityDisplay,
    bodyStructureUberon: imaging.bodyStructureUberon,
    bodyMeshId: imaging.bodyMeshId,
    boneTypeConceptId: imaging.boneTypeConceptId,
    boneTypeDisplay: imaging.boneTypeDisplay,
  };
}
