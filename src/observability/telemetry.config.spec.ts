import { loadTelemetryConfig, resolveServiceName } from './telemetry.config';

/**
 * Pruebas de la configuración de telemetría. Todas operan sobre un entorno
 * inyectado, nunca sobre `process.env`, para que una prueba no contamine a otra.
 */
describe('telemetry.config', () => {
  describe('resolveServiceName', () => {
    it('deriva el nombre de la API del entrypoint principal', () => {
      expect(resolveServiceName('/app/dist/src/main.js')).toBe('redesa-api');
    });

    it('deriva el nombre de cada worker de su entrypoint', () => {
      expect(resolveServiceName('/app/dist/src/worker-messaging.js')).toBe(
        'redesa-worker-messaging',
      );
      expect(
        resolveServiceName('/app/dist/src/worker-cross_store_consistency.js'),
      ).toBe('redesa-worker-cross_store_consistency');
    });

    it('cae a la API cuando no hay entrypoint conocido', () => {
      expect(resolveServiceName(undefined)).toBe('redesa-api');
    });
  });

  describe('loadTelemetryConfig', () => {
    it('arranca deshabilitada por defecto', () => {
      const config = loadTelemetryConfig({});
      expect(config.enabled).toBe(false);
    });

    it('aplica los valores por defecto documentados', () => {
      const config = loadTelemetryConfig({ NODE_ENV: 'development' });

      expect(config.serviceNamespace).toBe('redesa');
      expect(config.environment).toBe('development');
      expect(config.exporter.protocol).toBe('http/protobuf');
      expect(config.exporter.endpoint).toBe('http://localhost:4318/v1/traces');
      expect(config.exporter.timeoutMs).toBe(10_000);
      expect(config.sampler).toEqual({
        type: 'parentbased_traceidratio',
        ratio: 1,
      });
      expect(config.propagators).toEqual(['tracecontext', 'baggage']);
      expect(config.diagLevel).toBe('ERROR');
      expect(config.responseHeaderEnabled).toBe(true);
    });

    it('respeta los valores explícitos del entorno', () => {
      const config = loadTelemetryConfig({
        OTEL_ENABLED: 'true',
        OTEL_SERVICE_NAME: 'redesa-worker-billing',
        OTEL_SERVICE_VERSION: '1.4.2',
        OTEL_DEPLOYMENT_ENVIRONMENT: 'staging',
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://jaeger:4318/v1/traces',
        OTEL_TRACES_SAMPLER: 'parentbased_always_on',
        OTEL_TRACES_SAMPLER_ARG: '0.25',
        OTEL_PROPAGATORS: 'tracecontext',
        OTEL_TRACE_RESPONSE_HEADER: 'false',
      });

      expect(config.enabled).toBe(true);
      expect(config.serviceName).toBe('redesa-worker-billing');
      expect(config.serviceVersion).toBe('1.4.2');
      expect(config.environment).toBe('staging');
      expect(config.exporter.endpoint).toBe('http://jaeger:4318/v1/traces');
      expect(config.sampler).toEqual({
        type: 'parentbased_always_on',
        ratio: 0.25,
      });
      expect(config.propagators).toEqual(['tracecontext']);
      expect(config.responseHeaderEnabled).toBe(false);
    });

    it('rechaza un muestreo fuera de rango en vez de degradar en silencio', () => {
      expect(() =>
        loadTelemetryConfig({ OTEL_TRACES_SAMPLER_ARG: '1.5' }),
      ).toThrow(/Configuración de telemetría inválida/);
    });

    it('rechaza una estrategia de muestreo desconocida', () => {
      expect(() =>
        loadTelemetryConfig({ OTEL_TRACES_SAMPLER: 'tail_sampling' }),
      ).toThrow(/Configuración de telemetría inválida/);
    });

    it('rechaza un protocolo sin exportador instalado', () => {
      expect(() =>
        loadTelemetryConfig({ OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc' }),
      ).toThrow(/Configuración de telemetría inválida/);
    });

    it('rechaza un endpoint que no es una URL', () => {
      expect(() =>
        loadTelemetryConfig({ OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'jaeger' }),
      ).toThrow(/Configuración de telemetría inválida/);
    });
  });
});
