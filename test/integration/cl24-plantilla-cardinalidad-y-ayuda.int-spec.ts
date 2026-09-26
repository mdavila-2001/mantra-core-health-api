import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS, SEED } from '../../src/common';

/**
 * CL-24 · la plantilla de especialidad expone, por cada campo, su cardinalidad
 * y su texto de ayuda: lo que el modelo ya tiene (`cardinality_min/max` en
 * `forms.dynamic_field_definitions`, `help_text` en
 * `forms.field_definition_localizations`), leído contra la base real.
 */
describe('CL-24 · cardinalidad y ayuda de los campos de una plantilla', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sql = (text: string, params: unknown[] = []) =>
    ctx.orm.em.fork().getConnection().execute(text, params);

  const AYUDA = `Ayuda CL-24 ${randomUUID().slice(0, 8)}`;
  let templateId = '';
  let fieldId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // Una plantilla sembrada con al menos un campo propio del estándar.
    const [fila] = await sql(
      `select t.id as template_id, a.field_id
         from chart.specialty_chart_templates t
         join forms.field_assignments a on a.section_id = t.section_id
         join forms.dynamic_field_definitions f on f.id = a.field_id
        where t.tenant_id is null and t.section_id is not null
          and f.code not like '%catalog%'
        order by t.id, a.id
        limit 1`,
    );
    templateId = fila.template_id;
    fieldId = fila.field_id;

    await sql(
      `update forms.dynamic_field_definitions
          set cardinality_min = 1, cardinality_max = 3 where id = ?`,
      [fieldId],
    );
    await sql(
      `delete from forms.field_definition_localizations
        where field_id = ? and language_concept_id = ?`,
      [fieldId, CONCEPTS.LANG_ES],
    );
    await sql(
      `insert into forms.field_definition_localizations
         (id, field_id, language_concept_id, label, help_text, created_at, updated_at)
       values (?, ?, ?, 'Etiqueta', ?, now(), now())`,
      [randomUUID(), fieldId, CONCEPTS.LANG_ES, AYUDA],
    );
  }, 300_000);

  afterAll(async () => {
    await sql(
      `update forms.dynamic_field_definitions
          set cardinality_min = null, cardinality_max = null where id = ?`,
      [fieldId],
    );
    await sql(
      `delete from forms.field_definition_localizations where field_id = ? and help_text = ?`,
      [fieldId, AYUDA],
    );
    await ctx?.app.close();
  });

  it('el campo trae su cardinalidad y su ayuda en español', async () => {
    const res = await http()
      .get(`/charts/templates/${templateId}`)
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    const campo = res.body.fields.find(
      (f: { fieldId: string }) => f.fieldId === fieldId,
    );
    expect(campo).toMatchObject({
      cardinalityMin: 1,
      cardinalityMax: 3,
      helpText: AYUDA,
    });
  });

  it('un campo sin ayuda ni cardinalidad no las inventa', async () => {
    const res = await http()
      .get(`/charts/templates/${templateId}`)
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    const otros = res.body.fields.filter(
      (f: { fieldId: string }) => f.fieldId !== fieldId,
    );
    for (const campo of otros) {
      expect(campo.helpText).toBeUndefined();
    }
  });
});
