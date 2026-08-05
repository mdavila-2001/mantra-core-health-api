import type { Logger } from '@nestjs/common';
import type { PostgreSqlConnection } from '@mikro-orm/postgresql';

/**
 * Exclusión mutua entre réplicas durante la materialización del DDL.
 *
 * El problema: en un despliegue con N réplicas, las N arrancan a la vez y las N
 * intentan crear las mismas tablas. PostgreSQL no serializa eso de forma
 * elegante; lo que se obtiene son errores de `duplicate_table` o, peor,
 * interbloqueos entre transacciones que están tomando bloqueos ACCESS EXCLUSIVE
 * sobre las mismas relaciones en distinto orden. El arranque falla de forma
 * intermitente y el diagnóstico es infernal.
 *
 * La solución: un advisory lock de PostgreSQL. Es un cerrojo con nombre
 * (un entero de 64 bits) que la propia base arbitra, sin tabla de por medio.
 * La primera réplica que lo obtiene aplica el DDL; las demás esperan y, cuando
 * entran, encuentran que ya no falta nada y salen enseguida.
 *
 * Detalle de implementación importante: se usa `pg_advisory_xact_lock` dentro de
 * una transacción vacía que se mantiene abierta durante todo el arranque. Un
 * `pg_advisory_lock` de sesión no serviría, porque el pool de conexiones no
 * garantiza que las siguientes sentencias viajen por la misma conexión y el
 * cerrojo pertenece a la sesión que lo tomó. Atarlo a una transacción propia
 * elimina esa incertidumbre y garantiza la liberación aunque el proceso muera:
 * al caerse la conexión, PostgreSQL aborta la transacción y suelta el cerrojo.
 *
 * Consecuencia operativa: el pool necesita al menos dos conexiones, una para el
 * cerrojo y otra para el trabajo. Está garantizado por el mínimo del pool.
 */

/**
 * Identificador del cerrojo.
 *
 * Es un valor arbitrario pero fijo: cualquier proceso que quiera coordinarse con
 * este arranque (por ejemplo, un job de migración) debe usar exactamente este
 * número. Se elige uno alto y poco redondo para no colisionar con cerrojos que
 * pueda tomar otra herramienta sobre la misma base.
 */
export const SCHEMA_BOOTSTRAP_LOCK_KEY = 728_431_905_112_004;

/** Fila que devuelve `pg_try_advisory_xact_lock`. */
interface AdvisoryLockAttempt {
  /**
   * Valor de locked mantenido por la instancia.
   */
  locked: boolean;
}

/** Cerrojo tomado, con su liberación asociada. */
export interface HeldAdvisoryLock {
  /** Cierra la transacción portadora y devuelve el cerrojo. Es seguro llamarla más de una vez. */
  release(): Promise<void>;
}

/**
 * Toma el cerrojo de arranque, esperando si otra réplica lo tiene.
 *
 * @param connection conexión del ORM sobre la que abrir la transacción portadora.
 *                   Se tipa como la conexión concreta de PostgreSQL y no como la
 *                   abstracta de `@mikro-orm/core` porque solo la concreta declara
 *                   el tipo de retorno de `execute`; con la abstracta todo llega
 *                   como `any` y se pierde la comprobación de tipos.
 * @param logger     para dejar constancia de la espera, que de otro modo parece un cuelgue
 */
export async function acquireBootstrapLock(
  connection: PostgreSqlConnection,
  logger: Logger,
): Promise<HeldAdvisoryLock> {
  const ctx = await connection.begin();

  // `pg_try_advisory_xact_lock` no bloquea: devuelve false si otro lo tiene.
  // Se intenta primero sin esperar para poder informar de que vamos a esperar,
  // en lugar de dejar el arranque mudo durante el tiempo que tarde la otra
  // réplica en terminar de crear 1159 tablas.
  const attempts = await connection.execute<AdvisoryLockAttempt[]>(
    'SELECT pg_try_advisory_xact_lock(?) AS locked',
    [SCHEMA_BOOTSTRAP_LOCK_KEY],
    'all',
    ctx,
  );

  if (attempts[0]?.locked !== true) {
    logger.log(
      'Otra instancia está materializando el esquema; esperando a que libere el cerrojo',
    );
    await connection.execute(
      'SELECT pg_advisory_xact_lock(?)',
      [SCHEMA_BOOTSTRAP_LOCK_KEY],
      'run',
      ctx,
    );
  }

  let released = false;
  return {
    release: async () => {
      if (released) return;
      released = true;
      // Confirmar la transacción portadora libera el cerrojo. No hay nada que
      // confirmar: la transacción no escribió, solo sostuvo el cerrojo.
      await connection.commit(ctx);
    },
  };
}
