import { isRoleAssignmentCurrent } from './role-assignment-validity';

const NOW = new Date('2026-10-30T12:00:00Z');

describe('isRoleAssignmentCurrent (B7: un doctor dado de baja ya no es doctor de la organización)', () => {
  it('una asignación activa sin fechas rige', () => {
    expect(isRoleAssignmentCurrent({ active: true }, NOW)).toBe(true);
  });

  it('una asignación que no está activa no rige', () => {
    expect(isRoleAssignmentCurrent({ active: false }, NOW)).toBe(false);
  });

  it('una asignación vencida (valid_to pasado) no rige', () => {
    expect(
      isRoleAssignmentCurrent(
        { active: true, validTo: new Date('2026-10-01') },
        NOW,
      ),
    ).toBe(false);
  });

  it('el último día de vigencia todavía rige', () => {
    expect(
      isRoleAssignmentCurrent(
        { active: true, validTo: new Date('2026-10-30') },
        NOW,
      ),
    ).toBe(true);
  });

  it('una asignación que empieza mañana todavía no rige', () => {
    expect(
      isRoleAssignmentCurrent(
        { active: true, validFrom: new Date('2026-10-31') },
        NOW,
      ),
    ).toBe(false);
  });

  it('acepta las fechas como texto YYYY-MM-DD (columnas date)', () => {
    expect(
      isRoleAssignmentCurrent({ active: true, validTo: '2026-09-30' }, NOW),
    ).toBe(false);
    expect(
      isRoleAssignmentCurrent(
        { active: true, validFrom: '2026-01-01', validTo: '2027-01-01' },
        NOW,
      ),
    ).toBe(true);
  });
});
