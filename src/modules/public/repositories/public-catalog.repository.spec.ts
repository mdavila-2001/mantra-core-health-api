import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PHARM } from '../../pharmacy/pharmacy.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { PublicCatalogRepository } from './public-catalog.repository';

/**
 * El SQL de las fichas públicas (M4 · H2).
 *
 * Se aserta sobre la consulta que sale hacia la base: lo que protege a la
 * superficie pública es QUÉ columnas proyecta, que tenga `LIMIT` y keyset, y
 * qué filtros de publicación exige. No reemplaza correrla contra Postgres, que
 * queda para M1 (el techo de este carril sin base es `TESTED`).
 */
describe('PublicCatalogRepository (M4 · H2)', () => {
  const TENANT = '0a0a0a0a-0000-4000-8000-000000000001';

  function conConexion(filas: unknown[] = []) {
    const execute = mockFn().mockResolvedValue(filas);
    const em = { getConnection: mockFn(() => ({ execute })) };
    return { em, execute, repo: new PublicCatalogRepository() };
  }

  const sqlDe = (execute: any): string =>
    String(execute.mock.calls[0][0]).replace(/\s+/g, ' ');

  it('resuelve el slug sólo entre perfiles visibles y activos', async () => {
    const { em, execute, repo } = conConexion([]);

    const perfil = await repo.findVisibleProfileBySlug(
      em as any,
      'clinica-norte',
    );

    expect(perfil).toBeNull();
    expect(sqlDe(execute)).toContain('FROM community.public_profiles prof');
    expect(execute.mock.calls[0][1]).toEqual([
      'clinica-norte',
      COMM.PROFILE_VISIBILITY_PUBLIC,
      CONCEPTS.STATE_ACTIVE,
    ]);
  });

  describe('findOfferedServices', () => {
    it('proyecta sólo columnas publicables del catálogo de las prácticas activas de la organización', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findOfferedServices(em as any, TENANT, null, 21);

      const sql = sqlDe(execute);
      expect(sql).toContain('FROM billing.service_catalog sc');
      expect(sql).toContain('AND pr.tenant_id = ?');
      expect(sql).toContain('sc.default_price::text AS price');
      expect(sql).not.toMatch(/income_account_id|tax_code_id|image_file_id/);
      expect(sql).toContain('ORDER BY sc.code ASC, sc.id ASC LIMIT ?');
      expect(execute.mock.calls[0][1]).toEqual([
        TENANT,
        PRAC.PRACTICE_ACTIVE,
        null,
        null,
        null,
        21,
      ]);
    });

    it('con posición, continúa por keyset (código, id)', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findOfferedServices(
        em as any,
        TENANT,
        { sortKey: 'CONS-GEN', id: '11111111-1111-4111-8111-111111111111' },
        6,
      );

      expect(sqlDe(execute)).toContain(
        '(sc.code, sc.id) > (CAST(? AS text), CAST(? AS uuid))',
      );
      expect(execute.mock.calls[0][1].slice(2)).toEqual([
        'CONS-GEN',
        'CONS-GEN',
        '11111111-1111-4111-8111-111111111111',
        6,
      ]);
    });
  });

  describe('findPharmacyProducts', () => {
    it('exige farmacia activa y verificada, producto activo, y lista de precios pública, vigente y sin aseguradora', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findPharmacyProducts(em as any, TENANT, null, 21);

      const sql = sqlDe(execute);
      expect(sql).toContain('AND ph.tenant_id = ?');
      expect(sql).toContain('AND list.public_visibility = true');
      expect(sql).toContain('AND list.insurer_tenant_id IS NULL');
      expect(sql).toContain('ORDER BY p.sort_name ASC, p.id ASC LIMIT ?');
      const params = execute.mock.calls[0][1];
      expect(params.slice(0, 6)).toEqual([
        TENANT,
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.PRODUCT_ACTIVE,
        PHARM.PRICE_LIST_ACTIVE,
        PHARM.PRICE_ACTIVE,
      ]);
      expect(params[params.length - 1]).toBe(21);
    });

    it('el stock informa, no filtra: se une con LEFT JOIN y cae a 0', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findPharmacyProducts(em as any, TENANT, null, 21);

      const sql = sqlDe(execute);
      expect(sql).toContain(
        'COALESCE(stock.available, 0)::text AS "availableQuantity"',
      );
      expect(sql).toMatch(
        /LEFT JOIN LATERAL \( SELECT SUM\(st\.available_quantity\)/,
      );
    });

    it('el precio se lee como texto, sin pasar por number', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findPharmacyProducts(em as any, TENANT, null, 21);

      expect(sqlDe(execute)).toContain(
        'COALESCE(pp.patient_amount, pp.unit_amount)::text AS price',
      );
    });
  });

  describe('findPharmacyBranches (P37)', () => {
    it('recorre la cadena (raíz e hijos) y exige ficha visible, farmacia activa y verificada y sede activa', async () => {
      const { em, execute, repo } = conConexion();

      await repo.findPharmacyBranches(em as any, TENANT, 200);

      const sql = sqlDe(execute);
      expect(sql).toContain('COALESCE(t.parent_tenant_id, t.id) AS root');
      expect(sql).toContain(
        'ON t.id = chain.root OR t.parent_tenant_id = chain.root',
      );
      expect(sql).toMatch(/LIMIT \?$/);
      // Nada interno de la farmacia ni de la práctica sale de la consulta.
      expect(sql).not.toMatch(/tax_code|income_account|practice_id AS/);
      expect(execute.mock.calls[0][1]).toEqual([
        TENANT,
        COMM.PROFILE_TARGET_PHARMACY,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.SITE_ACTIVE,
        200,
      ]);
    });
  });

  describe('findBranchStockMatches (P37)', () => {
    it('manda los arreglos como JSON y sólo trae productos con stock en la sede', async () => {
      const { em, execute, repo } = conConexion();
      const sede = '33333333-3333-4333-8333-000000000001';

      await repo.findBranchStockMatches(em as any, [sede], ['amoxicilina']);

      const sql = sqlDe(execute);
      expect(sql).toContain('jsonb_array_elements_text(CAST(? AS jsonb))');
      expect(sql).toContain(') stock ON stock.available > 0');
      expect(sql).toContain('LIMIT 5000');
      const params = execute.mock.calls[0][1];
      expect(params).toContain(JSON.stringify(['amoxicilina']));
      expect(params).toContain(JSON.stringify([sede]));
    });

    it('sin sedes o sin palabras no consulta la base', async () => {
      const { em, execute, repo } = conConexion();
      await expect(
        repo.findBranchStockMatches(em as any, [], ['x']),
      ).resolves.toEqual([]);
      await expect(
        repo.findBranchStockMatches(em as any, ['s'], []),
      ).resolves.toEqual([]);
      expect(execute).not.toHaveBeenCalled();
    });
  });
});
