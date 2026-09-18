import { CONCEPTS } from '../../../common';
import { decidirCallback, referenciaEvento } from './payment-callback-machine';

describe('payment-callback-machine (MCH-011)', () => {
  it('aplica el avance legítimo del ciclo de vida', () => {
    expect(
      decidirCallback(CONCEPTS.TXN_PROCESSING, CONCEPTS.TXN_AUTHORIZED),
    ).toBe('aplicar');
    expect(
      decidirCallback(CONCEPTS.TXN_PROCESSING, CONCEPTS.TXN_CAPTURED),
    ).toBe('aplicar');
    expect(
      decidirCallback(CONCEPTS.TXN_AUTHORIZED, CONCEPTS.TXN_CAPTURED),
    ).toBe('aplicar');
    expect(decidirCallback(CONCEPTS.TXN_AUTHORIZED, CONCEPTS.TXN_FAILED)).toBe(
      'aplicar',
    );
  });

  it('reconoce la reentrega del mismo hecho', () => {
    expect(decidirCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_CAPTURED)).toBe(
      'duplicado',
    );
    expect(decidirCallback(CONCEPTS.TXN_FAILED, CONCEPTS.TXN_FAILED)).toBe(
      'duplicado',
    );
  });

  it('trata como obsoleta la entrega atrasada de un hecho ya superado', () => {
    expect(
      decidirCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_AUTHORIZED),
    ).toBe('obsoleto');
    expect(decidirCallback(CONCEPTS.TXN_SETTLED, CONCEPTS.TXN_CAPTURED)).toBe(
      'obsoleto',
    );
  });

  it('marca como contradicción el choque con una rama terminal', () => {
    expect(decidirCallback(CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_FAILED)).toBe(
      'contradiccion',
    );
    expect(decidirCallback(CONCEPTS.TXN_FAILED, CONCEPTS.TXN_CAPTURED)).toBe(
      'contradiccion',
    );
    expect(decidirCallback(CONCEPTS.TXN_VOIDED, CONCEPTS.TXN_CAPTURED)).toBe(
      'contradiccion',
    );
  });

  it('la referencia del evento es estable por contenido', () => {
    const base = { gatewayTransactionRef: 'ref-1', outcome: 'CAPTURED' };
    expect(referenciaEvento(base)).toBe(referenciaEvento({ ...base }));
    expect(referenciaEvento(base)).not.toBe(
      referenciaEvento({ ...base, outcome: 'AUTHORIZED' }),
    );
    expect(referenciaEvento(base)).not.toBe(
      referenciaEvento({ ...base, authorizationCode: 'A1' }),
    );
  });
});
