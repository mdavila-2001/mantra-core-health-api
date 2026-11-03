import { jest } from '@jest/globals';
import { IamSupportStaffSelfRegistrationService } from './iam-support-staff-self-registration.service';
import { CONCEPTS, ConflictException, SEED } from '../../../../common';
import { PROF } from '../../../profiles/profiles.concepts';
import { PRAC } from '../../../practice/practice.concepts';
import { DIR } from '../../../directory/directory.concepts';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';
import type { RegisterSupportStaffDto } from '../../presentation/dto';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const dto: RegisterSupportStaffDto = {
  nationalId: '7654321',
  issuerAdministrativeAreaConceptId: 'area-sc',
  password: 'password123',
  name: 'Rosa',
  lastName: 'Vaca',
  email: 'rosa@example.test',
  birthDate: '1992-03-04',
  phone: '+591 70000000',
};

function build() {
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    execute: fn().mockResolvedValue(undefined),
  };
  const em = { transactional: fn((cb: (t: unknown) => unknown) => cb(tx)) };
  const tokenService = {
    issueRefreshToken: fn(() => ({ raw: 'raw', hash: 'hash' })),
  };
  const usersRepo = { create: fn(() => ({ id: 'user-1' })) };
  const credentialsRepo = {
    lockSubjectForRegistration: fn().mockResolvedValue(undefined),
    findLivePasswordBySubject: fn().mockResolvedValue(null),
    createPassword: fn(),
  };
  const rolesRepo = { create: fn() };
  const eventsRepo = { record: fn() };
  const emailVerificationsRepo = { create: fn() };
  const profiles = {
    assertIsAdministrativeArea: fn().mockResolvedValue(undefined),
    createPerson: fn(() => ({ id: 'person-1' })),
    createPersonProfile: fn(),
    createSecretaryProfile: fn(() => ({ profileId: 'person-1' })),
    createAccountLink: fn(),
    createPatientProfile: fn(),
  };
  const commonRecords = { createIdentifier: fn(), createContactPoint: fn() };
  const emailNotice = { enqueueEmail: fn().mockResolvedValue(undefined) };
  const directory = { createTenantMembership: fn(() => ({ id: 'm-1' })) };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new IamSupportStaffSelfRegistrationService(
    em as any,
    tokenService as any,
    usersRepo as any,
    credentialsRepo as any,
    rolesRepo as any,
    eventsRepo as any,
    emailVerificationsRepo as any,
    profiles as any,
    commonRecords as any,
    emailNotice as any,
    directory as any,
    logger as any,
  );
  return {
    service,
    credentialsRepo,
    rolesRepo,
    profiles,
    commonRecords,
    directory,
    emailNotice,
  };
}

describe('IamSupportStaffSelfRegistrationService', () => {
  it('crea la cuenta con USER y SUPPORT_STAFF, sin PATIENT', async () => {
    const d = build();
    const result = await d.service.register(dto, '1.2.3.4');

    expect(result).toEqual({
      userId: 'user-1',
      personId: 'person-1',
      supportProfileId: 'person-1',
      role: 'SUPPORT_STAFF',
      emailVerificationSent: true,
    });
    const roles = d.rolesRepo.create.mock.calls.map(
      (call: any[]) => call[1].roleConceptId,
    );
    expect(roles).toEqual([
      ROLE_CONCEPT_BY_CODE.USER,
      ROLE_CONCEPT_BY_CODE.SUPPORT_STAFF,
    ]);
    expect(roles).not.toContain(ROLE_CONCEPT_BY_CODE.PATIENT);
  });

  it('crea el perfil de secretaria sobre la persona, no un perfil de paciente', async () => {
    const d = build();
    await d.service.register(dto);

    expect(d.profiles.createPersonProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        personId: 'person-1',
        profileTypeConceptId: PROF.PROFILE_TYPE_SECRETARY,
      }),
    );
    expect(d.profiles.createSecretaryProfile).toHaveBeenCalledWith(
      expect.anything(),
      {
        profileId: 'person-1',
        roleConceptId: PRAC.SUPPORT_ROLE_SECRETARY,
        actorUserId: 'user-1',
      },
    );
    expect(d.profiles.createPatientProfile).not.toHaveBeenCalled();
    expect(d.commonRecords.createIdentifier).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
        value: dto.nationalId,
      }),
    );
  });

  it('la membresía del tenant por defecto lleva el rol acotado de apoyo', async () => {
    const d = build();
    await d.service.register(dto);

    expect(d.directory.createTenantMembership).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_SUPPORT,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      }),
    );
  });

  it('rechaza un documento que ya tiene cuenta, sin crear nada', async () => {
    const d = build();
    d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue({ id: 'c' });

    await expect(d.service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(d.rolesRepo.create).not.toHaveBeenCalled();
  });

  it('si el correo no sale, la cuenta queda creada igual', async () => {
    const d = build();
    d.emailNotice.enqueueEmail.mockRejectedValue(new Error('smtp'));

    await expect(d.service.register(dto)).resolves.toMatchObject({
      emailVerificationSent: false,
    });
  });
});
