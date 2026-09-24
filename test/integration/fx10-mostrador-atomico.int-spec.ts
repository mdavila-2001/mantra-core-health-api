import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AUTHZ } from '../../src/modules/authz/authz.concepts';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * FX-10 · el turno de mostrador (AC-3.3) es una sola transacción, de verdad.
 *
 * ## Qué se está protegiendo
 *
 * `POST /scheduling/appointments/walk-in` cruza tres módulos —persona,
 * reserva, encuentro— en un único `em.transactional`. Una prueba unitaria con
 * el `EntityManager` simulado no puede probar que eso es cierto: el doble
 * hace `flush` sin escribir nada, así que un rollback a medio camino pasaría
 * cualquier aserto sobre llamadas. Lo que importa acá son las FILAS, contra
 * Postgres de verdad:
 *
 * - El camino feliz deja exactamente una fila en cada tabla que la
 *   transacción toca, con los estados con los que el DoD dice que nace.
 * - El camino que choca (AC-14-10, mismo horario del profesional) no deja
 *   NINGUNA fila — ni siquiera la persona que se estaba registrando. Un
 *   rollback parcial dejaría un paciente huérfano sin cita, que es peor que
 *   rechazar el alta entera.
 */
describe('FX-10 · el mostrador atómico (AC-3.3)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx10-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };

  const medicoAjeno = {
    email: `fx10-med-ajeno-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };

  let resourceId = '';
  let foreignResourceId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un lunes lejano: la agenda de esta suite no se cruza con la de otra. */
  function lunesLejano(semanas: number): Date {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + semanas * 7);
    return d;
  }

  function walkInBody(nationalId: string, cuando: Date) {
    return {
      patient: {
        name: 'Paciente',
        lastName: 'De Mostrador',
        nationalId,
        phone: '+591 70000001',
      },
      resourceId,
      startAt: cuando.toISOString(),
      durationMinutes: 30,
      reasonText: 'Atención de mostrador',
    };
  }

  async function contarIdentificador(nationalId: string): Promise<number> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from common.identifiers where value = ?`,
        [nationalId],
      );
    return Number(filas[0]?.n ?? '0');
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const roleRows = await ctx.orm.em.getConnection().execute<
      {
        code: string;
        base_role_concept_id: string;
        scope_concept_id: string;
        is_system: boolean;
        is_assignable: boolean;
      }[]
    >(
      `select code, base_role_concept_id, scope_concept_id,
              is_system, is_assignable
         from authz.roles
        where code in ('SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
        order by code`,
    );
    expect(roleRows).toEqual([
      {
        code: 'SCHEDULING_ADMIN',
        base_role_concept_id: AUTHZ.BASE_ROLE_ADMIN,
        scope_concept_id: AUTHZ.SCOPE_TENANT,
        is_system: true,
        is_assignable: true,
      },
      {
        code: 'SCHEDULING_AGENT',
        base_role_concept_id: AUTHZ.BASE_ROLE_STAFF,
        scope_concept_id: AUTHZ.SCOPE_TENANT,
        is_system: true,
        is_assignable: true,
      },
    ]);

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX10-${sufijo}`,
        credentialNumber: `CRED-FX10-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const altaAjena = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medicoAjeno.email),
        email: medicoAjeno.email,
        password: PASSWORD,
        name: 'Otra',
        lastName: 'Organización',
        licenseNumber: `LIC-FX10-X-${sufijo}`,
        credentialNumber: `CRED-FX10-X-${sufijo}`,
      })
      .expect(201);
    medicoAjeno.hpid = altaAjena.body.practitionerProfileId;

    const loginAjeno = await http()
      .post('/iam/auth/login')
      .send({ email: medicoAjeno.email, password: PASSWORD })
      .expect(200);
    medicoAjeno.token = loginAjeno.body.accessToken;
    medicoAjeno.tenantId = (
      claims(medicoAjeno.token)['tenants'] as string[]
    )[0];

    const recursoAjeno = await http()
      .post('/scheduling/resources')
      .set(bearer(medicoAjeno.token))
      .send({
        tenantId: medicoAjeno.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medicoAjeno.hpid,
        name: 'Consultorio ajeno FX-10',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    foreignResourceId = recursoAjeno.body.id;

    // El auto-registro profesional usa el tenant semilla para todos los
    // profesionales. Movemos sólo este recurso a otro tenant ya sembrado para
    // reproducir un UUID realmente ajeno sin inventar una fila incompleta.
    const [foreignTenant] = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        `select id
         from directory.tenants
        where id <> ?
        order by id
        limit 1`,
        [medico.tenantId],
      );
    await ctx.orm.em.getConnection().execute(
      `update scheduling.schedulable_resources
          set tenant_id = ?, updated_at = now()
        where id = ?`,
      [foreignTenant.id, foreignResourceId],
    );

    // El bootstrap ya materializó el rol. Se concede por la misma API pública
    // que usa administración, con ámbito explícito en el tenant del mostrador.
    await http()
      .post(
        `/authz/users/${String(claims(medico.token)['sub'])}/role-assignments`,
      )
      .set(bearer(ctx.adminToken))
      .send({
        roleCode: 'SCHEDULING_AGENT',
        tenantId: medico.tenantId,
      })
      .expect(201);

    const loginMostrador = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = loginMostrador.body.accessToken;
    expect(claims(medico.token)['scopedRoles']).toMatchObject({
      [medico.tenantId]: expect.arrayContaining(['SCHEDULING_AGENT']),
    });

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-10',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el camino feliz deja una fila en cada tabla, con los estados IN_PROGRESS del DoD', async () => {
    const cuando = lunesLejano(1);
    cuando.setUTCHours(9, 0, 0, 0);
    const nationalId = `FX10A${sufijo}`;

    const respuesta = await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send(walkInBody(nationalId, cuando))
      .expect(201);

    const {
      patientProfileId,
      personId,
      bookingId,
      bookableSlotId,
      appointmentId,
      encounterId,
    } = respuesta.body;

    const persona = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from profiles.persons where id = ?`,
        [personId],
      );
    expect(Number(persona[0].n)).toBe(1);

    const perfilPaciente = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from profiles.patient_profiles where profile_id = ?`,
        [patientProfileId],
      );
    expect(Number(perfilPaciente[0].n)).toBe(1);

    expect(await contarIdentificador(nationalId)).toBe(1);

    const cupo = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from scheduling.bookable_slots where id = ?`,
        [bookableSlotId],
      );
    expect(Number(cupo[0].n)).toBe(1);

    const cita = await ctx.orm.em.getConnection().execute<{ estado: string }[]>(
      `select c.code as estado
         from clinical.appointments a
         join terminology.catalog_concepts c on c.id = a.status_concept_id
        where a.id = ?`,
      [appointmentId],
    );
    expect(cita).toHaveLength(1);

    const reserva = await ctx.orm.em
      .getConnection()
      .execute<{ estado: string }[]>(
        `select c.code as estado
         from scheduling.appointment_bookings b
         join terminology.catalog_concepts c on c.id = b.status_concept_id
        where b.id = ?`,
        [bookingId],
      );
    expect(reserva).toHaveLength(1);
    expect(reserva[0].estado).toBe('scheduling:BOOKING_IN_PROGRESS');

    const encuentro = await ctx.orm.em
      .getConnection()
      .execute<{ estado: string; appointment_id: string }[]>(
        `select c.code as estado, e.appointment_id
         from clinical.encounters e
         join terminology.catalog_concepts c on c.id = e.status_concept_id
        where e.id = ?`,
        [encounterId],
      );
    expect(encuentro).toHaveLength(1);
    expect(encuentro[0].estado).toBe('clinical:ENCOUNTER_IN_PROGRESS');
    expect(encuentro[0].appointment_id).toBe(appointmentId);
  });

  it('el choque de horario del profesional rechaza con 422 y no deja ninguna fila del paciente', async () => {
    const cuando = lunesLejano(2);
    cuando.setUTCHours(10, 0, 0, 0);
    const primero = `FX10B1${sufijo}`;
    const segundo = `FX10B2${sufijo}`;

    await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send(walkInBody(primero, cuando))
      .expect(201);

    await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send(walkInBody(segundo, cuando))
      .expect(422);

    // El rollback deshace TODO: ni la persona que se estaba registrando
    // sobrevive a una cita que nunca se pudo confirmar.
    expect(await contarIdentificador(segundo)).toBe(0);
  });

  it('un mostrador no usa una agenda de otro tenant ni conserva el paciente provisional', async () => {
    const cuando = lunesLejano(3);
    cuando.setUTCHours(11, 0, 0, 0);
    const nationalId = `FX10X${sufijo}`;

    await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send({
        ...walkInBody(nationalId, cuando),
        resourceId: foreignResourceId,
      })
      .expect(403);

    expect(await contarIdentificador(nationalId)).toBe(0);
  });
});
