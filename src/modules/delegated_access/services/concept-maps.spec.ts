import { DELEG } from '../delegated_access.concepts';
import { ACCESS_SCOPE_CONCEPT, ASSIGNMENT_ROLE_CONCEPT } from './concept-maps';

describe('concept-maps de asignaciones de organización', () => {
  it('ofrece todos los roles operativos de infraestructura (CONTRATO-F2-F5 §0.3)', () => {
    expect(ASSIGNMENT_ROLE_CONCEPT).toMatchObject({
      NURSE_SUPERVISOR: DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR,
      ADMISSION: DELEG.ASSIGN_ROLE_ADMISSION,
      HOUSEKEEPING: DELEG.ASSIGN_ROLE_HOUSEKEEPING,
      HOUSEKEEPING_SUPERVISOR: DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR,
      MAINTENANCE: DELEG.ASSIGN_ROLE_MAINTENANCE,
      OR_MANAGER: DELEG.ASSIGN_ROLE_OR_MANAGER,
      INFECTION_CONTROL: DELEG.ASSIGN_ROLE_INFECTION_CONTROL,
    });
  });

  it('cada rol declarado como ASSIGN_ROLE_* se puede asignar, salvo jefe de unidad (sin evaluador)', () => {
    const offered = new Set(Object.values(ASSIGNMENT_ROLE_CONCEPT));
    const declared = Object.entries(DELEG)
      .filter(([key]) => key.startsWith('ASSIGN_ROLE_'))
      .filter(([key]) => key !== 'ASSIGN_ROLE_UNIT_HEAD')
      .map(([, id]) => id);
    expect(declared.length).toBeGreaterThan(5);
    for (const id of declared) expect(offered.has(id)).toBe(true);
  });

  it('el alcance de espacio existe', () => {
    expect(ACCESS_SCOPE_CONCEPT.SPACE).toBe(DELEG.SCOPE_SPACE);
  });
});
