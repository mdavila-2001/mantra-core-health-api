import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DomainException, ErrorCode } from '../../../common';
import { AutomationErrorReason } from '../automation.error-reasons';

/** Destino de la escritura, ya partido en esquema y tabla. */
export interface TargetTable {
  /**
   * Valor de schema name mantenido por la instancia.
   */
  schemaName: string;
  /**
   * Valor de table name mantenido por la instancia.
   */
  tableName: string;
}

/**
 * Describe el contrato estructural de write record result.
 */
export interface WriteRecordResult {
  /**
   * Identificador único de la instancia.
   */
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

/** Columna que identifica al tenant propietario de la fila destino. */
const TENANT_COLUMN = 'tenant_id';

/**
 * Esquemas en los que una automatización de registro puede escribir. El resto
 * se rechaza (denegar por defecto): un agente nunca escribe de forma dinámica
 * en esquemas clínicos, de identidad, de autorización, de auditoría ni
 * financieros, por mucho que el identificador sea sintácticamente válido.
 */
const ALLOWED_TARGET_SCHEMAS: ReadonlySet<string> = new Set([
  'crm',
  'marketing',
  'promotions',
  'scheduling',
  'surveys',
  'education',
  'tracking',
]);

/**
 * SQLSTATE con los que PostgreSQL informa de que el destino configurado no
 * existe tal cual está escrito: tabla (`42P01`), columna (`42703`) o clave de
 * deduplicación sin índice único que la respalde (`42P10`).
 */
const INVALID_TARGET_SQLSTATES: ReadonlySet<string> = new Set([
  '42P01',
  '42703',
  '42P10',
]);

/**
 * Error 400 de configuración del destino. Es entrada corregible, no un fallo del
 * servidor, y lleva un `reason` estable para que el runtime no tenga que leer
 * texto libre. Nunca incluye el identificador recibido ni SQL.
 */
function invalidTarget(
  message: string,
  reason:
    | AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID
    | AutomationErrorReason.AUTOMATION_RECORD_MAPPING_EMPTY = AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    message,
    undefined,
    reason,
  );
}

/** SQLSTATE de PostgreSQL de la cadena de causas del error, si lo hay. */
function sqlStateOf(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (
      typeof candidate.code === 'string' &&
      /^[0-9A-Z]{5}$/.test(candidate.code)
    ) {
      return candidate.code;
    }
    current = candidate.cause;
  }
  return undefined;
}

/**
 * Ejecuta la operación quote identifier.
 *
 * @param value - Valor de value requerido por la operación.
 * @param what - Valor de what requerido por la operación.
 * @returns Resultado de quote identifier conforme al contrato `string`.
 * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
 */
function quoteIdentifier(value: string, what: string): string {
  if (!SAFE_IDENTIFIER.test(value)) {
    // No se devuelve el valor recibido: si alguien logró configurar un
    // identificador hostil, el mensaje de error no debe reflejárselo.
    throw invalidTarget(
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
    throw invalidTarget(
      'La automatización de registro debe declarar el destino como `esquema.tabla`.',
    );
  }
  const target = { schemaName: parts[0], tableName: parts[1] };
  assertTargetAllowed(target);
  return target;
}

/**
 * Exige que el destino sea un identificador válido de un esquema permitido.
 *
 * @param target - Destino ya partido en esquema y tabla.
 * @throws DomainException 400 `VALIDATION_FAILED` / `AUTOMATION_RECORD_TARGET_INVALID`
 *   si el esquema no está permitido o algún identificador no es válido. El mensaje
 *   no refleja lo recibido.
 */
export function assertTargetAllowed(target: TargetTable): void {
  quoteIdentifier(target.schemaName, 'esquema de destino');
  quoteIdentifier(target.tableName, 'tabla de destino');
  if (!ALLOWED_TARGET_SCHEMAS.has(target.schemaName)) {
    throw invalidTarget(
      'La automatización de registro declara un esquema de destino que no admite escritura automática.',
    );
  }
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
    assertTargetAllowed(target);
    const schema = quoteIdentifier(target.schemaName, 'esquema de destino');
    const table = quoteIdentifier(target.tableName, 'tabla de destino');

    const columnNames = Object.keys(columns);
    if (columnNames.length === 0) {
      throw invalidTarget(
        'La automatización de registro no produjo ninguna columna que escribir.',
        AutomationErrorReason.AUTOMATION_RECORD_MAPPING_EMPTY,
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
        // fila desde una operación que decía estar actualizándola. El dueño de la
        // fila (`tenant_id`) tampoco se reasigna nunca.
        const updatable = columnNames.filter(
          (c) => !dedupeColumns.includes(c) && c !== TENANT_COLUMN,
        );
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
          // Una clave de deduplicación sin `tenant_id` puede chocar con la fila de
          // otra organización: sólo se actualiza la fila que ya es de este tenant.
          // Si es ajena no se toca y la respuesta es `written: false`.
          if (columnNames.includes(TENANT_COLUMN)) {
            const tenant = quoteIdentifier(TENANT_COLUMN, 'campo de destino');
            sql += ` where ${schema}.${table}.${tenant} = excluded.${tenant}`;
          }
        }
      } else {
        sql += ` on conflict (${conflictTarget}) do nothing`;
      }
    }

    sql += ' returning id';

    let rows:
      | {
          /**
           * Identificador único de la instancia.
           */
          id: string;
        }[]
      | undefined;
    try {
      rows = await em.getConnection().execute<
        {
          /**
           * Identificador único de la instancia.
           */
          id: string;
        }[]
      >(sql, values, 'all', em.getTransactionContext());
    } catch (error) {
      // Una tabla, columna o clave de deduplicación que la base no reconoce es
      // configuración corregible. Se traduce sin SQL ni identificadores: el
      // mensaje de la base nombra tabla y columna, y no debe salir al cliente.
      const sqlState = sqlStateOf(error);
      if (sqlState && INVALID_TARGET_SQLSTATES.has(sqlState)) {
        throw invalidTarget(
          'La automatización de registro declara un destino que la base no reconoce.',
        );
      }
      throw error;
    }

    const row = rows?.[0];
    // `do nothing` sobre una colisión no devuelve filas: eso es exactamente la
    // deduplicación funcionando, no un error.
    return row ? { id: row.id, written: true } : { written: false };
  }
}
