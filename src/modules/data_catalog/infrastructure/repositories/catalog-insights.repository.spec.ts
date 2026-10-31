import type { EntityManager } from '@mikro-orm/postgresql';
import {
  QUALITY_RULE_CODES,
  rankSql,
} from '../../domain/catalog/governance-insights';
import { CatalogInsightsRepository } from './catalog-insights.repository';

/** Un EntityManager que sólo registra el SQL y los parámetros de cada `execute` (DOBLE: sin base real). */
function emQueRegistra() {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  const em = {
    getConnection: () => ({
      execute: (sql: string, params: unknown[]) => {
        llamadas.push({ sql, params });
        return Promise.resolve([]);
      },
    }),
    getTransactionContext: () => undefined,
  } as unknown as EntityManager;
  return { em, llamadas };
}

const placeholders = (sql: string): number => (sql.match(/\?/g) ?? []).length;
const INYECCION = "'; drop table data_catalog.catalog_objects; --";

describe('CatalogInsightsRepository (SQL generado, sin base real)', () => {
  describe('piiColumns', () => {
    it('cada placeholder tiene su parámetro y la entrada del cliente nunca entra al SQL', async () => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogInsightsRepository().piiColumns(em, {
        schema: INYECCION,
        minRank: 5,
        sensitivity: 'PHI_SPECIAL',
        reviewStatus: 'NEEDS_REVIEW',
        q: INYECCION,
        sort: 'sensitivity',
        cursor: { rk: -6, s: 'iam', o: 'users', c: 'email' },
        limit: 25,
      });
      const { sql, params } = llamadas[0];
      expect(placeholders(sql)).toBe(params.length);
      expect(sql).not.toContain('drop table');
      expect(params).toContain(INYECCION);
      // limit + 1 para saber si hay otra página
      expect(params.at(-1)).toBe(26);
    });

    it('ordena por nombre o por sensibilidad con la clave completa como desempate', async () => {
      const repo = new CatalogInsightsRepository();
      const porNombre = emQueRegistra();
      await repo.piiColumns(porNombre.em, {
        minRank: 5,
        sort: 'name',
        limit: 10,
      });
      expect(porNombre.llamadas[0].sql).toMatch(
        /order by schema_name, object_name, column_name\s+limit \?/,
      );
      const porNivel = emQueRegistra();
      await repo.piiColumns(porNivel.em, {
        minRank: 5,
        sort: 'sensitivity',
        limit: 10,
      });
      expect(porNivel.llamadas[0].sql).toMatch(
        /order by rk, schema_name, object_name, column_name\s+limit \?/,
      );
    });

    it('la continuación compara la misma tupla por la que ordena', async () => {
      const repo = new CatalogInsightsRepository();
      const a = emQueRegistra();
      await repo.piiColumns(a.em, {
        minRank: 5,
        sort: 'name',
        cursor: { s: 'a', o: 'b', c: 'c' },
        limit: 5,
      });
      expect(a.llamadas[0].sql).toContain(
        '(schema_name, object_name, column_name) > (?, ?, ?)',
      );
      expect(a.llamadas[0].params.slice(-4)).toEqual(['a', 'b', 'c', 6]);
      const b = emQueRegistra();
      await repo.piiColumns(b.em, {
        minRank: 5,
        sort: 'sensitivity',
        cursor: { rk: -7, s: 'a', o: 'b', c: 'c' },
        limit: 5,
      });
      expect(b.llamadas[0].sql).toContain(
        '(rk, schema_name, object_name, column_name) > (?, ?, ?, ?)',
      );
      expect(b.llamadas[0].params.slice(-5)).toEqual([-7, 'a', 'b', 'c', 6]);
    });

    it('lee sólo metadatos: ni valores ni texto libre de las fichas', async () => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogInsightsRepository().piiColumns(em, {
        minRank: 5,
        sort: 'name',
        limit: 1,
      });
      const sql = llamadas[0].sql;
      expect(sql).not.toMatch(
        /column_comment|definition|business_name|purpose|\bcontent\b/,
      );
      expect(sql.trimStart().startsWith('select')).toBe(true);
    });

    it('el CASE de la escala sale de la constante del dominio', () => {
      expect(rankSql('a.sensitivity')).toContain("when 'PERSONAL' then 5");
      expect(rankSql('a.sensitivity')).toContain("when 'CREDENTIAL' then 9");
    });
  });

  describe('calidad', () => {
    it('toda regla declarada tiene su select, y ninguno sobra', async () => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogInsightsRepository().qualityCounts(em, {});
      const codigosEnSql = [
        ...llamadas[0].sql.matchAll(/'(CAT-[A-Z-]+)'/g),
      ].map((m) => m[1]);
      expect([...new Set(codigosEnSql)].sort()).toEqual(
        [...QUALITY_RULE_CODES].sort(),
      );
    });

    it('filtros y cursor van como parámetros y alineados', async () => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogInsightsRepository().qualityIssues(em, {
        rule: 'CAT-PII-UNREVIEWED',
        severity: 'HIGH',
        schema: 'iam',
        q: INYECCION,
        cursor: { r: 'CAT-PII-UNREVIEWED', s: 'iam', o: 'users', c: 'email' },
        limit: 20,
      });
      const { sql, params } = llamadas[0];
      expect(placeholders(sql)).toBe(params.length);
      expect(sql).not.toContain('drop table');
      expect(params).toEqual([
        'CAT-PII-UNREVIEWED',
        'HIGH',
        'iam',
        expect.stringContaining('%'),
        'CAT-PII-UNREVIEWED',
        'iam',
        'users',
        'email',
        21,
      ]);
      expect(sql).toMatch(
        /order by rule_code, schema_name, object_name, coalesce\(column_name, ''\)/,
      );
    });

    it('el conteo usa los mismos filtros pero no el cursor ni el límite', async () => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogInsightsRepository().qualityCounts(em, {
        severity: 'LOW',
      });
      expect(llamadas[0].params).toEqual(['LOW']);
      expect(llamadas[0].sql).not.toMatch(/limit \?/);
    });
  });
});
