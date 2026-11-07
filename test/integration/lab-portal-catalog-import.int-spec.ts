import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { TokenService } from '../../src/common';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import {
  bearer,
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';

interface CatalogItem {
  conceptId: string;
  code: string;
  name: string;
  sampleType: string;
  offeredServiceId: string | null;
  components: {
    conceptId: string;
    code: string;
    suggestedPrice: unknown;
  }[];
}

/**
 * «Agregar del catálogo» of the lab portal against the real app and Postgres
 * (with `yarn catalog:studies:load` applied): read the catalog, import the
 * análisis a lab picks, read it back. Synthetic data (`@example.test`).
 */
describe('Portal del laboratorio · agregar del catálogo (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  let headers: Record<string, string>;

  const catalog = async (): Promise<CatalogItem[]> =>
    (
      (await http().get('/diagnostics/lab/catalog').set(headers).expect(200))
        .body.sections as { items: CatalogItem[] }[]
    ).flatMap((s) => s.items);

  async function byCode(target: string): Promise<Map<string, string>> {
    const res = await http()
      .get('/system-context/dynamic-enums')
      .query({ target })
      .expect(200);
    return new Map(
      (res.body.options as { code: string; conceptId: string }[]).map((o) => [
        o.code,
        o.conceptId,
      ]),
    );
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const [types, modalities, countries, jurisdictions] = await Promise.all([
      byCode(
        'diagnostic_units.diagnostic_units.diagnostic_unit_type_concept_id',
      ),
      byCode('diagnostic_units.diagnostic_study_offerings.modality_concept_id'),
      byCode('directory.tenants.country_concept_id'),
      byCode('profiles.jurisdiction_authorizations.jurisdiction_concept_id'),
    ]);
    const legalName = `Laboratorio Catálogo ${marca} S.R.L.`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LAB-${Date.now() % 1_000_000}${marca}`.slice(0, 60),
          legalName,
          legalEntityType: 'UNIPERSONAL',
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: countries.get('BO'),
          jurisdictionConceptId: jurisdictions.get('JURISDICTION_NATIONAL'),
          diagnosticUnit: {
            name: legalName,
            diagnosticUnitTypeConceptId: types.get('DU_TYPE_LAB'),
            modalityConceptIds: [modalities.get('DU_MODALITY_LAB')],
            primarySite: {
              name: 'Casa central',
              address: {
                lines: ['Av. Cañoto 456'],
                latitude: -17.7833,
                longitude: -63.1821,
              },
            },
            branches: [],
          },
          legalRepresentative: {
            fullName: 'Lucía Vargas Antelo',
            email: `catalogo-rep-${marca}@example.test`,
            idNumber: '7654321 SC',
          },
        },
        owner: {
          email: `catalogo-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          displayName: 'Lucía Vargas Antelo',
        },
      })
      .expect(201);
    const tenantId = res.body.tenantId as string;
    creados.push({ userId: res.body.ownerUserId, tenantId });
    const sid = `catalogo-${res.body.ownerUserId}`;
    await ensureTestSession(ctx.orm, res.body.ownerUserId, sid);
    const jwt = ctx.app
      .get(TokenService)
      .signAccessToken(res.body.ownerUserId, sid, ['USER'], [tenantId]);
    headers = { ...bearer(jwt), 'X-Tenant-Id': tenantId };
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  const importIds = (conceptIds: string[], skipComponentIds?: string[]) =>
    http()
      .post('/diagnostics/lab/catalog/import')
      .set(headers)
      .send({ conceptIds, skipComponentIds });

  it('agrega los análisis que la persona tildó aunque su id no sea un UUID RFC-4122', async () => {
    const all = await catalog();
    const wanted = [
      /^1,25-dihidroxivitamina D/i,
      /^17-hidroxiprogesterona/i,
      /^Acetilcolinesterasa eritrocitaria/i,
      /^Ácido fólico sérico/i,
    ].map((name) => all.find((i) => name.test(i.name)));
    expect(wanted.every((i) => i !== undefined)).toBe(true);
    const ids = wanted.map((i) => i!.conceptId);
    // The loader's md5 ids carry no version/variant bits: `@IsUUID('all')` answered 400.
    expect(ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5]/i.test(id))).toBe(
      true,
    );

    const res = await importIds(ids);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ created: 4, rejected: 0 });

    const after = await catalog();
    for (const id of ids) {
      expect(after.find((i) => i.conceptId === id)?.offeredServiceId).toEqual(
        expect.any(String),
      );
    }
  });

  it('no crea el servicio de un componente destildado y sí el de los demás', async () => {
    const hemograma = (await catalog()).find((i) => i.code === 'HEMOGRAMA')!;
    expect(hemograma.components.length).toBeGreaterThan(2);
    // Drop one that has a suggested price: it would otherwise be listed as active.
    const dropped = hemograma.components.find((c) => c.suggestedPrice)!;
    const kept = hemograma.components.filter((c) => c !== dropped);

    const res = await importIds([hemograma.conceptId], [dropped.conceptId]);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ created: 1, rejected: 0 });

    const services = (
      await http().get('/diagnostics/lab/services').set(headers).expect(200)
    ).body.items as { code: string }[];
    const codes = services.map((s) => s.code);
    expect(codes).toContain('HEMOGRAMA');
    expect(codes).not.toContain(dropped.code);
    for (const part of kept) expect(codes).toContain(part.code);

    // The unit's page (the study cards a doctor reads) lists the ticked ones only.
    // Fixture precondition: a published page needs a verified unit.
    const connection = ctx.orm.em.getConnection();
    const [unit] = await connection.execute<{ id: string }[]>(
      `select id from diagnostic_units.diagnostic_units where tenant_id = ?`,
      [headers['X-Tenant-Id']],
    );
    await connection.execute(
      `update diagnostic_units.diagnostic_units set verification_status_concept_id = ? where id = ?`,
      [DUNIT.VERIFICATION_VERIFIED, unit.id],
    );
    const page = await http()
      .get(`/diagnostic-units/${unit.id}`)
      .set(headers)
      .expect(200);
    const listed = (page.body.studies as { code: string }[]).map((s) => s.code);
    expect(listed).toContain('HEMOGRAMA');
    expect(listed).not.toContain(dropped.code);
    // A component without a suggested price waits as a draft until the lab prices it.
    for (const part of kept.filter((c) => c.suggestedPrice))
      expect(listed).toContain(part.code);
  });

  it('rechaza con 400 un id que no tiene forma de UUID', async () => {
    const res = await importIds(['no-es-un-uuid']);
    expect(res.status).toBe(400);
  });

  it('agrega todo el catálogo de una vez, sin rechazos', async () => {
    const all = await catalog();
    const res = await importIds(all.map((i) => i.conceptId));
    expect(res.status).toBe(200);
    expect(res.body.rejected).toBe(0);
    expect(res.body.created + res.body.skipped + res.body.linked).toBe(
      all.length,
    );
    const after = await catalog();
    expect(after.every((i) => i.offeredServiceId !== null)).toBe(true);
  });
});
