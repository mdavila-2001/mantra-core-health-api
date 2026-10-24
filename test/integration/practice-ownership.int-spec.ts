import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';
import { createdBy } from '../../src/common';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PractitionerRoleAssignments } from '../../src/modules/practice/entities';

/**
 * Hallazgo de auditoría 2026-10-23 · un médico sólo ve las prácticas con las
 * que tiene una vinculación ACTIVE.
 *
 * Todos los médicos auto-registrados viven en el tenant compartido `DEFAULT`,
 * así que el aislamiento por tenant no los separa entre sí: un médico recién
 * registrado veía en «Mis organizaciones» la ficha de una práctica ajena
 * —código, plantilla, legajo e inventario—. Esta suite fija, contra la base
 * real, que `GET /practices` lo filtra y que la consola de organización
 * responde el mismo 404 que a una práctica inexistente.
 */
describe('Prácticas · el médico sólo ve aquéllas con vinculación ACTIVE', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const medico = {
    email: `own-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  let practiceId = '';
  let assignmentId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function idsListados(token: string): Promise<string[]> {
    const res = await http()
      .get('/practices')
      .set(bearer(token))
      .set('X-Tenant-Id', medico.tenantId)
      .expect(200);
    return (res.body as Array<{ id: string }>).map((p) => p.id);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Iván',
        lastName: 'Rojas',
        licenseNumber: `LIC-OWN-${sufijo}`,
        credentialNumber: `CRED-OWN-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    // Una práctica de otro médico en el mismo tenant compartido.
    const practica = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', medico.tenantId)
      .send({
        tenantId: medico.tenantId,
        code: `OWN-AJENA-${sufijo}`,
        name: `Consultorio ajeno ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practiceId = practica.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('sin vinculación: no la lista y la consola responde 404', async () => {
    expect(await idsListados(medico.token)).not.toContain(practiceId);
    await http()
      .get(`/practices/${practiceId}/organization`)
      .set(bearer(medico.token))
      .set('X-Tenant-Id', medico.tenantId)
      .expect(404);
  });

  it('con vinculación PENDING: sigue sin verla', async () => {
    const em = ctx.orm.em.fork();
    const fila = em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId: medico.hpid,
        practiceId,
        roleConceptId: PRAC.ROLE_ATTENDING,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    assignmentId = fila.id;

    expect(await idsListados(medico.token)).not.toContain(practiceId);
    await http()
      .get(`/practices/${practiceId}/organization`)
      .set(bearer(medico.token))
      .set('X-Tenant-Id', medico.tenantId)
      .expect(404);
  });

  it('con vinculación ACTIVE: la lista y ve su consola', async () => {
    const em = ctx.orm.em.fork();
    const fila = await em.findOneOrFail(PractitionerRoleAssignments, {
      id: assignmentId,
    });
    fila.statusConceptId = PRAC.ROLE_ASSIGNMENT_ACTIVE;
    await em.flush();

    expect(await idsListados(medico.token)).toContain(practiceId);
    const res = await http()
      .get(`/practices/${practiceId}/organization`)
      .set(bearer(medico.token))
      .set('X-Tenant-Id', medico.tenantId)
      .expect(200);
    expect(res.body.organization.code).toBe(`OWN-AJENA-${sufijo}`);
  });

  it('el administrador la ve siempre', async () => {
    expect(await idsListados(ctx.adminToken)).toContain(practiceId);
  });
});
