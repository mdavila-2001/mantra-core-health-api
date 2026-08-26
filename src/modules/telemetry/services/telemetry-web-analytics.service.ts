import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  WEB_ANALYTICS_PORT,
  type WebAnalyticsHit,
  type WebAnalyticsIdentity,
  type WebAnalyticsPort,
} from '../domain/web-analytics.port';
import { loadWebAnalyticsEnv } from '../web-analytics.env';

/** Actividad ya persistida que se ofrece al proveedor externo. */
export interface ForwardedActivityEvent {
  /**
   * Nombre funcional del evento (`page_view`, `appointment_booked`, …).
   */
  eventName: string;
  /**
   * Sujeto de analítica pseudónimo.
   */
  analyticsSubjectId?: string;
  /**
   * Journey de sesión al que pertenece el evento.
   */
  sessionJourneyId?: string;
  /**
   * Plantilla de ruta, sin identificadores en claro.
   */
  routeTemplate?: string;
  /**
   * Instante real del evento.
   */
  occurredAt: Date;
  /**
   * `true` cuando el evento superó el gate de consentimiento de un usuario
   * identificado. Los eventos anónimos no tienen a quién preguntar y viajan con
   * el consentimiento por defecto del despliegue.
   */
  consentGranted?: boolean;
  /**
   * Propiedades ya minimizadas del evento.
   */
  properties?: Record<string, string | number | boolean | undefined>;
}

/** Métrica Core Web Vital ya persistida. */
export interface ForwardedWebVital {
  /**
   * Código de la métrica (`LCP`, `INP`, `CLS`, …).
   */
  metric: string;
  /**
   * Valor medido.
   */
  metricValue: number;
  /**
   * Calificación del valor, si el cliente la calculó.
   */
  rating?: string;
  /**
   * Plantilla de ruta donde se midió.
   */
  routeTemplate?: string;
  /**
   * Sujeto de analítica pseudónimo.
   */
  analyticsSubjectId?: string;
  /**
   * Journey de sesión asociado.
   */
  sessionJourneyId?: string;
  /**
   * Instante de la medición.
   */
  measuredAt: Date;
}

/** Conversión ya registrada con su funnel. */
export interface ForwardedConversion {
  /**
   * Código del funnel alcanzado.
   */
  funnelCode: string;
  /**
   * Versión del funnel vigente al convertir.
   */
  funnelVersion?: number;
  /**
   * Sujeto de analítica que convierte.
   */
  analyticsSubjectId?: string;
  /**
   * Journey de sesión asociado.
   */
  sessionJourneyId?: string;
  /**
   * Instante de la conversión.
   */
  convertedAt: Date;
}

/** Contexto común de un reenvío. */
export interface ForwardContext {
  /**
   * Tenant al que pertenece la actividad, para trazas y logs.
   */
  tenantId?: string;
}

/**
 * Reenvío de la telemetría del portal hacia la analítica web externa.
 *
 * Se sitúa **detrás** de la ingesta y nunca delante: `TelemetryEventsService`
 * ya persistió y confirmó la transacción cuando esta clase entra en juego, de
 * modo que un proveedor caído, lento o mal configurado no cambia lo que el
 * sistema sabe ni lo que responde al portal.
 *
 * Por eso los métodos devuelven `void` y no una promesa: quien ingiere no debe
 * poder esperar —ni olvidarse de esperar— por Google. Los envíos en vuelo se
 * registran para dos cosas concretas: que `onModuleDestroy` no corte a medias
 * lo que ya salió, y que las pruebas puedan sincronizar con `whenIdle()` en
 * lugar de dormir un rato y confiar.
 */
@Injectable()
export class TelemetryWebAnalyticsService implements OnModuleDestroy {
  private readonly env = loadWebAnalyticsEnv();
  private readonly inFlight = new Set<Promise<void>>();

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param analytics - Adaptador de analítica web activo.
   * @param logger - Logger estructurado del proceso.
   */
  constructor(
    @Inject(WEB_ANALYTICS_PORT) private readonly analytics: WebAnalyticsPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryWebAnalyticsService.name);
  }

  /**
   * Reenvía los eventos de actividad que sí se persistieron.
   *
   * @param events - Eventos insertados, ya consent-aware.
   * @param context - Contexto común del lote.
   */
  trackActivityEvents(
    events: ForwardedActivityEvent[],
    context: ForwardContext = {},
  ): void {
    for (const { identity, items } of this.groupByIdentity(events)) {
      this.dispatch({
        identity,
        tenantId: context.tenantId,
        consent: this.consentFor(items.some((item) => item.consentGranted)),
        events: items.map((item) => ({
          name: item.eventName,
          occurredAt: item.occurredAt,
          params: {
            ...item.properties,
            route_template: item.routeTemplate,
            page_location: this.pageLocation(item.routeTemplate),
          },
        })),
      });
    }
  }

  /**
   * Reenvía un lote de Core Web Vitals como eventos `web_vitals`.
   *
   * @param metrics - Métricas persistidas.
   * @param context - Contexto común del lote.
   */
  trackWebVitals(
    metrics: ForwardedWebVital[],
    context: ForwardContext = {},
  ): void {
    for (const { identity, items } of this.groupByIdentity(metrics)) {
      this.dispatch({
        identity,
        tenantId: context.tenantId,
        consent: this.consentFor(false),
        events: items.map((metric) => ({
          // Nombre de evento y propiedades siguen la convención de la librería
          // `web-vitals` con GA4, para que los informes estándar del sector
          // funcionen sin configurar nada a mano.
          name: 'web_vitals',
          occurredAt: metric.measuredAt,
          params: {
            metric_name: metric.metric,
            metric_value: roundMetric(metric.metric, metric.metricValue),
            metric_rating: metric.rating,
            route_template: metric.routeTemplate,
            page_location: this.pageLocation(metric.routeTemplate),
          },
        })),
      });
    }
  }

  /**
   * Reenvía una conversión con el código de su funnel como nombre de evento.
   *
   * GA4 marca los eventos clave **por nombre**, así que un `conversion` único
   * para todos los funnels obligaría a crear dimensiones personalizadas para
   * distinguirlos. Con el código del funnel como nombre, cada embudo es medible
   * desde el primer día.
   *
   * @param conversion - Conversión registrada.
   * @param context - Contexto del reenvío.
   */
  trackConversion(
    conversion: ForwardedConversion,
    context: ForwardContext = {},
  ): void {
    this.dispatch({
      identity: {
        subjectKey: conversion.analyticsSubjectId,
        sessionKey: conversion.sessionJourneyId,
      },
      tenantId: context.tenantId,
      consent: this.consentFor(false),
      events: [
        {
          name: conversion.funnelCode,
          occurredAt: conversion.convertedAt,
          params: {
            funnel_code: conversion.funnelCode,
            funnel_version: conversion.funnelVersion,
          },
        },
      ],
    });
  }

  /**
   * Espera a que no queden envíos en vuelo.
   *
   * @returns Promesa que se resuelve cuando el reenvío está en reposo.
   */
  async whenIdle(): Promise<void> {
    while (this.inFlight.size) {
      await Promise.allSettled([...this.inFlight]);
    }
  }

  /** Da margen a los envíos en vuelo antes de que el proceso se apague. */
  async onModuleDestroy(): Promise<void> {
    await this.whenIdle();
  }

  /** Lanza el envío y lo registra hasta que termine, pase lo que pase. */
  private dispatch(hit: WebAnalyticsHit): void {
    if (!hit.events.length) return;
    const pending = this.analytics
      .track(hit)
      .then((result) => {
        if (result.dropped > 0) {
          this.logger.warn(
            {
              operation: 'telemetry.web-analytics.forward',
              provider: result.provider,
              delivered: result.delivered,
              dropped: result.dropped,
              skipReason: result.skipReason,
              tenantId: hit.tenantId,
            },
            'Web analytics forwarding dropped events',
          );
        }
      })
      .catch((error: unknown) => {
        // El puerto promete no lanzar; si algún adaptador rompe la promesa, el
        // fallo muere aquí igualmente: la telemetría ya está persistida.
        this.logger.error(
          {
            operation: 'telemetry.web-analytics.forward',
            tenantId: hit.tenantId,
            reason: error instanceof Error ? error.message : String(error),
          },
          'Web analytics forwarding failed',
        );
      })
      .finally(() => {
        this.inFlight.delete(pending);
      });
    this.inFlight.add(pending);
  }

  /** Agrupa por identidad para no mezclar visitantes en una misma petición. */
  private groupByIdentity<
    T extends {
      /**
       * Sujeto de analítica pseudónimo.
       */
      analyticsSubjectId?: string;
      /**
       * Journey de sesión asociado.
       */
      sessionJourneyId?: string;
    },
  >(items: T[]): { identity: WebAnalyticsIdentity; items: T[] }[] {
    const byKey = new Map<
      string,
      { identity: WebAnalyticsIdentity; items: T[] }
    >();
    for (const item of items) {
      const key = `${item.analyticsSubjectId ?? ''}|${item.sessionJourneyId ?? ''}`;
      const bucket = byKey.get(key);
      if (bucket) {
        bucket.items.push(item);
        continue;
      }
      byKey.set(key, {
        identity: {
          subjectKey: item.analyticsSubjectId,
          sessionKey: item.sessionJourneyId,
        },
        items: [item],
      });
    }
    return [...byKey.values()];
  }

  /** Declara el consentimiento del envío al proveedor. */
  private consentFor(userGranted: boolean): WebAnalyticsHit['consent'] {
    return {
      analytics: true,
      // El uso publicitario se declara sólo si el despliegue lo activa **y** el
      // sujeto lo concedió: aquí la analítica es de producto, no de anuncios.
      adUserData: this.env.ga4AdUserData && userGranted,
      adPersonalization: this.env.ga4AdPersonalization && userGranted,
    };
  }

  /**
   * Compone una URL de página a partir de la plantilla de ruta. Sin ella, GA4
   * agrupa todas las vistas bajo "(not set)"; con ella, los informes estándar
   * funcionan sin que salga del sistema una URL real con identificadores.
   */
  private pageLocation(routeTemplate: string | undefined): string | undefined {
    if (!routeTemplate || !this.env.siteUrl) return undefined;
    return `${this.env.siteUrl}${routeTemplate.startsWith('/') ? '' : '/'}${routeTemplate}`;
  }
}

/**
 * CLS se mide en una escala de 0 a ~1 y el resto en milisegundos: redondear
 * todo por igual convertiría un CLS de 0,12 en un 0.
 */
function roundMetric(metric: string, value: number): number {
  return metric.toUpperCase() === 'CLS'
    ? Math.round(value * 1000) / 1000
    : Math.round(value);
}
