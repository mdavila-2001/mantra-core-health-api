/** `true` si el error es la violación de unicidad de Postgres (otra petición escribió antes). */
export function esUnicidad(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  return (
    e?.code === '23505' ||
    /duplicate key|unique constraint/i.test(e?.message ?? '')
  );
}
