import * as Joi from 'joi';

/**
 * Dónde está el sistema de gestión de la farmacia externa (FAR-07).
 *
 * La conexión de integración no guarda URL ni cuenta (D-07-1): sale del entorno
 * de la API. **Vacía por defecto**: un despliegue que no la configura responde
 * «no configurada» a la sincronización y no llama a nadie.
 */
export const pharmacyErpEnvSchema = Joi.object({
  PHARMACY_ERP_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('')
    .default(''),
  PHARMACY_ERP_API_KEY: Joi.string().allow('').default(''),
  PHARMACY_ERP_TIMEOUT_MS: Joi.number()
    .integer()
    .min(200)
    .max(60_000)
    .default(5_000),
});

/** Configuración ya leída del entorno. */
export interface PharmacyErpEnv {
  /** Sin barra final; vacía = no configurado. */
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs: number;
}

/** Lee el entorno del sistema externo. */
export function loadPharmacyErpEnv(): PharmacyErpEnv {
  const timeout = Number(process.env.PHARMACY_ERP_TIMEOUT_MS ?? '5000');
  return {
    baseUrl: (process.env.PHARMACY_ERP_BASE_URL ?? '')
      .trim()
      .replace(/\/+$/, ''),
    apiKey: process.env.PHARMACY_ERP_API_KEY ?? '',
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 5_000,
  };
}
