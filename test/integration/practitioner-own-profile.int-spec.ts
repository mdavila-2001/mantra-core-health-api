import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  deleteRegisteredPractitioners,
  type TestContext,
  identidadProfesional,
} from './harness';
import { boOccupationConceptId } from '../../src/common/seed/bo-occupations.catalog';
import { Persons } from '../../src/modules/profiles/entities';

/**
 * 1.3 · ocupación y empleador del profesional (catálogo o texto libre).
 *
 * Fija la paridad con el paciente: el alta puede declarar la empresa en
 * texto libre (sin `workEmployerConceptId`); el perfil propio puede después
 * alternar entre catálogo y texto para los dos campos, con la misma regla
 * de exclusión mutua (`aplicarOcupacion`/`aplicarEmpresa`,
 * `profiles/person-work-fields.ts`); y ninguno de los cuatro campos se le
 * muestra a un tercero que consulta la ficha de la Guía.
 *
 * Requiere el patch v4.2.7 (`persons.work_employer_concept_id`/
 * `work_employer_free_text`) aplicado a la base — verificado antes de esta
 * corrida, no lo aplica este spec.
 */
describe('1.3 · ocupación y empleador del profesional (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  /** Cuentas creadas por esta suite, para limpiar la base compartida al final. */
  const creados: { userId: string; personId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  /** Los claims del token; acá interesa el contenido, no la firma. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  let token: string;
  let personId: string;
  let hpid: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const email = `p13-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-P13-${marca}`,
        workEmployerFreeText: 'Consultores Médicos Asociados S.R.L.',
      })
      .expect(201);
    personId = res.body.personId;
    creados.push({ userId: res.body.userId, personId });

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    token = login.body.accessToken;
    hpid = claims(token)['hpid'] as string;
  });

  afterAll(async () => {
    // Cerrar la app antes de limpiar: apaga el worker de mensajería, que si
    // siguiera corriendo podría insertar filas entre el escaneo y el borrado.
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  it('escenario 1 · empleador en texto libre desde el alta', async () => {
    const em = ctx.orm.em.fork();
    const persona = await em.findOneOrFail(Persons, { id: personId });
    expect(persona.workEmployerFreeText).toBe(
      'Consultores Médicos Asociados S.R.L.',
    );
    // Hidratada desde la base, la columna nula llega como `null`, no
    // `undefined` (lección de P20: la entidad recién creada en memoria sí da
    // `undefined`; releída de la base da `null`).
    expect(persona.workEmployerConceptId).toBeNull();

    const summary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(token))
      .expect(200);
    expect(summary.body.workEmployerFreeText).toBe(
      'Consultores Médicos Asociados S.R.L.',
    );
    expect(summary.body).not.toHaveProperty('workEmployerConceptId');
  });

  it('escenario 2 · cambia de texto libre a ocupación del catálogo', async () => {
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(token))
      .send({ occupationFreeText: 'Médico rural' })
      .expect(200);

    const conTexto = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(token))
      .expect(200);
    expect(conTexto.body.occupationFreeText).toBe('Médico rural');
    expect(conTexto.body).not.toHaveProperty('occupationConceptId');

    const docente = boOccupationConceptId('DOCENTE');
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(token))
      .send({ occupationConceptId: docente })
      .expect(200);

    const conCatalogo = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(token))
      .expect(200);
    expect(conCatalogo.body.occupationConceptId).toBe(docente);
    // Una sola ocupación: la del catálogo no deja un texto libre al lado.
    expect(conCatalogo.body).not.toHaveProperty('occupationFreeText');

    const em = ctx.orm.em.fork();
    const persona = await em.findOneOrFail(Persons, { id: personId });
    expect(persona.occupationConceptId).toBe(docente);
    expect(persona.occupationFreeText).toBeNull();
  });

  it('escenario 3 · vaciar con cadena vacía borra sin dar 400', async () => {
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(token))
      .send({ occupationConceptId: '', workEmployerFreeText: '' })
      .expect(200);

    const releido = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(token))
      .expect(200);
    expect(releido.body).not.toHaveProperty('occupationConceptId');
    expect(releido.body).not.toHaveProperty('workEmployerFreeText');

    const em = ctx.orm.em.fork();
    const persona = await em.findOneOrFail(Persons, { id: personId });
    expect(persona.occupationConceptId).toBeNull();
    expect(persona.workEmployerFreeText).toBeNull();
  });

  it('un concepto que no existe en el catálogo responde 422, no 500', async () => {
    // El perfil no comprueba la pertenencia al value set —el alta tampoco—:
    // la columna es FK a `terminology.catalog_concepts` y la base rechaza el
    // uuid inexistente. Lo que se fija acá es que llegue como un error de
    // precondición del contrato y no como un 500.
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(token))
      .send({ occupationConceptId: randomUUID() })
      .expect(422);
  });

  it('un tercero no ve la ocupación ni el empleador en la ficha de la guía', async () => {
    // Reponer un dato declarado antes de mirarlo desde afuera.
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(token))
      .send({ workEmployerFreeText: 'Consultores Médicos Asociados S.R.L.' })
      .expect(200);

    const ficha = await http()
      .get(`/profiles/practitioners/${hpid}/summary`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(ficha.body).not.toHaveProperty('occupationConceptId');
    expect(ficha.body).not.toHaveProperty('occupationFreeText');
    expect(ficha.body).not.toHaveProperty('workEmployerConceptId');
    expect(ficha.body).not.toHaveProperty('workEmployerFreeText');
  });
});
