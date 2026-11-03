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

    // En la base: una sola fila vigente, la nueva; la vieja queda cerrada y
    // con su número intacto — quien la referencia sigue viendo lo declarado.
    const filas = await documentoVigente(titular.personId);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      value: corregida,
      issuerAdministrativeAreaConceptId: lapaz,
    });
    const todas = await ctx.orm.em.fork().find(Identifiers, {
      ownerId: titular.personId,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    });
    expect(todas).toHaveLength(2);
    const cerrada = todas.find((fila) => fila.validTo !== null);
    expect(cerrada?.value).toBe(identidadProfesional(titular.email).nationalId);
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

  it('con un caso de verificación en curso y después verificada, el número responde 409 y no se toca; el departamento sigue corrigiéndose', async () => {
    // Verificación real por el circuito de autoservicio de identity_assurance,
    // el mismo que usa el médico: abre su caso con la foto del carnet, el
    // worker despacha el check y la autoridad responde.
    const archivo = await http()
      .post('/common/files')
      .set(bearer(titular.token))
      .send({
        originalName: 'documento.jpg',
        category: 'DOCUMENT',
        // La evidencia de identidad se exige protegida (PHI).
        sensitivity: 'PHI',
        mimeType: 'image/jpeg',
        sizeBytes: 4096,
        contentHash: `p28-hash-${marca}`,
        storageUri: 's3://bucket/p28-documento.jpg',
      })
      .expect(201);
    const abierto = await http()
      .post('/identity/me/practitioner/identity-verification')
      .set(bearer(titular.token))
      .send({ evidenceFileId: archivo.body.id })
      .expect(201);

    // Con el caso en curso —todavía nada verificado— el número ya no se
    // toca: lo que se está revisando es el de hoy.
    const [enCaso] = await documentoVigente(titular.personId);
    const enCurso = await http()
      .patch('/profiles/practitioners/me')
      .set(bearer(titular.token))
      .send({ nationalId: 'MEDENCASO1' })
      .expect(409);
    expect(enCurso.body.reason).toBe('NATIONAL_ID_LOCKED_BY_VERIFIED_IDENTITY');
    const [trasCaso] = await documentoVigente(titular.personId);
    expect(trasCaso.id).toBe(enCaso.id);
    expect(trasCaso.value).toBe(enCaso.value);

    // Cierre del caso con su aserción, escrito como fixture en la base real.
    // El despacho por `/internal/identity/checks/:id/attempts` responde 422
    // al administrador de pruebas para un caso de autoservicio de otro tenant
    // (registrado en el REPORTE); lo que este test necesita es el estado
    // final que deja ese circuito: caso ASSERTED y una aserción vigente sobre
    // la persona, con las mismas columnas que escribe `IdentityChecksService`.
    await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `update identity_assurance.identity_verification_cases
            set status_concept_id = ?, updated_at = now()
          where id = ?`,
        [IDA.CASE_ASSERTED, abierto.body.caseId],
      );
    await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `insert into identity_assurance.identity_assertions
           (id, identity_verification_case_id, issuer_identity_authority_id,
            subject_type_concept_id, subject_entity_id, assertion_type_concept_id,
            assurance_level_concept_id, issued_at, expires_at, created_at)
         select gen_random_uuid(), ?, (select id from identity_assurance.identity_authorities order by id limit 1),
                ?, ?, ?, ?, now(), now() + interval '1 year', now()`,
        [
          abierto.body.caseId,
          IDA.SUBJECT_PRACTITIONER_IDENTITY,
          titular.personId,
          IDA.ASSERTION_IDENTITY,
          IDA.ASSURANCE_LEVEL_IAL2,
        ],
      );

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
