/**
 * Entorno del emulador. Sin `@nestjs/config`/Joi como en el backend real a
 * propósito: este servicio no tiene esquema de negocio que proteger, así que
 * un `process.env` leído una vez alcanza — añadir el mismo aparato de
 * validación aquí sería peso muerto.
 */
export interface MockProviderEnv {
  port: number;
  apiKey: string | undefined;
  notificationsFailureRate: number;
  deletionsFailureRate: number;
  simulatedLatencyMs: number;
}

/** Lee y acota el entorno del proceso. Tasas fuera de [0,1] se recortan. */
export function loadEnv(): MockProviderEnv {
  return {
    port: Number(process.env.PORT ?? 4100),
    apiKey: process.env.MOCK_API_KEY || undefined,
    notificationsFailureRate: clampRate(
      process.env.NOTIFICATIONS_FAILURE_RATE,
      0.1,
    ),
    deletionsFailureRate: clampRate(process.env.DELETIONS_FAILURE_RATE, 0.05),
    simulatedLatencyMs: Math.max(
      0,
      Number(process.env.SIMULATED_LATENCY_MS ?? 50),
    ),
  };
}

function clampRate(raw: string | undefined, fallback: number): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}
