import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { OrganizationPracticeProvisioningService } from './organization-practice-provisioning.service';
import { PRAC } from '../practice.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT_ID = 'tenant-1';
const actor = { id: 'user-1', roles: ['USER'] } as any;
const DTO = {
  name: 'Centro Médico Norte',
  site: {
    name: 'Sede Norte',
    addressText: ' Av. San Martín 123 ',
    latitude: -17.78,
    longitude: -63.18,
    cityText: 'Santa Cruz de la Sierra',
  },
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
  };
  const tenantsRepo = {
    findById: mockFn().mockResolvedValue({
      id: TENANT_ID,
      verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
    }),
  };
  const practicesRepo = {
    findByTenantAndCode: mockFn().mockResolvedValue(null),
    create: mockFn().mockReturnValue({ id: 'pr-1' }),
  };
  const sitesRepo = {
    findByPracticeAndCode: mockFn().mockResolvedValue(null),
    create: mockFn().mockReturnValue({ id: 'site-1' }),
  };
  const addressesRepo = { create: mockFn().mockReturnValue({ id: 'addr-1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrganizationPracticeProvisioningService(
    em as any,
    tenantAdmin as any,
    tenantsRepo as any,
    practicesRepo as any,
    sitesRepo as any,
    addressesRepo as any,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    tenantAdmin,
    tenantsRepo,
    practicesRepo,
    sitesRepo,
    addressesRepo,
  };
}

describe('OrganizationPracticeProvisioningService', () => {
  it('crea práctica, dirección y sede en una sola transacción', async () => {
    const d = build();

    const res = await d.service.provision(TENANT_ID, DTO, actor);

    expect(res).toEqual({ practiceId: 'pr-1', practiceSiteId: 'site-1' });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.tenantAdmin.assertCanAdminister).toHaveBeenCalledWith(
      d.tx,
      TENANT_ID,
      actor,
    );
    expect(d.practicesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT_ID,
        code: 'CENTRO-MEDICO-NORTE',
        name: 'Centro Médico Norte',
        typeConceptId: PRAC.PRACTICE_TYPE_MEDICAL_CENTER,
        adminUserId: 'user-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      }),
    );
    expect(d.addressesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
        ownerId: TENANT_ID,
        lines: 'Av. San Martín 123',
        city: 'Santa Cruz de la Sierra',
        latitude: '-17.78',
        longitude: '-63.18',
      }),
    );
    expect(d.sitesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        practiceId: 'pr-1',
        code: 'SEDE-NORTE',
        name: 'Sede Norte',
        addressId: 'addr-1',
        managingTenantId: TENANT_ID,
        statusConceptId: PRAC.SITE_ACTIVE,
      }),
    );
  });

  it('administrador de otra organización → 403 y no escribe nada', async () => {
    const d = build();
    d.tenantAdmin.assertCanAdminister.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(d.service.provision(TENANT_ID, DTO, actor)).rejects.toThrow(
      ForbiddenException,
    );

    expect(d.tenantsRepo.findById).not.toHaveBeenCalled();
    expect(d.practicesRepo.create).not.toHaveBeenCalled();
  });

  it('organización inexistente → 404', async () => {
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue(null);

    await expect(d.service.provision(TENANT_ID, DTO, actor)).rejects.toThrow(
      ResourceNotFoundException,
    );
  });

  it.each([
    ['pendiente de verificación', 'DIR_UNVERIFIED'],
    ['sin verificar', undefined],
  ])('organización %s → 422', async (_caso, status) => {
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue({
      id: TENANT_ID,
      verificationStatusConceptId: status,
    });

    await expect(d.service.provision(TENANT_ID, DTO, actor)).rejects.toThrow(
      PreconditionFailedException,
    );

    expect(d.practicesRepo.create).not.toHaveBeenCalled();
  });

  it('segunda práctica con el mismo nombre → 409', async () => {
    const d = build();
    d.practicesRepo.findByTenantAndCode.mockResolvedValue({ id: 'pr-0' });

    await expect(d.service.provision(TENANT_ID, DTO, actor)).rejects.toThrow(
      ConflictException,
    );

    expect(d.practicesRepo.findByTenantAndCode).toHaveBeenCalledWith(
      d.tx,
      TENANT_ID,
      'CENTRO-MEDICO-NORTE',
    );
    expect(d.practicesRepo.create).not.toHaveBeenCalled();
  });

  it('si falla al crear la sede, el error sale de la transacción (rollback)', async () => {
    const d = build();
    d.sitesRepo.create.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(d.service.provision(TENANT_ID, DTO, actor)).rejects.toThrow(
      'boom',
    );

    // La práctica se había creado dentro de `transactional`: al propagarse el
    // error, MikroORM revierte la transacción entera.
    expect(d.practicesRepo.create).toHaveBeenCalled();
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
  });

  it('un código de sede ocupado se resuelve con sufijo', async () => {
    const d = build();
    d.sitesRepo.findByPracticeAndCode
      .mockResolvedValueOnce({ id: 'x' })
      .mockResolvedValue(null);

    await d.service.provision(TENANT_ID, DTO, actor);

    expect(d.sitesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ code: 'SEDE-NORTE-2' }),
    );
  });
});
