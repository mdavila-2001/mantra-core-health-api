import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GraphAnalyticsService } from './graph-analytics.service';

const actor = { id: 'user-1', roles: ['COMPLIANCE_OFFICER'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const NODE_A = '22222222-2222-2222-2222-222222222222';
const RULE_ID = '33333333-3333-3333-3333-333333333333';
const HIT_ID = '44444444-4444-4444-4444-444444444444';
const SOURCE_ID = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const analyticsRepo = {
    findCommunitiesByAlgorithm: mockFn(async () => []),
    deleteCommunities: mockFn(async () => 0),
    createCommunity: mockFn((_tx: any, data: any) => ({
      id: 'com-1',
      ...data,
    })),
    findCommunitiesByTenant: mockFn(async () => []),
    findRiskScoreForUpdate: mockFn(async () => null),
    createRiskScore: mockFn((_tx: any, data: any) => ({
      id: 'risk-1',
      ...data,
    })),
    deleteRiskScoresByNodes: mockFn(async () => 0),
    findRuleDefinitionById: mockFn(async () => ({
      id: RULE_ID,
      state: 'active',
      ruleType: 'ring',
      severity: 'high',
    })),
    findScopeByCodeForUpdate: mockFn(async () => ({
      id: 'scope-1',
      state: 'active',
    })),
    findLiveHit: mockFn(async () => null),
    createHit: mockFn((_tx: any, data: any) => ({ id: HIT_ID, ...data })),
    findHitForUpdate: mockFn(async () => null),
    findActiveDeletionJob: mockFn(async () => null),
    createDeletionJob: mockFn((_tx: any, data: any) => ({
      id: 'del-1',
      ...data,
    })),
    deleteCachedPathsTouchingNodes: mockFn(async () => 0),
  };
  const projectionRepo = {
    findNodeById: mockFn(async (_tx: any, id: string) => ({
      nodeId: id,
      tenantId: TENANT_ID,
      lifecycleState: 'active',
    })),
    findNodeBySourceForUpdate: mockFn(async () => null),
    findEdgesTouchingNodes: mockFn(async () => []),
    deleteEvidenceByEdges: mockFn(async () => 0),
    deleteEdges: mockFn(async () => 0),
    deleteIdentifiersByNodes: mockFn(async () => 0),
    deleteNodes: mockFn(async () => 0),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GraphAnalyticsService(
    em as any,
    analyticsRepo as any,
    projectionRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, analyticsRepo, projectionRepo, outbox, logger };
}

describe('GraphAnalyticsService', () => {
  describe('detectCommunities (UC-61-06)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      communityType: 'referral_ring',
      algorithmVersion: 'louvain-1',
      communities: [{ memberNodeIds: [NODE_A], score: 0.7 }],
    } as any;

    it('escribe las comunidades de la versión', async () => {
      const d = build();

      const result = await d.service.detectCommunities(DTO, actor);

      expect(result.written).toBe(1);
      expect(d.analyticsRepo.createCommunity).toHaveBeenCalledTimes(1);
    });

    it('reemplaza entero el resultado anterior de la misma versión', async () => {
      const d = build();
      d.analyticsRepo.findCommunitiesByAlgorithm.mockResolvedValue([
        { id: 'c1' },
        { id: 'c2' },
      ]);
      d.analyticsRepo.deleteCommunities.mockResolvedValue(2);

      const result = await d.service.detectCommunities(DTO, actor);

      expect(result.replaced).toBe(2);
      expect(d.analyticsRepo.deleteCommunities.mock.calls[0][1]).toEqual([
        'c1',
        'c2',
      ]);
    });

    it('sólo borra las de la misma versión de algoritmo', async () => {
      const d = build();

      await d.service.detectCommunities(DTO, actor);

      expect(d.analyticsRepo.findCommunitiesByAlgorithm).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        'referral_ring',
        'louvain-1',
      );
    });
  });

  describe('computeRiskScores (UC-61-07)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      riskType: 'fraud',
      modelVersion: 'v1',
      scores: [{ nodeId: NODE_A, score: 0.5 }],
    } as any;

    it('crea el puntaje con caducidad', async () => {
      const d = build();

      const result = await d.service.computeRiskScores(DTO, actor);

      expect(result.created).toBe(1);
      expect(
        d.analyticsRepo.createRiskScore.mock.calls[0][1].expiresAt,
      ).toBeInstanceOf(Date);
    });

    it('actualiza el puntaje existente del mismo modelo', async () => {
      const d = build();
      const existing = {
        score: 0.1,
        calculatedAt: new Date(),
        expiresAt: new Date(),
      };
      d.analyticsRepo.findRiskScoreForUpdate.mockResolvedValue(existing);

      const result = await d.service.computeRiskScores(DTO, actor);

      expect(result.updated).toBe(1);
      expect(existing.score).toBe(0.5);
      expect(d.analyticsRepo.createRiskScore).not.toHaveBeenCalled();
    });

    it('conserva la explicación anterior si no llega una nueva', async () => {
      const d = build();
      const existing = {
        score: 0.1,
        explanationRedacted: 'motivo previo',
        calculatedAt: new Date(),
        expiresAt: new Date(),
      };
      d.analyticsRepo.findRiskScoreForUpdate.mockResolvedValue(existing);

      await d.service.computeRiskScores(DTO, actor);

      expect(existing.explanationRedacted).toBe('motivo previo');
    });

    it('sólo alerta por encima del umbral', async () => {
      const d = build();

      const bajo = await d.service.computeRiskScores(DTO, actor);
      expect(bajo.alerted).toBe(0);

      const d2 = build();
      const alto = await d2.service.computeRiskScores(
        { ...DTO, scores: [{ nodeId: NODE_A, score: 0.95 }] },
        actor,
      );
      expect(alto.alerted).toBe(1);
      expect(d2.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d2.tx,
        expect.objectContaining({ eventType: 'GraphRiskScoreComputed' }),
      );
    });

    it('respeta el umbral que llega en la petición', async () => {
      const d = build();

      const result = await d.service.computeRiskScores(
        { ...DTO, alertThreshold: 0.4 },
        actor,
      );

      expect(result.alerted).toBe(1);
    });

    it('rechaza puntuar un nodo que no está activo', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue({
        nodeId: NODE_A,
        tenantId: TENANT_ID,
        lifecycleState: 'deleted',
      });

      await expect(d.service.computeRiskScores(DTO, actor)).rejects.toThrow(
        /no está activo/,
      );
    });

    it('rechaza puntuar un nodo de otro tenant', async () => {
      const d = build();
      d.projectionRepo.findNodeById.mockResolvedValue({
        nodeId: NODE_A,
        tenantId: 'otro',
      });

      await expect(d.service.computeRiskScores(DTO, actor)).rejects.toThrow(
        /no encontrado/,
      );
    });
  });

  describe('evaluateRule (UC-61-08)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      scopeCode: 'fraude',
      matches: [{ primaryNodeId: NODE_A, evidenceEdgeIds: ['e1'] }],
    } as any;

    it('abre el hallazgo y publica con la severidad de la regla', async () => {
      const d = build();

      const result = await d.service.evaluateRule(RULE_ID, DTO, actor);

      expect(result.hitsOpened).toBe(1);
      expect(result.severity).toBe('high');
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'GraphRuleHitDetected' }),
      );
    });

    it('descarta la coincidencia si ya hay un hallazgo vivo del mismo patrón', async () => {
      const d = build();
      d.analyticsRepo.findLiveHit.mockResolvedValue({ id: 'hit-previo' });

      const result = await d.service.evaluateRule(RULE_ID, DTO, actor);

      expect(result.hitsOpened).toBe(0);
      expect(result.duplicatesSkipped).toBe(1);
      expect(d.analyticsRepo.createHit).not.toHaveBeenCalled();
    });

    it('rechaza evaluar una regla que no está activa', async () => {
      const d = build();
      d.analyticsRepo.findRuleDefinitionById.mockResolvedValue({
        id: RULE_ID,
        state: 'draft',
      });

      await expect(d.service.evaluateRule(RULE_ID, DTO, actor)).rejects.toThrow(
        /no está activa/,
      );
    });

    it('exige un alcance de acceso activo', async () => {
      const d = build();
      d.analyticsRepo.findScopeByCodeForUpdate.mockResolvedValue({
        state: 'suspended',
      });

      await expect(d.service.evaluateRule(RULE_ID, DTO, actor)).rejects.toThrow(
        /alcance de acceso activo/,
      );
    });
  });

  describe('triageRuleHit (UC-61-09)', () => {
    function withHit(status: string) {
      const hit = {
        id: HIT_ID,
        tenantId: TENANT_ID,
        status,
        primaryNodeId: NODE_A,
      };
      return hit;
    }

    it('mueve de abierto a en revisión', async () => {
      const d = build();
      const hit = withHit('open');
      d.analyticsRepo.findHitForUpdate.mockResolvedValue(hit);

      const result = await d.service.triageRuleHit(
        HIT_ID,
        { status: 'in_review' },
        actor,
      );

      expect(hit.status).toBe('in_review');
      expect(result.resolvedAt).toBeUndefined();
    });

    it('cerrar fija la fecha de resolución', async () => {
      const d = build();
      const hit = withHit('in_review');
      d.analyticsRepo.findHitForUpdate.mockResolvedValue(hit);

      const result = await d.service.triageRuleHit(
        HIT_ID,
        { status: 'resolved' },
        actor,
      );

      expect(result.resolvedAt).toBeDefined();
    });

    it('un hallazgo cerrado no se reabre', async () => {
      const d = build();
      d.analyticsRepo.findHitForUpdate.mockResolvedValue(withHit('resolved'));

      await expect(
        d.service.triageRuleHit(HIT_ID, { status: 'open' } as any, actor),
      ).rejects.toThrow(/no está permitida/);
    });

    it('pedir el estado que ya tiene no hace nada', async () => {
      const d = build();
      d.analyticsRepo.findHitForUpdate.mockResolvedValue(withHit('open'));

      const result = await d.service.triageRuleHit(
        HIT_ID,
        { status: 'open' },
        actor,
      );

      expect(result.unchanged).toBe(true);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('requestDeletion (UC-61-11)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      sourceEntityType: 'profiles.persons',
      sourceEntityId: SOURCE_ID,
    } as any;

    function withNode(d: ReturnType<typeof build>) {
      d.projectionRepo.findNodeBySourceForUpdate.mockResolvedValue({
        nodeId: NODE_A,
        tenantId: TENANT_ID,
      });
    }

    it('purga nodo, identificadores, aristas, evidencia y riesgo', async () => {
      const d = build();
      withNode(d);
      d.projectionRepo.findEdgesTouchingNodes.mockResolvedValue([
        { edgeId: 'e1' },
      ]);
      d.projectionRepo.deleteEdges.mockResolvedValue(1);
      d.projectionRepo.deleteNodes.mockResolvedValue(1);
      d.projectionRepo.deleteIdentifiersByNodes.mockResolvedValue(2);
      d.analyticsRepo.deleteRiskScoresByNodes.mockResolvedValue(3);

      const result = await d.service.requestDeletion(DTO, actor);

      expect(result.nodesDeleted).toBe(1);
      expect(result.edgesDeleted).toBe(1);
      expect(result.identifiersDeleted).toBe(2);
      expect(result.riskScoresDeleted).toBe(3);
      expect(result.status).toBe('verified');
    });

    it('borra la evidencia antes que la arista', async () => {
      const d = build();
      withNode(d);
      d.projectionRepo.findEdgesTouchingNodes.mockResolvedValue([
        { edgeId: 'e1' },
      ]);

      await d.service.requestDeletion(DTO, actor);

      expect(
        d.projectionRepo.deleteEvidenceByEdges.mock.invocationCallOrder[0],
      ).toBeLessThan(d.projectionRepo.deleteEdges.mock.invocationCallOrder[0]);
    });

    it('depura el nodo de las comunidades a las que pertenecía', async () => {
      const d = build();
      withNode(d);
      const community = { memberNodeIds: [NODE_A, 'otro-nodo'] };
      d.analyticsRepo.findCommunitiesByTenant.mockResolvedValue([community]);

      const result = await d.service.requestDeletion(DTO, actor);

      expect(community.memberNodeIds).toEqual(['otro-nodo']);
      expect(result.communitiesUpdated).toBe(1);
    });

    it('no toca comunidades en las que el nodo no estaba', async () => {
      const d = build();
      withNode(d);
      const community = { memberNodeIds: ['otro-nodo'] };
      d.analyticsRepo.findCommunitiesByTenant.mockResolvedValue([community]);

      const result = await d.service.requestDeletion(DTO, actor);

      expect(community.memberNodeIds).toEqual(['otro-nodo']);
      expect(result.communitiesUpdated).toBe(0);
    });

    it('devuelve el job vivo en vez de lanzar otra purga', async () => {
      const d = build();
      d.analyticsRepo.findActiveDeletionJob.mockResolvedValue({
        id: 'del-previo',
        status: 'running',
        nodesDeleted: 1,
        edgesDeleted: 2,
      });

      const result = await d.service.requestDeletion(DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.analyticsRepo.createDeletionJob).not.toHaveBeenCalled();
    });

    it('cierra el job aunque el nodo no estuviera proyectado', async () => {
      const d = build();

      const result = await d.service.requestDeletion(DTO, actor);

      expect(result.status).toBe('verified');
      expect(result.nodesDeleted).toBe(0);
    });

    it('avisa en el log y publica la purga', async () => {
      const d = build();
      withNode(d);

      await d.service.requestDeletion(DTO, actor);

      expect(d.logger.warn).toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'GraphEntityPurged' }),
      );
    });
  });
});
