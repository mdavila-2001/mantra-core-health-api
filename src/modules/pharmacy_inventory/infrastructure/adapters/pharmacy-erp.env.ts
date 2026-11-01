import * as Joi from 'joi';

/**
 * Dónde está el sistema de gestión de la farmacia externa (FAR-07).
 *
 * La conexión de integración no guarda URL ni cuenta (D-07-1): sale del entorno
 * de la API. **Vacía por defecto**: un despliegue que no la configura responde
 * «no configurada» a la sincronización y no llama a nadie.
 *
 * Con `NODE_ENV=production` la URL tiene que quedar vacía: hoy el único
 * sistema externo que existe es el simulador de `mock-provider-server/`, y en
 * producción escribiría stock inventado en el libro real
 * (`MV_SYNC_ADJUSTMENT`). El esquema lo rechaza y
 * {@link assertPharmacyErpNotInProduction} es la otra mitad de la guarda.
 */
export const pharmacyErpEnvSchema = Joi.object({
  PHARMACY_ERP_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('')
    .default('')
    .when('NODE_ENV', { is: 'production', then: Joi.valid('') }),
  PHARMACY_ERP_API_KEY: Joi.string().allow('').default(''),
  PHARMACY_ERP_TIMEOUT_MS: Joi.number()
    .integer()
    .min(200)
    .max(60_000)
    .default(5_000),
  // FAR-C9: llave para cifrar la clave de la conexión de cada farmacia. Sin
  // ella la API arranca igual, y guardar o probar una conexión responde que
  // falta configurar el cifrado.
  PHARMACY_CONNECTION_SECRET_KEY: Joi.string().allow('').default(''),
  /**
   * FAR-C9 · C9-3: hosts que la API puede llamar como sistema propio de una
   * farmacia (`api.farmacia.bo,*.cadena.bo`). Vacía = ninguno, en cualquier
   * entorno (ver `externalSystemUrlProblem`).
   */
  PHARMACY_EXTERNAL_ALLOWED_HOSTS: Joi.string().allow('').default(''),
  /** Sin lista, cualquier host: solo una máquina local; en producción, no. */
  PHARMACY_EXTERNAL_ALLOW_ANY_HOST: Joi.string()
    .valid('true', 'false')
    .default('false')
    .when('NODE_ENV', { is: 'production', then: Joi.invalid('true') }),
}).unknown(true);

/** Configuración ya leída del entorno. */
export interface PharmacyErpEnv {
  /** Sin barra final; vacía = no configurado. */
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs: number;
}

/**
 * Aborta el arranque si el sistema de la farmacia externa está configurado en
 * producción, igual que `assertMockProviderNotInProduction` con
 * `MOCK_PROVIDER_BASE_URL` (`src/worker/worker.env.ts`).
 *
 * No es un aviso: el simulador inventa el stock de cada sucursal, y cada
 * sincronización lo asentaría en el libro de inventario como existencia real,
 * que los pacientes verían y podrían reservar.
 *
 * @param source - Entorno a evaluar; parametrizado para probarlo sin tocar `process.env`.
 */
export function assertPharmacyErpNotInProduction(
  source: NodeJS.ProcessEnv = process.env,
): void {
  if (source.NODE_ENV !== 'production') return;
  const configured = (source.PHARMACY_ERP_BASE_URL ?? '').trim();
  if (configured.length === 0) return;

  throw new Error(
    'PHARMACY_ERP_BASE_URL está configurada en producción ' +
      `("${configured}"). El único sistema de farmacia externa que existe hoy ` +
      'es el simulador de mock-provider-server, que inventa el stock de cada ' +
      'sucursal: cada sincronización lo asentaría en el libro de inventario ' +
      'como existencia real. Deje la variable vacía.',
  );
}

/** Lee el entorno del sistema externo; en producción con URL, no arranca. */
export function loadPharmacyErpEnv(
  source: NodeJS.ProcessEnv = process.env,
): PharmacyErpEnv {
  assertPharmacyErpNotInProduction(source);
  const timeout = Number(source.PHARMACY_ERP_TIMEOUT_MS ?? '5000');
  return {
    baseUrl: (source.PHARMACY_ERP_BASE_URL ?? '').trim().replace(/\/+$/, ''),
    apiKey: source.PHARMACY_ERP_API_KEY ?? '',
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 5_000,
  };
}
