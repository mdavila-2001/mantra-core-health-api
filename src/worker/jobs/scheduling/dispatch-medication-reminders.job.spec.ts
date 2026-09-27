import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DispatchMedicationRemindersJob } from './dispatch-medication-reminders.job';
import { SchedulingWorkerModule } from './scheduling.worker-module';

function build(response: unknown) {
  const api = { post: mockFn(() => Promise.resolve(response)) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    debug: mockFn(),
  };
  const job = new DispatchMedicationRemindersJob(api as any, logger as any);
  return { job, api, logger };
}

describe('DispatchMedicationRemindersJob', () => {
  it('llama al endpoint interno con la ventana de 15 minutos', async () => {
    const d = build({ processed: 1, detail: 'avisos=1' });
    await d.job.tick();
    expect(d.api.post).toHaveBeenCalledWith(
      '/clinical/internal/medication-reminders/dispatch',
      { windowMinutes: 15, limit: 200 },
    );
    expect(d.logger.info).toHaveBeenCalledWith(
      {
        operation: 'worker.clinical.dispatch-medication-reminders',
        processed: 1,
      },
      'Dispatched medication dose reminders',
    );
  });

  it('sin avisos no escribe en el log de info', async () => {
    const d = build({ processed: 0, detail: '' });
    await d.job.tick();
    expect(d.logger.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ processed: 0 }),
      expect.anything(),
    );
  });

  it('un fallo de la API no escapa del tick', async () => {
    const d = build(undefined);
    d.api.post.mockRejectedValue(new Error('api caída'));
    await expect(d.job.tick()).resolves.toBeUndefined();
  });

  it('está registrado en el proceso worker de scheduling', () => {
    const providers = Reflect.getMetadata('providers', SchedulingWorkerModule);
    expect(providers).toContain(DispatchMedicationRemindersJob);
  });
});
