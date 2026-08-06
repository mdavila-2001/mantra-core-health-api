import { jest } from '@jest/globals';
import {
  installProcessGuards,
  resetProcessGuardsForTests,
  type FatalLogger,
} from './process-guards';

function buildLogger(): FatalLogger & {
  fatal: jest.Mock;
  warn: jest.Mock;
} {
  return { fatal: jest.fn(), warn: jest.fn() } as unknown as FatalLogger & {
    fatal: jest.Mock;
    warn: jest.Mock;
  };
}

/** Cede el control al bucle de eventos para que corra el `finally` del vaciado. */
const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe('installProcessGuards', () => {
  let uninstall: () => void = () => undefined;

  afterEach(() => {
    uninstall();
    resetProcessGuardsForTests();
  });

  it('registra la excepción no capturada de forma estructurada y termina', async () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit,
      flushTimeoutMs: 5,
    });

    process.emit('uncaughtException', new Error('boom'));
    await flushMicrotasks();

    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'uncaughtException',
        processName: 'api',
      }),
      expect.stringContaining('Excepción no capturada'),
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('registra la promesa rechazada sin manejador y termina', async () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installProcessGuards({
      logger,
      processName: 'worker-messaging',
      exit,
      flushTimeoutMs: 5,
    });

    process.emit(
      'unhandledRejection',
      new Error('sin manejador'),
      Promise.resolve(),
    );
    await flushMicrotasks();

    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'unhandledRejection' }),
      expect.stringContaining('Promesa rechazada'),
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('vacía los búferes antes de salir', async () => {
    const logger = buildLogger();
    const exit = jest.fn();
    const onFatal = jest.fn(() => Promise.resolve());
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit,
      onFatal,
      flushTimeoutMs: 50,
    });

    process.emit('uncaughtException', new Error('boom'));
    await flushMicrotasks();

    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('sale igual si el vaciado falla: no convierte una caída en un proceso zombi', async () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit,
      onFatal: () =>
        Promise.reject(new Error('el exportador tampoco responde')),
      flushTimeoutMs: 5,
    });

    process.emit('uncaughtException', new Error('boom'));
    await flushMicrotasks();

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('un segundo fallo durante el apagado no reentra', async () => {
    const logger = buildLogger();
    const exit = jest.fn();
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit,
      flushTimeoutMs: 5,
    });

    process.emit('uncaughtException', new Error('primero'));
    process.emit('uncaughtException', new Error('segundo'));
    await flushMicrotasks();

    expect(logger.fatal).toHaveBeenCalledTimes(1);
  });

  it('puentea los avisos del runtime, que si no salen sin estructura', () => {
    const logger = buildLogger();
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit: jest.fn(),
    });

    const warning = new Error('11 listeners added');
    warning.name = 'MaxListenersExceededWarning';
    process.emit('warning', warning);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ warningName: 'MaxListenersExceededWarning' }),
      'Aviso del runtime de Node',
    );
  });

  it('es idempotente: una segunda instalación no duplica manejadores', () => {
    const logger = buildLogger();
    uninstall = installProcessGuards({
      logger,
      processName: 'api',
      exit: jest.fn(),
    });
    const second = installProcessGuards({
      logger,
      processName: 'api',
      exit: jest.fn(),
    });

    const warning = new Error('aviso');
    process.emit('warning', warning);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    second();
  });
});
