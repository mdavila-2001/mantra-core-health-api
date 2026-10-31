import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * La bandeja de una farmacia en la mensajería, de punta a punta contra la app
 * y la base reales.
 *
 * Fija lo que las unitarias no pueden demostrar porque la membresía la decide
 * un doble: que la **membresía activa en la base** (y no la titularidad del
 * perfil) es lo que deja al personal leer y responder como la vitrina de la
 * farmacia, y que conocer el `profileId` de la vitrina no alcanza.
 *
 * Recorrido: alta real de una farmacia (owner con membresía OWNER),
 * verificación por la plataforma (proyecta la vitrina PHARMACY pública), un
 * paciente con perfil privado le escribe, el owner lista y contesta como la
 * farmacia, y otro usuario sin membresía recibe 403.
 *
 * NOTA: escrito sin Postgres disponible en la sesión que lo creó; no se
 * ejecutó todavía.
 */
describe('Bandeja de farmacia en la mensajería (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';

  let farmaciaTenantId: string;
  let farmaciaToken: string;
  let vitrinaFarmaciaId: string;
  let pacienteToken: string;
  let pacienteProfileId: string;
  let ajenoToken: string;
  let conversationId: string;

  async function registrarPaciente(etiqueta: string): Promise<string> {
    const nationalId = `CI-FARM-${etiqueta}-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        name: 'Iván',
        lastName: 'Mamani',
        email: `farm-${etiqueta}-${sufijo}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    return login.body.accessToken as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    // 1. La farmacia, con su owner (membresía OWNER activa).
    const emailOwner = `farm-owner-${sufijo}@example.test`;
    const org = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `FARM_${sufijo.toUpperCase()}`,
          legalName: `Farmacia Integración ${sufijo}`,
          tenantType: 'PHARMACY',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: emailOwner,
          password,
          name: 'Rosa',
          lastName: 'Flores',
        },
      })
      .expect(201);
    farmaciaTenantId = org.body.tenantId;

    // 2. La plataforma la verifica: eso proyecta la vitrina PHARMACY pública.
    await http()
      .post(`/admin/tenants/${farmaciaTenantId}/verification`)
      .set(bearer(ctx.adminToken))
      .send({})
      .expect((res) => {
        if (res.status >= 300) throw new Error(`verify: ${res.status}`);
      });

    // El login posterior a la verificación trae `PHARMACY_STAFF`.
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: emailOwner, password })
      .expect(200);
    farmaciaToken = login.body.accessToken;

    const vitrina = await http()
      .get(`/community/profiles/by-slug/organization-${farmaciaTenantId}`)
      .set(bearer(farmaciaToken))
      .expect(200);
    vitrinaFarmaciaId = vitrina.body.id;

    // 3. El paciente, con un perfil PRIVADO (no publicado).
    pacienteToken = await registrarPaciente('pac');
    const perfil = await http()
      .put('/community/profiles/me')
      .set(bearer(pacienteToken))
      .send({
        tenantId: farmaciaTenantId,
        slug: `farm-pac-${sufijo}`,
        displayName: 'Iván Mamani',
        visibility: 'PRIVATE',
      })
      .expect(200);
    pacienteProfileId = perfil.body.id;

    // 4. Alguien sin membresía en la farmacia.
    ajenoToken = await registrarPaciente('ajeno');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el paciente puede iniciar una conversación con la vitrina de la farmacia', async () => {
    const res = await http()
      .post('/community/conversations')
      .set(bearer(pacienteToken))
      .send({ participantProfileIds: [pacienteProfileId, vitrinaFarmaciaId] })
      .expect(201);
    conversationId = res.body.id;

    // Idempotente: la segunda vez es el mismo hilo.
    const again = await http()
      .post('/community/conversations')
      .set(bearer(pacienteToken))
      .send({ participantProfileIds: [pacienteProfileId, vitrinaFarmaciaId] })
      .expect(201);
    expect(again.body.id).toBe(conversationId);

    await http()
      .post(`/community/conversations/${conversationId}/messages`)
      .set(bearer(pacienteToken))
      .send({ senderProfileId: pacienteProfileId, bodyText: '¿Tienen stock?' })
      .expect(201);
  });

  it('el personal con membresía activa lista, lee y contesta como la farmacia', async () => {
    const bandeja = await http()
      .get('/community/conversations')
      .query({ profileId: vitrinaFarmaciaId })
      .set(bearer(farmaciaToken))
      .expect(200);
    const ids = (bandeja.body.items as Array<{ id: string }>).map((c) => c.id);
    expect(ids).toContain(conversationId);

    await http()
      .get(`/community/conversations/${conversationId}/messages`)
      .query({ profileId: vitrinaFarmaciaId })
      .set(bearer(farmaciaToken))
      .expect(200);

    await http()
      .post(`/community/conversations/${conversationId}/messages`)
      .set(bearer(farmaciaToken))
      .send({ senderProfileId: vitrinaFarmaciaId, bodyText: 'Sí, hay stock.' })
      .expect(201);

    // Recarga: el paciente ve la respuesta firmada por la vitrina.
    const hilo = await http()
      .get(`/community/conversations/${conversationId}/messages`)
      .query({ profileId: pacienteProfileId })
      .set(bearer(pacienteToken))
      .expect(200);
    const autores = (hilo.body.items as Array<{ senderProfileId: string }>).map(
      (m) => m.senderProfileId,
    );
    expect(autores).toContain(vitrinaFarmaciaId);
  });

  it('sin membresía, conocer el profileId de la vitrina no alcanza', async () => {
    await http()
      .get('/community/conversations')
      .query({ profileId: vitrinaFarmaciaId })
      .set(bearer(ajenoToken))
      .expect(403);

    await http()
      .post(`/community/conversations/${conversationId}/messages`)
      .set(bearer(ajenoToken))
      .send({ senderProfileId: vitrinaFarmaciaId, bodyText: 'suplantación' })
      .expect(403);
  });

  it('el personal no inicia hilos en frío como la farmacia por el endpoint público', async () => {
    await http()
      .post('/community/conversations')
      .set(bearer(farmaciaToken))
      .send({ participantProfileIds: [vitrinaFarmaciaId, pacienteProfileId] })
      .expect(403);
  });
});
