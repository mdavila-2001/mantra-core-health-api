import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { boMunicipalityConceptId } from '../../src/common/seed/bo-geography.catalog';

/**
 * El paciente edita, con su propia sesión, los datos que dio al registrarse.
 *
 * El auto-registro escribía la filiación una sola vez y nadie podía volver a
 * tocarla: un apellido mal tipeado, un teléfono que cambió o una mudanza
 * quedaban así para siempre salvo que alguien escribiera en la base. Este
 * recorrido lo hace por el camino de una persona real —se registra, entra con su
 * documento, lee lo suyo, lo corrige y lo vuelve a leer— porque es la única
 * forma de comprobar lo que las pruebas con el ORM doblado no pueden: que el
 * teléfono nuevo quede vigente sin borrar el anterior, y que el nombre visible
 * salga recompuesto de la base y no del objeto que se acaba de escribir.
 *
 * No trunca la base: se registra un paciente propio con un documento único, así
 * que la corrida es reproducible sin llevarse por delante lo que ya haya.
 */
describe('Perfil propio del paciente — leer y editar (integración)', () => {
  let ctx: TestContext;

  /** Documento con el que el paciente se registra y luego inicia sesión. */
  const nationalId = `INT-OWN-${randomUUID().slice(0, 8)}`;
  const password = 'S3cret-passw0rd';

  /** Sacaba (Cochabamba), municipio real de `VS_BO_MUNICIPALITY`. */
  const municipioInicial = boMunicipalityConceptId('031001');
  /** Achocalla (La Paz): la mudanza, a otro departamento a propósito. */
  const municipioNuevo = boMunicipalityConceptId('020104');

  let patientToken: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // Alta pública con el nombre en partes: es lo que el perfil propio devuelve
    // y lo que un formulario de edición necesita para poder corregir un apellido.
    await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password,
        name: 'Ada',
        middleName: 'Augusta',
        lastName: 'Lovelace',
        motherLastName: 'Byron',
        birthDate: '1990-05-05',
        sexAtBirth: 'FEMALE',
        phone: '+591 700 11111',
        residenceMunicipalityConceptId: municipioInicial,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    patientToken = login.body.accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('recién registrado, lee exactamente lo que declaró', async () => {
    const res = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(res.body).toMatchObject({
      name: 'Ada',
      middleName: 'Augusta',
      lastName: 'Lovelace',
      motherLastName: 'Byron',
      // Compuesto por el servidor a partir de las partes, en el orden en que se dicen.
      displayName: 'Ada Augusta Lovelace Byron',
      // Código, no el uuid del catálogo: es lo que el formulario envía.
      sexAtBirth: 'FEMALE',
      phone: '+591 700 11111',
      residenceMunicipalityConceptId: municipioInicial,
      identityVerified: false,
    });
    // `birthDate` es una fecha sin hora, pero viaja como instante ISO — la misma
    // serialización que `GET /profiles/patients/me/summary`.
    expect(res.body.birthDate).toMatch(/^1990-05-05/);
    expect(res.body.personId).toBeDefined();
    expect(res.body.patientProfileId).toBeDefined();
    // Verificarse es un trámite posterior: sin aserción vigente, el código de
    // paciente no viaja —ausente, no `null`—.
    expect(res.body.patientCode).toBeUndefined();
    // Nunca declaró ocupación: el campo no viaja en vez de llegar vacío.
    expect(res.body).not.toHaveProperty('occupationFreeText');
  });

  it('corrige su apellido, su teléfono y su fecha de nacimiento', async () => {
    const res = await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({
        lastName: 'King',
        phone: '+591 700 22222',
        birthDate: '1991-06-06',
      })
      .expect(200);

    // La respuesta del PATCH es el perfil releído, no lo que se acaba de escribir.
    expect(res.body).toMatchObject({
      lastName: 'King',
      displayName: 'Ada Augusta King Byron',
      phone: '+591 700 22222',
    });
    expect(res.body.birthDate).toMatch(/^1991-06-06/);
  });

  it('y al volver a leer, los tres cambios están en la base', async () => {
    const res = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(res.body).toMatchObject({
      lastName: 'King',
      // Recompuesto con la misma regla del alta: `displayName` es derivado.
      displayName: 'Ada Augusta King Byron',
      phone: '+591 700 22222',
    });
    expect(res.body.birthDate).toMatch(/^1991-06-06/);
    // Lo que no venía en el cuerpo no se tocó.
    expect(res.body).toMatchObject({
      name: 'Ada',
      middleName: 'Augusta',
      motherLastName: 'Byron',
      sexAtBirth: 'FEMALE',
      residenceMunicipalityConceptId: municipioInicial,
    });
  });

  it('el teléfono anterior sigue existiendo, dado de baja', async () => {
    // Reemplazar no pisa: por el número viejo se llamó a esta persona. El
    // listado de contactos del dueño devuelve sólo los vigentes, así que el
    // criterio observable es que el vigente sea uno solo y sea el nuevo.
    const res = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(res.body.phone).toBe('+591 700 22222');
  });

  it('se muda: el municipio nuevo reemplaza al anterior', async () => {
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ residenceMunicipalityConceptId: municipioNuevo })
      .expect(200);

    const res = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(res.body.residenceMunicipalityConceptId).toBe(municipioNuevo);
  });

  it('vaciar el segundo nombre lo borra: la clave deja de viajar', async () => {
    // Blanco no es «un dato vacío», es «esto no lo tengo»: la columna queda en
    // NULL y la lectura omite la clave, igual que si nunca se hubiera declarado.
    const res = await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ middleName: '' })
      .expect(200);

    // Ya la respuesta del PATCH —que es el perfil releído— viene sin la clave.
    expect(res.body).not.toHaveProperty('middleName');

    const releido = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(releido.body).not.toHaveProperty('middleName');
    // Y el nombre visible se recompone sin el hueco del segundo nombre.
    expect(releido.body.displayName).toBe('Ada King Byron');
  });

  it('vaciar el teléfono lo quita sin dejar una fila vacía', async () => {
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ phone: '' })
      .expect(200);

    const releido = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(releido.body).not.toHaveProperty('phone');
  });

  it('un cuerpo vacío es válido y no cambia nada', async () => {
    const res = await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({})
      .expect(200);

    expect(res.body).toMatchObject({
      name: 'Ada',
      lastName: 'King',
      // Sin segundo nombre desde que se vació: nada volvió a ponerlo.
      displayName: 'Ada King Byron',
    });
    expect(res.body).not.toHaveProperty('middleName');
    expect(res.body).not.toHaveProperty('phone');
  });

  it('rechaza un campo que no es de esta pantalla', async () => {
    // El `ValidationPipe` global corre con `forbidNonWhitelisted`: el código de
    // paciente y el documento no se editan por autoservicio, y el contrato lo
    // dice rechazando el cuerpo en vez de ignorando el campo en silencio.
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ patientCode: 'PAT-inventado' })
      .expect(400);
  });

  it('sin token, ninguna de las dos rutas responde', async () => {
    await http().get('/profiles/patients/me').expect(401);
    await http().patch('/profiles/patients/me').send({}).expect(401);
  });

  /** Cliente HTTP contra la app bajo prueba. */
  function http(): request.Agent {
    return request(ctx.app.getHttpServer());
  }
});
