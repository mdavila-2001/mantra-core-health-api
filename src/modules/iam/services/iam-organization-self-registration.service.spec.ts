import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamOrganizationSelfRegistrationService } from './iam-organization-self-registration.service';
import { TracingService } from '../../../observability';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
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
    name: 'Ana',
    lastName: 'Rojas',
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
      materializeProfile: fn().mockResolvedValue(undefined),
    };
    const affiliationDocuments = {
      attachRegistrationDocuments: fn().mockResolvedValue([
        'doc-1',
        'doc-2',
        'doc-3',
        'doc-4',
        'doc-5',
      ]),
    };
    // Subtarea 1.4: por defecto el alta no declara representante ni gerencias.
    const representatives = {
      register: fn(async () => ({ representativesRegistered: 4 })),
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
      affiliationDocuments as never,
      representatives as never,
      logger as never,
      new TracingService(),
    );
    return {
      service,
      tx,
      usersRepo,
      credentialsRepo,
      rolesRepo,
      eventsRepo,
      emailVerificationsRepo,
      tenantsRepo,
      membershipsRepo,
      notificationsService,
      typeProfile,
      affiliationDocuments,
      representatives,
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

  describe('DIAGNOSTIC_CENTER (subtarea 1.5)', () => {
    it('devuelve diagnosticUnitId cuando el tipo es DIAGNOSTIC_CENTER', async () => {
      const d = build();
      d.typeProfile.materializeProfile.mockResolvedValueOnce(
        'diagnostic-unit-1',
      );

      const result = await d.service.registerOrganization({
        ...dto,
        organization: {
          ...dto.organization,
          tenantType: 'DIAGNOSTIC_CENTER',
          diagnosticUnit: { modalityConceptIds: [] },
        },
      });

      expect(result).toMatchObject({
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        membershipId: 'membership-1',
        diagnosticUnitId: 'diagnostic-unit-1',
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          detailJson: expect.objectContaining({
            flow: 'organization-self-registration',
          }),
        }),
      );
    });

    it('no lleva diagnosticUnitId cuando el tipo no es DIAGNOSTIC_CENTER', async () => {
      const d = build();
      // Aunque el doble de materializeProfile devolviera algo (no debería para
      // PROVIDER), la respuesta no lo expone: el campo es propio del tipo.
      d.typeProfile.materializeProfile.mockResolvedValueOnce('carrier-1');

      const result = await d.service.registerOrganization(dto);

      expect(result.diagnosticUnitId).toBeUndefined();
    });

    it('rechaza con PreconditionFailedException sin crear nada, si el perfil no coincide con el tipo', async () => {
      const d = build();
      d.typeProfile.assertProfileMatchesType.mockImplementation(() => {
        throw new PreconditionFailedException(
          'El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo DIAGNOSTIC_CENTER',
        );
      });

      await expect(d.service.registerOrganization(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );

      // La validación se adelantó a ANTES de crear la cuenta: un tipo mal
      // formado no debe dejar ni el usuario ni el tenant a medio hacer.
      expect(d.usersRepo.create).not.toHaveBeenCalled();
      expect(d.tenantsRepo.create).not.toHaveBeenCalled();
    });
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

  it('composes the owner account name from its parts', async () => {
    const d = build();

    await d.service.registerOrganization(dto);

    expect(d.usersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ displayName: 'Ana Rojas' }),
    );
  });

  it('keeps honouring displayName for clients that still send it', async () => {
    const d = build();

    await d.service.registerOrganization({
      ...dto,
      owner: {
        email: dto.owner.email,
        password: dto.owner.password,
        displayName: 'Dra. Ana Rojas',
      },
    });

    // Quien mandó la forma anterior tiene que ver exactamente lo que mandó.
    expect(d.usersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ displayName: 'Dra. Ana Rojas' }),
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

  describe('legalEntityType (subtarea 1.1)', () => {
    it('resuelve el concepto del tipo societario elegido', async () => {
      const d = build();

      await d.service.registerOrganization({
        ...dto,
        organization: { ...dto.organization, legalEntityType: 'SRL' },
      });

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_SRL,
        }),
      );
    });

    it('sin el campo, cae a la forma legada COMPANY', async () => {
      const d = build();

      await d.service.registerOrganization(dto);

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_COMPANY,
        }),
      );
    });

    it('deriva el país de constitución cuando el tipo lo declara y el cliente no manda país', async () => {
      const d = build();

      await d.service.registerOrganization({
        ...dto,
        organization: {
          ...dto.organization,
          legalEntityType: 'US_LLC',
          countryConceptId: undefined,
        },
      });

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_US_LLC,
          countryConceptId: CONCEPTS.COUNTRY_US,
        }),
      );
    });

    it('no pisa el país declarado explícitamente por el cliente', async () => {
      const d = build();

      await d.service.registerOrganization({
        ...dto,
        organization: {
          ...dto.organization,
          legalEntityType: 'US_LLC',
          countryConceptId: 'country-explicito',
        },
      });

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ countryConceptId: 'country-explicito' }),
      );
    });
  });

  describe('documentos legales de afiliación (subtarea 1.2)', () => {
    const legalDocuments = {
      constitutionFileId: 'file-constitution',
      taxIdentifierFileId: 'file-tax',
      commerceRegistryFileId: 'file-commerce',
      operatingLicenseFileId: 'file-license',
      healthAuthorityCertificateFileId: 'file-sedes',
    };

    it('los vincula dentro de la misma transacción cuando el alta los declara', async () => {
      const d = build();

      const result = await d.service.registerOrganization({
        ...dto,
        organization: {
          ...dto.organization,
          tenantType: 'PAYER',
          payer: {
            carrierCode: 'CARRIER_1',
            sigla: 'CX',
            address: 'Av. Siempre Viva 123',
            regulatorIdentifier: 'NIT-12345',
          },
          legalDocuments,
        },
      });

      expect(
        d.affiliationDocuments.attachRegistrationDocuments,
      ).toHaveBeenCalledWith(d.tx, {
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        legalEntityType: undefined,
        taxIdentifier: 'NIT-12345',
        documents: {
          CONSTITUTION_DOC: 'file-constitution',
          TAX_IDENTIFIER_DOC: 'file-tax',
          COMMERCE_REGISTRY_DOC: 'file-commerce',
          OPERATING_LICENSE_DOC: 'file-license',
          HEALTH_AUTHORITY_CERT_DOC: 'file-sedes',
        },
      });
      expect(result.legalDocumentsRegistered).toBe(5);
    });

    it('no los toca si el alta no declara el bloque', async () => {
      const d = build();

      const result = await d.service.registerOrganization(dto);

      expect(
        d.affiliationDocuments.attachRegistrationDocuments,
      ).not.toHaveBeenCalled();
      expect(result.legalDocumentsRegistered).toBeUndefined();
    });

    it('un rechazo 422 al vincularlos revienta toda el alta', async () => {
      const d = build();
      d.affiliationDocuments.attachRegistrationDocuments.mockRejectedValueOnce(
        new PreconditionFailedException(
          'El documento el NIT ya está vinculado a una organización',
        ),
      );

      await expect(
        d.service.registerOrganization({
          ...dto,
          organization: {
            ...dto.organization,
            tenantType: 'PAYER',
            payer: {
              carrierCode: 'CARRIER_1',
              sigla: 'CX',
              address: 'Av. Siempre Viva 123',
              regulatorIdentifier: 'NIT-12345',
            },
            legalDocuments,
          },
        }),
      ).rejects.toThrow(PreconditionFailedException);

      // Nada de correo: la transacción entera se descarta con el rechazo.
      expect(d.emailVerificationsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('documentos exigidos por el tipo societario (CL-43)', () => {
    const sinConstitucion = {
      taxIdentifierFileId: 'file-tax',
      commerceRegistryFileId: 'file-commerce',
      operatingLicenseFileId: 'file-license',
      healthAuthorityCertificateFileId: 'file-sedes',
    };
    const representante = {
      firstName: 'Ana',
      lastName: 'Rojas',
      idNumber: '4821993',
      email: 'legal@lab.example.test',
    };

    it('una UNIPERSONAL sin constitución ni poder se registra y ve los cuatro documentos', async () => {
      const d = build();

      await d.service.registerOrganization({
        ...dto,
        organization: {
          ...dto.organization,
          legalEntityType: 'UNIPERSONAL',
          legalDocuments: sinConstitucion,
          legalRepresentative: representante,
        },
      } as never);

      expect(
        d.affiliationDocuments.attachRegistrationDocuments,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          documents: {
            CONSTITUTION_DOC: undefined,
            TAX_IDENTIFIER_DOC: 'file-tax',
            COMMERCE_REGISTRY_DOC: 'file-commerce',
            OPERATING_LICENSE_DOC: 'file-license',
            HEALTH_AUTHORITY_CERT_DOC: 'file-sedes',
          },
        }),
      );
      expect(d.representatives.register).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          legalDocumentFileIds: [
            'file-tax',
            'file-commerce',
            'file-license',
            'file-sedes',
          ],
        }),
      );
    });

    it('una SRL sin constitución responde 422 y no crea ninguna cuenta', async () => {
      const d = build();

      await expect(
        d.service.registerOrganization({
          ...dto,
          organization: {
            ...dto.organization,
            legalEntityType: 'SRL',
            legalDocuments: sinConstitucion,
          },
        } as never),
      ).rejects.toThrow(PreconditionFailedException);

      expect(d.usersRepo.create).not.toHaveBeenCalled();
      expect(d.tenantsRepo.create).not.toHaveBeenCalled();
      expect(
        d.affiliationDocuments.attachRegistrationDocuments,
      ).not.toHaveBeenCalled();
    });

    it('una SRL con representante pero sin poder responde 422 antes de escribir', async () => {
      const d = build();

      await expect(
        d.service.registerOrganization({
          ...dto,
          organization: {
            ...dto.organization,
            legalEntityType: 'SRL',
            legalDocuments: {
              ...sinConstitucion,
              constitutionFileId: 'file-constitution',
            },
            legalRepresentative: representante,
          },
        } as never),
      ).rejects.toThrow(PreconditionFailedException);

      expect(d.usersRepo.create).not.toHaveBeenCalled();
    });

    it('la aseguradora sin tipo societario sigue exigiendo la constitución', async () => {
      const d = build();

      await expect(
        d.service.registerOrganization({
          ...dto,
          organization: {
            ...dto.organization,
            tenantType: 'PAYER',
            legalDocuments: sinConstitucion,
          },
        } as never),
      ).rejects.toThrow(PreconditionFailedException);
    });
  });
});
