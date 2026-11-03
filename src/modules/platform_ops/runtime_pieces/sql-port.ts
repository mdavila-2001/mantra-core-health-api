import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

/**
 * Puerto mínimo de SQL que usa el repositorio. Existe para poder ejercer las
 * MISMAS sentencias contra un Postgres real sin levantar el ORM completo
 * (`test/integration/runtime-pieces.int-spec.ts`) y contra un doble en las
 * pruebas unitarias.
 *
 * Los parámetros se escriben con `?` (como el driver de MikroORM).
 */
export interface SqlPort {
  query<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** Corre `work` en una transacción; el puerto que recibe participa de ella. */
  transaction<R>(work: (tx: SqlPort) => Promise<R>): Promise<R>;
}

/** Adaptador sobre el `EntityManager` de la aplicación. */
@Injectable()
export class MikroSqlPort implements SqlPort {
  constructor(private readonly em: EntityManager) {}

  query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return this.em.execute<T[]>(sql, [...params], 'all');
  }

  transaction<R>(work: (tx: SqlPort) => Promise<R>): Promise<R> {
    return this.em.fork().transactional(async (tx) => {
      // Las filas del registro de plataforma no pertenecen a ningún tenant del
      // actor: se opera con el contexto de sistema, LOCAL a esta transacción
      // (mismo mecanismo que `AuthzClinicalScopeService` y los seeders). Sin
      // RLS activo es inocuo; con RLS, sin esto el INSERT/SELECT no verían la fila.
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return work(new TransactionalSqlPort(tx));
    });
  }
}

class TransactionalSqlPort implements SqlPort {
  constructor(private readonly tx: EntityManager) {}

  query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return this.tx.execute<T[]>(sql, [...params], 'all');
  }

  transaction<R>(work: (tx: SqlPort) => Promise<R>): Promise<R> {
    // Ya estamos dentro de una transacción: se reutiliza.
    return work(this);
  }
}
