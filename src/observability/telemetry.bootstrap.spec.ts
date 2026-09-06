import {
  AlwaysOffSampler,
  AlwaysOnSampler,
} from '@opentelemetry/sdk-trace-base';
import {
  buildPropagator,
  buildSampler,
  getTelemetryConfig,
  resetTelemetryForTests,
  startTelemetry,
} from './telemetry.bootstrap';
import { loadTelemetryConfig } from './telemetry.config';
import {
  registerTelemetryShutdown,
  resetShutdownStateForTests,
  shutdownTelemetry,
} from './telemetry.shutdown';

/**
 * Pruebas del arranque y el cierre del SDK.
 *
 * No se arranca un SDK real contra un exportador de red: se verifica lo propio
 * del proyecto (idempotencia, apagado, construcción de sampler y propagadores y
 * cierre limpio), que es lo que puede romperse aquí.
 */
describe('telemetry.bootstrap', () => {
  beforeEach(() => {
    resetTelemetryForTests();
    resetShutdownStateForTests();
  });

  afterAll(() => {
    resetTelemetryForTests();
    resetShutdownStateForTests();
  });

  describe('startTelemetry', () => {
    it('no crea SDK cuando la telemetría está deshabilitada', () => {
      expect(startTelemetry({ OTEL_ENABLED: 'false' })).toBeNull();
    });

    it('deja registrada la configuración leída aunque esté deshabilitada', () => {
      startTelemetry({
        OTEL_ENABLED: 'false',
        OTEL_SERVICE_NAME: 'alovida-api',
      });
      expect(getTelemetryConfig()?.serviceName).toBe('alovida-api');
      expect(getTelemetryConfig()?.enabled).toBe(false);
    });

    it('propaga un error de configuración en vez de arrancar mal configurado', () => {
      expect(() => startTelemetry({ OTEL_TRACES_SAMPLER_ARG: '9' })).toThrow(
        /Configuración de telemetría inválida/,
      );
    });
  });

  describe('buildSampler', () => {
    it('usa un muestreador basado en el padre por defecto', () => {
      const sampler = buildSampler(loadTelemetryConfig({}));
      expect(sampler.toString()).toContain('ParentBased');
      expect(sampler.toString()).toContain('TraceIdRatioBased{1}');
    });

    it('respeta el ratio configurado', () => {
      const sampler = buildSampler(
        loadTelemetryConfig({ OTEL_TRACES_SAMPLER_ARG: '0.1' }),
      );
      expect(sampler.toString()).toContain('TraceIdRatioBased{0.1}');
    });

    it('construye los muestreadores absolutos', () => {
      expect(
        buildSampler(loadTelemetryConfig({ OTEL_TRACES_SAMPLER: 'always_on' })),
      ).toBeInstanceOf(AlwaysOnSampler);
      expect(
        buildSampler(
          loadTelemetryConfig({ OTEL_TRACES_SAMPLER: 'always_off' }),
        ),
      ).toBeInstanceOf(AlwaysOffSampler);
    });
  });

  describe('buildPropagator', () => {
    it('activa tracecontext y baggage por defecto', () => {
      const propagator = buildPropagator(loadTelemetryConfig({}));
      expect(propagator.fields()).toEqual(
        expect.arrayContaining(['traceparent', 'tracestate', 'baggage']),
      );
    });

    it('omite baggage si no se declara', () => {
      const propagator = buildPropagator(
        loadTelemetryConfig({ OTEL_PROPAGATORS: 'tracecontext' }),
      );
      expect(propagator.fields()).not.toContain('baggage');
    });
  });

  describe('shutdownTelemetry', () => {
    it('cierra el SDK una sola vez', async () => {
      let calls = 0;
      const sdk = {
        shutdown: () => {
          calls += 1;
          return Promise.resolve();
        },
      };

      await shutdownTelemetry(sdk);
      await shutdownTelemetry(sdk);

      expect(calls).toBe(1);
    });

    it('no propaga un fallo de cierre ni termina el proceso', async () => {
      const sdk = {
        shutdown: () => Promise.reject(new Error('exportador caído')),
      };

      await expect(shutdownTelemetry(sdk)).resolves.toBeUndefined();
    });

    it('registra los manejadores de señal una sola vez', () => {
      const before = process.listenerCount('SIGTERM');
      const sdk = { shutdown: () => Promise.resolve() };

      registerTelemetryShutdown(sdk);
      registerTelemetryShutdown(sdk);

      expect(process.listenerCount('SIGTERM')).toBe(before + 1);
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
    });
  });
});
