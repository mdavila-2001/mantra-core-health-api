import request from 'supertest';
import { context, propagation, trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type ReadableSpan,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { bootstrapTestApp, type TestContext } from './harness';
import { MessagingTraceService, TracingService } from '../../src/observability';

/**
 * Trazabilidad sobre la aplicación REAL.
 *
 * Levanta el `AppModule` completo -mismos guards, pipes, interceptores, filtro
 * global y base de datos que producción- y verifica que los spans de negocio se
 * emiten de verdad desde el camino real de una petición HTTP, con los atributos
 * y eventos que el catálogo declara y sin filtrar información sensible.
 *
 * LÍMITE CONOCIDO Y DELIBERADO: la instrumentación **automática** (HTTP,
 * Express, `pg`, `ioredis`) no puede ejercitarse dentro de Jest. OpenTelemetry
 * la instala enganchando el cargador de módulos de Node, y Jest sustituye ese
 * cargador por su propio registro de módulos, así que el parcheo nunca llega a
 * aplicarse — no es un fallo de esta configuración, es una incompatibilidad
 * estructural conocida del ecosistema. Por eso aquí no se afirma nada sobre
 * spans de PostgreSQL, spans HTTP ni la cabecera `x-trace-id`: eso se verifica
 * contra procesos reales con `scripts/verify-jaeger.sh` (Fase 21), que es el
 * único sitio donde la afirmación sería honesta.
 */
describe('Observabilidad (integración)', () => {
  let ctx: TestContext;
  let exporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    exporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    provider.register({
      propagator: new CompositePropagator({
        propagators: [
          new W3CTraceContextPropagator(),
          new W3CBaggagePropagator(),
        ],
      }),
    });

    ctx = await bootstrapTestApp();
  }, 180_000);

  afterAll(async () => {
    await ctx?.app.close();
    await provider.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  beforeEach(() => exporter.reset());

  /** Spans terminados cuyo nombre coincide exactamente. */
  const byName = (name: string): ReadableSpan[] =>
    exporter.getFinishedSpans().filter((span) => span.name === name);

  describe('spans de negocio desde una petición HTTP real', () => {
    it('emite iam.authenticate con sus atributos y el motivo del rechazo', async () => {
      // Login fallido a propósito: recorre controller -> guard -> servicio ->
      // PostgreSQL sin depender de datos sembrados y sin crear ninguno.
      const response = await request(ctx.app.getHttpServer())
        .post('/iam/auth/login')
        .send({
          email: 'inexistente-observabilidad@example.invalid',
          password: 'credencial-invalida',
        });

      expect(response.status).toBe(401);

      const spans = byName('iam.authenticate');
      expect(spans).toHaveLength(1);
      expect(spans[0].attributes['app.module']).toBe('iam');
      expect(spans[0].attributes['app.operation']).toBe('authenticate');
      expect(spans[0].attributes['iam.auth.subject_kind']).toBe('email');
      expect(spans[0].ended).toBe(true);

      // El motivo real del rechazo queda en la traza; al cliente se le devuelve
      // el mismo 401 opaco para los cuatro caminos de fallo.
      const rejected = spans[0].events.find(
        (event) => event.name === 'auth.rejected',
      );
      expect(rejected?.attributes?.reason).toBe('no-credential');
    });

    it('el cuerpo de la respuesta de error no cambió al instrumentar', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/iam/auth/login')
        .send({ email: 'x@example.invalid', password: 'x'.repeat(12) });

      // Contrato de error preexistente, intacto.
      expect(response.body).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        path: '/iam/auth/login',
      });
      expect(response.body).not.toHaveProperty('stack');
    });

    it('una validación fallida sigue devolviendo 400 con su contrato', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/iam/auth/login')
        .send({ campoInexistente: true });

      expect(response.status).toBe(400);
      expect(response.body.code).toBeDefined();
    });
  });

  describe('privacidad', () => {
    it('ningún span expone contraseñas, correos, cabeceras de autenticación ni cuerpos', async () => {
      await request(ctx.app.getHttpServer())
        .post('/iam/auth/login')
        .set('Authorization', 'Bearer token-que-no-debe-viajar')
        .send({
          email: 'fuga-observabilidad@example.invalid',
          password: 'no-debe-aparecer-jamas',
        });

      const serialized = JSON.stringify(
        exporter.getFinishedSpans().map((span) => ({
          name: span.name,
          attributes: span.attributes,
          events: span.events,
        })),
      );

      expect(serialized).not.toContain('no-debe-aparecer-jamas');
      expect(serialized).not.toContain('token-que-no-debe-viajar');
      expect(serialized).not.toContain('fuga-observabilidad');
      expect(serialized.toLowerCase()).not.toContain('authorization');
    });
  });

  describe('exclusiones', () => {
    it('la sonda de liveness no produce ningún span de negocio', async () => {
      await request(ctx.app.getHttpServer()).get('/health').expect(200);

      expect(exporter.getFinishedSpans()).toHaveLength(0);
    });
  });

  describe('propagación por el outbox', () => {
    it('el contexto sobrevive al salto productor -> consumidor con la misma traza', async () => {
      const messaging = ctx.app.get(MessagingTraceService);
      const tracing = ctx.app.get(TracingService);

      // Productor: la API publica el evento con el contexto dentro.
      let carrier: Record<string, string> = {};
      let publishedTraceId = '';
      await tracing.runInSpan('scheduling.appointment.book', {}, async () => {
        await messaging.runInProducerSpan(
          'messaging.outbox publish',
          {},
          (_span, injected) => {
            carrier = injected;
          },
        );
      });
      publishedTraceId = byName('messaging.outbox publish')[0].spanContext()
        .traceId;
      expect(carrier.traceparent).toContain(publishedTraceId);

      // Consumidor: otro proceso, minutos después, recupera el contexto.
      await tracing.runInSpan('worker.messaging.outbox-relay', {}, async () => {
        await messaging.runInConsumerSpan(
          'messaging.outbox process',
          {},
          messaging.extract({ _trace: carrier }),
          () => undefined,
        );
      });

      const consumer = byName('messaging.outbox process')[0];
      expect(consumer.spanContext().traceId).toBe(publishedTraceId);
      expect(consumer.links).toHaveLength(1);
    });

    it('un evento antiguo sin _trace se procesa igual, sin fallar', async () => {
      const messaging = ctx.app.get(MessagingTraceService);

      await expect(
        messaging.runInConsumerSpan(
          'messaging.outbox process',
          {},
          messaging.extract({ payload: 'evento anterior a esta iniciativa' }),
          () => 'procesado',
        ),
      ).resolves.toBe('procesado');
    });
  });

  describe('servicios inyectables', () => {
    it('TracingService y MessagingTraceService están disponibles globalmente', () => {
      expect(ctx.app.get(TracingService)).toBeInstanceOf(TracingService);
      expect(ctx.app.get(MessagingTraceService)).toBeInstanceOf(
        MessagingTraceService,
      );
    });
  });
});
