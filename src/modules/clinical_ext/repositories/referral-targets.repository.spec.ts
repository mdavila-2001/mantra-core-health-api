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
});
