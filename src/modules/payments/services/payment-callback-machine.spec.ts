import { CONCEPTS } from '../../../common';
import { decideCallback, eventReference } from './payment-callback-machine';

describe('payment-callback-machine (MCH-011)', () => {
  it('aplica el avance legítimo del ciclo de vida', () => {
    expect(
      decideCallback(CONCEPTS.TXN_PROCESSING, CONCEPTS.TXN_AUTHORIZED),
    ).toBe('aplicar');
    expect(decideCallback(CONCEPTS.TXN_PROCESSING, CONCEPTS.TXN_CAPTURED)).toBe(
      'aplicar',
    );
    expect(decideCallback(CONCEPTS.TXN_AUTHORIZED, CONCEPTS.TXN_CAPTURED)).toBe(
      'aplicar',
    );
    expect(decideCallback(CONCEPTS.TXN_AUTHORIZED, CONCEPTS.TXN_FAILED)).toBe(
      'aplicar',
    );
  });

  it('reconoce la reentrega del mismo hecho', () => {
    expect(decideCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_CAPTURED)).toBe(
      'duplicado',
    );
    expect(decideCallback(CONCEPTS.TXN_FAILED, CONCEPTS.TXN_FAILED)).toBe(
      'duplicado',
    );
  });

  it('trata como obsoleta la entrega atrasada de un hecho ya superado', () => {
    expect(decideCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_AUTHORIZED)).toBe(
      'obsoleto',
    );
    expect(decideCallback(CONCEPTS.TXN_SETTLED, CONCEPTS.TXN_CAPTURED)).toBe(
      'obsoleto',
    );
  });

  it('marca como contradicción el choque con una rama terminal', () => {
    expect(decideCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_FAILED)).toBe(
      'contradiccion',
    );
    expect(decideCallback(CONCEPTS.TXN_FAILED, CONCEPTS.TXN_CAPTURED)).toBe(
      'contradiccion',
    );
    expect(decideCallback(CONCEPTS.TXN_VOIDED, CONCEPTS.TXN_CAPTURED)).toBe(
      'contradiccion',
    );
  });

  it('la referencia del evento es estable por contenido', () => {
    const base = { gatewayTransactionRef: 'ref-1', outcome: 'CAPTURED' };
    expect(eventReference(base)).toBe(eventReference({ ...base }));
    expect(eventReference(base)).not.toBe(
      eventReference({ ...base, outcome: 'AUTHORIZED' }),
    );
    expect(eventReference(base)).not.toBe(
      eventReference({ ...base, authorizationCode: 'A1' }),
    );
  });
});
