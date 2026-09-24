import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  deleteRegisteredPractitioners,
  type TestContext,
} from './harness';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { ProfessionalCredentialsRepository } from '../../src/modules/profiles/repositories';

describe('edición de credencial profesional propia (integración)', () => {
  let ctx: TestContext;
  const mark = randomUUID().slice(0, 8);
  const created: { userId: string; personId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());

  let ownerToken: string;
  let otherToken: string;
  let credentialId: string;

  async function register(suffix: string): Promise<string> {
    const email = `medical-credential-${mark}-${suffix}@example.test`;
    const registration = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Cuenta',
        lastName: `Sintetica ${suffix}`,
        licenseNumber: `LIC-MED-${mark}-${suffix}`,
      })
      .expect(201);
    created.push({
      userId: registration.body.userId,
      personId: registration.body.personId,
    });

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    return login.body.accessToken as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ownerToken = await register('owner');
    otherToken = await register('other');

    const credential = await http()
      .post('/profiles/practitioners/me/credentials')
      .set(bearer(ownerToken))
      .send({
        credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DIPLOMA,
        number: `DIP-${mark}-before`,
        issuingInstitutionText: 'Instituto sintético',
        issueDate: '2020-01-02',
      })
      .expect(201);
    credentialId = credential.body.id as string;
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredPractitioners(created);
  });

  it('persiste el PATCH propio y conserva tipo y estado al releer por HTTP', async () => {
    await http()
      .patch(`/profiles/practitioners/me/credentials/${credentialId}`)
      .set(bearer(ownerToken))
      .send({
        number: `DIP-${mark}-after`,
        issuingInstitutionText: 'Instituto actualizado sintético',
        issueDate: '2024-02-03',
      })
      .expect(204);

    const summary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(ownerToken))
      .expect(200);
    const credential = summary.body.credentials.find(
      (row: { id: string }) => row.id === credentialId,
    );
    expect(credential).toMatchObject({
      id: credentialId,
      credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DIPLOMA,
      number: `DIP-${mark}-after`,
      issuingInstitutionText: 'Instituto actualizado sintético',
      stateConceptId: expect.any(String),
    });
    expect(new Date(credential.issueDate).toISOString()).toContain(
      '2024-02-03',
    );
  });

  it('rechaza mass assignment y mantiene el valor almacenado', async () => {
    await http()
      .patch(`/profiles/practitioners/me/credentials/${credentialId}`)
      .set(bearer(ownerToken))
      .send({ number: 'NO-GUARDAR', stateConceptId: PROF.CRED_VERIFIED })
      .expect(400);

    const summary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(ownerToken))
      .expect(200);
    const credential = summary.body.credentials.find(
      (row: { id: string }) => row.id === credentialId,
    );
    expect(credential.number).toBe(`DIP-${mark}-after`);
    expect(credential.stateConceptId).toBe(PROF.CRED_PENDING);
  });

  it('responde igual ante una credencial de otra cuenta y exige sesión', async () => {
    await http()
      .patch(`/profiles/practitioners/me/credentials/${credentialId}`)
      .set(bearer(otherToken))
      .send({ number: 'NO-TOCAR-AJENO' })
      .expect(404);

    await http()
      .patch(`/profiles/practitioners/me/credentials/${credentialId}`)
      .send({ number: 'NO-AUTENTICADO' })
      .expect(401);

    const summary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(ownerToken))
      .expect(200);
    const credential = summary.body.credentials.find(
      (row: { id: string }) => row.id === credentialId,
    );
    expect(credential.number).toBe(`DIP-${mark}-after`);
  });

  it('el PATCH espera el bloqueo real de la fila en PostgreSQL', async () => {
    const repository = ctx.app.get(ProfessionalCredentialsRepository);
    let acquired!: () => void;
    let release!: () => void;
    const rowLocked = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const releaseLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const holdingTransaction = ctx.orm.em.transactional(async (tx) => {
      const credential = await repository.findByIdForUpdate(tx, credentialId);
      expect(credential).not.toBeNull();
      acquired();
      await releaseLock;
    });
    await rowLocked;

    let patchFinished = false;
    const pendingPatch = http()
      .patch(`/profiles/practitioners/me/credentials/${credentialId}`)
      .set(bearer(ownerToken))
      .send({ number: `DIP-${mark}-after-lock` })
      .then((response) => {
        patchFinished = true;
        return response;
      });

    let databaseObservedLock = false;
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && !patchFinished) {
      const waitingQueries = await ctx.orm.em
        .fork()
        .getConnection()
        .execute<{ query: string }[]>(
          `select query from pg_stat_activity
            where datname = current_database()
              and wait_event_type = 'Lock'
              and query ilike '%professional_credentials%'`,
        );
      if (waitingQueries.length > 0) {
        databaseObservedLock = true;
        break;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    release();
    await holdingTransaction;
    const response = await pendingPatch;
    expect(databaseObservedLock).toBe(true);
    expect(response.status).toBe(204);

    const summary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(ownerToken))
      .expect(200);
    const credential = summary.body.credentials.find(
      (row: { id: string }) => row.id === credentialId,
    );
    expect(credential.number).toBe(`DIP-${mark}-after-lock`);
  });
});
