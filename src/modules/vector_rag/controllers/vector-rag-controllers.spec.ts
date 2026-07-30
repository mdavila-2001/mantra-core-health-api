import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { VectorGovernanceController } from './vector-governance.controller';
import { VectorRuntimeController } from './vector-runtime.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';

describe('VectorGovernanceController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const governanceService = {
      registerModelVersion: mockFn(async () => ({ id: ID })),
      retireModelVersion: mockFn(async () => ({ id: ID })),
      createCollection: mockFn(async () => ({ id: ID })),
      defineRagPolicy: mockFn(async () => ({ id: ID })),
      publishRagPolicy: mockFn(async () => ({ id: ID })),
      updateCollectionLifecycle: mockFn(async () => ({ id: ID })),
    };
    const pipelineService = {
      queueEmbeddingJob: mockFn(async () => ({ id: ID })),
      reEmbedCollection: mockFn(async () => ({ embeddingJobId: ID })),
    };
    return {
      controller: new VectorGovernanceController(
        governanceService as any,
        pipelineService as any,
      ),
      governanceService,
      pipelineService,
    };
  }

  it('delega el registro del modelo (UC-59-01)', async () => {
    const d = build();
    const dto = { providerCode: 'openai' } as any;

    await d.controller.registerModelVersion(dto, actor);

    expect(d.governanceService.registerModelVersion).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la retirada con el id de ruta (UC-59-13)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.retireModelVersion(ID, dto, actor);

    expect(d.governanceService.retireModelVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la creación de la colección (UC-59-02)', async () => {
    const d = build();
    const dto = { code: 'notas' } as any;

    await d.controller.createCollection(dto, actor);

    expect(d.governanceService.createCollection).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la definición de la política (UC-59-03)', async () => {
    const d = build();
    const dto = { code: 'p' } as any;

    await d.controller.defineRagPolicy(dto, actor);

    expect(d.governanceService.defineRagPolicy).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la publicación con el id de ruta (UC-59-03)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.publishRagPolicy(ID, dto, actor);

    expect(d.governanceService.publishRagPolicy).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('pasa la cabecera de idempotencia al encolar (UC-59-04)', async () => {
    const d = build();
    const dto = { jobType: 'backfill' } as any;

    await d.controller.queueEmbeddingJob(ID, dto, actor, 'clave-1');

    expect(d.pipelineService.queueEmbeddingJob).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
      'clave-1',
    );
  });

  it('delega el re-embedding con el id de ruta (UC-59-11)', async () => {
    const d = build();
    const dto = { embeddingModelVersionId: ID } as any;

    await d.controller.reEmbedCollection(ID, dto, actor);

    expect(d.pipelineService.reEmbedCollection).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el cambio de ciclo de vida (UC-59-13)', async () => {
    const d = build();
    const dto = { lifecycleState: 'sealed' } as any;

    await d.controller.updateCollectionLifecycle(ID, dto, actor);

    expect(d.governanceService.updateCollectionLifecycle).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});

describe('VectorRuntimeController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const pipelineService = {
      runEmbeddingJob: mockFn(async () => ({ jobId: ID })),
    };
    const retrievalService = {
      openSession: mockFn(async () => ({ id: ID })),
      rankCandidates: mockFn(async () => ({ candidates: [] })),
      materializeEvidence: mockFn(async () => ({ citations: 0 })),
      captureFeedback: mockFn(async () => ({ id: ID })),
    };
    const maintenanceService = {
      propagateDeletion: mockFn(async () => ({ id: ID })),
      reconcileCollection: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new VectorRuntimeController(
        pipelineService as any,
        retrievalService as any,
        maintenanceService as any,
      ),
      pipelineService,
      retrievalService,
      maintenanceService,
    };
  }

  it('delega la ejecución del job con el id de ruta (UC-59-05)', async () => {
    const d = build();
    const dto = { documents: [] } as any;

    await d.controller.runEmbeddingJob(ID, dto, actor);

    expect(d.pipelineService.runEmbeddingJob).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la apertura de la sesión (UC-59-06)', async () => {
    const d = build();
    const dto = { vectorCollectionId: ID } as any;

    await d.controller.openSession(dto, actor);

    expect(d.retrievalService.openSession).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el ranking con el id de sesión (UC-59-07)', async () => {
    const d = build();
    const dto = { candidates: [] } as any;

    await d.controller.rankCandidates(ID, dto, actor);

    expect(d.retrievalService.rankCandidates).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la evidencia con el id de sesión (UC-59-08)', async () => {
    const d = build();
    const dto = { citations: [] } as any;

    await d.controller.materializeEvidence(ID, dto, actor);

    expect(d.retrievalService.materializeEvidence).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el feedback con el id de sesión (UC-59-09)', async () => {
    const d = build();
    const dto = { feedbackType: 'relevance' } as any;

    await d.controller.captureFeedback(ID, dto, actor);

    expect(d.retrievalService.captureFeedback).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la propagación del borrado (UC-59-10)', async () => {
    const d = build();
    const dto = { tenantId: ID } as any;

    await d.controller.propagateDeletion(dto, actor);

    expect(d.maintenanceService.propagateDeletion).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la reconciliación con el id de colección (UC-59-12)', async () => {
    const d = build();
    const dto = { canonicalDocumentIds: [] } as any;

    await d.controller.reconcileCollection(ID, dto, actor);

    expect(d.maintenanceService.reconcileCollection).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
