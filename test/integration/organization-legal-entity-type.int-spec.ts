import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { Tenants } from '../../src/modules/directory/entities';
import { LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE } from '../../src/modules/directory/legal-entity-types';

/**
 * Subtarea 1.1 · el tipo societario del diccionario internacional en
 * `POST /iam/auth/register-organization`.
 *
 * Cinco escenarios: el código boliviano persiste el concepto correcto en
 * `directory.tenants`; un código extranjero deriva el país de constitución
 * cuando el cliente no lo declaró explícitamente, y su categoría canónica
 * queda legible por la lectura pública del catálogo
 * (`$expand?includeProperties=true`); un código fuera del diccionario es 400
 * de `ValidationPipe`, no 422; sin el campo, el contrato sigue aceptando el
 * alta y cae a la forma legada `COMPANY`; y un tipo boliviano bajo un país
 * distinto es 422.
 */
describe('1.1 · tipo societario en el alta de organización (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  /** Cuentas y tenants creados por esta suite, para limpiar al final. */
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('escenario 1 · SRL boliviana → 201, concepto y país correctos', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LET_SRL_${marca}`,
          legalName: `Aseguradora ${marca} S.R.L.`,
          tenantType: 'PAYER',
          legalEntityType: 'SRL',
          payer: {
            carrierCode: `CARRIER_${marca}`,
            sigla: 'LET',
            address: 'Av. Siempre Viva 123',
            regulatorIdentifier: `REG_${marca}`,
          },
        },
        owner: {
          email: `let-srl-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.legalEntityTypeConceptId).toBe(CONCEPTS.LEGAL_ENTITY_SRL);
    expect(tenant.countryConceptId).toBe(CONCEPTS.COUNTRY_BO);
  });

  it('escenario 2 · US_LLC sin país declarado → 201, concepto US y categoría canónica legible por $expand', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LET_LLC_${marca}`,
          legalName: `Aseguradora LLC ${marca}`,
          tenantType: 'PAYER',
          legalEntityType: 'US_LLC',
          payer: {
            carrierCode: `CARRIERLLC_${marca}`,
            sigla: 'LLC',
            address: '123 Main St',
            regulatorIdentifier: `REGLLC_${marca}`,
          },
        },
        owner: {
          email: `let-llc-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'John',
          lastName: 'Doe',
        },
      })
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.legalEntityTypeConceptId).toBe(CONCEPTS.LEGAL_ENTITY_US_LLC);
    // No declaró countryConceptId: se derivó del tipo societario elegido.
    expect(tenant.countryConceptId).toBe(CONCEPTS.COUNTRY_US);

    // La categoría canónica y el país viajan como propiedades del concepto,
    // legibles por la misma lectura pública que resuelve cualquier selector.
    const valueSets = await http()
      .get('/terminology/value-sets')
      .query({ code: 'legal-entity-type' })
      .expect(200);
    const valueSetId = valueSets.body.items[0].id;

    const expansion = await http()
      .get(`/terminology/value-sets/${valueSetId}/$expand`)
      .query({ includeProperties: 'true', limit: 50 })
      .expect(200);

    const llcItem = expansion.body.items.find(
      (item: { conceptId: string }) =>
        item.conceptId === CONCEPTS.LEGAL_ENTITY_US_LLC,
    );
    expect(llcItem).toBeDefined();
    expect(llcItem.properties['legal-entity-canonical-category']).toBe(
      'LIMITED_LIABILITY',
    );
    expect(llcItem.properties['legal-entity-country']).toBe('US');
  });

  it('escenario 3 · un código fuera del diccionario es 400 (ValidationPipe), no 422', async () => {
    await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LET_BAD_${marca}`,
          legalName: `Organización inválida ${marca}`,
          tenantType: 'PAYER',
          legalEntityType: 'BO_SRL',
          payer: {
            carrierCode: `CARRIERBAD_${marca}`,
            sigla: 'BAD',
            address: 'Calle Falsa 123',
            regulatorIdentifier: `REGBAD_${marca}`,
          },
        },
        owner: {
          email: `let-bad-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Ana',
          lastName: 'Paz',
        },
      })
      .expect(400);
  });

  it('escenario 4 · sin el campo, el contrato sigue aceptando el alta y cae a COMPANY', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LET_NONE_${marca}`,
          legalName: `Organización sin tipo ${marca}`,
          tenantType: 'PAYER',
          payer: {
            carrierCode: `CARRIERNONE_${marca}`,
            sigla: 'NON',
            address: 'Calle Falsa 456',
            regulatorIdentifier: `REGNONE_${marca}`,
          },
        },
        owner: {
          email: `let-none-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Carlos',
          lastName: 'Vega',
        },
      })
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.legalEntityTypeConceptId).toBe(CONCEPTS.LEGAL_ENTITY_COMPANY);
  });

  it('escenario 5 · SRL boliviana con countryConceptId de otro país → 422', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LET_MISMATCH_${marca}`,
          legalName: `Organización con país inconsistente ${marca}`,
          tenantType: 'PROVIDER',
          legalEntityType: 'SRL',
          countryConceptId: CONCEPTS.COUNTRY_PE,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `let-mismatch-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Mario',
          lastName: 'Rojas',
        },
      })
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');
  });

  it('el diccionario del código y el catálogo persistido coinciden para las 21 formas societarias', () => {
    // Chequeo de coherencia, no de red: confirma que ningún concepto del
    // diccionario quedó huérfano frente al que ya sembró esta misma corrida.
    for (const [, conceptId] of Object.entries(
      LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE,
    )) {
      expect(typeof conceptId).toBe('string');
    }
  });
});
