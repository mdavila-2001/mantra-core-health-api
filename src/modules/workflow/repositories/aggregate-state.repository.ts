import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Fila del agregado tal como la necesita la máquina: sólo estado y versión. */
export interface AggregateStateRow {
  stateConceptId: string;
  rowVersion: number;
}

/**
 * Identificadores SQL admisibles. La definición de la máquina guarda el esquema,
 * la tabla y la columna de estado del agregado como texto libre
 * (`aggregate_schema_name`, `aggregate_entity_name`, `status_field_name`), así que
 * la sentencia se compone en tiempo de ejecución y **no** puede parametrizarse:
 * un identificador no admite bind. La lista blanca es lo que sustituye al bind.
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

function quoteIdentifier(value: string, what: string): string {
  if (!SAFE_IDENTIFIER.test(value)) {
    // No se filtra el valor recibido al mensaje: si alguien logró escribir una
    // definición con un identificador hostil, el mensaje de error no debe
    // devolvérselo verbatim.
    throw new InternalServerErrorException(
      `La definición de la máquina de estado declara un ${what} que no es un identificador SQL válido.`,
    );
  }
  return `"${value}"`;
}

/**
 * Lectura y escritura del **agregado de dominio** que gobierna una máquina de
 * estado: la fila de `<aggregate_schema>.<aggregate_entity>` cuya columna de
 * estado mueve la transición (UC-32-05, 08, 09).
 *
 * Es el único punto del módulo que escribe fuera del esquema `workflow`, y lo hace
 * a propósito: `state_machine_definitions` declara el esquema, la tabla y la
 * columna precisamente para poder moverlas. La alternativa —una entidad MikroORM
 * por agregado gobernable— obligaría a tocar este módulo cada vez que un dominio
 * quisiera una máquina de estado, que es justo lo que el modelo evita.
 */
@Injectable()
export class AggregateStateRepository {
  /**
   * Lee la fila del agregado con `FOR UPDATE`. Bloquear antes de evaluar guardas
   * es lo que impide que dos comandos concurrentes lean el mismo estado de origen
   * y apliquen los dos su transición.
   */
  async findForUpdate(
    em: EntityManager,
    location: {
      schemaName: string;
      entityName: string;
      statusFieldName: string;
    },
    aggregateId: string,
  ): Promise<AggregateStateRow | null> {
    const schema = quoteIdentifier(location.schemaName, 'esquema');
    const table = quoteIdentifier(location.entityName, 'tabla');
    const statusColumn = quoteIdentifier(
      location.statusFieldName,
      'campo de estado',
    );

    const rows = await em
      .getConnection()
      .execute<{ state_concept_id: string; row_version: number }[]>(
        `select ${statusColumn} as state_concept_id, row_version from ${schema}.${table} where id = ? for update`,
        [aggregateId],
        'all',
        em.getTransactionContext(),
      );

    const row = rows?.[0];
    if (!row) return null;
    return {
      stateConceptId: row.state_concept_id,
      rowVersion: Number(row.row_version),
    };
  }

  /**
   * Mueve la columna de estado e incrementa `row_version`.
   *
   * `expectedRowVersion` traduce el `optimistic_lock_required` de la transición: si
   * llega y no coincide, el `UPDATE` afecta a cero filas y se devuelve `false`. El
   * servicio lo convierte en conflicto en vez de sobrescribir un cambio que el
   * llamante no vio.
   *
   * No se toca `updated_by_user_id`: quién ordenó el movimiento queda en
   * `workflow.state_transition_events`, que es el registro autoritativo del hecho
   * y no se puede editar después.
   */
  async updateState(
    em: EntityManager,
    location: {
      schemaName: string;
      entityName: string;
      statusFieldName: string;
    },
    aggregateId: string,
    toStateConceptId: string,
    expectedRowVersion?: number,
  ): Promise<boolean> {
    const schema = quoteIdentifier(location.schemaName, 'esquema');
    const table = quoteIdentifier(location.entityName, 'tabla');
    const statusColumn = quoteIdentifier(
      location.statusFieldName,
      'campo de estado',
    );

    const params: unknown[] = [toStateConceptId, aggregateId];
    let sql =
      `update ${schema}.${table} ` +
      `set ${statusColumn} = ?, row_version = row_version + 1, updated_at = now() ` +
      `where id = ?`;

    if (expectedRowVersion !== undefined) {
      sql += ' and row_version = ?';
      params.push(expectedRowVersion);
    }

    const result = await em
      .getConnection()
      .execute(sql, params, 'run', em.getTransactionContext());

    // El driver devuelve `affectedRows` en `run`; si no lo expone, se asume que
    // el UPDATE se aplicó, porque el `FOR UPDATE` previo ya garantizó la fila.
    const affected = (result as { affectedRows?: number } | undefined)
      ?.affectedRows;
    return affected === undefined ? true : affected > 0;
  }
}
