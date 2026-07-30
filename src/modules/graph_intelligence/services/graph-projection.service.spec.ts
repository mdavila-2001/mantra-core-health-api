import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GraphProjectionService } from './graph-projection.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const NODE_A = '22222222-2222-2222-2222-222222222222';
const NODE_B = '33333333-3333-3333-3333-333333333333';
const EDGE_ID = '44444444-4444-4444-4444-444444444444';
const SOURCE_ID = '55555555-5555-5555-5555-555555555555';
const DEF_ID = '66666666-6666-6666-6666-666666666666';
const RUN_ID = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const projectionRepo = {
    findNodeBySourceForUpdate: mockFn(async () => null),
    findNodeById: mockFn(async (_tx: any, id: string) => ({
      nodeId: id,
      tenantId: TENANT_ID,
      lifecycleState: 'active',
    })),
    createNode: mockFn((_tx: any, data: any) => ({ nodeId: NODE_A, ...data })),
    findIdentifier: mockFn(async () => null),
    createIdentifier: mockFn((_tx: any, data: any) => ({
      id: 'ident-1',
      ...data,
    })),
    findEdgeBySourceForUpdate: mockFn(async () => null),
    findEdgeForUpdate: mockFn(async () => null),
    createEdge: mockFn((_tx: any, data: any) => ({ edgeId: EDGE_ID, ...data })),
    findEvidenceByHash: mockFn(async () => null),
    createEvidence: mockFn((_tx: any, data: any) => ({ id: 'ev-1', ...data })),
    findEvidenceByEdge: mockFn(async () => []),
    findDefinitionById: mockFn(async () => ({
      id: DEF_ID,
      tenantId: TENANT_ID,
      state: 'active',
    })),
    findRunningRunForUpdate: mockFn(async () => null),
    findRunForUpdate: mockFn(async () => null),
    createRun: mockFn((_tx: any, data: any) => ({
      id: RUN_ID,
      nodesWritten: '0',
      edgesWritten: '0',
      ...data,
    })),
  };
  const analyticsRepo = {
    deleteCachedPathsTouchingEdges: mockFn(async () => 0),
    deleteCachedPathsTouchingNodes: mockFn(async () => 0),
    findRiskScoresByNodesForUpdate: mockFn(async () => []),
    findActiveDeletionJob: mockFn(async () => null),
    createDeletionJob: mockFn((_tx: any, data: any) => ({
      id: 'del-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GraphProjectionService(
    em as any,
    projectionRepo as any,
    analyticsRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, projectionRepo, analyticsRepo, outbox, logger };
}

const NODE_DTO = {
  tenantId: TENANT_ID,
  nodeType: 'person',
  sourceEntityType: 'profiles.persons',
  sourceEntityId: SOURCE_ID,
  sourceVersion: '10',
  displayLabelRedacted: 'P***',
  identifiers: [
    { identifierSystem: 'DNI', identifierValueHash: 'hash-1', isPrimary: true },
  ],
} as any;

describe('GraphProjectionService', () => {
  describe('upsertNode (UC-61-01)', () => {
    it('crea el nodo con sus identificadores', async () => {
      const d = build();

      const result = await d.service.upsertNode(NODE_DTO, actor);

      expect(result.stale).toBe(false);
      expect(result.identifiersAdded).toBe(1);
      expect(d.projectionRepo.createNode.mock.calls[0][1].lifecycleState).toBe(
        'active',
      );
    });

    it('descarta un evento con versión anterior sin tocar nada', async () => {
      const d = build();
      const existing = {
        nodeId: NODE_A,
        nodeType: 'person',
        sourceVersion: '20',
        lifecycleState: 'active',
      };
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(existing);

      const result = await d.service.upsertNode(NODE_DTO, actor);

      expect(result.stale).toBe(true);
      expect(existing.sourceVersion).toBe('20');
      expect(d.projectionRepo.createIdentifier).not.toHaveBeenCalled();
    });

    it('aplica un evento con la misma versión', async () => {
      const d = build();
      const existing = {
        nodeId: NODE_A,
        nodeType: 'person',
        sourceVersion: '10',
        lifecycleState: 'active',
        securityLabels: [],
      };
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(existing);

      const result = await d.service.upsertNode(NODE_DTO, actor);

      expect(result.stale).toBe(false);
      expect(existing.displayLabelRedacted).toBe('P***');
    });

    it('compara versiones como enteros grandes, no como texto', async () => {
      const d = build();
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue({
        nodeId: NODE_A,
        sourceVersion: '9',
        lifecycleState: 'active',
      });

      // '10' < '9' como texto, pero 10 > 9 como número: no debe considerarse viejo.
      const result = await d.service.upsertNode(NODE_DTO, actor);

      expect(result.stale).toBe(false);
    });

    it('no repite un identificador que ya estaba', async () => {
      const d = build();
      d.projectionRepo.findIdentifier.mockResolvedValue({ id: 'previo' });

      const result = await d.service.upsertNode(NODE_DTO, actor);

      expect(result.identifiersAdded).toBe(0);
      expect(d.projectionRepo.createIdentifier).not.toHaveBeenCalled();
    });
  });

  describe('upsertEdge (UC-61-02)', () => {
    const EDGE_DTO = {
      tenantId: TENANT_ID,
      fromNodeId: NODE_A,
      toNodeId: NODE_B,
      relationshipType: 'referred',
      sourceEntityType: 'clinical.referrals',
      sourceEntityId: SOURCE_ID,
      evidence: [
        {
          evidenceType: 'source_event',
          evidenceHash: 'h1',
          confidenceDelta: 0.3,
        },
      ],
    } as any;

    it('crea la arista y calcula la confianza desde la evidencia', async () => {
      const d = build();
      d.projectionRepo.findEvidenceByEdge.mockResolvedValue([
        { confidenceDelta: 0.3 },
      ]);

      const result = await d.service.upsertEdge(EDGE_DTO, actor);

      expect(result.evidenceAdded).toBe(1);
      expect(result.confidenceScore).toBeCloseTo(0.8);
    });

    it('acota la confianza a 1 por arriba', async () => {
      const d = build();
      d.projectionRepo.findEvidenceByEdge.mockResolvedValue([
        { confidenceDelta: 0.9 },
        { confidenceDelta: 0.9 },
      ]);

      const result = await d.service.upsertEdge(EDGE_DTO, actor);

      expect(result.confidenceScore).toBe(1);
    });

    it('acota la confianza a 0 por abajo', async () => {
      const d = build();
      d.projectionRepo.findEvidenceByEdge.mockResolvedValue([
        { confidenceDelta: -0.9 },
      ]);

      const result = await d.service.upsertEdge(EDGE_DTO, actor);

      expect(result.confidenceScore).toBe(0);
    });

    it('descarta evidencia repetida por su hash', async () => {
      const d = build();
      d.projectionRepo.findEvidenceByHash.mockResolvedValue({ id: 'previa' });

      const result = await d.service.upsertEdge(EDGE_DTO, actor);

      expect(result.evidenceAdded).toBe(0);
      expect(d.projectionRepo.createEvidence).not.toHaveBeenCalled();
    });

    it('rechaza una arista cuyos extremos no están proyectados', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue(null);

      await expect(d.service.upsertEdge(EDGE_DTO, actor)).rejects.toThrow(
        /proyectados antes/,
      );
    });

    it('rechaza una arista que cruza dos tenants', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockImplementation(
        async (_tx: any, id: string) => ({
          nodeId: id,
          tenantId: id === NODE_B ? 'otro-tenant' : TENANT_ID,
        }),
      );

      await expect(d.service.upsertEdge(EDGE_DTO, actor)).rejects.toThrow(
        /dos tenants/,
      );
    });

    it('reproyectar una arista cerrada la reabre', async () => {
      const d = build();
      const existing = {
        edgeId: EDGE_ID,
        lifecycleState: 'expired',
        effectiveTo: new Date(),
        relationshipType: 'referred',
        directionality: 'directed',
      };
      d.projectionRepo.findEdgeBySourceForUpdate.mockResolvedValue(existing);

      await d.service.upsertEdge(EDGE_DTO, actor);

      expect(existing.lifecycleState).toBe('active');
      expect(existing.effectiveTo).toBeUndefined();
    });
  });

  describe('startProjectionRun (UC-61-03)', () => {
    it('abre la corrida en marcha', async () => {
      const d = build();

      const result = await d.service.startProjectionRun(DEF_ID, {}, actor);

      expect(result.status).toBe('running');
      expect(result.alreadyRunning).toBe(false);
    });

    it('devuelve la corrida viva en vez de abrir otra', async () => {
      const d = build();
      d.projectionRepo.findRunningRunForUpdate.mockResolvedValue({
        id: 'run-previa',
        status: 'running',
        nodesWritten: '5',
        edgesWritten: '3',
      });

      const result = await d.service.startProjectionRun(DEF_ID, {}, actor);

      expect(result.alreadyRunning).toBe(true);
      expect(d.projectionRepo.createRun).not.toHaveBeenCalled();
    });

    it('rechaza arrancar sobre una definición que no está activa', async () => {
      const d = build();
      d.projectionRepo.findDefinitionById.mockResolvedValue({
        id: DEF_ID,
        state: 'draft',
      });

      await expect(
        d.service.startProjectionRun(DEF_ID, {} as any, actor),
      ).rejects.toThrow(/no está activa/);
    });
  });

  describe('advanceProjectionRun (UC-61-03)', () => {
    /**
     * Ejecuta la operación with run.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with run.
     */
    function withRun(overrides: any = {}) {
      return {
        id: RUN_ID,
        tenantId: TENANT_ID,
        status: 'running',
        sourceCheckpoint: '100',
        nodesWritten: '10',
        edgesWritten: '5',
        ...overrides,
      };
    }

    it('acumula los contadores como enteros grandes', async () => {
      const d = build();
      const run = withRun();
      d.projectionRepo.findRunForUpdate.mockResolvedValue(run);

      const result = await d.service.advanceProjectionRun(
        RUN_ID,
        { sourceCheckpoint: '200', nodesWritten: 7, edgesWritten: 3 },
        actor,
      );

      expect(result.nodesWritten).toBe('17');
      expect(result.edgesWritten).toBe('8');
    });

    it('rechaza que el checkpoint retroceda', async () => {
      const d = build();
      d.projectionRepo.findRunForUpdate.mockResolvedValue(withRun());

      await expect(
        d.service.advanceProjectionRun(
          RUN_ID,
          { sourceCheckpoint: '50' } as any,
          actor,
        ),
      ).rejects.toThrow(/no puede retroceder/);
    });

    it('el lote final cierra la corrida y publica', async () => {
      const d = build();
      const run = withRun();
      d.projectionRepo.findRunForUpdate.mockResolvedValue(run);

      const result = await d.service.advanceProjectionRun(
        RUN_ID,
        { sourceCheckpoint: '200', finalBatch: true },
        actor,
      );

      expect(result.status).toBe('completed');
      expect(run.completedAt).toBeInstanceOf(Date);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalled();
    });

    it('marcar fallo cierra la corrida como fallida', async () => {
      const d = build();
      d.projectionRepo.findRunForUpdate.mockResolvedValue(withRun());

      const result = await d.service.advanceProjectionRun(
        RUN_ID,
        { sourceCheckpoint: '200', failed: true },
        actor,
      );

      expect(result.status).toBe('failed');
    });
  });

  describe('expireEdge (UC-61-10)', () => {
    /**
     * Ejecuta la operación with edge.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with edge.
     */
    function withEdge(overrides: any = {}) {
      return {
        edgeId: EDGE_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'active',
        confidenceScore: 0.8,
        ...overrides,
      };
    }

    it('expira la arista e invalida las rutas que la usaban', async () => {
      const d = build();
      const edge = withEdge();
      d.projectionRepo.findEdgeForUpdate.mockResolvedValue(edge);
      d.analyticsRepo.deleteCachedPathsTouchingEdges.mockResolvedValue(3);
      d.projectionRepo.findEvidenceByEdge.mockResolvedValue([
        { confidenceDelta: -0.5 },
      ]);

      const result = await d.service.expireEdge(
        EDGE_ID,
        { evidenceHash: 'cierre' },
        actor,
      );

      expect(edge.lifecycleState).toBe('expired');
      expect(edge.effectiveTo).toBeInstanceOf(Date);
      expect(result.invalidatedPaths).toBe(3);
      expect(result.confidenceScore).toBeCloseTo(0);
    });

    it('retirar en vez de expirar cambia el estado final', async () => {
      const d = build();
      const edge = withEdge();
      d.projectionRepo.findEdgeForUpdate.mockResolvedValue(edge);

      await d.service.expireEdge(
        EDGE_ID,
        { evidenceHash: 'c', retired: true },
        actor,
      );

      expect(edge.lifecycleState).toBe('retired');
    });

    it('es idempotente sobre una arista ya cerrada', async () => {
      const d = build();
      d.projectionRepo.findEdgeForUpdate.mockResolvedValue(
        withEdge({ lifecycleState: 'expired' }),
      );

      const result = await d.service.expireEdge(
        EDGE_ID,
        { evidenceHash: 'c' },
        actor,
      );

      expect(result.alreadyClosed).toBe(true);
      expect(d.projectionRepo.createEvidence).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('no duplica la evidencia de cierre si ya estaba', async () => {
      const d = build();
      d.projectionRepo.findEdgeForUpdate.mockResolvedValue(withEdge());
      d.projectionRepo.findEvidenceByHash.mockResolvedValue({ id: 'previa' });

      await d.service.expireEdge(EDGE_ID, { evidenceHash: 'c' }, actor);

      expect(d.projectionRepo.createEvidence).not.toHaveBeenCalled();
    });
  });

  describe('reconcileSourceVersion (UC-61-12)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      sourceEntityType: 'profiles.persons',
      sourceEntityId: SOURCE_ID,
      sourceVersion: '20',
    } as any;

    /**
     * Ejecuta la operación with node.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with node.
     */
    function withNode(overrides: any = {}) {
      return {
        nodeId: NODE_A,
        tenantId: TENANT_ID,
        sourceVersion: '10',
        lifecycleState: 'active',
        ...overrides,
      };
    }

    it('actualiza el nodo, invalida rutas y caduca el riesgo', async () => {
      const d = build();
      const node = withNode();
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(node);
      d.analyticsRepo.deleteCachedPathsTouchingNodes.mockResolvedValue(2);
      const scores = [{ expiresAt: new Date('2030-01-01') }];
      d.analyticsRepo.findRiskScoresByNodesForUpdate.mockResolvedValue(scores);

      const result = await d.service.reconcileSourceVersion(
        { ...DTO, displayLabelRedacted: 'nuevo' },
        actor,
      );

      expect(node.sourceVersion).toBe('20');
      expect(node.displayLabelRedacted).toBe('nuevo');
      expect(result.invalidatedPaths).toBe(2);
      expect(result.expiredRiskScores).toBe(1);
      expect(scores[0].expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('descarta un evento con versión anterior', async () => {
      const d = build();
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(
        withNode({ sourceVersion: '30' }),
      );

      const result = await d.service.reconcileSourceVersion(DTO, actor);

      expect(result.stale).toBe(true);
      expect(result.invalidatedPaths).toBe(0);
    });

    it('un borrado abre el job de purga en vez de actualizar', async () => {
      const d = build();
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(withNode());

      const result = await d.service.reconcileSourceVersion(
        { ...DTO, deleted: true },
        actor,
      );

      expect(result.deletionJobId).toBe('del-1');
      expect(
        d.analyticsRepo.deleteCachedPathsTouchingNodes,
      ).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('un borrado con job vivo devuelve el que hay', async () => {
      const d = build();
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue(withNode());
      d.analyticsRepo.findActiveDeletionJob.mockResolvedValue({
        id: 'del-previo',
      });

      const result = await d.service.reconcileSourceVersion(
        { ...DTO, deleted: true },
        actor,
      );

      expect(result.deletionJobId).toBe('del-previo');
      expect(d.analyticsRepo.createDeletionJob).not.toHaveBeenCalled();
    });

    it('rechaza reconciliar un nodo no proyectado', async () => {
      const d = build();

      await expect(
        d.service.reconcileSourceVersion(DTO, actor),
      ).rejects.toThrow(/no está proyectado/);
    });
  });
});
