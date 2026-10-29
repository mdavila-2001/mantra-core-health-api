/** Lo que se sabe de un error de PostgreSQL. */
export interface PostgresViolation {
  /** SQLSTATE de cinco caracteres (`23505`…). */
  readonly sqlstate: string;
  /** Nombre de la restricción, si el driver lo trae. */
  readonly constraint?: string;
}

/**
 * Extrae el SQLSTATE (y la restricción) de un error del driver, recorriendo la
 * cadena de causas. El texto del servidor no se devuelve: puede traer valores de
 * columnas y no debe salir de este módulo.
 *
 * @param error - Lo que lanzó la capa de datos.
 * @returns La violación, o `undefined` si el error no viene de PostgreSQL.
 */
export function postgresViolation(
  error: unknown,
): PostgresViolation | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (
      typeof candidate.code === 'string' &&
      /^[0-9A-Z]{5}$/.test(candidate.code)
    ) {
      return {
        sqlstate: candidate.code,
        constraint:
          typeof candidate.constraint === 'string'
            ? candidate.constraint
            : undefined,
      };
    }
    current = candidate.cause;
  }
  return undefined;
}

/** Fija el contexto de sistema en la transacción (los jobs corren sin tenant; RLS lo admite). */
export async function enterSystemContext(tx: {
  execute: (sql: string) => Promise<unknown>;
}): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'true', true)");
}
