import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS } from '../../../src/common';
import { PROF } from '../../../src/modules/profiles/profiles.concepts';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';

/**
 * MCH-034 · el lookup de una asignación existente debe respetar el ámbito.
 *
 * `POST /authz/users/:userId/role-assignments` conceder el mismo rol a la
 * misma persona en dos tenants distintos son dos altas legítimas, no una
 * repetición. Antes, `findActive` sólo miraba `(userId, roleId)`: la segunda
 * alta rebotaba con 409 "ya asignado" aunque el ámbito pedido fuera otro — el
 * mismo defecto que, del otro lado, dejaba a MCH-001 sin forma administrable
 * de crear el escenario que corrige (rol sólo en A, no en B).
 *
 * No trunca ni borra: cada organización y persona llevan un sufijo propio.
 */
describe('MCH-034 · alta de rol respeta el ámbito exacto (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  async function registrarOrganizacion(codigo: string): Promise<string> {
    const email = `mch034-${codigo.toLowerCase()}-${sufijo}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `MCH034_${codigo}_${sufijo}`,
          legalName: `Clínica ${codigo} ${sufijo} S.R.L.`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email, password: PASSWORD, name: 'Owner', lastName: codigo },
      })
      .expect(201);
    return res.body.tenantId as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('el mismo rol en A y en B produce dos asignaciones, no un conflicto', async () => {
    const tenantA = await registrarOrganizacion(`A${sufijo.slice(0, 3)}`);
    const tenantB = await registrarOrganizacion(`B${sufijo.slice(0, 3)}`);

    const email = `mch034-medico-${sufijo}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: PASSWORD,
        name: 'Medico',
        lastName: 'MCH034',
        licenseNumber: `LIC-MCH034-${sufijo}`,
        credentialNumber: `CRED-MCH034-${sufijo}`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const claims = JSON.parse(
      Buffer.from(login.body.accessToken.split('.')[1], 'base64url').toString(
        'utf8',
      ),
    );
    const userId = claims.sub as string;

    // Primera alta: CLINICIAN en el tenant A.
    const primera = await http()
      .post(`/authz/users/${userId}/role-assignments`)
      .set(bearer(ctx.adminToken))
      .send({ roleCode: 'CLINICIAN', tenantId: tenantA })
      .expect(201);

    // Segunda alta: el MISMO rol, en el tenant B. Con el defecto de MCH-034
    // esto devolvía 409 y la asignación en B nunca se creaba.
    const segunda = await http()
      .post(`/authz/users/${userId}/role-assignments`)
      .set(bearer(ctx.adminToken))
      .send({ roleCode: 'CLINICIAN', tenantId: tenantB })
      .expect(201);

    expect(primera.body.id).not.toBe(segunda.body.id);

    // Repetir la alta EXACTA en A sí es un duplicado real.
    await http()
      .post(`/authz/users/${userId}/role-assignments`)
      .set(bearer(ctx.adminToken))
      .send({ roleCode: 'CLINICIAN', tenantId: tenantA })
      .expect(409);

    const filas = await sql<{ tenant_id: string }>(
      `select tenant_id from authz.user_role_assignments
        where id in (?, ?) order by tenant_id`,
      [primera.body.id, segunda.body.id],
    );
    expect(filas.map((f) => f.tenant_id).sort()).toEqual(
      [tenantA, tenantB].sort(),
    );
  });
});
