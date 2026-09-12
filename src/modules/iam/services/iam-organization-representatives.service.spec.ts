import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { IamOrganizationRepresentativesService } from './iam-organization-representatives.service';

function build() {
  const orden: string[] = [];
  let contadorPersona = 0;
  const personsRepo = {
    create: fn((_tx: unknown, data: { displayName: string }) => {
      orden.push(`persons.create:${data.displayName}`);
      contadorPersona += 1;
      return { id: `person-${contadorPersona}`, ...data };
    }),
  };
  const identifiersRepo = {
    create: fn((_tx: unknown, data: unknown) => ({
      id: 'identifier-1',
      ...(data as Record<string, unknown>),
    })),
  };
  const contactPointsRepo = { create: fn() };
  const representatives = {
    attachRegistrationRepresentatives: fn(async () => {
      orden.push('attachRegistrationRepresentatives');
      return { legalRepresentativeId: 'rep-1', count: 1 };
    }),
  };
  const tx = {
    flush: fn(async () => {
      orden.push('flush');
    }),
  };

  const service = new IamOrganizationRepresentativesService(
    personsRepo as never,
    identifiersRepo as never,
    contactPointsRepo as never,
    representatives as never,
  );
  return {
    service,
    personsRepo,
    identifiersRepo,
    contactPointsRepo,
    representatives,
    tx: tx as never,
    orden,
  };
}

describe('IamOrganizationRepresentativesService', () => {
  it('sin representante ni gerencias, no crea ninguna persona ni delega', async () => {
    const d = build();

    const resultado = await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalDocumentFileIds: [],
    });

    expect(resultado).toEqual({ representativesRegistered: 0 });
    expect(d.personsRepo.create).not.toHaveBeenCalled();
    expect(
      d.representatives.attachRegistrationRepresentatives,
    ).not.toHaveBeenCalled();
  });

  it('con representante legal: crea su persona con el CI y el correo, y lo delega con su fileId', async () => {
    const d = build();

    const resultado = await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: 'SRL',
      legalDocumentFileIds: ['file-constitution'],
      legalRepresentative: {
        fullName: 'Mariana Siles Justiniano',
        idNumber: '4872190 SC',
        email: 'legal@aseguradora.com',
        powerOfAttorneyFileId: 'file-poder',
      },
    });

    expect(d.personsRepo.create).toHaveBeenCalledTimes(1);
    const llamada =
      d.representatives.attachRegistrationRepresentatives.mock.calls[0];
    expect(llamada[1]).toMatchObject({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: 'SRL',
      alreadyDeclaredFileIds: ['file-constitution'],
      legalRepresentative: {
        personId: 'person-1',
        ciIdentifierId: 'identifier-1',
        powerOfAttorneyFileId: 'file-poder',
      },
      executives: undefined,
    });
    expect(resultado).toEqual({ representativesRegistered: 1 });
  });

  it('sin CI declarado, el representante viaja con ciIdentifierId undefined', async () => {
    const d = build();

    await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalDocumentFileIds: [],
      legalRepresentative: {
        fullName: 'Mariana Siles',
        idNumber: '',
        email: 'legal@aseguradora.com',
        powerOfAttorneyFileId: 'file-poder',
      } as never,
    });

    expect(d.identifiersRepo.create).not.toHaveBeenCalled();
    const llamada =
      d.representatives.attachRegistrationRepresentatives.mock.calls[0];
    expect(
      (llamada[1] as { legalRepresentative?: { ciIdentifierId?: string } })
        .legalRepresentative?.ciIdentifierId,
    ).toBeUndefined();
  });

  it('con las tres gerencias: crea una persona por cada una, en orden general→comercial→marketing', async () => {
    const d = build();

    const resultado = await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalDocumentFileIds: [],
      executives: {
        generalManager: {
          fullName: 'Carlos Mendoza',
          phone: '+591 70000001',
          email: 'gm@aseguradora.com',
        },
        commercialManager: {
          fullName: 'Ana Paz',
          phone: '+591 70000002',
          email: 'cm@aseguradora.com',
        },
        marketingManager: {
          fullName: 'Luis Rojas',
          phone: '+591 70000003',
          email: 'mm@aseguradora.com',
        },
      },
    });

    expect(d.orden.slice(0, 3)).toEqual([
      'persons.create:Carlos Mendoza',
      'persons.create:Ana Paz',
      'persons.create:Luis Rojas',
    ]);
    const llamada =
      d.representatives.attachRegistrationRepresentatives.mock.calls[0];
    expect((llamada[1] as { executives?: unknown }).executives).toEqual([
      { role: 'GENERAL_MANAGER', personId: 'person-1' },
      { role: 'COMMERCIAL_MANAGER', personId: 'person-2' },
      { role: 'MARKETING_MANAGER', personId: 'person-3' },
    ]);
    expect(resultado).toEqual({ representativesRegistered: 1 });
  });

  it('el celular del gerente se pasa como `mobile`, no como `phone`', async () => {
    const d = build();

    await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalDocumentFileIds: [],
      executives: {
        generalManager: {
          fullName: 'Carlos Mendoza',
          phone: '+591 70000001',
          email: 'gm@aseguradora.com',
        },
        commercialManager: {
          fullName: 'Ana Paz',
          phone: '+591 70000002',
          email: 'cm@aseguradora.com',
        },
        marketingManager: {
          fullName: 'Luis Rojas',
          phone: '+591 70000003',
          email: 'mm@aseguradora.com',
        },
      },
    });

    expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ value: '+591 70000001' }),
    );
  });

  it('flushea UNA sola vez, después de crear todas las personas y antes de delegar en TenantLegalRepresentativesService', async () => {
    const d = build();

    await d.service.register(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalDocumentFileIds: [],
      legalRepresentative: {
        fullName: 'Mariana Siles',
        idNumber: '4872190 SC',
        email: 'legal@aseguradora.com',
        powerOfAttorneyFileId: 'file-poder',
      },
      executives: {
        generalManager: {
          fullName: 'Carlos Mendoza',
          phone: '+591 70000001',
          email: 'gm@aseguradora.com',
        },
        commercialManager: {
          fullName: 'Ana Paz',
          phone: '+591 70000002',
          email: 'cm@aseguradora.com',
        },
        marketingManager: {
          fullName: 'Luis Rojas',
          phone: '+591 70000003',
          email: 'mm@aseguradora.com',
        },
      },
    });

    expect(d.orden).toEqual([
      'persons.create:Mariana Siles',
      'persons.create:Carlos Mendoza',
      'persons.create:Ana Paz',
      'persons.create:Luis Rojas',
      'flush',
      'attachRegistrationRepresentatives',
    ]);
  });
});
