import { bootstrapTestApp, type TestContext } from './harness';
import { SeedBootstrapService } from '../../src/common/seed/seed-bootstrap.service';
import { ClinicalFormsSeedService } from '../../src/common/seed/clinical-forms-seed.service';
import { STANDARD_FORMS } from '../../src/common/seed/data/clinical-forms/catalog';
import { deterministicId } from '../../src/common/constants/concepts';

/**
 * Siembra de formularios clínicos estándar · idempotencia contra PostgreSQL real.
 *
 * Un segundo arranque de la app sobre la misma base fallaba en
 * `ClinicalFormsSeedService` con `pk_dynamic_field_sections` duplicada, y eso
 * obligaba a re-clonar la base entre corridas de integración. Aquí el arnés ya
 * arrancó una vez (primera siembra completa) y se vuelve a correr la cadena de
 * siembra entera, como haría un segundo arranque: no puede fallar ningún paso,
 * el seed de formularios no puede crear nada y las filas de secciones,
 * plantillas, campos y asignaciones tienen que quedar idénticas.
 */
describe('ClinicalFormsSeedService · segunda corrida sobre la misma base (DB real)', () => {
  let ctx: TestContext;

  const count = async (table: string): Promise<number> => {
    const rows = await ctx.orm.em
      .fork()
      .getConnection()
      .execute<{ n: string }[]>(`select count(*)::text as n from ${table}`);
    return Number(rows[0]?.n ?? 0);
  };

  const snapshot = async (): Promise<Record<string, number>> => ({
    sections: await count('forms.dynamic_field_sections'),
    templates: await count('chart.specialty_chart_templates'),
    fields: await count('forms.dynamic_field_definitions'),
    assignments: await count('forms.field_assignments'),
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('la cadena de siembra completa corre otra vez sin pasos fallidos ni filas nuevas', async () => {
    const before = await snapshot();

    const summary = await ctx.app.get(SeedBootstrapService).run();

    expect(
      summary.steps.filter((step) => step.failed).map((step) => step.name),
    ).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });

  it('el seed de formularios no crea plantillas ni especialidades en la segunda corrida', async () => {
    const before = await snapshot();

    const second = await ctx.app.get(ClinicalFormsSeedService).run();

    expect(second).toEqual({ templates: 0, specialties: 0 });
    expect(await snapshot()).toEqual(before);
  });

  it('retoma una corrida cortada entre la sección y la plantilla sin duplicar la sección', async () => {
    // Una corrida interrumpida (proceso muerto por timeout, caída de la base)
    // puede dejar la sección de un formulario ya escrita y su plantilla no.
    // Es el estado que hacía fallar el arranque siguiente con
    // `pk_dynamic_field_sections`: la plantilla faltaba, el seed volvía a crear
    // la sección con el mismo id determinista y la base la rechazaba.
    const form = STANDARD_FORMS[0];
    const templateId = deterministicId(`clinical-forms:template:${form.code}`);
    const sectionId = deterministicId(`clinical-forms:section:${form.code}`);
    const conn = ctx.orm.em.fork().getConnection();
    await conn.execute(
      'delete from chart.specialty_chart_templates where id = ?',
      [templateId],
    );
    const before = await snapshot();

    const resumed = await ctx.app.get(ClinicalFormsSeedService).run();

    expect(resumed.templates).toBe(1);
    const rows = await conn.execute<{ section_id: string }[]>(
      'select section_id from chart.specialty_chart_templates where id = ?',
      [templateId],
    );
    expect(rows).toEqual([{ section_id: sectionId }]);
    expect(await snapshot()).toEqual({
      ...before,
      templates: before.templates + 1,
    });
  });
});
