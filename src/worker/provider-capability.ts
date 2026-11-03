import type { PinoLogger } from 'nestjs-pino';
import { workerHealth, type ProviderBinding } from './worker-health.registry';

/**
 * Deja constancia de con qué se atiende una capacidad que depende de un
 * proveedor externo, y avisa cuando el worker productivo no tiene uno.
 *
 * No aborta el arranque: sin adapter productivo el worker sigue descubriendo
 * trabajo y dejándolo en un estado visible (`FAILED`/`PENDING`), y abortar sólo
 * produciría un bucle de reinicios que oculta el motivo. Lo que sí hace es
 * degradar la readiness (`WorkerHealthRegistry.registerProviderCapability`) y
 * registrar un error al arrancar, para que "sano" no signifique "sin proveedor".
 *
 * @param logger - Logger del servicio que cablea el adapter.
 * @param capability - Código estable de la capacidad (`dominio.operación`).
 * @param binding - Con qué se atiende ahora mismo.
 */
export function declareProviderCapability(
  logger: PinoLogger,
  capability: string,
  binding: ProviderBinding,
): void {
  workerHealth.registerProviderCapability(capability, binding);
  if (binding === 'real') return;

  const production = process.env.NODE_ENV === 'production';
  const context = {
    operation: 'worker.provider-capability',
    capability,
    binding,
  };
  if (production) {
    logger.error(
      context,
      'Capacidad de proveedor sin adapter productivo: el worker no estará listo (readiness degradada)',
    );
  } else if (binding === 'none') {
    logger.warn(
      context,
      'Capacidad de proveedor con el adapter por defecto: sus solicitudes fallarán o quedarán pendientes',
    );
  }
}
