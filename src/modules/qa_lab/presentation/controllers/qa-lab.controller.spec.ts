import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QaLabController } from './qa-lab.controller';

const actor = { id: 'user-1', roles: ['QA_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const CASE = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const catalogService = {
    createEnvironment: mockFn(),
    createTestCase: mockFn(),
    publishSuite: mockFn(),
    createSchedule: mockFn(),
  };
  const runsService = {
    createRun: mockFn(),
    executeCase: mockFn(),
    evaluateResult: mockFn(),
    finalizeRun: mockFn(),
    attachArtifact: mockFn(),
    registerDefect: mockFn(),
    triageDefect: mockFn(),
    linkRelease: mockFn(),
  };
  return {
    controller: new QaLabController(catalogService as any, runsService as any),
    catalogService,
    runsService,
  };
}

describe('QaLabController', () => {
  it('delegates environment registration (UC-36-01)', async () => {
    const d = build();
    const dto = { code: 'ENV-1' } as any;
    d.catalogService.createEnvironment.mockResolvedValue({ id: ID });

    await d.controller.createEnvironment(dto, actor);

    expect(d.catalogService.createEnvironment).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates case definition and suite publication (UC-36-02, UC-36-03)', async () => {
    const d = build();
    const caseDto = { code: 'CASE-1', assertions: [] } as any;
    const publishDto = {} as any;
    d.catalogService.createTestCase.mockResolvedValue({ id: ID });
    d.catalogService.publishSuite.mockResolvedValue({ version: 2 });

    await d.controller.createTestCase(ID, caseDto, actor);
    await d.controller.publishSuite(ID, publishDto, actor);

    expect(d.catalogService.createTestCase).toHaveBeenCalledWith(
      ID,
      caseDto,
      actor,
    );
    expect(d.catalogService.publishSuite).toHaveBeenCalledWith(
      ID,
      publishDto,
      actor,
    );
  });

  it('delegates the run (UC-36-04)', async () => {
    const d = build();
    const dto = { suiteId: ID } as any;
    d.runsService.createRun.mockResolvedValue({ id: ID });

    await d.controller.createRun(dto, actor);

    expect(d.runsService.createRun).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates case execution with both route ids (UC-36-05)', async () => {
    const d = build();
    const dto = { requestBodyJson: {}, responseBodyJson: {} } as any;
    d.runsService.executeCase.mockResolvedValue({ id: ID });

    await d.controller.executeCase(ID, CASE, dto, actor);

    expect(d.runsService.executeCase).toHaveBeenCalledWith(
      ID,
      CASE,
      dto,
      actor,
    );
  });

  it('delegates evaluation and finalization without a body (UC-36-06, UC-36-07)', async () => {
    const d = build();
    d.runsService.evaluateResult.mockResolvedValue({ id: ID });
    d.runsService.finalizeRun.mockResolvedValue({ id: ID });

    await d.controller.evaluateResult(ID, actor);
    await d.controller.finalizeRun(ID, actor);

    expect(d.runsService.evaluateResult).toHaveBeenCalledWith(ID, actor);
    expect(d.runsService.finalizeRun).toHaveBeenCalledWith(ID, actor);
  });

  it('delegates artifact attachment (UC-36-08)', async () => {
    const d = build();
    const dto = { artifactType: 'JUNIT', fileId: ID } as any;
    d.runsService.attachArtifact.mockResolvedValue({ id: ID });

    await d.controller.attachArtifact(ID, dto, actor);

    expect(d.runsService.attachArtifact).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates defect registration and triage (UC-36-09, UC-36-10)', async () => {
    const d = build();
    const registerDto = { testCaseId: ID } as any;
    const triageDto = { status: 'TRIAGED' } as any;
    d.runsService.registerDefect.mockResolvedValue({ id: ID });
    d.runsService.triageDefect.mockResolvedValue({ id: ID });

    await d.controller.registerDefect(registerDto, actor);
    await d.controller.triageDefect(ID, triageDto, actor);

    expect(d.runsService.registerDefect).toHaveBeenCalledWith(
      registerDto,
      actor,
    );
    expect(d.runsService.triageDefect).toHaveBeenCalledWith(
      ID,
      triageDto,
      actor,
    );
  });

  it('delegates the schedule (UC-36-11)', async () => {
    const d = build();
    const dto = { suiteId: ID, code: 'NIGHTLY' } as any;
    d.catalogService.createSchedule.mockResolvedValue({ id: ID });

    await d.controller.createSchedule(dto, actor);

    expect(d.catalogService.createSchedule).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the release link (UC-36-12)', async () => {
    const d = build();
    const dto = { gitRef: 'refs/tags/v1' } as any;
    d.runsService.linkRelease.mockResolvedValue({ id: ID });

    await d.controller.linkRelease(ID, dto, actor);

    expect(d.runsService.linkRelease).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.runsService.createRun.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.createRun({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
