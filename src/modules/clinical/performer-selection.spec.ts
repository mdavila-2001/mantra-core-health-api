import { CLIN } from './clinical.concepts';
import {
  DEFAULT_PERFORMER_SELECTION_CONCEPT,
  PERFORMER_SELECTION_CONCEPTS,
  performerSelectionCodeOf,
  type PerformerSelectionCode,
} from './performer-selection';

describe('performer-selection', () => {
  const codes: PerformerSelectionCode[] = [
    'SELF',
    'ORGANIZATION',
    'PATIENT_CHOICE',
  ];

  it('mapea cada código a su concepto y de vuelta', () => {
    for (const code of codes) {
      const conceptId = PERFORMER_SELECTION_CONCEPTS[code];
      expect(performerSelectionCodeOf(conceptId)).toBe(code);
    }
  });

  it('los tres conceptos son distintos', () => {
    const ids = codes.map((code) => PERFORMER_SELECTION_CONCEPTS[code]);
    expect(new Set(ids).size).toBe(3);
  });

  it('un concepto ajeno al conjunto no es un modo', () => {
    expect(
      performerSelectionCodeOf(CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE),
    ).toBeUndefined();
    expect(performerSelectionCodeOf('no-es-un-concepto')).toBeUndefined();
  });

  it('el modo por defecto es que elija el paciente', () => {
    expect(DEFAULT_PERFORMER_SELECTION_CONCEPT).toBe(
      CLIN.SERVICE_REQUEST_PERFORMER_PATIENT_CHOICE,
    );
  });
});
