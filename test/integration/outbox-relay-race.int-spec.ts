import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { OutboxService } from '../../src/modules/messaging/services';

/**
 * `FOR UPDATE SKIP LOCKED` con DOS transacciones reales disputando el mismo
 * lote, no una prueba secuencial que confía en el código: el resto de la
 * suite prueba el relay una llamada a la vez, lo que nunca ejercita la
 * garantía real que `SKIP LOCKED` promete (dos relays concurrentes se
 * reparten el lote sin publicar el mismo mensaje dos veces).
 */
describe('Outbox relay — carrera real con dos conexiones (integración)', () => {
  let ctx: TestContext;
  let outboxService: OutboxService;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    outboxService = ctx.app.get(OutboxService);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  /**
   * Publica `count` eventos reales (misma tx, un mensaje de outbox cada uno)
   * y devuelve sus ids. Se rastrean los ids propios en vez de asumir que el
   * outbox está vacío: otra corrida previa (sin `--reset`) puede haber dejado
   * mensajes pendientes ajenos, y la aserción de la carrera no debe depender
   * de eso.
   */
  async function seedPendingMessages(count: number): Promise<string[]> {
    const em = ctx.orm.em.fork();
    const ids: string[] = [];
    await em.transactional(async (tx) => {
      for (let i = 0; i < count; i++) {
        const result = await outboxService.publishDomainEvent(tx, {
          eventType: 'IntegrationTest.RaceProbe',
          aggregateType: 'race_probe',
          aggregateId: randomUUID(),
          payloadJson: { i },
        });
        ids.push(result.outboxMessageId);
      }
    });
    return ids;
  }

  it('dos llamadas concurrentes al relay se reparten el lote sin publicar ningún mensaje dos veces', async () => {
    const TOTAL = 20;
    const seededIds = await seedPendingMessages(TOTAL);

    // batchSize al máximo permitido (500): cualquier mensaje pendiente ajeno
    // que ya existiera en la base no debe dejar al propio sin reclamar en
    // ninguna de las dos pasadas.
    const batchSize = 500;

    // Dos peticiones HTTP reales en paralelo (cada una abre su propia conexión
    // y transacción): si `SKIP LOCKED` no funcionara, ambas reclamarían las
    // mismas filas y un mismo id propio aparecería reclamado en las dos
    // respuestas, o se quedaría sin reclamar en ninguna.
    const [resA, resB] = await Promise.all([
      http()
        .post('/internal/outbox/relay/run')
        .set(bearer(ctx.adminToken))
        .send({ workerId: 'race-a', batchSize }),
      http()
        .post('/internal/outbox/relay/run')
        .set(bearer(ctx.adminToken))
        .send({ workerId: 'race-b', batchSize }),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const idsA: string[] = resA.body.messages.map((m: { id: string }) => m.id);
    const idsB: string[] = resB.body.messages.map((m: { id: string }) => m.id);

    const ownIdsA = seededIds.filter((id) => idsA.includes(id));
    const ownIdsB = seededIds.filter((id) => idsB.includes(id));

    // Cada mensaje propio quedó reclamado por exactamente UNA de las dos
    // pasadas (ni las dos, ni ninguna).
    for (const id of seededIds) {
      const inA = ownIdsA.includes(id);
      const inB = ownIdsB.includes(id);
      expect(inA !== inB).toBe(true);
    }
    expect(ownIdsA.length + ownIdsB.length).toBe(seededIds.length);
  });
});
