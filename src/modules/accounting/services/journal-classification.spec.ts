import { ACCT } from '../accounting.concepts';
import {
  CURRENT_RULE_SET,
  classify,
  type RuleSet,
} from './journal-classification';

describe('journal-classification (MCH-018)', () => {
  it('clasifica cuando una regla cubre el documento origen', () => {
    const res = classify({ sourceDocumentType: 'PAYMENT_TRANSACTION' });
    expect(res).toMatchObject({
      decision: 'CLASIFICADA',
      ruleId: 'PAYMENT_TRANSACTION',
      transactionTypeConceptId: ACCT.TXN_TYPE_LIABILITY_PAYMENT,
      rulesetVersion: CURRENT_RULE_SET.version,
    });
    expect(res.reason).not.toHaveLength(0);
  });

  it('AC01 · sin documento origen o sin regla no hay clasificación ni tipo', () => {
    for (const sourceDocumentType of [undefined, '', '   ', 'DESCONOCIDO']) {
      const res = classify({ sourceDocumentType });
      expect(res.decision).toBe('SIN_REGLA');
      expect(res.ruleId).toBeUndefined();
      expect(res.transactionTypeConceptId).toBeUndefined();
    }
  });

  it('AC02 · reglas en conflicto con la misma prioridad son ambiguas, no un desempate arbitrario', () => {
    const conflicting: RuleSet = {
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

    const res = classify({ sourceDocumentType: 'MIXTO' }, conflicting);

    expect(res.decision).toBe('AMBIGUA');
    expect(res.transactionTypeConceptId).toBeUndefined();
    expect(res.reason).toContain('A');
    expect(res.reason).toContain('B');
  });

  it('una regla más específica gana por prioridad sin volverse ambigua', () => {
    const staggered: RuleSet = {
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
      classify({ sourceDocumentType: 'FACTURA' }, staggered),
    ).toMatchObject({ decision: 'CLASIFICADA', ruleId: 'ESPECIFICA' });
  });

  it('AC03 · evaluar el juego histórico reproduce la clasificación anterior', () => {
    const v1: RuleSet = {
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
    const v2: RuleSet = {
      version: 'test-v2',
      reglas: [
        {
          ...v1.reglas[0],
          id: 'REVISADA',
          transactionTypeConceptId: ACCT.TXN_TYPE_ACCRUAL,
        },
      ],
    };

    const historical = classify({ sourceDocumentType: 'DONACION' }, v1);
    const actual = classify({ sourceDocumentType: 'DONACION' }, v2);

    expect(actual.transactionTypeConceptId).not.toBe(
      historical.transactionTypeConceptId,
    );
    // La decisión vieja se vuelve a obtener con su propia versión.
    expect(classify({ sourceDocumentType: 'DONACION' }, v1)).toEqual(
      historical,
    );
    expect(historical.rulesetVersion).toBe('test-v1');
  });

  it('no distingue mayúsculas ni espacios al alrededor', () => {
    expect(classify({ sourceDocumentType: '  invoice  ' }).ruleId).toBe(
      'INVOICE',
    );
  });
});
