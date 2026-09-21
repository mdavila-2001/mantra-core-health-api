import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS } from '../../../src/common';
import { DIR } from '../../../src/modules/directory/directory.concepts';
import { PROF } from '../../../src/modules/profiles/profiles.concepts';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from '../harness';

/**
 * MCH-001 · un rol con ámbito de tenant no autoriza fuera de ese tenant.
 *
 * Un profesional recibe `CLINICIAN` sólo en el tenant A (asignación de
 * `authz`, con `tenantId`). Además tiene membresía ordinaria en B — la
 * pertenencia a una organización, por sí sola, no concede el rol. La misma
 * ruta (`GET /charts/templates`, gateada por `@Roles('CLINICIAN', ...)`) tiene
 * que permitirlo en A y denegarlo en B.
 *
 * No trunca ni borra: cada organización y usuario lleva un sufijo propio.
 */
describe('MCH-001 · roles con ámbito de tenant (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  /** Registra una organización nueva; devuelve su tenant y a su dueño. */
  async function registrarOrganizacion(
    codigo: string,
  ): Promise<{ tenantId: string; ownerUserId: string }> {
    const email = `mch001-${codigo.toLowerCase()}-${sufijo}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `MCH001_${codigo}_${sufijo}`,
          legalName: `Clínica ${codigo} ${sufijo} S.R.L.`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email, password: PASSWORD, name: 'Owner', lastName: codigo },
      })
      .expect(201);
    return { tenantId: res.body.tenantId, ownerUserId: res.body.ownerUserId };
  }

  async function login(nationalId: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    return res.body.accessToken as string;
  }

  it('AC01 · el mismo rol autoriza en A y deniega en B', async () => {
    const a = await registrarOrganizacion(`A${sufijo.slice(0, 3)}`);
    const b = await registrarOrganizacion(`B${sufijo.slice(0, 3)}`);

    // Cuenta nueva sin ningún rol clínico global: si se usara un profesional
    // registrado, el rol global PRACTITIONER ya autorizaría en cualquier
    // tenant y el caso no probaría nada (charts/templates también lo acepta).
    // Una paciente sin ningún grant de authz es el sujeto correcto: la única
    // vía de autorización posible es la asignación con ámbito que se prueba.
    const nationalId = `MCH001-${sufijo}`;
    const email = `mch001-medico-${sufijo}@example.test`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: 'Paciente MCH-001',
        email,
      })
      .expect(201);
    const preToken = await login(nationalId);
    const claims = JSON.parse(
      Buffer.from(preToken.split('.')[1], 'base64url').toString('utf8'),
    );
    const medicoId = claims.sub as string;

    // Antes de tocar authz: sin rol clínico en ningún tenant, la ruta rechaza.
    await http()
      .get('/charts/templates')
      .set(bearer(preToken))
      .set('X-Tenant-Id', a.tenantId)
      .expect(403);

    // Membresía ordinaria en A y B (staff, sin rol de authz todavía).
    for (const org of [a, b]) {
      await sql(
        `insert into directory.tenant_memberships
           (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id,
            access_scope_concept_id, start_date, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), now(), now())`,
        [
          medicoId,
          org.tenantId,
          DIR.ROLE_STAFF,
          DIR.MEMBERSHIP_ACTIVE,
          DIR.SCOPE_ALL_TENANT,
        ],
      );
    }

    // CLINICIAN asignado con authz, con ámbito: SÓLO en el tenant A.
    const [role] = await sql<{ id: string }>(
      "select id from authz.roles where code = 'CLINICIAN'",
    );
    await sql(
      `insert into authz.user_role_assignments
         (id, user_id, role_id, tenant_id, status_concept_id, created_at, updated_at)
       values (gen_random_uuid(), ?, ?, ?, ?, now(), now())`,
      [medicoId, role.id, a.tenantId, CONCEPTS.STATE_ACTIVE],
    );

    const token = await login(nationalId);
    const tokenClaims = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    );
    expect(tokenClaims.roles).toContain('CLINICIAN');
    expect(tokenClaims.scopedRoles).toEqual({
      [a.tenantId]: ['CLINICIAN'],
    });

    // Permitido en el tenant donde se concedió.
    await http()
      .get('/charts/templates')
      .set(bearer(token))
      .set('X-Tenant-Id', a.tenantId)
      .expect(200);

    // Denegado en el tenant donde sólo hay membresía ordinaria — el defecto
    // que describe MCH-001 era exactamente que esto pasara con 200.
    await http()
      .get('/charts/templates')
      .set(bearer(token))
      .set('X-Tenant-Id', b.tenantId)
      .expect(403);
  });
});
