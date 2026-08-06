import { UnsupportedCapabilityError } from '../errors/persistence.errors';

/**
 * Capacidades declaradas por motor.
 *
 * Por qué se modelan explícitamente: sin esto, "políglota" degenera en asumir
 * que cualquier adaptador sabe hacer lo mismo que PostgreSQL. Enrutar las
 * escrituras de un agregado a Redis y envolverlas en `transactional()` no
 * fallaría al arrancar -fallaría en producción, en silencio, entregando una
 * atomicidad que nunca existió-. Declarar la capacidad permite que el arranque
 * rechace esa ruta (§15).
 */
export interface AdapterCapabilities {
  /** Transacciones ACID con rollback real. */
  readonly transactions: boolean;
  /** Búsqueda de texto completo nativa. */
  readonly fullTextSearch: boolean;
  /** Bloqueo optimista por versión de fila. */
  readonly optimisticLocking: boolean;
  /** Bloqueo pesimista (`SELECT ... FOR UPDATE` o equivalente). */
  readonly pessimisticLocking: boolean;
  /** Flujos de cambios / captura de cambios de datos. */
  readonly changeStreams: boolean;
  /** Seguridad a nivel de fila aplicada por el motor. */
  readonly rowLevelSecurity: boolean;
  /** Tipo JSON nativo con operadores de consulta. */
  readonly nativeJson: boolean;
  /** El despliegue expone una réplica de lectura. */
  readonly readReplica: boolean;
  /** Transacciones distribuidas entre nodos o motores. */
  readonly distributedTransactions: boolean;
}

/** Nombre de una capacidad, para poder exigirla por clave. */
export type CapabilityName = keyof AdapterCapabilities;

/**
 * Capacidades de PostgreSQL tal y como lo usa este backend.
 *
 * `readReplica` va en `false` a propósito y no describe al motor sino a este
 * despliegue: PostgreSQL soporta réplicas, pero aquí no hay ninguna
 * configurada. Es la configuración la que lo eleva a `true` cuando la conexión
 * de lectura apunta de verdad a otro servidor; declararlo `true` de entrada
 * dejaría pasar rutas con consistencia eventual sobre una base que en realidad
 * es la primaria.
 *
 * `distributedTransactions` es `false` aun existiendo `PREPARE TRANSACTION`:
 * este backend no coordina 2PC y el §30 prohíbe simularlo.
 */
export const POSTGRES_CAPABILITIES: AdapterCapabilities = {
  transactions: true,
  fullTextSearch: true,
  optimisticLocking: true,
  pessimisticLocking: true,
  changeStreams: false,
  rowLevelSecurity: true,
  nativeJson: true,
  readReplica: false,
  distributedTransactions: false,
};

/**
 * Capacidades de los motores complementarios ya presentes (ADR-0003).
 *
 * Ninguno tiene todavía un adaptador que implemente los puertos: se declaran
 * para que el registro y el enrutado puedan validarlos el día que un módulo se
 * enrute hacia ellos, y para dejar por escrito lo que NO ofrecen. MongoDB
 * aparece con `transactions: false` porque el despliegue de este proyecto es un
 * nodo suelto (`docker-compose.yml`), y las transacciones de MongoDB exigen un
 * replica set: declararlas disponibles sería exactamente la falsa atomicidad
 * que el §15 quiere evitar.
 */
export const ENGINE_CAPABILITIES: Readonly<
  Record<string, AdapterCapabilities>
> = {
  postgresql: POSTGRES_CAPABILITIES,
  mongodb: {
    transactions: false,
    fullTextSearch: true,
    optimisticLocking: false,
    pessimisticLocking: false,
    changeStreams: true,
    rowLevelSecurity: false,
    nativeJson: true,
    readReplica: false,
    distributedTransactions: false,
  },
  redis: {
    transactions: false,
    fullTextSearch: false,
    optimisticLocking: true,
    pessimisticLocking: false,
    changeStreams: false,
    rowLevelSecurity: false,
    nativeJson: false,
    readReplica: false,
    distributedTransactions: false,
  },
  opensearch: {
    transactions: false,
    fullTextSearch: true,
    optimisticLocking: true,
    pessimisticLocking: false,
    changeStreams: false,
    rowLevelSecurity: false,
    nativeJson: true,
    readReplica: true,
    distributedTransactions: false,
  },
};

/**
 * Exige una capacidad y aborta si el adaptador no la ofrece.
 *
 * @param capabilities capacidades declaradas por el adaptador resuelto.
 * @param required capacidad que la ruta necesita.
 * @param context descripción de quién la exige, para que el mensaje de arranque
 *                nombre la ruta culpable y no solo la capacidad que falta.
 */
export function assertCapability(
  capabilities: AdapterCapabilities,
  required: CapabilityName,
  context: { connectionName: string; engine: string; requestedBy: string },
): void {
  if (capabilities[required]) return;
  throw new UnsupportedCapabilityError(
    `La ruta «${context.requestedBy}» exige la capacidad «${required}», que el motor ` +
      `«${context.engine}» de la conexión «${context.connectionName}» no ofrece.`,
    {
      connectionName: context.connectionName,
      engine: context.engine,
      operation: context.requestedBy,
    },
  );
}

/** Capacidades de un motor, o `undefined` si el motor no está declarado. */
export function capabilitiesForEngine(
  engine: string,
): AdapterCapabilities | undefined {
  return ENGINE_CAPABILITIES[engine];
}
