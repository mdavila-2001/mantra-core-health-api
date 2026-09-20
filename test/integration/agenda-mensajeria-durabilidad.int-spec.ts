import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { EntityManager } from '@mikro-orm/postgresql';
import { AGENDA_NOTICE_PORT } from '../../src/modules/scheduling/ports/agenda-notice.port';
import { bootstrapTestApp, type TestContext } from './harness';
import type {
  AgendaNotice,
  AgendaNoticePort,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * Durabilidad, reintento y visibilidad del fallo en la relación
 * `agenda → mensajería` (carril B, H4.S3 — ADV-09).
 *
 * ## Qué se mide y qué NO se declara
 *
 * Las tres microtareas de H4.S3 quedaron `BLOQUEADO` el turno anterior con un
 * motivo correcto: **Q-06 no está decidida**, así que nadie puede decir si el
 * comportamiento observado es el que el negocio quiere. Lo que sí se podía
 * hacer —y es lo que faltaba— es **medirlo**: dejar el dato crudo para que la
 * decisión se tome sobre una observación y no sobre una suposición.
 *
 * Por eso acá no hay ni un `expect` que afirme «esto está bien». Hay
 * mediciones con su salida pegada, y aserciones sólo sobre hechos que el
 * código ya promete (que `emit` no lanza) o sobre valores observados que, de
 * cambiar, obligan a releer el hito entero.
 *
 * ## Por qué el rollback es la prueba, y no la lectura del código
 *
 * `scheduling-bookings.service.ts` documenta que el aviso se emite «después de
 * que la transacción cerró». Eso es una afirmación del autor, no una
 * observación. La forma de observarlo es **abrir una transacción, emitir
 * dentro, deshacerla y preguntar a la base desde otra conexión**: si la fila
 * sobrevive al `ROLLBACK` del negocio, la emisión no estaba en esa
 * transacción. Es medible y no admite interpretación.
 */

/** Prefijo de todo lo que crea esta suite, para poder borrarlo exacto. */
const PREFIJO = 'IT-DUR-B';

/** Conexión independiente de la que usa la app: si no, se lee su unidad de trabajo. */
function conexionIndependiente(): pg.Client {
  return new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
}

/** Cuánto trabajo durable pendiente hay ahora mismo, en las tres tablas que lo guardan. */
async function contarTrabajoPendiente(
  sql: pg.Client,
): Promise<{ outbox: number; cola: number; dlq: number }> {
  const contar = async (tabla: string): Promise<number> => {
    const { rows } = await sql.query<{ n: string }>(
      `select count(*)::text as n from ${tabla}`,
    );
    return Number(rows[0]?.n ?? '0');
  };
  return {
    outbox: await contar('messaging.outbox_messages'),
    cola: await contar('messaging.queued_jobs'),
    dlq: await contar('messaging.dead_letter_jobs'),
  };
}

/** Cuenta destinataria real, resuelta por el arnés. */
let destinatarioReal = '';

function aviso(
  debounceKey: string,
  sobreescribir: Partial<AgendaNotice> = {},
): AgendaNotice {
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { userId: destinatarioReal },
    subject: 'Tu cita fue cancelada',
    bodyText: 'El profesional canceló la cita.',
    relatedResourceType: 'scheduling.bookings',
    relatedResourceId: randomUUID(),
    payload: { route: '/schedule?vista=citas' },
    debounceKey,
    ...sobreescribir,
  };
}

describe('Durabilidad del aviso de agenda (H4.S3 · ADV-09)', () => {
  let ctx: TestContext;
  let puerto: AgendaNoticePort;
  let em: EntityManager;
  let sql: pg.Client;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    puerto = ctx.app.get<AgendaNoticePort>(AGENDA_NOTICE_PORT);
    em = ctx.app.get(EntityManager);
    destinatarioReal = ctx.adminUserId;
    sql = conexionIndependiente();
    await sql.connect();
  }, 300_000);

  afterAll(async () => {
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

  describe('H4.S3.M1 · ¿la intención queda en la MISMA transacción del negocio?', () => {
    it('la solicitud sobrevive —o no— al ROLLBACK de la transacción que la emitió', async () => {
      const clave = `${PREFIJO}:rollback:${randomUUID()}`;
      const motivoDelRollback = 'el negocio se cayo despues de emitir';

      // El negocio abre su transacción, emite el aviso dentro, y se cae.
      await expect(
        em.fork().transactional(async () => {
          await puerto.emit(aviso(clave));
          throw new Error(motivoDelRollback);
        }),
      ).rejects.toThrow(motivoDelRollback);

      // La pregunta se hace desde AFUERA: la conexión de la app no sirve para
      // esto, porque su transacción es justamente la que se deshizo.
      const { rows } = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_requests
          where debounce_key = $1`,
        [clave],
      );
      const sobrevivientes = Number(rows[0]?.n ?? '0');

      // Y el contraste, que es lo que vuelve legible el número de arriba: el
      // MISMO aviso emitido sin transacción ambiente alrededor —que es la
      // forma en que lo llama el negocio— sí deja su fila.
      const claveSuelta = `${PREFIJO}:suelta:${randomUUID()}`;
      await puerto.emit(aviso(claveSuelta));
      const sueltas = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_requests
          where debounce_key = $1`,
        [claveSuelta],
      );

      console.log(
        `[H4.S3.M1] filas tras el ROLLBACK del negocio: ${sobrevivientes} · ` +
          `filas emitiendo sin transacción ambiente: ${sueltas.rows[0]?.n ?? '0'} · ` +
          `0 y 1 significan que el puerto SE SUMA a la transacción de quien lo llama`,
      );

      // Medición, no preferencia. El valor observado es 0, y dice algo que no
      // estaba escrito en ningún lado: **el puerto es transaccional cuando hay
      // transacción**. Deshacer el negocio deshace el aviso.
      //
      // Lo que ADV-09 pide («la intención queda registrada en la misma
      // transacción del negocio») es entonces alcanzable SIN tocar el puerto:
      // hoy no se cumple sólo porque `avisarCambio` se invoca a propósito
      // después del commit, con un `em.fork()` propio
      // (`scheduling-bookings.service.ts`, comentario del método). Cuál de las
      // dos es la correcta es Q-06, y sigue sin decidirse.
      expect(sobrevivientes).toBe(0);
      expect(Number(sueltas.rows[0]?.n ?? '0')).toBe(1);
    }, 180_000);

    it('emitir NO deja ninguna intención pendiente en outbox ni en la cola de trabajos', async () => {
      const clave = `${PREFIJO}:outbox:${randomUUID()}`;
      const antes = await contarTrabajoPendiente(sql);

      await puerto.emit(aviso(clave));

      const despues = await contarTrabajoPendiente(sql);
      console.log(
        `[H4.S3.M1-bis] outbox_messages ${antes.outbox} → ${despues.outbox} · ` +
          `queued_jobs ${antes.cola} → ${despues.cola} · ` +
          `dead_letter_jobs ${antes.dlq} → ${despues.dlq}`,
      );

      // Es el dato que Q-06 necesita: la relación NO usa el patrón outbox que
      // el propio módulo 35 tiene disponible. Lo que se escribe es el efecto
      // (la solicitud), no la intención de producirlo.
      expect(despues.outbox).toBe(antes.outbox);
      expect(despues.cola).toBe(antes.cola);
    }, 180_000);
  });

  describe('H4.S3.M2 · reiniciar el procesamiento', () => {
    it('reemitir el mismo aviso tras un «reinicio» del proceso no duplica el efecto', async () => {
      const clave = `${PREFIJO}:reinicio:${randomUUID()}`;

      // Primera pasada: el proceso original.
      const primera = await puerto.emit(aviso(clave));

      // El «reinicio»: otra composición de la app, como la que haría un worker
      // que arranca de nuevo. No se reutiliza el puerto anterior a propósito.
      const otroContexto = await bootstrapTestApp();
      try {
        const puertoReiniciado =
          otroContexto.app.get<AgendaNoticePort>(AGENDA_NOTICE_PORT);
        const segunda = await puertoReiniciado.emit(aviso(clave));

        const { rows } = await sql.query<{ n: string }>(
          `select count(*)::text as n from messaging.notification_requests
            where debounce_key = $1`,
          [clave],
        );
        const filas = Number(rows[0]?.n ?? '0');

        console.log(
          `[H4.S3.M2] tras reiniciar el procesamiento: filas=${filas} · ` +
            `primera=${String(primera.delivered)} · segunda=${String(segunda.delivered)} ` +
            `· motivo de la segunda=${segunda.skippedReason ?? '—'}`,
        );

        // El reintento es idempotente por la clave de rebote, que es lo que
        // H4.S1 ya había medido — pero acá cruzando un reinicio de proceso.
        expect(filas).toBe(1);
      } finally {
        await otroContexto.app.close();
      }
    }, 300_000);
  });

  describe('H4.S3.M3 · ¿alguien se entera del fallo terminal?', () => {
    it('un aviso que no se puede entregar no deja rastro durable para nadie', async () => {
      const clave = `${PREFIJO}:terminal:${randomUUID()}`;
      const antes = await contarTrabajoPendiente(sql);

      // Un destinatario que no existe: no hay cuenta de portal que resolver.
      // El puerto promete no lanzar, así que el fallo tiene que aparecer en
      // otro lado... o en ninguno, que es lo que se está midiendo.
      const resultado = await puerto.emit(
        aviso(clave, { recipient: { userId: randomUUID() } }),
      );

      const despues = await contarTrabajoPendiente(sql);
      const solicitudes = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_requests
          where debounce_key = $1`,
        [clave],
      );
      const entregas = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.notification_deliveries d
           join messaging.notification_requests r on r.id = d.notification_request_id
          where r.debounce_key = $1`,
        [clave],
      );

      console.log(
        `[H4.S3.M3] delivered=${String(resultado.delivered)} · ` +
          `motivo="${resultado.skippedReason ?? '—'}" · ` +
          `solicitudes=${solicitudes.rows[0]?.n ?? '0'} · ` +
          `entregas=${entregas.rows[0]?.n ?? '0'} · ` +
          `dead_letter_jobs ${antes.dlq} → ${despues.dlq}`,
      );

      // Lo que el puerto promete, y se comprueba: no lanza.
      expect(resultado.delivered).toBe(false);
      expect(resultado.skippedReason).toBeDefined();

      // Lo que se MIDE, sin juzgarlo: el fallo no llegó a la cola de muertos.
      // Si Q-06 se resuelve como «durable», este número tiene que cambiar y
      // este test es el que lo va a señalar.
      expect(despues.dlq).toBe(antes.dlq);
    }, 180_000);
  });
});
