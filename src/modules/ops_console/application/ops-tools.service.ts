import { HttpException, Injectable } from '@nestjs/common';
import { AppReadinessService } from '../../../app-readiness.service';
import {
  TOOL_CATALOG,
  type ToolCatalogItem,
  type ToolCode,
} from '../domain/tool-catalog';

/** Versión del contrato: cambiar un campo o una regla de cálculo la cambia. */
export const OPS_TOOLS_MODEL_VERSION = 'ops-tools/v1';

/** Las sondas de readiness se reutilizan durante esta ventana. */
export const READINESS_CACHE_TTL_MS = 10_000;

/** Una sonda `up` por encima de este tiempo se informa como lenta (sigue sana). */
export const SLOW_PROBE_MS = 1_000;

/** Con qué se atiende hoy la herramienta. */
export type ToolBinding = 'real' | 'mock' | 'none' | 'simulated';

export interface ToolHealthItem extends ToolCatalogItem {
  requiredEnvVars: string[];
  binding: ToolBinding;
  isConfigured: boolean;
  /** Nombres de variables requeridas y vacías; nunca valores. */
  missingEnvVars: string[];
  /** `null` cuando no hay sonda en vivo (CONFIGURATION, NOT_APPLICABLE o sonda no ejecutada). */
  isHealthy: boolean | null;
  healthMessage: string;
  latencyMs: number | null;
  checkedAt: string | null;
}

export interface OpsToolsResponse {
  modelVersion: typeof OPS_TOOLS_MODEL_VERSION;
  evaluatedAt: string;
  summary: {
    total: number;
    healthy: number;
    down: number;
    noProbe: number;
    notApplicable: number;
    critical: number;
  };
  tools: ToolHealthItem[];
}

interface ProbeResult {
  status: 'up' | 'down';
  latencyMs: number;
}

interface ReadinessSnapshot {
  takenAt: number;
  checkedAt: string;
  /** `null` cuando la sonda no pudo ejecutarse (ni éxito ni 503 con detalle). */
  checks: Record<string, ProbeResult> | null;
}

interface ConfigurationState {
  binding: ToolBinding;
  missingEnvVars: string[];
  message: string;
}

type Env = NodeJS.ProcessEnv;

/** Nombre de la sonda de `AppReadinessService` que alimenta cada herramienta LIVE. */
const LIVE_PROBE_BY_TOOL: Partial<Record<ToolCode, string>> = {
  postgresql: 'postgresql',
  mongodb: 'mongodb',
  redis: 'redis',
  opensearch: 'opensearch',
};

const isTrue = (value: string | undefined): boolean =>
  (value ?? '').trim().toLowerCase() === 'true';

const isBlank = (value: string | undefined): boolean =>
  (value ?? '').trim().length === 0;

const missingOf = (env: Env, names: readonly string[]): string[] =>
  names.filter((name) => isBlank(env[name]));

/**
 * Misma regla que `loadWorkerEnv` (src/worker/worker.env.ts): fuera de
 * producción el emulador tiene una URL por defecto; en producción, ninguna.
 */
const mockProviderConfigured = (env: Env): boolean =>
  env.NODE_ENV === 'production'
    ? !isBlank(env.MOCK_PROVIDER_BASE_URL)
    : (env.MOCK_PROVIDER_BASE_URL ?? 'http://127.0.0.1:4100').length > 0;

/** Capacidades que hoy sólo tienen adaptador `mock` o `none` (sin proveedor productivo). */
function mockOnlyCapability(env: Env, what: string): ConfigurationState {
  if (env.NODE_ENV !== 'production' && mockProviderConfigured(env)) {
    return {
      binding: 'mock',
      missingEnvVars: [],
      message: `${what}: atendida por el emulador; no hay proveedor productivo.`,
    };
  }
  return {
    binding: 'none',
    missingEnvVars: [],
    message: `${what}: sin proveedor; las solicitudes fallan visibles o quedan pendientes.`,
  };
}

/**
 * Cómo decide la API hoy entre adaptador real, emulador, simulado o ninguno,
 * por herramienta. Cada regla copia la condición del módulo dueño (citado en
 * `tool-catalog.ts`); nada se infiere de otra fuente.
 */
const CONFIGURATION_RESOLVERS: Record<
  ToolCode,
  (env: Env, tool: ToolCatalogItem) => ConfigurationState
> = {
  postgresql: (env, tool) => infrastructure(env, tool),
  mongodb: (env, tool) => infrastructure(env, tool),
  redis: (env, tool) => infrastructure(env, tool),
  opensearch: (env, tool) => infrastructure(env, tool),

  object_storage: (env, tool) => {
    const adapter = (env.FILE_STORAGE_ADAPTER ?? 'local').trim() || 'local';
    if (adapter !== 's3') {
      return {
        binding: 'real',
        missingEnvVars: [],
        message:
          'Adaptador de disco local: depende del volumen del contenedor, no de un servicio externo.',
      };
    }
    const missing = missingOf(env, tool.requiredEnvVars);
    // Credenciales estáticas: el par completo o ninguna (storage.env.ts).
    const hasKey = !isBlank(env.FILE_STORAGE_S3_ACCESS_KEY_ID);
    const hasSecret = !isBlank(env.FILE_STORAGE_S3_SECRET_ACCESS_KEY);
    if (hasKey && !hasSecret) missing.push('FILE_STORAGE_S3_SECRET_ACCESS_KEY');
    if (hasSecret && !hasKey) missing.push('FILE_STORAGE_S3_ACCESS_KEY_ID');
    return {
      binding: 'real',
      missingEnvVars: missing,
      message:
        missing.length === 0
          ? 'Adaptador S3 compatible configurado; sin sonda en vivo.'
          : 'Adaptador S3 compatible con configuración incompleta.',
    };
  },

  clamav: (env) =>
    isTrue(env.MALWARE_SCAN_ENABLED)
      ? {
          binding: 'real',
          missingEnvVars: [],
          message:
            'Escaneo antimalware activo en el worker de archivos; sin sonda en vivo.',
        }
      : {
          binding: 'none',
          missingEnvVars: [],
          message:
            'Escaneo antimalware apagado por configuración: las versiones quedan en SCAN_PENDING.',
        },

  gmail: (env, tool) => {
    const missing = missingOf(env, tool.requiredEnvVars);
    if (missing.length === 0) {
      return {
        binding: 'real',
        missingEnvVars: [],
        message:
          'Credenciales de Gmail completas: el correo sale por el proveedor real.',
      };
    }
    if (env.NODE_ENV !== 'production' && mockProviderConfigured(env)) {
      return {
        binding: 'mock',
        missingEnvVars: missing,
        message:
          'Sin credenciales de Gmail: el correo sale por el emulador y no llega a nadie.',
      };
    }
    return {
      binding: 'none',
      missingEnvVars: missing,
      message:
        'Sin credenciales de Gmail ni emulador: el correo no se entrega.',
    };
  },

  web_push: (env, tool) => {
    const missing = missingOf(env, tool.requiredEnvVars);
    return missing.length === 0
      ? {
          binding: 'real',
          missingEnvVars: [],
          message: 'Claves VAPID presentes; sin sonda en vivo.',
        }
      : {
          binding: 'none',
          missingEnvVars: missing,
          message: 'Faltan claves VAPID: el servicio de push queda inactivo.',
        };
  },

  mock_provider_server: (env) => {
    if (env.NODE_ENV === 'production') {
      return {
        binding: 'none',
        missingEnvVars: [],
        message:
          'No aplica en producción: el arranque falla si el emulador está configurado.',
      };
    }
    return mockProviderConfigured(env)
      ? {
          binding: 'mock',
          missingEnvVars: [],
          message:
            'Emulador configurado para los workers; sin sonda desde la API.',
        }
      : {
          binding: 'none',
          missingEnvVars: ['MOCK_PROVIDER_BASE_URL'],
          message:
            'Emulador sin URL: las capacidades que dependen de él fallan visibles.',
        };
  },

  identity_verification: (env) =>
    mockOnlyCapability(env, 'Verificación de identidad'),
  embeddings: (env) => mockOnlyCapability(env, 'Embeddings'),
  cross_store_deletion: (env) =>
    mockOnlyCapability(env, 'Borrado entre almacenes'),

  elevenlabs: (env, tool) => {
    const provider = (env.AUDIO_TTS_PROVIDER ?? 'disabled').trim();
    if (provider === 'elevenlabs') {
      const missing = missingOf(env, tool.requiredEnvVars);
      const enabled = isTrue(env.AUDIO_TTS_ENABLED);
      return {
        binding: 'real',
        missingEnvVars: missing,
        message:
          missing.length > 0
            ? 'Proveedor ElevenLabs seleccionado sin clave de API.'
            : enabled
              ? 'ElevenLabs configurado y generación encendida; sin sonda en vivo.'
              : 'ElevenLabs configurado con la generación apagada.',
      };
    }
    if (provider === 'fake') {
      return {
        binding: 'simulated',
        missingEnvVars: [],
        message:
          'Proveedor falso de TTS (sólo fuera de producción): audios sintéticos.',
      };
    }
    return {
      binding: 'none',
      missingEnvVars: [],
      message: 'Síntesis de voz desactivada por configuración.',
    };
  },

  ga4: (env, tool) => {
    const active =
      isTrue(env.TELEMETRY_WEB_ANALYTICS_ENABLED) &&
      (env.TELEMETRY_WEB_ANALYTICS_PROVIDER ?? 'none').trim() ===
        'google_analytics';
    if (!active) {
      return {
        binding: 'none',
        missingEnvVars: [],
        message:
          'Reenvío de analítica apagado: los eventos no salen de la API.',
      };
    }
    const missing = missingOf(env, tool.requiredEnvVars);
    return {
      binding: 'real',
      missingEnvVars: missing,
      message:
        missing.length === 0
          ? 'Reenvío a GA4 activo y con credenciales; sin sonda en vivo.'
          : 'Reenvío a GA4 activo con credenciales incompletas.',
    };
  },

  siat: (env, tool) => {
    if ((env.SIAT_MODE ?? '').trim() !== 'real') {
      return {
        binding: 'simulated',
        missingEnvVars: [],
        message:
          'Adaptador simulado: las facturas emitidas no tienen validez fiscal.',
      };
    }
    const missing = missingOf(env, tool.requiredEnvVars);
    return {
      binding: 'real',
      missingEnvVars: missing,
      message:
        missing.length === 0
          ? 'Adaptador SIAT real configurado; sin sonda en vivo.'
          : 'Adaptador SIAT real con configuración incompleta.',
    };
  },

  payments_gateway: (env, tool) => {
    if (!isTrue(env.PAYMENTS_VIA_GATEWAY)) {
      return {
        binding: 'none',
        missingEnvVars: [],
        message: 'Pasarela apagada: los pagos se registran sin cobro en línea.',
      };
    }
    const missing = missingOf(env, tool.requiredEnvVars);
    return {
      binding: 'real',
      missingEnvVars: missing,
      message:
        missing.length === 0
          ? 'Pasarela de pagos activa y configurada; sin sonda en vivo.'
          : 'Pasarela de pagos activa con configuración incompleta.',
    };
  },

  pharmacy_erp: (env, tool) => {
    const missing = missingOf(env, tool.requiredEnvVars);
    return missing.length === 0
      ? {
          binding: 'real',
          missingEnvVars: [],
          message: 'ERP de farmacia configurado; sin sonda en vivo.',
        }
      : {
          binding: 'none',
          missingEnvVars: missing,
          message: 'Sin URL del ERP: la integración está inactiva.',
        };
  },

  reverse_geocoding: () => ({
    binding: 'real',
    missingEnvVars: [],
    message:
      'Proveedores públicos con valores por defecto y respaldo; sin sonda en vivo.',
  }),

  otel: (env, tool) => {
    if (!isTrue(env.OTEL_ENABLED)) {
      return {
        binding: 'none',
        missingEnvVars: [],
        message: 'Exportación de trazas apagada.',
      };
    }
    const missing = missingOf(env, tool.requiredEnvVars);
    return {
      binding: 'real',
      missingEnvVars: missing,
      message:
        missing.length === 0
          ? 'Exportación de trazas activa; sin sonda en vivo.'
          : 'Exportación de trazas activa sin endpoint configurado.',
    };
  },
};

function infrastructure(env: Env, tool: ToolCatalogItem): ConfigurationState {
  const missing = missingOf(env, tool.requiredEnvVars);
  return {
    binding: 'real',
    missingEnvVars: missing,
    message:
      missing.length === 0
        ? 'Configurada.'
        : 'Configuración de conexión incompleta.',
  };
}

/**
 * Catálogo de herramientas con su estado: `binding`, configuración y, para
 * las cuatro bases que ya sondea `GET /readiness`, salud en vivo.
 *
 * Reglas (las mismas que presenta Atlas):
 * - `isHealthy` sólo lo pone una sonda `LIVE`; `CONFIGURATION` y
 *   `NOT_APPLICABLE` siempre devuelven `null`, nunca «caída».
 * - `missingEnvVars` lleva nombres; ningún valor de entorno sale de acá.
 * - `healthMessage` es texto propio: no transporta el error crudo del driver
 *   (ese queda en el log de `AppReadinessService`).
 */
@Injectable()
export class OpsToolsService {
  private snapshot?: ReadinessSnapshot;
  private pending?: Promise<ReadinessSnapshot>;

  constructor(private readonly readiness: AppReadinessService) {}

  async listTools(env: Env = process.env): Promise<OpsToolsResponse> {
    const live = await this.readinessSnapshot();

    const tools = TOOL_CATALOG.map((tool) => this.evaluate(tool, env, live));
    const notApplicable = tools.filter(
      (tool) => tool.checkType === 'NOT_APPLICABLE',
    ).length;
    return {
      modelVersion: OPS_TOOLS_MODEL_VERSION,
      evaluatedAt: new Date().toISOString(),
      summary: {
        total: tools.length,
        healthy: tools.filter((tool) => tool.isHealthy === true).length,
        down: tools.filter((tool) => tool.isHealthy === false).length,
        noProbe: tools.filter(
          (tool) =>
            tool.isHealthy === null && tool.checkType !== 'NOT_APPLICABLE',
        ).length,
        notApplicable,
        critical: tools.filter((tool) => tool.isCritical).length,
      },
      tools,
    };
  }

  private evaluate(
    tool: ToolCatalogItem,
    env: Env,
    live: ReadinessSnapshot,
  ): ToolHealthItem {
    const configuration = CONFIGURATION_RESOLVERS[tool.code](env, tool);
    const base: ToolHealthItem = {
      ...tool,
      requiredEnvVars: [...tool.requiredEnvVars],
      binding: configuration.binding,
      isConfigured: configuration.missingEnvVars.length === 0,
      missingEnvVars: configuration.missingEnvVars,
      isHealthy: null,
      healthMessage: configuration.message,
      latencyMs: null,
      checkedAt: null,
    };
    if (tool.checkType !== 'LIVE') return base;
    return { ...base, ...this.liveHealth(tool.code, live) };
  }

  private liveHealth(
    code: ToolCode,
    live: ReadinessSnapshot,
  ): Pick<
    ToolHealthItem,
    'isHealthy' | 'healthMessage' | 'latencyMs' | 'checkedAt'
  > {
    const probeName = LIVE_PROBE_BY_TOOL[code];
    const probe = probeName ? live.checks?.[probeName] : undefined;
    if (!probe) {
      return {
        isHealthy: null,
        healthMessage: 'La sonda de readiness no pudo ejecutarse.',
        latencyMs: null,
        checkedAt: live.checkedAt,
      };
    }
    if (probe.status === 'down') {
      return {
        isHealthy: false,
        healthMessage:
          'No responde a la sonda de readiness (error o tiempo de espera agotado).',
        latencyMs: probe.latencyMs,
        checkedAt: live.checkedAt,
      };
    }
    return {
      isHealthy: true,
      healthMessage:
        probe.latencyMs > SLOW_PROBE_MS
          ? `Responde lento a la sonda de readiness: ${probe.latencyMs} ms (umbral ${SLOW_PROBE_MS} ms).`
          : `Responde a la sonda de readiness en ${probe.latencyMs} ms.`,
      latencyMs: probe.latencyMs,
      checkedAt: live.checkedAt,
    };
  }

  /**
   * Sondas de `AppReadinessService` con caché de 10 s: varias pestañas del
   * portal no multiplican consultas a las bases, y una sola corrida en vuelo
   * atiende a todos los que llegan mientras dura.
   */
  private async readinessSnapshot(): Promise<ReadinessSnapshot> {
    const now = Date.now();
    if (this.snapshot && now - this.snapshot.takenAt < READINESS_CACHE_TTL_MS) {
      return this.snapshot;
    }
    if (!this.pending) {
      this.pending = this.probeReadiness().finally(() => {
        this.pending = undefined;
      });
    }
    this.snapshot = await this.pending;
    return this.snapshot;
  }

  private async probeReadiness(): Promise<ReadinessSnapshot> {
    const takenAt = Date.now();
    const checkedAt = new Date(takenAt).toISOString();
    try {
      const result = await this.readiness.check();
      return { takenAt, checkedAt, checks: publicChecks(result.checks) };
    } catch (error) {
      // Un 503 de readiness trae en `details.checks` qué sonda cayó y cuánto
      // tardó, ya sin mensajes del driver; cualquier otro fallo es «sin sonda».
      const checks = error instanceof HttpException ? checksOf(error) : null;
      return { takenAt, checkedAt, checks };
    }
  }
}

function publicChecks(
  checks: Record<string, { status: 'up' | 'down'; latencyMs: number }>,
): Record<string, ProbeResult> {
  return Object.fromEntries(
    Object.entries(checks).map(([name, check]) => [
      name,
      { status: check.status, latencyMs: check.latencyMs },
    ]),
  );
}

function checksOf(error: HttpException): Record<string, ProbeResult> | null {
  const body = error.getResponse();
  if (!body || typeof body !== 'object') return null;
  const details = (body as { details?: { checks?: unknown } }).details;
  const checks = details?.checks;
  if (!checks || typeof checks !== 'object') return null;
  const result: Record<string, ProbeResult> = {};
  for (const [name, raw] of Object.entries(
    checks as Record<string, { status?: unknown; latencyMs?: unknown }>,
  )) {
    if (
      (raw.status === 'up' || raw.status === 'down') &&
      typeof raw.latencyMs === 'number'
    ) {
      result[name] = { status: raw.status, latencyMs: raw.latencyMs };
    }
  }
  return result;
}
