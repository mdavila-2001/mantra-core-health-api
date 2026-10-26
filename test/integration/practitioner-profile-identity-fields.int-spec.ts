import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  deleteRegisteredPractitioners,
  identidadProfesional,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { Identifiers } from '../../src/modules/common/entities';
import { Persons } from '../../src/modules/profiles/entities';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';
import { IDA } from '../../src/modules/identity_assurance/identity_assurance.concepts';
import { IDENTITY_CARD_VERTICAL } from '../../src/modules/identity_assurance/identity_assurance.seed';

/**
 * P28 · el perfil del médico corrige los datos de su registro: sexo al nacer,
 * número y departamento del documento y correo de trabajo.
 *
 * Contra la API y la base reales: cada escritura se relee por HTTP y se
 * comprueba en la fila. Cubre los tres actores que importan — el titular
 * (`me`), otro profesional sobre un perfil ajeno (403) y la plataforma
 * (`SECURITY_ADMIN`) — y el bloqueo del número una vez verificada la identidad.
 *
 * Datos sintéticos: CI derivadas de un hash del correo de prueba.
 */
describe('P28 · datos del registro editables desde el perfil del médico (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; personId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  /** Registra y loguea un médico sintético. */
  async function registrarMedico(
    etiqueta: string,
  ): Promise<{ token: string; personId: string; email: string }> {
    const email = `p28-${etiqueta}-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        sexAtBirth: 'FEMALE',
        licenseNumber: `LIC-P28-${etiqueta}-${marca}`,
      })
      .expect(201);
    creados.push({ userId: res.body.userId, personId: res.body.personId });
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    return {
      token: login.body.accessToken,
      personId: res.body.personId,
      email,
    };
  }

  async function documentoVigente(personId: string): Promise<Identifiers[]> {
    return ctx.orm.em.fork().find(Identifiers, {
      ownerId: personId,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      validTo: null,
    });
  }

  let titular: { token: string; personId: string; email: string };
  let colega: { token: string; personId: string; email: string };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    titular = await registrarMedico('titular');
    colega = await registrarMedico('colega');
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  it('el titular corrige sexo, número, departamento y correo de trabajo, y la relectura los trae', async () => {
    const antes = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(titular.token))
      .expect(200);
    expect(antes.body).toMatchObject({
      sexAtBirth: 'FEMALE',
      nationalId: identidadProfesional(titular.email).nationalId,
      identityVerified: false,
    });

    const corregida = `MEDP28${marca}`;
    const lapaz = boDepartmentConceptId('LP');
    const correo = `p28-trabajo-${marca}@example.test`;
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({
        sexAtBirth: 'MALE',
        nationalId: corregida,
        issuerAdministrativeAreaConceptId: lapaz,
        workEmail: correo,
      })
      .expect(200);

    const despues = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(titular.token))
      .expect(200);
    expect(despues.body).toMatchObject({
      sexAtBirth: 'MALE',
      nationalId: corregida,
      issuerAdministrativeAreaConceptId: lapaz,
      workEmail: correo,
    });

    // En la base: una sola fila vigente, corregida en el lugar.
    const filas = await documentoVigente(titular.personId);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      value: corregida,
      issuerAdministrativeAreaConceptId: lapaz,
    });
    const persona = await ctx.orm.em
      .fork()
      .findOneOrFail(Persons, { id: titular.personId });
    expect(persona.sexAtBirthConceptId).toBeTruthy();

    // El login sigue siendo el correo del alta: la CI no es credencial.
    await http()
      .post('/iam/auth/login')
      .send({ email: titular.email, password: 'S3cret-passw0rd' })
      .expect(200);
  });

  it('un número con caracteres que el alta no acepta responde 400 y no escribe', async () => {
    const [antes] = await documentoVigente(titular.personId);
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ nationalId: "1'; drop" })
      .expect(400);
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ nationalId: '' })
      .expect(400);
    const [despues] = await documentoVigente(titular.personId);
    expect(despues.value).toBe(antes.value);
  });

  it('otro profesional sobre el perfil ajeno recibe 403 y no cambia nada', async () => {
    const [antes] = await documentoVigente(titular.personId);
    await http()
      .patch(`/profiles/practitioners/${titular.personId}`)
      .set(bearer(colega.token))
      .send({ nationalId: 'MEDROBADO1' })
      .expect(403);
    const [despues] = await documentoVigente(titular.personId);
    expect(despues.value).toBe(antes.value);
  });

  it('sin token responde 401', async () => {
    await http()
      .patch(`/profiles/practitioners/${titular.personId}`)
      .send({ nationalId: 'MEDANON1' })
      .expect(401);
  });

  it('la plataforma corrige el documento de otro y recibe el perfil con sus datos personales', async () => {
    const porAdmin = `MEDADM${marca}`;
    const res = await http()
      .patch(`/profiles/practitioners/${colega.personId}`)
      .set(bearer(ctx.adminToken))
      .send({ nationalId: porAdmin })
      .expect(200);
    expect(res.body).toMatchObject({
      profileId: colega.personId,
      nationalId: porAdmin,
    });
    const [fila] = await documentoVigente(colega.personId);
    expect(fila.value).toBe(porAdmin);

    // Y el titular lo ve al recargar.
    const propio = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(colega.token))
      .expect(200);
    expect(propio.body.nationalId).toBe(porAdmin);
  });

  it('con la identidad verificada el número responde 409 y no se toca; el departamento sigue corrigiéndose', async () => {
    // Verificación real por el circuito de identity_assurance: caso, checks,
    // revisión manual y aprobación — la aserción vigente que mira el guard.
    const caso = await http()
      .post('/identity/verification-cases')
      .set(bearer(ctx.adminToken))
      .send({
        identityVerificationPolicyId: IDENTITY_CARD_VERTICAL.policyId,
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_IDENTITY,
        subjectEntityId: titular.personId,
      })
      .expect(201);
    await http()
      .post(`/identity/verification-cases/${caso.body.id}/checks:plan`)
      .set(bearer(ctx.adminToken))
      .send({ checks: [{ checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD }] })
      .expect(201);
    const revision = await http()
      .post(`/identity/verification-cases/${caso.body.id}/manual-review`)
      .set(bearer(ctx.adminToken))
      .send({ reviewReasonConceptId: CONCEPTS.STATE_ACTIVE })
      .expect(201);
    await http()
      .post(`/identity/manual-review/${revision.body.id}/decision`)
      .set(bearer(ctx.adminToken))
      .send({ decision: 'APPROVED', decisionReason: 'Documento legible' })
      .expect(200);

    const leido = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(titular.token))
      .expect(200);
    expect(leido.body.identityVerified).toBe(true);

    const [antes] = await documentoVigente(titular.personId);
    const rechazo = await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ nationalId: 'MEDOTRO123' })
      .expect(409);
    expect(rechazo.body.reason).toBe('NATIONAL_ID_LOCKED_BY_VERIFIED_IDENTITY');
    const [despues] = await documentoVigente(titular.personId);
    expect(despues.value).toBe(antes.value);

    // Mandar el mismo número no es una corrección: no choca.
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ nationalId: antes.value })
      .expect(200);

    const cochabamba = boDepartmentConceptId('CB');
    await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ issuerAdministrativeAreaConceptId: cochabamba })
      .expect(200);
    const [conDepto] = await documentoVigente(titular.personId);
    expect(conDepto.issuerAdministrativeAreaConceptId).toBe(cochabamba);
  });
});
