import request from 'supertest';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import {
  CatalogConcepts,
  CodeSystemVersions,
} from '../../src/modules/terminology/entities';
import { CONCEPTS } from '../../src/common';

/**
 * Pruebas de integración del módulo Terminology: alta de code system, versión,
 * importación de conceptos, publicación (transición de estado), designaciones,
 * relaciones y value sets, contra la base real.
 */
describe('Terminology (integración)', () => {
  let ctx: TestContext;
  let orm: MikroORM;
  const uniq = Date.now();
  let codeSystemId: string;
  let versionId: string;
  let conceptA: string;
  let conceptB: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orm = ctx.orm;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /**
   * Ejecuta la operación http.
   * @returns Resultado de http.
   */
  const http = () => request(ctx.app.getHttpServer());

  it('UC-03-01 crea un code system', async () => {
    const res = await http()
      .post('/terminology/code-systems')
      .set(bearer(ctx.adminToken))
      .send({
        internalCode: `icd10-${uniq}`,
        name: 'ICD-10 Local',
        canonicalUrl: `http://x/icd10/${uniq}`,
        sourceCode: `WHO-${uniq}`,
        sourceName: 'WHO',
      })
      .expect(201);
    codeSystemId = res.body.id;
    expect(res.body.sourceId).toEqual(expect.any(String));
  });

  it('UC-03-01 rechaza internalCode duplicado (409)', async () => {
    await http()
      .post('/terminology/code-systems')
      .set(bearer(ctx.adminToken))
      .send({
        internalCode: `icd10-${uniq}`,
        name: 'dup',
        canonicalUrl: 'http://y',
        sourceCode: 'WHO',
        sourceName: 'WHO',
      })
      .expect(409);
  });

  it('UC-03-02 crea una versión en DRAFT', async () => {
    const res = await http()
      .post(`/terminology/code-systems/${codeSystemId}/versions`)
      .set(bearer(ctx.adminToken))
      .send({ version: '2024', isDefault: true })
      .expect(201);
    versionId = res.body.id;
    expect(res.body.state).toBeDefined();
  });

  it('UC-03-03 importa conceptos', async () => {
    const res = await http()
      .post(`/terminology/versions/${versionId}/import`)
      .set(bearer(ctx.adminToken))
      .send({
        concepts: [
          { code: 'A00', display: 'Cholera' },
          { code: 'A01', display: 'Typhoid fever' },
        ],
      })
      .expect(201);
    expect(res.body.inserted).toBe(2);

    // Recupera los ids de concepto persistidos para las pruebas de designación/relación.
    const em = orm.em.fork();
    const concepts = await em.find(CatalogConcepts, {
      codeSystemVersionId: versionId,
    });
    conceptA = concepts.find((c) => c.code === 'A00')!.id;
    conceptB = concepts.find((c) => c.code === 'A01')!.id;
    expect(conceptA).toBeDefined();
  });

  it('UC-03-04 publica la versión (DRAFT -> ACTIVE)', async () => {
    await http()
      .post(`/terminology/versions/${versionId}/publish`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    const em = orm.em.fork();
    const v = await em.findOne(CodeSystemVersions, { id: versionId });
    expect(v!.stateConceptId).toBe(CONCEPTS.TERM_ACTIVE);
  });

  it('UC-03-04 rechaza re-publicar una versión ya activa', async () => {
    await http()
      .post(`/terminology/versions/${versionId}/publish`)
      .set(bearer(ctx.adminToken))
      .expect((res) => {
        if (![409, 422].includes(res.status)) {
          throw new Error(`esperaba 409/422, recibió ${res.status}`);
        }
      });
  });

  it('UC-03-05 agrega una designación al concepto', async () => {
    await http()
      .post(`/terminology/concepts/${conceptA}/designations`)
      .set(bearer(ctx.adminToken))
      .send({
        value: 'Cólera',
        language: 'ES',
        designationType: 'PREFERRED',
        preferred: true,
      })
      .expect(201);
  });

  it('UC-03-06 agrega una relación jerárquica', async () => {
    await http()
      .post(`/terminology/concepts/${conceptA}/relationships`)
      .set(bearer(ctx.adminToken))
      .send({ targetConceptId: conceptB, relationshipType: 'IS_A' })
      .expect(201);
  });

  it('UC-03-07 crea un value set con reglas', async () => {
    const res = await http()
      .post('/terminology/value-sets')
      .set(bearer(ctx.adminToken))
      .send({
        internalCode: `vs-${uniq}`,
        name: 'Infectious diseases',
        canonicalUrl: `http://x/vs/${uniq}`,
        rules: [
          {
            codeSystemId,
            operator: 'IS_A',
            property: 'concept',
            value: 'A00',
            included: true,
          },
        ],
      })
      .expect(201);
    expect(res.body.versionId).toEqual(expect.any(String));
    expect(res.body.rulesCount).toBe(1);
  });

  it('rechaza sin autenticación (401)', async () => {
    await http()
      .post('/terminology/code-systems')
      .send({
        internalCode: 'x',
        name: 'x',
        canonicalUrl: 'x',
        sourceCode: 'x',
        sourceName: 'x',
      })
      .expect(401);
  });
});
