import 'dotenv/config';
import { ForbiddenException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../src/common';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import {
  FileVersionsRepository,
  FilesRepository,
} from '../../src/modules/common/repositories';
import { AttachableFileService } from '../../src/modules/common/services/attachable-file.service';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import {
  MedicineCatalogRepository,
  PharmaciesRepository,
  PharmacyCatalogRepository,
  PharmacyExternalProductMappingsRepository,
  PharmacyProductIdentifiersRepository,
  PharmacyProductPricesRepository,
  PharmacyProductsRepository,
  PharmacyReadRepository,
} from '../../src/modules/pharmacy/repositories';
import {
  PharmacyCategoriesService,
  PharmacyProductsService,
  PharmacyReadService,
  PharmacyStaffReadService,
} from '../../src/modules/pharmacy/services';
import { PublicCatalogRepository } from '../../src/modules/public/infrastructure/repositories/public-catalog.repository';
import { formatPublicProduct } from '../../src/modules/public/domain';
import {
  assertPermanentResidueTarget,
  resolveResetTarget,
} from './disposable-database';

/**
 * P47 §3-5 contra PostgreSQL real: el catálogo que administra la farmacia.
 *
 * Servicios, repositorios y ORM **reales**; sólo se sustituyen el logger y la
 * comprobación de pertenencia a la organización (`TenantAdministrationService`,
 * de `directory`, que tiene sus pruebas): acá se la reemplaza por la regla que
 * implementa —el actor es miembro del tenant dueño—, leída del token.
 *
 * Lo que un doble no podría demostrar y por eso corre contra la base:
 * - el precio se versiona como `numeric` exacto en la lista `CATALOGO` (BOB);
 * - la FK COMPUESTA (pharmacy_id, categoría) rechaza la categoría de otra
 *   farmacia aunque alguien la escriba por SQL;
 * - una imagen ajena (subida por el personal de OTRA farmacia) o que no es de
 *   categoría IMAGE no se cuelga del producto;
 * - el personal de B no lee ni escribe el catálogo de A (404);
 * - borrador y «no tengo» no salen en la cara pública ni en lo vendible;
 * - el inventario en lote es todo o nada.
 *
 * Datos: sólo sintéticos, marcados `P47-<sufijo>`. No pasa por el interceptor
 * de auditoría, pero el historial de precios (VERSIONED) es append-only y deja
 * residuo: exige base descartable o `ALLOW_PERMANENT_TEST_RESIDUE=yes`. Los
 * conceptos que falten se materializan con el seed de terminología.
 */
describe('P47 · catálogo de la farmacia (DB real)', () => {
  let orm: MikroORM;
  const mark = `P47-${randomUUID().slice(0, 8)}`;
  const ids = {
    userA: randomUUID(),
    userB: randomUUID(),
    tenantA: randomUUID(),
    tenantB: randomUUID(),
    pharmacyA: randomUUID(),
    pharmacyB: randomUUID(),
    fileA: randomUUID(),
    fileB: randomUUID(),
    fileDoc: randomUUID(),
  };
  const staffA = {
    id: ids.userA,
    roles: ['PHARMACY_STAFF'],
    tenantIds: [ids.tenantA],
  } as never;
  const staffB = {
    id: ids.userB,
    roles: ['PHARMACY_STAFF'],
    tenantIds: [ids.tenantB],
  } as never;
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  };

  let products: PharmacyProductsService;
  let categories: PharmacyCategoriesService;
  let staffRead: PharmacyStaffReadService;
  let readRepo: PharmacyReadRepository;
  let publicRepo: PublicCatalogRepository;

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;
  const inA = <T>(fn: () => Promise<T>) => runWithTenant(ids.tenantA, fn);
  const inB = <T>(fn: () => Promise<T>) => runWithTenant(ids.tenantB, fn);

  async function rejected(promise: Promise<unknown>): Promise<any> {
    return promise.then(
      () => {
        throw new Error('debía rechazar');
      },
      (error: unknown) => error,
    );
  }

  /** Un archivo con versión vigente, subido por `userId`. */
  async function insertFile(
    fileId: string,
    tenantId: string,
    userId: string,
    category: string,
    mimeType: string,
  ) {
    const versionId = randomUUID();
    const any = CONCEPTS.FILE_CATEGORY_IMAGE;
    await run(
      `insert into common.files
         (id, tenant_id, category_concept_id, original_name, sensitivity_concept_id,
          lifecycle_status_concept_id, created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, ?, ?, now(), now(), ?)`,
      [fileId, tenantId, category, mark, any, any, userId],
    );
    await run(
      `insert into common.file_versions
         (id, file_id, version_number, storage_provider_concept_id, storage_region_concept_id,
          storage_uri, mime_type, size_bytes, checksum_algorithm_concept_id, content_hash,
          encryption_status_concept_id, malware_scan_status_concept_id, recorded_at)
       values (?, ?, 1, ?, ?, ?, ?, 10, ?, ?, ?, ?, now())`,
      [
        versionId,
        fileId,
        any,
        any,
        `mem://${mark}`,
        mimeType,
        any,
        mark,
        any,
        any,
      ],
    );
    await run(`update common.files set current_version_id = ? where id = ?`, [
      versionId,
      fileId,
    ]);
  }

  beforeAll(async () => {
    // Antes de abrir una conexión: el historial de precios es append-only y la
    // prueba deja residuo sintético permanente. No corre contra una base
    // compartida sin `ALLOW_PERMANENT_TEST_RESIDUE=yes`. No envía SQL.
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);

    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });

    const needed = [
      PHARM.PRODUCT_DRAFT,
      PHARM.PRODUCT_ACTIVE,
      PHARM.PRICE_LIST_TYPE_PUBLIC,
      PHARM.PHARMACY_ACTIVE,
      PHARM.SITE_ACTIVE,
      CONCEPTS.CURRENCY_BOB,
      CONCEPTS.FILE_CATEGORY_IMAGE,
      CONCEPTS.FILE_CATEGORY_DOCUMENT,
      CONCEPTS.USER_ACTIVE,
    ];
    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from terminology.catalog_concepts where id in (${needed.map(() => '?').join(', ')})`,
      needed,
    );
    if (n < needed.length) {
      await new TerminologySeedService(orm, logger as never).run();
    }

    const any = PHARM.PHARMACY_ACTIVE;
    for (const [user, suffix] of [
      [ids.userA, 'A'],
      [ids.userB, 'B'],
    ]) {
      await run(
        `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at)
         values (?, ?, ?, now(), now())`,
        [user, CONCEPTS.USER_ACTIVE, `${mark}-${suffix}`],
      );
    }
    for (const [tenant, pharmacy, suffix] of [
      [ids.tenantA, ids.pharmacyA, 'A'],
      [ids.tenantB, ids.pharmacyB, 'B'],
    ]) {
      await run(
        `insert into directory.tenants
           (id, code, tenant_type_concept_id, legal_name, legal_entity_type_concept_id,
            status_concept_id, verification_status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
        [tenant, `${mark}-${suffix}`, any, mark, any, any, any],
      );
      await run(
        `insert into pharmacy.pharmacies
           (id, tenant_id, code, legal_name, verification_status_concept_id, status_concept_id,
            created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, now(), now())`,
        [
          pharmacy,
          tenant,
          `${mark}-${suffix}`,
          `Farmacia ${mark} ${suffix}`,
          PHARM.VERIFICATION_VERIFIED,
          PHARM.PHARMACY_ACTIVE,
        ],
      );
    }
    // La disponibilidad pública es por sede (regla única de existencias, A1
    // del 26/10/2026): una farmacia real nace con su «Casa central» (P50). Sin
    // sede no hay dónde estar disponible. A la de A se le da la suya, sin
    // inventario por lotes: vale lo declarado en el catálogo.
    const practiceA = randomUUID();
    const practiceSiteA = randomUUID();
    await run(
      `insert into practice.practices
         (id, tenant_id, code, name, type_concept_id, admin_user_id, status_concept_id,
          created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [practiceA, ids.tenantA, `${mark}-PR`, mark, any, ids.userA, any],
    );
    await run(
      `insert into practice.practice_sites
         (id, tenant_id, practice_id, code, name, site_type_concept_id, status_concept_id,
          created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [practiceSiteA, ids.tenantA, practiceA, `${mark}-PS`, mark, any, any],
    );
    await run(
      `insert into pharmacy.pharmacy_sites
         (id, pharmacy_id, practice_site_id, code, name, status_concept_id,
          created_at, updated_at)
       values (?, ?, ?, ?, 'Casa central', ?, now(), now())`,
      [
        randomUUID(),
        ids.pharmacyA,
        practiceSiteA,
        `${mark}-CC`,
        PHARM.SITE_ACTIVE,
      ],
    );
    await insertFile(
      ids.fileA,
      ids.tenantA,
      ids.userA,
      CONCEPTS.FILE_CATEGORY_IMAGE,
      'image/png',
    );
    await insertFile(
      ids.fileB,
      ids.tenantB,
      ids.userB,
      CONCEPTS.FILE_CATEGORY_IMAGE,
      'image/png',
    );
    await insertFile(
      ids.fileDoc,
      ids.tenantA,
      ids.userA,
      CONCEPTS.FILE_CATEGORY_DOCUMENT,
      'image/png',
    );

    const pharmaciesRepo = new PharmaciesRepository();
    const catalogRepo = new PharmacyCatalogRepository();
    readRepo = new PharmacyReadRepository();
    categories = new PharmacyCategoriesService(
      orm.em as never,
      pharmaciesRepo,
      catalogRepo,
      logger as never,
    );
    const readService = new PharmacyReadService(
      orm.em as never,
      readRepo,
      catalogRepo,
    );
    products = new PharmacyProductsService(
      orm.em as never,
      pharmaciesRepo,
      new PharmacyProductsRepository(),
      new PharmacyProductIdentifiersRepository(),
      new PharmacyProductPricesRepository(),
      new PharmacyExternalProductMappingsRepository(),
      readRepo,
      new MedicineCatalogRepository(),
      logger as never,
      catalogRepo,
      categories,
      readService,
      new AttachableFileService(
        new FilesRepository(),
        new FileVersionsRepository(),
        logger as never,
      ),
    );
    // Doble declarado de `TenantAdministrationService.assertCanRead`: la regla
    // que implementa (miembro del tenant dueño), sin su lectura de membresías.
    const tenantAdmin = {
      assertCanRead: async (
        _em: unknown,
        tenantId: string,
        actor: { tenantIds?: string[] },
      ) => {
        if (!actor.tenantIds?.includes(tenantId)) {
          throw new ForbiddenException('fuera de la organización');
        }
      },
    };
    staffRead = new PharmacyStaffReadService(
      orm.em as never,
      readRepo,
      tenantAdmin as never,
      {} as never,
      catalogRepo,
      readService,
    );
    publicRepo = new PublicCatalogRepository();

    // Las seis de partida, como al dar de alta una farmacia.
    await orm.em.transactional(async (tx) => {
      await categories.provisionDefaults(tx as never, ids.pharmacyA, ids.userA);
      await categories.provisionDefaults(tx as never, ids.pharmacyB, ids.userB);
    });
  });

  afterAll(async () => {
    // Los precios son VERSIONED: su historial (`pharmacy_product_prices_history`)
    // es append-only y retiene por FK a precios, productos, listas, farmacias,
    // tenants y usuarios. Eso queda como residuo sintético marcado `P47-<sufijo>`
    // (por eso el guard de `beforeAll`). Lo que no retiene el historial se borra.
    await run(
      `delete from pharmacy.pharmacy_product_images where pharmacy_product_id in
         (select id from pharmacy.pharmacy_products where pharmacy_id in (?, ?))`,
      [ids.pharmacyA, ids.pharmacyB],
    );
    await orm.close(true);
  });

  let productId: string;

  it('el alta guarda precio, categoría, descripción, «no tengo», borrador e imagen', async () => {
    const created = await inA(() =>
      products.publishProduct(
        ids.pharmacyA,
        {
          productCode: `${mark}-AMOX`,
          brandName: 'Amoxil',
          genericName: 'Amoxicilina',
          unitPrice: 12.5,
          category: 'medicamentos',
          description: 'Antibiótico de amplio espectro',
          inStock: false,
          status: 'DRAFT',
          imageFileIds: [ids.fileA],
        } as never,
        staffA,
      ),
    );
    productId = created.id;
    expect(created.status).toBe(PHARM.PRODUCT_DRAFT);

    const [row] = await all<any>(
      `select p.status_concept_id, p.description_text, p.out_of_stock_declared,
              p.stock_quantity, c.name as category, c.pharmacy_id as category_pharmacy
         from pharmacy.pharmacy_products p
         left join pharmacy.pharmacy_product_categories c on c.id = p.pharmacy_product_category_id
        where p.id = ?`,
      [productId],
    );
    expect(row).toMatchObject({
      status_concept_id: PHARM.PRODUCT_DRAFT,
      description_text: 'Antibiótico de amplio espectro',
      out_of_stock_declared: true,
      stock_quantity: null,
      category: 'Medicamentos',
      category_pharmacy: ids.pharmacyA,
    });
    const prices = await all<any>(
      `select pp.unit_amount::text as amount, pp.version_number, l.code, cur.code as currency
         from pharmacy.pharmacy_product_prices pp
         join pharmacy.pharmacy_price_lists l on l.id = pp.pharmacy_price_list_id
         join terminology.catalog_concepts cur on cur.id = l.currency_concept_id
        where pp.pharmacy_product_id = ? and pp.status_concept_id = ?`,
      [productId, PHARM.PRICE_ACTIVE],
    );
    expect(prices).toEqual([
      { amount: '12.50', version_number: 1, code: 'CATALOGO', currency: 'BOB' },
    ]);
    const images = await all<any>(
      `select image_file_id, ordinal from pharmacy.pharmacy_product_images where pharmacy_product_id = ?`,
      [productId],
    );
    expect(images).toEqual([{ image_file_id: ids.fileA, ordinal: 1 }]);
  });

  it('el borrador y el «no tengo» no salen en lo público ni en lo vendible', async () => {
    const publicRows = await publicRepo.findPharmacyProducts(
      orm.em.fork() as never,
      ids.tenantA,
      null,
      50,
    );
    expect(publicRows.map((r) => r.id)).not.toContain(productId);

    // Se publica: sale en P31, pero rotulado «no hay» y fuera de lo vendible.
    await inA(() =>
      products.updateProduct(
        ids.pharmacyA,
        productId,
        { status: 'PUBLISHED' },
        staffA,
      ),
    );
    const [published] = (
      await publicRepo.findPharmacyProducts(
        orm.em.fork() as never,
        ids.tenantA,
        null,
        50,
      )
    ).filter((r) => r.id === productId);
    expect(formatPublicProduct(published)).toMatchObject({
      price: '12.50',
      currency: 'BOB',
      inStock: false,
    });
    expect(
      await readRepo.findSellableProductsByIds(orm.em.fork() as never, [
        productId,
      ]),
    ).toEqual([]);

    await inA(() =>
      products.updateProduct(
        ids.pharmacyA,
        productId,
        { inStock: true },
        staffA,
      ),
    );
    const sellable = await readRepo.findSellableProductsByIds(
      orm.em.fork() as never,
      [productId],
    );
    expect(sellable.map((p) => p.id)).toEqual([productId]);
    const [again] = (
      await publicRepo.findPharmacyProducts(
        orm.em.fork() as never,
        ids.tenantA,
        null,
        50,
      )
    ).filter((r) => r.id === productId);
    // Sin ledger de existencias, vale la declaración del catálogo.
    expect(formatPublicProduct(again).inStock).toBe(true);
  });

  it('el mismo precio no versiona; uno nuevo supersede y toma la versión 2', async () => {
    await inA(() =>
      products.updateProduct(
        ids.pharmacyA,
        productId,
        { unitPrice: '12.50' },
        staffA,
      ),
    );
    await inA(() =>
      products.updateProduct(
        ids.pharmacyA,
        productId,
        { unitPrice: 14 },
        staffA,
      ),
    );
    const rows = await all<any>(
      `select unit_amount::text as amount, version_number, status_concept_id = ? as active
         from pharmacy.pharmacy_product_prices where pharmacy_product_id = ?
        order by version_number`,
      [PHARM.PRICE_ACTIVE, productId],
    );
    expect(rows).toEqual([
      { amount: '12.50', version_number: 1, active: false },
      { amount: '14.00', version_number: 2, active: true },
    ]);
  });

  it('la base rechaza colgarle a un producto la categoría de OTRA farmacia (FK compuesta)', async () => {
    const [foreign] = await all<{ id: string }>(
      `select id from pharmacy.pharmacy_product_categories where pharmacy_id = ? limit 1`,
      [ids.pharmacyB],
    );
    const error = await rejected(
      run(
        `update pharmacy.pharmacy_products set pharmacy_product_category_id = ? where id = ?`,
        [foreign.id, productId],
      ),
    );
    expect(error.code).toBe('23503');
    expect(error.constraint).toBe(
      'fk_pharmacy_products_pharmacy_product_category_id',
    );
  });

  it('el servicio sólo resuelve categorías de la propia farmacia: un nombre ajeno es 422', async () => {
    await inB(() => categories.create(ids.pharmacyB, 'Sólo de B', staffB));
    const error = await rejected(
      inA(() =>
        products.updateProduct(
          ids.pharmacyA,
          productId,
          { category: 'Sólo de B' },
          staffA,
        ),
      ),
    );
    expect(error).toBeInstanceOf(PreconditionFailedException);
    const [row] = await all<any>(
      `select c.name from pharmacy.pharmacy_products p
         join pharmacy.pharmacy_product_categories c on c.id = p.pharmacy_product_category_id
        where p.id = ?`,
      [productId],
    );
    expect(row.name).toBe('Medicamentos');
  });

  it('una imagen subida por el personal de OTRA farmacia no se cuelga (403) y no cambia nada', async () => {
    const error = await rejected(
      inA(() =>
        products.updateProduct(
          ids.pharmacyA,
          productId,
          { imageFileIds: [ids.fileA, ids.fileB] },
          staffA,
        ),
      ),
    );
    expect(error).toBeInstanceOf(ForbiddenException);
    const images = await all<any>(
      `select image_file_id from pharmacy.pharmacy_product_images where pharmacy_product_id = ?`,
      [productId],
    );
    expect(images).toEqual([{ image_file_id: ids.fileA }]);
  });

  it('un archivo propio que no es de categoría IMAGE se rechaza con 422', async () => {
    const error = await rejected(
      inA(() =>
        products.updateProduct(
          ids.pharmacyA,
          productId,
          { imageFileIds: [ids.fileDoc] },
          staffA,
        ),
      ),
    );
    expect(error).toBeInstanceOf(PreconditionFailedException);
  });

  it('el personal de B no edita, no guarda inventario ni lee la gestión de A (404)', async () => {
    // Con su propio tenant activo: la farmacia de A no está en él.
    expect(
      await rejected(
        inB(() =>
          products.updateProduct(
            ids.pharmacyA,
            productId,
            { unitPrice: 1 },
            staffB,
          ),
        ),
      ),
    ).toBeInstanceOf(ResourceNotFoundException);
    // Declarando el tenant de A sin ser miembro.
    expect(
      await rejected(
        inA(() =>
          products.updateInventory(
            ids.pharmacyA,
            { lines: [{ productId, stock: 99 }] } as never,
            staffB,
          ),
        ),
      ),
    ).toBeInstanceOf(ResourceNotFoundException);
    expect(
      await rejected(
        inA(() => staffRead.listManagedProducts(ids.pharmacyA, {}, 50, staffB)),
      ),
    ).toBeInstanceOf(ResourceNotFoundException);
    expect(
      await rejected(inA(() => categories.list(ids.pharmacyA, staffB))),
    ).toBeInstanceOf(ResourceNotFoundException);
    const [row] = await all<any>(
      `select stock_quantity from pharmacy.pharmacy_products where id = ?`,
      [productId],
    );
    expect(row.stock_quantity).toBeNull();
  });

  it('el inventario en lote es todo o nada', async () => {
    const second = await inA(() =>
      products.publishProduct(
        ids.pharmacyA,
        {
          productCode: `${mark}-IBU`,
          genericName: 'Ibuprofeno',
          stock: 4,
        } as never,
        staffA,
      ),
    );
    const error = await rejected(
      inA(() =>
        products.updateInventory(
          ids.pharmacyA,
          {
            lines: [
              { productId, stock: 30, minStock: 10 },
              { productId: second.id, stock: 2, inStock: true },
            ],
          } as never,
          staffA,
        ),
      ),
    );
    expect(error).toBeInstanceOf(PreconditionFailedException);
    const before = await all<any>(
      `select id, stock_quantity from pharmacy.pharmacy_products where id in (?, ?) order by product_code`,
      [productId, second.id],
    );
    expect(before.map((r) => r.stock_quantity)).toEqual([null, 4]);

    const ok = await inA(() =>
      products.updateInventory(
        ids.pharmacyA,
        {
          lines: [
            { productId, stock: 30, minStock: 10 },
            { productId: second.id, inStock: false },
          ],
        } as never,
        staffA,
      ),
    );
    expect(ok).toEqual({ updated: 2 });
    const after = await all<any>(
      `select stock_quantity, min_stock_quantity, out_of_stock_declared
         from pharmacy.pharmacy_products where id in (?, ?) order by product_code`,
      [productId, second.id],
    );
    expect(after).toEqual([
      {
        stock_quantity: 30,
        min_stock_quantity: 10,
        out_of_stock_declared: false,
      },
      {
        stock_quantity: 4,
        min_stock_quantity: null,
        out_of_stock_declared: true,
      },
    ]);
  });

  it('la lectura de gestión trae todo el catálogo con estado, existencias e imágenes', async () => {
    const page = await inA(() =>
      staffRead.listManagedProducts(ids.pharmacyA, {}, 50, staffA),
    );
    const amox = page.items.find((item) => item.id === productId)!;
    expect(amox).toMatchObject({
      unitPrice: '14.00',
      currency: 'BOB',
      inStock: true,
      category: 'Medicamentos',
      description: 'Antibiótico de amplio espectro',
      status: 'PUBLISHED',
      stock: 30,
      minStock: 10,
      imageFileIds: [ids.fileA],
    });
  });

  it('el resumen cuenta y valora con decimal exacto: 30 × 14.00 = 420.00', async () => {
    const summary = await inA(() =>
      staffRead.getSummary(ids.pharmacyA, staffA),
    );
    expect(summary).toMatchObject({
      published: 2,
      drafts: 0,
      withdrawn: 0,
      outOfStock: 1,
      lowStock: 0,
      inventoryValue: '420.00',
    });
    expect(summary.byCategory).toEqual(
      expect.arrayContaining([{ category: 'Medicamentos', count: 1 }]),
    );
  });

  it('una categoría con productos vivos no se elimina (409)', async () => {
    const list = await inA(() => categories.list(ids.pharmacyA, staffA));
    const medicamentos = list.items.find((c) => c.name === 'Medicamentos')!;
    expect(medicamentos.productCount).toBe(1);
    expect(
      await rejected(
        inA(() => categories.remove(ids.pharmacyA, medicamentos.id, staffA)),
      ),
    ).toBeInstanceOf(ConflictException);
  });

  it('retirar por PATCH supersede el precio y saca el producto de lo vendible', async () => {
    const view = await inA(() =>
      products.updateProduct(
        ids.pharmacyA,
        productId,
        { status: 'WITHDRAWN' },
        staffA,
      ),
    );
    expect(view.status).toBe('WITHDRAWN');
    expect(view.unitPrice).toBeNull();
    const [{ active }] = await all<any>(
      `select count(*)::int as active from pharmacy.pharmacy_product_prices
        where pharmacy_product_id = ? and status_concept_id = ?`,
      [productId, PHARM.PRICE_ACTIVE],
    );
    expect(active).toBe(0);
  });
});
