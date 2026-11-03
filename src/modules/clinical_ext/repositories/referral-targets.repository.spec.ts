import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReferralTargetsRepository } from './referral-targets.repository';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { DIR } from '../../directory/directory.concepts';

/**
 * Sin base de datos en las pruebas unitarias, lo que se fija acá es el
 * contrato de la consulta: que la regla de visibilidad del directorio público
 * viaja SIEMPRE en el WHERE —con sus valores exactos— y que no se compara
 * contra códigos internos. Un profesional sin vitrina pública activa, o con la
 * vitrina oculta o inactiva, no satisface ese predicado y no sale.
 */
function build(rows: unknown[] = []) {
  const execute = mockFn(() => Promise.resolve(rows));
  const em: any = { getConnection: () => ({ execute }) };
  return { repo: new ReferralTargetsRepository(), em, execute };
}

/** Normaliza espacios para comparar fragmentos de SQL. */
const flat = (sql: string) => sql.replace(/\s+/g, ' ');

describe('ReferralTargetsRepository', () => {
  describe('searchPractitioners', () => {
    it('exige vitrina pública ACTIVA del tipo profesional (oculto o inactivo no sale)', async () => {
      const d = build();
      await d.repo.searchPractitioners(
        d.em,
        'ana',
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
        20,
      );
      const [sql, params] = d.execute.mock.calls[0];
      expect(flat(sql)).toContain(
        'EXISTS ( SELECT 1 FROM community.public_profiles pp WHERE pp.target_id = hp.profile_id AND pp.target_type_concept_id = ? AND pp.visibility_concept_id = ? AND pp.status_concept_id = ? )',
      );
      expect(params).toEqual([
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
        COMM.PROFILE_TARGET_PRACTITIONER,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        '%ana%',
        CONCEPTS.TENANT_ACTIVE,
        20,
      ]);
      // Por igualdad: ni «distinto de privado» ni un OR que deje pasar nulos.
      expect(flat(sql)).not.toMatch(/visibility_concept_id\s*(<>|!=|IS NULL)/i);
      expect(flat(sql)).not.toMatch(/\bOR\b/);
    });

    it('no busca por practitioner_code ni otro código interno', async () => {
      const d = build();
      await d.repo.searchPractitioners(
        d.em,
        'MP-123',
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
        20,
      );
      const [sql] = d.execute.mock.calls[0];
      expect(sql).not.toContain('practitioner_code');
    });

    it('el texto es literal: los comodines de LIKE se escapan', async () => {
      const d = build();
      await d.repo.searchPractitioners(
        d.em,
        '50%_x',
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
        20,
      );
      expect(d.execute.mock.calls[0][1][4]).toBe('%50\\%\\_x%');
    });
  });

  describe('searchOrganizations', () => {
    it('exige tenant ACTIVO con vitrina pública activa de organización, sin buscar por código', async () => {
      const d = build([
        { tenantId: 't1', legalName: 'Clínica Norte S.R.L.', tradeName: null },
      ]);
      const res = await d.repo.searchOrganizations(d.em, 'norte', 20);
      const [sql, params] = d.execute.mock.calls[0];
      expect(flat(sql)).toContain('WHERE t.status_concept_id = ?');
      expect(flat(sql)).toContain('pp.target_id = t.id');
      expect(sql).not.toMatch(/\bt\.code\b/);
      expect(params).toEqual([
        CONCEPTS.TENANT_ACTIVE,
        COMM.PROFILE_TARGET_ORGANIZATION,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        '%norte%',
        '%norte%',
        20,
      ]);
      expect(res).toEqual([
        { tenantId: 't1', legalName: 'Clínica Norte S.R.L.', tradeName: null },
      ]);
    });
  });

  describe('isListablePractitioner (#1058)', () => {
    it('aplica la misma regla de visibilidad que la búsqueda', async () => {
      const d = build([{ ok: 1 }]);
      await expect(d.repo.isListablePractitioner(d.em, 'hp-1')).resolves.toBe(
        true,
      );
      const [sql, params] = d.execute.mock.calls[0];
      expect(flat(sql)).toContain(
        'EXISTS ( SELECT 1 FROM community.public_profiles pp WHERE pp.target_id = hp.profile_id AND pp.target_type_concept_id = ? AND pp.visibility_concept_id = ? AND pp.status_concept_id = ? )',
      );
      expect(params).toEqual([
        'hp-1',
        COMM.PROFILE_TARGET_PRACTITIONER,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ]);
    });

    it('sin fila (vitrina oculta, inactiva o inexistente) no es listable', async () => {
      const d = build([]);
      await expect(d.repo.isListablePractitioner(d.em, 'hp-1')).resolves.toBe(
        false,
      );
    });
  });

  describe('isActiveTenant (#1058)', () => {
    it('sólo mira el estado del tenant, sin vitrina', async () => {
      const d = build([{ ok: 1 }]);
      await expect(d.repo.isActiveTenant(d.em, 't1')).resolves.toBe(true);
      const [sql, params] = d.execute.mock.calls[0];
      expect(flat(sql)).toContain('t.status_concept_id = ?');
      expect(flat(sql)).not.toContain('public_profiles');
      expect(params).toEqual(['t1', CONCEPTS.TENANT_ACTIVE]);
    });

    it('sin fila (inexistente o inactivo) es false', async () => {
      const d = build([]);
      await expect(d.repo.isActiveTenant(d.em, 't1')).resolves.toBe(false);
    });
  });

  describe('isListableOrganization (#1058)', () => {
    it('exige tenant ACTIVO y vitrina pública activa de organización', async () => {
      const d = build([{ ok: 1 }]);
      await expect(d.repo.isListableOrganization(d.em, 't1')).resolves.toBe(
        true,
      );
      const [sql, params] = d.execute.mock.calls[0];
      expect(flat(sql)).toContain('t.status_concept_id = ?');
      expect(flat(sql)).toContain('pp.target_id = t.id');
      expect(params).toEqual([
        't1',
        CONCEPTS.TENANT_ACTIVE,
        COMM.PROFILE_TARGET_ORGANIZATION,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ]);
    });

    it('sin fila (perfil no público o tenant inactivo) no es listable', async () => {
      const d = build([]);
      await expect(d.repo.isListableOrganization(d.em, 't1')).resolves.toBe(
        false,
      );
    });
  });

  /**
   * #1201: el WHERE real, evaluado contra filas en memoria. La consulta se
   * interpreta tal cual la manda el repositorio: cada `?` se liga en orden a
   * su parámetro, y cada comparación `alias.columna = ?` (o `pp.target_id =
   * t.id`) se evalúa sobre las filas sembradas. Si la consulta trae un
   * predicado que este intérprete no conoce, el test falla en vez de
   * ignorarlo.
   */
  describe('estados del tenant evaluados en memoria (#1201)', () => {
    const PUBLIC_ORG = {
      target_type_concept_id: COMM.PROFILE_TARGET_ORGANIZATION,
      visibility_concept_id: COMM.PROFILE_VISIBILITY_PUBLIC,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
    };
    const db = {
      tenants: [
        { id: 'ten-activo', status_concept_id: CONCEPTS.TENANT_ACTIVE },
        { id: 'ten-inactivo', status_concept_id: DIR.TENANT_SUSPENDED },
        // Activo pero sin vitrina pública: no listable como organización.
        { id: 'ten-sin-vitrina', status_concept_id: CONCEPTS.TENANT_ACTIVE },
      ] as Record<string, unknown>[],
      public_profiles: [
        { target_id: 'ten-activo', ...PUBLIC_ORG },
        // El inactivo tiene vitrina: queda fuera por su estado, no por ella.
        { target_id: 'ten-inactivo', ...PUBLIC_ORG },
      ] as Record<string, unknown>[],
    };

    /** Ejecuta la consulta de tenants contra `db`, sin base de datos. */
    function inMemory(sql: string, params: unknown[]): { ok: number }[] {
      const text = flat(sql);
      expect(text).toContain('FROM directory.tenants t WHERE');
      const comparisons = [...text.matchAll(/\b(t|pp)\.(\w+) = (\?|t\.id)/g)];
      // Toda marca `?` corresponde a una comparación conocida.
      expect(comparisons.filter((m) => m[3] === '?')).toHaveLength(
        (text.match(/\?/g) ?? []).length,
      );
      let next = 0;
      const tenantPreds: [string, unknown][] = [];
      const profilePreds: [string, unknown][] = [];
      let joinsProfile = false;
      for (const [, alias, column, rhs] of comparisons) {
        if (rhs === 't.id') {
          expect(`${alias}.${column}`).toBe('pp.target_id');
          joinsProfile = true;
          continue;
        }
        (alias === 't' ? tenantPreds : profilePreds).push([
          column,
          params[next++],
        ]);
      }
      expect(next).toBe(params.length);
      const hit = (row: Record<string, unknown>, preds: [string, unknown][]) =>
        preds.every(([column, value]) => row[column] === value);
      return db.tenants
        .filter((t) => hit(t, tenantPreds))
        .filter(
          (t) =>
            !joinsProfile ||
            db.public_profiles.some(
              (pp) => pp.target_id === t.id && hit(pp, profilePreds),
            ),
        )
        .map(() => ({ ok: 1 }));
    }

    function buildInMemory() {
      const execute = mockFn((sql: string, params: unknown[]) =>
        Promise.resolve(inMemory(sql, params)),
      );
      const em: any = { getConnection: () => ({ execute }) };
      return { repo: new ReferralTargetsRepository(), em };
    }

    it.each(['ten-inexistente', 'ten-inactivo', 'ten-sin-vitrina'])(
      'isListableOrganization(%s) es false',
      async (tenantId) => {
        const d = buildInMemory();
        await expect(
          d.repo.isListableOrganization(d.em, tenantId),
        ).resolves.toBe(false);
      },
    );

    it('isListableOrganization de un tenant activo con vitrina es true', async () => {
      const d = buildInMemory();
      await expect(
        d.repo.isListableOrganization(d.em, 'ten-activo'),
      ).resolves.toBe(true);
    });

    it.each(['ten-inexistente', 'ten-inactivo'])(
      'isActiveTenant(%s) es false',
      async (tenantId) => {
        const d = buildInMemory();
        await expect(d.repo.isActiveTenant(d.em, tenantId)).resolves.toBe(
          false,
        );
      },
    );

    it('isActiveTenant no pide vitrina: activo con o sin ella es true', async () => {
      const d = buildInMemory();
      await expect(d.repo.isActiveTenant(d.em, 'ten-activo')).resolves.toBe(
        true,
      );
      await expect(
        d.repo.isActiveTenant(d.em, 'ten-sin-vitrina'),
      ).resolves.toBe(true);
    });

    /**
     * `searchPractitioners` filtra por el tenant de la práctica principal. Se
     * evalúa su `NOT EXISTS` real, con el parámetro que el repositorio liga,
     * para cada `pr.tenant_id` posible.
     */
    describe('searchPractitioners: tenant de la práctica principal', () => {
      async function tenantFilter() {
        const d = build();
        await d.repo.searchPractitioners(
          d.em,
          'ana',
          PRAC.ROLE_ASSIGNMENT_ACTIVE,
          20,
        );
        const [sql, params] = d.execute.mock.calls[0];
        const text = flat(sql);
        const clause =
          'NOT EXISTS ( SELECT 1 FROM directory.tenants tn WHERE tn.id = pr.tenant_id AND tn.status_concept_id IS DISTINCT FROM ? )';
        const at = text.indexOf(clause);
        expect(at).toBeGreaterThan(-1);
        // El parámetro de esta marca: tantas `?` antes como posiciones.
        const status = params[(text.slice(0, at).match(/\?/g) ?? []).length];
        expect(status).toBe(CONCEPTS.TENANT_ACTIVE);
        // `pr.tenant_id` viene del LATERAL de la práctica principal.
        expect(text).toContain('pr ON TRUE');
        return (prTenantId: string | null) =>
          !db.tenants.some(
            (tn) => tn.id === prTenantId && tn.status_concept_id !== status,
          );
      }

      it('fuera si la práctica principal es de un tenant inactivo', async () => {
        const passes = await tenantFilter();
        expect(passes('ten-inactivo')).toBe(false);
      });

      it('dentro con tenant activo (con o sin vitrina) y sin práctica vigente', async () => {
        const passes = await tenantFilter();
        expect(passes('ten-activo')).toBe(true);
        expect(passes('ten-sin-vitrina')).toBe(true);
        // Sin práctica: `tenantId` nulo, derivable sin organización.
        expect(passes(null)).toBe(true);
      });
    });
  });
});
