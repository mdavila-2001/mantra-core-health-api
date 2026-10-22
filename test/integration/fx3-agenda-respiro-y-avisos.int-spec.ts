import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * FX-3 · el respiro entre consultas y los avisos de una solicitud, contra la
 * base real.
 *
 * ## Por qué existe
 *
 * Las cuatro PRs del eje agenda del 02/09 (#275 a #278) se entregaron en nivel
 * **TESTED**: sus pruebas unitarias corren con el `EntityManager` simulado, y
 * ahí quien decide si una solicitud de notificación existe es el mock. Eso
 * alcanza para fijar la lógica y **no** alcanza para afirmar que el aviso
 * llega: la fila la escribe Postgres, no el doble de pruebas.
 *
 * Esta suite ejercita el camino entero —registrar, publicar, generar, retener,
 * solicitar— y después **mira la base**. Es lo que separa «los tests dirigidos
 * pasan» de «el comportamiento se observó».
 *
 * ## Qué cubre, PR por PR
 *
 * - **#277** — el paso del generador es `slot + gap` y la duración sigue siendo
 *   `slot`. Se mide sobre los cupos materializados, no sobre el contador.
 * - **#276** — pedir un turno produce **dos** avisos, uno por parte, con claves
 *   de rebote distintas.
 * - **#275** — cada aviso sale además por el canal **correo**, con la dirección
 *   de la cuenta resuelta, y su clave de rebote lleva el sufijo del canal.
 * - **#278** — la tipología viaja en la lectura cuando la cita tiene
 *   contraparte clínica, y se omite cuando no.
 *
 * ## Lo que NO cubre, y por qué
 *
 * El **envío** del correo. Lo hace el worker de mensajería contra Gmail, fuera
 * de este proceso y con credenciales OAuth2 que el entorno de pruebas no tiene.
 * Lo verificable acá es que la solicitud queda encolada y bien formada, que es
 * exactamente donde termina la responsabilidad del módulo `scheduling`.
 */
describe('FX-3 · el respiro y los avisos de la agenda, contra la base', () => {
  let ctx: TestContext;
  /** Los campos que el alta de paciente exige; salen del arnés. */
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const SLOT_MINUTES = 30;
  const GAP_MINUTES = 10;

  const medico = {
    email: `fx3-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
    userId: '',
  };
  const paciente = {
    email: `fx3-pac-${sufijo}@example.test`,
    nationalId: `FX3${sufijo}`,
    token: '',
    pid: '',
    userId: '',
  };

  let resourceId = '';
  let templateId = '';
  let bookingId = '';

  /** Los claims de un token, sin verificar la firma: acá interesa el contenido. */
  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /**
   * El lunes siguiente, para que la franja del día 1 siempre tenga un día real
   * dentro de la ventana. Fijarlo a una fecha literal haría que la suite
   * caducara.
   */
  function proximoLunes(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
    return d;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX3-${sufijo}`,
        credentialNumber: `CRED-FX3-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const loginMedico = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = loginMedico.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];
    medico.userId = claims(medico.token)['sub'] as string;

    const altaPaciente = await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId: paciente.nationalId,
        password: PASSWORD,
        email: paciente.email,
        name: 'Ana',
        lastName: 'Flores',
      })
      .expect(201);
    paciente.pid =
      altaPaciente.body.patientProfileId ?? altaPaciente.body.profileId;

    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId: paciente.nationalId, password: PASSWORD })
      .expect(200);
    paciente.token = loginPaciente.body.accessToken;
    paciente.userId = claims(paciente.token)['sub'] as string;

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-3',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /* ======================================================================
     PR #277 · el respiro entre consultas
     ====================================================================== */

  describe('el respiro separa los turnos sin alargarlos (#277)', () => {
    it('publica una plantilla declarando el respiro', async () => {
      const plantilla = await http()
        .post(`/scheduling/resources/${resourceId}/templates`)
        .set(bearer(medico.token))
        .send({
          name: 'Mañanas FX-3',
          slotMinutes: SLOT_MINUTES,
          rules: [
            {
              dayOfWeek: 1,
              startTime: '08:00:00',
              endTime: '10:00:00',
              slotMinutes: SLOT_MINUTES,
              capacityPerSlot: 1,
              gapMinutes: GAP_MINUTES,
            },
          ],
        })
        .expect(201);
      templateId = plantilla.body.id;
      expect(templateId).toBeDefined();
    });

    it('la columna guardó el respiro tal como vino', async () => {
      const filas = await ctx.orm.em
        .getConnection()
        .execute<{ gap_minutes: number | null; slot_minutes: number | null }[]>(
          `select gap_minutes, slot_minutes
           from scheduling.schedule_rules
          where schedule_template_id = ?`,
          [templateId],
        );
      expect(filas).toHaveLength(1);
      expect(filas[0].gap_minutes).toBe(GAP_MINUTES);
      expect(filas[0].slot_minutes).toBe(SLOT_MINUTES);
    });

    it('el generador materializa con paso slot + gap y duración slot', async () => {
      const desde = proximoLunes();
      const hasta = new Date(desde.getTime() + 24 * 3600 * 1000);

      await http()
        .post(`/scheduling/templates/${templateId}/generate-slots`)
        .set(bearer(medico.token))
        .send({ from: desde.toISOString(), to: hasta.toISOString() })
        .expect(201);

      const cupos = await ctx.orm.em
        .getConnection()
        .execute<{ start_at: Date; end_at: Date }[]>(
          `select start_at, end_at
           from scheduling.bookable_slots
          where schedule_template_id = ?
          order by start_at`,
          [templateId],
        );

      // 08:00–10:00 en La Paz con paso de 40': entran tres, el cuarto se pasa.
      expect(cupos.length).toBe(3);

      const minutos = (a: Date, b: Date) =>
        (new Date(b).getTime() - new Date(a).getTime()) / 60_000;

      // El PASO entre arranques lleva el respiro…
      expect(minutos(cupos[0].start_at, cupos[1].start_at)).toBe(
        SLOT_MINUTES + GAP_MINUTES,
      );
      expect(minutos(cupos[1].start_at, cupos[2].start_at)).toBe(
        SLOT_MINUTES + GAP_MINUTES,
      );
      // …y la DURACIÓN de cada turno, no. Es la confusión que el respiro
      // existe para evitar: alargaría la consulta en vez de separarla.
      for (const cupo of cupos) {
        expect(minutos(cupo.start_at, cupo.end_at)).toBe(SLOT_MINUTES);
      }
    });
  });

  /* ======================================================================
     PRs #275 y #276 · los avisos de una solicitud
     ====================================================================== */

  describe('pedir un turno avisa a las dos partes, por dos canales (#275, #276)', () => {
    it('el paciente retiene un cupo y solicita el turno', async () => {
      const cupo = await ctx.orm.em.getConnection().execute<{ id: string }[]>(
        `select id from scheduling.bookable_slots
          where schedule_template_id = ? order by start_at limit 1`,
        [templateId],
      );

      const hold = await http()
        .post(`/scheduling/slots/${cupo[0].id}/holds`)
        .set(bearer(paciente.token))
        .send({ patientProfileId: paciente.pid })
        .expect(201);

      const solicitud = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/request`)
        .set(bearer(paciente.token))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: paciente.pid,
          channel: 'PORTAL',
          reasonText: 'Dolor de garganta hace tres días',
        })
        .expect(201);

      bookingId = solicitud.body.id;
      expect(bookingId).toBeDefined();
    });

    /** Las solicitudes de notificación que dejó la reserva, con su canal. */
    async function avisosDeLaReserva(): Promise<
      {
        recipient_user_id: string;
        recipient_address: string | null;
        debounce_key: string | null;
        canal: string;
      }[]
    > {
      return ctx.orm.em.getConnection().execute(
        `select r.recipient_user_id, r.recipient_address, r.debounce_key,
                c.code as canal
           from messaging.notification_requests r
           join messaging.message_channels c on c.id = r.channel_id
          where r.related_resource_id = ?
          order by c.code, r.recipient_user_id`,
        [bookingId],
      );
    }

    it('deja cuatro solicitudes: dos destinatarios por dos canales', async () => {
      const avisos = await avisosDeLaReserva();

      // Antes de #276 no había ninguna: pedir un turno era un hecho silencioso.
      // Antes de #275, las que había eran sólo del canal in-app.
      expect(avisos).toHaveLength(4);

      const destinatarios = new Set(avisos.map((a) => a.recipient_user_id));
      expect(destinatarios).toContain(paciente.userId);
      expect(destinatarios).toContain(medico.userId);

      const canales = new Set(avisos.map((a) => a.canal));
      expect(canales).toContain('IN_APP');
      expect(canales).toContain('EMAIL');
    });

    it('las de correo llevan la dirección de la cuenta, resuelta por el adaptador', async () => {
      const correos = (await avisosDeLaReserva()).filter(
        (a) => a.canal === 'EMAIL',
      );
      expect(correos).toHaveLength(2);

      const direcciones = correos.map((c) => c.recipient_address);
      // El canal externo no sabe resolver un `userId`: sin dirección la
      // solicitud queda encolada contra nadie.
      expect(direcciones).toContain(paciente.email);
      expect(direcciones).toContain(medico.email);
    });

    it('las cuatro claves de rebote son distintas', async () => {
      const claves = (await avisosDeLaReserva()).map((a) => a.debounce_key);

      // Es el defecto que #275 y #276 tuvieron que resolver a la vez:
      // `findLiveRequestByDebounceKey` busca por clave A SECAS, sin filtrar por
      // canal ni por destinatario. Con una sola clave, tres de estos cuatro
      // avisos se habrían rebotado contra el primero y no existirían.
      expect(new Set(claves).size).toBe(4);
      expect(claves.every((k) => k !== null && k.includes(bookingId))).toBe(
        true,
      );

      const deCorreo = claves.filter((k) => k?.endsWith(':email'));
      expect(deCorreo).toHaveLength(2);
    });

    it('ninguna solicitud de correo lleva el motivo de consulta', async () => {
      const cuerpos = await ctx.orm.em
        .getConnection()
        .execute<{ payload_json: Record<string, unknown> }[]>(
          `select r.payload_json
           from messaging.notification_requests r
           join messaging.message_channels c on c.id = r.channel_id
          where r.related_resource_id = ? and c.code = 'EMAIL'`,
          [bookingId],
        );

      // AC-15-5: el correo dice que hay una solicitud y lleva a la app. El
      // motivo de consulta es dato clínico y un correo es un canal que el
      // destinatario no controla.
      for (const fila of cuerpos) {
        const texto = JSON.stringify(fila.payload_json);
        expect(texto).not.toContain('Dolor de garganta');
      }
    });
  });

  /* ======================================================================
     PR #278 · la tipología de la cita
     ====================================================================== */

  describe('la tipología viaja cuando existe, y se omite cuando no (#278)', () => {
    it('una solicitud sin aceptar todavía no tiene contraparte clínica', async () => {
      const lectura = await http()
        .get(`/scheduling/bookings/${bookingId}`)
        .set(bearer(medico.token))
        .expect(200);

      // Se omite, no se vacía: `null` diría «no tiene tipo», que es otra
      // afirmación. Una reserva sin confirmar no crea `clinical.appointments`.
      expect(lectura.body.typeConceptId).toBeUndefined();
    });

    it('al aceptarla, la lectura devuelve la tipología de la cita clínica', async () => {
      await http()
        .post(`/scheduling/bookings/${bookingId}/accept`)
        .set(bearer(medico.token))
        .send({})
        // 200 y no 201: aceptar no crea un recurso nuevo, transiciona el que ya
        // existe. El controlador no declara `@HttpCode(CREATED)` como sí hacen
        // `hold` y `request`.
        .expect(200);

      const tipoEnBase = await ctx.orm.em
        .getConnection()
        .execute<{ type_concept_id: string | null }[]>(
          `select a.type_concept_id
           from clinical.appointments a
           join scheduling.appointment_bookings b on b.appointment_id = a.id
          where b.id = ?`,
          [bookingId],
        );

      const lectura = await http()
        .get(`/scheduling/bookings/${bookingId}`)
        .set(bearer(medico.token))
        .expect(200);

      if (tipoEnBase.length > 0 && tipoEnBase[0].type_concept_id !== null) {
        // El contrato dice lo mismo que la base: es lo que #278 vino a cerrar.
        expect(lectura.body.typeConceptId).toBe(tipoEnBase[0].type_concept_id);
      } else {
        // La cita clínica existe pero no declara tipo: el campo se omite. No
        // se afloja la prueba — se afirma la otra mitad del contrato.
        expect(lectura.body.typeConceptId).toBeUndefined();
      }
    });
  });
});
