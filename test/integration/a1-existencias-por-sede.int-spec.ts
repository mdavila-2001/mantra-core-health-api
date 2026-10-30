import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { COMM } from '../../src/modules/community/community.concepts';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import { PINV } from '../../src/modules/pharmacy_inventory/domain/pharmacy_inventory.concepts';
import { siteProductAvailabilitySql } from '../../src/modules/pharmacy_inventory/domain/site-product-availability';
import { InventoryReadRepository } from '../../src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository';
import { PublicPharmacyBranchesService } from '../../src/modules/public/application/services/public-pharmacy-branches.service';
import { publicInStock } from '../../src/modules/public/domain/public-catalog.domain';
import { PublicCatalogRepository } from '../../src/modules/public/infrastructure/repositories/public-catalog.repository';
import { PublicPharmacyBranchesRepository } from '../../src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository';

/**
 * A1 (26/10/2026) — la regla única de existencias por sede, contra PostgreSQL
 * real: lotes si el producto tiene posición en la sede, lo declarado en el
 * catálogo si no; nunca lo marcado «no tengo» ni un borrador. La decisión es
 * por producto (D-06-3): que la sede lleve lotes de unos no apaga los demás.
 *
 * Datos: sólo sintéticos, marcados con `A1-<sufijo>`, creados y retirados por
 * la prueba.
 *
 * Escenario: una farmacia verificada con dos sedes.
 * - **Lotes**: tiene una ubicación activa con posiciones de algunos productos:
 *   en esos manda el libro, en los demás el catálogo.
 * - **Declarada**: no tiene ninguna posición → manda el catálogo.
 *
 * | Producto      | Catálogo             | Libro (sede Lotes) | Lotes     | Declarada |
 * |---------------|----------------------|--------------------|-----------|-----------|
 * | `pDecl3`      | stock 3              | —                  | sí (3)    | sí (3)    |
 * | `pSinConteo`  | sin conteo (NULL)    | —                  | sí (null) | sí (null) |
 * | `pCero`       | stock 0              | —                  | no        | no        |
 * | `pNoTengo`    | «no tengo», stock 5  | 7                  | no        | no        |
 * | `pLotes`      | sin conteo           | 4                  | sí (4)    | sí (null) |
 * | `pLotesCero`  | stock 9              | 0                  | no        | sí (9)    |
 * | `pBorrador`   | borrador, stock 5    | 6                  | no        | no        |
 */
describe('A1 · existencias por sede: lotes o catálogo (DB real)', () => {
  let orm: MikroORM;
  const mark = `A1-${randomUUID().slice(0, 8)}`;
  const slug = mark.toLowerCase();
  const any = CONCEPTS.STATE_ACTIVE;
  const id = () => randomUUID();
  const ids = {
    user: id(),
    tenant: id(),
    practice: id(),
    psLotes: id(),
    psDecl: id(),
    pharmacy: id(),
    sLotes: id(),
    sDecl: id(),
    loc: id(),
    profile: id(),
    pDecl3: id(),
    pSinConteo: id(),
    pCero: id(),
    pNoTengo: id(),
    pLotes: id(),
    pLotesCero: id(),
    pBorrador: id(),
  };
  const products: Array<
    [string, string, number | null, boolean, string, string | null]
  > = [
    // id, nombre, stock declarado, «no tengo», estado, disponible en el libro
    [ids.pDecl3, 'Venda declarada', 3, false, PHARM.PRODUCT_ACTIVE, null],
    [
      ids.pSinConteo,
      'Gasa sin conteo',
      null,
      false,
      PHARM.PRODUCT_ACTIVE,
      null,
    ],
    [ids.pCero, 'Alcohol en cero', 0, false, PHARM.PRODUCT_ACTIVE, null],
    [ids.pNoTengo, 'Jeringa no tengo', 5, true, PHARM.PRODUCT_ACTIVE, '7'],
    [ids.pLotes, 'Paracetamol lotes', null, false, PHARM.PRODUCT_ACTIVE, '4'],
    [ids.pLotesCero, 'Ibuprofeno agotado', 9, false, PHARM.PRODUCT_ACTIVE, '0'],
    [ids.pBorrador, 'Algodón borrador', 5, false, PHARM.PRODUCT_DRAFT, '6'],
  ];

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

  async function insert(table: string, row: Record<string, unknown>) {
    const withStamps = {
      created_at: new Date(),
      updated_at: new Date(),
      ...row,
    };
    const columns = Object.keys(withStamps);
    await run(
      `insert into ${table} (${columns.join(', ')}) values (${columns.map(() => '?').join(', ')})`,
      Object.values(withStamps),
    );
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });
    const needed = [
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.USER_ACTIVE,
      COMM.PROFILE_TARGET_PHARMACY,
      COMM.PROFILE_VISIBILITY_PUBLIC,
      PHARM.PHARMACY_ACTIVE,
      PHARM.VERIFICATION_VERIFIED,
      PHARM.SITE_ACTIVE,
      PHARM.PRODUCT_ACTIVE,
      PHARM.PRODUCT_DRAFT,
      PINV.LOCATION_ACTIVE,
    ];
    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from terminology.catalog_concepts where id in (${needed.map(() => '?').join(', ')})`,
      needed,
    );
    if (n < needed.length) {
      await new TerminologySeedService(orm, {
        setContext: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      } as never).run();
    }

    await insert('iam.users', {
      id: ids.user,
      status_concept_id: CONCEPTS.USER_ACTIVE,
      display_name: mark,
    });
    await insert('directory.tenants', {
      id: ids.tenant,
      code: mark,
      tenant_type_concept_id: any,
      legal_name: mark,
      legal_entity_type_concept_id: any,
      status_concept_id: any,
      verification_status_concept_id: any,
    });
    await insert('practice.practices', {
      id: ids.practice,
      tenant_id: ids.tenant,
      code: mark,
      name: mark,
      type_concept_id: any,
      admin_user_id: ids.user,
      status_concept_id: any,
    });
    for (const ps of [ids.psLotes, ids.psDecl]) {
      await insert('practice.practice_sites', {
        id: ps,
        practice_id: ids.practice,
        code: `${mark}-${ps.slice(0, 6)}`,
        name: mark,
        site_type_concept_id: any,
        status_concept_id: any,
      });
    }
    await insert('pharmacy.pharmacies', {
      id: ids.pharmacy,
      tenant_id: ids.tenant,
      code: mark,
      legal_name: `${mark} SRL`,
      trade_name: 'Farmacia A1',
      verification_status_concept_id: PHARM.VERIFICATION_VERIFIED,
      status_concept_id: PHARM.PHARMACY_ACTIVE,
    });
    for (const [site, ps, name] of [
      [ids.sLotes, ids.psLotes, 'Lotes'],
      [ids.sDecl, ids.psDecl, 'Declarada'],
    ]) {
      await insert('pharmacy.pharmacy_sites', {
        id: site,
        pharmacy_id: ids.pharmacy,
        practice_site_id: ps,
        code: `${mark}-${name}`,
        name,
        status_concept_id: PHARM.SITE_ACTIVE,
      });
    }
    for (const [product, name, stock, noTengo, status] of products) {
      await insert('pharmacy.pharmacy_products', {
        id: product,
        pharmacy_id: ids.pharmacy,
        product_code: `${mark}-${product.slice(0, 6)}`,
        generic_name: name,
        stock_quantity: stock,
        out_of_stock_declared: noTengo,
        status_concept_id: status,
      });
    }
    await insert('pharmacy_inventory.inventory_locations', {
      id: ids.loc,
      pharmacy_site_id: ids.sLotes,
      code: `${mark}-LOC`,
      name: mark,
      location_type_concept_id: any,
      status_concept_id: PINV.LOCATION_ACTIVE,
    });
    for (const [product, , , , , ledger] of products) {
      if (ledger === null) continue;
      await run(
        `insert into pharmacy_inventory.inventory_stock_positions
           (id, inventory_location_id, pharmacy_product_id, on_hand_quantity,
            reserved_quantity, quarantine_quantity, available_quantity,
            last_ledger_sequence, updated_at)
         values (?, ?, ?, ?, 0, 0, ?, 0, now())`,
        [randomUUID(), ids.loc, product, ledger, ledger],
      );
    }
    await insert('community.public_profiles', {
      id: ids.profile,
      tenant_id: ids.tenant,
      target_type_concept_id: COMM.PROFILE_TARGET_PHARMACY,
      target_id: ids.pharmacy,
      slug,
      display_name: mark,
      visibility_concept_id: COMM.PROFILE_VISIBILITY_PUBLIC,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
    });
  });

  afterAll(async () => {
    if (!orm) return;
    const del = (table: string, column: string, values: string[]) =>
      run(
        `delete from ${table} where ${column} in (${values.map(() => '?').join(', ')})`,
        values,
      );
    await del('community.public_profiles', 'id', [ids.profile]);
    await del(
      'pharmacy_inventory.inventory_stock_positions',
      'inventory_location_id',
      [ids.loc],
    );
    await del('pharmacy_inventory.inventory_locations', 'id', [ids.loc]);
    await del(
      'pharmacy.pharmacy_products',
      'id',
      products.map(([p]) => p),
    );
    await del('pharmacy.pharmacy_sites', 'id', [ids.sLotes, ids.sDecl]);
    await del('pharmacy.pharmacies', 'id', [ids.pharmacy]);
    await del('practice.practice_sites', 'id', [ids.psLotes, ids.psDecl]);
    await del('practice.practices', 'id', [ids.practice]);
    await del('directory.tenants', 'id', [ids.tenant]);
    await del('iam.users', 'id', [ids.user]);
    await orm.close(true);
  });

  const name = (productId: string) =>
    products.find(([p]) => p === productId)?.[1];

  it('la regla, sola: cada producto usa su fuente y nunca ofrece «no tengo» ni borradores', async () => {
    const a = siteProductAvailabilitySql();
    const rows = await all<{
      site_id: string;
      product_id: string;
      available_quantity: string | null;
      source: string;
    }>(
      `select av.site_id, av.product_id, av.available_quantity::text as available_quantity, av.source
         from (${a.sql}) av
        where av.pharmacy_id = ?
        order by av.site_id, av.product_id`,
      [...a.params, ids.pharmacy],
    );
    const at = (site: string) =>
      rows
        .filter((row) => row.site_id === site)
        .map((row) => [
          name(row.product_id),
          row.available_quantity,
          row.source,
        ])
        .sort();

    expect(at(ids.sLotes)).toEqual(
      [
        ['Gasa sin conteo', null, 'DECLARED'],
        ['Paracetamol lotes', '4', 'LEDGER'],
        ['Venda declarada', '3', 'DECLARED'],
      ].sort(),
    );
    expect(at(ids.sDecl)).toEqual(
      [
        ['Gasa sin conteo', null, 'DECLARED'],
        ['Ibuprofeno agotado', '9', 'DECLARED'],
        ['Paracetamol lotes', null, 'DECLARED'],
        ['Venda declarada', '3', 'DECLARED'],
      ].sort(),
    );
  });

  it('P37: la receta encuentra lo del libro donde hay posición y lo declarado donde no', async () => {
    const service = new PublicPharmacyBranchesService(
      orm.em as never,
      new PublicCatalogRepository(),
      new PublicPharmacyBranchesRepository(),
    );
    const result = await service.availability(slug, {
      items: ['venda', 'jeringa', 'algodon', 'paracetamol'],
    });
    const bySite = new Map(result.items.map((i) => [i.branch.id, i]));
    expect(bySite.get(ids.sDecl)).toMatchObject({
      missing: ['jeringa', 'algodon'],
      complete: false,
    });
    expect(
      bySite
        .get(ids.sDecl)!
        .matches.map((m) => m.term)
        .sort(),
    ).toEqual(['paracetamol', 'venda']);
    expect(
      bySite
        .get(ids.sLotes)!
        .matches.map((m) => m.term)
        .sort(),
    ).toEqual(['paracetamol', 'venda']);
  });

  it('P31: el catálogo público rotula «hay» si alguna sede lo tiene', async () => {
    const rows = await new PublicCatalogRepository().findPharmacyProducts(
      orm.em as never,
      ids.tenant,
      null,
      50,
    );
    const inStock = Object.fromEntries(
      rows.map((row) => [row.sortName, publicInStock(row)]),
    );
    expect(inStock).toEqual({
      'Alcohol en cero': false,
      'Gasa sin conteo': true,
      'Ibuprofeno agotado': true,
      'Jeringa no tengo': false,
      'Paracetamol lotes': true,
      'Venda declarada': true,
    });
    // El borrador no es parte del catálogo público.
    expect(rows.map((row) => row.sortName)).not.toContain('Algodón borrador');
  });

  it('el buscador de productos (disponibilidad por sede) usa la misma regla', async () => {
    const rows =
      await new InventoryReadRepository().findSiteProductAvailability(
        orm.em as never,
        [ids.sLotes, ids.sDecl],
        products.map(([p]) => p),
      );
    const got = rows
      .map((row) => [
        row.siteId === ids.sLotes ? 'Lotes' : 'Declarada',
        name(row.productId),
        row.availableQuantity,
      ])
      .sort();
    expect(got).toEqual(
      [
        ['Lotes', 'Gasa sin conteo', null],
        ['Lotes', 'Paracetamol lotes', '4'],
        ['Lotes', 'Venda declarada', '3'],
        ['Declarada', 'Gasa sin conteo', null],
        ['Declarada', 'Ibuprofeno agotado', '9'],
        ['Declarada', 'Paracetamol lotes', null],
        ['Declarada', 'Venda declarada', '3'],
      ].sort(),
    );
  });
});
