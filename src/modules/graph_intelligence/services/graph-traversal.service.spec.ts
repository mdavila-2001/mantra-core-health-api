import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { HttpStatus } from '@nestjs/common';
import { GraphTraversalService } from './graph-traversal.service';

const actor = { id: 'user-1', roles: ['GRAPH_ANALYST'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';

/**
 * Afirma que la promesa falla como "no existe": 404, `GRAPH_RESOURCE_OUT_OF_SCOPE` y sin `details`.
 *
 * @param promise - Operación bajo prueba.
 */
async function expectOutOfScope(promise: Promise<unknown>): Promise<void> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.code).toBe('NOT_FOUND');
  expect(error.reason).toBe('GRAPH_RESOURCE_OUT_OF_SCOPE');
  expect(error.details).toBeUndefined();
}

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}
const NODE_A = '22222222-2222-2222-2222-222222222222';
const NODE_B = '33333333-3333-3333-3333-333333333333';
const NODE_C = '44444444-4444-4444-4444-444444444444';
const SCOPE_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Ejecuta la operación scope.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de scope.
 */
function scope(overrides: any = {}) {
  return {
    id: SCOPE_ID,
    tenantId: TENANT_ID,
    scopeCode: 'fraude',
    allowedNodeTypes: ['person', 'organization'],
    allowedRelationshipTypes: ['referred', 'contracted'],
    purposeOfUseCodes: ['FRAUD_INVESTIGATION'],
    maxHops: 3,
    requiresPatientContext: false,
    state: 'active',
    ...overrides,
  };
}

/**
 * Ejecuta la operación node.
 *
 * @param id - Identificador de id.
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de node.
 */
function node(id: string, overrides: any = {}) {
  return {
    nodeId: id,
    tenantId: TENANT_ID,
    nodeType: 'person',
    sourceEntityId: `source-${id}`,
    displayLabelRedacted: `N-${id.slice(0, 4)}`,
    lifecycleState: 'active',
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const analyticsRepo = {
    findScopeByCodeForUpdate: mockFn(async () => scope()),
    findScopeById: mockFn(async () => scope()),
    createScope: mockFn((_tx: any, data: any) => ({ id: SCOPE_ID, ...data })),
    findCachedPath: mockFn(async () => null),
    createCachedPath: mockFn((_tx: any, data: any) => ({
      id: 'cache-1',
      ...data,
    })),
  };
  const projectionRepo = {
    findNodeById: mockFn(async (_tx: any, id: string) => node(id)),
    findActiveEdgesFrom: mockFn(async () => []),
    findNodesByIds: mockFn(async (_tx: any, ids: string[]) =>
      ids.map((id) => node(id)),
    ),
    // Por defecto ningún nodo es de un paciente.
    findPatientProfileIds: mockFn(async () => []),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const consentGate = { assertAllowed: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GraphTraversalService(
    em as any,
    analyticsRepo as any,
    projectionRepo as any,
    outbox as any,
    consentGate as any,
    logger as any,
  );
  return {
    service: scoped(service, TENANT_ID),
    em,
    tx,
    analyticsRepo,
    projectionRepo,
    outbox,
    consentGate,
    logger,
  };
}

const TRAVERSE_DTO = {
  tenantId: TENANT_ID,
  scopeCode: 'fraude',
  startNodeId: NODE_A,
  purposeOfUse: 'FRAUD_INVESTIGATION',
} as any;

describe('GraphTraversalService', () => {
  describe('defineAccessScope (UC-61-04)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      scopeCode: 'fraude',
      allowedNodeTypes: ['person'],
      allowedRelationshipTypes: ['referred'],
      purposeOfUseCodes: ['FRAUD_INVESTIGATION'],
      maxHops: 3,
    } as any;

    it('crea el alcance activo y publica el cambio', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue(null);

      const result = await d.service.defineAccessScope(DTO, actor);

      expect(result.state).toBe('active');
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'GraphAccessScopeChanged' }),
      );
    });

    it('rechaza un código repetido', async () => {
      const d = build();

      await expect(d.service.defineAccessScope(DTO, actor)).rejects.toThrow(
        /Ya existe un alcance/,
      );
    });
  });

  describe('updateAccessScope (UC-61-04)', () => {
    it('suspender publica el evento que invalida las cachés', async () => {
      const d = build();
      const s = scope();
      d.analyticsRepo.findScopeById.mockResolvedValue(s);

      const result = await d.service.updateAccessScope(
        SCOPE_ID,
        { state: 'suspended' },
        actor,
      );

      expect(s.state).toBe('suspended');
      expect(result.state).toBe('suspended');
      expect(d.outbox.publishDomainEvent).toHaveBeenCalled();
    });
  });

  describe('traverse (UC-61-05)', () => {
    it('recorre un salto y devuelve los nodos visitados', async () => {
      const d = build();
      d.projectionRepo.findActiveEdgesFrom.mockImplementation(
        async (_tx: any, _t: any, from: string[]) =>
          from.includes(NODE_A)
            ? [
                {
                  edgeId: 'e1',
                  fromNodeId: NODE_A,
                  toNodeId: NODE_B,
                  relationshipType: 'referred',
                },
              ]
            : [],
      );

      const result = await d.service.traverse(TRAVERSE_DTO, actor);

      expect(result.nodes).toHaveLength(2);
      expect(result.depthReached).toBe(1);
      expect(result.edgeCount).toBe(1);
    });

    it('no visita un nodo cuyo tipo está fuera del alcance', async () => {
      const d = build();
      d.projectionRepo.findActiveEdgesFrom.mockImplementation(
        async (_tx: any, _t: any, from: string[]) =>
          from.includes(NODE_A)
            ? [
                {
                  edgeId: 'e1',
                  fromNodeId: NODE_A,
                  toNodeId: NODE_B,
                  relationshipType: 'referred',
                },
              ]
            : [],
      );
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { nodeType: 'device' }),
      ]);

      const result = await d.service.traverse(TRAVERSE_DTO, actor);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].nodeId).toBe(NODE_A);
    });

    it('no pasa por un nodo podado: no llega a lo que hay detrás', async () => {
      const d = build();
      let secondLevelAsked = false;
      d.projectionRepo.findActiveEdgesFrom.mockImplementation(
        async (_tx: any, _t: any, from: string[]) => {
          if (from.includes(NODE_B)) secondLevelAsked = true;
          return from.includes(NODE_A)
            ? [
                {
                  edgeId: 'e1',
                  fromNodeId: NODE_A,
                  toNodeId: NODE_B,
                  relationshipType: 'referred',
                },
              ]
            : [];
        },
      );
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { nodeType: 'device' }),
      ]);

      await d.service.traverse(TRAVERSE_DTO, actor);

      expect(secondLevelAsked).toBe(false);
    });

    it('el filtro pedido se intersecta con el del alcance, no lo amplía', async () => {
      const d = build();

      await d.service.traverse(
        { ...TRAVERSE_DTO, relationshipFilter: ['referred', 'inventado'] },
        actor,
      );

      expect(d.projectionRepo.findActiveEdgesFrom.mock.calls[0][4]).toEqual([
        'referred',
      ]);
    });

    it('recorta la profundidad pedida al máximo del alcance', async () => {
      const d = build();
      const levels: string[][] = [];
      d.projectionRepo.findActiveEdgesFrom.mockImplementation(
        async (_tx: any, _t: any, from: string[]) => {
          levels.push(from);
          return from.length > 0
            ? [
                {
                  edgeId: `e-${levels.length}`,
                  fromNodeId: from[0],
                  toNodeId: `${levels.length}0000000-0000-0000-0000-000000000000`,
                  relationshipType: 'referred',
                },
              ]
            : [];
        },
      );

      await d.service.traverse({ ...TRAVERSE_DTO, maxHops: 99 }, actor);

      expect(levels.length).toBeLessThanOrEqual(3);
    });

    it('rechaza un alcance suspendido', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue(
        scope({ state: 'suspended' }),
      );

      await expect(d.service.traverse(TRAVERSE_DTO, actor)).rejects.toThrow(
        /no está activo/,
      );
    });

    it('rechaza un propósito de uso no admitido', async () => {
      const d = build();

      await expect(
        d.service.traverse(
          { ...TRAVERSE_DTO, purposeOfUse: 'MARKETING' },
          actor,
        ),
      ).rejects.toThrow(/propósito de uso/);
    });

    it('exige el paciente si el alcance lo pide', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue(
        scope({ requiresPatientContext: true }),
      );

      await expect(d.service.traverse(TRAVERSE_DTO, actor)).rejects.toThrow(
        /paciente/,
      );
    });

    it('rechaza partir de un nodo fuera del alcance', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { nodeType: 'device' }),
      );

      await expect(d.service.traverse(TRAVERSE_DTO, actor)).rejects.toThrow(
        /fuera del alcance/,
      );
    });

    it('rechaza partir de un nodo de otro tenant', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { tenantId: 'otro' }),
      );

      await expect(d.service.traverse(TRAVERSE_DTO, actor)).rejects.toThrow(
        /no encontrado/,
      );
    });
  });

  describe('findPath (UC-61-05)', () => {
    const PATH_DTO = { ...TRAVERSE_DTO, endNodeId: NODE_C };

    /**
     * Ejecuta la operación with chain.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with chain.
     */
    function withChain(d: ReturnType<typeof build>) {
      d.projectionRepo.findActiveEdgesFrom.mockImplementation(
        async (_tx: any, _t: any, from: string[]) => {
          if (from.includes(NODE_A)) {
            return [
              {
                edgeId: 'e1',
                fromNodeId: NODE_A,
                toNodeId: NODE_B,
                relationshipType: 'referred',
              },
            ];
          }
          if (from.includes(NODE_B)) {
            return [
              {
                edgeId: 'e2',
                fromNodeId: NODE_B,
                toNodeId: NODE_C,
                relationshipType: 'referred',
              },
            ];
          }
          return [];
        },
      );
    }

    it('reconstruye el camino completo', async () => {
      const d = build();
      withChain(d);

      const result = await d.service.findPath(PATH_DTO, actor);

      expect(result.found).toBe(true);
      expect(result.pathNodes).toEqual([NODE_A, NODE_B, NODE_C]);
      expect(result.pathEdges).toEqual(['e1', 'e2']);
    });

    it('cachea también la ausencia de camino', async () => {
      const d = build();

      const result = await d.service.findPath(PATH_DTO, actor);

      expect(result.found).toBe(false);
      expect(d.analyticsRepo.createCachedPath).toHaveBeenCalled();
      expect(
        d.analyticsRepo.createCachedPath.mock.calls[0][1].pathNodes,
      ).toEqual([]);
    });

    it('sirve desde la caché si no ha expirado', async () => {
      const d = build();
      d.analyticsRepo.findCachedPath.mockResolvedValue({
        pathNodes: [NODE_A, NODE_C],
        pathEdges: ['e9'],
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await d.service.findPath(PATH_DTO, actor);

      expect(result.fromCache).toBe(true);
      expect(d.projectionRepo.findActiveEdgesFrom).not.toHaveBeenCalled();
    });

    it('recalcula si la entrada de caché expiró', async () => {
      const d = build();
      const stale = {
        pathNodes: [NODE_A],
        pathEdges: [],
        expiresAt: new Date(Date.now() - 60_000),
        calculatedAt: new Date(),
      };
      d.analyticsRepo.findCachedPath.mockResolvedValue(stale);
      withChain(d);

      const result = await d.service.findPath(PATH_DTO, actor);

      expect(result.fromCache).toBe(false);
      expect(stale.pathNodes).toEqual([NODE_A, NODE_B, NODE_C]);
    });

    it('valida el alcance antes de mirar la caché', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue(
        scope({ state: 'suspended' }),
      );

      await expect(d.service.findPath(PATH_DTO, actor)).rejects.toThrow(
        /no está activo/,
      );
      expect(d.analyticsRepo.findCachedPath).not.toHaveBeenCalled();
    });

    it('dos filtros que se reducen al mismo conjunto comparten entrada de caché', async () => {
      const d1 = build();
      await d1.service.findPath(
        { ...PATH_DTO, relationshipFilter: ['referred', 'x'] },
        actor,
      );
      const hash1 =
        d1.analyticsRepo.createCachedPath.mock.calls[0][1]
          .relationshipFilterHash;

      const d2 = build();
      await d2.service.findPath(
        { ...PATH_DTO, relationshipFilter: ['referred', 'y'] },
        actor,
      );
      const hash2 =
        d2.analyticsRepo.createCachedPath.mock.calls[0][1]
          .relationshipFilterHash;

      expect(hash1).toBe(hash2);
    });
  });

  describe('alcance por tenant (GRAPH-01)', () => {
    it('operador de A no suspende el scope de B ni publica evento para B', async () => {
      const d = build();
      const s = scope({ tenantId: OTHER_TENANT });
      d.analyticsRepo.findScopeById.mockResolvedValue(s);
      await expectOutOfScope(
        d.service.updateAccessScope(SCOPE_ID, { state: 'suspended' }, actor),
      );
      expect(s.state).toBe('active');
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('consentimiento del paciente (GRAPH-02)', () => {
    const PATIENT = '88888888-8888-8888-8888-888888888888';
    const withPatient = { ...TRAVERSE_DTO, patientProfileId: PATIENT };
    const deny = () =>
      new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'denegado',
        undefined,
        'GRAPH_CONSENT_REQUIRED',
      );

    it('sin contexto de paciente no consulta la compuerta', async () => {
      const d = build();
      await d.service.traverse(TRAVERSE_DTO, actor);
      expect(d.consentGate.assertAllowed).not.toHaveBeenCalled();
    });

    it('con consentimiento vigente recorre y poda por scope', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue(
        scope({ requiresPatientContext: true }),
      );
      d.projectionRepo.findActiveEdgesFrom.mockResolvedValue([
        {
          edgeId: 'e1',
          fromNodeId: NODE_A,
          toNodeId: NODE_B,
          relationshipType: 'referred',
        },
      ]);
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { nodeType: 'device' }),
      ]);

      const result = await d.service.traverse(withPatient, actor);

      expect(d.consentGate.assertAllowed).toHaveBeenCalledWith(d.tx, {
        tenantId: TENANT_ID,
        patientProfileId: PATIENT,
        purposeOfUse: 'FRAUD_INVESTIGATION',
        actorId: actor.id,
      });
      expect(result.nodes.map((n) => n.nodeId)).toEqual([NODE_A]);
    });

    it('traverse denegado no consulta nodos ni aristas', async () => {
      const d = build();
      d.consentGate.assertAllowed.mockRejectedValue(deny());
      await expect(
        d.service.traverse(withPatient, actor),
      ).rejects.toMatchObject({ reason: 'GRAPH_CONSENT_REQUIRED' });
      expect(d.projectionRepo.findNodeById).not.toHaveBeenCalled();
      expect(d.projectionRepo.findActiveEdgesFrom).not.toHaveBeenCalled();
    });

    it('findPath denegado no lee ni escribe la caché de rutas', async () => {
      const d = build();
      d.consentGate.assertAllowed.mockRejectedValue(deny());
      const error: any = await d.service
        .findPath({ ...withPatient, endNodeId: NODE_B }, actor)
        .catch((e: unknown) => e);
      expect(error.getStatus()).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.reason).toBe('GRAPH_CONSENT_REQUIRED');
      expect(d.analyticsRepo.findCachedPath).not.toHaveBeenCalled();
      expect(d.analyticsRepo.createCachedPath).not.toHaveBeenCalled();
      expect(d.projectionRepo.findActiveEdgesFrom).not.toHaveBeenCalled();
    });
  });

  describe('consentimiento derivado del nodo (no del cliente)', () => {
    const PATIENT_A = '88888888-8888-8888-8888-888888888888';
    const PATIENT_B = '77777777-7777-7777-7777-777777777777';
    const deny = () =>
      new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'denegado',
        undefined,
        'GRAPH_CONSENT_REQUIRED',
      );

    /** Hace que los nodos cuyo `source_entity_id` esté en `patients` sean de paciente. */
    function patientsAre(d: ReturnType<typeof build>, ...patients: string[]) {
      d.projectionRepo.findPatientProfileIds.mockImplementation(
        async (_tx: any, ids: string[]) =>
          ids.filter((id) => patients.includes(id)),
      );
    }

    it('traverse sobre el nodo de un paciente sin declarar patientProfileId consulta la compuerta con ese paciente', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { sourceEntityId: PATIENT_A }),
      );
      patientsAre(d, PATIENT_A);

      await d.service.traverse(TRAVERSE_DTO, actor);

      expect(d.consentGate.assertAllowed).toHaveBeenCalledTimes(1);
      expect(d.consentGate.assertAllowed).toHaveBeenCalledWith(d.tx, {
        tenantId: TENANT_ID,
        patientProfileId: PATIENT_A,
        purposeOfUse: 'FRAUD_INVESTIGATION',
        actorId: actor.id,
      });
    });

    it('traverse sobre el nodo de un paciente sin consentimiento se deniega aunque el cliente omita el paciente', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { sourceEntityId: PATIENT_A }),
      );
      patientsAre(d, PATIENT_A);
      d.consentGate.assertAllowed.mockRejectedValue(deny());

      await expect(
        d.service.traverse(TRAVERSE_DTO, actor),
      ).rejects.toMatchObject({ reason: 'GRAPH_CONSENT_REQUIRED' });
      expect(d.projectionRepo.findActiveEdgesFrom).not.toHaveBeenCalled();
    });

    it('findPath sobre el nodo de un paciente sin consentimiento no lee ni escribe la caché', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { sourceEntityId: PATIENT_A }),
      );
      patientsAre(d, PATIENT_A);
      d.consentGate.assertAllowed.mockRejectedValue(deny());

      await expect(
        d.service.findPath({ ...TRAVERSE_DTO, endNodeId: NODE_B }, actor),
      ).rejects.toMatchObject({ reason: 'GRAPH_CONSENT_REQUIRED' });
      expect(d.analyticsRepo.findCachedPath).not.toHaveBeenCalled();
      expect(d.analyticsRepo.createCachedPath).not.toHaveBeenCalled();
    });

    it('declarar a un paciente que consiente no autoriza el nodo de otro paciente', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { sourceEntityId: PATIENT_B }),
      );
      patientsAre(d, PATIENT_B);

      await expect(
        d.service.traverse(
          { ...TRAVERSE_DTO, patientProfileId: PATIENT_A },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.projectionRepo.findActiveEdgesFrom).not.toHaveBeenCalled();
    });

    it('con el mismo paciente declarado y en el nodo, la compuerta corre una sola vez', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(
        node(NODE_A, { sourceEntityId: PATIENT_A }),
      );
      patientsAre(d, PATIENT_A);

      await d.service.traverse(
        { ...TRAVERSE_DTO, patientProfileId: PATIENT_A },
        actor,
      );

      expect(d.consentGate.assertAllowed).toHaveBeenCalledTimes(1);
    });

    it('poda el nodo visitado de un paciente sin consentimiento y conserva el del que consiente', async () => {
      const d = build();
      patientsAre(d, PATIENT_A, PATIENT_B);
      d.projectionRepo.findActiveEdgesFrom.mockResolvedValueOnce([
        {
          edgeId: 'e1',
          fromNodeId: NODE_A,
          toNodeId: NODE_B,
          relationshipType: 'referred',
        },
        {
          edgeId: 'e2',
          fromNodeId: NODE_A,
          toNodeId: NODE_C,
          relationshipType: 'referred',
        },
      ]);
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { sourceEntityId: PATIENT_A }),
        node(NODE_C, { sourceEntityId: PATIENT_B }),
      ]);
      d.consentGate.assertAllowed.mockImplementation(
        async (_tx: any, q: any) => {
          if (q.patientProfileId === PATIENT_A) throw deny();
        },
      );

      const result = await d.service.traverse(TRAVERSE_DTO, actor);

      expect(result.nodes.map((n) => n.nodeId)).toEqual([NODE_A, NODE_C]);
    });

    it('un fallo que no es de consentimiento no se traga como poda', async () => {
      const d = build();
      patientsAre(d, PATIENT_A);
      d.projectionRepo.findActiveEdgesFrom.mockResolvedValueOnce([
        {
          edgeId: 'e1',
          fromNodeId: NODE_A,
          toNodeId: NODE_B,
          relationshipType: 'referred',
        },
      ]);
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { sourceEntityId: PATIENT_A }),
      ]);
      d.consentGate.assertAllowed.mockRejectedValue(new Error('db caída'));

      await expect(d.service.traverse(TRAVERSE_DTO, actor)).rejects.toThrow(
        'db caída',
      );
    });

    it('no sirve de la caché una ruta que pasa por un paciente cuyo consentimiento ya no rige', async () => {
      const d = build();
      patientsAre(d, PATIENT_B);
      d.analyticsRepo.findCachedPath.mockResolvedValue({
        pathNodes: [NODE_A, NODE_B],
        pathEdges: ['e1'],
        expiresAt: new Date(Date.now() + 60_000),
      });
      d.projectionRepo.findNodesByIds.mockResolvedValue([
        node(NODE_B, { sourceEntityId: PATIENT_B }),
      ]);
      d.consentGate.assertAllowed.mockRejectedValue(deny());

      const result = await d.service.findPath(
        { ...TRAVERSE_DTO, endNodeId: NODE_B },
        actor,
      );

      expect(result.fromCache).toBe(false);
      expect(d.projectionRepo.findActiveEdgesFrom).toHaveBeenCalled();
    });
  });
});
