import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';

/**
 * El cupo que se libera le llega a quien lo estaba esperando — contra la base.
 *
 * ## Por qué existe
 *
 * Los tres cambios que cubre se entregaron con pruebas unitarias, y ahí quien
 * decide qué candidatos existen es el doble del puerto. Eso alcanza para fijar
 * la lógica y **no** alcanza para afirmar que la lista de espera hace lo que
 * dice: el `WHERE` que decide a quién le sirve un turno lo ejecuta Postgres, no
 * el mock. En particular:
 *
 * - el filtro por ventana deseada es un `$and` de dos `$or` con `null` — la
 *   clase de consulta que un doble nunca contradice y la base sí;
 * - la promoción al cancelar cruza dos transacciones y un servicio;
 * - la autorización de las dos lecturas es lo que separa un dato clínico
 *   privado de un IDOR.
 *
 * ## Qué NO cubre
 *
 * El **aviso**. Que la promoción emita la notificación tiene sus propias
 * pruebas (`scheduling-agenda-notices`), y acá lo que se afirma es a quién se
 * promueve y a quién no. La entrada marcada como cubierta es la evidencia
 * observable de esa decisión.
 */
describe('lista de espera · el cupo liberado, contra la base', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `wl-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const otroMedico = {
    email: `wl-med2-${sufijo}@example.test`,
    token: '',
    hpid: '',
  };
  /** El que reserva y después cancela: su cancelación es la que libera el cupo. */
  const titular = {
    email: `wl-tit-${sufijo}@example.test`,
    nationalId: `WLT${sufijo}`,
    token: '',
    pid: '',
  };
  /** Espera para ESA semana: el cupo liberado le sirve. */
  const esperaCerca = {
    email: `wl-cerca-${sufijo}@example.test`,
    nationalId: `WLC${sufijo}`,
    token: '',
    pid: '',
  };
  /** Espera para dentro de tres meses: el mismo cupo NO le sirve. */
  const esperaLejos = {
    email: `wl-lejos-${sufijo}@example.test`,
    nationalId: `WLL${sufijo}`,
    token: '',
    pid: '',
  };

  let resourceId = '';
  let templateId = '';
  let slotId = '';
  let bookingId = '';

  /** Los claims de un token, sin verificar la firma: acá interesa el contenido. */
  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /**
   * El lunes siguiente. Fijar una fecha literal haría que la suite caducara, y
   * el cupo tiene que caer en el futuro: la promoción sólo mira turnos futuros.
   */
  function proximoLunes(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
    return d;
  }

  /** Da de alta un paciente y devuelve su perfil y su token. */
  async function altaDePaciente(quien: {
    email: string;
    nationalId: string;
    token: string;
    pid: string;
  }): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId: quien.nationalId,
        password: PASSWORD,
        email: quien.email,
        name: 'Ana',
        lastName: 'Flores',
      })
      .expect(201);
    quien.pid = alta.body.patientProfileId ?? alta.body.profileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId: quien.nationalId, password: PASSWORD })
      .expect(200);
    quien.token = login.body.accessToken;
  }

  /** El estado de una entrada de lista de espera, leído de la base. */
  async function estadoDeLaEspera(entryId: string): Promise<string> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ status_concept_id: string }[]>(
        `select status_concept_id from scheduling.waitlist_entries where id = ?`,
        [entryId],
      );
    return filas[0]?.status_concept_id ?? '';
  }

  /** El código legible de un concepto, para no comparar uuids a ojo. */
  async function codigoDelConcepto(conceptId: string): Promise<string> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ code: string }[]>(
        `select code from terminology.catalog_concepts where id = ?`,
        [conceptId],
      );
    return filas[0]?.code ?? '';
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-WL-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    // El segundo profesional existe sólo para comprobar que no ve la cola
    // ajena: sin él, la prueba de autorización no tendría con quién contrastar.
    const alta2 = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: otroMedico.email,
        password: PASSWORD,
        name: 'Bruno',
        lastName: 'Vera',
        licenseNumber: `LIC-WL2-${sufijo}`,
      })
      .expect(201);
    otroMedico.hpid = alta2.body.practitionerProfileId;
    const login2 = await http()
      .post('/iam/auth/login')
      .send({ email: otroMedico.email, password: PASSWORD })
      .expect(200);
    otroMedico.token = login2.body.accessToken;

    await altaDePaciente(titular);
    await altaDePaciente(esperaCerca);
    await altaDePaciente(esperaLejos);

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: `Consultorio WL ${sufijo}`,
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: `Mañanas WL ${sufijo}`,
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '08:00:00',
            endTime: '09:00:00',
            slotMinutes: 30,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);
    templateId = plantilla.body.id;

    const lunes = proximoLunes();
    const finDelLunes = new Date(lunes.getTime() + 24 * 3600 * 1000);
    await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(medico.token))
      .send({ from: lunes.toISOString(), to: finDelLunes.toISOString() })
      .expect(201);

    const cupos = await http()
      .get('/scheduling/slots')
      .query({
        resourceId,
        from: lunes.toISOString(),
        to: finDelLunes.toISOString(),
      })
      .set(bearer(medico.token))
      .expect(200);
    slotId = cupos.body.items[0].id;

    // El titular toma el cupo. Su cancelación es lo que dispara todo lo demás.
    const hold = await http()
      .post(`/scheduling/slots/${slotId}/holds`)
      .set(bearer(titular.token))
      .send({ patientProfileId: titular.pid })
      .expect(201);
    const reserva = await http()
      .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
      .set(bearer(titular.token))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: titular.pid,
        channel: 'PORTAL',
      })
      .expect(201);
    bookingId = reserva.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /* ======================================================================
     1 · la ventana deseada decide a quién le sirve el cupo
     ====================================================================== */

  describe('la ventana deseada decide a quién le sirve el cupo', () => {
    let entradaCerca = '';
    let entradaLejos = '';

    it('dos pacientes se anotan en la misma agenda con ventanas distintas', async () => {
      const lunes = proximoLunes();

      const cerca = await http()
        .post('/scheduling/waitlist')
        .set(bearer(esperaCerca.token))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: esperaCerca.pid,
          resourceId,
          desiredFrom: new Date(
            lunes.getTime() - 24 * 3600 * 1000,
          ).toISOString(),
          desiredTo: new Date(
            lunes.getTime() + 7 * 24 * 3600 * 1000,
          ).toISOString(),
        })
        .expect(201);
      entradaCerca = cerca.body.id;

      // Éste quiere turno dentro de tres meses: el cupo del lunes que viene no
      // le sirve, y hasta la corrección lo recibía igual —y perdía su lugar—.
      const lejos = await http()
        .post('/scheduling/waitlist')
        .set(bearer(esperaLejos.token))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: esperaLejos.pid,
          resourceId,
          desiredFrom: new Date(
            lunes.getTime() + 90 * 24 * 3600 * 1000,
          ).toISOString(),
          desiredTo: new Date(
            lunes.getTime() + 120 * 24 * 3600 * 1000,
          ).toISOString(),
        })
        .expect(201);
      entradaLejos = lejos.body.id;

      expect(entradaCerca).toBeDefined();
      expect(entradaLejos).toBeDefined();
    });

    it('cancelar la cita promueve SÓLO al que quería ese momento', async () => {
      // Sin esperar al worker: la promoción arranca en la cancelación.
      await http()
        .post(`/scheduling/bookings/${bookingId}/cancel`)
        .set(bearer(titular.token))
        .send({ cancelledBy: 'PATIENT', reasonText: 'Me surgió un viaje' })
        .expect(200);

      const deCerca = await codigoDelConcepto(
        await estadoDeLaEspera(entradaCerca),
      );
      const deLejos = await codigoDelConcepto(
        await estadoDeLaEspera(entradaLejos),
      );

      // Los códigos del catálogo son `WL_*`, no `WAITLIST_*`: los segundos son
      // los nombres de las constantes de `CONCEPTS`, que no son lo mismo.
      expect(deCerca).toBe('WL_FULFILLED');
      // La afirmación que sostiene toda la corrección: el que pedía otra fecha
      // sigue esperando, con su lugar intacto.
      expect(deLejos).toBe('WL_ACTIVE');
    });
  });

  /* ======================================================================
     2 · quién puede ver la cola de una agenda
     ====================================================================== */

  describe('la cola de la agenda, y quién puede verla', () => {
    it('el profesional ve quién espera su agenda, con nombre', async () => {
      const res = await http()
        .get(`/scheduling/resources/${resourceId}/waitlist`)
        .query({ includeClosed: 'true' })
        .set(bearer(medico.token))
        .expect(200);

      const perfiles = res.body.items.map(
        (item: { patientProfileId: string }) => item.patientProfileId,
      );
      expect(perfiles).toContain(esperaCerca.pid);
      expect(perfiles).toContain(esperaLejos.pid);

      // El nombre es lo que hace útil la lista: sin él es una columna de uuids.
      const conNombre = res.body.items.filter(
        (item: { patientName?: string }) => item.patientName !== undefined,
      );
      expect(conNombre.length).toBeGreaterThan(0);
    });

    it('por omisión no trae las ya cubiertas: una espera cubierta no es una espera', async () => {
      const res = await http()
        .get(`/scheduling/resources/${resourceId}/waitlist`)
        .set(bearer(medico.token))
        .expect(200);

      const perfiles = res.body.items.map(
        (item: { patientProfileId: string }) => item.patientProfileId,
      );
      expect(perfiles).toContain(esperaLejos.pid);
      expect(perfiles).not.toContain(esperaCerca.pid);
    });

    it('otro profesional no ve la cola de una agenda ajena', async () => {
      await http()
        .get(`/scheduling/resources/${resourceId}/waitlist`)
        .set(bearer(otroMedico.token))
        .expect(403);
    });

    it('un paciente no llega a la cola de la agenda', async () => {
      // El rol ni siquiera está en la lista del endpoint: la puerta se cierra
      // antes de la comprobación de propiedad.
      await http()
        .get(`/scheduling/resources/${resourceId}/waitlist`)
        .set(bearer(esperaCerca.token))
        .expect(403);
    });
  });

  /* ======================================================================
     3 · el IDOR de la lectura por paciente
     ====================================================================== */

  describe('la lista de espera de un paciente es suya', () => {
    it('el titular lee la suya', async () => {
      const res = await http()
        .get('/scheduling/waitlist')
        .query({ patientProfileId: esperaLejos.pid })
        .set(bearer(esperaLejos.token))
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('otro paciente NO puede leerla cambiando el uuid de la URL', async () => {
      // El agujero que esto cierra: con qué profesional espera alguien y para
      // qué fechas es dato de salud, y estaba a un uuid de distancia.
      await http()
        .get('/scheduling/waitlist')
        .query({ patientProfileId: esperaLejos.pid })
        .set(bearer(esperaCerca.token))
        .expect(403);
    });
  });
});
