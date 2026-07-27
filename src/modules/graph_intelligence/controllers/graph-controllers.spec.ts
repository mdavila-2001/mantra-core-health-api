import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GraphProjectionController } from './graph-projection.controller';
import { GraphQueryController } from './graph-query.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';

describe('GraphProjectionController', () => {
  function build() {
    const projectionService = {
      upsertNode: mockFn(async () => ({ id: ID })),
      upsertEdge: mockFn(async () => ({ id: ID })),
      reconcileSourceVersion: mockFn(async () => ({ stale: false })),
      startProjectionRun: mockFn(async () => ({ id: ID })),
      advanceProjectionRun: mockFn(async () => ({ id: ID })),
      expireEdge: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new GraphProjectionController(projectionService as any),
      projectionService,
    };
  }

  it('delega la proyección del nodo (UC-61-01)', async () => {
    const d = build();
    const dto = { nodeType: 'person' } as any;

    await d.controller.upsertNode(dto, actor);

    expect(d.projectionService.upsertNode).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la proyección de la arista (UC-61-02)', async () => {
    const d = build();
    const dto = { relationshipType: 'referred' } as any;

    await d.controller.upsertEdge(dto, actor);

    expect(d.projectionService.upsertEdge).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la reconciliación (UC-61-12)', async () => {
    const d = build();
    const dto = { sourceVersion: '10' } as any;

    await d.controller.reconcileSourceVersion(dto, actor);

    expect(d.projectionService.reconcileSourceVersion).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega el arranque de la corrida con el id de ruta (UC-61-03)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.startProjectionRun(ID, dto, actor);

    expect(d.projectionService.startProjectionRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el avance de la corrida con el id de ruta (UC-61-03)', async () => {
    const d = build();
    const dto = { sourceCheckpoint: '200' } as any;

    await d.controller.advanceProjectionRun(ID, dto, actor);

    expect(d.projectionService.advanceProjectionRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la expiración con el id de arista (UC-61-10)', async () => {
    const d = build();
    const dto = { evidenceHash: 'h' } as any;

    await d.controller.expireEdge(ID, dto, actor);

    expect(d.projectionService.expireEdge).toHaveBeenCalledWith(ID, dto, actor);
  });
});

describe('GraphQueryController', () => {
  function build() {
    const traversalService = {
      defineAccessScope: mockFn(async () => ({ id: ID })),
      updateAccessScope: mockFn(async () => ({ id: ID })),
      traverse: mockFn(async () => ({ nodes: [] })),
      findPath: mockFn(async () => ({ found: false })),
    };
    const analyticsService = {
      detectCommunities: mockFn(async () => ({ written: 0 })),
      computeRiskScores: mockFn(async () => ({ created: 0 })),
      evaluateRule: mockFn(async () => ({ hitsOpened: 0 })),
      triageRuleHit: mockFn(async () => ({ id: ID })),
      requestDeletion: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new GraphQueryController(
        traversalService as any,
        analyticsService as any,
      ),
      traversalService,
      analyticsService,
    };
  }

  it('delega la definición del alcance (UC-61-04)', async () => {
    const d = build();
    const dto = { scopeCode: 'fraude' } as any;

    await d.controller.defineAccessScope(dto, actor);

    expect(d.traversalService.defineAccessScope).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega el ajuste del alcance con el id de ruta (UC-61-04)', async () => {
    const d = build();
    const dto = { state: 'suspended' } as any;

    await d.controller.updateAccessScope(ID, dto, actor);

    expect(d.traversalService.updateAccessScope).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el recorrido (UC-61-05)', async () => {
    const d = build();
    const dto = { startNodeId: ID } as any;

    await d.controller.traverse(dto, actor);

    expect(d.traversalService.traverse).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la búsqueda de camino (UC-61-05)', async () => {
    const d = build();
    const dto = { startNodeId: ID, endNodeId: ID } as any;

    await d.controller.findPath(dto, actor);

    expect(d.traversalService.findPath).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la detección de comunidades (UC-61-06)', async () => {
    const d = build();
    const dto = { communityType: 'ring' } as any;

    await d.controller.detectCommunities(dto, actor);

    expect(d.analyticsService.detectCommunities).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega los puntajes de riesgo (UC-61-07)', async () => {
    const d = build();
    const dto = { riskType: 'fraud' } as any;

    await d.controller.computeRiskScores(dto, actor);

    expect(d.analyticsService.computeRiskScores).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la evaluación de la regla con el id de ruta (UC-61-08)', async () => {
    const d = build();
    const dto = { matches: [] } as any;

    await d.controller.evaluateRule(ID, dto, actor);

    expect(d.analyticsService.evaluateRule).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el triage con el id de hallazgo (UC-61-09)', async () => {
    const d = build();
    const dto = { status: 'resolved' } as any;

    await d.controller.triageRuleHit(ID, dto, actor);

    expect(d.analyticsService.triageRuleHit).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la purga (UC-61-11)', async () => {
    const d = build();
    const dto = { sourceEntityId: ID } as any;

    await d.controller.requestDeletion(dto, actor);

    expect(d.analyticsService.requestDeletion).toHaveBeenCalledWith(dto, actor);
  });
});
