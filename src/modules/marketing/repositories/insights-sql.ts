import type { EntityManager } from '@mikro-orm/postgresql';

/** Instante UTC en ISO 8601 con milisegundos, tal como lo espera el contrato del front. */
export const isoTs = (column: string): string =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const placeholders = (values: readonly unknown[]): string =>
  values.map(() => '?').join(', ');

/**
 * Base de los repositorios SQL de Insights. Si `em` es el que entrega
 * `em.transactional`, cada consulta corre dentro de esa transacción.
 */
export abstract class InsightsSqlBase {
  constructor(protected readonly em: EntityManager) {}

  protected sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em
      .getConnection()
      .execute<T[]>(query, params, 'all', this.em.getTransactionContext());
  }

  protected async one<T>(
    query: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    return (await this.sql<T>(query, params))[0] ?? null;
  }

  /**
   * Conceptos de un value set de Insights: código en minúsculas → id. Los
   * códigos de `terminology.catalog_concepts` van en mayúsculas
   * (`IN_PROGRESS`); el contrato usa `in_progress`.
   */
  async conceptIds(valueSetCode: string): Promise<Map<string, string>> {
    const rows = await this.sql<{ code: string; id: string }>(
      `SELECT DISTINCT lower(c.code) AS code, c.id
         FROM terminology.value_sets vs
         JOIN terminology.value_set_versions v ON v.value_set_id = vs.id
         JOIN terminology.value_set_members m ON m.value_set_version_id = v.id
         JOIN terminology.catalog_concepts c ON c.id = m.concept_id
        WHERE vs.internal_code = ? AND m.included = true`,
      [valueSetCode.toUpperCase()],
    );
    return new Map(rows.map((row) => [row.code, row.id]));
  }
}
