import { describe, it, expect, jest } from '@jest/globals';
import { TenantCatalogService } from './tenant-catalog.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };
const TENANT = 'tenant-1';

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = {
    transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as any;
  const tenantCatalogRepo = {
    findPolicyForUpdate: jest.fn(),
    createPolicy: jest.fn(),
    findConfig: jest.fn(),
    findDefaultsForUpdate: jest.fn(() => Promise.resolve([])),
    createConfig: jest.fn(),
  } as any;
  const valueSetsRepo = { findById: jest.fn() } as any;
  const conceptsRepo = { findById: jest.fn() } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new TenantCatalogService(
    em,
    tenantCatalogRepo,
    valueSetsRepo,
    conceptsRepo,
    logger,
  );
  return {
    service,
    tx,
    tenantCatalogRepo,
    valueSetsRepo,
    conceptsRepo,
    logger,
  };
}

describe('TenantCatalogService', () => {
  const dto = { valueSetId: 'vs-1' };

  it('crea la política con modo INHERIT por defecto', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo } = build();
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
    tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });

    const result = await service.upsertPolicy(TENANT, dto, actor);

    expect(tenantCatalogRepo.createPolicy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: TENANT,
        valueSetId: 'vs-1',
        modeConceptId: CONCEPTS.TENANT_CATALOG_INHERIT,
        allowSubset: false,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'p-1',
        updated: false,
        conceptsCreated: 0,
        conceptsUpdated: 0,
      }),
    );
  });

  it('actualiza la política existente en vez de crear otra', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo } = build();
    const existing = {
      id: 'p-1',
      modeConceptId: undefined,
      updatedAt: new Date(0),
    } as any;
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(existing);

    const result = await service.upsertPolicy(
      TENANT,
      { ...dto, mode: 'SUBSET', allowSubset: true },
      actor,
    );

    expect(tenantCatalogRepo.createPolicy).not.toHaveBeenCalled();
    expect(existing.modeConceptId).toBe(CONCEPTS.TENANT_CATALOG_SUBSET);
    expect(existing.allowSubset).toBe(true);
    expect(result.updated).toBe(true);
  });

  it('crea y actualiza configuraciones de concepto en el mismo PUT', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo, conceptsRepo } = build();
    const existingConfig = {
      conceptId: 'c-2',
      enabled: false,
      updatedAt: new Date(0),
    } as any;
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
    tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });
    conceptsRepo.findById.mockResolvedValue({ id: 'c' });
    tenantCatalogRepo.findConfig
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingConfig);

    const result = await service.upsertPolicy(
      TENANT,
      {
        ...dto,
        concepts: [{ conceptId: 'c-1' }, { conceptId: 'c-2', enabled: true }],
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({ conceptsCreated: 1, conceptsUpdated: 1 }),
    );
    expect(existingConfig.enabled).toBe(true);
  });

  it('degrada el valor por omisión anterior del tenant', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo, conceptsRepo } = build();
    const previous = {
      conceptId: 'c-9',
      isDefault: true,
      updatedAt: new Date(0),
    };
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
    tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });
    tenantCatalogRepo.findDefaultsForUpdate.mockResolvedValue([previous]);
    tenantCatalogRepo.findConfig.mockResolvedValue(null);
    conceptsRepo.findById.mockResolvedValue({ id: 'c-1' });

    await service.upsertPolicy(
      TENANT,
      { ...dto, concepts: [{ conceptId: 'c-1', isDefault: true }] },
      actor,
    );

    expect(previous.isDefault).toBe(false);
  });

  it('rechaza más de un valor por omisión (PreconditionFailed)', async () => {
    const { service } = build();

    await expect(
      service.upsertPolicy(
        TENANT,
        {
          ...dto,
          concepts: [
            { conceptId: 'c-1', isDefault: true },
            { conceptId: 'c-2', isDefault: true },
          ],
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un alias si la política no permite renombrar (PreconditionFailed)', async () => {
    const { service } = build();

    await expect(
      service.upsertPolicy(
        TENANT,
        { ...dto, concepts: [{ conceptId: 'c-1', aliasDisplay: 'Otro' }] },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('admite el alias cuando allowAlias está activo', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo, conceptsRepo } = build();
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
    tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });
    tenantCatalogRepo.findConfig.mockResolvedValue(null);
    conceptsRepo.findById.mockResolvedValue({ id: 'c-1' });

    await service.upsertPolicy(
      TENANT,
      {
        ...dto,
        allowAlias: true,
        concepts: [{ conceptId: 'c-1', aliasDisplay: 'Otro' }],
      },
      actor,
    );

    expect(tenantCatalogRepo.createConfig).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ aliasDisplay: 'Otro' }),
    );
  });

  it('lanza NotFound si el conjunto de valores no existe', async () => {
    const { service, valueSetsRepo } = build();
    valueSetsRepo.findById.mockResolvedValue(null);

    await expect(
      service.upsertPolicy(TENANT, dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('lanza NotFound si un concepto configurado no existe', async () => {
    const { service, tenantCatalogRepo, valueSetsRepo, conceptsRepo } = build();
    valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
    tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
    tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });
    conceptsRepo.findById.mockResolvedValue(null);

    await expect(
      service.upsertPolicy(
        TENANT,
        { ...dto, concepts: [{ conceptId: 'c-x' }] },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
