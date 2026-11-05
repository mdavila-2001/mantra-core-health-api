import { PRAC } from '../practice.concepts';
import {
  ROLE_ASSIGNMENT_STATUS_CODES,
  toRoleAssignmentRow,
  type RoleAssignmentRowContext,
} from './role-assignment-row.mapper';

const PRACTITIONER = 'pro-1';
const DOCTOR_USER = 'user-doctor';
const ADMIN_USER = 'user-admin';

const CONTRACT_KEYS = [
  'id',
  'practitionerProfileId',
  'practitionerName',
  'practiceId',
  'practiceSiteId',
  'healthcareServiceId',
  'serviceConceptId',
  'serviceDisplay',
  'statusConceptId',
  'statusCode',
  'initiatedBy',
].sort();

const context: RoleAssignmentRowContext = {
  practitionerNames: new Map([[PRACTITIONER, 'Dra. Ana Rojas']]),
  practitionerUserIds: new Map([[PRACTITIONER, new Set([DOCTOR_USER])]]),
  serviceConceptIds: new Map([['hs-1', 'proc-endoscopia']]),
  conceptDisplays: new Map([['proc-endoscopia', 'Endoscopía alta']]),
};

/**
 * Vinculación mínima con los campos que el mapper lee.
 *
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns La vinculación de prueba.
 */
function role(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'r1',
    practitionerProfileId: PRACTITIONER,
    practiceId: 'pr1',
    practiceSiteId: 's1',
    healthcareServiceId: 'hs-1',
    statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
    createdByUserId: DOCTOR_USER,
    ...overrides,
  };
}

describe('toRoleAssignmentRow', () => {
  it('devuelve exactamente las 11 claves de RoleAssignmentRow y ninguna `status`', () => {
    const row = toRoleAssignmentRow(role(), context);

    expect(Object.keys(row).sort()).toEqual(CONTRACT_KEYS);
    expect(row).not.toHaveProperty('status');
  });

  it('trae el procedimiento del servicio, su nombre y el nombre del profesional', () => {
    const row = toRoleAssignmentRow(role(), context);

    expect(row).toMatchObject({
      healthcareServiceId: 'hs-1',
      serviceConceptId: 'proc-endoscopia',
      serviceDisplay: 'Endoscopía alta',
      practitionerName: 'Dra. Ana Rojas',
    });
  });

  it('sin servicio, serviceConceptId y serviceDisplay son null', () => {
    const row = toRoleAssignmentRow(
      role({ healthcareServiceId: undefined }),
      context,
    );

    expect(row.healthcareServiceId).toBeNull();
    expect(row.serviceConceptId).toBeNull();
    expect(row.serviceDisplay).toBeNull();
  });

  it('cada concepto ROLE_ASG_* sale con su uuid y su código', () => {
    const expected: Record<string, string> = {
      [PRAC.ROLE_ASSIGNMENT_ACTIVE]: 'ROLE_ASG_ACTIVE',
      [PRAC.ROLE_ASSIGNMENT_PENDING]: 'ROLE_ASG_PENDING',
      [PRAC.ROLE_ASSIGNMENT_REJECTED]: 'ROLE_ASG_REJECTED',
      [PRAC.ROLE_ASSIGNMENT_SUSPENDED]: 'ROLE_ASG_SUSPENDED',
      [PRAC.ROLE_ASSIGNMENT_ENDED]: 'ROLE_ASG_ENDED',
      [PRAC.ROLE_ASSIGNMENT_INVITED]: 'ROLE_ASG_INVITED',
    };

    for (const [uuid, code] of Object.entries(expected)) {
      const row = toRoleAssignmentRow(role({ statusConceptId: uuid }), context);
      expect(row.statusConceptId).toBe(uuid);
      expect(row.statusCode).toBe(code);
    }
    expect(ROLE_ASSIGNMENT_STATUS_CODES.size).toBe(6);
  });

  it('initiatedBy es PRACTITIONER si la fila la creó la cuenta del profesional', () => {
    const row = toRoleAssignmentRow(
      role({ createdByUserId: DOCTOR_USER }),
      context,
    );

    expect(row.initiatedBy).toBe('PRACTITIONER');
  });

  it('initiatedBy es PRACTICE si la creó otra cuenta o no se sabe quién', () => {
    expect(
      toRoleAssignmentRow(role({ createdByUserId: ADMIN_USER }), context)
        .initiatedBy,
    ).toBe('PRACTICE');
    expect(
      toRoleAssignmentRow(role({ createdByUserId: undefined }), context)
        .initiatedBy,
    ).toBe('PRACTICE');
  });

  it('un profesional sin nombre cargado no deja el campo vacío', () => {
    const row = toRoleAssignmentRow(role(), {
      ...context,
      practitionerNames: new Map(),
    });

    expect(row.practitionerName).toBe('(profesional sin nombre)');
  });
});
