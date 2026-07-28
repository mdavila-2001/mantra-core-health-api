import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { HealthContextController } from './health-context.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const COUNTRY = '22222222-2222-2222-2222-222222222222';
const DOMAIN = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const collectionService = {
    createAgent: mockFn(),
    createSource: mockFn(),
    createSchedule: mockFn(),
    startCollectionRun: mockFn(),
    recordObservation: mockFn(),
    finishCollectionRun: mockFn(),
  };
  const countryContextService = {
    createContext: mockFn(),
    draftVersion: mockFn(),
    recordQualityReview: mockFn(),
    publishVersion: mockFn(),
    supersedeVersion: mockFn(),
    resolveContext: mockFn(),
  };
  return {
    controller: new HealthContextController(
      collectionService as any,
      countryContextService as any,
    ),
    collectionService,
    countryContextService,
  };
}

describe('HealthContextController', () => {
  it('delegates registering the agent (UC-44-01)', async () => {
    const d = build();
    const dto = { code: 'x' } as any;
    d.collectionService.createAgent.mockResolvedValue({ id: ID });

    await d.controller.createAgent(dto, actor);

    expect(d.collectionService.createAgent).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates registering the source (UC-44-02)', async () => {
    const d = build();
    const dto = { code: 'x' } as any;
    d.collectionService.createSource.mockResolvedValue({ id: ID });

    await d.controller.createSource(dto, actor);

    expect(d.collectionService.createSource).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the schedule (UC-44-03)', async () => {
    const d = build();
    const dto = { agentId: ID } as any;
    d.collectionService.createSchedule.mockResolvedValue({ id: ID });

    await d.controller.createSchedule(dto, actor);

    expect(d.collectionService.createSchedule).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates creating the context (UC-44-04)', async () => {
    const d = build();
    const dto = { contextKey: 'x' } as any;
    d.countryContextService.createContext.mockResolvedValue({ id: ID });

    await d.controller.createContext(dto, actor);

    expect(d.countryContextService.createContext).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates starting the collection run (UC-44-05)', async () => {
    const d = build();
    const dto = { idempotencyKey: 'k', trigger: 'SCHEDULED' } as any;
    d.collectionService.startCollectionRun.mockResolvedValue({ id: ID });

    await d.controller.startCollectionRun(dto, actor);

    expect(d.collectionService.startCollectionRun).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates the observation with the run id (UC-44-06)', async () => {
    const d = build();
    const dto = { sourceId: ID } as any;
    d.collectionService.recordObservation.mockResolvedValue({ id: ID });

    await d.controller.recordObservation(ID, dto, actor);

    expect(d.collectionService.recordObservation).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates drafting the version with the context id (UC-44-07)', async () => {
    const d = build();
    const dto = { collectionRunId: ID, facts: [] } as any;
    d.countryContextService.draftVersion.mockResolvedValue({ id: ID });

    await d.controller.draftContextVersion(ID, dto, actor);

    expect(d.countryContextService.draftVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the quality review (UC-44-08)', async () => {
    const d = build();
    const dto = { outcome: 'APPROVED' } as any;
    d.countryContextService.recordQualityReview.mockResolvedValue({ id: ID });

    await d.controller.recordQualityReview(ID, dto, actor);

    expect(d.countryContextService.recordQualityReview).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates publishing with only the version id (UC-44-09)', async () => {
    const d = build();
    d.countryContextService.publishVersion.mockResolvedValue({ id: ID });

    await d.controller.publishVersion(ID, actor);

    expect(d.countryContextService.publishVersion).toHaveBeenCalledWith(
      ID,
      actor,
    );
  });

  it('delegates finishing the run (UC-44-10)', async () => {
    const d = build();
    const dto = { outcome: 'SUCCEEDED' } as any;
    d.collectionService.finishCollectionRun.mockResolvedValue({ id: ID });

    await d.controller.finishCollectionRun(ID, dto, actor);

    expect(d.collectionService.finishCollectionRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates superseding the version (UC-44-11)', async () => {
    const d = build();
    const dto = { mode: 'EXPIRED', reason: 'x' } as any;
    d.countryContextService.supersedeVersion.mockResolvedValue({ id: ID });

    await d.controller.supersedeVersion(ID, dto, actor);

    expect(d.countryContextService.supersedeVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the resolution with the query parameters (UC-44-12)', async () => {
    const d = build();
    d.countryContextService.resolveContext.mockResolvedValue({ contextId: ID });

    await d.controller.resolveContext(COUNTRY, DOMAIN, 'inmunizacion');

    expect(d.countryContextService.resolveContext).toHaveBeenCalledWith(
      COUNTRY,
      DOMAIN,
      'inmunizacion',
    );
  });
});
