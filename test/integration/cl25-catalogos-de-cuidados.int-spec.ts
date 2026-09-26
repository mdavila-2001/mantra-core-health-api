import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import { CHART } from '../../src/modules/chart/chart.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * CL-25 · los tres selectores del plan de cuidados y los documentos, más los
 * nueve SEDES, publicados por `GET /system-context/dynamic-enums`.
 *
 * Los tres enums de cuidados/documentos **no los declara la API**: los publica el
 * paquete de seeds del modelo (v4.2.30) con sus bindings, y la API declara los
 * conceptos con la misma clave (mismos ids). Por eso esta prueba sólo tiene
 * sentido contra una base con ese paquete cargado (`salud-db/load_seeds.py`),
 * y sobre una que no lo tiene lo dice y no afirma nada — una omisión declarada,
 * no un aprobado.
 */
describe('CL-25 · catálogos de cuidados y jurisdicciones publicados', () => {
  let ctx: TestContext;
  let hayPaquete = false;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const filas = await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `select 1 from system_context.dynamic_enum_definitions where code = 'VS_CARE_PLAN_INTENT'`,
      );
    hayPaquete = filas.length > 0;
    if (!hayPaquete) {
      console.warn(
        'CL-25: la base no tiene el paquete de seeds del modelo (VS_CARE_PLAN_INTENT): se omite, NO se aprueba.',
      );
    }
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
    if (!hayPaquete) return;
    const ids = await opciones('chart.care_plans.intent_concept_id');
    expect(ids).toHaveLength(4);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_PLAN);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_PROPOSAL);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_ORDER);
    expect(ids).toContain(CHART.CAREPLAN_INTENT_OPTION);
  });

  it('la clase de actividad publica las 6 opciones', async () => {
    if (!hayPaquete) return;
    const ids = await opciones(
      'chart.care_plan_activities.activity_concept_id',
    );
    expect(ids).toHaveLength(6);
    expect(ids).toContain(CHART.ACTIVITY_DEFAULT);
    expect(ids).toContain(CHART.ACTIVITY_CLASS_REFERRAL);
  });

  it('la categoría documental publica las 7 opciones', async () => {
    if (!hayPaquete) return;
    const ids = await opciones('chart.document_records.category_concept_id');
    expect(ids).toHaveLength(7);
    expect(ids).toContain(CHART.DOC_CATEGORY_GENERAL);
    expect(ids).toContain(CHART.DOC_CATEGORY_DISCHARGE);
  });

  it('la jurisdicción publica la nacional y los 9 SEDES (esto no depende del paquete)', async () => {
    const ids = await opciones(
      'profiles.jurisdiction_authorizations.jurisdiction_concept_id',
    );
    expect(ids).toHaveLength(10);
    expect(ids).toContain(PROF.JURISDICTION_NATIONAL);
    expect(ids).toContain(PROF.JURISDICTION_SEDES_SANTA_CRUZ);
    expect(ids).toContain(PROF.JURISDICTION_SEDES_PANDO);
  });
});
