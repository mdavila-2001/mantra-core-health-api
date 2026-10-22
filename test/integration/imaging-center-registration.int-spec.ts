import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { Tenants } from '../../src/modules/directory/entities';
import { Practices, PracticeSites } from '../../src/modules/practice/entities';
import {
  DiagnosticUnits,
  DiagnosticUnitSites,
  DiagnosticStudyOfferings,
} from '../../src/modules/diagnostic_units/entities';

/**
 * 1.5 · alta de centros de imagenología (`DIAGNOSTIC_CENTER`) en
 * `POST /iam/auth/register-organization` (PR #404 del front, mockup).
 *
 * `diagnostic_unit_sites.practice_site_id` es una FK NOT NULL a
 * `practice.practice_sites`: la unidad diagnóstica no puede existir sin una
 * práctica y una sede propias, así que el alta las provisiona en la misma
 * transacción (`DiagnosticUnitProvisioningService`). Estos seis escenarios
 * verifican esa cadena completa contra Neon.
 */
describe('1.5 · alta de centro de imagenología (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  /** Cuentas y tenants creados por esta suite, para limpiar al final. */
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    // Cerrar la app antes de limpiar: apaga el worker de mensajería, que si
    // siguiera corriendo podría insertar filas entre el escaneo y el borrado.
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('escenario 1 · alta con modalidades y sede primaria → 201, unidad y práctica materializadas', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG15_OK_${marca}`,
          legalName: `Centro de Imagenología ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          diagnosticUnit: {
            modalityConceptIds: [DUNIT.MODALITY_XRAY, DUNIT.MODALITY_MRI],
            primarySite: {
              name: 'Sede Santa Cruz',
              timeZone: 'America/La_Paz',
              address: {
                lines: ['Av. San Martín 123'],
                latitude: -17.78,
                longitude: -63.18,
              },
            },
          },
        },
        owner: {
          email: `img15-ok-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);

    expect(res.body.diagnosticUnitId).toEqual(expect.any(String));
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();

    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).toBe(DIR.TENANT_UNVERIFIED);
    expect(tenant.tenantTypeConceptId).toBe(
      CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
    );

    const unit = await em.findOneOrFail(DiagnosticUnits, {
      id: res.body.diagnosticUnitId,
    });
    expect(unit.tenantId).toBe(res.body.tenantId);
    expect(unit.diagnosticUnitTypeConceptId).toBe(DUNIT.UNIT_TYPE_IMAGING);
    expect(unit.verificationStatusConceptId).toBe(DUNIT.VERIFICATION_PENDING);
    expect(unit.practiceId).toEqual(expect.any(String));
    expect(unit.primaryPracticeSiteId).toEqual(expect.any(String));

    const practice = await em.findOneOrFail(Practices, { id: unit.practiceId });
    expect(practice.tenantId).toBe(res.body.tenantId);
    expect(practice.typeConceptId).toBe(PRAC.PRACTICE_TYPE_DIAGNOSTIC_CENTER);
    expect(practice.adminUserId).toBe(res.body.ownerUserId);

    const site = await em.findOneOrFail(PracticeSites, {
      id: unit.primaryPracticeSiteId,
    });
    expect(site.name).toBe('Sede Santa Cruz');
    expect(site.addressId).toEqual(expect.any(String));

    const unitSite = await em.findOneOrFail(DiagnosticUnitSites, {
      diagnosticUnitId: unit.id,
      siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
    });
    expect(unitSite.practiceSiteId).toBe(site.id);
    expect(unitSite.imagingAvailable).toBe(true);

    const offerings = await em.find(DiagnosticStudyOfferings, {
      diagnosticUnitId: unit.id,
    });
    expect(offerings).toHaveLength(2);
    expect(offerings.map((o) => o.modalityConceptId).sort()).toEqual(
      [DUNIT.MODALITY_XRAY, DUNIT.MODALITY_MRI].sort(),
    );
  });

  it('escenario 2 · sin jurisdictionConceptId → 422 nombrando los campos territoriales faltantes', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG15_422_${marca}`,
          legalName: `Centro de Imagenología 422 ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
        },
        owner: {
          email: `img15-422-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');
    expect(res.body.details.missing).toContain('jurisdictionConceptId');
  });

  it('escenario 3 · código de organización repetido → 409, sin segunda cuenta', async () => {
    const code = `IMG15_DUP_${marca}`;
    const primero = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code,
          legalName: `Centro de Imagenología Dup ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `img15-dup1-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);
    creados.push({
      userId: primero.body.ownerUserId,
      tenantId: primero.body.tenantId,
    });

    const email = `img15-dup2-${marca}@example.test`;
    await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code,
          legalName: `Centro de Imagenología Dup 2 ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email,
          password: 'S3cret-passw0rd',
          name: 'Otra',
          lastName: 'Persona',
        },
      })
      .expect(409);

    const em = ctx.orm.em.fork();
    const restos = await em.getConnection().execute<{ id: string }[]>(
      `select u.id as id from iam.users u
           join iam.authentication_credentials c on c.user_id = u.id
          where c.external_subject = ?`,
      [email],
    );
    expect(restos).toHaveLength(0);
  });

  it('un tipo de unidad que no es IMAGING ni LABORATORY → 422', async () => {
    await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG15_TIPO_${marca}`,
          legalName: `Centro de Imagenología Tipo ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          diagnosticUnit: {
            diagnosticUnitTypeConceptId: CONCEPTS.TENANT_TYPE_HOSPITAL,
          },
        },
        owner: {
          email: `img15-tipo-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(422);
  });

  it('una modalidad que no pertenece a la lista cerrada → 422', async () => {
    await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG15_MOD_${marca}`,
          legalName: `Centro de Imagenología Modalidad ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          diagnosticUnit: { modalityConceptIds: [randomUUID()] },
        },
        owner: {
          email: `img15-mod-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(422);
  });

  it('escenario 6 · DIAGNOSTIC_CENTER sin diagnosticUnit → 201, sin unidad materializada', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `IMG15_SIN_${marca}`,
          legalName: `Centro de Imagenología Sin Unidad ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `img15-sin-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);

    expect(res.body.diagnosticUnitId).toBeUndefined();
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const unit = await em.findOne(DiagnosticUnits, {
      tenantId: res.body.tenantId,
    });
    expect(unit).toBeNull();
  });
});
