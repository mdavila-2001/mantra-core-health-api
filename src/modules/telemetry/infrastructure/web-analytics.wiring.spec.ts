import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import {
  WEB_ANALYTICS_PORT,
  type WebAnalyticsPort,
} from '../domain/web-analytics.port';
import { DisabledWebAnalyticsAdapter } from './disabled-web-analytics.adapter';
import { GoogleAnalyticsAdapter } from './google-analytics/google-analytics.adapter';
import { GoogleAnalyticsHttpClient } from './google-analytics/google-analytics-http.client';
import { selectWebAnalyticsAdapter } from './web-analytics.factory';
import { TelemetryWebAnalyticsService } from '../services/telemetry-web-analytics.service';

/**
 * Cableado real en el contenedor de NestJS.
 *
 * Los adaptadores aceptan su configuración por parámetro con valor por defecto
 * —cómodo para las pruebas— y eso es justo lo que Nest no sabe resolver por sí
 * solo: sin marcarlo, el contenedor falla **al arrancar el proceso**, donde
 * ninguna prueba unitaria con `new` lo vería. Esta prueba levanta el mismo
 * grafo que declara `TelemetryModule`, sin el ORM, para que ese fallo salga
 * aquí y no en el despliegue.
 */
describe('web analytics wiring', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  /**
   * Construye el grafo de proveedores tal como lo declara `TelemetryModule`.
   *
   * @returns Módulo de pruebas ya compilado.
   */
  async function compile() {
    return Test.createTestingModule({
      providers: [
        { provide: PinoLogger, useValue: { setContext: () => {} } },
        DisabledWebAnalyticsAdapter,
        GoogleAnalyticsHttpClient,
        GoogleAnalyticsAdapter,
        {
          provide: WEB_ANALYTICS_PORT,
          useFactory: (
            disabled: DisabledWebAnalyticsAdapter,
            googleAnalytics: GoogleAnalyticsAdapter,
          ) => selectWebAnalyticsAdapter({ disabled, googleAnalytics }),
          inject: [DisabledWebAnalyticsAdapter, GoogleAnalyticsAdapter],
        },
        TelemetryWebAnalyticsService,
      ],
    }).compile();
  }

  it('wires the disabled adapter with the default configuration', async () => {
    delete process.env.TELEMETRY_WEB_ANALYTICS_ENABLED;
    delete process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER;
    const moduleRef = await compile();

    const port = moduleRef.get<WebAnalyticsPort>(WEB_ANALYTICS_PORT);
    expect(port.providerName).toBe('disabled');
    expect(moduleRef.get(TelemetryWebAnalyticsService)).toBeInstanceOf(
      TelemetryWebAnalyticsService,
    );
    await moduleRef.close();
  });

  it('wires Google Analytics when the deployment configures it', async () => {
    process.env.TELEMETRY_WEB_ANALYTICS_ENABLED = 'true';
    process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER = 'google_analytics';
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT = 'wiring-test-salt-xxxx';
    process.env.GA4_MEASUREMENT_ID = 'G-WIRING123';
    process.env.GA4_API_SECRET = 'wiring-secret';
    const moduleRef = await compile();

    const port = moduleRef.get<WebAnalyticsPort>(WEB_ANALYTICS_PORT);
    expect(port.providerName).toBe('google_analytics');
    await expect(port.health()).resolves.toMatchObject({
      enabled: true,
      configured: true,
    });
    await moduleRef.close();
  });
});
