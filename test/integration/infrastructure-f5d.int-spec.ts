import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { CONCEPTS } from '../../src/common';
import {
  como,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
} from './infrastructure-fixture';

/**
 * F5d · agenda por consultorio contra la base real (CONTRATO-F2-F5 §F5d):
 * la plantilla acepta careSpaceId (404 entre tenants, 422 de función), dos
 * plantillas que ocupan el mismo consultorio a la misma hora → 422, el
 * EXCLUDE ex_appointments_care_space_time rechaza la segunda cita solapada
 * (23P01) y la cita directa en la franja hereda el consultorio.
 */
describe('Infraestructura F5d · agenda por consultorio', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  const admin = () => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': orgA.tenantId,
  });
  const sala = async (org: InfraOrg, code: string, functionCode: string) =>
    (
      await http()
        .post(`/sites/${org.siteId}/care-spaces`)
        .set(como(org))
        .send({
          code,
          name: code,
          formCode: 'LOC_FORM_ROOM',
          functionCode,
          activate: true,
          areaM2: 12,
        })
        .expect(201)
    ).body.id as string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F5DA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F5DB-${tag}`);
  });

  const creadas: string[] = [];
  afterAll(async () => {
    // Retira las plantillas publicadas: el próximo corrido elige profesionales
    // sin agenda publicada y el solape entre agendas propias no lo bloquea.
    for (const id of creadas)
      await http().delete(`/scheduling/templates/${id}`).set(admin());
    await ctx.app.close();
  });

  it('F5d: consultorio en la plantilla, solape entre agendas, EXCLUDE y cita que hereda el consultorio', async () => {
    const consultorio = await sala(
      orgA,
      `CON-${tag}`,
      'SPACE_FN_CONSULTING_ROOM',
    );
    const oficina = await sala(orgA, `OFI-${tag}`, 'SPACE_FN_OFFICE_ADMIN');
    const ajeno = await sala(orgB, `CONB-${tag}`, 'SPACE_FN_CONSULTING_ROOM');
    const docs = await q<{ profile_id: string }>(
      `select p.profile_id from profiles.health_practitioner_profiles p
        where not exists (select 1 from scheduling.schedulable_resources r
                            join scheduling.schedule_templates t on t.resource_id = r.id
                           where r.resource_ref_id = p.profile_id and t.status_concept_id = ?)
        order by random() limit 2`,
      [CONCEPTS.TEMPLATE_PUBLISHED],
    );
    const recurso = async (hpid: string, n: string) =>
      (
        await http()
          .post('/scheduling/resources')
          .set(admin())
          .send({
            tenantId: orgA.tenantId,
            practiceId: orgA.practiceId,
            resourceType: 'PRACTITIONER',
            resourceRefType: 'health_practitioner_profiles',
            resourceRefId: hpid,
            name: `Agenda ${n} ${tag}`,
            timeZone: 'America/La_Paz',
            capacity: 1,
          })
          .expect(201)
      ).body.id as string;
    const r1 = await recurso(docs[0].profile_id, '1');
    const r2 = await recurso(docs[1].profile_id, '2');
    const plantilla = (
      resourceId: string,
      careSpaceId: string,
      start: string,
      end: string,
    ) =>
      http()
        .post(`/scheduling/resources/${resourceId}/templates`)
        .set(admin())
        .send({
          name: `Tarde ${randomUUID().slice(0, 4)}`,
          slotMinutes: 30,
          careSpaceId,
          rules: [
            {
              dayOfWeek: 1,
              startTime: start,
              endTime: end,
              slotMinutes: 30,
              capacityPerSlot: 1,
            },
          ],
        });

    await plantilla(r1, ajeno, '14:00:00', '15:00:00').expect(404);
    const fn = await plantilla(r1, oficina, '14:00:00', '15:00:00').expect(422);
    expect(fn.body.reason).toBe('TEMPLATE_CARE_SPACE_INVALID_FUNCTION');
    const t1 = await plantilla(r1, consultorio, '14:00:00', '15:00:00').expect(
      201,
    );
    expect(t1.body.careSpaceId).toBe(consultorio);
    creadas.push(t1.body.id);
    const choque = await plantilla(
      r2,
      consultorio,
      '14:30:00',
      '15:30:00',
    ).expect(422);
    expect(choque.body.reason).toBe('TEMPLATE_RULE_OVERLAP_CARE_SPACE');
    const t2 = await plantilla(r2, consultorio, '15:00:00', '16:00:00').expect(
      201,
    );
    creadas.push(t2.body.id);
    const [tpl] = await q(
      'select care_space_id from scheduling.schedule_templates where id = ?',
      [t1.body.id],
    );
    expect(tpl.care_space_id).toBe(consultorio);
    const ev = await q(
      `select count(*)::int as n from messaging.domain_events where event_type = 'scheduling.template.care_space_set' and aggregate_id = ?`,
      [t1.body.id],
    );
    expect(ev[0].n).toBe(1);

    // EXCLUDE: dos citas del mismo consultorio que se solapan → 23P01.
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    const p = (await registrarPaciente(ctx, orgA, `PD${tag}`, campos))
      .patientProfileId;
    const lunes = new Date();
    lunes.setUTCDate(
      lunes.getUTCDate() +
        ((8 - lunes.getUTCDay()) % 7 || 7) +
        7 * (3 + Math.floor(Math.random() * 150)),
    );
    const dia = lunes.toISOString().slice(0, 10);
    const cita = (start: string, end: string) =>
      q(
        `insert into clinical.appointments (id, patient_profile_id, tenant_id, status_concept_id, start_at, end_at, care_space_id, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now(), now())`,
        [p, orgA.tenantId, CLIN.APPOINTMENT_BOOKED, start, end, consultorio],
      );
    await cita(`${dia}T18:00:00Z`, `${dia}T18:30:00Z`);
    const err = await cita(`${dia}T18:15:00Z`, `${dia}T18:45:00Z`).catch(
      (e) => e,
    );
    expect(String(err?.code ?? err?.cause?.code ?? err)).toContain('23P01');

    // La cita directa dentro de la franja hereda el consultorio: a las 14:00
    // (18:00Z) choca con la cita ya insertada → 409 CARE_SPACE_DOUBLE_BOOKED
    // aunque sea otra agenda; a las 14:30 entra y lleva el consultorio.
    const directa = (hora: string) =>
      http()
        .post('/scheduling/appointments/direct')
        .set(admin())
        .send({
          patientProfileId: p,
          resourceId: r1,
          startAt: `${dia}T${hora}:00-04:00`,
          durationMinutes: 30,
          reasonText: 'Control F5d',
        });
    const doble = await directa('14:00').expect(409);
    expect(doble.body.reason).toBe('CARE_SPACE_DOUBLE_BOOKED');
    const ok = await directa('14:30').expect(201);
    const [row] = await q(
      `select a.care_space_id from scheduling.appointment_bookings b
         join clinical.appointments a on a.id = b.appointment_id where b.id = ?`,
      [ok.body.bookingId],
    );
    expect(row.care_space_id).toBe(consultorio);
    const lectura = await http()
      .get(`/scheduling/bookings/${ok.body.bookingId}`)
      .set(admin())
      .expect(200);
    expect(lectura.body.careSpace).toMatchObject({
      id: consultorio,
      code: `CON-${tag}`,
    });
  });
});
