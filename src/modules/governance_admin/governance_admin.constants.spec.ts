import {
  DSAR_STATUSES,
  DSAR_STATUS_CONCEPT,
  DSAR_TRANSITIONS,
  GOV,
  ISSUE_STATUS_CONCEPT,
  SEVERITY_CONCEPT,
  codeOfConcept,
} from './governance_admin.constants';

describe('governance_admin.constants', () => {
  it('cada estado de incidencia y de severidad tiene un concepto distinto', () => {
    expect(new Set(Object.values(ISSUE_STATUS_CONCEPT)).size).toBe(3);
    expect(new Set(Object.values(SEVERITY_CONCEPT)).size).toBe(4);
    expect(ISSUE_STATUS_CONCEPT.RESOLVED).toBe(GOV.ISSUE_RESOLVED);
  });

  it('codeOfConcept no adivina lo que no conoce', () => {
    expect(codeOfConcept(ISSUE_STATUS_CONCEPT, GOV.ISSUE_DISMISSED)).toBe('DISMISSED');
    expect(codeOfConcept(ISSUE_STATUS_CONCEPT, 'otro')).toBeNull();
  });

  it('un estado terminal de la solicitud no admite transiciones', () => {
    expect(DSAR_TRANSITIONS.COMPLETED).toEqual([]);
    expect(DSAR_TRANSITIONS.REJECTED).toEqual([]);
    expect(DSAR_STATUSES.every((s) => DSAR_STATUS_CONCEPT[s])).toBe(true);
  });

  it('desde RECEIVED nunca se vuelve a RECEIVED', () => {
    for (const to of Object.values(DSAR_TRANSITIONS).flat()) {
      expect(to).not.toBe('RECEIVED');
    }
  });
});
