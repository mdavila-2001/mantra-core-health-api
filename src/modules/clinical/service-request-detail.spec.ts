import { DUNIT } from '../diagnostic_units/diagnostic_units.concepts';
import { DIAG } from '../diagnostics/diagnostics.concepts';
import { CLIN } from './clinical.concepts';
import { ClinicalErrorReason } from './clinical.error-reasons';
import { assertServiceRequestDetail } from './service-request-detail';

function reasonOf(fn: () => void): string | undefined {
  try {
    fn();
  } catch (e) {
    const err = e as {
      reason?: string;
      details?: { reason?: string };
      getResponse?: () => unknown;
    };
    return (
      err.reason ??
      err.details?.reason ??
      JSON.stringify(err.getResponse?.() ?? e)
    );
  }
  return undefined;
}

describe('assertServiceRequestDetail', () => {
  describe('correcto', () => {
    it('acepta una orden sin detalle, con o sin categoría', () => {
      expect(() => assertServiceRequestDetail(undefined, {})).not.toThrow();
      expect(() => assertServiceRequestDetail('LAB', {})).not.toThrow();
    });
    it('acepta la muestra en una orden de laboratorio', () => {
      expect(() =>
        assertServiceRequestDetail('LAB', {
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
        }),
      ).not.toThrow();
    });
    it('acepta el detalle completo de una imagen', () => {
      expect(() =>
        assertServiceRequestDetail('IMAGING', {
          modalityConceptId: DUNIT.MODALITY_XRAY,
          bodySiteConceptId: CLIN.SERVICE_REQUEST_REGION_UPPER_LIMB,
          lateralityConceptId: CLIN.CONDITION_LATERALITY_LEFT,
          contrastConceptId: CLIN.SERVICE_REQUEST_CONTRAST_NONE,
        }),
      ).not.toThrow();
    });
  });

  describe('límite', () => {
    it('acepta sólo la región, sin lateralidad (un tórax no tiene lado)', () => {
      expect(() =>
        assertServiceRequestDetail('IMAGING', {
          bodySiteConceptId: CLIN.SERVICE_REQUEST_REGION_THORAX,
        }),
      ).not.toThrow();
    });
    it('acepta la modalidad sola y cada una de las seis de imagen', () => {
      for (const m of [
        DUNIT.MODALITY_XRAY,
        DUNIT.MODALITY_ULTRASOUND,
        DUNIT.MODALITY_CT,
        DUNIT.MODALITY_MRI,
        DUNIT.MODALITY_MAMMOGRAPHY,
        DUNIT.MODALITY_BONE_DENSITOMETRY,
      ]) {
        expect(() =>
          assertServiceRequestDetail('IMAGING', { modalityConceptId: m }),
        ).not.toThrow();
      }
    });
  });

  describe('inválido', () => {
    it('rechaza la muestra en una orden de imagen y en una sin categoría', () => {
      const detail = { specimenTypeConceptId: DIAG.SPECIMEN_TYPE_URINE };
      expect(
        reasonOf(() => assertServiceRequestDetail('IMAGING', detail)),
      ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_FOR_CATEGORY);
      expect(
        reasonOf(() => assertServiceRequestDetail(undefined, detail)),
      ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_FOR_CATEGORY);
    });
    it('rechaza datos de imagen en una orden de laboratorio', () => {
      expect(
        reasonOf(() =>
          assertServiceRequestDetail('LAB', {
            modalityConceptId: DUNIT.MODALITY_XRAY,
          }),
        ),
      ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_FOR_CATEGORY);
    });
    it('rechaza una muestra que no es del catálogo', () => {
      expect(
        reasonOf(() =>
          assertServiceRequestDetail('LAB', {
            specimenTypeConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          }),
        ),
      ).toContain('SPECIMEN_TYPE_NOT_IN_CATALOG');
    });
    it('rechaza la modalidad de laboratorio y un concepto ajeno como modalidad', () => {
      for (const m of [
        DUNIT.MODALITY_LABORATORY,
        CLIN.SERVICE_REQUEST_ACTIVE,
      ]) {
        expect(
          reasonOf(() =>
            assertServiceRequestDetail('IMAGING', { modalityConceptId: m }),
          ),
        ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_IN_CATALOG);
      }
    });
    it('rechaza región, lateralidad y contraste fuera de su catálogo', () => {
      const ajeno = CLIN.SERVICE_REQUEST_ACTIVE;
      for (const detail of [
        { bodySiteConceptId: ajeno },
        {
          bodySiteConceptId: CLIN.SERVICE_REQUEST_REGION_ABDOMEN,
          lateralityConceptId: ajeno,
        },
        { modalityConceptId: DUNIT.MODALITY_CT, contrastConceptId: ajeno },
      ]) {
        expect(
          reasonOf(() => assertServiceRequestDetail('IMAGING', detail)),
        ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_IN_CATALOG);
      }
    });
    it('rechaza lateralidad sin región y contraste sin modalidad', () => {
      expect(
        reasonOf(() =>
          assertServiceRequestDetail('IMAGING', {
            lateralityConceptId: CLIN.CONDITION_LATERALITY_RIGHT,
          }),
        ),
      ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_DEPENDENCY);
      expect(
        reasonOf(() =>
          assertServiceRequestDetail('IMAGING', {
            contrastConceptId: CLIN.SERVICE_REQUEST_CONTRAST_WITH,
          }),
        ),
      ).toBe(ClinicalErrorReason.SERVICE_REQUEST_DETAIL_DEPENDENCY);
    });
  });
});
