import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  ensureTestSession,
  type TestContext,
} from '../harness';
import { CONCEPTS, SEED, TokenService } from '../../../src/common';
import { CLIN } from '../../../src/modules/clinical/clinical.concepts';
import { PROF } from '../../../src/modules/profiles/profiles.concepts';
import {
  ClinicalNotificationsService,
  ServiceRequestsService,
} from '../../../src/modules/clinical/services';

/**
 * MCH-027 · crear una orden deja un hecho durable y un aviso al paciente,
 * atados al commit de la orden.
 *
 * Contra PostgreSQL, porque lo que se prueba es transaccional: que el evento
 * del outbox y la notificación existan si y sólo si la orden existe, y que
 * una emisión que falla deshaga su savepoint sin abortar la transacción de la
 * orden — un doble del `EntityManager` no tiene savepoints.
 *
 * El paciente es una cuenta nueva por corrida (usuario, persona, perfil y
 * vínculo SELF activo): sin cuenta no hay bandeja donde avisar.
 */
describe('MCH-027 · la orden clínica avisa al paciente (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const pacienteUserId = randomUUID();
  const paciente = randomUUID();
  const actor = { id: TEST_ADMIN_ID, roles: ['SUPERADMIN'] } as never;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  const contar = async (query: string, params: unknown[]) => {
    const [fila] = await sql<{ n: string }>(query, params);
    return Number(fila.n);
  };
  const eventosDe = (serviceRequestId: string) =>
    contar(
      `select count(*)::text as n from messaging.domain_events
        where aggregate_id = ? and event_type = 'ServiceRequestPlaced'`,
      [serviceRequestId],
    );
  const avisosDe = (serviceRequestId: string) =>
    contar(
      `select count(*)::text as n from messaging.in_app_notifications
        where recipient_user_id = ? and related_resource_type = 'SERVICE_REQUEST'
          and related_resource_id = ?`,
      [pacienteUserId, serviceRequestId],
    );
  const ordenesConId = (serviceRequestId: string) =>
    contar(
      'select count(*)::text as n from clinical.service_requests where id = ?',
      [serviceRequestId],
    );

  function crearOrden() {
    return http()
      .post('/clinical/service-requests')
      .set({ ...bearer(ctx.adminToken), 'X-Tenant-Id': SEED.tenantId })
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId: paciente,
        codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      });
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    await sql(
      `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at)
       values (?, ?, ?, now(), now())`,
      [pacienteUserId, CONCEPTS.USER_ACTIVE, `MCH-027 paciente ${sufijo}`],
    );
    await sql(
      `insert into profiles.persons (id, person_status_concept_id, created_at, updated_at)
       values (?, ?, now(), now())`,
      [paciente, CONCEPTS.STATE_ACTIVE],
    );
    await sql(
      `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at)
       values (?, ?, now(), now())`,
      [paciente, `MCH027-${sufijo}`],
    );
    await sql(
      `insert into profiles.person_account_links
         (id, person_id, user_id, link_type_concept_id, verification_status_concept_id,
          valid_from, status_concept_id, created_at, updated_at)
       values (gen_random_uuid(), ?, ?, ?, ?, now(), ?, now(), now())`,
      [
        paciente,
        pacienteUserId,
        PROF.ACCOUNT_LINK_SELF,
        PROF.ACCOUNT_LINK_VERIFIED,
        PROF.ACCOUNT_LINK_ACTIVE,
      ],
    );
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · el commit de la orden deja exactamente un evento y un aviso', async () => {
    const res = await crearOrden().expect(201);
    const id = res.body.id as string;

    expect(await ordenesConId(id)).toBe(1);
    expect(await eventosDe(id)).toBe(1);
    expect(await avisosDe(id)).toBe(1);
  });

  it('AC01 · si la transacción de afuera hace rollback no queda orden, ni evento, ni aviso', async () => {
    // El caso real es `PeriopPreopService`, que crea la orden dentro de su
    // propia transacción: acá la de afuera se deshace después de que `create`
    // ya terminó y ya «avisó».
    const service = ctx.app.get(ServiceRequestsService, { strict: false });
    let id = '';
    await expect(
      ctx.orm.em.fork().transactional(async () => {
        const orden = await service.create(
          {
            custodianTenantId: SEED.tenantId,
            patientProfileId: paciente,
            codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
          },
          actor,
          { duplicatePolicy: 'skip' },
        );
        id = orden.id;
        throw new Error('rollback de la transacción de afuera');
      }),
    ).rejects.toThrow('rollback de la transacción de afuera');

    expect(id).not.toBe('');
    expect(await ordenesConId(id)).toBe(0);
    expect(await eventosDe(id)).toBe(0);
    expect(await avisosDe(id)).toBe(0);
  });

  it('AC02 · volver a emitir el aviso de la misma orden no suma otro visible', async () => {
    const res = await crearOrden().expect(201);
    const id = res.body.id as string;

    const avisos = ctx.app.get(ClinicalNotificationsService, {
      strict: false,
    });
    await avisos.serviceRequestPlaced(id, paciente, TEST_ADMIN_ID);
    await avisos.serviceRequestPlaced(id, paciente, TEST_ADMIN_ID);

    expect(await avisosDe(id)).toBe(1);
  });

  it('AC03 · con el canal de avisos caído la orden se crea igual y el paciente la ve', async () => {
    const canales = await sql<{ id: string; state_concept_id: string }>(
      `select id, state_concept_id from messaging.message_channels
        where channel_type_concept_id = ?`,
      [CONCEPTS.CHANNEL_TYPE_IN_APP],
    );
    expect(canales.length).toBeGreaterThan(0);

    let id = '';
    try {
      await sql(
        `update messaging.message_channels set state_concept_id = ?
          where channel_type_concept_id = ?`,
        [CONCEPTS.STATE_REVOKED, CONCEPTS.CHANNEL_TYPE_IN_APP],
      );

      const res = await crearOrden().expect(201);
      id = res.body.id as string;
    } finally {
      for (const canal of canales) {
        await sql(
          'update messaging.message_channels set state_concept_id = ? where id = ?',
          [canal.state_concept_id, canal.id],
        );
      }
    }

    // La emisión falló dentro de su savepoint: la orden y su evento quedaron.
    expect(await ordenesConId(id)).toBe(1);
    expect(await eventosDe(id)).toBe(1);
    expect(await avisosDe(id)).toBe(0);

    // Y el paciente la encuentra en su lista de órdenes, sin aviso de por medio.
    const sid = `mch027-paciente-${sufijo}`;
    await ensureTestSession(ctx.orm, pacienteUserId, sid);
    const token = ctx.app
      .get(TokenService)
      .signAccessToken(pacienteUserId, sid, ['PATIENT'], [SEED.tenantId], {
        patientProfileId: paciente,
      });
    const propias = await http()
      .get('/diagnostic-results/me/orders')
      .set(bearer(token))
      .expect(200);
    expect(
      (propias.body.items as Array<{ id: string }>).map((item) => item.id),
    ).toContain(id);
  });
});
