import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GraphTraversalService } from './graph-traversal.service';

const actor = { id: 'user-1', roles: ['GRAPH_ANALYST'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const NODE_A = '22222222-2222-2222-2222-222222222222';
const NODE_B = '33333333-3333-3333-3333-333333333333';
const NODE_C = '44444444-4444-4444-4444-444444444444';
const SCOPE_ID = '55555555-5555-5555-5555-555555555555';

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

function node(id: string, overrides: any = {}) {
  return {
    nodeId: id,
    tenantId: TENANT_ID,
    nodeType: 'person',
    displayLabelRedacted: `N-${id.slice(0, 4)}`,
    lifecycleState: 'active',
    ...overrides,
  };
}

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
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GraphTraversalService(
    em as any,
    analyticsRepo as any,
    projectionRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, analyticsRepo, projectionRepo, outbox, logger };
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
});
