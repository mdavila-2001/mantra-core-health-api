import {
  GOVERNANCE,
  governanceConceptCode,
  governanceShortName,
} from './delegated_access.governance-concepts';

describe('conceptos del gobierno de accesos', () => {
  it('la derivación reproduce el id que el DDL fija como pendiente de una tarea de revisión', () => {
    // `access_review_items.decision_concept_id DEFAULT '55a6db07-…'` (parche v4.2.78).
    expect(GOVERNANCE.REVIEW_ITEM_PENDING).toBe(
      '55a6db07-19e7-5bb4-978a-3d246492f49d',
    );
  });

  it('el código completo lleva el prefijo del módulo', () => {
    expect(governanceConceptCode('FOUR_EYES_PENDING')).toBe(
      'delegated_access:FOUR_EYES_PENDING',
    );
  });

  it('cada concepto tiene su propio id', () => {
    const ids = Object.values(GOVERNANCE);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el nombre corto quita el prefijo y el vocabulario, pero no el de las anomalías', () => {
    expect(governanceShortName('delegated_access:FOUR_EYES_KIND_ACTION')).toBe(
      'ACTION',
    );
    expect(governanceShortName('delegated_access:FOUR_EYES_PENDING')).toBe(
      'PENDING',
    );
    expect(
      governanceShortName('delegated_access:REVIEWER_KIND_DOCTOR_OWNER'),
    ).toBe('DOCTOR_OWNER');
    expect(governanceShortName('delegated_access:ANOMALY_CANCEL_SPIKE')).toBe(
      'ANOMALY_CANCEL_SPIKE',
    );
  });
});
