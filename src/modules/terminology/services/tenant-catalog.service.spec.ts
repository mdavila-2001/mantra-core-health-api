import { describe, it, expect, jest } from '@jest/globals';
import { TenantCatalogService } from './tenant-catalog.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
  type AuthenticatedUser,
} from '../../../common';
import { TerminologyErrorReason } from '../terminology.error-reasons';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };
const TENANT = 'tenant-1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
  // El tenant activo sale del contexto de la petición: estas pruebas actúan
  // como un administrador de TENANT en su propio contexto.
  const upsertPolicy = service.upsertPolicy.bind(service);
  service.upsertPolicy = ((...args: Parameters<typeof upsertPolicy>) =>
    runWithTenant(TENANT, () =>
      upsertPolicy(...args),
    )) as typeof service.upsertPolicy;
  return {
    service,
    em,
    tx,
    tenantCatalogRepo,
    valueSetsRepo,
    conceptsRepo,
    logger,
    /** Misma operación con otro tenant activo, sin el atajo anterior. */
    upsertAs: (
      activeTenantId: string,
      ...args: Parameters<typeof upsertPolicy>
    ) => runWithTenant(activeTenantId, () => upsertPolicy(...args)),
    /** Misma operación sin tenant activo. */
    upsertWithoutTenant: (...args: Parameters<typeof upsertPolicy>) =>
      upsertPolicy(...args),
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

  describe('alcance de tenant (TERM-01)', () => {
    const dtoWithConcept = {
      valueSetId: 'vs-1',
      concepts: [{ conceptId: 'c-1', enabled: false, isDefault: true }],
    };

    it('Correcto: el administrador escribe la política de su propio tenant', async () => {
      const d = build();
      d.valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
      d.tenantCatalogRepo.findPolicyForUpdate.mockResolvedValue(null);
      d.tenantCatalogRepo.createPolicy.mockReturnValue({ id: 'p-1' });
      d.conceptsRepo.findById.mockResolvedValue({ id: 'c-1' });
      d.tenantCatalogRepo.findConfig.mockResolvedValue(null);

      const result = await d.upsertAs(TENANT, TENANT, dtoWithConcept, actor);

      expect(result).toMatchObject({ id: 'p-1', tenantId: TENANT });
      expect(d.tenantCatalogRepo.createConfig).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenantId: TENANT, conceptId: 'c-1' }),
      );
    });

    it('Error: la política de otro tenant responde 404 y no lee ni escribe nada', async () => {
      const d = build();

      const error = await d
        .upsertAs(TENANT, 'tenant-2', dtoWithConcept, actor)
        .catch((e: ResourceNotFoundException) => e);

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect((error as ResourceNotFoundException).getStatus()).toBe(404);
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.valueSetsRepo.findById).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.findPolicyForUpdate).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.findDefaultsForUpdate).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.findConfig).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.createPolicy).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.createConfig).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('Falla catalogada: 404 con TERMINOLOGY_TENANT_NOT_AVAILABLE, mismo cuerpo para ajeno e inexistente y sin details', async () => {
      const d = build();

      const failure = async (routeTenant: string) => {
        try {
          await d.upsertAs(TENANT, routeTenant, dtoWithConcept, actor);
        } catch (error) {
          return error as ResourceNotFoundException;
        }
        throw new Error('debía rechazar');
      };
      const ajeno = await failure('tenant-2');
      const inexistente = await failure('00000000-0000-4000-8000-00000000dead');

      expect(ajeno.reason).toBe(TerminologyErrorReason.TENANT_NOT_AVAILABLE);
      expect(ajeno.details).toBeUndefined();
      expect(ajeno.getResponse()).toEqual(inexistente.getResponse());
    });

    it('sin tenant activo falla cerrado (412) y no escribe', async () => {
      const d = build();

      const error = await d
        .upsertWithoutTenant(TENANT, dtoWithConcept, actor)
        .catch((e: PreconditionFailedException) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.tenantCatalogRepo.createPolicy).not.toHaveBeenCalled();
    });
  });
});
