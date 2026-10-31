import {
  FIELD_MASK_KINDS,
  applyFieldMask,
  maskRank,
  mostMasked,
  mostRevealing,
} from './support-field-mask';

describe('support-field-mask · applyFieldMask (§2.6)', () => {
  it('FULL deja el valor tal cual', () => {
    expect(applyFieldMask('Carmen Ortuño Salas', 'FULL', 'PATIENT_NAME')).toBe(
      'Carmen Ortuño Salas',
    );
  });

  it('nombre: PARTIAL = primer nombre + inicial del primer apellido', () => {
    expect(applyFieldMask('Carmen Ortuño', 'PARTIAL', 'PATIENT_NAME')).toBe(
      'Carmen O.',
    );
    expect(
      applyFieldMask('Carmen Ortuño Salas', 'PARTIAL', 'PATIENT_NAME'),
    ).toBe('Carmen O.');
    expect(applyFieldMask('Carmen', 'PARTIAL', 'PATIENT_NAME')).toBe('Carmen');
    expect(applyFieldMask('Carmen Ortuño', 'REDACT', 'PATIENT_NAME')).toBe(
      'Paciente',
    );
    expect(
      applyFieldMask('Carmen Ortuño', 'NULLIFY', 'PATIENT_NAME'),
    ).toBeNull();
  });

  it('teléfono y documento usan el estilo que ya existe (7******7, ***556)', () => {
    expect(applyFieldMask('+591 71234567', 'PARTIAL', 'PHONE')).toBe(
      '7******7',
    );
    expect(applyFieldMask('1234556', 'PARTIAL', 'DOCUMENT')).toBe('***556');
    expect(applyFieldMask('+591 71234567', 'REDACT', 'PHONE')).toBe('[oculto]');
    expect(applyFieldMask('1234556', 'REDACT', 'DOCUMENT')).toBe('[oculto]');
    expect(applyFieldMask('1234556', 'NULLIFY', 'DOCUMENT')).toBeNull();
  });

  it('motivo: PARTIAL = primeros 40 caracteres + «…»', () => {
    const long =
      'Dolor persistente en el pecho que se irradia al brazo izquierdo desde ayer';
    const partial = applyFieldMask(long, 'PARTIAL', 'REASON');
    expect(partial).toBe(`${long.slice(0, 40)}…`);
    expect(applyFieldMask('Control anual', 'PARTIAL', 'REASON')).toBe(
      'Control anual',
    );
    expect(applyFieldMask(long, 'REDACT', 'REASON')).toBe('[motivo reservado]');
    expect(applyFieldMask(long, 'NULLIFY', 'REASON')).toBeNull();
  });

  it('aseguradora: PARTIAL solo la aseguradora; REDACT «Con seguro» / «Sin seguro»', () => {
    const coverage = {
      carrier: 'Seguro Univida',
      memberNumber: 'AF-99123',
      policy: 'P-77',
    };
    expect(applyFieldMask(coverage, 'PARTIAL', 'INSURANCE')).toBe(
      'Seguro Univida',
    );
    expect(applyFieldMask(coverage, 'REDACT', 'INSURANCE')).toBe('Con seguro');
    expect(applyFieldMask(null, 'REDACT', 'INSURANCE')).toBe('Sin seguro');
  });

  it('precio: no tiene vista parcial (PARTIAL equivale a REDACT)', () => {
    expect(applyFieldMask('150.00', 'PARTIAL', 'PRICE')).toBe('[oculto]');
    expect(applyFieldMask('150.00', 'REDACT', 'PRICE')).toBe('[oculto]');
    expect(applyFieldMask('150.00', 'NULLIFY', 'PRICE')).toBeNull();
  });

  it('HASH: HMAC-SHA256 con el secreto de la organización, 8 hex; estable y distinto por secreto', () => {
    const a = applyFieldMask('1234556', 'HASH', 'DOCUMENT', { secret: 's1' });
    const b = applyFieldMask('1234556', 'HASH', 'DOCUMENT', { secret: 's1' });
    const c = applyFieldMask('1234556', 'HASH', 'DOCUMENT', { secret: 's2' });
    expect(a).toMatch(/^[0-9a-f]{8}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    // sin secreto no hay hash: falla cerrado (no revela el valor)
    expect(applyFieldMask('1234556', 'HASH', 'DOCUMENT')).toBeNull();
  });

  it('un valor ausente se queda ausente y nunca se filtra el original', () => {
    expect(applyFieldMask(null, 'PARTIAL', 'PHONE')).toBeNull();
    expect(applyFieldMask(undefined, 'REDACT', 'REASON')).toBeNull();
    const secret = 'valor secreto 1234567890 muy largo de verdad ok';
    for (const kind of FIELD_MASK_KINDS) {
      for (const strategy of ['REDACT', 'NULLIFY'] as const) {
        const out = applyFieldMask(secret, strategy, kind);
        expect(out === null || !String(out).includes(secret)).toBe(true);
      }
    }
    for (const kind of [
      'PATIENT_NAME',
      'PHONE',
      'DOCUMENT',
      'REASON',
      'PRICE',
    ] as const) {
      const out = applyFieldMask(secret, 'PARTIAL', kind);
      expect(out === null || !String(out).includes(secret)).toBe(true);
    }
  });
});

describe('support-field-mask · orden de visibilidad', () => {
  it('completo < PARTIAL < REDACT < HASH < NULLIFY', () => {
    expect(
      ['NULLIFY', 'FULL', 'REDACT', 'PARTIAL', 'HASH'].sort(
        (a, b) => maskRank(a as never) - maskRank(b as never),
      ),
    ).toEqual(['FULL', 'PARTIAL', 'REDACT', 'HASH', 'NULLIFY']);
  });

  it('mostRevealing elige el menos enmascarado; mostMasked, el más', () => {
    expect(mostRevealing(['REDACT', 'PARTIAL', 'NULLIFY'])).toBe('PARTIAL');
    expect(mostRevealing(['REDACT', 'FULL'])).toBe('FULL');
    expect(mostRevealing([])).toBe('NULLIFY');
    expect(mostMasked(['PARTIAL', 'FULL'])).toBe('PARTIAL');
    expect(mostMasked(['FULL', 'REDACT', 'PARTIAL'])).toBe('REDACT');
    expect(mostMasked([])).toBe('FULL');
  });
});
