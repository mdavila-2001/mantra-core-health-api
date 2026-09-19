import { ACCT } from '../accounting.concepts';
import {
  JUEGO_REGLAS_VIGENTE,
  clasificar,
  type JuegoReglas,
} from './journal-classification';

describe('journal-classification (MCH-018)', () => {
  it('clasifica cuando una regla cubre el documento origen', () => {
    const res = clasificar({ sourceDocumentType: 'PAYMENT_TRANSACTION' });
    expect(res).toMatchObject({
      decision: 'CLASIFICADA',
      ruleId: 'PAYMENT_TRANSACTION',
      transactionTypeConceptId: ACCT.TXN_TYPE_LIABILITY_PAYMENT,
      rulesetVersion: JUEGO_REGLAS_VIGENTE.version,
    });
    expect(res.reason).not.toHaveLength(0);
  });

  it('AC01 · sin documento origen o sin regla no hay clasificación ni tipo', () => {
    for (const sourceDocumentType of [undefined, '', '   ', 'DESCONOCIDO']) {
      const res = clasificar({ sourceDocumentType });
      expect(res.decision).toBe('SIN_REGLA');
      expect(res.ruleId).toBeUndefined();
      expect(res.transactionTypeConceptId).toBeUndefined();
    }
  });

  it('AC02 · reglas en conflicto con la misma prioridad son ambiguas, no un desempate arbitrario', () => {
    const conflictivo: JuegoReglas = {
      version: 'test-conflicto',
      reglas: [
        {
          id: 'A',
          prioridad: 10,
          sourceDocumentType: 'MIXTO',
          transactionTypeConceptId: ACCT.TXN_TYPE_ACCRUAL,
          explicacion: 'A',
        },
        {
          id: 'B',
          prioridad: 10,
          sourceDocumentType: 'MIXTO',
          transactionTypeConceptId: ACCT.TXN_TYPE_CLEARING,
          explicacion: 'B',
        },
      ],
    };

    const res = clasificar({ sourceDocumentType: 'MIXTO' }, conflictivo);

    expect(res.decision).toBe('AMBIGUA');
    expect(res.transactionTypeConceptId).toBeUndefined();
    expect(res.reason).toContain('A');
    expect(res.reason).toContain('B');
  });

  it('una regla más específica gana por prioridad sin volverse ambigua', () => {
    const escalonado: JuegoReglas = {
      version: 'test-prioridad',
      reglas: [
        {
          id: 'ESPECIFICA',
          prioridad: 10,
          sourceDocumentType: 'FACTURA',
          transactionTypeConceptId: ACCT.TXN_TYPE_CLEARING,
          explicacion: 'específica',
        },
        {
          id: 'GENERICA',
          prioridad: 20,
          sourceDocumentType: 'FACTURA',
          transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
          explicacion: 'genérica',
        },
      ],
    };

    expect(
      clasificar({ sourceDocumentType: 'FACTURA' }, escalonado),
    ).toMatchObject({ decision: 'CLASIFICADA', ruleId: 'ESPECIFICA' });
  });

  it('AC03 · evaluar el juego histórico reproduce la clasificación anterior', () => {
    const v1: JuegoReglas = {
      version: 'test-v1',
      reglas: [
        {
          id: 'ORIGINAL',
          prioridad: 10,
          sourceDocumentType: 'DONACION',
          transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
          explicacion: 'original',
        },
      ],
    };
    const v2: JuegoReglas = {
      version: 'test-v2',
      reglas: [
        {
          ...v1.reglas[0],
          id: 'REVISADA',
          transactionTypeConceptId: ACCT.TXN_TYPE_ACCRUAL,
        },
      ],
    };

    const historica = clasificar({ sourceDocumentType: 'DONACION' }, v1);
    const actual = clasificar({ sourceDocumentType: 'DONACION' }, v2);

    expect(actual.transactionTypeConceptId).not.toBe(
      historica.transactionTypeConceptId,
    );
    // La decisión vieja se vuelve a obtener con su propia versión.
    expect(clasificar({ sourceDocumentType: 'DONACION' }, v1)).toEqual(
      historica,
    );
    expect(historica.rulesetVersion).toBe('test-v1');
  });

  it('no distingue mayúsculas ni espacios al alrededor', () => {
    expect(clasificar({ sourceDocumentType: '  invoice  ' }).ruleId).toBe(
      'INVOICE',
    );
  });
});
