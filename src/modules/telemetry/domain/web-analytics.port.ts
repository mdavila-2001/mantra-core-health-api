/**
 * Puerto de analítica web: por dónde sale la telemetría del portal hacia una
 * herramienta de analítica externa (Google Analytics 4 hoy; mañana, otra).
 *
 * El módulo Telemetry es la **fuente de verdad**: lo que se persiste en
 * `telemetry.*` no depende de que el proveedor externo exista, responda o
 * acepte el evento. Este puerto sólo describe el reenvío, y por eso todas sus
 * operaciones son de mejor esfuerzo: ningún fallo aquí puede tumbar la ingesta
 * (ver `TelemetryWebAnalyticsService`).
 *
 * Lo que cruza este puerto ya viene **minimizado y pseudonimizado**: claves de
 * sujeto/sesión opacas, plantillas de ruta sin identificadores en claro y
 * propiedades ya filtradas por el esquema de evento. Un adaptador nunca recibe
 * el `user_id` real ni una IP, y el adaptador de GA4 vuelve a derivar su propio
 * identificador con sal antes de que nada salga del proceso.
 */

/** Valor admitido por una propiedad de evento tras la minimización. */
export type WebAnalyticsParamValue = string | number | boolean | undefined;

/** Evento listo para reenviarse: nombre de negocio + propiedades permitidas. */
export interface WebAnalyticsEvent {
  /**
   * Nombre funcional del evento (`page_view`, `web_vitals`, …). El adaptador lo
   * normaliza a las reglas del proveedor; aquí se expresa en el vocabulario del
   * producto, no en el del vendor.
   */
  name: string;
  /**
   * Propiedades del evento ya minimizadas. Los valores `undefined` se descartan
   * en el adaptador, de modo que quien construye el evento puede escribir
   * campos opcionales sin condicionales.
   */
  params?: Record<string, WebAnalyticsParamValue>;
  /**
   * Instante real del evento. Si falta, el adaptador usa el momento del envío.
   * Los proveedores suelen descartar eventos demasiado antiguos: el adaptador
   * cuenta esos casos como descartados en lugar de fingir que se entregaron.
   */
  occurredAt?: Date;
}

/**
 * Identidad pseudónima del visitante. Ninguno de estos campos es un dato
 * personal: son claves internas opacas que el adaptador vuelve a derivar con
 * sal antes de enviarlas.
 */
export interface WebAnalyticsIdentity {
  /** Sujeto de analítica (`telemetry.analytics_subjects.id`). */
  subjectKey?: string;
  /** Sesión o journey de sesión con el que agrupar la actividad. */
  sessionKey?: string;
}

/**
 * Decisión de consentimiento que acompaña al reenvío. El módulo ya aplica el
 * gate antes de persistir; esto es lo que se le declara al proveedor para que
 * su propio modelo de consentimiento coincida con el nuestro.
 */
export interface WebAnalyticsConsent {
  /** Analítica permitida para este sujeto (medición de producto). */
  analytics: boolean;
  /** Uso publicitario de los datos. Por defecto **no**: aquí no se hace ads. */
  adUserData?: boolean;
  /** Personalización publicitaria. Por defecto **no**, por la misma razón. */
  adPersonalization?: boolean;
}

/** Un envío: una identidad, su consentimiento y los eventos que le pertenecen. */
export interface WebAnalyticsHit {
  /**
   * Identidad pseudónima. Sin `subjectKey` ni `sessionKey` no hay a quién
   * atribuir la actividad y el adaptador descarta el envío en vez de inventar
   * un identificador aleatorio que rompería la sesión en el proveedor.
   */
  identity: WebAnalyticsIdentity;
  /** Eventos del envío. Vacío es válido y se resuelve como `EMPTY`. */
  events: WebAnalyticsEvent[];
  /** Consentimiento declarado; si falta, se asume sólo analítica. */
  consent?: WebAnalyticsConsent;
  /** Tenant al que pertenece la actividad, para trazas y logs. */
  tenantId?: string;
}

/** Motivos por los que un envío no llegó a salir del proceso. */
export type WebAnalyticsSkipReason =
  'DISABLED' | 'NOT_CONFIGURED' | 'NO_CONSENT' | 'NO_IDENTITY' | 'EMPTY';

/** Resultado observable de un envío, para logs y métricas. */
export interface WebAnalyticsDispatchResult {
  /** Adaptador que resolvió el envío. */
  provider: string;
  /** Eventos aceptados por el proveedor. */
  delivered: number;
  /** Eventos descartados por el adaptador (antigüedad, nombre inválido, …). */
  dropped: number;
  /** Peticiones HTTP realizadas (los proveedores acotan eventos por petición). */
  requests: number;
  /** Presente sólo cuando no se envió nada; explica por qué. */
  skipReason?: WebAnalyticsSkipReason;
  /** Diagnóstico del proveedor en modo validación, si lo hubo. */
  validationMessages?: string[];
}

/** Estado del adaptador para `/status` y pruebas de humo. */
export interface WebAnalyticsHealth {
  /** Nombre del proveedor activo. */
  provider: string;
  /** El reenvío está activado por configuración. */
  enabled: boolean;
  /** Hay credenciales suficientes para hablar con el proveedor. */
  configured: boolean;
}

/**
 * Punto de extensión de la analítica web. Se elige por
 * `TELEMETRY_WEB_ANALYTICS_PROVIDER` en `TelemetryModule`; los llamadores nunca
 * conocen el proveedor concreto ni su formato de payload.
 */
export interface WebAnalyticsPort {
  /** Identificador del adaptador (`disabled`, `google_analytics`, …). */
  readonly providerName: string;
  /**
   * Reenvía un lote de eventos. **No lanza por fallo del proveedor**: los
   * errores no recuperables se traducen a un resultado con `dropped`. Sí puede
   * lanzar ante un error de programación (payload imposible de construir).
   */
  track(hit: WebAnalyticsHit): Promise<WebAnalyticsDispatchResult>;
  /** Describe el estado del adaptador sin exponer credenciales. */
  health(): Promise<WebAnalyticsHealth>;
}

/** Token de inyección del adaptador activo. */
export const WEB_ANALYTICS_PORT = Symbol('WEB_ANALYTICS_PORT');
