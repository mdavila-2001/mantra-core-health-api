import type { Provider } from '@nestjs/common';
import { createPersistenceSessionProvider } from '../../persistence/session/session.provider';
import { PostgresWaitlistAdapter } from './adapters/postgres-waitlist.adapter';
import { WAITLIST_READ_PORT, WAITLIST_WRITE_PORT } from './ports/waitlist.port';
import { SCHEDULING_MODULE } from './scheduling.tokens';

/** Cableado de persistencia del módulo piloto. */

/**
 * Proveedores de persistencia del módulo.
 *
 * Los dos puertos los sirve el mismo adaptador: la separación entre lectura y
 * escritura es de **contrato**, no de clase. Un caso de uso que solo recibe el
 * puerto de lectura no puede escribir aunque el objeto que hay detrás sepa
 * hacerlo, que es la garantía que interesa; obligar además a dos clases
 * duplicaría la construcción sin añadir ninguna.
 */
export const schedulingPersistenceProviders: Provider[] = [
  createPersistenceSessionProvider(SCHEDULING_MODULE),
  PostgresWaitlistAdapter,
  { provide: WAITLIST_READ_PORT, useExisting: PostgresWaitlistAdapter },
  { provide: WAITLIST_WRITE_PORT, useExisting: PostgresWaitlistAdapter },
];
