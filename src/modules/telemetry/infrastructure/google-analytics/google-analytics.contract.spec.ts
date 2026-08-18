import { jest } from '@jest/globals';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { GoogleAnalyticsHttpClient } from './google-analytics-http.client';
import { GoogleAnalyticsAdapter } from './google-analytics.adapter';
import { TelemetryWebAnalyticsService } from '../../services/telemetry-web-analytics.service';
import { TelemetryEventsService } from '../../services/telemetry-events.service';

/**
 * Contrato de extremo a extremo contra un colector que habla el Measurement
 * Protocol real.
 *
 * No hay dobles del cliente HTTP: el adaptador construye el payload, axios lo
 * envía por TCP y un servidor local —que responde como responde Google: `204
 * No Content` sin cuerpo— lo recibe. Lo que se afirma aquí es exactamente lo
 * que vería Google: la ruta, las credenciales en la query y el JSON del cuerpo.
 *
 * La configuración se lee del entorno al **construir** el adaptador, no al
 * importarlo, así que cada prueba fija sus variables antes de instanciarlo.
 */

/** Petición capturada por el colector local. */
interface CapturedRequest {
  /**
   * Método HTTP.
   */
  method: string;
  /**
   * Ruta sin query string.
   */
  path: string;
  /**
   * Parámetros de la query.
   */
  query: Record<string, string>;
  /**
   * Cuerpo ya deserializado.
   */
  body: any;
  /**
   * Cabeceras recibidas.
   */
  headers: Record<string, string | string[] | undefined>;
}

/** Colector local que imita el endpoint de recolección de GA4. */
class FakeGa4Collector {
  readonly requests: CapturedRequest[] = [];
  private server?: Server;
  private responses: { status: number; body?: unknown }[] = [];

  /**
   * Arranca el colector en un puerto efímero.
   *
   * @returns URL base sobre la que apuntar `GA4_ENDPOINT`.
   */
  async start(): Promise<string> {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        this.requests.push({
          method: req.method ?? '',
          path: url.pathname,
          query: Object.fromEntries(url.searchParams.entries()),
          body: chunks.length
            ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
            : undefined,
          headers: req.headers,
        });
        const next = this.responses.shift() ?? { status: 204 };
        if (next.body === undefined) {
          res.writeHead(next.status);
          res.end();
          return;
        }
        res.writeHead(next.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(next.body));
      });
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
    const { port } = this.server!.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  /**
   * Programa las respuestas que devolverá, en orden.
   *
   * @param responses - Respuestas a encolar.
   */
  reply(...responses: { status: number; body?: unknown }[]): void {
    this.responses.push(...responses);
  }

  /** Detiene el colector. */
  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}

/**
 * Crea un mock tipado sin arrastrar las firmas de jest a cada llamada.
 *
 * @param impl - Implementación inicial opcional.
 * @returns Función mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Logger silencioso con la superficie que usan los servicios. */
const silentLogger = (): any => ({
  setContext: mockFn(),
  info: mockFn(),
  warn: mockFn(),
  error: mockFn(),
});

describe('Google Analytics Measurement Protocol (contract)', () => {
  const original = { ...process.env };
  let collector: FakeGa4Collector;

  beforeEach(async () => {
    collector = new FakeGa4Collector();
    const baseUrl = await collector.start();
    process.env.TELEMETRY_WEB_ANALYTICS_ENABLED = 'true';
    process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER = 'google_analytics';
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT = 'contract-test-salt-xx';
    process.env.TELEMETRY_WEB_ANALYTICS_SITE_URL = 'https://portal.example';
    process.env.TELEMETRY_WEB_ANALYTICS_MAX_RETRIES = '1';
    process.env.TELEMETRY_WEB_ANALYTICS_RETRY_BASE_MS = '50';
    process.env.GA4_MEASUREMENT_ID = 'G-CONTRACT1';
    process.env.GA4_API_SECRET = 'contract-secret';
    process.env.GA4_ENDPOINT = baseUrl;
    delete process.env.GA4_DEBUG_VALIDATION;
  });

  afterEach(async () => {
    await collector.stop();
    process.env = { ...original };
  });

  /**
   * Construye el adaptador real con la configuración del entorno vigente.
   *
   * @returns Adaptador listo para enviar contra el colector local.
   */
  function realAdapter(): GoogleAnalyticsAdapter {
    return new GoogleAnalyticsAdapter(
      new GoogleAnalyticsHttpClient(),
      silentLogger(),
    );
  }

  it('sends a real request that GA4 would accept', async () => {
    const adapter = realAdapter();

    const result = await adapter.track({
      identity: { subjectKey: 'subject-1', sessionKey: 'journey-1' },
      tenantId: 'tenant-1',
      consent: { analytics: true },
      events: [
        {
          name: 'page_view',
          occurredAt: new Date(),
          params: { route_template: '/doctores/:id' },
        },
      ],
    });

    expect(result).toMatchObject({ delivered: 1, dropped: 0, requests: 1 });
    expect(collector.requests).toHaveLength(1);
    const request = collector.requests[0];
    expect(request.method).toBe('POST');
    expect(request.path).toBe('/mp/collect');
    expect(request.query).toEqual({
      measurement_id: 'G-CONTRACT1',
      api_secret: 'contract-secret',
    });
    expect(request.headers['content-type']).toContain('application/json');
    expect(request.body).toMatchObject({
      client_id: expect.stringMatching(/^\d+\.\d+$/u),
      timestamp_micros: expect.any(Number),
      consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
      events: [
        {
          name: 'page_view',
          params: {
            route_template: '/doctores/:id',
            session_id: expect.any(Number),
            engagement_time_msec: 1,
          },
        },
      ],
    });
    // Ningún identificador interno viaja en claro.
    expect(JSON.stringify(request.body)).not.toContain('subject-1');
    expect(JSON.stringify(request.body)).not.toContain('journey-1');
  });

  it('retries a 503 and delivers on the second attempt', async () => {
    collector.reply({ status: 503 }, { status: 204 });
    const adapter = realAdapter();

    const result = await adapter.track({
      identity: { subjectKey: 'subject-1' },
      events: [{ name: 'page_view', occurredAt: new Date() }],
    });

    expect(collector.requests).toHaveLength(2);
    expect(result.delivered).toBe(1);
  });

  it('does not retry a 400 and keeps the failure contained', async () => {
    collector.reply({ status: 400 }, { status: 204 });
    const adapter = realAdapter();

    const result = await adapter.track({
      identity: { subjectKey: 'subject-1' },
      events: [{ name: 'page_view', occurredAt: new Date() }],
    });

    expect(collector.requests).toHaveLength(1);
    expect(result).toMatchObject({ delivered: 0, dropped: 1 });
  });

  it('reads GA4 validation messages in debug mode', async () => {
    process.env.GA4_DEBUG_VALIDATION = 'true';
    collector.reply({
      status: 200,
      body: {
        validationMessages: [
          {
            fieldPath: 'events',
            description: 'Measurement id not found',
            validationCode: 'NO_VALID_MEASUREMENT_ID',
          },
        ],
      },
    });
    const adapter = realAdapter();

    const result = await adapter.track({
      identity: { subjectKey: 'subject-1' },
      events: [{ name: 'page_view', occurredAt: new Date() }],
    });

    expect(collector.requests[0].path).toBe('/debug/mp/collect');
    expect(result.validationMessages?.[0]).toContain('NO_VALID_MEASUREMENT_ID');
  });

  it('splits a 60 event batch into the 25 event requests GA4 accepts', async () => {
    const adapter = realAdapter();
    const occurredAt = new Date();

    const result = await adapter.track({
      identity: { subjectKey: 'subject-1' },
      events: Array.from({ length: 60 }, (_, i) => ({
        name: `custom_event_${i}`,
        occurredAt,
      })),
    });

    expect(result).toMatchObject({ delivered: 60, dropped: 0, requests: 3 });
    expect(collector.requests.map((r) => r.body.events.length)).toEqual([
      25, 25, 10,
    ]);
  });

  it('carries an ingested activity event all the way to the wire', async () => {
    // Cadena completa y real: servicio de ingesta -> reenvío -> adaptador ->
    // axios -> colector. Sólo la persistencia está doblada.
    const forwarder = new TelemetryWebAnalyticsService(
      realAdapter(),
      silentLogger(),
    );
    const tx = { flush: mockFn(async () => undefined) };
    const service = new TelemetryEventsService(
      { transactional: mockFn((cb: any) => cb(tx)) } as any,
      {
        findById: mockFn(async () => ({
          id: 'schema-1',
          eventName: 'doctor_profile_viewed',
          purposeDefinitionId: 'purpose-1',
        })),
      } as any,
      {
        findByIdempotencyKey: mockFn(async () => null),
        create: mockFn(() => ({ id: 'event-1' })),
      } as any,
      { create: mockFn() } as any,
      {
        findById: mockFn(async () => null),
        findOpenBySession: mockFn(async () => null),
        create: mockFn(() => ({ id: 'journey-1', eventCount: 0 })),
      } as any,
      { create: mockFn() } as any,
      { create: mockFn() } as any,
      { findById: mockFn() } as any,
      { findExisting: mockFn(), create: mockFn() } as any,
      { findById: mockFn() } as any,
      { findLatest: mockFn() } as any,
      forwarder,
      silentLogger(),
    );

    const response = await service.captureActivityEvents({
      events: [
        {
          eventSchemaDefinitionId: 'schema-1',
          sessionId: '9f1c1f2e-1f7a-4d1c-9a1e-4d2b6c8e0a11',
          analyticsSubjectId: '3f6d2b1a-7c4e-4b6a-9f2d-1c8b5e7a0d33',
          routeTemplate: '/doctores/:id',
          tenantId: 'tenant-1',
        },
      ],
    });
    await forwarder.whenIdle();

    expect(response.inserted).toBe(1);
    expect(collector.requests).toHaveLength(1);
    expect(collector.requests[0].body.events[0]).toMatchObject({
      name: 'doctor_profile_viewed',
      params: {
        route_template: '/doctores/:id',
        page_location: 'https://portal.example/doctores/:id',
      },
    });
  });
});
