import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';
import { SEED } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * B.1 · dependientes y tutor legal, contra la base.
 *
 * ## Por qué contra la base y no con dobles
 *
 * Porque lo que hay que comprobar es **quién puede qué**, y eso depende de
 * filas que sólo existen ahí: el apoderamiento lo escribe una transacción de
 * cinco filas en cuatro tablas, y las dos FK NOT NULL que exige las siembra el
 * arranque. Un doble devuelve lo que se le pida; acá el rechazo tiene que
 * venir de la fila que falta.
 *
 * ## Lo que fija
 *
 * 1. El titular registra a su hijo y lo ve en su listado, con el parentesco
 *    dado vuelta.
 * 2. El apoderamiento habilita: pide turno por él y lee su historia.
 * 3. Otra cuenta no puede nada de eso — ni retener, ni listar, ni leer.
 * 4. Un documento repetido se rechaza.
 *
 * No trunca la base: cada corrida registra sus propias personas con documentos
 * únicos, así que es reproducible sin llevarse por delante lo que ya haya.
 */
describe('B.1 · dependientes y tutor legal (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;

  const password = 'S3cret-passw0rd';
  const marca = randomUUID().slice(0, 8);

  /** La madre: registra al dependiente y actúa por él. */
  let tokenMadre: string;
  let perfilMadre: string;

  /** Otra cuenta de paciente, sin ningún vínculo con el dependiente. */
  let tokenAjeno: string;

  /** El dependiente recién creado. */
  let perfilHijo: string;

  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);

  /** Lee los claims de un token sin verificar la firma: sólo interesa `pid`. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Registra un paciente y devuelve su token y su perfil. */
  async function registrarPaciente(
    etiqueta: string,
  ): Promise<{ token: string; patientProfileId: string }> {
    const nationalId = `B1-${etiqueta}-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        displayName: `Paciente ${etiqueta}`,
        email: `b1-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);

    const token = login.body.accessToken as string;
    return { token, patientProfileId: claims(token)['pid'] as string };
  }

  /**
   * Publica una agenda con cupos y devuelve el primer cupo libre.
   *
   * Mismo camino que `tj2-reglas-cita`: recurso, plantilla, generación y
   * lectura. El desplazamiento en horas lo pide cada prueba para no chocar con
   * la regla de un solo turno por franja.
   */
  async function cupoDesde(horas: number): Promise<string> {
    const recurso = await http()
      .post('/scheduling/resources')
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        resourceType: 'ROOM',
        resourceRefType: 'practice_sites',
        resourceRefId: randomUUID(),
        name: `Consultorio B1 ${horas}h ${marca}`,
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);

    const plantilla = await http()
      .post(`/scheduling/resources/${recurso.body.id}/templates`)
      .set(admin())
      .send({
        name: 'Todo el día',
        slotMinutes: 30,
        rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '00:00:00',
          endTime: '23:30:00',
        })),
      })
      .expect(201);

    const desde = new Date(Date.now() + horas * 60 * 60 * 1000);
    const hasta = new Date(desde.getTime() + 2 * 60 * 60 * 1000);
    await http()
      .post(`/scheduling/templates/${plantilla.body.id}/generate-slots`)
      .set(admin())
      .send({ from: desde.toISOString(), to: hasta.toISOString() })
      .expect(201);

    const cupos = await http()
      .get(`/scheduling/resources/${recurso.body.id}/slots`)
      .query({ from: desde.toISOString(), to: hasta.toISOString(), limit: 1 })
      .set(admin())
      .expect(200);

    expect(cupos.body.count).toBeGreaterThan(0);
    return cupos.body.items[0].id as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const madre = await registrarPaciente('madre');
    tokenMadre = madre.token;
    perfilMadre = madre.patientProfileId;
    expect(perfilMadre).toBeDefined();

    const ajeno = await registrarPaciente('ajeno');
    tokenAjeno = ajeno.token;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('alta del dependiente', () => {
    it('sin dependientes, el listado es una lista vacía', async () => {
      const res = await http()
        .get('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('registra al hijo y devuelve el parentesco dado vuelta', async () => {
      // La madre declara qué es ELLA para él —«soy su madre»— y la respuesta lo
      // dice desde el otro lado, que es como se lee en la tarjeta.
      const res = await http()
        .post('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .send({
          name: 'Mateo',
          lastName: 'Quispe',
          birthDate: '2018-03-14',
          sexAtBirth: 'MALE',
          relationshipConceptId: PROF.RELATIONSHIP_MOTHER,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        fullName: 'Mateo Quispe',
        relationshipCode: 'CHILD',
        relationshipDisplay: 'Hijo/a',
        isLegalGuardian: true,
        birthDate: '2018-03-14',
      });
      expect(res.body.patientProfileId).toBeDefined();
      expect(res.body.id).toBeDefined();
      perfilHijo = res.body.patientProfileId;
    });

    it('las cuatro filas quedaron escritas, y el apoderamiento apunta al seed', async () => {
      // Lo que ninguna prueba con dobles puede ver: que las dos FK NOT NULL que
      // el modelo exige tengan a qué apuntar. Sin el sembrado, este insert
      // habría reventado en la base.
      const em = ctx.orm.em.fork();
      const [proxy] = await em.getConnection().execute<
        {
          scope_value_set_id: string;
          legal_basis_record_id: string;
          status_concept_id: string;
          valid_to: Date | null;
        }[]
      >(
        `select scope_value_set_id, legal_basis_record_id, status_concept_id, valid_to
           from profiles.patient_portal_proxies
          where patient_profile_id = ?`,
        [perfilHijo],
      );
      expect(proxy.scope_value_set_id).toBe(
        SEED.patientPortalProxyScopeValueSetId,
      );
      expect(proxy.legal_basis_record_id).toBe(SEED.guardianProxyLegalBasisId);
      expect(proxy.status_concept_id).toBe(PROF.PROXY_ACTIVE);
      // La representación de una madre sobre su hijo no vence: se revoca.
      expect(proxy.valid_to).toBeNull();

      const [parentesco] = await em
        .getConnection()
        .execute<
          { is_legal_guardian: boolean; relationship_concept_id: string }[]
        >(
          `select is_legal_guardian, relationship_concept_id
           from profiles.related_persons
          where patient_profile_id = ?`,
          [perfilHijo],
        );
      expect(parentesco.is_legal_guardian).toBe(true);
      expect(parentesco.relationship_concept_id).toBe(PROF.RELATIONSHIP_MOTHER);

      const [paciente] = await em
        .getConnection()
        .execute<{ patient_code: string }[]>(
          `select patient_code from profiles.patient_profiles where profile_id = ?`,
          [perfilHijo],
        );
      expect(paciente.patient_code).toMatch(/^PAT-/);
    });

    it('ahora aparece en su listado, con la edad calculada por el servidor', async () => {
      const res = await http()
        .get('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        patientProfileId: perfilHijo,
        fullName: 'Mateo Quispe',
        relationshipCode: 'CHILD',
      });
      expect(typeof res.body[0].ageYears).toBe('number');
      expect(res.body[0].ageYears).toBeGreaterThan(0);
    });

    it('el dependiente de una cuenta no aparece en el listado de otra', async () => {
      const res = await http()
        .get('/profiles/patients/me/dependents')
        .set(bearer(tokenAjeno))
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('un documento ya registrado se rechaza con 409', async () => {
      // Dos perfiles con el mismo documento son dos historias de la misma
      // persona, que es lo que la fusión existe para deshacer.
      const documento = `B1-DUP-${marca}`;
      await http()
        .post('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .send({
          name: 'Abuela',
          lastName: 'Quispe',
          birthDate: '1948-01-20',
          nationalId: documento,
          relationshipConceptId: PROF.RELATIONSHIP_CHILD,
        })
        .expect(201);

      await http()
        .post('/profiles/patients/me/dependents')
        .set(bearer(tokenAjeno))
        .send({
          name: 'Otra',
          lastName: 'Persona',
          birthDate: '1950-05-05',
          nationalId: documento,
          relationshipConceptId: PROF.RELATIONSHIP_CHILD,
        })
        .expect(409);
    });

    it('un parentesco que no habilita a representar se rechaza en la frontera', async () => {
      // Un vecino describe a un contacto de emergencia, no a alguien de quien
      // uno se hace cargo.
      await http()
        .post('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .send({
          name: 'Vecino',
          lastName: 'Del Piso',
          birthDate: '1990-01-01',
          relationshipConceptId: PROF.RELATIONSHIP_FRIEND,
        })
        .expect(400);
    });

    it('una fecha de nacimiento futura se rechaza', async () => {
      const manana = new Date(Date.now() + 86_400_000)
        .toISOString()
        .slice(0, 10);

      await http()
        .post('/profiles/patients/me/dependents')
        .set(bearer(tokenMadre))
        .send({
          name: 'Nadie',
          lastName: 'Todavía',
          birthDate: manana,
          relationshipConceptId: PROF.RELATIONSHIP_MOTHER,
        })
        .expect(422);
    });
  });

  describe('pedir turno por el dependiente', () => {
    it('la madre retiene y solicita un turno para su hijo', async () => {
      const slotId = await cupoDesde(72);

      const hold = await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(bearer(tokenMadre))
        .send({ patientProfileId: perfilHijo })
        .expect(201);

      const reserva = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/request`)
        .set(bearer(tokenMadre))
        .send({
          tenantId: SEED.tenantId,
          patientProfileId: perfilHijo,
          channel: 'PORTAL',
          reasonText: 'Dolor de oído',
        })
        .expect(201);

      expect(reserva.body.id).toBeDefined();

      // La respuesta del alta no lleva el paciente —`BookingResponseDto` sólo
      // trae id, cupo, estado y recordatorios—, así que se lee de vuelta: eso
      // prueba de paso que la fila quedó a nombre del dependiente y que la
      // madre puede leerla.
      const guardada = await http()
        .get(`/scheduling/bookings/${reserva.body.id}`)
        .set(bearer(tokenMadre))
        .expect(200);

      expect(guardada.body.patientProfileId).toBe(perfilHijo);
    });

    it('y ve en el listado el turno de su hijo, con el motivo que ella escribió', async () => {
      const res = await http()
        .get('/scheduling/bookings')
        .query({ patientProfileId: perfilHijo })
        .set(bearer(tokenMadre))
        .expect(200);

      expect(res.body.count).toBeGreaterThan(0);
      // El motivo lo tipeó ella al pedir el turno: ocultárselo le escondería lo
      // que ella misma escribió.
      expect(JSON.stringify(res.body)).toContain('Dolor de oído');
    });

    it('otra cuenta NO puede retener un cupo para ese dependiente', async () => {
      const slotId = await cupoDesde(96);

      await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(bearer(tokenAjeno))
        .send({ patientProfileId: perfilHijo })
        .expect(403);
    });

    it('otra cuenta NO puede listar los turnos del dependiente', async () => {
      await http()
        .get('/scheduling/bookings')
        .query({ patientProfileId: perfilHijo })
        .set(bearer(tokenAjeno))
        .expect(403);
    });

    it('ni anotarlo en una lista de espera', async () => {
      await http()
        .post('/scheduling/waitlist')
        .set(bearer(tokenAjeno))
        .send({
          tenantId: SEED.tenantId,
          patientProfileId: perfilHijo,
          resourceId: randomUUID(),
        })
        .expect(403);
    });

    it('el titular sigue pudiendo pedir para sí mismo', async () => {
      // El candado no puede haber roto el caso de siempre.
      const slotId = await cupoDesde(120);

      const hold = await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(bearer(tokenMadre))
        .send({ patientProfileId: perfilMadre })
        .expect(201);

      expect(hold.body.holdToken).toBeDefined();
    });
  });

  describe('la historia clínica del dependiente', () => {
    it('la madre puede leer la historia de su hijo', async () => {
      const res = await http()
        .get(`/clinical/patients/${perfilHijo}/summary`)
        .set(bearer(tokenMadre))
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('otra cuenta recibe 403 sobre la misma historia', async () => {
      await http()
        .get(`/clinical/patients/${perfilHijo}/summary`)
        .set(bearer(tokenAjeno))
        .expect(403);
    });

    it('el rechazo es indistinguible del de un paciente que no existe', async () => {
      // Si el paciente ajeno diera un mensaje distinto del uuid inventado,
      // probar uuids confirmaría quién existe.
      const ajeno = await http()
        .get(`/clinical/patients/${perfilHijo}/summary`)
        .set(bearer(tokenAjeno))
        .expect(403);

      const inventado = await http()
        .get(`/clinical/patients/${randomUUID()}/summary`)
        .set(bearer(tokenAjeno))
        .expect(403);

      // Se comparan el código y el mensaje, no el cuerpo entero: `correlationId`,
      // `timestamp` y `path` son metadatos de cada petición y por definición
      // difieren. Lo que no puede diferir es lo que el rechazo dice.
      expect(inventado.body.code).toBe(ajeno.body.code);
      expect(inventado.body.message).toBe(ajeno.body.message);
      expect(inventado.status).toBe(ajeno.status);
    });

    it('y el titular sigue leyendo la suya', async () => {
      await http()
        .get(`/clinical/patients/${perfilMadre}/summary`)
        .set(bearer(tokenMadre))
        .expect(200);
    });
  });
});
