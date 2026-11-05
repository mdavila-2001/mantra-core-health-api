import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  TEST_ADMIN_ID,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { IDA } from '../../src/modules/identity_assurance/identity_assurance.concepts';
import { Tenants } from '../../src/modules/directory/entities';
import { IdentityVerificationEffectsService } from '../../src/modules/identity_assurance/services/identity-verification-effects.service';

/**
 * P50/P51 · la verificación de identidad por una autoridad externa no activa
 * una farmacia que no presentó sus papeles para operar.
 *
 * `POST /admin/tenants/:id/verification` ya rechazaba activar una farmacia o un
 * laboratorio sin sus papeles, pero el efecto de un caso de verificación de
 * identidad institucional (`IDA_SUBJECT_TENANT_IDENTITY`) los activaba igual:
 * el veredicto de la autoridad prueba quién es la institución, no que tenga la
 * licencia. Aquí se registra una farmacia real por el alta pública, sin
 * papeles, y se aplica el efecto de un caso verificado en una transacción
 * contra la base: el tenant tiene que seguir PENDIENTE y sin verificar.
 */
describe('P50/P51 · verificación externa de una institución sin papeles (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8).toUpperCase();
  const creados: { userId: string; tenantId: string }[] = [];

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('el caso verificado deja a la farmacia sin papeles pendiente, no activa', async () => {
    const nit = `EXT${marca}`.replace(/[^A-Z0-9]/g, '');
    const email = `ext-${marca.toLowerCase()}@example.test`;
    const alta = await request(ctx.app.getHttpServer())
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `FARM-${nit}`,
          legalName: `Farmacia Sintética Externa ${marca} S.R.L.`,
          taxIdentifier: nit,
          legalEntityType: 'SRL',
          tenantType: 'PHARMACY',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          legalRepresentative: {
            fullName: 'Representante Sintético',
            email,
            idNumber: '1234567 SC',
          },
          pharmacy: {
            address: 'Calle Sintética 1',
            latitude: -17.7833,
            longitude: -63.1821,
          },
        },
        owner: {
          email,
          password: 'S3cret-passw0rd',
          displayName: 'Representante Sintético',
        },
      })
      .expect(201);
    const tenantId = alta.body.tenantId as string;
    creados.push({ userId: alta.body.ownerUserId, tenantId });

    await ctx.orm.em.fork().transactional((tx) =>
      ctx.app.get(IdentityVerificationEffectsService).applyVerified(
        tx,
        {
          subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
          subjectEntityId: tenantId,
        } as never,
        TEST_ADMIN_ID,
      ),
    );

    const tenant = await ctx.orm.em.fork().findOneOrFail(Tenants, {
      id: tenantId,
    });
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).not.toBe(
      CONCEPTS.TENANT_VERIFIED,
    );
  });
});
