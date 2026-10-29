import { practiceOutOfScope } from './practice-scope';

/** SQLSTATE `foreign_key_violation`: lo levantan las FK y el trigger de tenant del modelo (F1b). */
const FOREIGN_KEY_VIOLATION = '23503';

/**
 * ¿Es una violación de FK? Mira el SQLSTATE y el nombre de la clase, porque el
 * ORM envuelve el error del driver según la versión.
 *
 * @param error - Lo capturado.
 * @returns `true` si es `23503`.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return (
    code === FOREIGN_KEY_VIOLATION ||
    error.constructor?.name === 'ForeignKeyConstraintViolationException'
  );
}

/**
 * Ejecuta una escritura y traduce la violación de FK a **404**.
 *
 * En F1b el aislamiento entre tenants vive en la base: las FK compuestas
 * `(tenant_id, x_id)` y el trigger de `facility_licenses` rechazan con `23503`
 * una referencia a un padre de otro tenant. La API valida antes y no debería
 * llegar acá; si llega (carrera, bug), la respuesta es la misma que la de un id
 * inexistente: nunca se revela que el padre existe en otra organización.
 *
 * @param write - La escritura (`flush`).
 * @returns El resultado de `write`.
 * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`) ante `23503`.
 */
export async function mapReferenceViolation<T>(
  write: () => Promise<T>,
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw practiceOutOfScope('Referencia no encontrada');
    }
    throw error;
  }
}
