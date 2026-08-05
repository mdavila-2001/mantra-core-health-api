import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamOrganizationSelfRegistrationService } from './iam-organization-self-registration.service';
import { TracingService } from '../../../observability';
import { CONCEPTS, ConflictException } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import type { RegisterOrganizationDto } from '../dto';

const dto: RegisterOrganizationDto = {
  organization: {
    code: 'CLINICA_SAN_RAFAEL',
    legalName: 'Clínica San Rafael S.A.',
    tradeName: 'Clínica San Rafael',
    tenantType: 'PROVIDER',
    countryConceptId: '00000000-0000-0000-0000-0000000000c1',
    jurisdictionConceptId: '00000000-0000-0000-0000-0000000000j1',
    timeZone: 'America/La_Paz',
  },
  owner: {
    email: 'admin@sanrafael.bo',
    password: 'password123',
    displayName: 'Ana Rojas',
  },
};

describe('IamOrganizationSelfRegistrationService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = { flush: fn().mockResolvedValue(undefined) };
    const em = {
      transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    const tokenService = {
      issueRefreshToken: fn(() => ({ raw: 'raw-token', hash: 'hashed' })),
    };
    const usersRepo = { create: fn(() => ({ id: 'user-1' })) };
    const credentialsRepo = {
      findLivePasswordBySubject: fn().mockResolvedValue(null),
      createPassword: fn(),
    };
    const rolesRepo = { create: fn() };
    const eventsRepo = { record: fn() };
    const emailVerificationsRepo = { create: fn() };
    const tenantsRepo = {
      findByCode: fn().mockResolvedValue(null),
      create: fn(() => ({
        id: 'tenant-1',
        code: dto.organization.code,
        statusConceptId: DIR.TENANT_PENDING,
      })),
    };
    const membershipsRepo = { create: fn(() => ({ id: 'membership-1' })) };
    const notificationsService = {
      createRequest: fn().mockResolvedValue({ id: 'notif-1' }),
    };
    const typeProfile = {
      assertProfileMatchesType: fn(),
      declaredConcepts: fn(() => ({})),
      assertConceptsExist: fn().mockResolvedValue(undefined),
      materializeProfile: fn(() => undefined),
    };

    const service = new IamOrganizationSelfRegistrationService(
      em as never,
      tokenService as never,
      usersRepo as never,
      credentialsRepo as never,
      rolesRepo as never,
      eventsRepo as never,
      emailVerificationsRepo as never,
      tenantsRepo as never,
      membershipsRepo as never,
      notificationsService as never,
      typeProfile as never,
      logger as never,
      new TracingService(),
    );
    return {
      service,
      tx,
      usersRepo,
      credentialsRepo,
      rolesRepo,
      emailVerificationsRepo,
      tenantsRepo,
      membershipsRepo,
      notificationsService,
      typeProfile,
    };
  }

  it('creates the organization and its owner account in one call', async () => {
    const d = build();

    const result = await d.service.registerOrganization(dto);

    expect(result).toMatchObject({
      tenantId: 'tenant-1',
      code: 'CLINICA_SAN_RAFAEL',
      ownerUserId: 'user-1',
      membershipId: 'membership-1',
      emailVerificationSent: true,
    });
  });

  it('leaves the organization PENDING and UNVERIFIED: nobody self-verifies', async () => {
    const d = build();

    await d.service.registerOrganization(dto);

    // Verificar una organización es un acto de la plataforma, que es quien
    // contrasta licencia y personería. Si esto se relajara, cualquiera podría
    // aparecer como prestador verificado rellenando un formulario.
    expect(d.tenantsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
      }),
    );
  });

  it('defaults the organization type to PROVIDER and honours PAYER / BROKER', async () => {
    const provider = build();
    await provider.service.registerOrganization(dto);
    expect(provider.tenantsRepo.create).toHaveBeenCalledWith(
      provider.tx,
      expect.objectContaining({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PROVIDER,
      }),
    );

    const payer = build();
    await payer.service.registerOrganization({
      ...dto,
      organization: { ...dto.organization, tenantType: 'PAYER' },
    });
    expect(payer.tenantsRepo.create).toHaveBeenCalledWith(
      payer.tx,
      expect.objectContaining({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PAYER,
      }),
    );

    const broker = build();
    await broker.service.registerOrganization({
      ...dto,
      organization: { ...dto.organization, tenantType: 'BROKER' },
    });
    expect(broker.tenantsRepo.create).toHaveBeenCalledWith(
      broker.tx,
      expect.objectContaining({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_BROKER,
      }),
    );
  });

  it('makes the owner an OWNER member with the directory active status', async () => {
    const d = build();

    await d.service.registerOrganization(dto);

    // El status DEBE ser el de directory: es el que `loadActiveTenantIds` mira
    // para poblar el claim `tenants` del JWT. Con otro concepto, el owner
    // recibiría 403 "no pertenece a ningún tenant" en todo request posterior y
    // la organización nacería inutilizable.
    expect(d.membershipsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1',
        tenantRoleConceptId: DIR.ROLE_OWNER,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
      }),
    );
  });

  it('grants only the USER global role: platform roles are not self-service', async () => {
    const d = build();

    await d.service.registerOrganization(dto);

    expect(d.rolesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ roleConceptId: CONCEPTS.ROLE_USER }),
    );
    expect(d.usersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ statusConceptId: CONCEPTS.USER_ACTIVE }),
    );
  });

  it('logs the owner in by email: the credential subject is the email', async () => {
    const d = build();

    await d.service.registerOrganization(dto);

    expect(d.credentialsRepo.createPassword).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ externalSubject: dto.owner.email }),
    );
  });

  it('rejects a duplicate organization code with 409 before writing anything', async () => {
    const d = build();
    d.tenantsRepo.findByCode.mockResolvedValue({ id: 'existing' });

    await expect(d.service.registerOrganization(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(d.usersRepo.create).not.toHaveBeenCalled();
    expect(d.tenantsRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an owner email that already has a live credential', async () => {
    const d = build();
    d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue({
      id: 'cred-1',
    });

    await expect(d.service.registerOrganization(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(d.tenantsRepo.create).not.toHaveBeenCalled();
  });

  it('keeps the organization when the verification email cannot be queued', async () => {
    const d = build();
    d.notificationsService.createRequest.mockRejectedValue(
      new Error('messaging down'),
    );

    const result = await d.service.registerOrganization(dto);

    // El correo se encola fuera de la transacción justamente para esto: una
    // mensajería caída no puede deshacer un alta que ya es válida.
    expect(result.tenantId).toBe('tenant-1');
    expect(result.emailVerificationSent).toBe(false);
  });
});
