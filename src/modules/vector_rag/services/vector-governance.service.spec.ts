import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { VectorErrorReason } from '../vector_rag.error-reasons';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { VectorGovernanceService } from './vector-governance.service';

const actor = { id: 'user-1', roles: ['AI_GOVERNANCE_OFFICER'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const MODEL_ID = '22222222-2222-2222-2222-222222222222';
const COLLECTION_ID = '33333333-3333-3333-3333-333333333333';
const POLICY_ID = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    findModelVersion: mockFn(async () => null),
    findModelVersionById: mockFn(async () => null),
    findModelVersionForUpdate: mockFn(async () => model()),
    createModelVersion: mockFn((_tx: any, data: any) => ({
      id: MODEL_ID,
      ...data,
    })),
    findCollectionByCode: mockFn(async () => null),
    findCollectionById: mockFn(async () => null),
    findCollectionForUpdate: mockFn(async () => null),
    findCollectionsByModel: mockFn(async () => []),
    createCollection: mockFn((_tx: any, data: any) => ({
      id: COLLECTION_ID,
      ...data,
    })),
    findBindingByNamespace: mockFn(async () => null),
    findBindingsByCollectionForUpdate: mockFn(async () => []),
    createBinding: mockFn((_tx: any, data: any) => ({
      id: 'binding-1',
      ...data,
    })),
    findPolicyById: mockFn(async () => null),
    findPolicyByCodeForUpdate: mockFn(async () => null),
    createPolicy: mockFn((_tx: any, data: any) => ({ id: POLICY_ID, ...data })),
    findActiveJobsByCollection: mockFn(async () => []),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new VectorGovernanceService(
    em as any,
    catalogRepo as any,
    outbox as any,
    logger as any,
  );
  // Las operaciones exigen el tenant activo: estas pruebas actúan dentro de
  // TENANT_ID. `raw` conserva la operación sin contexto para probar otro tenant.
  const raw = service;
  const scoped = Object.create(raw) as typeof service;
  for (const name of [
    'createCollection',
    'defineRagPolicy',
    'publishRagPolicy',
    'updateCollectionLifecycle',
  ] as const) {
    (scoped as any)[name] = (...args: unknown[]) =>
      runWithTenant(TENANT_ID, () => (raw as any)[name](...args));
  }

  return { service: scoped, raw, em, tx, catalogRepo, outbox, logger };
}

/**
 * Ejecuta la operación model.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de model.
 */
function model(overrides: any = {}) {
  return {
    id: MODEL_ID,
    providerCode: 'openai',
    modelId: 'text-embedding-3',
    modelVersion: '1',
    dimension: 1536,
    distanceMetric: 'cosine',
    approvedForPhi: true,
    retiredAt: undefined,
    ...overrides,
  };
}

describe('VectorGovernanceService', () => {
  describe('registerModelVersion (UC-59-01)', () => {
    const DTO = {
      providerCode: 'openai',
      modelId: 'text-embedding-3',
      modelVersion: '1',
      dimension: 1536,
      distanceMetric: 'cosine',
      tokenizerVersion: 'cl100k',
      approvedForPhi: true,
    } as any;

    it('registra el modelo con su aprobación', async () => {
      const d = build();

      const result = await d.service.registerModelVersion(DTO, actor);

      expect(result.approvedForPhi).toBe(true);
      expect(
        d.catalogRepo.createModelVersion.mock.calls[0][1].approvedAt,
      ).toBeInstanceOf(Date);
    });

    it('rechaza una versión ya registrada', async () => {
      const d = build();
      d.catalogRepo.findModelVersion.mockResolvedValue({ id: 'otra' });

      await expect(d.service.registerModelVersion(DTO, actor)).rejects.toThrow(
        /ya está registrada/,
      );
    });
  });

  describe('createCollection (UC-59-02)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      code: 'notas-clinicas',
      name: 'Notas clínicas',
      embeddingModelVersionId: MODEL_ID,
      namespace: 'tenant-1/notas',
    } as any;

    it('toma dimensión y métrica del modelo, no de la petición', async () => {
      const d = build();

      const result = await d.service.createCollection(
        { ...DTO, dimension: 99, distanceMetric: 'l2' },
        actor,
      );

      expect(result.dimension).toBe(1536);
      expect(result.distanceMetric).toBe('cosine');
    });

    it('crea el vínculo del tenant junto con la colección', async () => {
      const d = build();

      const result = await d.service.createCollection(DTO, actor);

      expect(result.bindingId).toBe('binding-1');
      expect(d.catalogRepo.createBinding.mock.calls[0][1].state).toBe('active');
    });

    it('rechaza crear sobre un modelo retirado', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(
        model({ retiredAt: new Date() }),
      );

      await expect(d.service.createCollection(DTO, actor)).rejects.toThrow(
        /está retirado/,
      );
    });

    it('rechaza PHI sobre un modelo no aprobado para PHI', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(
        model({ approvedForPhi: false }),
      );

      await expect(
        d.service.createCollection({ ...DTO, containsPhi: true }, actor),
      ).rejects.toThrow(/no está aprobado para datos de paciente/);
    });

    it('acepta una colección sin PHI sobre un modelo no aprobado para PHI', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(
        model({ approvedForPhi: false }),
      );

      await expect(
        d.service.createCollection(DTO, actor),
      ).resolves.toBeDefined();
    });

    it('rechaza un namespace ya usado', async () => {
      const d = build();
      d.catalogRepo.findBindingByNamespace.mockResolvedValue({ id: 'otro' });

      await expect(d.service.createCollection(DTO, actor)).rejects.toThrow(
        /namespace ya está/,
      );
    });

    it('rechaza un código repetido en el tenant', async () => {
      const d = build();
      d.catalogRepo.findCollectionByCode.mockResolvedValue({ id: 'otra' });

      await expect(d.service.createCollection(DTO, actor)).rejects.toThrow(
        /Ya existe una colección/,
      );
    });
  });

  describe('defineRagPolicy (UC-59-03)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      code: 'clinica-estricta',
      allowedPrincipalTypes: ['user'],
      allowedPurposeCodes: ['TREATMENT'],
      allowedSecurityLabels: ['NORMAL'],
    } as any;

    it('nace en borrador', async () => {
      const d = build();

      const result = await d.service.defineRagPolicy(DTO, actor);

      expect(result.state).toBe('draft');
    });

    it('rechaza exigir consentimiento sin exigir ámbito de paciente', async () => {
      const d = build();

      await expect(
        d.service.defineRagPolicy({ ...DTO, consentRequired: true }, actor),
      ).rejects.toThrow(/ámbito de paciente/);
    });

    it('acepta consentimiento con ámbito de paciente', async () => {
      const d = build();

      await expect(
        d.service.defineRagPolicy(
          { ...DTO, consentRequired: true, patientScopeRequired: true },
          actor,
        ),
      ).resolves.toBeDefined();
    });

    it('rechaza un código repetido', async () => {
      const d = build();
      d.catalogRepo.findPolicyByCodeForUpdate.mockResolvedValue({ id: 'otra' });

      await expect(d.service.defineRagPolicy(DTO, actor)).rejects.toThrow(
        /Ya existe una política/,
      );
    });
  });

  describe('publishRagPolicy (UC-59-03)', () => {
    it('publica y reenlaza las colecciones indicadas', async () => {
      const d = build();
      const policy = {
        id: POLICY_ID,
        code: 'p',
        tenantId: TENANT_ID,
        state: 'draft',
      };
      d.catalogRepo.findPolicyById.mockResolvedValue(policy);
      const collection = {
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        accessPolicyId: undefined,
      };
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(collection);

      const result = await d.service.publishRagPolicy(
        POLICY_ID,
        { rebindCollectionIds: [COLLECTION_ID] },
        actor,
      );

      expect(policy.state).toBe('published');
      expect(collection.accessPolicyId).toBe(POLICY_ID);
      expect(result.reboundCollections).toBe(1);
    });

    it('rechaza reenlazar una colección de otro tenant con el mismo 404 que una inexistente', async () => {
      const d = build();
      const policy = { id: POLICY_ID, tenantId: TENANT_ID, state: 'draft' };
      d.catalogRepo.findPolicyById.mockResolvedValue(policy);
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: 'otro-tenant',
      });

      const error = await d.service
        .publishRagPolicy(
          POLICY_ID,
          { rebindCollectionIds: [COLLECTION_ID] } as any,
          actor,
        )
        .catch((e: any) => e);

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
      // No se revela de qué tenant es: ni en el mensaje ni en los detalles.
      expect(JSON.stringify(error.getResponse())).not.toContain('otro-tenant');
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('retireModelVersion (UC-59-13)', () => {
    it('marca retired_at sin borrar', async () => {
      const d = build();
      const m = model();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(m);

      const result = await d.service.retireModelVersion(MODEL_ID, {}, actor);

      expect(m.retiredAt).toBeInstanceOf(Date);
      expect(result.retiredAt).toBeDefined();
    });

    it('rechaza retirar dos veces', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(
        model({ retiredAt: new Date() }),
      );

      await expect(
        d.service.retireModelVersion(MODEL_ID, {} as any, actor),
      ).rejects.toThrow(/ya está retirado/);
    });

    it('rechaza retirar si hay jobs vivos que dependen del modelo', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue(model());
      d.catalogRepo.findCollectionsByModel.mockResolvedValue([
        { id: COLLECTION_ID },
      ]);
      d.catalogRepo.findActiveJobsByCollection.mockResolvedValue([
        { id: 'job-1' },
      ]);

      await expect(
        d.service.retireModelVersion(MODEL_ID, {} as any, actor),
      ).rejects.toThrow(/jobs de embedding vivos/);
    });
  });

  describe('updateCollectionLifecycle (UC-59-13)', () => {
    it('sellar congela los vínculos del tenant', async () => {
      const d = build();
      const collection = {
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'active',
      };
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(collection);
      const bindings = [{ state: 'active' }, { state: 'active' }];
      d.catalogRepo.findBindingsByCollectionForUpdate.mockResolvedValue(
        bindings,
      );

      const result = await d.service.updateCollectionLifecycle(
        COLLECTION_ID,
        { lifecycleState: 'sealed' },
        actor,
      );

      expect(collection.lifecycleState).toBe('sealed');
      expect(bindings.every((b) => b.state === 'frozen')).toBe(true);
      expect(result.frozenBindings).toBe(2);
    });

    it('deprecar no congela vínculos', async () => {
      const d = build();
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'active',
      });

      const result = await d.service.updateCollectionLifecycle(
        COLLECTION_ID,
        { lifecycleState: 'deprecated' },
        actor,
      );

      expect(result.frozenBindings).toBe(0);
      expect(
        d.catalogRepo.findBindingsByCollectionForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('pedir el estado que ya tiene no hace nada', async () => {
      const d = build();
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'sealed',
      });

      const result = await d.service.updateCollectionLifecycle(
        COLLECTION_ID,
        { lifecycleState: 'sealed' },
        actor,
      );

      expect(result.frozenBindings).toBe(0);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('alcance de tenant (VEC-01)', () => {
    const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
    const CREATE_DTO = {
      tenantId: TENANT_ID,
      code: 'c1',
      name: 'Colección',
      namespace: 'ns',
      embeddingModelVersionId: MODEL_ID,
    } as any;

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException;
      }
      throw new Error('debía rechazar');
    }

    it('el tenant del cuerpo no puede ser otro que el activo: 404 y no crea nada', async () => {
      const d = build();

      const error = await failure(
        d.service.createCollection(
          { ...CREATE_DTO, tenantId: OTHER_TENANT },
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.catalogRepo.createCollection).not.toHaveBeenCalled();
      expect(d.catalogRepo.createBinding).not.toHaveBeenCalled();
    });

    it('no enlaza a la colección una política de otro tenant', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue({
        id: MODEL_ID,
        dimension: 1536,
        distanceMetric: 'cosine',
        approvedForPhi: true,
      });
      // El repositorio filtra por id + tenant: la política ajena no se encuentra.
      d.catalogRepo.findPolicyById.mockResolvedValue(null);

      const error = await failure(
        d.service.createCollection(
          { ...CREATE_DTO, accessPolicyId: POLICY_ID },
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.catalogRepo.findPolicyById).toHaveBeenCalledWith(
        d.tx,
        POLICY_ID,
        TENANT_ID,
      );
      expect(d.catalogRepo.createCollection).not.toHaveBeenCalled();
    });

    it('publicar la política de otro tenant responde 404 y no la publica', async () => {
      const d = build();
      const foreign = { id: POLICY_ID, tenantId: OTHER_TENANT, state: 'draft' };
      d.catalogRepo.findPolicyById.mockResolvedValue(foreign);

      const error = await failure(
        d.service.publishRagPolicy(POLICY_ID, {} as any, actor),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(foreign.state).toBe('draft');
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('sellar la colección de otro tenant responde 404 y no la modifica', async () => {
      const d = build();
      const foreign = {
        id: COLLECTION_ID,
        tenantId: OTHER_TENANT,
        lifecycleState: 'active',
      };
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(foreign);

      const error = await failure(
        d.service.updateCollectionLifecycle(
          COLLECTION_ID,
          { lifecycleState: 'sealed' },
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(foreign.lifecycleState).toBe('active');
      expect(
        d.catalogRepo.findBindingsByCollectionForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('sin tenant activo un actor corriente falla cerrado (412)', async () => {
      const d = build();

      const error = await d.raw
        .updateCollectionLifecycle(
          COLLECTION_ID,
          { lifecycleState: 'sealed' },
          actor,
        )
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.catalogRepo.findCollectionForUpdate).not.toHaveBeenCalled();
    });
  });
});
