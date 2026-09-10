import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import {
  boMunicipalityConceptId,
  boDepartmentConceptId,
} from '../../src/common/seed/bo-geography.catalog';
import { BO_OCCUPATION_VALUE_SET } from '../../src/common/seed/bo-occupations.catalog';

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
        email: `own-profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`,
        password,
        name: 'Ada',
        middleName: 'Augusta',
        lastName: 'Lovelace',
        motherLastName: 'Byron',
        birthDate: '1990-05-05',
        sexAtBirth: 'FEMALE',
        phone: '+591 700 11111',
        residenceMunicipalityConceptId: municipioInicial,
        issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
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
    // Nunca declaró ocupación, ni del catálogo ni escrita: ninguna de las dos
    // claves viaja, en vez de llegar vacías.
    expect(res.body).not.toHaveProperty('occupationConceptId');
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

  it('elige su ocupación del catálogo, y después la reemplaza por una escrita', async () => {
    // El alta ya guarda la ocupación como concepto cuando el paciente la elige
    // del desplegable. El uuid se resuelve por los dos endpoints públicos —el
    // mismo camino que recorre el formulario— y no se escribe acá: un literal
    // ataría la prueba a un id que depende de cómo se sembró el catálogo.
    const ocupacion = await primeraOcupacionSeleccionable();

    const elegida = await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ occupationConceptId: ocupacion })
      .expect(200);

    expect(elegida.body.occupationConceptId).toBe(ocupacion);

    const conCatalogo = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(conCatalogo.body.occupationConceptId).toBe(ocupacion);
    // Una sola ocupación: la del catálogo no deja un texto libre al lado.
    expect(conCatalogo.body).not.toHaveProperty('occupationFreeText');

    // Y al revés: escribirla a mano es decir que no está en la lista, así que
    // el concepto deja de estar declarado.
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ occupationFreeText: 'Docente' })
      .expect(200);

    const conTexto = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(conTexto.body.occupationFreeText).toBe('Docente');
    expect(conTexto.body).not.toHaveProperty('occupationConceptId');
  });

  it('vaciar la del catálogo la borra y no deja un texto en su lugar', async () => {
    const ocupacion = await primeraOcupacionSeleccionable();

    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ occupationConceptId: ocupacion })
      .expect(200);

    // La cadena vacía no es un uuid mal escrito, es la ausencia de ocupación:
    // sin dejarla pasar, quitarse la del catálogo sería un 400 y no habría forma
    // de hacerlo. Mismo criterio que el teléfono.
    const vaciada = await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ occupationConceptId: '' })
      .expect(200);

    expect(vaciada.body).not.toHaveProperty('occupationConceptId');

    const releido = await http()
      .get('/profiles/patients/me')
      .set(bearer(patientToken))
      .expect(200);

    expect(releido.body).not.toHaveProperty('occupationConceptId');
    // Y el texto que había antes ya lo había borrado el concepto: quitar uno no
    // resucita al otro.
    expect(releido.body).not.toHaveProperty('occupationFreeText');
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

  it('una ocupación que no existe en el catálogo no se guarda', async () => {
    // El perfil no comprueba la pertenencia al conjunto de valores —el alta
    // tampoco—: la columna es FK a `terminology.catalog_concepts` y la base
    // rechaza el uuid inexistente. Lo que se fija acá es que esa negativa llegue
    // como un error de precondición del contrato y no como un 500.
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(patientToken))
      .send({ occupationConceptId: randomUUID() })
      .expect(422);
  });

  it('sin token, ninguna de las dos rutas responde', async () => {
    await http().get('/profiles/patients/me').expect(401);
    await http().patch('/profiles/patients/me').send({}).expect(401);
  });

  describe('foto de perfil (profiles.persons.photo_file_id)', () => {
    /** PNG de 1×1 px, válido por su firma binaria — lo que exige el upload. */
    const PNG_1PX = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAAA6fptVAAAACklEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=',
      'base64',
    );

    it('sube, fija y quita la foto propia; vuelve a leerse en cada paso', async () => {
      // Antes de subir nada: la clave no viaja.
      const inicial = await http()
        .get('/profiles/patients/me')
        .set(bearer(patientToken))
        .expect(200);
      expect(inicial.body).not.toHaveProperty('photoFileId');

      const subido = await http()
        .post('/common/files/upload')
        .set(bearer(patientToken))
        .field('category', 'IMAGE')
        .field('sensitivity', 'NORMAL')
        .attach('file', PNG_1PX, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(201);
      const fileId = subido.body.id;
      expect(fileId).toBeDefined();

      const fijada = await http()
        .put('/profiles/patients/me/photo')
        .set(bearer(patientToken))
        .send({ fileId })
        .expect(200);
      expect(fijada.body.photoFileId).toBe(fileId);

      const releida = await http()
        .get('/profiles/patients/me')
        .set(bearer(patientToken))
        .expect(200);
      expect(releida.body.photoFileId).toBe(fileId);

      const quitada = await http()
        .delete('/profiles/patients/me/photo')
        .set(bearer(patientToken))
        .expect(200);
      expect(quitada.body).not.toHaveProperty('photoFileId');

      const releidaSinFoto = await http()
        .get('/profiles/patients/me')
        .set(bearer(patientToken))
        .expect(200);
      expect(releidaSinFoto.body).not.toHaveProperty('photoFileId');
    });

    it('no acepta el archivo de otro usuario', async () => {
      // Un segundo paciente sube su propia foto; el primero no puede apuntar la
      // suya a un archivo que no le pertenece.
      const otroDocumento = `INT-OWN-${randomUUID().slice(0, 8)}`;
      await http()
        .post('/iam/auth/register-patient')
        .send({
          nationalId: otroDocumento,
          email: `own-profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`,
          password,
          name: 'Otro',
          lastName: 'Paciente',
          birthDate: '1985-01-01',
          sexAtBirth: 'MALE',
          phone: '+591 700 22222',
          residenceMunicipalityConceptId: municipioInicial,
          issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
        })
        .expect(201);
      const otroLogin = await http()
        .post('/iam/auth/login')
        .send({ nationalId: otroDocumento, password })
        .expect(200);

      const subidoPorOtro = await http()
        .post('/common/files/upload')
        .set(bearer(otroLogin.body.accessToken))
        .field('category', 'IMAGE')
        .field('sensitivity', 'NORMAL')
        .attach('file', PNG_1PX, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(201);

      await http()
        .put('/profiles/patients/me/photo')
        .set(bearer(patientToken))
        .send({ fileId: subidoPorOtro.body.id })
        .expect(403);
    });

    it('rechaza un archivo que no es imagen', async () => {
      const subidoDocumento = await http()
        .post('/common/files/upload')
        .set(bearer(patientToken))
        .field('category', 'DOCUMENT')
        .field('sensitivity', 'NORMAL')
        .attach('file', Buffer.from('%PDF-1.4 no es un pdf real'), {
          filename: 'papel.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      await http()
        .put('/profiles/patients/me/photo')
        .set(bearer(patientToken))
        .send({ fileId: subidoDocumento.body.id })
        .expect(422);
    });

    it('quitar la foto sin tenerla no falla', async () => {
      await http()
        .delete('/profiles/patients/me/photo')
        .set(bearer(patientToken))
        .expect(200);
    });

    it('sin token, ninguna de las dos rutas responde', async () => {
      await http().put('/profiles/patients/me/photo').send({}).expect(401);
      await http().delete('/profiles/patients/me/photo').expect(401);
    });
  });

  /** Cliente HTTP contra la app bajo prueba. */
  function http(): request.Agent {
    return request(ctx.app.getHttpServer());
  }

  /**
   * Resuelve el uuid de una ocupación real recorriendo los dos endpoints
   * públicos del catálogo, que son los que tiene delante el formulario: primero
   * el conjunto por su código estable y después su expansión.
   *
   * Si el catálogo no está sembrado, falla diciéndolo: un salto silencioso
   * dejaría la prueba en verde sin haber ejercido nada.
   *
   * @returns El concepto de la primera ocupación seleccionable.
   */
  async function primeraOcupacionSeleccionable(): Promise<string> {
    const conjuntos = await http()
      .get('/terminology/value-sets')
      .query({ code: BO_OCCUPATION_VALUE_SET })
      .expect(200);

    const conjunto = conjuntos.body.items[0];
    if (!conjunto) {
      throw new Error(
        `${BO_OCCUPATION_VALUE_SET} no está sembrado en la base de integración`,
      );
    }

    const expansion = await http()
      .get(`/terminology/value-sets/${conjunto.id}/$expand`)
      .expect(200);

    // Los conceptos abstractos agrupan y no se eligen; el catálogo de
    // ocupaciones hoy no tiene ninguno, y filtrarlos igual evita que la prueba
    // dependa de que siga siendo así.
    const miembro = expansion.body.items.find(
      (item: { selectable?: boolean }) => item.selectable !== false,
    );
    if (!miembro) {
      throw new Error(
        `${BO_OCCUPATION_VALUE_SET} no está sembrado en la base de integración`,
      );
    }
    return miembro.conceptId;
  }
});
