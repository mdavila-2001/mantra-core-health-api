import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED, CONCEPTS, createdBy } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PractitionerRoleAssignments } from '../../src/modules/practice/entities';
import { DelegatedPermissionSets } from '../../src/modules/delegated_access/entities';
import { Invoices } from '../../src/modules/billing/entities';

/**
 * H6 (BR-28/BR-29) · los listados nuevos de administración, ejercidos de
 * punta a punta contra la aplicación y la base reales, con foco en el
 * aislamiento entre tenants (CV-14, CV-13, CV-12).
 *
 * `practiceId`, por sí solo, nunca es un alcance de autorización: cada
 * lectura nueva confirma primero que la práctica pedida es del tenant del
 * contexto (`X-Tenant-Id`), y responde 404 —no una lista vacía ni un 403—
 * cuando no lo es, para no confirmar por el código de estado que la práctica
 * ajena existe.
 *
 * Las filas que ningún `POST` puede sembrar en un solo paso (una vinculación
 * ya con datos, un set de permisos, una factura) se crean por el
 * `EntityManager` del arnés, mismo precedente que
 * `insurance-plan-administration.int-spec.ts` y `fx14-cockpit-contable.int-spec.ts`.
 */
describe('H6 · listados de administración y aislamiento entre tenants', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);

  const sufijo = randomUUID().slice(0, 8);
  let practiceAId = '';
  let tenantB = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const practicaA = await http()
      .post('/practices')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        tenantId: SEED.tenantId,
        code: `H6-PRACT-A-${sufijo}`,
        name: `Práctica A H6 ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practiceAId = practicaA.body.id;

    // Una organización (tenant) genuinamente distinta, con su propia práctica —
    // mismo molde que FX-14: el corte de aislamiento compara tenants, no ids.
    const otraOrg = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `H6_ORG_${sufijo.toUpperCase()}`,
          legalName: `Organización B H6 ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `h6-owner-${sufijo}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Organización',
          lastName: 'B',
        },
      })
      .expect(201);
    tenantB = otraOrg.body.tenantId as string;

    // Una vinculación pendiente de la práctica A — CV-14: es lo que la
    // organización no podía ver antes de este cambio.
    const em = ctx.orm.em.fork();
    const audit = createdBy(ctx.adminUserId);
    em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId: ctx.practitionerSubtypeId,
        practiceId: practiceAId,
        roleConceptId: PRAC.ROLE_ATTENDING,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        ...audit,
      },
      { partial: true },
    );

    // Un set de permisos delegados del tenant A — CV-13.
    em.create(
      DelegatedPermissionSets,
      {
        tenantId: SEED.tenantId,
        code: `H6-SET-${sufijo}`,
        name: `Set H6 ${sufijo}`,
        delegateTypeConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        versionNumber: 1,
        ...audit,
      },
      { partial: true },
    );

    // Una factura de la práctica A — CV-12, y el hallazgo de seguridad del
    // aviso automático: `practiceId` de la query no autorizaba nada.
    em.create(
      Invoices,
      {
        practiceId: practiceAId,
        invoiceNumber: `H6-INV-${sufijo}`,
        patientProfileId: ctx.patientSubtypeId,
        issueDate: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...audit,
      },
      { partial: true },
    );
    await em.flush();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('CV-14 · vinculaciones de una práctica', () => {
    it('lista la vinculación pendiente para el tenant dueño', async () => {
      const res = await http()
        .get(`/practices/${practiceAId}/role-assignments`)
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);

      expect(
        res.body.items.some(
          (item: { practiceId: string }) => item.practiceId === practiceAId,
        ),
      ).toBe(true);
    });

    it('responde 404 sin filas cuando la práctica es de otro tenant (aislamiento)', async () => {
      const res = await http()
        .get(`/practices/${practiceAId}/role-assignments`)
        .set(auth())
        .set('X-Tenant-Id', tenantB)
        .expect(404);

      expect(res.body.code).toBeDefined();
    });
  });

  describe('CV-13 · sets de permisos delegados', () => {
    it('lista los sets del tenant propio', async () => {
      const res = await http()
        .get('/delegated-permission-sets')
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);

      expect(
        res.body.items.some((item: { code: string }) =>
          item.code.startsWith('H6-SET-'),
        ),
      ).toBe(true);
    });

    it('nunca devuelve los sets de otro tenant', async () => {
      const res = await http()
        .get('/delegated-permission-sets')
        .set(auth())
        .set('X-Tenant-Id', tenantB)
        .expect(200);

      expect(
        res.body.items.some((item: { code: string }) =>
          item.code.startsWith('H6-SET-'),
        ),
      ).toBe(false);
    });
  });

  describe('CV-12 · facturas de la práctica (hallazgo de seguridad corregido)', () => {
    it('lista la factura para el tenant dueño de la práctica', async () => {
      const res = await http()
        .get('/billing/invoices')
        .query({ practiceId: practiceAId })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);

      expect(
        res.body.items.some(
          (item: { invoiceNumber: string }) =>
            item.invoiceNumber === `H6-INV-${sufijo}`,
        ),
      ).toBe(true);
    });

    it('responde 404 cuando se pide la práctica ajena desde otro tenant', async () => {
      const res = await http()
        .get('/billing/invoices')
        .query({ practiceId: practiceAId })
        .set(auth())
        .set('X-Tenant-Id', tenantB)
        .expect(404);

      expect(res.body.code).toBeDefined();
    });

    it('el detalle de la factura también respeta el tenant (aislamiento)', async () => {
      const listado = await http()
        .get('/billing/invoices')
        .query({ practiceId: practiceAId })
        .set(auth())
        .set('X-Tenant-Id', SEED.tenantId)
        .expect(200);
      const invoiceId = listado.body.items.find(
        (item: { invoiceNumber: string }) =>
          item.invoiceNumber === `H6-INV-${sufijo}`,
      ).id;

      await http()
        .get(`/billing/invoices/${invoiceId}`)
        .query({ practiceId: practiceAId })
        .set(auth())
        .set('X-Tenant-Id', tenantB)
        .expect(404);
    });
  });
});
