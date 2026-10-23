import {
  applyPatch,
  contentHash,
  EMPTY_CONTENT,
  normalizeText,
  reviewVerdict,
  submissionViolations,
  type AnnotationContent,
} from './annotation.rules';

const completa = (): AnnotationContent => ({
  ...EMPTY_CONTENT,
  purpose:
    'Identidad única de cada persona física con la que la red de salud tiene relación.',
  existenceRationale:
    'Sin una identidad común, el mismo paciente atendido en dos centros serían dos historias clínicas.',
  rowGrain:
    'Una fila por persona física, identificada por su id; los roles cuelgan de ella.',
});

describe('applyPatch', () => {
  it('conserva lo que no viene y borra con null', () => {
    const actual = { ...completa(), unit: 'filas', consumers: ['facturación'] };
    const next = applyPatch(actual, {
      unit: null,
      businessOwner: '  Admisión  ',
    });
    expect(next.unit).toBeNull();
    expect(next.businessOwner).toBe('Admisión');
    expect(next.purpose).toBe(actual.purpose);
    expect(next.consumers).toEqual(['facturación']);
  });

  it('un texto vacío o de espacios es «sin respuesta»', () => {
    expect(normalizeText('   ')).toBeNull();
    expect(applyPatch(completa(), { purpose: '   ' }).purpose).toBeNull();
  });

  it('reemplaza las listas completas y la sensibilidad', () => {
    const next = applyPatch(completa(), {
      consumers: ['a', 'b'],
      openQuestions: [{ field: 'rowGrain', question: '¿?' }],
      sensitivity: 'PHI',
    });
    expect(next.consumers).toEqual(['a', 'b']);
    expect(next.openQuestions).toHaveLength(1);
    expect(next.sensitivity).toBe('PHI');
  });
});

describe('submissionViolations', () => {
  it('una ficha completa se puede enviar', () => {
    expect(submissionViolations(completa())).toEqual([]);
  });

  it('lo que falta se declara o se responde: sin ninguna de las dos, es una violación', () => {
    const v = submissionViolations({ ...completa(), existenceRationale: null });
    expect(v).toEqual([
      expect.objectContaining({
        field: 'existenceRationale',
        reason: 'REQUIRED_OR_OPEN_QUESTION',
      }),
    ]);
    expect(
      submissionViolations({
        ...completa(),
        existenceRationale: null,
        openQuestions: [{ field: 'existenceRationale', question: '¿?' }],
      }),
    ).toEqual([]);
  });

  it('rechaza el texto de relleno aunque sea largo', () => {
    const v = submissionViolations({
      ...completa(),
      purpose:
        'Esta tabla almacena los datos de las personas que se atienden en la red',
    });
    expect(v).toEqual([
      expect.objectContaining({ field: 'purpose', reason: 'FILLER_TEXT' }),
    ]);
  });

  it('rechaza una respuesta demasiado corta para explicar algo', () => {
    expect(
      submissionViolations({
        ...completa(),
        rowGrain: 'Una fila por persona.',
      }),
    ).toEqual([
      expect.objectContaining({ field: 'rowGrain', reason: 'TOO_SHORT' }),
    ]);
  });

  it('informa todas las violaciones juntas, no una por vez', () => {
    expect(submissionViolations(EMPTY_CONTENT).map((x) => x.field)).toEqual([
      'purpose',
      'existenceRationale',
      'rowGrain',
    ]);
  });
});

describe('contentHash', () => {
  it('es estable y distingue contenidos distintos', () => {
    expect(contentHash(completa())).toBe(contentHash(completa()));
    expect(contentHash(completa())).not.toBe(
      contentHash({ ...completa(), unit: 'x' }),
    );
  });
});

describe('reviewVerdict', () => {
  const estado = {
    reviewStatus: 'NEEDS_REVIEW',
    currentRevisionNo: 2,
    revisionAuthorId: 'autor',
    evidenceCount: 1,
  };
  const aprobar = { decision: 'APPROVED' as const, expectedRevisionNo: 2 };

  it('un revisor distinto del autor aprueba con evidencia', () => {
    expect(reviewVerdict(estado, aprobar, 'revisor')).toEqual({ ok: true });
  });

  it('una revisión desactualizada se rechaza antes que cualquier otra cosa', () => {
    expect(
      reviewVerdict(
        { ...estado, reviewStatus: 'DRAFT' },
        { ...aprobar, expectedRevisionNo: 1 },
        'revisor',
      ),
    ).toMatchObject({ ok: false, kind: 'STALE_REVISION' });
  });

  it('sólo se revisa una ficha en revisión', () => {
    expect(
      reviewVerdict({ ...estado, reviewStatus: 'DRAFT' }, aprobar, 'revisor'),
    ).toMatchObject({ ok: false, kind: 'NOT_IN_REVIEW' });
    expect(
      reviewVerdict(
        { ...estado, reviewStatus: 'APPROVED' },
        aprobar,
        'revisor',
      ),
    ).toMatchObject({ ok: false, kind: 'NOT_IN_REVIEW' });
  });

  it('quien escribió la revisión no la decide', () => {
    expect(reviewVerdict(estado, aprobar, 'autor')).toMatchObject({
      ok: false,
      kind: 'SELF_REVIEW',
    });
  });

  it('un rechazo explica qué falta; una aprobación tiene evidencia', () => {
    expect(
      reviewVerdict(
        estado,
        { decision: 'REJECTED', expectedRevisionNo: 2, comment: 'corto' },
        'revisor',
      ),
    ).toMatchObject({ ok: false, kind: 'REJECTION_NEEDS_REASON' });
    expect(
      reviewVerdict(
        estado,
        {
          decision: 'REJECTED',
          expectedRevisionNo: 2,
          comment: 'Falta explicar el grano de la fila',
        },
        'revisor',
      ),
    ).toEqual({ ok: true });
    expect(
      reviewVerdict({ ...estado, evidenceCount: 0 }, aprobar, 'revisor'),
    ).toMatchObject({ ok: false, kind: 'APPROVAL_NEEDS_EVIDENCE' });
  });

  it('un rechazo no necesita evidencia', () => {
    expect(
      reviewVerdict(
        { ...estado, evidenceCount: 0 },
        {
          decision: 'REJECTED',
          expectedRevisionNo: 2,
          comment: 'Falta explicar el grano de la fila',
        },
        'revisor',
      ),
    ).toEqual({ ok: true });
  });
});
