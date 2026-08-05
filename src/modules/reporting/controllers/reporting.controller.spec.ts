import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReportingController } from './reporting.controller';

const actor = { id: 'user-1', roles: ['REPORTING_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const definitionsService = {
    createDataSource: mockFn(),
    createDefinition: mockFn(),
    publishVersion: mockFn(),
    createDashboard: mockFn(),
    deprecateDefinition: mockFn(),
  };
  const runsService = {
    createExecution: mockFn(),
    materializeSnapshot: mockFn(),
    createSchedule: mockFn(),
    schedulerTick: mockFn(),
    dispatchDistributions: mockFn(),
    subscribe: mockFn(),
    retryExecution: mockFn(),
  };
  return {
    controller: new ReportingController(
      definitionsService as any,
      runsService as any,
    ),
    definitionsService,
    runsService,
  };
}

describe('ReportingController', () => {
  it('delegates data source registration (UC-39-01)', async () => {
    const d = build();
    const dto = { code: 'DS-1' } as any;
    d.definitionsService.createDataSource.mockResolvedValue({ id: ID });

    await d.controller.createDataSource(dto, actor);

    expect(d.definitionsService.createDataSource).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates definition authoring (UC-39-02)', async () => {
    const d = build();
    const dto = { code: 'REP-1' } as any;
    d.definitionsService.createDefinition.mockResolvedValue({ id: ID });

    await d.controller.createDefinition(dto, actor);

    expect(d.definitionsService.createDefinition).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates version publication with the route id (UC-39-03)', async () => {
    const d = build();
    const dto = { changeNote: 'nota' } as any;
    d.definitionsService.publishVersion.mockResolvedValue({ version: 2 });

    await d.controller.publishVersion(ID, dto, actor);

    expect(d.definitionsService.publishVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates execution and snapshot (UC-39-04, UC-39-05)', async () => {
    const d = build();
    const execDto = {} as any;
    const snapDto = { storageUri: 's3://x' } as any;
    d.runsService.createExecution.mockResolvedValue({ id: ID });
    d.runsService.materializeSnapshot.mockResolvedValue({ id: ID });

    await d.controller.createExecution(ID, execDto, actor);
    await d.controller.materializeSnapshot(ID, snapDto, actor);

    expect(d.runsService.createExecution).toHaveBeenCalledWith(
      ID,
      execDto,
      actor,
    );
    expect(d.runsService.materializeSnapshot).toHaveBeenCalledWith(
      ID,
      snapDto,
      actor,
    );
  });

  it('delegates schedule creation and the tick (UC-39-06, UC-39-07)', async () => {
    const d = build();
    const scheduleDto = { name: 'Mensual' } as any;
    const tickDto = {} as any;
    d.runsService.createSchedule.mockResolvedValue({ id: ID });
    d.runsService.schedulerTick.mockResolvedValue({ scanned: 0 });

    await d.controller.createSchedule(ID, scheduleDto, actor);
    await d.controller.schedulerTick(tickDto, actor);

    expect(d.runsService.createSchedule).toHaveBeenCalledWith(
      ID,
      scheduleDto,
      actor,
    );
    expect(d.runsService.schedulerTick).toHaveBeenCalledWith(tickDto, actor);
  });

  it('delegates distribution and subscription (UC-39-08, UC-39-09)', async () => {
    const d = build();
    const dispatchDto = {} as any;
    const subscribeDto = { channelId: ID } as any;
    d.runsService.dispatchDistributions.mockResolvedValue({ created: 1 });
    d.runsService.subscribe.mockResolvedValue({ id: ID });

    await d.controller.dispatchDistributions(ID, dispatchDto, actor);
    await d.controller.subscribe(ID, subscribeDto, actor);

    expect(d.runsService.dispatchDistributions).toHaveBeenCalledWith(
      ID,
      dispatchDto,
      actor,
    );
    expect(d.runsService.subscribe).toHaveBeenCalledWith(
      ID,
      subscribeDto,
      actor,
    );
  });

  it('delegates dashboard composition (UC-39-10)', async () => {
    const d = build();
    const dto = { code: 'DASH-1' } as any;
    d.definitionsService.createDashboard.mockResolvedValue({ id: ID });

    await d.controller.createDashboard(dto, actor);

    expect(d.definitionsService.createDashboard).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates the retry (UC-39-11)', async () => {
    const d = build();
    const dto = { requeueDistributions: true } as any;
    d.runsService.retryExecution.mockResolvedValue({ id: ID });

    await d.controller.retryExecution(ID, dto, actor);

    expect(d.runsService.retryExecution).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates deprecation (UC-39-12)', async () => {
    const d = build();
    const dto = { reason: 'motivo' } as any;
    d.definitionsService.deprecateDefinition.mockResolvedValue({ id: ID });

    await d.controller.deprecateDefinition(ID, dto, actor);

    expect(d.definitionsService.deprecateDefinition).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.runsService.schedulerTick.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.schedulerTick({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
