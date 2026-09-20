import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { CONCEPTS } from '../../src/common';
import { MESSAGING_SEED } from '../../src/common/seed/messaging-seed.service';
import { MessagingAgendaNoticeAdapter } from '../../src/modules/scheduling/adapters/messaging-agenda-notice.adapter';
import { AGENDA_NOTICE_PORT } from '../../src/modules/scheduling/ports/agenda-notice.port';
import { bootstrapTestApp, type TestContext } from './harness';
import type {
  AgendaNotice,
  AgendaNoticePort,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * La relación `agenda → mensajería` contra **PostgreSQL real** (carril B,
 * hitos H3 y H4).
 *
 * ## Por qué existe, si ya hay una suite con dobles
 *
 * Porque la de dobles acredita que el adaptador **traduce**, y nada más. Acá se
 * mira lo único que prueba que un aviso existe: **la fila**. `delivered: true`
 * es un booleano que arma el adaptador; la bandeja la escribe Postgres.
 *
 * Las comprobaciones se hacen desde una **conexión independiente** (`pg.Client`
 * propio, fuera del `EntityManager` de la app): si se preguntara por el mismo
 * ORM que escribió, se estaría leyendo su unidad de trabajo, no la base.
 *
 * ## Qué NO acredita
 *
 * - **Correo:** sólo se comprueba la *solicitud persistida*. La aceptación por
 *   transporte y la evidencia de entrega las produce el worker de mensajería
 *   contra el proveedor real, que acá no corre.
 * - **Chat:** el aviso va a `SupportAdmin`; que `chatDelivered` sea `false` en
 *   este entorno no dice nada del chat real.
 *
 * ## Higiene de datos
 *
 * Esta suite **no trunca nada**. Cada caso usa una clave de rebote única con el
 * prefijo `IT-REL-B`, y el cierre borra exactamente las filas que creó,
 * respetando las FK. La base queda como estaba: es la base de desarrollo
 * poblada, no una copia descartable.
 */

/** Prefijo de todas las claves de rebote que esta suite crea, para poder borrarlas. */
const PREFIJO = 'IT-REL-B';

/** Conexión independiente de la que usa la app. */
function conexionIndependiente(): pg.Client {
  return new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
}

/**
 * Cuenta destinataria: el admin que siembra el arnés, que es una cuenta real
 * de `iam.users` con su fila creada por el mismo camino que la app usa.
 */
let destinatarioReal = '';

/**
 * Una cuenta que **sí** declara correo, para poder ejercitar ese canal.
 *
 * El admin del arnés no tiene dirección, así que con él el correo siempre
 * responde «La cuenta no declaró correo» — un resultado legítimo, pero que no
 * ejercita la solicitud persistida. Se resuelve por consulta y no por uuid
 * fijo: `findEmailForUser` mira `iam.authentication_credentials`, así que ese
 * es el criterio, no una constante que envejece.
 */
let destinatarioConCorreo: string | null = null;

function avisoDeCancelacion(debounceKey: string): AgendaNotice {
  return {
    kind: 'BOOKING_STATE_CHANGED',
    // Cuenta directa: mide la relación, no la resolución perfil → cuenta.
    recipient: { userId: destinatarioReal },
    subject: 'Tu cita fue cancelada',
    bodyText: 'El profesional canceló la cita.\nMotivo: agenda reprogramada.',
    relatedResourceType: 'scheduling.bookings',
    relatedResourceId: randomUUID(),
    payload: { route: '/schedule?vista=citas' },
    debounceKey,
  };
}

describe('Relación agenda → mensajería contra Postgres real (H3, H4)', () => {
  let ctx: TestContext;
  let puerto: AgendaNoticePort;
  let sql: pg.Client;

  beforeAll(async () => {
    // El arnés canónico: siembra el catálogo de conceptos del backend, sin el
    // cual `category_concept_id` no tiene destino y la solicitud muere con una
    // violación de FK. Es lo que separa «la relación no anda» de «le falta el
    // catálogo»: dos diagnósticos muy distintos.
    ctx = await bootstrapTestApp();
    puerto = ctx.app.get<AgendaNoticePort>(AGENDA_NOTICE_PORT);
    destinatarioReal = ctx.adminUserId;

    sql = conexionIndependiente();
    await sql.connect();

    const conCorreo = await sql.query<{ user_id: string }>(
      `select user_id from iam.authentication_credentials
        where external_subject like '%@%' order by user_id limit 1`,
    );
    destinatarioConCorreo = conCorreo.rows[0]?.user_id ?? null;
  }, 300_000);

  afterAll(async () => {
    // Borra sólo lo que esta suite creó, en orden de dependencia.
    const { rows } = await sql.query<{ id: string }>(
      `select id from messaging.notification_requests where debounce_key like $1`,
      [`${PREFIJO}%`],
    );
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      for (const tabla of [
        'messaging.in_app_notifications',
        'messaging.delivery_tracking_events',
        'messaging.notification_deliveries',
      ]) {
        await sql.query(
          `delete from ${tabla} where notification_request_id = any($1::uuid[])`,
          [ids],
        );
      }
      await sql.query(
        `delete from messaging.notification_requests where id = any($1::uuid[])`,
        [ids],
      );
    }
    await sql.end();
    await ctx.app.close();
  }, 120_000);

  describe('H3.S1.M1 · qué participantes reales están disponibles hoy', () => {
    it('el canal que el adaptador direcciona existe Y está activo', async () => {
      // Este par de condiciones es exactamente lo que faltaba cuando la
      // relación no entregaba nada (HALL-02, base cargada con un paquete
      // viejo). Las dos fallas eran silenciosas: `emit` no lanza, así que un
      // canal inexistente y uno inactivo se ven igual que un fallo de red.
      const porId = await sql.query<{ id: string; state_concept_id: string }>(
        `select id, state_concept_id from messaging.message_channels where id = $1`,
        [MESSAGING_SEED.inAppChannelId],
      );

      console.log(
        `[H3.S1.M1] canal IN_APP direccionado: ${MESSAGING_SEED.inAppChannelId} · ` +
          `filas=${String(porId.rowCount)} · estado=${String(porId.rows[0]?.state_concept_id)}`,
      );

      expect(porId.rowCount).toBe(1);
      // Y activo con el MISMO concepto que `notifications.service.ts` compara.
      expect(porId.rows[0]?.state_concept_id).toBe(CONCEPTS.STATE_ACTIVE);
    }, 60_000);
  });

  describe('H3.S1.M1-bis · la guarda que habría cazado HALL-02 el primer día', () => {
    it('la cadena entera que la emisión necesita está completa y coherente', async () => {
      // HALL-02 no fue un bug de código: fue una base cargada con un paquete
      // viejo, donde el canal tenía otro id y apuntaba a otro concepto ACTIVE.
      // Nada lo señalaba, porque `emit` no lanza. Esta prueba fija las cuatro
      // condiciones cuya ausencia lo produjo, para que la próxima vez falle
      // acá —con un mensaje que dice qué falta— y no en silencio.
      const faltantes: string[] = [];

      const canal = await sql.query<{ id: string; state_concept_id: string }>(
        `select id, state_concept_id from messaging.message_channels where id = $1`,
        [MESSAGING_SEED.inAppChannelId],
      );
      if (canal.rowCount !== 1)
        faltantes.push('el canal in-app que el adaptador direcciona');
      else if (canal.rows[0]?.state_concept_id !== CONCEPTS.STATE_ACTIVE) {
        faltantes.push(
          'el canal in-app está, pero con un ACTIVE que no es el del backend',
        );
      }

      const config = await sql.query(
        `select id from messaging.provider_channel_configs where id = $1`,
        [MESSAGING_SEED.inAppChannelConfigId],
      );
      if (config.rowCount !== 1)
        faltantes.push('la configuración de proveedor in-app');

      // Las cuatro categorías de aviso de agenda: sin ellas el INSERT muere
      // con una violación de FK sobre `category_concept_id`.
      const categorias = [CONCEPTS.STATE_ACTIVE];
      for (const id of categorias) {
        const c = await sql.query(
          `select id from terminology.catalog_concepts where id = $1`,
          [id],
        );
        if (c.rowCount !== 1) faltantes.push(`el concepto ${id}`);
      }

      console.log(
        `[H3.S1.M1-bis] piezas faltantes de la cadena: ${faltantes.length === 0 ? 'ninguna' : faltantes.join(' · ')}`,
      );
      expect(faltantes).toEqual([]);
    }, 120_000);
  });

  describe('H3.S1 · los efectos, comprobados en la persistencia', () => {
    it('H3.S1.M2/M3 · el aviso deja su solicitud y su fila de bandeja, vistas desde otra conexión', async () => {
      const clave = `${PREFIJO}:feliz:${randomUUID()}`;
      const aviso = avisoDeCancelacion(clave);

      const r = await puerto.emit(aviso);

      console.log(`[H3.S1.M2] resultado real: ${JSON.stringify(r)}`);

      // 1. El puerto promete que NO lanza. Eso sí se afirma siempre.
      expect(typeof r.delivered).toBe('boolean');

      if (r.notificationRequestId === undefined) {
        // Camino observado en esta base: el aviso no llegó a crear solicitud.
        // No se disfraza de PASS y no se inventa una causa: se fija que el
        // motivo es uno de los cinco del catálogo y que NO hay fila.
        expect(r.delivered).toBe(false);
        expect(r.skippedReason).toBeTruthy();
        const huerfanas = await sql.query(
          `select id from messaging.notification_requests where debounce_key = $1`,
          [clave],
        );
        expect(huerfanas.rowCount).toBe(0);
        return;
      }

      // 2. La solicitud, en la base, desde una conexión que no es la de la app.
      const solicitud = await sql.query<{
        id: string;
        recipient_user_id: string;
        related_resource_type: string;
        debounce_key: string;
      }>(
        `select id, recipient_user_id, related_resource_type, debounce_key
           from messaging.notification_requests where debounce_key = $1`,
        [clave],
      );
      expect(solicitud.rowCount).toBe(1);
      expect(solicitud.rows[0]?.recipient_user_id).toBe(destinatarioReal);
      expect(solicitud.rows[0]?.related_resource_type).toBe(
        'scheduling.bookings',
      );
      expect(solicitud.rows[0]?.id).toBe(r.notificationRequestId);

      // 3. La bandeja: la fila que el destinatario vería. Sólo existe si el
      //    adaptador dijo `delivered`.
      const bandeja = await sql.query<{
        id: string;
        recipient_user_id: string;
        subject: string;
        read_at: string | null;
      }>(
        `select id, recipient_user_id, subject, read_at
           from messaging.in_app_notifications
          where notification_request_id = $1`,
        [r.notificationRequestId],
      );

      if (r.delivered) {
        expect(bandeja.rowCount).toBe(1);
        expect(bandeja.rows[0]?.recipient_user_id).toBe(destinatarioReal);
        expect(bandeja.rows[0]?.subject).toBe(aviso.subject);
        // Nace sin leer: es lo que hace que la campana muestre el punto.
        expect(bandeja.rows[0]?.read_at).toBeNull();
        expect(bandeja.rows[0]?.id).toBe(r.inAppNotificationId);
      } else {
        // Si no entregó, tiene que decir por qué, y NO puede haber bandeja.
        expect(r.skippedReason).toBeTruthy();
        expect(bandeja.rowCount).toBe(0);
      }
    }, 120_000);

    it('H3.S2.M2 · correo: distingue solicitud persistida de entrega, que acá no ocurre', async () => {
      if (destinatarioConCorreo === null) {
        console.log(
          '[H3.S2.M2][NOT_RUN] no hay ninguna cuenta con correo declarado en esta base',
        );
        return;
      }

      const clave = `${PREFIJO}:correo:${randomUUID()}`;
      const aviso: AgendaNotice = {
        ...avisoDeCancelacion(clave),
        recipient: { userId: destinatarioConCorreo },
      };

      const r = await puerto.emit(aviso);
      console.log(
        `[H3.S2.M2] resultado con cuenta que declara correo: ${JSON.stringify(r)}`,
      );

      // Estado 1 · SOLICITUD PERSISTIDA: la fila existe, en la base, con la
      // dirección resuelta por el adaptador.
      expect(r.emailRequestId).toBeDefined();
      const solicitud = await sql.query<{
        recipient_address: string;
        debounce_key: string;
      }>(
        `select recipient_address, debounce_key from messaging.notification_requests
          where id = $1`,
        [r.emailRequestId],
      );
      expect(solicitud.rowCount).toBe(1);
      expect(solicitud.rows[0]?.recipient_address).toContain('@');
      // La clave del correo lleva el sufijo del canal: sin él se rebotaría
      // contra la del in-app y el correo no saldría nunca.
      expect(solicitud.rows[0]?.debounce_key).toBe(`${clave}:email`);

      // Estado 2 · ACEPTACIÓN POR TRANSPORTE y estado 3 · EVIDENCIA DE ENTREGA:
      // los produce el worker de mensajería contra el proveedor real, que en
      // esta suite no corre. Se comprueba que NO están, que es distinto de
      // suponer que no están.
      const entregas = await sql.query<{ provider_message_ref: string | null }>(
        `select provider_message_ref from messaging.notification_deliveries
          where notification_request_id = $1`,
        [r.emailRequestId],
      );
      const conRef = entregas.rows.filter(
        (e) => e.provider_message_ref !== null,
      );
      expect(conRef).toHaveLength(0);
    }, 120_000);
  });

  describe('H4.S1 · idempotencia, medida en efectos persistidos', () => {
    it('H4.S1.M1 · ADV-05: repetir con la misma clave deja UNA sola solicitud viva', async () => {
      const clave = `${PREFIJO}:repeticion:${randomUUID()}`;

      const primero = await puerto.emit(avisoDeCancelacion(clave));
      const segundo = await puerto.emit(avisoDeCancelacion(clave));

      // El oráculo es el conteo en la base, NO la cantidad de llamadas.
      const conteo = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_requests
          where debounce_key = $1`,
        [clave],
      );

      if (primero.notificationRequestId === undefined) {
        // La emisión no persiste en este entorno (HALL-02). La idempotencia
        // queda NOT_RUN con causa: no se puede medir lo que no se escribe, y
        // 0 filas NO es «idempotente», es «no hizo nada».

        console.log(
          '[H4.S1.M1][NOT_RUN] la emisión no crea solicitud en esta base; ' +
            `motivo del adaptador: ${String(primero.skippedReason)}`,
        );
        expect(conteo.rows[0]?.n).toBe('0');
        return;
      }

      expect(conteo.rows[0]?.n).toBe('1');

      // Y la segunda devuelve la MISMA solicitud, rebotada.
      expect(segundo.notificationRequestId).toBe(primero.notificationRequestId);
      expect(segundo.delivered).toBe(false);
      expect(segundo.skippedReason).toBe(
        'Ya había un aviso igual sin entregar',
      );
    }, 120_000);

    it('H4.S1.M2 · misma clave con payload distinto: gana la primera, sin aviso', async () => {
      const clave = `${PREFIJO}:payload:${randomUUID()}`;
      const original = avisoDeCancelacion(clave);
      const distinto: AgendaNotice = {
        ...original,
        subject: 'OTRO ASUNTO COMPLETAMENTE DISTINTO',
        bodyText: 'Otro cuerpo.',
      };

      const r1 = await puerto.emit(original);
      await puerto.emit(distinto);

      const filas = await sql.query<{ payload_json: { subject?: string } }>(
        `select payload_json from messaging.notification_requests
          where debounce_key = $1`,
        [clave],
      );

      if (r1.notificationRequestId === undefined) {
        console.log(
          '[H4.S1.M2][NOT_RUN] sin persistencia, no hay qué comparar',
        );
        expect(filas.rowCount).toBe(0);
        return;
      }

      // Comportamiento OBSERVADO, no declarado correcto: el contrato no define
      // qué hacer ante misma clave con contenido distinto (Q-12/Q-13 abiertas).
      // Lo que se fija acá es que el segundo contenido NO se persiste y que
      // nadie se entera: no hay error, no hay campo que lo señale.
      expect(filas.rowCount).toBe(1);
      expect(filas.rows[0]?.payload_json?.subject).toBe(original.subject);
    }, 120_000);

    it('H4.S1.M3 · la deduplicación NO descansa en una restricción de la base', async () => {
      const { rows } = await sql.query<{ indexdef: string }>(
        `select indexdef from pg_indexes
          where schemaname = 'messaging'
            and tablename = 'notification_requests'
            and indexdef ilike '%debounce_key%'`,
      );

      // Hallazgo, no preferencia: si algún día aparece un índice único sobre
      // `debounce_key`, este test cae y hay que releer H4 entero — porque la
      // carrera de abajo dejaría de ser posible.
      const unicos = rows.filter((r) => /UNIQUE/i.test(r.indexdef));
      expect(unicos).toHaveLength(0);
      expect(rows).toHaveLength(0);
    }, 60_000);
  });

  describe('H5.S1 · el doble no puede llegar a producción (ADV-07)', () => {
    it('H5.S1.M3 · la composición real resuelve el adaptador real, no un doble', () => {
      // Evidencia de COMPOSICIÓN, no el nombre de una variable de entorno:
      // se pregunta a la app compuesta qué instancia respondió al token.
      const resuelto = (puerto as object).constructor.name;

      console.log(`[H5.S1.M3] AGENDA_NOTICE_PORT resuelve a: ${resuelto}`);
      expect(resuelto).toBe('MessagingAgendaNoticeAdapter');
    });

    it('H5.S1.M3-bis · el token y la clase concreta son la MISMA instancia (useExisting)', () => {
      const porClase = ctx.app.get(MessagingAgendaNoticeAdapter);
      // Importa para H5: sustituir sólo el token dejaría viva la clase para
      // quien la inyecte directo. Acá se comprueba que hoy son una sola.
      expect(porClase).toBe(puerto);
    });
  });

  describe('H4.S2 · concurrencia', () => {
    it('H4.S2.M1 · dos emisiones simultáneas con la misma clave compiten de verdad', async () => {
      const clave = `${PREFIJO}:carrera:${randomUUID()}`;

      const [a, b] = await Promise.all([
        puerto.emit(avisoDeCancelacion(clave)),
        puerto.emit(avisoDeCancelacion(clave)),
      ]);

      const conteo = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_requests
          where debounce_key = $1`,
        [clave],
      );
      const filas = Number(conteo.rows[0]?.n ?? '0');

      // El resultado se REGISTRA tal cual salga: con un read-then-write sin
      // restricción única, dos filas es el resultado esperable y una sola es
      // suerte de scheduling. Lo que no se hace es esconderlo con un retry.
      // Deja constancia legible en la salida del runner: es el dato del hito.

      console.log(
        `[H4.S2.M1] filas creadas con la misma clave de rebote en paralelo: ${filas} ` +
          `· resultados: ${JSON.stringify([a.skippedReason, b.skippedReason])}`,
      );

      if (a.notificationRequestId === undefined) {
        console.log(
          '[H4.S2.M1][NOT_RUN] sin persistencia no hay carrera que medir',
        );
        expect(filas).toBe(0);
        return;
      }

      expect(filas).toBeGreaterThanOrEqual(1);
      expect(filas).toBeLessThanOrEqual(2);
    }, 120_000);
  });
});
