import {
  coverageOfObject,
  summarizeCoverage,
  type CoverageAnnotation,
} from './coverage';

const ficha = (
  extra: Partial<CoverageAnnotation> = {},
): CoverageAnnotation => ({
  purpose:
    'Identidad única de cada persona física con la que la red tiene relación.',
  existenceRationale:
    'Sin una identidad común el mismo paciente serían dos historias clínicas.',
  rowGrain: 'Una fila por persona física, identificada por su id.',
  businessOwner: 'Admisión',
  dataSteward: null,
  sensitivity: 'PERSONAL',
  openQuestions: [],
  reviewStatus: 'APPROVED',
  currentRevisionNo: 2,
  approvedRevisionNo: 2,
  ...extra,
});

describe('coverageOfObject', () => {
  it('un objeto sin ficha tiene todo lo semántico faltando y la sensibilidad desconocida', () => {
    const c = coverageOfObject(5, null);
    expect(c).toMatchObject({
      technical: 'COMPLETE',
      semantic: 'MISSING',
      ownership: 'MISSING',
      sensitivity: 'UNKNOWN',
      review: 'NOT_APPROVED',
    });
    expect(c.missingFields).toEqual([
      'purpose',
      'existenceRationale',
      'rowGrain',
      'businessOwner',
      'sensitivity',
    ]);
  });

  it('una ficha completa y aprobada en su revisión vigente está completa', () => {
    expect(coverageOfObject(5, ficha())).toMatchObject({
      semantic: 'COMPLETE',
      ownership: 'COMPLETE',
      sensitivity: 'KNOWN',
      review: 'APPROVED_CURRENT',
      missingFields: [],
    });
  });

  it('una aprobación de una revisión anterior ya no es vigente', () => {
    expect(coverageOfObject(5, ficha({ currentRevisionNo: 3 })).review).toBe(
      'NOT_APPROVED',
    );
  });

  it('lo que falta pero está declarado como pregunta abierta es deuda declarada, no faltante', () => {
    const c = coverageOfObject(
      5,
      ficha({
        existenceRationale: null,
        openQuestions: [{ field: 'existenceRationale' }],
      }),
    );
    expect(c.semantic).toBe('DECLARED_DEBT');
    // una pregunta sobre otro campo no cubre a éste
    expect(
      coverageOfObject(
        5,
        ficha({
          existenceRationale: null,
          openQuestions: [{ field: 'rowGrain' }],
        }),
      ).semantic,
    ).toBe('MISSING');
  });

  it('el responsable puede ser el dueño de negocio o el steward', () => {
    expect(
      coverageOfObject(5, ficha({ businessOwner: null, dataSteward: 'Datos' }))
        .ownership,
    ).toBe('COMPLETE');
    expect(
      coverageOfObject(5, ficha({ businessOwner: '  ', dataSteward: null }))
        .ownership,
    ).toBe('MISSING');
  });

  it('un objeto sin columnas observadas tiene la cobertura técnica incompleta', () => {
    expect(coverageOfObject(0, null).technical).toBe('INCOMPLETE');
  });
});

describe('summarizeCoverage', () => {
  it('sin objetos no inventa un porcentaje: la razón es null y el estado NOT_APPLICABLE', () => {
    const s = summarizeCoverage([]);
    expect(s.dimensions.semantic).toEqual({
      status: 'NOT_APPLICABLE',
      covered: 0,
      denominator: 0,
      ratio: null,
    });
    expect(s.denominator).toBe(0);
  });

  it('mide cada dimensión sobre los objetos observados y cuenta la deuda declarada', () => {
    const completo = coverageOfObject(3, ficha());
    const vacio = coverageOfObject(3, null);
    const deuda = coverageOfObject(
      3,
      ficha({ rowGrain: null, openQuestions: [{ field: 'rowGrain' }] }),
    );
    const s = summarizeCoverage([completo, vacio, deuda, vacio]);
    expect(s.denominator).toBe(4);
    expect(s.declaredDebt).toBe(1);
    expect(s.dimensions.semantic).toMatchObject({
      status: 'MEASURED',
      covered: 1,
      denominator: 4,
      ratio: 0.25,
    });
    expect(s.dimensions.technical.ratio).toBe(1);
    expect(s.dimensions.review.covered).toBe(2);
    expect(s.modelVersion).toBe('catalog-coverage/v1');
  });
});
