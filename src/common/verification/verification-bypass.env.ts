import * as Joi from 'joi';

/**
 * Esquema de entorno del bypass de verificación DEV/TEST (corrección #12 del
 * 15/08/2026, contrato `DEV_VERIFICATION_BYPASS.md`). Se concatena al esquema
 * global en `AppModule`, igual que `authEnvSchema`/`appSecurityEnvSchema`: un
 * `true` colado en producción debe abortar el arranque, no llegar a filtrar
 * la primera consulta de la Guía de profesionales.
 *
 * `.when('NODE_ENV', 'production', Joi.valid(false))` es la mitad estructural
 * de la guarda; `assertVerificationBypassNotInProduction` es la otra mitad,
 * en defensa de profundidad por si algo evalúa la variable sin pasar por
 * `ConfigModule` (mismo patrón que `JWT_SECRET` en `auth.env.ts`).
 */
export const verificationBypassEnvSchema = Joi.object({
  DEV_VERIFICATION_BYPASS: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .empty('')
    .default(false)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.valid(false),
    }),
}).unknown(true);

/** Contrato estructural del entorno del bypass. */
export interface VerificationBypassEnv {
  /** Si el bypass está activo para este proceso. */
  enabled: boolean;
}

/** Lee la configuración del bypass desde el entorno dado (por defecto `process.env`). */
export function loadVerificationBypassEnv(
  source: NodeJS.ProcessEnv = process.env,
): VerificationBypassEnv {
  return { enabled: source.DEV_VERIFICATION_BYPASS === 'true' };
}

/**
 * Aborta el arranque si el bypass está activo en producción.
 *
 * El bypass suprime, en la Guía de profesionales y en la elegibilidad para
 * solicitar cita, el filtro que exige `verificationStatusConceptId =
 * PRACT_VERIF_VERIFIED`. Fuera de DEV/TEST eso significaría exponer
 * profesionales no verificados a pacientes reales — no es una configuración
 * inusual que merezca un aviso, es la misma clase de incidente que
 * `assertMockProviderNotInProduction` en `worker.env.ts`.
 *
 * @param source - Entorno a evaluar; parametrizado para probarlo sin tocar `process.env`.
 */
export function assertVerificationBypassNotInProduction(
  source: NodeJS.ProcessEnv = process.env,
): void {
  if (source.NODE_ENV !== 'production') return;
  if (source.DEV_VERIFICATION_BYPASS !== 'true') return;

  throw new Error(
    'DEV_VERIFICATION_BYPASS está activo en producción. Este flag suprime el ' +
      'filtro de verificación en la Guía de profesionales y en la elegibilidad ' +
      'para solicitar cita, exponiendo profesionales no verificados a pacientes ' +
      'reales. Desactívelo (o quite la variable) antes de desplegar.',
  );
}
