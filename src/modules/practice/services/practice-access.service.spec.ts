import { PRAC } from '../practice.concepts';
import { practiceAccessScope } from './practice-access.service';
import {
  buildPracticeAccess,
  type AssignmentRow,
} from './practice-access.testing';

const DOCTOR = {
  id: 'user-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-doc',
} as any;

describe('practiceAccessScope', () => {
  it('SECURITY_ADMIN y ACCOUNTING_APPROVER ven todo, aunque además sean PRACTITIONER', () => {
    expect(practiceAccessScope(['SECURITY_ADMIN'])).toBe('ALL');
    expect(practiceAccessScope(['ACCOUNTING_APPROVER', 'PRACTITIONER'])).toBe(
      'ALL',
    );
  });

  it('quien no es PRACTITIONER no se filtra', () => {
    expect(practiceAccessScope(['SURGERY_SCHEDULER'])).toBe('UNSCOPED');
  });

  it('un PRACTITIONER queda acotado a sus vinculaciones ACTIVE', () => {
    expect(practiceAccessScope(['PRACTITIONER', 'CLINICIAN'])).toBe(
      'ACTIVE_ASSIGNMENTS',
    );
  });
});

describe('PracticeAccessService', () => {
  const rows: AssignmentRow[] = [
    {
      practitionerProfileId: 'hp-doc',
      practiceId: 'prac-active',
      statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      validTo: null,
    },
    {
      practitionerProfileId: 'hp-doc',
      practiceId: 'prac-pending',
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
      validTo: null,
    },
    {
      practitionerProfileId: 'hp-doc',
      practiceId: 'prac-ended',
      statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      validTo: new Date('2026-01-01'),
    },
  ];

  it('el médico sólo puede ver las prácticas con vinculación ACTIVE vigente', async () => {
    const access = buildPracticeAccess(rows);

    await expect(access.allowedPracticeIds(DOCTOR)).resolves.toEqual(
      new Set(['prac-active']),
    );
    await expect(access.canAccess(DOCTOR, 'prac-active')).resolves.toBe(true);
    await expect(access.canAccess(DOCTOR, 'prac-pending')).resolves.toBe(false);
    await expect(access.canAccess(DOCTOR, 'prac-ended')).resolves.toBe(false);
  });

  it('el médico recién registrado, sin vinculación, no ve ninguna', async () => {
    const access = buildPracticeAccess(rows);
    const newcomer = { ...DOCTOR, practitionerProfileId: 'hp-new' };

    await expect(access.allowedPracticeIds(newcomer)).resolves.toEqual(
      new Set(),
    );
  });

  it('un PRACTITIONER sin perfil en el token no ve ninguna (no «todas»)', async () => {
    const access = buildPracticeAccess(rows);
    const noProfile = { id: 'user-x', roles: ['PRACTITIONER'] } as any;

    await expect(access.allowedPracticeIds(noProfile)).resolves.toEqual(
      new Set(),
    );
  });

  it('el administrador no se filtra', async () => {
    const access = buildPracticeAccess(rows);
    const admin = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;

    await expect(access.allowedPracticeIds(admin)).resolves.toBeNull();
    await expect(access.canAccess(admin, 'cualquiera')).resolves.toBe(true);
  });
});
