import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';
import { TokenService } from '../../src/common';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { DiagnosticStudyPrices } from '../../src/modules/diagnostic_units/entities';

/**
 * Portal «Precios» de un centro de imagenología contra la API real, de punta
 * a punta: alta con modalidades → catálogo → primer precio (crea el
 * tarifario) → segundo precio (versión nueva) → relectura.
 *
 * Es el recorrido que la pantalla del front hace con `GET/POST/PATCH
 * /diagnostics/lab/services`. Datos sintéticos (`@example.test`) con sufijo
 * aleatorio por corrida; la organización se borra al final.
 */
describe('Portal «Precios» · centro de imagen contra la API real (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  let token: Record<string, string>;
  let tenantId: string;

  async function porCodigo(target: string): Promise<Map<string, string>> {
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

  function concepto(mapa: Map<string, string>, codigo: string): string {
    const id = mapa.get(codigo);
    if (id === undefined) throw new Error(`El catálogo no publica ${codigo}`);
    return id;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const [tipos, modalidades, paises, jurisdicciones] = await Promise.all([
      porCodigo(
        'diagnostic_units.diagnostic_units.diagnostic_unit_type_concept_id',
      ),
      porCodigo(
        'diagnostic_units.diagnostic_study_offerings.modality_concept_id',
      ),
      porCodigo('directory.tenants.country_concept_id'),
      porCodigo('profiles.jurisdiction_authorizations.jurisdiction_concept_id'),
    ]);
    const nit = `${Date.now() % 1_000_000}`;
    const legalName = `Imágenes ${marca} S.R.L.`;
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG-${nit}${marca}`.slice(0, 60),
          legalName,
          legalEntityType: 'UNIPERSONAL',
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: concepto(paises, 'BO'),
          jurisdictionConceptId: concepto(
            jurisdicciones,
            'JURISDICTION_NATIONAL',
          ),
          diagnosticUnit: {
            name: legalName,
            diagnosticUnitTypeConceptId: concepto(tipos, 'DU_TYPE_IMAGING'),
            modalityConceptIds: [
              concepto(modalidades, 'DU_MODALITY_XRAY'),
              concepto(modalidades, 'DU_MODALITY_MRI'),
            ],
            primarySite: {
              name: 'Casa central',
              address: {
                lines: ['Av. Banzer 1200'],
                latitude: -17.76,
                longitude: -63.18,
              },
            },
            branches: [],
          },
          legalRepresentative: {
            fullName: 'Lucía Vargas Antelo',
            email: `precios-rep-${marca}@example.test`,
            idNumber: '7654321 SC',
          },
        },
        owner: {
          email: `precios-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          displayName: 'Lucía Vargas Antelo',
        },
      })
      .expect(201);
    tenantId = alta.body.tenantId;
    creados.push({ userId: alta.body.ownerUserId, tenantId });
    const sid = `precios-${alta.body.ownerUserId}`;
    await ensureTestSession(ctx.orm, alta.body.ownerUserId, sid);
    const jwt = ctx.app
      .get(TokenService)
      .signAccessToken(alta.body.ownerUserId, sid, ['USER'], [tenantId]);
    token = { ...bearer(jwt), 'X-Tenant-Id': tenantId };
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  const listar = async () =>
    (await http().get('/diagnostics/lab/services').set(token).expect(200)).body
      .items as {
      id: string;
      code: string;
      kind: string;
      price: string | null;
      alovidaPrice: string | null;
    }[];

  it('el alta deja las modalidades como marcadores sin precio, no como servicios a 0.00', async () => {
    const items = await listar();
    expect(items.map((s) => [s.code, s.kind, s.price, s.alovidaPrice])).toEqual(
      expect.arrayContaining([
        ['MODALITY_XRAY', 'MODALITY', null, null],
        ['MODALITY_MRI', 'MODALITY', null, null],
      ]),
    );
    expect(items.filter((s) => s.kind === 'SERVICE')).toHaveLength(0);
  });

  it('ponerle precio a una modalidad se rechaza con 422 y un motivo que dice qué hacer', async () => {
    const xray = (await listar()).find((s) => s.code === 'MODALITY_XRAY')!;
    const res = await http()
      .patch(`/diagnostics/lab/services/${xray.id}`)
      .set(token)
      .send({ price: '120.00', alovidaDiscountPercent: null })
      .expect(422);
    expect(res.body.message).toContain('estudios concretos');
  });

  it('un estudio concreto: alta con precio, segundo precio como versión nueva, y la relectura lo confirma', async () => {
    const creado = await http()
      .post('/diagnostics/lab/services')
      .set(token)
      .send({
        code: 'RX-TORAX',
        name: 'Radiografía de tórax',
        price: '120',
        alovidaDiscountPercent: 10,
      })
      .expect(201);
    expect(creado.body).toMatchObject({
      kind: 'SERVICE',
      price: '120.00',
      alovidaPrice: '108.00',
    });

    await http()
      .patch(`/diagnostics/lab/services/${creado.body.id}`)
      .set(token)
      .send({ price: '150.00', alovidaDiscountPercent: 20 })
      .expect(200);

    const releido = (await listar()).find((s) => s.code === 'RX-TORAX')!;
    expect(releido).toMatchObject({ price: '150.00', alovidaPrice: '120.00' });

    const versiones = await ctx.orm.em.fork().find(DiagnosticStudyPrices, {
      diagnosticStudyOfferingId: creado.body.id,
    });
    expect(
      versiones.map((v) => [v.versionNumber, v.statusConceptId]).sort(),
    ).toEqual([
      [1, DUNIT.PRICE_SUPERSEDED],
      [2, DUNIT.PRICE_ACTIVE],
    ]);
  });

  it('otra organización no ve ni toca el catálogo: 404 sin unidad propia', async () => {
    const ajena = await http()
      .get('/diagnostics/lab/services')
      .set({ ...token, 'X-Tenant-Id': randomUUID() })
      .expect(403);
    expect(ajena.body.message).toEqual(expect.any(String));
  });
});
