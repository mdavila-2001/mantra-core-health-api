import {
  patientCoverageReferenceDate,
  patientCoverageValidity,
} from './patient-coverage-validity';

describe('patient coverage civil dates', () => {
  it('changes the reference day at midnight in La Paz', () => {
    expect(patientCoverageReferenceDate(new Date('2026-09-14T03:59:59Z'))).toBe(
      '2026-09-13',
    );
    expect(patientCoverageReferenceDate(new Date('2026-09-14T04:00:00Z'))).toBe(
      '2026-09-14',
    );
  });
  it.each([
    ['2026-09-12', 'UPCOMING'],
    ['2026-09-13', 'CURRENT'],
    ['2026-09-14', 'EXPIRED'],
  ])('treats both civil bounds as inclusive (%s)', (reference, expected) => {
    expect(
      patientCoverageValidity(reference, [
        {
          statusConceptId: 'ACTIVE',
          activeConceptId: 'ACTIVE',
          effectiveFrom: '2026-09-13',
          effectiveTo: '2026-09-13',
        },
      ]),
    ).toBe(expected);
  });
  it('does not call an inactive plan or unknown dates current', () => {
    expect(
      patientCoverageValidity('2026-09-13', [
        { activeConceptId: 'ACTIVE', statusConceptId: 'CLOSED' },
      ]),
    ).toBe('INACTIVE');
    expect(
      patientCoverageValidity('2026-09-13', [
        { activeConceptId: 'ACTIVE', statusConceptId: 'ACTIVE' },
      ]),
    ).toBe('UNKNOWN');
  });
  it('intersects the coverage, plan and benefit dates', () => {
    const active = { statusConceptId: 'ACTIVE', activeConceptId: 'ACTIVE' };
    expect(
      patientCoverageValidity('2026-09-13', [
        { ...active, effectiveFrom: '2026-01-01' },
        { ...active, effectiveTo: '2026-12-31' },
        { ...active, effectiveFrom: '2026-10-01' },
      ]),
    ).toBe('UPCOMING');
  });
});
