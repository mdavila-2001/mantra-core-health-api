import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Destino de la escritura, ya partido en esquema y tabla. */
export interface TargetTable {
  schemaName: string;
  tableName: string;
}

export interface WriteRecordResult {
  id?: string;
  /** `false` cuando la clave de deduplicación ya existía y no se pidió actualizar. */
  written: boolean;
}

/**
 * Identificadores SQL admisibles. `record_automations.target_resource_type`,
 * `field_mapping_json` y `dedupe_key_expr` son texto libre en el modelo, así que
 * la sentencia se compone en tiempo de ejecución y los identificadores **no**
 * pueden parametrizarse: un identificador no admite bind. La lista blanca es lo
 * que sustituye al bind.
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

function quoteIdentifier(value: string, what: string): string {
  if (!SAFE_IDENTIFIER.test(value)) {
    // No se devuelve el valor recibido: si alguien logró configurar un
    // identificador hostil, el mensaje de error no debe reflejárselo.
    throw new InternalServerErrorException(
      `La automatización de registro declara un ${what} que no es un identificador SQL válido.`,
    );
  }
  return `"${value}"`;
}

/**
 * Parte `esquema.tabla` en sus dos mitades. Sin punto no hay esquema, y escribir
 * en el `search_path` del momento haría que el destino dependiera de la conexión.
 */
export function parseTargetResource(targetResourceType: string): TargetTable {
  const parts = targetResourceType.split('.');
  if (parts.length !== 2) {
    throw new InternalServerErrorException(
      'La automatización de registro debe declarar el destino como `esquema.tabla`.',
    );
  }
  return { schemaName: parts[0], tableName: parts[1] };
}

/**
 * Escritura del **registro de destino** de una automatización (UC-48-13).
 *
 * Es el único punto del módulo que escribe fuera del esquema `automation`, y lo
 * hace a propósito: `record_automations` guarda `target_resource_type`,
 * `field_mapping_json` y `dedupe_key_expr` precisamente para poder escribir en un
 * destino que no se conoce en tiempo de compilación.
 */
@Injectable()
export class TargetRecordRepository {
  /**
   * Inserta la fila. Con `upsert`, la colisión sobre las columnas de
   * deduplicación actualiza en vez de fallar; sin él, la colisión no escribe nada
   * y se devuelve `written: false` — que es lo que hace idempotente al paso
   * cuando el agente reintenta.
   */
  async writeRecord(
    em: EntityManager,
    target: TargetTable,
    columns: Record<string, unknown>,
    dedupeColumns: string[],
    upsert: boolean,
  ): Promise<WriteRecordResult> {
    const schema = quoteIdentifier(target.schemaName, 'esquema de destino');
    const table = quoteIdentifier(target.tableName, 'tabla de destino');

    const columnNames = Object.keys(columns);
    if (columnNames.length === 0) {
      throw new InternalServerErrorException(
        'La automatización de registro no produjo ninguna columna que escribir.',
      );
    }

    const quotedColumns = columnNames.map((c) =>
      quoteIdentifier(c, 'campo de destino'),
    );
    const placeholders = columnNames.map(() => '?').join(', ');
    const values = columnNames.map((c) => columns[c]);

    let sql =
      `insert into ${schema}.${table} (${quotedColumns.join(', ')}) ` +
      `values (${placeholders})`;

    if (dedupeColumns.length > 0) {
      const conflictTarget = dedupeColumns
        .map((c) => quoteIdentifier(c, 'campo de deduplicación'))
        .join(', ');

      if (upsert) {
        // Se actualiza todo menos las columnas de la clave: reescribirlas con el
        // mismo valor es ruido, y con otro valor sería cambiar la identidad de la
        // fila desde una operación que decía estar actualizándola.
        const updatable = columnNames.filter((c) => !dedupeColumns.includes(c));
        if (updatable.length === 0) {
          sql += ` on conflict (${conflictTarget}) do nothing`;
        } else {
          const assignments = updatable
            .map((c) => {
              const quoted = quoteIdentifier(c, 'campo de destino');
              return `${quoted} = excluded.${quoted}`;
            })
            .join(', ');
          sql += ` on conflict (${conflictTarget}) do update set ${assignments}`;
        }
      } else {
        sql += ` on conflict (${conflictTarget}) do nothing`;
      }
    }

    sql += ' returning id';

    const rows = await em
      .getConnection()
      .execute<{ id: string }[]>(
        sql,
        values,
        'all',
        em.getTransactionContext(),
      );

    const row = rows?.[0];
    // `do nothing` sobre una colisión no devuelve filas: eso es exactamente la
    // deduplicación funcionando, no un error.
    return row ? { id: row.id, written: true } : { written: false };
  }
}
