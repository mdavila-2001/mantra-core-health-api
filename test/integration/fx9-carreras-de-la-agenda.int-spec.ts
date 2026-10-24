import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';

/**
 * FX-9 · las tres carreras que la agenda tiene que perder siempre (H-1).
 *
 * ## Qué se está protegiendo
 *
 * Que **un profesional no quede con dos pacientes a la misma hora**. No es una
 * preferencia de producto: es la regla madre de AG-1, y la única garantía que
 * no depende de que el código la recuerde es la restricción de la base,
 * `ex_appointments_practitioner_time` (`EXCLUDE USING gist`).
 *
 * Las fichas la piden tres veces, una por carril, porque son tres caminos
 * distintos a la misma fila:
 *
 * - **AC-14-10** — dos altas de cita puntual que se pisan.
 * - **AC-13-6** — dos aceptaciones de solicitudes que se pisan.
 * - **AC-12-9** — mover el horario mientras alguien toma el destino.
 *
 * ## Por qué con `Promise.all` y contra la base
 *
 * Una prueba unitaria no puede fallar acá: con el `EntityManager` simulado no
 * hay dos transacciones, no hay `SQLSTATE` y no hay índice. Lo que estas
 * pruebas ejercen es justamente lo que el mock borra — que las dos peticiones
 * lleguen de verdad a la vez y que **Postgres** resuelva el empate.
 *
 * Y se cuentan **filas**, no respuestas: que una petición conteste 422 es
 * agradable, pero lo que importa es que en la tabla quede una. Un servicio que
 * contestara dos veces 201 y guardara una sola fila también pasaría un aserto
 * sobre los códigos, y sería un defecto.
 */
describe('FX-9 · las carreras de la agenda (H-1)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx9-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const ana = { nationalId: `FX9A${sufijo}`, token: '', pid: '' };
  const beto = { nationalId: `FX9B${sufijo}`, token: '', pid: '' };

  let resourceId = '';
  let secondResourceId = '';
  /**
   * Un municipio real del catálogo. El alta de paciente lo exige, y se busca
   * en vez de clavarse: los ids son deterministas pero fijarlos acá haría
   * caducar la suite el día que el namespace cambie.
   */
  let municipioId = '';

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

  /**
   * Los estados que **comprometen** al profesional, leídos por su código y no
   * clavados por uuid.
   *
   * Es la misma lista que el predicado de `ex_appointments_practitioner_time`,
   * y esa coincidencia es el punto: una **solicitud pendiente no compromete a
   * nadie** —dos personas pueden pedir el mismo rato, para eso existe pedir— y
   * por eso la restricción las deja fuera. Contar todas las citas haría fallar
   * esta prueba por una fila que es correcta que exista.
   */
  const ESTADOS_COMPROMETIDOS = [
    'clinical:APPOINTMENT_BOOKED',
    'clinical:APPOINTMENT_CHECKED_IN',
  ];

  /** Cuántas citas COMPROMETIDAS del profesional se pisan con este rato. */
  async function citasQuePisan(desde: Date, minutos: number): Promise<number> {
    const hasta = new Date(desde.getTime() + minutos * 60_000);
    const filas = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select count(*)::text as n
         from clinical.appointments a
         join terminology.catalog_concepts c on c.id = a.status_concept_id
        where a.practitioner_profile_id = ?
          and c.code in (?, ?)
          and a.start_at < ?
          and coalesce(a.end_at, a.start_at) > ?`,
      [
        medico.hpid,
        ...ESTADOS_COMPROMETIDOS,
        hasta.toISOString(),
        desde.toISOString(),
      ],
    );
    return Number(filas[0]?.n ?? '0');
  }

  async function altaPaciente(quien: {
    nationalId: string;
    token: string;
    pid: string;
  }): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId: quien.nationalId,
        password: PASSWORD,
        email: `${quien.nationalId.toLowerCase()}@example.test`,
        name: 'Paciente',
        lastName: 'De Prueba',
        birthDate: '1990-01-01',
        phone: '+591 70000000',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
      })
      .expect(201);
    quien.pid = alta.body.patientProfileId ?? alta.body.profileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId: quien.nationalId, password: PASSWORD })
      .expect(200);
    quien.token = login.body.accessToken;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const municipios = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        `select id from terminology.catalog_concepts
          where code like 'geo:bo:municipality:%' order by code limit 1`,
      );
    municipioId = municipios[0]?.id ?? '';

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX9-${sufijo}`,
        credentialNumber: `CRED-FX9-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    await altaPaciente(ana);
    await altaPaciente(beto);

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-9',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    const segundoConsultorio = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-9 alternativo',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    secondResourceId = segundoConsultorio.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('AC-14-10 · dos citas puntuales que se pisan dejan UNA fila', async () => {
    const cuando = lunesLejano(1);
    cuando.setUTCHours(14, 0, 0, 0);

    const alta = (pid: string) =>
      http()
        .post('/scheduling/appointments/direct')
        .set(bearer(medico.token))
        .send({
          patientProfileId: pid,
          resourceId,
          startAt: cuando.toISOString(),
          durationMinutes: 30,
          reasonText: 'Control',
        });

    // A la vez de verdad: dos `await` seguidos no son una carrera, son una cola.
    const [uno, dos] = await Promise.all([alta(ana.pid), alta(beto.pid)]);

    const creadas = [uno, dos].filter((r) => r.status === 201);
    expect(creadas).toHaveLength(1);

    // El aserto que sostiene la prueba: la fila, no el código de respuesta.
    expect(await citasQuePisan(cuando, 30)).toBe(1);
  });

  it('AC-14-10 · dos consultorios del mismo médico no confirman citas simultáneas', async () => {
    const cuando = lunesLejano(4);
    cuando.setUTCHours(14, 0, 0, 0);

    const alta = (pid: string, resource: string) =>
      http()
        .post('/scheduling/appointments/direct')
        .set(bearer(medico.token))
        .send({
          patientProfileId: pid,
          resourceId: resource,
          startAt: cuando.toISOString(),
          durationMinutes: 30,
          reasonText: 'Control en otra sede',
        });

    const [consultorioPrincipal, consultorioAlternativo] = await Promise.all([
      alta(ana.pid, resourceId),
      alta(beto.pid, secondResourceId),
    ]);

    const confirmadas = [consultorioPrincipal, consultorioAlternativo].filter(
      (response) => response.status === 201,
    );
    expect(confirmadas).toHaveLength(1);
    expect(await citasQuePisan(cuando, 30)).toBe(1);
  });

  it('AC-13-6 · dos aceptaciones que se pisan dejan UNA confirmada', async () => {
    const desde = lunesLejano(2);
    desde.setUTCHours(0, 0, 0, 0);

    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Mañanas FX-9',
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '08:00:00',
            endTime: '09:00:00',
            slotMinutes: 30,
            // Dos lugares en el MISMO cupo: es lo que permite que existan dos
            // solicitudes pendientes sobre el mismo rato, que es el caso que
            // esta prueba necesita. La regla madre sigue siendo del
            // profesional, así que aceptar las dos es imposible.
            capacityPerSlot: 2,
          },
        ],
      })
      .expect(201);

    await http()
      .post(`/scheduling/templates/${plantilla.body.id}/generate-slots`)
      .set(bearer(medico.token))
      .send({
        from: desde.toISOString(),
        to: new Date(desde.getTime() + 24 * 3600 * 1000).toISOString(),
      })
      .expect(201);

    const cupo = await ctx.orm.em
      .getConnection()
      .execute<{ id: string; start_at: Date }[]>(
        `select id, start_at from scheduling.bookable_slots
        where schedule_template_id = ? order by start_at limit 1`,
        [plantilla.body.id],
      );
    const slotId = cupo[0].id;

    /** Pide turno en ese cupo y devuelve el id de la solicitud. */
    async function pedirTurno(quien: {
      token: string;
      pid: string;
    }): Promise<string> {
      const hold = await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(bearer(quien.token))
        .send({ patientProfileId: quien.pid })
        .expect(201);
      const solicitud = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/request`)
        .set(bearer(quien.token))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: quien.pid,
          channel: 'PORTAL',
          reasonText: 'Control',
        })
        .expect(201);
      return solicitud.body.id;
    }

    const unaSolicitud = await pedirTurno(ana);
    const otraSolicitud = await pedirTurno(beto);

    const aceptar = (id: string) =>
      http()
        .post(`/scheduling/bookings/${id}/accept`)
        .set(bearer(medico.token))
        .send({});

    const [uno, dos] = await Promise.all([
      aceptar(unaSolicitud),
      aceptar(otraSolicitud),
    ]);

    const aceptadas = [uno, dos].filter((r) => r.status === 200);
    expect(aceptadas).toHaveLength(1);
    // El driver devuelve la fecha como texto: se normaliza antes de medir.
    expect(await citasQuePisan(new Date(cupo[0].start_at), 30)).toBe(1);
  });

  it('AC-12-9 · mover el horario mientras alguien toma el destino', async () => {
    // La carrera más fea de las tres: una petición corre los cupos veinte
    // minutos y otra, a la vez, crea una cita justo en el minuto al que iban a
    // llegar. Si las dos ganaran, el profesional tendría dos pacientes en el
    // mismo rato y ninguna de las dos habría hecho nada «mal».
    const base = lunesLejano(3);
    base.setUTCHours(16, 0, 0, 0);

    await http()
      .post('/scheduling/appointments/direct')
      .set(bearer(medico.token))
      .send({
        patientProfileId: ana.pid,
        resourceId,
        startAt: base.toISOString(),
        durationMinutes: 30,
        reasonText: 'La que se mueve',
      })
      .expect(201);

    const destino = new Date(base.getTime() + 20 * 60_000);
    const finDelDia = new Date(base.getTime() + 6 * 3600 * 1000);

    const mover = http()
      .post(`/scheduling/resources/${resourceId}/shift-slots`)
      .set(bearer(medico.token))
      .send({
        shiftMinutes: 20,
        from: base.toISOString(),
        to: finDelDia.toISOString(),
      });

    const tomarElDestino = http()
      .post('/scheduling/appointments/direct')
      .set(bearer(medico.token))
      .send({
        patientProfileId: beto.pid,
        resourceId,
        startAt: destino.toISOString(),
        durationMinutes: 30,
        reasonText: 'La que llega al destino',
      });

    await Promise.all([mover, tomarElDestino]);

    // Gane quien gane —y las dos respuestas son legítimas—, lo que no puede
    // pasar es que el profesional quede con dos citas encimadas. Se mide sobre
    // toda la ventana, no sobre un instante: mover no crea filas nuevas, las
    // corre, así que contar en un solo minuto se dejaría engañar.
    const ventana = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select count(*)::text as n
         from clinical.appointments a
         join terminology.catalog_concepts ca on ca.id = a.status_concept_id
         join clinical.appointments b
           on b.practitioner_profile_id = a.practitioner_profile_id
          and b.id <> a.id
          and b.start_at < coalesce(a.end_at, a.start_at)
          and coalesce(b.end_at, b.start_at) > a.start_at
         join terminology.catalog_concepts cb on cb.id = b.status_concept_id
        where a.practitioner_profile_id = ?
          and ca.code in (?, ?)
          and cb.code in (?, ?)`,
      [medico.hpid, ...ESTADOS_COMPROMETIDOS, ...ESTADOS_COMPROMETIDOS],
    );
    expect(Number(ventana[0].n)).toBe(0);
  });
});
