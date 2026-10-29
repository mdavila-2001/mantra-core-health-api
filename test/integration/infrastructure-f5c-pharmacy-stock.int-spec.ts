import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import { TokenService, runWithTenant } from '../../src/common';
import { PharmacyInventoryScopePolicy } from '../../src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.policy';
import { DispenseMedicationUseCase } from '../../src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case';
import { ReserveInventoryUseCase } from '../../src/modules/pharmacy_inventory/application/inventory-reservations/reserve-inventory.use-case';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import { PINV } from '../../src/modules/pharmacy_inventory/domain/pharmacy_inventory.concepts';
import {
  TEST_ADMIN_ID,
  bootstrapTestApp,
  ensureTestSession,
  type TestContext,
} from './harness';
import {
  ROLE,
  as,
  createPatient,
  createSpace,
  createStaff,
  createUnit,
  ifMatch,
  registerOrg,
  toolbox,
  type InfraOrg,
  type Staff,
} from './infrastructure-f3.fixtures';

/**
 * F5c · farmacia e inventario: el botiquín por unidad y el punto de stock en un
 * espacio (CONTRATO-F2-F5 F5c), contra la base real y por HTTP real.
 *
 * Por endpoint: un caso permitido y casos que fallan cerrado (espacio, unidad o sede
 * de farmacia de otro tenant: 404 idéntico al de un id inexistente; mismo tenant sin
 * rol: 404; con rol pero sin la acción: 403). El flujo completo es el de la
 * aceptación: crear el botiquín → cargar stock → clausurar el espacio (409 con el
 * bloqueo y su próxima acción) → reubicar → recargar → el stock aparece en el
 * espacio nuevo y la clausura del viejo procede.
 */
describe('Infraestructura F5c · farmacia e inventario', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let siteA2: string;
  let unitA: string;
  let unitB: string;
  let storageOne: string;
  let storageTwo: string;
  let nurseStation: string;
  let consulting: string;
  let storageOtherSite: string;
  let spaceB: string;
  let pharmacySiteA: string;
  let pharmacySiteB: string;
  let pharmacyA: string;
  let nurse: Staff;
  let plain: Staff;
  let pharmacist: { Authorization: string; 'X-Tenant-Id': string };
  let seq = 0;

  const owner = (org: InfraOrg) => as(org.token, org.tenantId);
  const platform = () => as(ctx.adminToken, orgA.tenantId);

  const mkSpace = async (
    org: InfraOrg,
    fn: string,
    name: string,
    extra: Record<string, unknown> = {},
  ): Promise<string> => {
    seq += 1;
    return (
      await createSpace(ctx, org, {
        code: `F5C${seq}-${suffix}`,
        name,
        formCode: 'LOC_FORM_ROOM',
        functionCode: fn,
        ...extra,
      })
    ).id;
  };

  async function activeUnit(org: InfraOrg, code: string): Promise<string> {
    const id = await createUnit(ctx, org, code, `Unidad ${code}`);
    const unit = await http()
      .get(`/clinical-units/${id}`)
      .set(owner(org))
      .expect(200);
    if (unit.body.status?.code !== 'UNIT_ACTIVE') {
      await http()
        .post(`/clinical-units/${id}/lifecycle`)
        .set(owner(org))
        .set(ifMatch(unit.body.rowVersion))
        .send({ action: 'activate' })
        .expect(200);
    }
    return id;
  }

  async function mkPharmacy(
    org: InfraOrg,
  ): Promise<{ id: string; site: string }> {
    const id = randomUUID();
    const site = randomUUID();
    await sql(
      `insert into pharmacy.pharmacies
         (id, tenant_id, code, legal_name, verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        id,
        org.tenantId,
        `F5C-PH-${org.letter}-${suffix}`,
        `Farmacia ${org.letter}`,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.PHARMACY_ACTIVE,
      ],
    );
    await sql(
      `insert into pharmacy.pharmacy_sites
         (id, pharmacy_id, practice_site_id, code, name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        site,
        id,
        org.siteId,
        `F5C-PS-${org.letter}-${suffix}`,
        `Sede farmacia ${org.letter}`,
        PHARM.SITE_ACTIVE,
      ],
    );
    return { id, site };
  }

  /** Stock sintético: producto y una posición de la ubicación. */
  async function stock(
    pharmacyId: string,
    locationId: string,
    qty: { onHand: number; reserved: number },
  ): Promise<string> {
    const product = randomUUID();
    await sql(
      `insert into pharmacy.pharmacy_products
         (id, pharmacy_id, product_code, brand_name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [
        product,
        pharmacyId,
        `P-${product.slice(0, 8)}`,
        'Producto F5C',
        PHARM.PRODUCT_ACTIVE,
      ],
    );
    await sql(
      `insert into pharmacy_inventory.inventory_stock_positions
         (id, inventory_location_id, pharmacy_product_id, on_hand_quantity, reserved_quantity,
          quarantine_quantity, available_quantity, last_ledger_sequence, updated_at)
       values (gen_random_uuid(), ?, ?, ?, ?, 0, ?, 0, now())`,
      [
        locationId,
        product,
        qty.onHand,
        qty.reserved,
        qty.onHand - qty.reserved,
      ],
    );
    return product;
  }

  const locationUrl = (siteId: string) =>
    `/pharmacy/${siteId}/inventory-locations`;
  const create = (
    who: Record<string, string>,
    siteId: string,
    body: Record<string, unknown>,
  ) =>
    http()
      .post(locationUrl(siteId))
      .set(who)
      .send({
        code: `L${(seq += 1)}-${suffix}`,
        name: `Ubicación ${seq}`,
        ...body,
      });

  const eventsOf = (locationId: string) =>
    sql<{ event_type: string; payload_json: any }>(
      `select event_type, payload_json from messaging.domain_events
        where aggregate_id = ? and event_type like 'pharmacy_inventory.location.%'
        order by recorded_at`,
      [locationId],
    );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    orgA = await registerOrg(ctx, 'A', suffix);
    orgB = await registerOrg(ctx, 'B', suffix);
    unitA = await activeUnit(orgA, `UN-A-${suffix}`);
    unitB = await activeUnit(orgB, `UN-B-${suffix}`);
    storageOne = await mkSpace(orgA, 'SPACE_FN_STORAGE', 'Depósito 1');
    storageTwo = await mkSpace(orgA, 'SPACE_FN_STORAGE', 'Depósito 2');
    nurseStation = await mkSpace(
      orgA,
      'SPACE_FN_NURSE_STATION',
      'Estación de enfermería',
      {
        clinicalUnitId: unitA,
      },
    );
    consulting = await mkSpace(
      orgA,
      'SPACE_FN_CONSULTING_ROOM',
      'Consultorio 1',
    );
    spaceB = await mkSpace(orgB, 'SPACE_FN_STORAGE', 'Depósito B');
    siteA2 = (
      await http()
        .post(`/practices/${orgA.practiceId}/sites`)
        .set(owner(orgA))
        .send({ code: `F5C-SEDE-A2-${suffix}`, name: 'Sede A2' })
        .expect(201)
    ).body.id;
    seq += 1;
    storageOtherSite = (
      await http()
        .post(`/sites/${siteA2}/care-spaces`)
        .set(owner(orgA))
        .send({
          activate: true,
          code: `F5C-A2-${seq}-${suffix}`,
          name: 'Depósito A2',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_STORAGE',
        })
        .expect(201)
    ).body.id;

    const phA = await mkPharmacy(orgA);
    pharmacyA = phA.id;
    pharmacySiteA = phA.site;
    pharmacySiteB = (await mkPharmacy(orgB)).site;

    const site = { kind: 'SITE', siteId: orgA.siteId } as const;
    nurse = await createStaff(ctx, orgA, 'enf', ROLE.NURSE, site, suffix);
    plain = await createStaff(ctx, orgA, 'pla', ROLE.BILLING, site, suffix);
    await sql(
      `delete from delegated_access.organization_user_assignments where tenant_membership_id = ?`,
      [plain.membershipId],
    );
    const pharm = await createStaff(
      ctx,
      orgA,
      'far',
      ROLE.BILLING,
      site,
      suffix,
    );
    await sql(
      `delete from delegated_access.organization_user_assignments where tenant_membership_id = ?`,
      [pharm.membershipId],
    );
    await ensureTestSession(ctx.orm, pharm.userId, 'f5c-pharmacist');
    pharmacist = {
      Authorization: `Bearer ${ctx.app
        .get(TokenService)
        .signAccessToken(
          pharm.userId,
          'f5c-pharmacist',
          ['PHARMACY_STAFF'],
          [orgA.tenantId],
        )}`,
      'X-Tenant-Id': orgA.tenantId,
    };
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  // --------------------------------------------------------- POST (alta)
  describe('POST /pharmacy/:siteId/inventory-locations', () => {
    it('un depósito en un espacio punto de stock queda ligado, con su evento', async () => {
      const res = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: storageOne,
      }).expect(201);
      expect(res.body).toMatchObject({
        careSpaceId: storageOne,
        locationType: 'SHELF',
      });
      const [row] = await sql(
        `select care_space_id, clinical_unit_id, location_type_concept_id, status_concept_id
           from pharmacy_inventory.inventory_locations where id = ?`,
        [res.body.id],
      );
      expect(row).toMatchObject({
        care_space_id: storageOne,
        clinical_unit_id: null,
        location_type_concept_id: PINV.LOCATION_TYPE_SHELF,
        status_concept_id: PINV.LOCATION_ACTIVE,
      });
      const events = await eventsOf(res.body.id);
      expect(events.map((e) => e.event_type)).toEqual([
        'pharmacy_inventory.location.located',
      ]);
      expect(events[0].payload_json).toMatchObject({
        careSpaceId: storageOne,
        practiceSiteId: orgA.siteId,
        locationType: 'SHELF',
      });
    });

    it('sin espacio ni unidad sigue siendo el estante de siempre', async () => {
      const res = await create(owner(orgA), pharmacySiteA, {}).expect(201);
      expect(res.body).toEqual({ id: expect.any(String), rowVersion: 1 });
      expect(await eventsOf(res.body.id)).toEqual([]);
    });

    it('el botiquín de una unidad: uno vigente por unidad (409), y la base es la red', async () => {
      const first = await create(owner(orgA), pharmacySiteA, {
        locationTypeCode: 'WARD_STOCK',
        clinicalUnitId: unitA,
        careSpaceId: nurseStation,
      }).expect(201);
      expect(first.body).toMatchObject({
        locationType: 'WARD_STOCK',
        clinicalUnitId: unitA,
      });
      const second = await create(owner(orgA), pharmacySiteA, {
        locationTypeCode: 'WARD_STOCK',
        clinicalUnitId: unitA,
      });
      expect(second.status).toBe(409);
      expect(second.body.reason).toBe('WARD_STOCK_ALREADY_EXISTS');
      // el único parcial del modelo rechaza el segundo aunque la API no lo hubiera visto
      await expect(
        sql(
          `insert into pharmacy_inventory.inventory_locations
             (id, pharmacy_site_id, code, name, location_type_concept_id, status_concept_id,
              clinical_unit_id, created_at, updated_at)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now(), now())`,
          [
            pharmacySiteA,
            `DUP-${suffix}`,
            'Duplicado',
            PINV.LOCATION_TYPE_WARD_STOCK,
            PINV.LOCATION_ACTIVE,
            unitA,
          ],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });

    it('un botiquín sin unidad es 422 WARD_STOCK_UNIT_REQUIRED', async () => {
      const res = await create(owner(orgA), pharmacySiteA, {
        locationTypeCode: 'WARD_STOCK',
      }).expect(422);
      expect(res.body.reason).toBe('WARD_STOCK_UNIT_REQUIRED');
    });

    it('espacio sin perfil de punto de stock: 422 SPACE_NOT_STOCK_POINT', async () => {
      const res = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: consulting,
      }).expect(422);
      expect(res.body.reason).toBe('SPACE_NOT_STOCK_POINT');
    });

    it('espacio o unidad de otra sede del mismo tenant: 422 STOCK_POINT_SITE_MISMATCH', async () => {
      const space = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: storageOtherSite,
      }).expect(422);
      expect(space.body.reason).toBe('STOCK_POINT_SITE_MISMATCH');
      const otherUnit = (
        await http()
          .post(`/sites/${siteA2}/clinical-units`)
          .set(owner(orgA))
          .send({ code: `UN-A2-${suffix}`, name: 'Otra sede' })
          .expect(201)
      ).body.id;
      const unit = await create(owner(orgA), pharmacySiteA, {
        clinicalUnitId: otherUnit,
      }).expect(422);
      expect(unit.body.reason).toBe('STOCK_POINT_SITE_MISMATCH');
    });

    it('el espacio que no es de la unidad indicada: 422', async () => {
      const res = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: storageOne,
        clinicalUnitId: unitA,
      }).expect(422);
      expect(res.body.reason).toBe('STOCK_POINT_UNIT_MISMATCH');
    });

    it('un espacio clausurado no recibe stock (422)', async () => {
      const spare = await mkSpace(orgA, 'SPACE_FN_STORAGE', 'Depósito baja');
      const detail = await http()
        .get(`/care-spaces/${spare}`)
        .set(owner(orgA))
        .expect(200);
      await http()
        .post(`/care-spaces/${spare}/lifecycle`)
        .set(owner(orgA))
        .set(ifMatch(detail.body.rowVersion))
        .send({ action: 'retire', reason: 'Prueba' })
        .expect(200);
      const res = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: spare,
      }).expect(422);
      expect(res.body.reason).toBe('STOCK_POINT_SPACE_NOT_ACTIVE');
    });

    it('un tipo de ubicación desconocido es un 400 del cuerpo', async () => {
      await create(owner(orgA), pharmacySiteA, {
        locationTypeCode: 'CUALQUIERA',
      }).expect(400);
    });

    it('fail-closed por tenant: espacio, unidad o sede de farmacia ajenos responden el mismo 404', async () => {
      const foreignSpace = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: spaceB,
      });
      const missingSpace = await create(owner(orgA), pharmacySiteA, {
        careSpaceId: randomUUID(),
      });
      expect(foreignSpace.status).toBe(404);
      expect(missingSpace.status).toBe(404);
      expect(foreignSpace.body.reason).toBe(missingSpace.body.reason);
      expect(foreignSpace.body.message).toBe(missingSpace.body.message);
      await create(owner(orgA), pharmacySiteA, {
        clinicalUnitId: unitB,
      }).expect(404);
      await create(owner(orgA), pharmacySiteB, {}).expect(404);
      await create(owner(orgB), pharmacySiteA, {}).expect(404);
      const none = await sql(
        `select count(*)::int as n from pharmacy_inventory.inventory_locations where care_space_id = ?`,
        [spaceB],
      );
      expect(none[0].n).toBe(0);
    });

    it('fail-closed por rol: enfermería 403, un miembro sin rol 404', async () => {
      const denied = await create(
        as(nurse.token, orgA.tenantId),
        pharmacySiteA,
        {
          careSpaceId: storageOne,
        },
      );
      expect(denied.status).toBe(403);
      expect(denied.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      await create(as(plain.token, orgA.tenantId), pharmacySiteA, {
        careSpaceId: storageOne,
      }).expect(404);
    });

    it('el personal de farmacia y la plataforma también operan', async () => {
      await create(pharmacist, pharmacySiteA, {
        careSpaceId: storageTwo,
      }).expect(201);
      await create(platform(), pharmacySiteA, {}).expect(201);
    });
  });

  // ---------------------------------------- flujo completo: stock → clausura → reubicar
  describe('flujo completo con recarga', () => {
    let depot: { id: string; rowVersion: number };
    let destination: string;
    let product: string;

    beforeAll(async () => {
      destination = await mkSpace(
        orgA,
        'SPACE_FN_PHARMACY',
        'Farmacia central',
      );
      const depotSpace = await mkSpace(
        orgA,
        'SPACE_FN_STORAGE',
        'Depósito flujo',
      );
      depot = (
        await create(owner(orgA), pharmacySiteA, {
          careSpaceId: depotSpace,
        }).expect(201)
      ).body;
      product = await stock(pharmacyA, depot.id, { onHand: 12, reserved: 0 });
    });

    const spaceOf = async (id: string) =>
      (await http().get(`/care-spaces/${id}`).set(owner(orgA)).expect(200))
        .body;

    it('el stock bloquea la clausura: 409 con INVENTORY_LOCATION y su próxima acción', async () => {
      const [{ care_space_id }] = await sql(
        `select care_space_id from pharmacy_inventory.inventory_locations where id = ?`,
        [depot.id],
      );
      const space = await spaceOf(care_space_id);
      const blocked = await http()
        .post(`/care-spaces/${care_space_id}/lifecycle`)
        .set(owner(orgA))
        .set(ifMatch(space.rowVersion))
        .send({ action: 'retire', reason: 'Remodelación' })
        .expect(409);
      expect(blocked.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      expect(blocked.body.details.blockers).toEqual([
        expect.objectContaining({
          kind: 'INVENTORY_LOCATION',
          count: 1,
          sampleIds: [depot.id],
          nextAction: 'Transferir el stock o reubicar el depósito',
        }),
      ]);
    });

    it('reubicar: 200, el stock sigue a la ubicación y no se toca el ledger ni las posiciones', async () => {
      const before = await sql(
        `select on_hand_quantity::float as on_hand, available_quantity::float as available, updated_at
           from pharmacy_inventory.inventory_stock_positions where inventory_location_id = ?`,
        [depot.id],
      );
      const ledgerBefore = await sql(
        `select count(*)::int as n from pharmacy_inventory.inventory_ledger_entries where inventory_location_id = ?`,
        [depot.id],
      );
      const res = await http()
        .post(`/pharmacy/inventory-locations/${depot.id}/relocate`)
        .set(owner(orgA))
        .set(ifMatch(depot.rowVersion))
        .send({ careSpaceId: destination })
        .expect(200);
      expect(res.body).toMatchObject({
        id: depot.id,
        careSpaceId: destination,
        rowVersion: depot.rowVersion + 1,
      });
      const after = await sql(
        `select on_hand_quantity::float as on_hand, available_quantity::float as available, updated_at
           from pharmacy_inventory.inventory_stock_positions where inventory_location_id = ?`,
        [depot.id],
      );
      expect(after).toEqual(before);
      const ledgerAfter = await sql(
        `select count(*)::int as n from pharmacy_inventory.inventory_ledger_entries where inventory_location_id = ?`,
        [depot.id],
      );
      expect(ledgerAfter[0].n).toBe(ledgerBefore[0].n);
      const [row] = await sql(
        `select care_space_id from pharmacy_inventory.inventory_locations where id = ?`,
        [depot.id],
      );
      expect(row.care_space_id).toBe(destination);
      const events = await eventsOf(depot.id);
      expect(events.map((e) => e.event_type)).toEqual([
        'pharmacy_inventory.location.located',
        'pharmacy_inventory.location.relocated',
      ]);
      expect(events[1].payload_json).toMatchObject({
        toCareSpaceId: destination,
        rowVersion: depot.rowVersion + 1,
      });
      depot.rowVersion += 1;
    });

    it('recarga: el stock aparece en el espacio nuevo y ya no en el viejo', async () => {
      const inNew = await http()
        .get(`/pharmacy/care-spaces/${destination}/inventory-locations`)
        .set(owner(orgA))
        .expect(200);
      const location = inNew.body.locations.find((l: any) => l.id === depot.id);
      expect(location).toMatchObject({
        careSpace: { id: destination },
        locationType: 'SHELF',
        totals: { onHand: 12, available: 12, positions: 1 },
      });
      expect(location.positions[0]).toMatchObject({
        productId: product,
        productName: 'Producto F5C',
        onHand: 12,
      });
      expect(JSON.stringify(inNew.body)).not.toMatch(/patient|paciente/i);
    });

    it('con el stock fuera, el espacio viejo se clausura', async () => {
      // el depósito ya no está en el espacio viejo: el retire-check no ve bloqueo de stock
      const oldSpace = (
        await sql(
          `select id from practice.care_spaces where tenant_id = ? and name = 'Depósito flujo'`,
          [orgA.tenantId],
        )
      )[0].id;
      const check = await http()
        .get(`/care-spaces/${oldSpace}/retire-check`)
        .set(owner(orgA))
        .expect(200);
      expect(check.body.blockers).toEqual([]);
      const space = await spaceOf(oldSpace);
      await http()
        .post(`/care-spaces/${oldSpace}/lifecycle`)
        .set(owner(orgA))
        .set(ifMatch(space.rowVersion))
        .send({ action: 'retire', reason: 'Se mudó el depósito' })
        .expect(200);
    });
  });

  // ------------------------------------------------------ POST relocate
  describe('POST /pharmacy/inventory-locations/:id/relocate', () => {
    let loc: { id: string; rowVersion: number };
    beforeAll(async () => {
      const space = await mkSpace(orgA, 'SPACE_FN_STORAGE', 'Depósito reloc');
      loc = (
        await create(owner(orgA), pharmacySiteA, { careSpaceId: space }).expect(
          201,
        )
      ).body;
    });
    const relocate = (
      who: Record<string, string>,
      id: string,
      version: number | null,
      body: Record<string, unknown>,
    ) => {
      const req = http()
        .post(`/pharmacy/inventory-locations/${id}/relocate`)
        .set(who);
      if (version !== null) req.set(ifMatch(version));
      return req.send(body);
    };

    it('sin If-Match: 428; con una versión vieja: 412', async () => {
      await relocate(owner(orgA), loc.id, null, {
        careSpaceId: storageTwo,
      }).expect(428);
      const stale = await relocate(owner(orgA), loc.id, loc.rowVersion + 5, {
        careSpaceId: storageTwo,
      });
      expect(stale.status).toBe(412);
      expect(stale.body.reason).toBe('ROW_VERSION_MISMATCH');
    });

    it('destino sin perfil de stock, de otra sede o ajeno al tenant', async () => {
      const notStock = await relocate(owner(orgA), loc.id, loc.rowVersion, {
        careSpaceId: consulting,
      });
      expect(notStock.status).toBe(422);
      expect(notStock.body.reason).toBe('SPACE_NOT_STOCK_POINT');
      const otherSite = await relocate(owner(orgA), loc.id, loc.rowVersion, {
        careSpaceId: storageOtherSite,
      });
      expect(otherSite.status).toBe(422);
      expect(otherSite.body.reason).toBe('STOCK_POINT_SITE_MISMATCH');
      const foreign = await relocate(owner(orgA), loc.id, loc.rowVersion, {
        careSpaceId: spaceB,
      });
      const missing = await relocate(owner(orgA), loc.id, loc.rowVersion, {
        careSpaceId: randomUUID(),
      });
      expect(foreign.status).toBe(404);
      expect(foreign.body.reason).toBe(missing.body.reason);
    });

    it('fail-closed: una ubicación de otro tenant es 404, enfermería 403, sin rol 404', async () => {
      await relocate(owner(orgB), loc.id, loc.rowVersion, {
        careSpaceId: storageTwo,
      }).expect(404);
      await relocate(as(nurse.token, orgA.tenantId), loc.id, loc.rowVersion, {
        careSpaceId: storageTwo,
      }).expect(403);
      await relocate(as(plain.token, orgA.tenantId), loc.id, loc.rowVersion, {
        careSpaceId: storageTwo,
      }).expect(404);
      await relocate(owner(orgA), randomUUID(), 1, {
        careSpaceId: storageTwo,
      }).expect(404);
    });

    it('el personal de farmacia reubica; el mismo espacio es idempotente', async () => {
      const res = await relocate(pharmacist, loc.id, loc.rowVersion, {
        careSpaceId: storageTwo,
      }).expect(200);
      expect(res.body.careSpaceId).toBe(storageTwo);
      const again = await relocate(pharmacist, loc.id, res.body.rowVersion, {
        careSpaceId: storageTwo,
      }).expect(200);
      expect(again.body.rowVersion).toBe(res.body.rowVersion);
    });
  });

  // ------------------------------------------------------ GET stock de un espacio
  describe('GET /pharmacy/care-spaces/:id/inventory-locations', () => {
    it('enfermería con alcance sobre el espacio lo lee; organización y farmacia también', async () => {
      for (const who of [
        as(nurse.token, orgA.tenantId),
        owner(orgA),
        pharmacist,
      ]) {
        await http()
          .get(`/pharmacy/care-spaces/${nurseStation}/inventory-locations`)
          .set(who)
          .expect(200);
      }
    });

    it('fail-closed: otro tenant 404, miembro sin rol 404, id inexistente igual', async () => {
      const foreign = await http()
        .get(`/pharmacy/care-spaces/${nurseStation}/inventory-locations`)
        .set(owner(orgB));
      const missing = await http()
        .get(`/pharmacy/care-spaces/${randomUUID()}/inventory-locations`)
        .set(owner(orgA));
      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.body.reason).toBe(missing.body.reason);
      await http()
        .get(`/pharmacy/care-spaces/${nurseStation}/inventory-locations`)
        .set(as(plain.token, orgA.tenantId))
        .expect(404);
      await http()
        .get(`/pharmacy/care-spaces/${spaceB}/inventory-locations`)
        .set(pharmacist)
        .expect(404);
    });

    it('un espacio sin ubicaciones responde la lista vacía (S3 con próxima acción en la UI)', async () => {
      const res = await http()
        .get(`/pharmacy/care-spaces/${consulting}/inventory-locations`)
        .set(owner(orgA))
        .expect(200);
      expect(res.body.locations).toEqual([]);
    });
  });

  // ------------------------------------------------ botiquín: disponible vs. reservado
  describe('el botiquín no cede lo reservado', () => {
    it('transferir desde un botiquín sin disponible suficiente: 409 INSUFFICIENT_AVAILABLE_STOCK', async () => {
      const ward = (
        await http()
          .get(`/pharmacy/care-spaces/${nurseStation}/inventory-locations`)
          .set(owner(orgA))
          .expect(200)
      ).body.locations.find((l: any) => l.locationType === 'WARD_STOCK');
      const product = await stock(pharmacyA, ward.id, {
        onHand: 10,
        reserved: 8,
      });
      const target = (await create(owner(orgA), pharmacySiteA, {}).expect(201))
        .body.id;
      const refused = await http()
        .post(`/pharmacy/${pharmacyA}/transfers`)
        .set(platform())
        .send({
          pharmacySiteId: pharmacySiteA,
          fromLocationId: ward.id,
          toLocationId: target,
          pharmacyProductId: product,
          quantity: 5,
        });
      expect(refused.status).toBe(409);
      expect(refused.body.reason).toBe('INSUFFICIENT_AVAILABLE_STOCK');
      // lo disponible sí se puede ceder
      await http()
        .post(`/pharmacy/${pharmacyA}/transfers`)
        .set(platform())
        .send({
          pharmacySiteId: pharmacySiteA,
          fromLocationId: ward.id,
          toLocationId: target,
          pharmacyProductId: product,
          quantity: 2,
        })
        .expect(201);
      const [pos] = await sql(
        `select on_hand_quantity::float as on_hand, reserved_quantity::float as reserved
           from pharmacy_inventory.inventory_stock_positions where inventory_location_id = ? and pharmacy_product_id = ?`,
        [ward.id, product],
      );
      expect(pos).toEqual({ on_hand: 8, reserved: 8 });
    });
  });

  // -------------------------------- dispensa del botiquín respaldada por una reserva
  describe('la reserva sólo exime del disponible hasta lo reservado', () => {
    let admin: any;
    let patient: string;
    let ward: string;
    let product: string;
    let other: string;

    const inA = <T>(work: () => Promise<T>): Promise<T> =>
      runWithTenant(orgA.tenantId, work);
    const reserve = async (location: string, productId: string, qty: number) =>
      (
        await inA(() =>
          ctx.app.get(ReserveInventoryUseCase).execute(
            pharmacyA,
            {
              pharmacySiteId: pharmacySiteA,
              lines: [
                {
                  inventoryLocationId: location,
                  pharmacyProductId: productId,
                  requestedQuantity: qty,
                },
              ],
            } as any,
            admin,
          ),
        )
      ).id;
    const dispense = (
      location: string,
      productId: string,
      qty: number,
      reservationId?: string,
      tenant: () => string = () => orgA.tenantId,
    ) =>
      runWithTenant(tenant(), () =>
        ctx.app.get(DispenseMedicationUseCase).execute(
          pharmacyA,
          {
            pharmacySiteId: pharmacySiteA,
            patientProfileId: patient,
            inventoryReservationId: reservationId,
            lines: [
              {
                inventoryLocationId: location,
                pharmacyProductId: productId,
                dispensedQuantity: qty,
              },
            ],
          } as any,
          admin,
        ),
      );
    const position = async (location: string, productId: string) =>
      (
        await sql(
          `select on_hand_quantity::float as on_hand, reserved_quantity::float as reserved,
                  available_quantity::float as available
             from pharmacy_inventory.inventory_stock_positions
            where inventory_location_id = ? and pharmacy_product_id = ?`,
          [location, productId],
        )
      )[0];

    beforeAll(async () => {
      admin = {
        id: TEST_ADMIN_ID,
        roles: ['SECURITY_ADMIN'],
        tenantIds: [orgA.tenantId],
      };
      patient = await createPatient(ctx, {
        name: 'Paciente sintético F5C',
        gender: 'FEMALE',
        birthDate: '1990-01-01',
      });
      // La relación paciente–farmacia es de otra regla (PINV-02) y tiene sus propias
      // pruebas; aquí el foco es la reserva, así que se la deja pasar.
      jest
        .spyOn(
          ctx.app.get(PharmacyInventoryScopePolicy),
          'requirePatientContext',
        )
        .mockResolvedValue(undefined);
      const wardSpace = await mkSpace(
        orgA,
        'SPACE_FN_NURSE_STATION',
        'Estación 2',
        {},
      );
      const unit = await activeUnit(orgA, `UN-R-${suffix}`);
      await sql(
        `update practice.care_spaces set clinical_unit_id = ? where id = ?`,
        [unit, wardSpace],
      );
      ward = (
        await create(owner(orgA), pharmacySiteA, {
          locationTypeCode: 'WARD_STOCK',
          clinicalUnitId: unit,
          careSpaceId: wardSpace,
        }).expect(201)
      ).body.id;
      product = await stock(pharmacyA, ward, { onHand: 10, reserved: 0 });
      other = await stock(pharmacyA, ward, { onHand: 10, reserved: 0 });
    });

    it('sin reserva, un botiquín sin disponible suficiente rechaza (409) y no toca el stock', async () => {
      const before = await position(ward, product);
      await expect(dispense(ward, product, 11)).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: 'INSUFFICIENT_AVAILABLE_STOCK',
        }),
      });
      expect(await position(ward, product)).toEqual(before);
    });

    it('un id de reserva cualquiera (inexistente o de otro tenant) no exime: 404 uniforme', async () => {
      const before = await position(ward, product);
      const missing = await dispense(ward, product, 1, randomUUID()).catch(
        (e) => e,
      );
      expect(missing.getStatus()).toBe(404);
      // una reserva de otra organización: se crea en B por SQL
      const foreignReservation = randomUUID();
      await sql(
        `insert into pharmacy_inventory.inventory_reservations
           (id, pharmacy_id, pharmacy_site_id, reservation_status_concept_id, expires_at, created_at, updated_at)
         values (?, ?, ?, ?, now() + interval '1 hour', now(), now())`,
        [
          foreignReservation,
          randomUUID(),
          pharmacySiteB,
          PINV.RESERVATION_CONFIRMED,
        ],
      ).catch(() => undefined);
      const foreign = await dispense(
        ward,
        product,
        1,
        foreignReservation,
      ).catch((e) => e);
      expect(foreign.getStatus()).toBe(404);
      expect(foreign.response.reason).toBe(missing.response.reason);
      expect(await position(ward, product)).toEqual(before);
    });

    it('reserva cancelada, consumida, de otro producto o con cantidad insuficiente: rechazada sin tocar el stock', async () => {
      const cancelled = await reserve(ward, product, 2);
      await sql(
        `update pharmacy_inventory.inventory_reservations set reservation_status_concept_id = ? where id = ?`,
        [PINV.RESERVATION_CANCELLED, cancelled],
      );
      const forOther = await reserve(ward, other, 2);
      const before = await position(ward, product);
      const rejected = await Promise.all([
        dispense(ward, product, 1, cancelled).catch((e) => e),
        dispense(ward, product, 1, forOther).catch((e) => e),
      ]);
      for (const failure of rejected) {
        expect(failure.getStatus()).toBe(409);
        expect(failure.response.reason).toBe('RESERVATION_NOT_APPLICABLE');
      }
      // el stock del producto reservado por la cancelada sigue como estaba
      expect(await position(ward, product)).toEqual(before);
    });

    it('una reserva válida dispensa hasta lo reservado y queda consumida: no se reutiliza', async () => {
      const id = await reserve(ward, product, 3);
      const before = await position(ward, product);
      await dispense(ward, product, 3, id);
      const after = await position(ward, product);
      expect(after.on_hand).toBe(before.on_hand - 3);
      expect(after.reserved).toBe(before.reserved - 3);
      const [res] = await sql(
        `select reservation_status_concept_id from pharmacy_inventory.inventory_reservations where id = ?`,
        [id],
      );
      expect(res.reservation_status_concept_id).toBe(
        PINV.RESERVATION_FULFILLED,
      );
      const reuse = await dispense(ward, product, 1, id).catch((e) => e);
      expect(reuse.response.reason).toBe('RESERVATION_NOT_APPLICABLE');
      expect(await position(ward, product)).toEqual(after);
    });

    it('carrera real: varias dispensas contra la misma reserva, una gana y las otras no consumen nada', async () => {
      const id = await reserve(ward, product, 4);
      const before = await position(ward, product);
      const results = await Promise.allSettled(
        Array.from({ length: 6 }, () => dispense(ward, product, 4, id)),
      );
      const won = results.filter((r) => r.status === 'fulfilled');
      const lost = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(5);
      for (const failure of lost) {
        expect(failure.reason.response.reason).toBe(
          'RESERVATION_NOT_APPLICABLE',
        );
      }
      const after = await position(ward, product);
      expect(after.on_hand).toBe(before.on_hand - 4);
      expect(after.reserved).toBe(before.reserved - 4);
      const [line] = await sql(
        `select fulfilled_quantity::float as fulfilled from pharmacy_inventory.inventory_reservation_lines
          where inventory_reservation_id = ?`,
        [id],
      );
      expect(line.fulfilled).toBe(4);
    });
  });
});
