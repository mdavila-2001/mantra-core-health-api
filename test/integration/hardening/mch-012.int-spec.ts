import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FIX,
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  ensureTestSession,
  type TestContext,
} from '../harness';
import { SEED, TokenService } from '../../../src/common';

/**
 * MCH-012 · `MedicalGroupsModule` publicado en la aplicación real.
 *
 * El módulo existía entero y nadie lo importaba: sus ocho rutas respondían
 * 404 de Express, el mismo que da una ruta mal escrita. Acá se arranca el
 * `AppModule` completo y se pregunta por HTTP, porque la metadata de
 * `app.module.wiring.spec.ts` dice que el módulo está en el grafo, pero no
 * que Nest haya montado el controlador con sus guards.
 *
 * Solo lee: ninguna de estas peticiones crea un grupo.
 */
describe('MCH-012 · rutas de grupos médicos publicadas (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  /** Token del admin de pruebas con los roles y perfil que se le pidan. */
  async function tokenCon(
    sid: string,
    roles: string[],
    practitionerProfileId?: string,
  ): Promise<string> {
    await ensureTestSession(ctx.orm, TEST_ADMIN_ID, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(TEST_ADMIN_ID, sid, roles, [SEED.tenantId], {
        practitionerProfileId,
      });
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · un profesional lista sus grupos: la ruta existe y responde', async () => {
    const token = await tokenCon(
      'mch012-practitioner',
      ['PRACTITIONER'],
      FIX.practPerson,
    );

    const res = await http()
      .get('/medical-groups?tab=historico')
      .set(bearer(token))
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('nextCursor');
  });

  it('AC01 · el contrato OpenAPI de la app real contiene las ocho rutas', () => {
    const document = SwaggerModule.createDocument(
      ctx.app,
      new DocumentBuilder().build(),
    );
    const operaciones = Object.entries(document.paths).flatMap(
      ([path, methods]) =>
        Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );

    expect(operaciones).toEqual(
      expect.arrayContaining([
        'GET /medical-groups',
        'POST /medical-groups',
        'GET /medical-groups/{id}',
        'GET /medical-groups/patients/{patientProfileId}/conditions',
        'POST /medical-groups/{id}/members/{memberId}/respond',
        'POST /medical-groups/{id}/reschedule-requests',
        'POST /medical-groups/{id}/reschedule-requests/respond',
        'PATCH /medical-groups/{id}/exercise-notes',
      ]),
    );
  });

  it('AC02 · un paciente recibe 403 por rol, no el 404 de un módulo ausente', async () => {
    const token = await tokenCon('mch012-patient', ['PATIENT']);

    const res = await http().get('/medical-groups').set(bearer(token));

    expect(res.status).toBe(403);
  });

  it('AC02 · una escritura con rol ajeno también se deniega antes de validar el cuerpo', async () => {
    const token = await tokenCon('mch012-patient-write', ['PATIENT']);

    const res = await http()
      .post('/medical-groups')
      .set(bearer(token))
      .send({});

    expect(res.status).toBe(403);
  });

  it('un rol clínico sin perfil profesional no pasa: 401 del servicio', async () => {
    const token = await tokenCon('mch012-no-profile', ['PRACTITIONER']);

    await http().get('/medical-groups').set(bearer(token)).expect(401);
  });

  it('sin token la ruta exige autenticación', async () => {
    await http().get('/medical-groups').expect(401);
  });
});
