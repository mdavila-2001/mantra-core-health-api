import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  registrarOrganizacion,
  sql,
  type InfraOrg,
  type Planta,
} from './infrastructure-fixture';

/**
 * F5c · botiquín por unidad contra la base real (CONTRATO-F2-F5 §F5c): alta
 * con espacio y unidad (404 entre tenants, 422 de sede y de perfil, 409 de
 * botiquín repetido), el stock bloquea el retiro del espacio y reubicar mueve
 * la ubicación sin tocar sus existencias.
 */
describe('Infraestructura F5c · integración', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let pharmacySite: string;
  const admin = () => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': orgA.tenantId,
  });

  const espacio = async (
    org: InfraOrg,
    siteId: string,
    code: string,
    functionCode: string,
    parentSpaceId?: string,
  ): Promise<string> =>
    (
      await http()
        .post(`/sites/${siteId}/care-spaces`)
        .set(como(org))
        .send({
          code,
          name: code,
          formCode: 'LOC_FORM_ROOM',
          functionCode,
          parentSpaceId,
          activate: true,
          areaM2: 12,
        })
        .expect(201)
    ).body.id;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F5CA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F5CB-${tag}`);
    planta = await armarPlanta(ctx, orgA, `F5C-${tag}`, 1);
    const pharmacy = randomUUID();
    pharmacySite = randomUUID();
    await q(
      `insert into pharmacy.pharmacies (id, tenant_id, code, legal_name, verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, 'Farmacia interna', ?, ?, now(), now())`,
      [
        pharmacy,
        orgA.tenantId,
        `FI-${tag}`,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.PHARMACY_ACTIVE,
      ],
    );
    await q(
      `insert into pharmacy.pharmacy_sites (id, pharmacy_id, practice_site_id, code, name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, 'Farmacia central', ?, now(), now())`,
      [pharmacySite, pharmacy, orgA.siteId, `FC-${tag}`, PHARM.SITE_ACTIVE],
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('F5c: alta de botiquín, reglas de espacio/unidad, stock bloquea retiro y reubicar lo mueve', async () => {
    const station = await espacio(
      orgA,
      orgA.siteId,
      `EST-${tag}`,
      'SPACE_FN_NURSE_STATION',
      planta.building,
    );
    const storage = await espacio(
      orgA,
      orgA.siteId,
      `DEP-${tag}`,
      'SPACE_FN_STORAGE',
      planta.building,
    );
    const ajeno = await espacio(
      orgB,
      orgB.siteId,
      `EXT-${tag}`,
      'SPACE_FN_NURSE_STATION',
    );
    const otraSede = (
      await http()
        .post(`/practices/${orgA.practiceId}/sites`)
        .set(como(orgA))
        .send({ code: `S2-${tag}`, name: 'Sede 2' })
        .expect(201)
    ).body.id;
    const lejano = await espacio(
      orgA,
      otraSede,
      `EST2-${tag}`,
      'SPACE_FN_NURSE_STATION',
    );
    const url = `/pharmacy/${pharmacySite}/inventory-locations`;
    const body = (extra: Record<string, unknown>) => ({
      code: `BOT-${randomUUID().slice(0, 6)}`,
      name: 'Botiquín',
      ...extra,
    });

    // Reglas: tenant (404), sede (422), perfil (422), unidad obligatoria (422).
    await http()
      .post(url)
      .set(admin())
      .send(body({ careSpaceId: ajeno }))
      .expect(404);
    const mismatch = await http()
      .post(url)
      .set(admin())
      .send(body({ careSpaceId: lejano }))
      .expect(422);
    expect(mismatch.body.reason).toBe('STOCK_POINT_SITE_MISMATCH');
    const notStock = await http()
      .post(url)
      .set(admin())
      .send(body({ careSpaceId: planta.beds[0] }))
      .expect(422);
    expect(notStock.body.reason).toBe('SPACE_NOT_STOCK_POINT');
    const noUnit = await http()
      .post(url)
      .set(admin())
      .send(body({ careSpaceId: station, locationTypeCode: 'WARD_STOCK' }))
      .expect(422);
    expect(noUnit.body.reason).toBe('WARD_STOCK_REQUIRES_UNIT');

    const created = await http()
      .post(url)
      .set(admin())
      .send(
        body({
          careSpaceId: station,
          clinicalUnitId: planta.unit,
          locationTypeCode: 'WARD_STOCK',
        }),
      )
      .expect(201);
    const loc = created.body.id;
    const dup = await http()
      .post(url)
      .set(admin())
      .send(
        body({
          careSpaceId: storage,
          clinicalUnitId: planta.unit,
          locationTypeCode: 'WARD_STOCK',
        }),
      )
      .expect(409);
    expect(dup.body.reason).toBe('WARD_STOCK_ALREADY_EXISTS');
    const [row] = await q(
      'select care_space_id, clinical_unit_id from pharmacy_inventory.inventory_locations where id = ?',
      [loc],
    );
    expect(row).toEqual({
      care_space_id: station,
      clinical_unit_id: planta.unit,
    });

    // Existencias en el botiquín: el retiro del espacio (y de su padre) queda bloqueado.
    const product = randomUUID();
    const [ph] = await q(
      'select pharmacy_id from pharmacy.pharmacy_sites where id = ?',
      [pharmacySite],
    );
    await q(
      `insert into pharmacy.pharmacy_products (id, pharmacy_id, product_code, generic_name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, 'Paracetamol', ?, now(), now())`,
      [product, ph.pharmacy_id, `PR-${tag}`, PHARM.PRODUCT_ACTIVE],
    );
    await q(
      `insert into pharmacy_inventory.inventory_stock_positions
         (id, inventory_location_id, pharmacy_product_id, on_hand_quantity, reserved_quantity,
          quarantine_quantity, available_quantity, last_ledger_sequence, updated_at)
       values (gen_random_uuid(), ?, ?, 5, 0, 0, 5, 0, now())`,
      [loc, product],
    );
    const check = await http()
      .get(`/care-spaces/${station}/retire-check`)
      .set(como(orgA))
      .expect(200);
    const inv = check.body.blockers.find(
      (b: any) => b.kind === 'INVENTORY_LOCATION',
    );
    expect(inv).toMatchObject({
      count: 1,
      sampleIds: [loc],
      nextAction: { label: 'Transferir el stock o reubicar el depósito' },
    });
    expect(check.body.unverifiable.map((u: any) => u.kind)).not.toContain(
      'INVENTORY_LOCATION',
    );
    const [sv] = await q(
      'select row_version from practice.care_spaces where id = ?',
      [station],
    );
    const retire = await http()
      .post(`/care-spaces/${station}/lifecycle`)
      .set(como(orgA))
      .set('If-Match', String(sv.row_version))
      .send({ action: 'retire', reason: 'obra en el piso' })
      .expect(409);
    expect(retire.body.reason).toBe('SPACE_RETIRE_BLOCKED');
    expect(retire.body.details.blockers.map((b: any) => b.kind)).toContain(
      'INVENTORY_LOCATION',
    );
    const building = await http()
      .get(`/care-spaces/${planta.building}/retire-check`)
      .set(como(orgA))
      .expect(200);
    expect(building.body.blockers.map((b: any) => b.kind)).toContain(
      'INVENTORY_LOCATION',
    );

    // Lectura de la pestaña «Stock»: enfermería de la sede sí; limpieza no.
    const nurse = await crearPersonal(
      ctx,
      orgA,
      `F5CN-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { unit: planta.unit },
    );
    const keeper = await crearPersonal(
      ctx,
      orgA,
      `F5CH-${tag}`,
      DELEG.ASSIGN_ROLE_HOUSEKEEPING,
      { site: orgA.siteId },
    );
    await http()
      .get(`/care-spaces/${station}/stock`)
      .set(como(keeper))
      .expect(403);
    await http()
      .get(`/care-spaces/${station}/stock`)
      .set(como(orgB))
      .expect(404);

    // Reubicar al depósito: 404 entre tenants, 422 fuera de sede, y el stock sigue a la ubicación.
    await http()
      .post(`/pharmacy/inventory-locations/${loc}/relocate`)
      .set(admin())
      .send({ careSpaceId: ajeno })
      .expect(404);
    await http()
      .post(`/pharmacy/inventory-locations/${loc}/relocate`)
      .set(admin())
      .send({ careSpaceId: lejano })
      .expect(422);
    const moved = await http()
      .post(`/pharmacy/inventory-locations/${loc}/relocate`)
      .set(admin())
      .send({ careSpaceId: storage })
      .expect(200);
    expect(moved.body).toMatchObject({
      careSpaceId: storage,
      previousCareSpaceId: station,
    });
    const after = await http()
      .get(`/care-spaces/${storage}/stock`)
      .set(como(orgA))
      .expect(200);
    expect(after.body.pharmacySites).toEqual([
      { id: pharmacySite, name: 'Farmacia central' },
    ]);
    expect(after.body.locations).toHaveLength(1);
    expect(after.body.locations[0]).toMatchObject({
      id: loc,
      locationType: { code: 'WARD_STOCK' },
      careSpace: { id: storage },
      clinicalUnit: { id: planta.unit },
      lines: [
        {
          productName: 'Paracetamol',
          onHandQuantity: expect.stringMatching(/^5/),
          availableQuantity: expect.stringMatching(/^5/),
        },
      ],
    });
    const empty = await http()
      .get(`/care-spaces/${station}/stock`)
      .set(como(orgA))
      .expect(200);
    expect(empty.body.locations).toEqual([]);
    const positions = await q(
      'select count(*)::int as n from pharmacy_inventory.inventory_stock_positions where inventory_location_id = ?',
      [loc],
    );
    expect(positions[0].n).toBe(1);
    const events = await q(
      `select event_type from messaging.domain_events where aggregate_id = ? order by occurred_at`,
      [loc],
    );
    expect(events.map((e: any) => e.event_type)).toEqual([
      'pharmacy_inventory.location.located',
      'pharmacy_inventory.location.relocated',
    ]);
    // Enfermería de la unidad dueña de las camas: el depósito no es de su unidad → 403.
    const nurseRead = await http()
      .get(`/care-spaces/${storage}/stock`)
      .set(como(nurse));
    expect([403, 404]).toContain(nurseRead.status);
  });
});
