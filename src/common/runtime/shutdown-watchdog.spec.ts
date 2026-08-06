import { jest } from '@jest/globals';
import {
  installShutdownWatchdog,
  resetShutdownWatchdogForTests,
} from './shutdown-watchdog';
import type { FatalLogger } from './process-guards';

function buildLogger() {
  return { fatal: jest.fn(), warn: jest.fn() } as unknown as FatalLogger & {
    fatal: jest.Mock;
  };
}

describe('installShutdownWatchdog', () => {
  let uninstall: () => void = () => undefined;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    uninstall();
    resetShutdownWatchdogForTests();
    jest.useRealTimers();
  });

  it('no hace nada mientras no llegue la señal', () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installShutdownWatchdog({
      logger,
      processName: 'api',
      timeoutMs: 1_000,
      exit,
    });

    jest.advanceTimersByTime(10_000);

    expect(exit).not.toHaveBeenCalled();
  });

  it('fuerza la salida si el apagado excede su plazo', () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installShutdownWatchdog({
      logger,
      processName: 'worker-messaging',
      timeoutMs: 1_000,
      exit,
    });

    process.emit('SIGTERM', 'SIGTERM');
    jest.advanceTimersByTime(1_000);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('deja escrito QUÉ seguía pendiente: es lo único que hace útil al log', () => {
    // Un `SIGKILL` del orquestador es mudo. La diferencia entre reincidir en el
    // mismo despliegue colgado y arreglarlo es esta línea.
    const logger = buildLogger();
    uninstall = installShutdownWatchdog({
      logger,
      processName: 'worker-billing',
      timeoutMs: 500,
      exit: jest.fn(),
      describePending: () => ({
        inFlightTicks: ['worker.billing.run-due-dunning'],
      }),
    });

    process.emit('SIGTERM', 'SIGTERM');
    jest.advanceTimersByTime(500);

    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({
        processName: 'worker-billing',
        signal: 'SIGTERM',
        pending: { inFlightTicks: ['worker.billing.run-due-dunning'] },
      }),
      expect.stringContaining('excedió su plazo'),
    );
  });

  it('una segunda señal no reinicia el plazo', () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installShutdownWatchdog({
      logger,
      processName: 'api',
      timeoutMs: 1_000,
      exit,
    });

    process.emit('SIGTERM', 'SIGTERM');
    jest.advanceTimersByTime(600);
    process.emit('SIGINT', 'SIGINT');
    jest.advanceTimersByTime(400);

    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('desarmarlo cancela el plazo pendiente', () => {
    const logger = buildLogger();
    const exit = jest.fn();
    const remove = installShutdownWatchdog({
      logger,
      processName: 'api',
      timeoutMs: 1_000,
      exit,
    });

    process.emit('SIGTERM', 'SIGTERM');
    remove();
    jest.advanceTimersByTime(5_000);

    expect(exit).not.toHaveBeenCalled();
  });
});
