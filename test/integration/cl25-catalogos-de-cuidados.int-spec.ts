import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import { CHART } from '../../src/modules/chart/chart.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * CL-25 · los tres selectores del plan de cuidados y los documentos, más los
 * nueve SEDES, publicados por `GET /system-context/dynamic-enums`.
 *
 * Los tres enums de cuidados/documentos los declara la API en
 * `dynamic-enum-catalog.ts` con los mismos ids de concepto que el paquete de
 * seeds del modelo (v4.2.30). El paquete también define `VS_CARE_PLAN_*` y
 * `VS_DOCUMENT_CATEGORY`, pero con el estado genérico `ACTIVE` y no con el
 * `ENUM_DEF_ACTIVE`/`ENUM_BIND_ACTIVE` que este endpoint filtra: contra una base
 * con el paquete y sin la declaración de la API, el endpoint respondía 404
 * (verificado). Esta prueba corre igual con o sin el paquete cargado.
 */
describe('CL-25 · catálogos de cuidados y jurisdicciones publicados', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  }, 300_000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  const opciones = async (target: string): Promise<string[]> => {
    const res = await http()
      .get('/system-context/dynamic-enums')
      .query({ target })
      .expect(200);
    return res.body.options.map((o: { conceptId: string }) => o.conceptId);
  };

  it('la intención del plan publica las 4 opciones, con los ids que la API usa', async () => {
    const ids = await opciones('chart.care_plans.intent_concept_id');
    expect(ids).toHaveLength(4);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_PLAN);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_PROPOSAL);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_ORDER);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_OPTION);
  });

  it('la clase de actividad publica las 6 opciones', async () => {
    const ids = await opciones(
      'chart.care_plan_activities.activity_concept_id',
    );
    expect(ids).toHaveLength(6);
    expect(ids).toContain(CHART.ACTIVITY_DEFAULT);
    expect(ids).toContain(CHART.ACTIVITY_CLASS_REFERRAL);
  });

  it('la categoría documental publica las 7 opciones', async () => {
    const ids = await opciones('chart.document_records.category_concept_id');
    expect(ids).toHaveLength(7);
    expect(ids).toContain(CHART.DOC_CATEGORY_GENERAL);
    expect(ids).toContain(CHART.DOC_CATEGORY_DISCHARGE);
  });

  it('la jurisdicción publica la nacional y los 9 SEDES', async () => {
    const ids = await opciones(
      'profiles.jurisdiction_authorizations.jurisdiction_concept_id',
    );
    expect(ids).toHaveLength(10);
    expect(ids).toContain(PROF.JURISDICTION_NATIONAL);
    expect(ids).toContain(PROF.JURISDICTION_SEDES_SANTA_CRUZ);
    expect(ids).toContain(PROF.JURISDICTION_SEDES_PANDO);
  });
});
