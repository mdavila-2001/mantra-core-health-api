import { PRAC } from '../practice.concepts';
import {
  practiceAccessScope,
  practiceAccessScopeFor,
} from './practice-access.service';
import {
  buildPracticeAccess,
  type AssignmentRow,
} from './practice-access.testing';

const DOCTOR = {
  id: 'user-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-doc',
} as any;

/** Actor con esos roles, todos globales (sin `scopedRoles`). */
const withRoles = (...roles: string[]) => ({ id: 'u', roles }) as any;

describe('practiceAccessScope', () => {
  it('SECURITY_ADMIN y ACCOUNTING_APPROVER ven todo, aunque además sean PRACTITIONER', () => {
    expect(practiceAccessScope(withRoles('SECURITY_ADMIN'), 'tenant-a')).toBe(
      'ALL',
    );
    expect(
      practiceAccessScope(
        withRoles('ACCOUNTING_APPROVER', 'PRACTITIONER'),
        undefined,
      ),
    ).toBe('ALL');
  });

  it('quien no es PRACTITIONER no se filtra', () => {
    expect(
      practiceAccessScope(withRoles('SURGERY_SCHEDULER'), 'tenant-a'),
    ).toBe('UNSCOPED');
  });

  it('un PRACTITIONER queda acotado a sus vinculaciones ACTIVE', () => {
    expect(
      practiceAccessScope(withRoles('PRACTITIONER', 'CLINICIAN'), 'tenant-a'),
    ).toBe('ACTIVE_ASSIGNMENTS');
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

    await expect(
      access.allowedPracticeIds(DOCTOR, 'tenant-a'),
    ).resolves.toEqual(new Set(['prac-active']));
    await expect(
      access.canAccess(DOCTOR, 'prac-active', 'tenant-a'),
    ).resolves.toBe(true);
    await expect(
      access.canAccess(DOCTOR, 'prac-pending', 'tenant-a'),
    ).resolves.toBe(false);
    await expect(
      access.canAccess(DOCTOR, 'prac-ended', 'tenant-a'),
    ).resolves.toBe(false);
  });

  it('el médico recién registrado, sin vinculación, no ve ninguna', async () => {
    const access = buildPracticeAccess(rows);
    const newcomer = { ...DOCTOR, practitionerProfileId: 'hp-new' };

    await expect(
      access.allowedPracticeIds(newcomer, 'tenant-a'),
    ).resolves.toEqual(new Set());
  });

  it('un PRACTITIONER sin perfil en el token no ve ninguna (no «todas»)', async () => {
    const access = buildPracticeAccess(rows);
    const noProfile = { id: 'user-x', roles: ['PRACTITIONER'] } as any;

    await expect(
      access.allowedPracticeIds(noProfile, 'tenant-a'),
    ).resolves.toEqual(new Set());
  });

  it('el administrador no se filtra', async () => {
    const access = buildPracticeAccess(rows);
    const admin = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;

    await expect(
      access.allowedPracticeIds(admin, 'tenant-a'),
    ).resolves.toBeNull();
    await expect(
      access.canAccess(admin, 'cualquiera', 'tenant-a'),
    ).resolves.toBe(true);
  });
});

/**
 * Rol administrativo acotado a un tenant (`scopedRoles`, MCH-001): figura en
 * `roles`, pero sólo ve todas las prácticas de su tenant; fuera de él queda
 * con el alcance de sus otros roles (#1241).
 */
describe('practiceAccessScope · administración acotada a un tenant', () => {
  const scopedTo = (role: string, ...others: string[]) =>
    ({
      id: 'admin-a',
      roles: [role, ...others],
      scopedRoles: { 'tenant-a': [role] },
      practitionerProfileId: 'hp-doc',
    }) as any;
  const ROLES = ['SECURITY_ADMIN', 'ACCOUNTING_APPROVER'];

  it.each(ROLES)(
    '%s acotado a A no ve todo en B ni sin tenant; en A sí',
    (role) => {
      const doctorAdmin = scopedTo(role, 'PRACTITIONER');
      expect(practiceAccessScope(doctorAdmin, 'tenant-b')).toBe(
        'ACTIVE_ASSIGNMENTS',
      );
      expect(practiceAccessScope(doctorAdmin, undefined)).toBe(
        'ACTIVE_ASSIGNMENTS',
      );
      expect(practiceAccessScope(doctorAdmin, 'tenant-a')).toBe('ALL');
      // Sin otro rol que lo filtre, fuera de A es uno más: no se le abre nada.
      expect(practiceAccessScope(scopedTo(role), 'tenant-b')).toBe('UNSCOPED');
    },
  );

  it.each(ROLES)(
    '%s global ve todo en cualquier tenant y sin tenant',
    (role) => {
      const global = withRoles(role, 'PRACTITIONER');
      expect(practiceAccessScope(global, 'tenant-b')).toBe('ALL');
      expect(practiceAccessScope(global, undefined)).toBe('ALL');
    },
  );

  it('practiceAccessScopeFor mide en el tenant de la práctica y sólo lo lee si hace falta', async () => {
    const lookup = {
      findTenantOfPractice: async (id: string) =>
        ({ 'pr-a': 'tenant-a', 'pr-b': 'tenant-b' })[id] ?? null,
    };
    const doctorAdmin = scopedTo('SECURITY_ADMIN', 'PRACTITIONER');
    await expect(
      practiceAccessScopeFor(doctorAdmin, 'pr-b', lookup),
    ).resolves.toBe('ACTIVE_ASSIGNMENTS');
    await expect(
      practiceAccessScopeFor(doctorAdmin, 'no-existe', lookup),
    ).resolves.toBe('ACTIVE_ASSIGNMENTS');
    await expect(
      practiceAccessScopeFor(doctorAdmin, 'pr-a', lookup),
    ).resolves.toBe('ALL');

    const untouched = {
      findTenantOfPractice: () => {
        throw new Error('no debía consultar el tenant');
      },
    };
    await expect(
      practiceAccessScopeFor(
        withRoles('SECURITY_ADMIN', 'PRACTITIONER'),
        'pr-b',
        untouched as never,
      ),
    ).resolves.toBe('ALL');
    await expect(
      practiceAccessScopeFor(DOCTOR, 'pr-b', untouched as never),
    ).resolves.toBe('ACTIVE_ASSIGNMENTS');
  });

  it('PracticeAccessService filtra al acotado fuera de su tenant y no dentro', async () => {
    const access = buildPracticeAccess([
      {
        practitionerProfileId: 'hp-doc',
        practiceId: 'prac-linked',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: null,
      },
    ]);
    const doctorAdmin = scopedTo('SECURITY_ADMIN', 'PRACTITIONER');

    await expect(
      access.allowedPracticeIds(doctorAdmin, 'tenant-b'),
    ).resolves.toEqual(new Set(['prac-linked']));
    await expect(
      access.canAccess(doctorAdmin, 'prac-de-b', 'tenant-b'),
    ).resolves.toBe(false);
    await expect(
      access.allowedPracticeIds(doctorAdmin, 'tenant-a'),
    ).resolves.toBeNull();
    await expect(
      access.canAccess(doctorAdmin, 'prac-de-a', 'tenant-a'),
    ).resolves.toBe(true);
    await expect(
      access.canAccess(
        withRoles('SECURITY_ADMIN', 'PRACTITIONER'),
        'prac-de-b',
        'tenant-b',
      ),
    ).resolves.toBe(true);
  });
});
