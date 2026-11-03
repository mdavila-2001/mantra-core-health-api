import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { ResourceNotFoundException } from '../../src/common';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { COMM } from '../../src/modules/community/community.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import { PINV } from '../../src/modules/pharmacy_inventory/domain/pharmacy_inventory.concepts';
import { PublicPharmacyBranchesService } from '../../src/modules/public/application/services/public-pharmacy-branches.service';
import { PublicCatalogRepository } from '../../src/modules/public/infrastructure/repositories/public-catalog.repository';
import { PublicPharmacyBranchesRepository } from '../../src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository';

/**
 * P37 — las sucursales de una farmacia y la receta entre ellas, contra
 * PostgreSQL real: el SQL de `PublicPharmacyBranchesRepository` corre de verdad
 * sobre la cadena `pharmacies → pharmacy_sites → practice_sites → branches /
 * addresses` y sobre el stock por sede.
 *
 * Datos: sólo sintéticos, marcados con `P37-<sufijo>`, creados y retirados por
 * la prueba. Ninguna de estas tablas tiene triggers de historial (comprobado
 * en `information_schema.triggers` el 2026-10-26), así que no queda residuo.
 *
 * Escenario:
 * - Tenant A, farmacia verificada con sedes Norte (punto en la sucursal, stock
 *   de paracetamol y losartán **agotado**), Sur (punto sólo en la dirección,
 *   stock de los dos) y Suspendida (su sucursal está suspendida).
 * - Tenant C, farmacia **sin verificar** con su sede y ficha pública: su lista
 *   sale vacía (una farmacia por tenant: `uq_pharmacies_tenant_id`).
 * - Tenant B, otra farmacia con paracetamol de sobra: no se cruza.
 * - Una ubicación inactiva de Sur con stock: no cuenta.
 */
describe('P37 · sucursales públicas y receta (DB real)', () => {
  let orm: MikroORM;
  let service: PublicPharmacyBranchesService;
  const mark = `P37-${randomUUID().slice(0, 8)}`;
  const slug = mark.toLowerCase();
  const hiddenSlug = `${slug}-oculta`;
  const orgSlug = `${slug}-org`;
  const pendSlug = `${slug}-sin-verificar`;
  const any = CONCEPTS.STATE_ACTIVE;

  const id = () => randomUUID();
  const ids = {
    user: id(),
    tenantA: id(),
    tenantB: id(),
    tenantC: id(),
    practiceA: id(),
    practiceB: id(),
    brNorte: id(),
    brSur: id(),
    brSusp: id(),
    addrSur: id(),
    psNorte: id(),
    psSur: id(),
    psSusp: id(),
    psPend: id(),
    psB: id(),
    phA: id(),
    phPend: id(),
    phB: id(),
    sNorte: id(),
    sSur: id(),
    sSusp: id(),
    sPend: id(),
    sB: id(),
    prodPara: id(),
    prodLosa: id(),
    prodParaPend: id(),
    prodParaB: id(),
    locNorte: id(),
    locSur: id(),
    locSurOff: id(),
    locSusp: id(),
    locPend: id(),
    locB: id(),
    list: id(),
    profile: id(),
    hiddenProfile: id(),
    orgProfile: id(),
    pendProfile: id(),
  };

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
      CONCEPTS.CURRENCY_BOB,
      COMM.PROFILE_TARGET_PHARMACY,
      COMM.PROFILE_TARGET_ORGANIZATION,
      COMM.PROFILE_VISIBILITY_PUBLIC,
      COMM.PROFILE_VISIBILITY_PRIVATE,
      DIR.BRANCH_ACTIVE,
      DIR.BRANCH_SUSPENDED,
      PHARM.PHARMACY_ACTIVE,
      PHARM.VERIFICATION_VERIFIED,
      PHARM.VERIFICATION_PENDING,
      PHARM.SITE_ACTIVE,
      PHARM.PRODUCT_ACTIVE,
      PHARM.PRICE_LIST_ACTIVE,
      PHARM.PRICE_ACTIVE,
      PHARM.PRICE_LIST_TYPE_PUBLIC,
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
    for (const [tenant, suffix] of [
      [ids.tenantA, 'A'],
      [ids.tenantB, 'B'],
      [ids.tenantC, 'C'],
    ]) {
      await insert('directory.tenants', {
        id: tenant,
        code: `${mark}-${suffix}`,
        tenant_type_concept_id: any,
        legal_name: `${mark} ${suffix}`,
        legal_entity_type_concept_id: any,
        status_concept_id: any,
        verification_status_concept_id: any,
      });
    }
    for (const [practice, tenant] of [
      [ids.practiceA, ids.tenantA],
      [ids.practiceB, ids.tenantB],
    ]) {
      await insert('practice.practices', {
        id: practice,
        tenant_id: tenant,
        code: `${mark}-${practice.slice(0, 4)}`,
        name: mark,
        type_concept_id: any,
        admin_user_id: ids.user,
        status_concept_id: any,
      });
    }
    for (const [branch, name, lat, lng, status, description, url] of [
      [
        ids.brNorte,
        'Norte',
        '-17.70',
        '-63.18',
        DIR.BRANCH_ACTIVE,
        'Lun a Sáb 08:00–22:00',
        'https://maps.example/norte',
      ],
      [ids.brSur, 'Sur', null, null, DIR.BRANCH_ACTIVE, null, null],
      [
        ids.brSusp,
        'Suspendida',
        '-17.80',
        '-63.18',
        DIR.BRANCH_SUSPENDED,
        null,
        null,
      ],
    ]) {
      await insert('directory.branches', {
        id: branch,
        tenant_id: ids.tenantA,
        code: `${mark}-${name}`,
        name,
        branch_type_concept_id: any,
        status_concept_id: status,
        latitude: lat,
        longitude: lng,
        description,
        location_url: url,
      });
    }
    await insert('common.addresses', {
      id: ids.addrSur,
      owner_type_concept_id: any,
      owner_id: ids.psSur,
      country_concept_id: any,
      lines: 'Av. Sintética 742',
      city: 'Santa Cruz',
      latitude: '-17.85',
      longitude: '-63.18',
    });
    for (const [site, practice, branch, address] of [
      [ids.psNorte, ids.practiceA, ids.brNorte, null],
      [ids.psSur, ids.practiceA, ids.brSur, ids.addrSur],
      [ids.psSusp, ids.practiceA, ids.brSusp, null],
      [ids.psPend, ids.practiceA, null, null],
      [ids.psB, ids.practiceB, null, null],
    ]) {
      await insert('practice.practice_sites', {
        id: site,
        // El tenant de la sede es el de su práctica: FK compuesta
        // (tenant_id, practice_id) → practices (infraestructura_f1/f1b).
        tenant_id: practice === ids.practiceA ? ids.tenantA : ids.tenantB,
        practice_id: practice,
        branch_id: branch,
        address_id: address,
        code: `${mark}-${String(site).slice(0, 6)}`,
        name: mark,
        site_type_concept_id: any,
        status_concept_id: any,
      });
    }
    for (const [pharmacy, tenant, verification] of [
      [ids.phA, ids.tenantA, PHARM.VERIFICATION_VERIFIED],
      [ids.phPend, ids.tenantC, PHARM.VERIFICATION_PENDING],
      [ids.phB, ids.tenantB, PHARM.VERIFICATION_VERIFIED],
    ]) {
      await insert('pharmacy.pharmacies', {
        id: pharmacy,
        tenant_id: tenant,
        code: `${mark}-${pharmacy.slice(0, 6)}`,
        legal_name: `${mark} SRL`,
        trade_name: 'Farmacia Sintética',
        verification_status_concept_id: verification,
        status_concept_id: PHARM.PHARMACY_ACTIVE,
      });
    }
    for (const [site, pharmacy, practiceSite, name] of [
      [ids.sNorte, ids.phA, ids.psNorte, 'Norte'],
      [ids.sSur, ids.phA, ids.psSur, 'Sur'],
      [ids.sSusp, ids.phA, ids.psSusp, 'Suspendida'],
      [ids.sPend, ids.phPend, ids.psPend, 'Sin verificar'],
      [ids.sB, ids.phB, ids.psB, 'Ajena'],
    ]) {
      await insert('pharmacy.pharmacy_sites', {
        id: site,
        pharmacy_id: pharmacy,
        practice_site_id: practiceSite,
        code: `${mark}-${site.slice(0, 6)}`,
        name,
        status_concept_id: PHARM.SITE_ACTIVE,
      });
    }
    for (const [product, pharmacy, generic, brand, strength] of [
      [ids.prodPara, ids.phA, 'Paracetamol', 'Dolorán', '500 mg'],
      [ids.prodLosa, ids.phA, 'Losartán', null, '50 mg'],
      [ids.prodParaPend, ids.phPend, 'Paracetamol', null, '500 mg'],
      [ids.prodParaB, ids.phB, 'Paracetamol', null, '500 mg'],
    ]) {
      await insert('pharmacy.pharmacy_products', {
        id: product,
        pharmacy_id: pharmacy,
        product_code: `${mark}-${String(product).slice(0, 6)}`,
        generic_name: generic,
        brand_name: brand,
        strength_text: strength,
        status_concept_id: PHARM.PRODUCT_ACTIVE,
      });
    }
    for (const [location, site, status] of [
      [ids.locNorte, ids.sNorte, PINV.LOCATION_ACTIVE],
      [ids.locSur, ids.sSur, PINV.LOCATION_ACTIVE],
      [ids.locSurOff, ids.sSur, any],
      [ids.locSusp, ids.sSusp, PINV.LOCATION_ACTIVE],
      [ids.locPend, ids.sPend, PINV.LOCATION_ACTIVE],
      [ids.locB, ids.sB, PINV.LOCATION_ACTIVE],
    ]) {
      await insert('pharmacy_inventory.inventory_locations', {
        id: location,
        pharmacy_site_id: site,
        code: `${mark}-${location.slice(0, 6)}`,
        name: mark,
        location_type_concept_id: any,
        status_concept_id: status,
      });
    }
    for (const [location, product, available] of [
      [ids.locNorte, ids.prodPara, '10'],
      [ids.locNorte, ids.prodLosa, '0'], // agotado: es faltante
      [ids.locSur, ids.prodPara, '5'],
      [ids.locSur, ids.prodLosa, '3'],
      [ids.locSurOff, ids.prodPara, '99'], // ubicación inactiva: no cuenta
      [ids.locSusp, ids.prodPara, '9'],
      [ids.locPend, ids.prodParaPend, '50'],
      [ids.locB, ids.prodParaB, '100'],
    ]) {
      await run(
        `insert into pharmacy_inventory.inventory_stock_positions
           (id, inventory_location_id, pharmacy_product_id, on_hand_quantity,
            reserved_quantity, quarantine_quantity, available_quantity,
            last_ledger_sequence, updated_at)
         values (?, ?, ?, ?, 0, 0, ?, 0, now())`,
        [randomUUID(), location, product, available, available],
      );
    }
    await insert('pharmacy.pharmacy_price_lists', {
      id: ids.list,
      pharmacy_id: ids.phA,
      code: `${mark}-LP`,
      price_list_type_concept_id: PHARM.PRICE_LIST_TYPE_PUBLIC,
      currency_concept_id: CONCEPTS.CURRENCY_BOB,
      public_visibility: true,
      status_concept_id: PHARM.PRICE_LIST_ACTIVE,
    });
    for (const [product, amount] of [
      [ids.prodPara, '4.50'],
      [ids.prodLosa, '12.25'],
    ]) {
      await run(
        `insert into pharmacy.pharmacy_product_prices
           (id, pharmacy_price_list_id, pharmacy_product_id, version_number,
            unit_amount, effective_from, status_concept_id, recorded_at)
         values (?, ?, ?, 1, ?, now() - interval '1 day', ?, now())`,
        [randomUUID(), ids.list, product, amount, PHARM.PRICE_ACTIVE],
      );
    }
    for (const [profile, profileSlug, target, visibility] of [
      [
        ids.profile,
        slug,
        COMM.PROFILE_TARGET_PHARMACY,
        COMM.PROFILE_VISIBILITY_PUBLIC,
      ],
      [
        ids.hiddenProfile,
        hiddenSlug,
        COMM.PROFILE_TARGET_PHARMACY,
        COMM.PROFILE_VISIBILITY_PRIVATE,
      ],
      [
        ids.orgProfile,
        orgSlug,
        COMM.PROFILE_TARGET_ORGANIZATION,
        COMM.PROFILE_VISIBILITY_PUBLIC,
      ],
      [
        ids.pendProfile,
        pendSlug,
        COMM.PROFILE_TARGET_PHARMACY,
        COMM.PROFILE_VISIBILITY_PUBLIC,
      ],
    ]) {
      await insert('community.public_profiles', {
        id: profile,
        tenant_id: profile === ids.pendProfile ? ids.tenantC : ids.tenantA,
        target_type_concept_id: target,
        target_id: ids.phA,
        slug: profileSlug,
        display_name: mark,
        visibility_concept_id: visibility,
        status_concept_id: CONCEPTS.STATE_ACTIVE,
      });
    }

    service = new PublicPharmacyBranchesService(
      orm.em as never,
      new PublicCatalogRepository(),
      new PublicPharmacyBranchesRepository(),
    );
  });

  afterAll(async () => {
    if (!orm) return;
    const del = (table: string, column: string, values: string[]) =>
      run(
        `delete from ${table} where ${column} in (${values.map(() => '?').join(', ')})`,
        values,
      );
    await del('community.public_profiles', 'id', [
      ids.profile,
      ids.hiddenProfile,
      ids.orgProfile,
      ids.pendProfile,
    ]);
    await del('pharmacy.pharmacy_product_prices', 'pharmacy_price_list_id', [
      ids.list,
    ]);
    await del('pharmacy.pharmacy_price_lists', 'id', [ids.list]);
    const locations = [
      ids.locNorte,
      ids.locSur,
      ids.locSurOff,
      ids.locSusp,
      ids.locPend,
      ids.locB,
    ];
    await del(
      'pharmacy_inventory.inventory_stock_positions',
      'inventory_location_id',
      locations,
    );
    await del('pharmacy_inventory.inventory_locations', 'id', locations);
    await del('pharmacy.pharmacy_products', 'id', [
      ids.prodPara,
      ids.prodLosa,
      ids.prodParaPend,
      ids.prodParaB,
    ]);
    await del('pharmacy.pharmacy_sites', 'id', [
      ids.sNorte,
      ids.sSur,
      ids.sSusp,
      ids.sPend,
      ids.sB,
    ]);
    await del('pharmacy.pharmacies', 'id', [ids.phA, ids.phPend, ids.phB]);
    await del('practice.practice_sites', 'id', [
      ids.psNorte,
      ids.psSur,
      ids.psSusp,
      ids.psPend,
      ids.psB,
    ]);
    await del('common.addresses', 'id', [ids.addrSur]);
    await del('directory.branches', 'id', [ids.brNorte, ids.brSur, ids.brSusp]);
    await del('practice.practices', 'id', [ids.practiceA, ids.practiceB]);
    await del('directory.tenants', 'id', [
      ids.tenantA,
      ids.tenantB,
      ids.tenantC,
    ]);
    await del('iam.users', 'id', [ids.user]);
    await orm.close(true);
  });

  it('lista sólo las sedes activas de la farmacia verificada del tenant, con el punto de la sucursal o de la dirección', async () => {
    const page = await service.branches(slug);

    expect(page.items.map((b) => b.id)).toEqual([ids.sSur, ids.sNorte]);
    const [sur, norte] = page.items;
    expect(sur).toMatchObject({
      slug,
      name: 'Farmacia Sintética · Sur',
      city: 'Santa Cruz',
      addressText: 'Av. Sintética 742',
      location: { lat: -17.85, lng: -63.18 },
      isCurrent: false,
    });
    expect(norte).toMatchObject({
      siteName: 'Norte',
      city: null,
      description: 'Lun a Sáb 08:00–22:00',
      locationUrl: 'https://maps.example/norte',
      location: { lat: -17.7, lng: -63.18 },
    });
  });

  it('busca la receta: sólo stock disponible de ubicaciones activas, completas primero, sin cruzar a otro tenant', async () => {
    const result = await service.availability(slug, {
      items: ['paracetamol', 'Losartan'],
      lat: -17.7,
      lng: -63.18,
    });

    expect(result.items.map((i) => i.branch.id)).toEqual([
      ids.sSur,
      ids.sNorte,
    ]);
    const [sur, norte] = result.items;
    expect(sur).toMatchObject({
      complete: true,
      missing: [],
      totalAmount: '16.75',
      currency: 'BOB',
    });
    expect(sur.matches.map((m) => [m.term, m.genericName, m.price])).toEqual([
      ['paracetamol', 'Paracetamol', '4.50'],
      ['Losartan', 'Losartán', '12.25'],
    ]);
    expect(sur.distanceKm).toBeGreaterThan(16);
    // Norte está a 0 km pero tiene el losartán agotado: va segunda.
    expect(norte).toMatchObject({
      complete: false,
      missing: ['Losartan'],
      totalAmount: '4.50',
      distanceKm: 0,
    });
  });

  it('un renglón que nadie tiene es faltante en todas; sin ubicación no hay distancias', async () => {
    const result = await service.availability(slug, {
      items: ['Ibuprofeno 400'],
    });
    expect(result.count).toBe(2);
    for (const item of result.items) {
      expect(item).toMatchObject({
        matches: [],
        missing: ['Ibuprofeno 400'],
        complete: false,
        totalAmount: null,
        distanceKm: null,
      });
    }
  });

  it('un comodín de LIKE en la receta se busca literal y no trae todo el catálogo', async () => {
    const result = await service.availability(slug, { items: ['%'] });
    expect(result.items.every((item) => item.matches.length === 0)).toBe(true);
  });

  it('la farmacia sin verificar tiene ficha pero ninguna sucursal publicada: lista vacía, no 404', async () => {
    const page = await service.branches(pendSlug);
    expect(page.items).toEqual([]);
    const result = await service.availability(pendSlug, {
      items: ['paracetamol'],
    });
    expect(result).toMatchObject({ items: [], count: 0 });
  });

  it('negativo: una ficha oculta, una de otro tipo o un slug inexistente dan el mismo 404', async () => {
    for (const candidate of [hiddenSlug, orgSlug, `${slug}-no-existe`]) {
      await expect(service.branches(candidate)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      await expect(
        service.availability(candidate, { items: ['paracetamol'] }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    }
  });
});
