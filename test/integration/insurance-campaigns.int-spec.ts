import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, TokenService, createdBy } from '../../src/common';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { Users } from '../../src/modules/iam/entities';
import { INS } from '../../src/modules/insurance/insurance.concepts';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';

/**
 * Tarea 4 · M-06 — campañas preventivas de la aseguradora, contra Postgres
 * real (Neon). Contrato: `docs/contracts/insurer-preventive-campaigns.md`.
 *
 * Plantilla: `insurance-plan-administration.int-spec.ts` (mismo patrón de
 * `register-organization` PAYER + membresías + `X-Tenant-Id`). Sin
 * `reset: true`: dos aseguradoras sintéticas se registran y se borran al
 * final con `deleteRegisteredOrganizations`, sin tocar el resto de la base.
 */
describe('campañas preventivas de la aseguradora (CA-01, CA-02, CA-04)', () => {
  let ctx: TestContext;
  // En mayúsculas: `CreateInsuranceCampaignDto.code` sólo admite A-Z, dígitos y guiones,
  // y un UUID en hexadecimal minúscula lo rechazaba (400) en casi todas las corridas.
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const created: { userId: string; tenantId: string }[] = [];
  const organizations: Array<{
    tenantId: string;
    ownerUserId: string;
    token: string;
    carrierId: string;
  }> = [];

  const http = () => request(ctx.app.getHttpServer());
  const auth = (token: string, tenantId: string) => ({
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
  });

  async function register(code: string) {
    const email = `${code.toLowerCase()}-${suffix}@example.test`;
    const response = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `${code}_${suffix}`,
          legalName: `Aseguradora ${code} ${suffix} S.R.L.`,
          tenantType: 'PAYER',
          payer: {
            carrierCode: `CAR_${code}_${suffix}`,
            sigla: code,
            address: 'Av. Integración 123',
            regulatorIdentifier: `REG-${code}-${suffix}`,
          },
        },
        owner: {
          email,
          password: 'S3cret-passw0rd',
          name: 'Owner',
          lastName: code,
        },
      })
      .expect(201);
    created.push({
      userId: response.body.ownerUserId,
      tenantId: response.body.tenantId,
    });

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    const rows = await ctx.orm.em
      .getConnection()
      .execute<Array<{ id: string }>>(
        'select id from insurance.insurance_carriers where tenant_id = ?',
        [response.body.tenantId],
      );
    const carrierId = rows[0]?.id ?? '';

    const organization = {
      tenantId: response.body.tenantId as string,
      ownerUserId: response.body.ownerUserId as string,
      token: login.body.accessToken as string,
      carrierId,
    };
    organizations.push(organization);
    return organization;
  }

  /** Un miembro con la membresía y los roles globales que pida el caso. */
  async function member(
    tenantId: string,
    membershipRoleConceptId: string,
    globalRoles: readonly string[],
    label: string,
  ): Promise<{ userId: string; token: string }> {
    const em = ctx.orm.em.fork();
    const userId = randomUUID();
    em.create(
      Users,
      {
        id: userId,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        displayName: label,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        emailVerified: true,
        phoneVerified: false,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    em.create(
      TenantMemberships,
      {
        userId,
        tenantId,
        tenantRoleConceptId: membershipRoleConceptId,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    created.push({ userId, tenantId });
    await ensureTestSession(ctx.orm, userId, `session-${label}`);
    return {
      userId,
      token: ctx.app
        .get(TokenService)
        .signAccessToken(
          userId,
          `session-${label}`,
          [...globalRoles],
          [tenantId],
        ),
    };
  }

  const validCampaign = (overrides: Record<string, unknown> = {}) => ({
    code: `CMP-${suffix}`,
    title: 'Chequeo Preventivo Cardiovascular y Perfil Lipídico',
    campaignType: 'LABORATORY',
    targetConditionCode: 'I10',
    copayBonusPercentage: 100,
    validFrom: '2026-09-01',
    validTo: '2026-12-31',
    partners: [
      {
        role: 'PROVIDER',
        type: 'LABORATORY',
        name: 'Laboratorio Central AloVida',
      },
    ],
    ...overrides,
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await register('CA');
    await register('CB');
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(created);
  });

  it('CA-01: el owner crea la campaña, persiste en Postgres y la lee de vuelta', async () => {
    const orgA = organizations[0]!;
    const created201 = await http()
      .post('/insurance/campaigns')
      .set(auth(orgA.token, orgA.tenantId))
      .send(validCampaign())
      .expect(201);

    expect(created201.body).toMatchObject({
      code: `CMP-${suffix}`,
      status: 'DRAFT',
      effectiveStatus: 'DRAFT',
    });

    const row = await ctx.orm.em
      .getConnection()
      .execute<Array<{ id: string; insurance_carrier_id: string }>>(
        'select id, insurance_carrier_id from insurance.insurance_campaigns where id = ?',
        [created201.body.id],
      );
    expect(row[0]?.insurance_carrier_id).toBe(orgA.carrierId);

    const fetched = await http()
      .get(`/insurance/campaigns/${created201.body.id}`)
      .set(auth(orgA.token, orgA.tenantId))
      .expect(200);
    expect(fetched.body.title).toBe(
      'Chequeo Preventivo Cardiovascular y Perfil Lipídico',
    );
  });

  it('B no ve la campaña de A en su listado', async () => {
    const orgB = organizations[1]!;
    const list = await http()
      .get('/insurance/campaigns')
      .set(auth(orgB.token, orgB.tenantId))
      .expect(200);
    expect(
      list.body.items.map((item: { code: string }) => item.code),
    ).not.toContain(`CMP-${suffix}`);
  });

  it('CA-02.b: B lee o cambia de estado la campaña de A → 403 y auditoría en audit.audit_log', async () => {
    const orgA = organizations[0]!;
    const orgB = organizations[1]!;
    const created201 = await http()
      .post('/insurance/campaigns')
      .set(auth(orgA.token, orgA.tenantId))
      .send(validCampaign({ code: `CMP-B02-${suffix}` }))
      .expect(201);
    const campaignId = created201.body.id;

    await http()
      .get(`/insurance/campaigns/${campaignId}`)
      .set(auth(orgB.token, orgB.tenantId))
      .expect(403);
    await http()
      .patch(`/insurance/campaigns/${campaignId}/status`)
      .set(auth(orgB.token, orgB.tenantId))
      .send({ status: 'ACTIVE' })
      .expect(403);

    const audit = await ctx.orm.em
      .getConnection()
      .execute<Array<{ action: string; entity_id: string; tenant_id: string }>>(
        `select action, entity_id::text, tenant_id::text from audit.audit_log
        where action = 'INSURANCE_CAMPAIGN_ACCESS_DENIED' and entity_id = ?
        order by recorded_at desc`,
        [campaignId],
      );
    expect(audit.length).toBeGreaterThanOrEqual(2);
    expect(audit[0]?.tenant_id).toBe(orgB.tenantId);

    // sigue existiendo y en DRAFT: el intento denegado no la tocó.
    const stillDraft = await ctx.orm.em
      .getConnection()
      .execute<Array<{ code: string }>>(
        'select code from insurance.insurance_campaigns where id = ?',
        [campaignId],
      );
    expect(stillDraft[0]?.code).toBe(`CMP-B02-${suffix}`);
  });

  it('una campaña que no existe en NINGÚN lado responde 404 sin auditar', async () => {
    const orgA = organizations[0]!;
    const antes = await ctx.orm.em
      .getConnection()
      .execute<Array<{ n: string }>>(
        `select count(*)::text as n from audit.audit_log where action = 'INSURANCE_CAMPAIGN_ACCESS_DENIED'`,
      );
    await http()
      .get(`/insurance/campaigns/${randomUUID()}`)
      .set(auth(orgA.token, orgA.tenantId))
      .expect(404);
    const despues = await ctx.orm.em
      .getConnection()
      .execute<Array<{ n: string }>>(
        `select count(*)::text as n from audit.audit_log where action = 'INSURANCE_CAMPAIGN_ACCESS_DENIED'`,
      );
    expect(despues[0]?.n).toBe(antes[0]?.n);
  });

  it('un STAFF sin INSURANCE_OPERATOR recibe 403 y queda auditado; con el rol, puede crear', async () => {
    const orgA = organizations[0]!;
    const staff = await member(
      orgA.tenantId,
      DIR.ROLE_STAFF,
      ['USER'],
      'staff-plano',
    );
    await http()
      .post('/insurance/campaigns')
      .set(auth(staff.token, orgA.tenantId))
      .send(validCampaign({ code: `CMP-STAFF-${suffix}` }))
      .expect(403);

    const operator = await member(
      orgA.tenantId,
      DIR.ROLE_STAFF,
      ['USER', 'INSURANCE_OPERATOR'],
      'staff-operator',
    );
    await http()
      .post('/insurance/campaigns')
      .set(auth(operator.token, orgA.tenantId))
      .send(validCampaign({ code: `CMP-OPERATOR-${suffix}` }))
      .expect(201);
  });

  it('CA-04: una ACTIVE vencida no aparece en /active ni en ?status=ACTIVE', async () => {
    const orgA = organizations[0]!;
    const vencida = await http()
      .post('/insurance/campaigns')
      .set(auth(orgA.token, orgA.tenantId))
      .send(
        validCampaign({
          code: `CMP-VENCIDA-${suffix}`,
          validFrom: '2020-01-01',
          validTo: '2020-06-30',
        }),
      )
      .expect(201);
    await http()
      .patch(`/insurance/campaigns/${vencida.body.id}`)
      .set(auth(orgA.token, orgA.tenantId))
      .send({}) // sin cambios: sólo para confirmar que PATCH :id existe en DRAFT
      .expect(200);

    // activarla directo estaría vencida: se marca ACTIVE por SQL, exactamente
    // el caso «alguien la activó cuando aún era válida y venció después».
    await ctx.orm.em
      .getConnection()
      .execute(
        `update insurance.insurance_campaigns set status_concept_id = ? where id = ?`,
        [INS.CAMPAIGN_ACTIVE, vencida.body.id],
      );

    const active = await http().get('/insurance/campaigns/active').expect(200);
    expect(
      active.body.map((item: { code: string }) => item.code),
    ).not.toContain(`CMP-VENCIDA-${suffix}`);

    const filtered = await http()
      .get('/insurance/campaigns?status=ACTIVE')
      .set(auth(orgA.token, orgA.tenantId))
      .expect(200);
    expect(
      filtered.body.items.map((item: { code: string }) => item.code),
    ).not.toContain(`CMP-VENCIDA-${suffix}`);

    const detail = await http()
      .get(`/insurance/campaigns/${vencida.body.id}`)
      .set(auth(orgA.token, orgA.tenantId))
      .expect(200);
    expect(detail.body.status).toBe('ACTIVE');
    expect(detail.body.effectiveStatus).toBe('EXPIRED');
  });

  it('edita en DRAFT y persiste el nuevo título y los aliados reemplazados', async () => {
    const orgA = organizations[0]!;
    const created201 = await http()
      .post('/insurance/campaigns')
      .set(auth(orgA.token, orgA.tenantId))
      .send(validCampaign({ code: `CMP-EDIT-${suffix}` }))
      .expect(201);

    const edited = await http()
      .patch(`/insurance/campaigns/${created201.body.id}`)
      .set(auth(orgA.token, orgA.tenantId))
      .send({
        title: 'Campaña Editada',
        partners: [
          { role: 'PROVIDER', type: 'PHARMACY', name: 'Farmacia Editada' },
        ],
      })
      .expect(200);

    expect(edited.body.title).toBe('Campaña Editada');
    expect(edited.body.partners).toHaveLength(1);
    expect(edited.body.partners[0].name).toBe('Farmacia Editada');

    const partnerRows = await ctx.orm.em
      .getConnection()
      .execute<Array<{ partner_name: string }>>(
        'select partner_name from insurance.insurance_campaign_partners where insurance_campaign_id = ?',
        [created201.body.id],
      );
    expect(partnerRows).toHaveLength(1);
    expect(partnerRows[0]?.partner_name).toBe('Farmacia Editada');
  });

  it('CA-02.e: un aliado con membresía de red de OTRA aseguradora responde 422', async () => {
    const orgA = organizations[0]!;
    const orgB = organizations[1]!;
    const em = ctx.orm.em.fork();
    const networkId = randomUUID();
    const membershipId = randomUUID();
    await em.getConnection().execute(
      `insert into insurance.provider_networks
         (id, insurance_carrier_id, network_code, name, status_concept_id, created_at, updated_at)
       values (?, ?, ?, 'Red de B', ?, now(), now())`,
      [networkId, orgB.carrierId, `NET-B-${suffix}`, INS.NETWORK_ACTIVE],
    );
    await em.getConnection().execute(
      `insert into insurance.network_provider_memberships
         (id, provider_network_id, provider_type_concept_id, provider_entity_id,
          verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        membershipId,
        networkId,
        INS.PROVIDER_TYPE_PRACTICE,
        randomUUID(),
        INS.VERIFY_VERIFIED,
        INS.MEMBERSHIP_ACTIVE,
      ],
    );

    await http()
      .post('/insurance/campaigns')
      .set(auth(orgA.token, orgA.tenantId))
      .send(
        validCampaign({
          code: `CMP-RED-AJENA-${suffix}`,
          partners: [
            {
              role: 'PROVIDER',
              type: 'LABORATORY',
              name: 'Lab con red ajena',
              networkProviderMembershipId: membershipId,
            },
          ],
        }),
      )
      .expect(422);
  });
});
