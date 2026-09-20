import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import pg from 'pg';
import { AppModule } from '../../src/app.module';
import { MESSAGING_SEED } from '../../src/common/seed/messaging-seed.service';
import { NotificationsService } from '../../src/modules/messaging/services';
import { MessagingAgendaNoticeAdapter } from '../../src/modules/scheduling/adapters/messaging-agenda-notice.adapter';
import { AGENDA_NOTICE_PORT } from '../../src/modules/scheduling/ports/agenda-notice.port';
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
 * Cuenta destinataria: una **real**, leída de `iam.users` al arrancar.
 *
 * No se usa el admin del arnés (`TEST_ADMIN_ID`) porque lo crea
 * `bootstrapTestApp`, y este suite no puede usar ese arnés: aborta la suite
 * entera si **cualquier** seed falla, y en esta base falla «aseguradoras de
 * Bolivia» por una deriva ajena a esta relación (ver `REPORTE.md`, BLOQ-01).
 */
let destinatarioReal = '';

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
  let app: INestApplication;
  let puerto: AgendaNoticePort;
  let sql: pg.Client;

  beforeAll(async () => {
    process.env.ORM_SCHEMA_SYNC = 'off';
    process.env.SEED_ON_BOOT = 'false';
    process.env.RATE_LIMIT_DISABLED = 'true';

    sql = conexionIndependiente();
    await sql.connect();

    // Participante real: una cuenta que ya existe en la base, no una inventada.
    const { rows } = await sql.query<{ id: string }>(
      `select id from iam.users order by created_at limit 1`,
    );
    destinatarioReal = rows[0]?.id ?? '';
    expect(destinatarioReal).not.toBe('');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    await app.init();
    puerto = app.get<AgendaNoticePort>(AGENDA_NOTICE_PORT);
  }, 180_000);

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
    await app.close();
  }, 120_000);

  describe('H3.S1.M1 · qué participantes reales están disponibles hoy', () => {
    it('el canal IN_APP que el adaptador direcciona NO es el que la base tiene', async () => {
      const porCodigo = await sql.query<{ id: string }>(
        `select id from messaging.message_channels where code = 'IN_APP'`,
      );
      const porId = await sql.query(
        `select id from messaging.message_channels where id = $1`,
        [MESSAGING_SEED.inAppChannelId],
      );

      // La base, cargada con el paquete de seeds, tiene el canal por código…
      expect(porCodigo.rowCount).toBe(1);
      // …pero NO con el id que el adaptador usa literalmente en `createRequest`.
      // Es el hallazgo HALL-02: el seed del backend ya esquiva esta divergencia
      // buscando por código (`messaging-seed.service.ts`, `seedInAppChannel`),
      // y el adaptador no la esquiva.
      expect(porId.rowCount).toBe(0);
      expect(porCodigo.rows[0]?.id).not.toBe(MESSAGING_SEED.inAppChannelId);

      console.log(
        `[H3.S1.M1] canal IN_APP en base: ${porCodigo.rows[0]?.id} · ` +
          `el que direcciona el adaptador: ${MESSAGING_SEED.inAppChannelId}`,
      );
    }, 60_000);
  });

  describe('H3.S1.M1-bis · la causa de HALL-02, demostrada y no supuesta', () => {
    it('la MISMA solicitud que falla con el id derivado, funciona con el id que la base tiene', async () => {
      // Hipótesis: lo único que impide la emisión es el id del canal.
      // Se mata con el experimento más barato: pedirle a mensajería la misma
      // solicitud dos veces, cambiando SÓLO el channelId.
      //
      // No se toca `src/`: se llama al servicio real desde el test.
      const notifications = app.get(NotificationsService);
      const actor = { id: destinatarioReal, roles: ['SYSTEM'] };

      const { rows } = await sql.query<{ id: string }>(
        `select id from messaging.message_channels where code = 'IN_APP'`,
      );
      const canalDeLaBase = rows[0]?.id ?? '';

      const dtoBase = {
        recipientUserId: destinatarioReal,
        payloadJson: { kind: 'BOOKING_STATE_CHANGED' },
        relatedResourceType: 'scheduling.bookings',
        priority: 4,
      };

      // 1. Con el id que el adaptador deriva: tiene que fallar.
      let errorConIdDerivado: string | null = null;
      try {
        await notifications.createRequest(
          {
            ...dtoBase,
            channelId: MESSAGING_SEED.inAppChannelId,
            debounceKey: `${PREFIJO}:causa:derivado:${randomUUID()}`,
          } as never,
          actor as never,
        );
      } catch (e: unknown) {
        errorConIdDerivado = e instanceof Error ? e.message : String(e);
      }

      // 2. Con el id que la base tiene: ¿alcanza con eso?
      const clave = `${PREFIJO}:causa:base:${randomUUID()}`;
      let errorConIdDeLaBase: string | null = null;
      try {
        await notifications.createRequest(
          { ...dtoBase, channelId: canalDeLaBase, debounceKey: clave } as never,
          actor as never,
        );
      } catch (e: unknown) {
        errorConIdDeLaBase = e instanceof Error ? e.message : String(e);
      }

      console.log(
        `[H3.S1.M1-bis] con id derivado: ${String(errorConIdDerivado)} · ` +
          `con id de la base: ${String(errorConIdDeLaBase)}`,
      );

      // Capa 1: el id que el adaptador deriva no existe.
      expect(errorConIdDerivado).toBe('Canal no encontrado');

      // Capa 2 — y ésta es la que mata el arreglo fácil: aun usando el id que
      // la base tiene, mensajería lo rechaza por INACTIVO. El canal está activo
      // por código y no lo está por uuid.
      expect(errorConIdDeLaBase).toBe('El canal no está activo');

      // Capa 3, la causa de las dos: `terminology.catalog_concepts` tiene DOS
      // filas con code='ACTIVE'. El backend deriva una, el paquete de seeds
      // sembró la otra, y las filas de `message_channels` apuntan a la del
      // paquete. No es un id mal escrito: es que el mismo concepto existe dos
      // veces y cada mitad del sistema usa la suya.
      const activos = await sql.query<{ id: string }>(
        `select id from terminology.catalog_concepts where code = 'ACTIVE' order by id`,
      );
      expect(activos.rowCount).toBeGreaterThan(1);

      const duplicados = await sql.query<{ n: string }>(
        `select count(*)::text as n from (
           select code from terminology.catalog_concepts
            group by code having count(*) > 1) t`,
      );

      console.log(
        `[H3.S1.M1-bis] códigos de concepto duplicados en la base: ${String(duplicados.rows[0]?.n)}`,
      );
      expect(Number(duplicados.rows[0]?.n ?? '0')).toBeGreaterThan(0);
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
      const clave = `${PREFIJO}:correo:${randomUUID()}`;

      const r = await puerto.emit(avisoDeCancelacion(clave));

      if (r.emailRequestId !== undefined) {
        // Estado 1: solicitud persistida. Se comprueba en la base.
        const req = await sql.query(
          `select id from messaging.notification_requests where id = $1`,
          [r.emailRequestId],
        );
        expect(req.rowCount).toBe(1);

        // Estado 3: evidencia de entrega. NO existe: la produce el worker
        // contra el proveedor real, que en esta suite no corre.
        const entregas = await sql.query<{
          provider_message_ref: string | null;
        }>(
          `select provider_message_ref from messaging.notification_deliveries
            where notification_request_id = $1`,
          [r.emailRequestId],
        );
        const conRef = entregas.rows.filter(
          (e) => e.provider_message_ref !== null,
        );
        expect(conRef).toHaveLength(0);
      } else if (r.emailSkippedReason !== undefined) {
        // El otro resultado legítimo: la cuenta no declaró correo, o mensajería
        // no pudo encolar. Se informa aparte y no degrada el in-app.
        expect(r.emailSkippedReason).toBeTruthy();
      } else {
        // Tercer camino, el que esta base produce: el in-app falló ANTES de
        // llegar al correo, así que el correo ni se evaluó. El resultado no
        // trae ningún campo de correo — ni id, ni motivo.
        //
        // Esto es información del contrato que conviene fijar: `emit` puede
        // devolver un resultado SIN ninguna señal del canal correo, y leer esa
        // ausencia como «no hacía falta correo» sería falso.

        console.log(
          '[H3.S2.M2][NOT_RUN] el correo no se evaluó: el in-app falló antes. ' +
            `resultado: ${JSON.stringify(r)}`,
        );
        expect(r.delivered).toBe(false);
        expect(r.skippedReason).toBeTruthy();
        expect(r.emailRequestId).toBeUndefined();
      }
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
      const porClase = app.get(MessagingAgendaNoticeAdapter);
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
