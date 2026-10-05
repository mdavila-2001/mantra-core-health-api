import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, TokenService, createdBy } from '../../src/common';
import { COMM } from '../../src/modules/community/community.concepts';
import { PublicProfiles } from '../../src/modules/community/entities';
import { INS } from '../../src/modules/insurance/insurance.concepts';
import { PatientCoverages } from '../../src/modules/insurance/entities';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  PatientProfiles,
  Persons,
  PersonAccountLinks,
} from '../../src/modules/profiles/entities';
import { Users } from '../../src/modules/iam/entities';
import { bootstrapTestApp, type TestContext } from './harness';

/** Real API and PostgreSQL, synthetic fixtures only; never resets shared data. */
describe('insurer-patients directory integration', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  const marker = `Directory${suffix}`;
  const organizations: Array<{
    tenantId: string;
    ownerId: string;
    token: string;
    carrierId: string;
    planId: string;
  }> = [];
  const patients: string[] = [];
  let activeCoverageId: string;
  const http = () => request(ctx.app.getHttpServer());
  const auth = (index = 0) => ({
    Authorization: `Bearer ${organizations[index].token}`,
    'X-Tenant-Id': organizations[index].tenantId,
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    for (const label of ['A', 'B']) {
      const email = `directory-${label}-${suffix}@example.test`;
      const org = await http()
        .post('/iam/auth/register-organization')
        .send({
          organization: {
            code: `DIRECTORY_${label}_${suffix}`,
            legalName: `Seguro ${label} ${suffix}`,
            tenantType: 'PAYER',
            payer: {
              carrierCode: `DIR_${label}_${suffix}`,
              sigla: label,
              address: 'Direccion sintetica',
              regulatorIdentifier: `DIR-${suffix}-${label}`,
            },
          },
          owner: {
            email,
            password: 'S3cret-passw0rd',
            name: 'Owner',
            lastName: label,
          },
        })
        .expect(201);
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password: 'S3cret-passw0rd' })
        .expect(200);
      const [carrier] = await ctx.orm.em
        .getConnection()
        .execute<{ id: string }[]>(
          'select id from insurance.insurance_carriers where tenant_id = ?',
          [org.body.tenantId],
        );
      const product = await http()
        .post(`/insurance-carriers/${carrier.id}/products`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          productCode: `DIR_${label}_${suffix}`,
          name: `Producto ${label}`,
        })
        .expect(201);
      const plan = await http()
        .post(`/insurance-products/${product.body.id}/plans`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          planCode: `DIR_${label}_${suffix}`,
          name: `Plan ${label}`,
          effectiveFrom: '2000-01-01',
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
        })
        .expect(201);
      organizations.push({
        tenantId: org.body.tenantId,
        ownerId: org.body.ownerUserId,
        token: login.body.accessToken,
        carrierId: carrier.id,
        planId: plan.body.id,
      });
    }
    const em = ctx.orm.em.fork();
    const audit = createdBy(ctx.adminUserId);
    for (let i = 0; i < 14; i++) {
      const id = randomUUID();
      patients.push(id);
      em.create(
        Persons,
        {
          id,
          personStatusConceptId: PROF.PERSON_ACTIVE,
          displayName: `${marker} ${String(i).padStart(2, '0')}`,
          birthDate: new Date('1990-01-01'),
          occupationFreeText: 'Profesion sintetica',
          ...audit,
        },
        { partial: true },
      );
      await em.flush();
      em.create(
        PatientProfiles,
        { profileId: id, patientCode: `DIR-${suffix}-${i}`, ...audit },
        { partial: true },
      );
      await em.flush();
      if (i === 13) continue;
      const coverage = em.create(
        PatientCoverages,
        {
          patientProfileId: id,
          insurancePlanId: organizations[i === 12 ? 1 : 0].planId,
          memberIdentifier: `DIR-${suffix}-${i}`,
          statusConceptId: INS.COVERAGE_ACTIVE,
          verificationStatusConceptId: INS.VERIFY_VERIFIED,
          effectiveFrom: new Date('2000-01-01'),
          ...audit,
        },
        { partial: true },
      );
      await em.flush();
      if (i === 0) activeCoverageId = coverage.id;
    }
    // Separate account/profile identifiers prove that patient id is never used as chat id.
    const patientUserId = randomUUID();
    em.create(
      Users,
      {
        id: patientUserId,
        displayName: 'Paciente sintetico',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        ...audit,
      },
      { partial: true },
    );
    await em.flush();
    em.create(
      PersonAccountLinks,
      {
        personId: patients[0],
        userId: patientUserId,
        linkTypeConceptId: PROF.ACCOUNT_LINK_SELF,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        validFrom: new Date('2000-01-01'),
        ...audit,
      },
      { partial: true },
    );
    for (const [label, userId] of [
      ['owner', organizations[0].ownerId],
      ['patient', patientUserId],
    ]) {
      const existing = await em.findOne(PublicProfiles, {
        targetId: userId,
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
      });
      if (!existing)
        em.create(
          PublicProfiles,
          {
            tenantId: organizations[0].tenantId,
            targetId: userId,
            targetTypeConceptId: COMM.PROFILE_TARGET_USER,
            slug: `directory-${label}-${suffix}`,
            displayName: `Perfil ${label}`,
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
            ...audit,
          },
          { partial: true },
        );
    }
    await em.flush();
  });

  afterAll(async () => {
    if (
      ctx &&
      activeCoverageId &&
      organizations[0] &&
      process.env.DIRECTORY_BROWSER_FIXTURES_PATH
    ) {
      // Restore only this suite's synthetic fixtures for an opt-in browser walkthrough.
      await ctx.orm.em
        .getConnection()
        .execute(
          'update insurance.patient_coverages set effective_to = null where id = ?',
          [activeCoverageId],
        );
      await ctx.orm.em
        .getConnection()
        .execute(
          'update directory.tenant_memberships set end_date = null where user_id = ? and tenant_id = ?',
          [organizations[0].ownerId, organizations[0].tenantId],
        );
      writeFileSync(
        process.env.DIRECTORY_BROWSER_FIXTURES_PATH,
        JSON.stringify({
          adminToken: ctx.tenantlessAdminToken,
          insurer: {
            ...organizations[0],
            email: `directory-A-${suffix}@example.test`,
            password: 'S3cret-passw0rd',
          },
          marker,
          patientProfileId: patients[0],
        }),
      );
    }
    if (ctx) await ctx.app.close();
  });

  it('pages in SQL with an exact total and no foreign patient or excess payload', async () => {
    const first = await http()
      .post('/insurance/patients/search')
      .set(auth())
      .send({ search: marker, limit: 10 })
      .expect(200);
    expect(first.body.total).toBe(12);
    expect(first.body.items).toHaveLength(10);
    expect(first.headers['cache-control']).toContain('no-store');
    expect(first.body.nextCursor).toEqual(expect.any(String));
    const second = await http()
      .post('/insurance/patients/search')
      .set(auth())
      .send({ search: marker, limit: 10, cursor: first.body.nextCursor })
      .expect(200);
    expect(second.body.total).toBe(12);
    expect(second.body.items).toHaveLength(2);
    expect(second.body.nextCursor).toBeNull();
    const rows = [...first.body.items, ...second.body.items];
    expect(new Set(rows.map((row) => row.patientProfileId)).size).toBe(12);
    expect(
      rows.every((row) =>
        row.insurers.every(
          (insurer: { id: string }) =>
            insurer.id === organizations[0].carrierId,
        ),
      ),
    ).toBe(true);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(
        [
          'age',
          'birthDate',
          'fullName',
          'insurers',
          'messaging',
          'occupationDisplay',
          'patientProfileId',
        ].sort(),
      );
    }
  });

  it('cannot expand scope by selecting a different carrier or no insurance', async () => {
    for (const filter of [
      { insuranceCarrierId: organizations[1].carrierId },
      { insuranceStatus: 'NO_INSURANCE' },
    ]) {
      const result = await http()
        .post('/insurance/patients/search')
        .set(auth())
        .send({ search: marker, ...filter })
        .expect(200);
      expect(result.body).toMatchObject({
        total: 0,
        items: [],
        nextCursor: null,
      });
    }
    await http()
      .post('/insurance/patients/conversation')
      .set(auth())
      .send({ patientProfileId: patients[12], channel: 'internal' })
      .expect(404);
    const options = await http()
      .get('/insurance/patients/options')
      .set(auth())
      .expect(200);
    expect(
      options.body.insurers.map((insurer: { id: string }) => insurer.id),
    ).toEqual([organizations[0].carrierId]);
  });

  it('allows platform administrators to find uninsured patients with combined filters', async () => {
    const result = await http()
      .post('/insurance/patients/search')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        search: marker,
        occupation: 'profesion',
        insuranceStatus: 'NO_INSURANCE',
        birthDateFrom: '1990-01-01',
        birthDateTo: '1990-01-01',
      })
      .expect(200);
    expect(result.body.total).toBe(1);
    expect(result.body.items[0]).toMatchObject({
      patientProfileId: patients[13],
      insurers: [],
    });
  });

  it('accepts a global SECURITY_ADMIN with no tenant or memberships', async () => {
    const token = ctx.app
      .get(TokenService)
      .signAccessToken(
        ctx.adminUserId,
        'test-session-tenantless',
        ['SECURITY_ADMIN'],
        [],
      );
    await http()
      .get('/insurance/patients/options')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const result = await http()
      .post('/insurance/patients/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ search: marker })
      .expect(200);
    expect(result.body.total).toBe(14);
  });

  it('rejects invalid dates, limits and extra fields at the HTTP boundary', async () => {
    for (const body of [
      { limit: 500 },
      { birthDateFrom: '2000-01-01', birthDateTo: '1990-01-01' },
      { birthDateFrom: '1990-01-01T00:00:00Z' },
      { tenantId: organizations[1].tenantId },
    ]) {
      await http()
        .post('/insurance/patients/search')
        .set(auth())
        .send(body)
        .expect(400);
    }
    await http().get('/insurance/patients').set(auth()).expect(404);
  });

  it('reuses a persisted conversation and records read access without content', async () => {
    const payload = { patientProfileId: patients[0], channel: 'internal' };
    const first = await http()
      .post('/insurance/patients/conversation')
      .set(auth())
      .send(payload)
      .expect(200);
    const second = await http()
      .post('/insurance/patients/conversation')
      .set(auth())
      .send(payload)
      .expect(200);
    expect(second.body).toEqual(first.body);
    const rows = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        'select id from community.conversations where id = ?',
        [first.body.conversationId],
      );
    expect(rows).toHaveLength(1);
    const access = await ctx.orm.em
      .getConnection()
      .execute<{ patient_profile_id: string }[]>(
        `select patient_profile_id from audit.data_access_log where user_id = ? and patient_profile_id = ? and purpose = ?`,
        [organizations[0].ownerId, patients[0], 'PATIENT_DIRECTORY'],
      );
    expect(access.length).toBeGreaterThanOrEqual(2);
  });

  it('revokes list and chat access after coverage expires, including an existing conversation', async () => {
    await ctx.orm.em
      .getConnection()
      .execute(
        'update insurance.patient_coverages set effective_to = ?::date where id = ?',
        ['2001-01-01', activeCoverageId],
      );
    const list = await http()
      .post('/insurance/patients/search')
      .set(auth())
      .send({ search: `${marker} 00` })
      .expect(200);
    expect(list.body).toMatchObject({ items: [], total: 0 });
    await http()
      .post('/insurance/patients/conversation')
      .set(auth())
      .send({ patientProfileId: patients[0], channel: 'internal' })
      .expect(404);
  });

  it('rejects revoked membership even with the previously issued token', async () => {
    await ctx.orm.em
      .getConnection()
      .execute(
        "update directory.tenant_memberships set end_date = now() - interval '1 day' where user_id = ? and tenant_id = ?",
        [organizations[0].ownerId, organizations[0].tenantId],
      );
    await http()
      .post('/insurance/patients/search')
      .set(auth())
      .send({ search: marker })
      .expect(403);
    await http().get('/insurance/patients/options').set(auth()).expect(403);
    await http()
      .post('/insurance/patients/conversation')
      .set(auth())
      .send({ patientProfileId: patients[1], channel: 'internal' })
      .expect(403);
  });
});
