import { Injectable } from '@nestjs/common';
import type { ConsistencyLevel } from '../ports/persistence-context';
import type { DataConnection } from '../registry/data-connection.contract';
import { ConnectionRegistry } from '../registry/connection.registry';
import {
  validateRoutingRules,
  type ModuleRoutingRule,
  type RoutingRules,
} from './routing.config';

/**
 * Petición de enrutado.
 *
 * Es lo único que un puerto necesita declarar: quién pregunta, si va a leer o a
 * escribir y con qué consistencia. Nunca un nombre de conexión -si el llamante
 * pudiera nombrar la conexión, el enrutado dejaría de ser declarativo y volvería
 * a estar repartido por el código, que es de lo que se venía-.
 */
export interface DataRoute {
  /** Módulo que origina la operación. */
  readonly module: string;
  /** Tipo de operación. */
  readonly operation: 'read' | 'write';
  /** Consistencia exigida; solo aplica a las lecturas. */
  readonly consistency?: ConsistencyLevel;
  /**
   * Tenant, cuando el enrutado dependa de él.
   *
   * Hoy ninguna regla lo usa -este backend aísla por RLS sobre una sola base,
   * no por base por tenant-, pero forma parte del contrato para que introducir
   * una base por tenant no obligue a cambiar la firma de todos los puertos.
   */
  readonly tenantId?: string;
}

/** Conexión resuelta para una ruta. */
export interface ResolvedDataSource {
  /** Nombre lógico de la conexión resuelta. */
  readonly connectionName: string;
  /** Conexión resuelta. */
  readonly connection: DataConnection;
  /**
   * Si la resolución se desvió de la ruta declarada.
   *
   * Es `true` cuando una lectura con consistencia fuerte acaba en la conexión
   * de escritura. No es un fallo: es información que el llamante puede registrar
   * y que explica por qué una lectura no fue a la réplica.
   */
  readonly redirected: boolean;
}

/**
 * Resuelve la conexión que atiende cada operación.
 *
 * Concentra en un único sitio la decisión que hoy no toma nadie -porque solo hay
 * una conexión- y que mañana no debe tomar un controlador.
 */
@Injectable()
export class DataSourceRouter {
  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly rules: RoutingRules,
  ) {
    // La validación ocurre al construir el router, es decir, durante el
    // arranque del contenedor: si el enrutado es inválido, el proceso no llega
    // a aceptar tráfico (§58).
    validateRoutingRules(this.rules, (name) =>
      this.registry.has(name) ? this.registry.get(name).role : undefined,
    );
  }

  /** Regla vigente para un módulo. */
  ruleFor(module: string): ModuleRoutingRule {
    return this.rules.modules[module] ?? this.rules.default;
  }

  /**
   * Resuelve la conexión de una ruta.
   *
   * Las escrituras van siempre a la conexión de escritura. Las lecturas van a
   * la de lectura salvo que exijan `strong` o `read-after-write`, en cuyo caso
   * se resuelven contra la primaria: son los dos casos en los que servir desde
   * una réplica con retraso devolvería datos que el propio actor sabe que están
   * obsoletos (§32).
   */
  resolve(route: DataRoute): ResolvedDataSource {
    const rule = this.ruleFor(route.module);

    if (route.operation === 'write') {
      return {
        connectionName: rule.write,
        connection: this.registry.get(rule.write),
        redirected: false,
      };
    }

    const needsPrimary =
      route.consistency === 'strong' ||
      route.consistency === 'read-after-write';
    const target = needsPrimary ? rule.write : rule.read;
    const connection = this.registry.get(target);
    // El desvío se decide comparando huellas, no nombres. Cuando lectura y
    // escritura comparten instancia, los dos nombres lógicos existen pero
    // apuntan al mismo pool: informar de un desvío ahí marcaría como desviada
    // cada lectura fuerte de un despliegue de una sola base, que es el caso
    // normal de este proyecto.
    const redirected =
      needsPrimary &&
      connection.fingerprint !== this.registry.get(rule.read).fingerprint;
    return { connectionName: target, connection, redirected };
  }

  /** Tabla vigente, para exponerla en el informe de fuentes de datos. */
  snapshot(): RoutingRules {
    return this.rules;
  }
}
