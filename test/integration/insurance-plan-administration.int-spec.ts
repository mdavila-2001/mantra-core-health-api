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

describe('administración tenant-scoped de planes y coberturas', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  const created: { userId: string; tenantId: string }[] = [];
  const organizations: Array<{
    tenantId: string;
    ownerUserId: string;
    token: string;
    carrierId: string;
    productId: string;
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
    const product = await http()
      .post(`/insurance-carriers/${carrierId}/products`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ productCode: `PROD_${code}`, name: `Producto ${code}` })
      .expect(201);

    const organization = {
      tenantId: response.body.tenantId as string,
      ownerUserId: response.body.ownerUserId as string,
      token: login.body.accessToken as string,
      carrierId,
      productId: product.body.id as string,
    };
    organizations.push(organization);
    return organization;
  }

  async function member(
    tenantId: string,
    roleConceptId: string,
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
        tenantRoleConceptId: roleConceptId,
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
        .signAccessToken(userId, `session-${label}`, ['USER'], [tenantId]),
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await register('A');
    await register('B');
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(created);
  });

  it('owner crea plan y cobertura; admin edita importes y reglas y la lectura persiste', async () => {
    const org = organizations[0]!;
    const plan = await http()
      .post(`/insurance-products/${org.productId}/plans`)
      .set(auth(org.token, org.tenantId))
      .send({
        planCode: 'ORO',
        name: 'Plan Oro',
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      })
      .expect(201);
    const benefit = await http()
      .post(`/insurance-plans/${plan.body.id}/benefits`)
      .set(auth(org.token, org.tenantId))
      .send({
        benefitCategoryConceptId: INS.BENEFIT_CATEGORY_OUTPATIENT,
        effectiveFrom: '2026-01-01',
        coveragePercent: '60.00',
      })
      .expect(201);

    const admin = await member(org.tenantId, DIR.ROLE_ADMIN, 'admin');
    await http()
      .put(`/insurance-plans/${plan.body.id}/benefits/${benefit.body.id}`)
      .set(auth(admin.token, org.tenantId))
      .send({
        coveragePercent: '85.50',
        copayAmount: '25.00',
        deductibleAmount: null,
        annualLimitAmount: '5000.00',
      })
      .expect(200, { ok: true });
    await http()
      .put(`/insurance-plans/${plan.body.id}/benefits/${benefit.body.id}/rules`)
      .set(auth(admin.token, org.tenantId))
      .send({
        requiresPriorAuthorization: true,
        requiredDocuments: ['FIRMA_MEDICO', 'INFORME_CLINICO'],
        exclusionNotes: 'No cubre tratamientos experimentales.',
      })
      .expect(200, { ok: true });

    const detail = await http()
      .get(`/insurance-carriers/${org.carrierId}`)
      .set(auth(admin.token, org.tenantId))
      .expect(200);
    const persisted = detail.body.products[0].plans[0].benefits[0];
    expect(detail.body.canAdminister).toBe(true);
    expect(persisted.coveragePercent).toBe('85.50');
    expect(persisted.deductibleAmount).toBeNull();
    expect(persisted.requiresPriorAuthorization).toBe(true);
    expect(persisted.approvalRules).toEqual({
      requiredDocuments: ['FIRMA_MEDICO', 'INFORME_CLINICO'],
      exclusionNotes: 'No cubre tratamientos experimentales.',
    });

    const audit = await ctx.orm.em
      .getConnection()
      .execute<Array<{ updated_by_user_id: string }>>(
        'select updated_by_user_id from insurance.insurance_plan_benefits where id = ?',
        [benefit.body.id],
      );
    expect(audit[0]?.updated_by_user_id).toBe(admin.userId);
  });

  it('staff recibe 403 y un tenant ajeno recibe 404 sin alterar la fila', async () => {
    const orgA = organizations[0]!;
    const orgB = organizations[1]!;
    const plan = await http()
      .post(`/insurance-products/${orgB.productId}/plans`)
      .set(auth(orgB.token, orgB.tenantId))
      .send({ planCode: 'B', name: 'Plan B' })
      .expect(201);
    const benefit = await http()
      .post(`/insurance-plans/${plan.body.id}/benefits`)
      .set(auth(orgB.token, orgB.tenantId))
      .send({
        benefitCategoryConceptId: INS.BENEFIT_CATEGORY_GENERAL,
        coveragePercent: '40.00',
      })
      .expect(201);

    const staff = await member(orgB.tenantId, DIR.ROLE_STAFF, 'staff');
    const body = {
      coveragePercent: '99.00',
      copayAmount: null,
      deductibleAmount: null,
      annualLimitAmount: null,
    };
    await http()
      .put(`/insurance-plans/${plan.body.id}/benefits/${benefit.body.id}`)
      .set(auth(staff.token, orgB.tenantId))
      .send(body)
      .expect(403);
    await http()
      .put(`/insurance-plans/${plan.body.id}/benefits/${benefit.body.id}`)
      .set(auth(orgA.token, orgA.tenantId))
      .send(body)
      .expect(404);

    const rows = await ctx.orm.em
      .getConnection()
      .execute<Array<{ coverage_percent: string }>>(
        'select coverage_percent::text from insurance.insurance_plan_benefits where id = ?',
        [benefit.body.id],
      );
    expect(rows[0]?.coverage_percent).toBe('40.00');
  });
});
