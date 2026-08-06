import { Injectable } from '@nestjs/common';
import { DataSourceConfigurationError } from '../errors/persistence.errors';
import type { ConnectionRole } from '../config/connection-descriptor';
import type {
  ConnectionHealth,
  DataConnection,
} from './data-connection.contract';

/**
 * Registro central de conexiones.
 *
 * Es un proveedor de NestJS y no un singleton de módulo (§11): su ciclo de vida
 * es el del contenedor, de modo que un test puede levantar dos aplicaciones con
 * registros distintos sin que se pisen, y el apagado ordenado tiene un dueño
 * claro en vez de depender de que alguien recuerde vaciar una variable global.
 *
 * El registro no crea conexiones. Solo las guarda, las resuelve y las cierra;
 * quien las construye es la fábrica. Esa separación es lo que permite registrar
 * una conexión falsa en una prueba sin tocar el entorno.
 *
 * Un mismo pool puede estar publicado bajo varios nombres. Es el caso normal,
 * no la excepción: cuando lectura y escritura resultan equivalentes (§12), hay
 * una única instancia sirviendo a `postgres-read` y a `postgres-write`. El
 * registro guarda los alias en un índice aparte para no confundir «cuántos
 * nombres hay» con «cuántos pools hay», que es la cifra que de verdad importa
 * al dimensionar `max_connections`.
 */
@Injectable()
export class ConnectionRegistry {
  /** Nombre publicado → conexión. Incluye alias. */
  private readonly byName = new Map<string, DataConnection>();

  /**
   * Registra una conexión bajo su nombre y, opcionalmente, bajo alias.
   *
   * Volver a registrar el mismo nombre apuntando al mismo destino es
   * idempotente y no falla. Con un destino distinto sí falla: un nombre
   * ambiguo haría que el enrutado devolviera una conexión u otra según el orden
   * de inserción, que es la clase de fallo que no se reproduce en local.
   */
  register(connection: DataConnection, aliases: readonly string[] = []): void {
    for (const name of [connection.name, ...aliases]) {
      const existing = this.byName.get(name);
      if (existing) {
        if (existing.fingerprint === connection.fingerprint) continue;
        throw new DataSourceConfigurationError(
          `Ya hay una conexión registrada como «${name}» apuntando a otro destino.`,
        );
      }
      this.byName.set(name, connection);
    }
  }

  /** Conexión por nombre. Falla si no existe: el enrutado no puede adivinar. */
  get(name: string): DataConnection {
    const connection = this.byName.get(name);
    if (!connection) {
      const known = [...this.byName.keys()].join(', ') || '(ninguna)';
      throw new DataSourceConfigurationError(
        `No hay ninguna conexión registrada como «${name}». Registradas: ${known}.`,
      );
    }
    return connection;
  }

  /** Si el nombre está registrado. */
  has(name: string): boolean {
    return this.byName.has(name);
  }

  /** Nombres publicados, alias incluidos. */
  names(): string[] {
    return [...this.byName.keys()];
  }

  /**
   * Pools distintos registrados, sin duplicar los que comparten instancia.
   *
   * Es la cifra que hay que multiplicar por `pool.max` para saber cuántas
   * conexiones puede abrir este proceso contra el servidor.
   */
  distinctConnections(): DataConnection[] {
    return [...new Map(this.all().map((c) => [c.fingerprint, c])).values()];
  }

  /**
   * Conexiones que desempeñan un papel.
   *
   * `read-write` cuenta tanto para `read` como para `write`: es el papel de la
   * instancia compartida, que sirve a las dos rutas.
   */
  byRole(role: ConnectionRole): DataConnection[] {
    return this.distinctConnections().filter(
      (connection) =>
        connection.role === role || connection.role === 'read-write',
    );
  }

  /** Todas las conexiones publicadas, con repetición si comparten instancia. */
  private all(): DataConnection[] {
    return [...this.byName.values()];
  }

  /**
   * Comprueba la salud de cada nombre publicado.
   *
   * En paralelo: una conexión caída no debe impedir conocer el estado de las
   * demás, que es justo la información que hace falta durante un incidente. Un
   * `healthCheck` que lance -no debería, los adaptadores devuelven `down`- se
   * traduce igualmente a `down` en vez de tumbar el informe entero.
   */
  async healthCheckAll(): Promise<Record<string, ConnectionHealth>> {
    const names = this.names();
    const results = await Promise.allSettled(
      names.map((name) => this.get(name).healthCheck()),
    );
    const report: Record<string, ConnectionHealth> = {};
    names.forEach((name, index) => {
      const result = results[index];
      const connection = this.get(name);
      report[name] =
        result.status === 'fulfilled'
          ? result.value
          : {
              status: 'down',
              role: connection.role,
              engine: connection.engine,
              latencyMs: 0,
              reason: 'La comprobación de salud falló de forma inesperada.',
            };
    });
    return report;
  }

  /** Cierra una conexión concreta y retira todos sus nombres del registro. */
  async close(name: string): Promise<void> {
    const connection = this.byName.get(name);
    if (!connection) return;
    for (const [published, registered] of [...this.byName.entries()]) {
      if (registered === connection) this.byName.delete(published);
    }
    await connection.close();
  }

  /**
   * Cierra todas las conexiones.
   *
   * Se apoya en `allSettled` porque un fallo al cerrar la primera no debe dejar
   * las demás abiertas: en un apagado, filtrar pools es peor que un error al
   * cerrar uno. El índice se vacía antes de cerrar, para que una conexión ya en
   * cierre no pueda resolverse y usarse a medio camino.
   */
  async closeAll(): Promise<void> {
    const pools = this.distinctConnections();
    this.byName.clear();
    await Promise.allSettled(pools.map((connection) => connection.close()));
  }
}
