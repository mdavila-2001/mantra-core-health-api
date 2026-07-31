import {
  buildInstrumentations,
  isExcludedPath,
  redisStatementSerializer,
} from './instrumentations';

/**
 * Pruebas de la selección de instrumentaciones: qué se excluye de la traza y
 * qué se permite escribir como `db.statement`. Ambas son decisiones de
 * privacidad y de coste, no detalles de implementación.
 */
describe('instrumentations', () => {
  describe('isExcludedPath', () => {
    it.each([
      '/health',
      '/healthz',
      '/metrics',
      '/favicon.ico',
      '/docs',
      '/docs-json',
      '/reference',
    ])('excluye %s', (path) => {
      expect(isExcludedPath(path)).toBe(true);
    });

    it('excluye subrutas de la documentación', () => {
      expect(isExcludedPath('/docs/swagger-ui.css')).toBe(true);
    });

    it('ignora la query string al comparar', () => {
      expect(isExcludedPath('/health?verbose=1')).toBe(true);
    });

    it('no excluye rutas de negocio que empiezan igual', () => {
      expect(isExcludedPath('/health-context/episodes')).toBe(false);
      expect(isExcludedPath('/iam/users')).toBe(false);
    });

    it('tolera una URL ausente', () => {
      expect(isExcludedPath(undefined)).toBe(false);
    });
  });

  describe('redisStatementSerializer', () => {
    it('emite solo el comando, nunca las claves ni los valores', () => {
      expect(redisStatementSerializer('GET')).toBe('GET');
      expect(redisStatementSerializer('SET')).toBe('SET');
    });
  });

  describe('buildInstrumentations', () => {
    it('activa exactamente las siete instrumentaciones de tecnologías presentes', () => {
      const names = buildInstrumentations().map(
        (instrumentation) => instrumentation.instrumentationName,
      );

      expect(names).toEqual([
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-express',
        '@opentelemetry/instrumentation-nestjs-core',
        '@opentelemetry/instrumentation-pg',
        '@opentelemetry/instrumentation-ioredis',
        '@opentelemetry/instrumentation-mongodb',
        '@opentelemetry/instrumentation-undici',
      ]);
    });

    it('no activa instrumentaciones ruidosas ni de tecnologías ausentes', () => {
      const names = buildInstrumentations().map(
        (instrumentation) => instrumentation.instrumentationName,
      );

      for (const excluded of ['-fs', '-dns', '-net', '-pino', '-kafkajs']) {
        expect(names.some((name) => name.endsWith(excluded))).toBe(false);
      }
    });
  });
});
