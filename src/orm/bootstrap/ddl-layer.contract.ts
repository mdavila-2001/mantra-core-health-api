import type { Logger } from '@nestjs/common';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { SchemaSyncMode } from '../config/orm.env';

/**
 * Contrato común de las capas que materializan el DDL en el arranque.
 *
 * Por qué el arranque está partido en capas y no en un método largo: el orden
 * entre ellas no es una preferencia de estilo, es una dependencia dura de
 * PostgreSQL. No se puede crear una tabla con una columna `vector` si la
 * extensión no está instalada; no se puede crear una tabla en el schema `iam` si
 * el schema no existe; no se puede añadir una clave foránea a una tabla que
 * todavía no se ha creado. Modelar cada paso como una capa numerada hace que esa
 * dependencia sea explícita, testeable y legible.
 *
 * Toda capa debe cumplir dos propiedades:
 *
 *   1. Idempotencia. Se ejecuta en cada arranque de cada réplica; la segunda
 *      pasada y las siguientes no deben cambiar nada ni fallar.
 *   2. No destructividad. Ninguna capa borra tablas, columnas ni datos. Si el
 *      modelo elimina algo, esa retirada se hace con una migración revisada, no
 *      automáticamente al desplegar.
 */

/** Servicios que la secuencia de arranque pone a disposición de cada capa. */
export interface DdlLayerContext {
  /** Instancia del ORM ya inicializada, con la metadata de las entidades descubierta. */
  readonly orm: MikroORM;
  /** Modo de sincronización efectivo, tomado del entorno. */
  readonly mode: SchemaSyncMode;
  /** Logger con el contexto de la capa en curso. */
  readonly logger: Logger;

  /**
   * Ejecuta SQL contra la base.
   *
   * En modo `dry-run` no ejecuta: registra la sentencia y devuelve. Las capas no
   * necesitan por tanto comprobar el modo por su cuenta.
   *
   * @param sql   sentencia o lote de sentencias separadas por `;`
   * @param label descripción corta para el log y para el mensaje de error
   */
  execute(sql: string, label: string): Promise<void>;

  /**
   * Consulta de solo lectura contra el catálogo de PostgreSQL.
   *
   * Se expone aparte de `execute` porque las lecturas sí se hacen siempre,
   * incluso en `dry-run`: son las que permiten calcular qué falta.
   */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]>;
}

/** Resultado de aplicar una capa; se agrega en el informe final del arranque. */
export interface DdlLayerResult {
  readonly layer: string;
  /** Objetos creados o sentencias ejecutadas en esta pasada. */
  readonly applied: number;
  /** Objetos que ya existían y no hizo falta tocar. Es el número que debe dominar en un arranque estable. */
  readonly skipped: number;
  /** Fallos tolerados (por ejemplo, una extensión opcional sin permisos). */
  readonly failures: readonly string[];
  /** Duración de la capa en milisegundos. */
  readonly tookMs: number;
}

/** Una capa de materialización del DDL. */
export interface DdlLayer {
  /** Posición en la secuencia; determina el orden de ejecución. */
  readonly order: number;
  /** Identificador corto que aparece en el log y en el informe. */
  readonly name: string;
  /** Qué materializa y por qué va en esta posición. */
  readonly description: string;
  apply(
    context: DdlLayerContext,
  ): Promise<Omit<DdlLayerResult, 'layer' | 'tookMs'>>;
}
