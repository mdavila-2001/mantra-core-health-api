import 'reflect-metadata';
import type { IncomingMessage } from 'node:http';
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import { getIncomingRequestAttributes } from '@opentelemetry/instrumentation-http/build/src/utils';
import {
  buildInstrumentations,
  isExcludedPath,
  redisStatementSerializer,
  shareTokenSafeIncomingAttributes,
  withShareTokenSafeUrl,
} from './instrumentations';
import { setupTestTracer } from './tracer.testing';

/** Un token con la forma de los emitidos (43 caracteres base64url), sintético. */
const TOKEN = 'Q2hhbmdlTWVQbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';

/** Una petición entrante mínima, como la ve la instrumentación HTTP. */
function incoming(url: string): IncomingMessage {
  return {
    url,
    method: 'GET',
    headers: { host: 'api.alovida.test' },
    httpVersion: '1.1',
    socket: { remoteAddress: '127.0.0.1', remotePort: 50000 },
  } as unknown as IncomingMessage;
}

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

  describe('token del enlace compartido de receta en las trazas (S-6)', () => {
    it.each([
      `/public/prescription-shares/${TOKEN}`,
      `/pharmacy/prescription-shares/${TOKEN}?x=1`,
      `/clinical/prescription-shares/by-token/${TOKEN}`,
      `/PUBLIC/Prescription-Shares/${TOKEN}`,
    ])('el span HTTP de %s recibe url.path con [token]', (url) => {
      const attributes = shareTokenSafeIncomingAttributes(incoming(url));
      expect(attributes['url.path']).toMatch(/\/\[token\]$/);
      expect(JSON.stringify(attributes)).not.toContain(TOKEN);
    });

    it('otra ruta no pisa ningún atributo', () => {
      expect(
        shareTokenSafeIncomingAttributes(
          incoming('/clinical/prescription-shares?patientProfileId=x'),
        ),
      ).toEqual({});
    });

    it('la instrumentación HTTP usa el hook, y la versión instalada lo aplica sobre url.path', () => {
      const http = buildInstrumentations()[0];
      const config = http.getConfig() as HttpInstrumentationConfig;
      expect(config.startIncomingSpanHook).toBe(
        shareTokenSafeIncomingAttributes,
      );

      const request = incoming(`/public/prescription-shares/${TOKEN}?a=1`);
      const attributes = getIncomingRequestAttributes(
        request,
        {
          component: 'http',
          enableSyntheticSourceDetection: false,
          hookAttributes: shareTokenSafeIncomingAttributes(request),
        },
        { debug: () => undefined } as never,
      );
      expect(attributes['url.path']).toBe(
        '/public/prescription-shares/[token]',
      );
      expect(JSON.stringify(attributes)).not.toContain(TOKEN);
    });

    it('withShareTokenSafeUrl redacta url.full y deja igual lo demás', () => {
      const options = {
        attributes: {
          'url.full': `/public/prescription-shares/${TOKEN}`,
          'http.route': '/public/prescription-shares/:token',
        },
      };
      expect(withShareTokenSafeUrl(options)).toEqual({
        attributes: {
          'url.full': '/public/prescription-shares/[token]',
          'http.route': '/public/prescription-shares/:token',
        },
      });
      const other = { attributes: { 'url.full': '/iam/users' } };
      expect(withShareTokenSafeUrl(other)).toBe(other);
      expect(withShareTokenSafeUrl(undefined)).toBeUndefined();
    });

    describe('el span del handler de Nest', () => {
      const tracer = setupTestTracer();

      afterAll(async () => {
        await tracer.shutdown();
      });

      it('lleva url.full con [token], con la instrumentación instalada parcheando el handler', async () => {
        const nest = buildInstrumentations().find(
          (instrumentation) =>
            instrumentation.instrumentationName ===
            '@opentelemetry/instrumentation-nestjs-core',
        );
        const definition = (
          nest as unknown as {
            init(): {
              files: Array<{
                name: string;
                patch(exports: unknown, version: string): unknown;
              }>;
            };
          }
        ).init();
        const file = definition.files.find((candidate) =>
          candidate.name.endsWith('router-execution-context.js'),
        );

        class RouterExecutionContext {
          create(
            _instance: unknown,
            callback: (...args: unknown[]) => unknown,
          ): (...args: unknown[]) => unknown {
            return (...args: unknown[]) => callback(...args);
          }
        }
        file?.patch({ RouterExecutionContext }, '11.0.0');

        class SharesController {
          read(): string {
            return 'ok';
          }
        }
        const controller = new SharesController();
        const handler = new RouterExecutionContext().create(
          controller,
          // eslint-disable-next-line @typescript-eslint/unbound-method -- lo invoca el handler parcheado
          SharesController.prototype.read,
        );
        await handler(
          {
            method: 'GET',
            originalUrl: `/public/prescription-shares/${TOKEN}`,
            route: { path: '/public/prescription-shares/:token' },
          },
          {},
          () => undefined,
        );

        const span = tracer.find('SharesController.read');
        expect(span?.attributes['url.full']).toBe(
          '/public/prescription-shares/[token]',
        );
        expect(span?.attributes['http.route']).toBe(
          '/public/prescription-shares/:token',
        );
        expect(
          JSON.stringify(tracer.spans().map((s) => s.attributes)),
        ).not.toContain(TOKEN);
      });
    });
  });
});
