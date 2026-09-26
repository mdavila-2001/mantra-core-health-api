import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED, CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * BR-28 · CV-13: los cuatro hubs de administración que sólo escribían ganan
 * sus listados (`delegated_access`, `auth_providers`, `identity_assurance`,
 * `health_context`), ejercidos por HTTP contra la base real.
 *
 * Foco en lo que ningún unitario con la base mockeada puede afirmar: que el SQL
 * de cada lectura corre (nombres de columna y joins reales), que el
 * aislamiento por tenant lo hace la consulta y no el cliente, y que la ficha de
 * un proveedor de identidad **nunca** trae un secreto aunque la fila lo tenga.
 */
describe('CV-13 · listados de los hubs de administración', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);
  const sql = (text: string, params: unknown[] = []) =>
    ctx.orm.em.fork().getConnection().execute(text, params);

  const sufijo = randomUUID().slice(0, 8);
  const CID = CONCEPTS.STATE_ACTIVE;
  let tenantB = '';
  const providerA = randomUUID();
  const providerB = randomUUID();
  const providerGlobal = randomUUID();
  const SECRET = `vault://secreto-${sufijo}`;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const otraOrg = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `CV13_ORG_${sufijo.toUpperCase()}`,
          legalName: `Organización B CV13 ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `cv13-owner-${sufijo}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Organización',
          lastName: 'B',
        },
      })
      .expect(201);
    tenantB = otraOrg.body.tenantId as string;
  }, 300_000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('delegated_access', () => {
    const membershipA = randomUUID();
    let membershipB = '';
    const assignmentA = randomUUID();
    const assignmentB = randomUUID();

    beforeAll(async () => {
      await sql(
        `insert into directory.tenant_memberships
           (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id,
            access_scope_concept_id, start_date, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, now(), now(), now())`,
        [membershipA, ctx.adminUserId, SEED.tenantId, CID, CID, CID],
      );
      const [row] = await sql(
        `select id from directory.tenant_memberships where tenant_id = ? limit 1`,
        [tenantB],
      );
      membershipB = row.id;
      for (const [id, membership] of [
        [assignmentA, membershipA],
        [assignmentB, membershipB],
      ]) {
        await sql(
          `insert into delegated_access.organization_user_assignments
             (id, tenant_membership_id, assignment_role_concept_id,
              access_scope_concept_id, status_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, ?, now(), now())`,
          [id, membership, CID, CID, CID],
        );
      }
    });

    it('org/user-assignments lista sólo las del tenant del contexto', async () => {
      const a = await http()
        .get('/org/user-assignments')
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      const idsA = a.body.items.map((i: { id: string }) => i.id);
      expect(idsA).toContain(assignmentA);
      expect(idsA).not.toContain(assignmentB);

      const b = await http()
        .get('/org/user-assignments')
        .set(auth())
        .set('X-Tenant-Id', tenantB)
        .expect(200);
      const idsB = b.body.items.map((i: { id: string }) => i.id);
      expect(idsB).toContain(assignmentB);
      expect(idsB).not.toContain(assignmentA);
    });

    it('la paginación keyset devuelve una fila por página y un cursor que continúa', async () => {
      const first = await http()
        .get('/org/user-assignments')
        .query({ limit: 1 })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      expect(first.body.items).toHaveLength(1);
      if (first.body.nextCursor) {
        const next = await http()
          .get('/org/user-assignments')
          .query({ limit: 1, cursor: first.body.nextCursor })
          .set(auth())
          .set('X-Tenant-Id', SEED.tenantId)
          .expect(200);
        expect(next.body.items[0].id).not.toBe(first.body.items[0].id);
      }
    });

    it('un cursor corrupto es 400, no 500', async () => {
      await http()
        .get('/org/user-assignments')
        .query({ cursor: '%%%no-es-un-cursor' })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(400);
    });

    it.each(['practitioner-delegates', 'access-requests'])(
      '%s corre su SQL y responde una página',
      async (route) => {
        const res = await http()
          .get(`/${route}`)
          .set(auth())
          .set('X-Tenant-Id', SEED.tenantId)
          .expect(200);
        expect(res.body).toMatchObject({
          count: expect.any(Number),
          limit: 50,
        });
        expect(Array.isArray(res.body.items)).toBe(true);
      },
    );
  });

  describe('auth_providers · sin secretos y aislado por tenant', () => {
    beforeAll(async () => {
      for (const [id, tenant, code] of [
        [providerA, SEED.tenantId, `cv13-a-${sufijo}`],
        [providerB, tenantB, `cv13-b-${sufijo}`],
        [providerGlobal, null, `cv13-g-${sufijo}`],
      ] as const) {
        await sql(
          `insert into auth_providers.identity_providers
             (id, tenant_id, code, name, protocol_concept_id,
              provider_category_concept_id, state_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
          [id, tenant, code, `Proveedor ${code}`, CID, CID, CID],
        );
      }
      await sql(
        `insert into auth_providers.provider_protocol_configs
           (id, provider_id, environment_concept_id, client_id, client_secret_ref,
            extra_config_json, state_concept_id, created_at, updated_at)
         values (?, ?, ?, 'cliente-publico', ?, '{"password":"no-salir"}'::jsonb, ?, now(), now())`,
        [randomUUID(), providerA, CID, SECRET, CID],
      );
    });

    it('lista los globales y los del tenant, nunca los de otro', async () => {
      const res = await http()
        .get('/auth-providers/identity-providers')
        .query({ limit: 100 })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      const ids = res.body.items.map((i: { id: string }) => i.id);
      expect(ids).toContain(providerA);
      expect(ids).toContain(providerGlobal);
      expect(ids).not.toContain(providerB);
    });

    it('la ficha trae el cliente público y jamás el secreto ni la configuración libre', async () => {
      const res = await http()
        .get(`/auth-providers/identity-providers/${providerA}`)
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      expect(res.body.protocolConfigs[0].clientId).toBe('cliente-publico');
      const texto = JSON.stringify(res.body);
      expect(texto).not.toContain(SECRET);
      expect(texto).not.toContain('no-salir');
      expect(texto).not.toContain('clientSecretRef');
    });

    it('la ficha de un proveedor de otro tenant es 404', async () => {
      await http()
        .get(`/auth-providers/identity-providers/${providerB}`)
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(404);
    });
  });

  describe('identity_assurance', () => {
    const authorityA = randomUUID();
    const authorityB = randomUUID();

    beforeAll(async () => {
      for (const [id, tenant, code] of [
        [authorityA, SEED.tenantId, `AUT-A-${sufijo}`],
        [authorityB, tenantB, `AUT-B-${sufijo}`],
      ] as const) {
        await sql(
          `insert into identity_assurance.identity_authorities
             (id, tenant_id, authority_code, name, authority_type_concept_id,
              verification_status_concept_id, status_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
          [id, tenant, code, `Autoridad ${code}`, CID, CID, CID],
        );
      }
    });

    it('las autoridades son las del tenant del contexto', async () => {
      const res = await http()
        .get('/identity/authorities')
        .query({ limit: 100 })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      const ids = res.body.items.map((i: { id: string }) => i.id);
      expect(ids).toContain(authorityA);
      expect(ids).not.toContain(authorityB);
    });

    it('las políticas (catálogo de plataforma) responden una página', async () => {
      const res = await http()
        .get('/identity/verification-policies')
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  describe('health_context', () => {
    const agentA = randomUUID();
    const agentB = randomUUID();
    const agentPlatform = randomUUID();

    beforeAll(async () => {
      for (const [id, tenant, code] of [
        [agentA, SEED.tenantId, `cv13-agent-a-${sufijo}`],
        [agentB, tenantB, `cv13-agent-b-${sufijo}`],
        [agentPlatform, null, `cv13-agent-p-${sufijo}`],
      ] as const) {
        await sql(
          `insert into health_context.context_agents
             (id, code, name, agent_type_concept_id, owner_tenant_id,
              status_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, now(), now())`,
          [id, code, `Agente ${code}`, CID, tenant, CID],
        );
      }
    });

    it('los agentes son los de plataforma y los del tenant, nunca los de otro', async () => {
      const res = await http()
        .get('/health-context/agents')
        .query({ limit: 100 })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      const ids = res.body.items.map((i: { id: string }) => i.id);
      expect(ids).toContain(agentA);
      expect(ids).toContain(agentPlatform);
      expect(ids).not.toContain(agentB);
    });

    it.each(['sources', 'schedules', 'contexts', 'collection-runs'])(
      '%s corre su SQL y responde una página',
      async (route) => {
        const res = await http()
          .get(`/health-context/${route}`)
          .set(auth())
          .set('X-Tenant-Id', SEED.tenantId)
          .expect(200);
        expect(res.body).toMatchObject({
          count: expect.any(Number),
          limit: 50,
        });
      },
    );

    it('las versiones de un contexto corren su SQL sin traer el payload', async () => {
      const res = await http()
        .get(`/health-context/contexts/${randomUUID()}/versions`)
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      expect(res.body.items).toEqual([]);
    });
  });
});
