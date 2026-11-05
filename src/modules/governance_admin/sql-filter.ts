/**
 * Constructor mínimo de cláusulas `WHERE` parametrizadas. Todo valor viaja como parámetro
 * posicional: ninguna entrada del usuario se concatena en el SQL.
 */
export class SqlFilter {
  private readonly clauses: string[] = [];
  readonly params: unknown[] = [];

  /** Añade una cláusula; `?` marca dónde va el parámetro. */
  add(clause: string, value: unknown): this {
    this.params.push(value);
    this.clauses.push(clause.replace('?', `$${this.params.length}`));
    return this;
  }

  /** Añade una cláusula sin parámetro (p. ej. una comparación entre columnas). */
  addRaw(clause: string): this {
    this.clauses.push(clause);
    return this;
  }

  /** Reserva un parámetro y devuelve su marcador (`$n`). */
  param(value: unknown): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  get where(): string {
    return this.clauses.length ? `where ${this.clauses.join(' and ')}` : '';
  }
}

/** `%`, `_` y `\` de una búsqueda no son comodines. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function clampLimit(
  limit: number | undefined,
  def: number,
  max: number,
): number {
  return Math.min(Math.max(Math.trunc(limit ?? def), 1), max);
}
