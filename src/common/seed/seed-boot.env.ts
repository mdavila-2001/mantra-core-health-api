import * as Joi from 'joi';

/**
 * Esquema de entorno del interruptor de siembra al arranque.
 *
 * ADR-0017 decidió sembrar en cada `OnApplicationBootstrap` cuando el único
 * seed era el catálogo de conceptos. Hoy la cadena son diez servicios y unas
 * 5 300 filas de catálogo que se re-verifican en cada arranque y en cada
 * archivo de prueba de integración. El flag no revierte esa decisión: la
 * conserva por defecto y le da una salida a los contextos donde re-verificar
 * es puro coste (una suite que ya sembró, un proceso que reinicia en caliente,
 * un despliegue que siembra en un paso propio con `yarn seed:boot`).
 *
 * A diferencia de `DEV_VERIFICATION_BYPASS`, este flag **no** se prohíbe en
 * producción: apagarlo ahí es legítimo si la siembra corre como paso de
 * despliegue. Lo que sí hace es avisar fuerte al arrancar, porque un catálogo
 * sin materializar deja la aplicación en pie pero incapaz de persistir nada
 * —cada `*_concept_id` es NOT NULL y apunta a `terminology.catalog_concepts`—.
 */
export const seedBootEnvSchema = Joi.object({
  SEED_ON_BOOT: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .empty('')
    .default(true),
}).unknown(true);

/** Contrato estructural del entorno de siembra al arranque. */
export interface SeedBootEnv {
  /** Si la cadena de seeds corre sola al arrancar el proceso. */
  enabled: boolean;
}

/**
 * Lee la configuración desde el entorno dado.
 *
 * El default es **encendido**: la ausencia de la variable tiene que comportarse
 * como antes de que este flag existiera, o el primer entorno que no la declare
 * arrancaría con el catálogo vacío sin que nadie lo hubiera pedido.
 *
 * @param source - Entorno a evaluar; parametrizado para probarlo sin tocar `process.env`.
 */
export function loadSeedBootEnv(
  source: NodeJS.ProcessEnv = process.env,
): SeedBootEnv {
  return { enabled: source.SEED_ON_BOOT !== 'false' };
}
