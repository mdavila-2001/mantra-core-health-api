import { describe, expect, it } from '@jest/globals';
import { PreconditionFailedException } from '../../common';
import { StudyDetailReason } from './clinical.error-reasons';
import {
  assertSpecimenImagingExclusive,
  detailColumnsOf,
  flatImagingOf,
  hasImagingFields,
  imagingViewOf,
  mergeImagingInput,
} from './service-request-imaging';

const MOD = '00000000-0000-4000-8000-000000000001';
const SITE = '00000000-0000-4000-8000-000000000002';
const LAT = '00000000-0000-4000-8000-000000000003';
const BONE = '00000000-0000-4000-8000-000000000004';

function reasonOf(fn: () => unknown): Record<string, unknown> {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(PreconditionFailedException);
    return (error as PreconditionFailedException).details ?? {};
  }
  throw new Error('se esperaba un 422');
}

describe('mergeImagingInput', () => {
  it('correcto: los campos planos entran a imaging', () => {
    expect(
      mergeImagingInput({
        bodySiteConceptId: SITE,
        bodyStructureUberon: 'UBERON:0002398',
        bodyMeshId: 'BP44',
      }),
    ).toEqual({
      bodySiteConceptId: SITE,
      bodyStructureUberon: 'UBERON:0002398',
      bodyMeshId: 'BP44',
    });
  });

  it('correcto: sin campos planos devuelve imaging tal cual (misma referencia)', () => {
    const imaging = { bodySiteConceptId: SITE };
    expect(mergeImagingInput({ imaging })).toBe(imaging);
  });

  it('límite: sin nada devuelve undefined (la orden no es de imagen)', () => {
    expect(mergeImagingInput({})).toBeUndefined();
  });

  it('límite: el mismo valor en los dos lugares no es conflicto; flat y nested se completan', () => {
    expect(
      mergeImagingInput({
        modalityConceptId: MOD,
        lateralityConceptId: LAT,
        imaging: { modalityConceptId: MOD, contrastConceptId: BONE },
      }),
    ).toEqual({
      modalityConceptId: MOD,
      lateralityConceptId: LAT,
      contrastConceptId: BONE,
    });
  });

  it('inválido: el mismo campo con valores distintos es 422 IMAGING_FIELD_CONFLICT', () => {
    const d = reasonOf(() =>
      mergeImagingInput({
        bodySiteConceptId: SITE,
        imaging: { bodySiteConceptId: LAT },
      }),
    );
    expect(d).toMatchObject({
      reason: StudyDetailReason.IMAGING_FIELD_CONFLICT,
      field: 'bodySiteConceptId',
    });
  });

  it('no muta imaging', () => {
    const imaging = { modalityConceptId: MOD };
    mergeImagingInput({ bodyMeshId: 'BP1', imaging });
    expect(imaging).toEqual({ modalityConceptId: MOD });
  });
});

describe('hasImagingFields y exclusividad con la muestra', () => {
  it('undefined y {} no cuentan', () => {
    expect(hasImagingFields(undefined)).toBe(false);
    expect(hasImagingFields({})).toBe(false);
    expect(hasImagingFields({ bodyMeshId: undefined })).toBe(false);
    expect(hasImagingFields({ bodyMeshId: 'BP1' })).toBe(true);
  });

  it('muestra sola o imagen sola: pasa', () => {
    expect(() => assertSpecimenImagingExclusive('m', undefined)).not.toThrow();
    expect(() => assertSpecimenImagingExclusive('m', {})).not.toThrow();
    expect(() =>
      assertSpecimenImagingExclusive(undefined, { bodyMeshId: 'BP1' }),
    ).not.toThrow();
  });

  it('muestra con cualquier dato de imagen: 422 SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE', () => {
    for (const imaging of [
      { modalityConceptId: MOD },
      { bodyStructureUberon: 'UBERON:1' },
      { boneTypeConceptId: BONE },
    ]) {
      expect(
        reasonOf(() => assertSpecimenImagingExclusive('m', imaging)),
      ).toMatchObject({
        reason: StudyDetailReason.SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE,
      });
    }
  });
});

describe('proyecciones', () => {
  const stored = {
    modalityConceptId: MOD,
    bodySiteConceptId: SITE,
    bodyStructureUberon: 'UBERON:0002398',
    bodyMeshId: 'BP44',
    boneTypeConceptId: BONE,
  } as never;
  const name = (id: string | null | undefined) =>
    id ? `n-${id.slice(-1)}` : null;

  it('imagingViewOf: lo guardado con sus nombres y null en lo que falta', () => {
    expect(imagingViewOf(stored, name)).toEqual({
      modalityConceptId: MOD,
      modalityDisplay: 'n-1',
      bodySiteConceptId: SITE,
      bodySiteDisplay: 'n-2',
      lateralityConceptId: null,
      lateralityDisplay: null,
      contrastConceptId: null,
      contrastDisplay: null,
      bodyStructureUberon: 'UBERON:0002398',
      bodyMeshId: 'BP44',
      boneTypeConceptId: BONE,
      boneTypeDisplay: 'n-4',
    });
  });

  it('imagingViewOf: una orden sin datos de imagen (laboratorio) da null', () => {
    expect(
      imagingViewOf({ specimenTypeConceptId: 'x' } as never, name),
    ).toBeNull();
  });

  it('imagingViewOf: sólo la malla ya es detalle de imagen', () => {
    expect(imagingViewOf({ bodyMeshId: 'BP1' } as never, name)).not.toBeNull();
  });

  it('flatImagingOf: replica imaging en el nivel superior, sin el contraste', () => {
    const flat = flatImagingOf(imagingViewOf(stored, name));
    expect(flat).toMatchObject({
      bodyStructureUberon: 'UBERON:0002398',
      bodyMeshId: 'BP44',
      boneTypeConceptId: BONE,
      lateralityConceptId: null,
    });
    expect(flat).not.toHaveProperty('contrastConceptId');
  });

  it('flatImagingOf: sin imagen no agrega ninguna clave (la respuesta no cambia)', () => {
    expect(flatImagingOf(null)).toEqual({});
    expect(flatImagingOf(undefined)).toEqual({});
  });

  it('detailColumnsOf: sólo copia los campos de detalle', () => {
    expect(
      detailColumnsOf({
        specimenTypeConceptId: 's',
        bodyMeshId: 'BP1',
        categoryConceptId: 'fuera',
      } as never),
    ).not.toHaveProperty('categoryConceptId');
  });
});
