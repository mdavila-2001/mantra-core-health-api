/**
 * Candado común de las cuentas de demostración.
 *
 * Una cuenta de demostración tiene una contraseña que conoce quien despliega.
 * Eso es aceptable en un entorno de desarrollo o de pruebas y no lo es en uno
 * real, así que todo paso que crea cuentas pasa por el mismo candado y con las
 * mismas dos condiciones que ya exigía `ProviderAccountsSeedService`:
 *
 * - `SEED_DEMO_PASSWORD`: la contraseña compartida. Sin ella no hay cuentas, y
 *   no existe ninguna por defecto en el código.
 * - `SEED_DEMO_ALLOW_PRODUCTION=true`: todos los entornos corren con
 *   `NODE_ENV=production`, así que ese valor no distingue producción de
 *   desarrollo o pruebas; este permiso explícito sí. En producción no se define.
 */

/** Por qué un paso de cuentas no hizo nada. */
export type DemoGateSkip = 'not-configured' | 'production-not-allowed';

/** Variables que gobiernan el candado, ya normalizadas. */
export interface DemoGateEnv {
  /** Contraseña compartida de las cuentas de demostración. */
  password?: string;
  /** Entorno declarado del proceso. */
  nodeEnv?: string;
  /** Permiso explícito para crear cuentas de demostración en `production`. */
  allowProduction: boolean;
}

/**
 * Lee el candado desde el entorno.
 *
 * @param source - Origen de variables; `process.env` salvo en pruebas.
 * @returns Configuración normalizada: la variable vacía cuenta como ausente y
 *   solo el literal `true` autoriza producción.
 */
export function loadDemoGateEnv(
  source: NodeJS.ProcessEnv = process.env,
): DemoGateEnv {
  return {
    password: source.SEED_DEMO_PASSWORD || undefined,
    nodeEnv: source.NODE_ENV,
    allowProduction: source.SEED_DEMO_ALLOW_PRODUCTION === 'true',
  };
}

/**
 * Decide si un paso de cuentas puede correr.
 *
 * @param env - Configuración del candado.
 * @returns El motivo del salto, o `undefined` si puede crear cuentas.
 */
export function demoGateSkip(env: DemoGateEnv): DemoGateSkip | undefined {
  if (!env.password) return 'not-configured';
  if (env.nodeEnv === 'production' && !env.allowProduction) {
    return 'production-not-allowed';
  }
  return undefined;
}
