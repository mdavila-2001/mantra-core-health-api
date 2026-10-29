import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';

/**
 * P40 (carril C2) · la orden de análisis con su categoría textual y las notas
 * médicas que la motivan, contra la aplicación real y Postgres.
 *
 * ## Qué sólo se puede probar acá
 *
 * Las pruebas unitarias de `ServiceRequestsService` mockean el validador de
 * notas y las de `ServiceRequestNotesService` mockean el `find`. Ninguna de las
 * dos comprueba que:
 *
 * 1. el vínculo llegue de verdad a `clinical.service_request_notes` (con su FK
 *    a `chart.clinical_note_headers`) y se relea en
 *    `GET /diagnostics/patients/:id/orders`;
 * 2. una nota de **otro paciente** se rechace con una nota real de la base, y
 *    que el rechazo no deje una orden huérfana escrita;
 * 3. `category: 'OTHER'` encuentre el concepto `SR_OTHER` sembrado: la columna
 *    tiene FK al catálogo, así que sin la siembra el alta daría 500.
 *
 * Datos sintéticos: pacientes de mostrador («walk-in») creados por la suite.
 */
describe('P40 · orden de análisis basada en notas (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = { token: '', hpid: '', tenantId: '' };
  /** Un profesional sin vínculo asistencial con los pacientes de la suite. */
  const ajeno = { token: '', hpid: '' };

  /** Paciente A: dos consultas y notas en las dos. */
  const pacienteA = {
    id: '',
    encuentro: '',
    otroEncuentro: '',
    nota: '',
    notaDeOtraConsulta: '',
    notaEnBorrador: '',
    /** Nota del MISMO paciente escrita en una consulta de otro tenant. */
    notaDeOtroTenant: '',
  };
  /** Paciente B: una consulta con una nota. */
  const pacienteB = { id: '', encuentro: '', nota: '' };

  /** Un concepto del catálogo de estudios: el `codeConceptId` de cada orden. */
  const ESTUDIO = CLIN.STUDY_HEMOGRAMA;

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un lunes lejano: la agenda de esta suite no se cruza con la de otra. */
  function lunesLejano(semanas: number, hora: number): Date {
    const d = new Date();
    d.setUTCHours(hora, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + semanas * 7);
    return d;
  }

  async function registrarMedico(
    etiqueta: string,
  ): Promise<{ token: string; hpid: string }> {
    const email = `p40-${etiqueta}-${sufijo}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Profesional',
        lastName: `P40 ${etiqueta}`,
        licenseNumber: `LIC-P40-${sufijo}-${etiqueta}`,
        credentialNumber: `CRED-P40-${sufijo}-${etiqueta}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return {
      token: login.body.accessToken as string,
      hpid: alta.body.practitionerProfileId as string,
    };
  }

  async function walkIn(
    resourceId: string,
    nationalId: string,
    cuando: Date,
    token = medico.token,
  ): Promise<{ patientProfileId: string; encounterId: string }> {
    const res = await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(token))
      .send({
        patient: {
          name: 'Paciente',
          lastName: `P40 ${nationalId}`,
          nationalId,
          phone: '+591 70000040',
        },
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Control P40',
      })
      .expect(201);
    return {
      patientProfileId: res.body.patientProfileId as string,
      encounterId: res.body.encounterId as string,
    };
  }

  /**
   * Una nota de la consulta, firmada salvo que se pida borrador: sólo una nota
   * firmada o enmendada puede motivar una orden.
   */
  /** Una consulta nueva del paciente, abierta por ingreso directo. */
  async function checkIn(patientProfileId: string): Promise<string> {
    const res = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(medico.token))
      .send({ patientProfileId, tenantId: medico.tenantId })
      .expect(201);
    return res.body.id as string;
  }

  async function nota(
    patientProfileId: string,
    encounterId: string,
    texto: string,
    autor: { token: string; hpid: string } = medico,
    firmar = true,
  ): Promise<string> {
    const res = await http()
      .post('/charts/notes')
      .set(bearer(autor.token))
      .send({
        patientProfileId,
        authorProfileId: autor.hpid,
        encounterId,
        chiefComplaintText: texto,
      })
      .expect(201);
    if (firmar) {
      await http()
        .post(
          `/charts/notes/${res.body.noteId}/versions/${res.body.versionId}/sign`,
        )
        .set(bearer(autor.token))
        .send({ signerProfileId: autor.hpid })
        .expect(201);
    }
    return res.body.noteId as string;
  }

  function pedir(cuerpo: Record<string, unknown>, token = medico.token) {
    return http()
      .post('/clinical/service-requests')
      .set(bearer(token))
      .send({
        custodianTenantId: medico.tenantId,
        codeConceptId: ESTUDIO,
        ...cuerpo,
      });
  }

  async function sql<T>(query: string, params: unknown[]): Promise<T[]> {
    return ctx.orm.em.getConnection().execute<T[]>(query, params);
  }

  async function ordenesDe(patientProfileId: string): Promise<number> {
    const filas = await sql<{ n: string }>(
      'select count(*)::text as n from clinical.service_requests where patient_profile_id = ?',
      [patientProfileId],
    );
    return Number(filas[0]?.n ?? 0);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const a = await registrarMedico('med');
    medico.token = a.token;
    medico.hpid = a.hpid;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];
    const b = await registrarMedico('ajeno');
    ajeno.token = b.token;
    ajeno.hpid = b.hpid;

    async function consultorio(
      quien: { token: string; hpid: string; tenantId: string },
      nombre: string,
    ): Promise<string> {
      const recurso = await http()
        .post('/scheduling/resources')
        .set(bearer(quien.token))
        .send({
          tenantId: quien.tenantId,
          resourceType: 'PRACTITIONER',
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: quien.hpid,
          name: nombre,
          timeZone: 'America/La_Paz',
          capacity: 1,
        })
        .expect(201);
      return recurso.body.id as string;
    }
    const resourceId = await consultorio(medico, 'Consultorio P40');

    const a1 = await walkIn(resourceId, `P40A${sufijo}`, lunesLejano(3, 9));
    pacienteA.id = a1.patientProfileId;
    pacienteA.encuentro = a1.encounterId;
    // Segunda consulta del MISMO paciente: un ingreso directo (check-in).
    pacienteA.otroEncuentro = await checkIn(pacienteA.id);
    const b1 = await walkIn(resourceId, `P40B${sufijo}`, lunesLejano(3, 13));
    pacienteB.id = b1.patientProfileId;
    pacienteB.encuentro = b1.encounterId;

    pacienteA.nota = await nota(pacienteA.id, pacienteA.encuentro, 'Fiebre');
    pacienteA.notaDeOtraConsulta = await nota(
      pacienteA.id,
      pacienteA.otroEncuentro,
      'Control',
    );
    pacienteB.nota = await nota(pacienteB.id, pacienteB.encuentro, 'Tos');
    pacienteA.notaEnBorrador = await nota(
      pacienteA.id,
      pacienteA.encuentro,
      'Borrador',
      medico,
      false,
    );

    // El mismo paciente atendido en OTRO tenant. El auto-registro profesional
    // usa el tenant semilla para todos los médicos, así que —como FX-10— se
    // toma otro tenant ya sembrado y se le asigna una consulta nueva del mismo
    // paciente, con su nota firmada: una nota real de la base cuya custodia
    // no es la de la orden.
    const encuentroAjeno = await checkIn(pacienteA.id);
    pacienteA.notaDeOtroTenant = await nota(
      pacienteA.id,
      encuentroAjeno,
      'Nota del otro tenant',
    );
    const [otro] = await sql<{ id: string }>(
      'select id from directory.tenants where id <> ? order by id limit 1',
      [medico.tenantId],
    );
    expect(otro?.id).toBeDefined();
    await sql(
      'update clinical.encounters set tenant_id = ?, updated_at = now() where id = ?',
      [otro!.id, encuentroAjeno],
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('guarda la categoría y las notas, y las devuelve en el alta y en la ficha diagnóstica', async () => {
    const alta = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      category: 'LAB',
      basedOnNoteIds: [pacienteA.nota],
    }).expect(201);

    expect(alta.body.category).toBe('LAB');
    expect(alta.body.basedOnNoteIds).toEqual([pacienteA.nota]);

    const fila = await sql<{ category_concept_id: string }>(
      'select category_concept_id from clinical.service_requests where id = ?',
      [alta.body.id],
    );
    expect(fila[0]?.category_concept_id).toBe(
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    );
    const vinculos = await sql<{
      clinical_note_header_id: string;
      ordinal: number;
    }>(
      'select clinical_note_header_id, ordinal from clinical.service_request_notes where service_request_id = ?',
      [alta.body.id],
    );
    expect(vinculos).toEqual([
      { clinical_note_header_id: pacienteA.nota, ordinal: 0 },
    ]);

    const ficha = await http()
      .get(`/diagnostics/patients/${pacienteA.id}/orders`)
      .set(bearer(medico.token))
      .expect(200);
    const leida = ficha.body.orders.find(
      (o: { id: string }) => o.id === alta.body.id,
    );
    expect(leida).toMatchObject({
      category: 'LAB',
      basedOnNoteIds: [pacienteA.nota],
    });
  });

  it('category OTHER usa el concepto SR_OTHER sembrado y la orden aparece en la ficha', async () => {
    const alta = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      codeConceptId: CLIN.STUDY_ESPIROMETRIA,
      category: 'OTHER',
    }).expect(201);

    expect(alta.body.category).toBe('OTHER');
    expect(alta.body.basedOnNoteIds).toEqual([]);
    // El concepto es el de `clinical` (SR_OTHER) y existe en el catálogo: la
    // FK del alta lo exige, y el join lo confirma.
    const concepto = await sql<{ id: string }>(
      `select cc.id from clinical.service_requests sr
         join terminology.catalog_concepts cc on cc.id = sr.category_concept_id
        where sr.id = ?`,
      [alta.body.id],
    );
    expect(concepto[0]?.id).toBe(CLIN.SERVICE_REQUEST_CATEGORY_OTHER);

    const ficha = await http()
      .get(`/diagnostics/patients/${pacienteA.id}/orders`)
      .set(bearer(medico.token))
      .expect(200);
    const leida = ficha.body.orders.find(
      (o: { id: string }) => o.id === alta.body.id,
    );
    expect(leida?.category).toBe('OTHER');
  });

  it('NEGATIVO · una nota de otro paciente da 422 y no deja la orden escrita', async () => {
    const antes = await ordenesDe(pacienteA.id);

    const res = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      category: 'LAB',
      codeConceptId: CLIN.STUDY_GLICEMIA,
      basedOnNoteIds: [pacienteB.nota],
    }).expect(422);

    expect(res.body.reason).toBe('BASED_ON_NOTE_NOT_FOUND');
    // Misma respuesta que una nota inexistente: no confirma que el id exista.
    const inexistente = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      codeConceptId: CLIN.STUDY_GLICEMIA,
      basedOnNoteIds: [randomUUID()],
    }).expect(422);
    expect(inexistente.body.reason).toBe(res.body.reason);
    expect(inexistente.body.message).toBe(res.body.message);

    expect(await ordenesDe(pacienteA.id)).toBe(antes);
  });

  it('NEGATIVO · una nota del MISMO paciente pero de otro tenant da 422 sin revelar que existe', async () => {
    const antes = await ordenesDe(pacienteA.id);
    // Sin encuentro en la orden: así sólo la custodia puede rechazarla.
    const res = await pedir({
      patientProfileId: pacienteA.id,
      codeConceptId: CLIN.STUDY_GLICEMIA,
      basedOnNoteIds: [pacienteA.notaDeOtroTenant],
    }).expect(422);

    expect(res.body.reason).toBe('BASED_ON_NOTE_NOT_FOUND');
    expect(await ordenesDe(pacienteA.id)).toBe(antes);
  });

  it('NEGATIVO · una nota en borrador no motiva una orden (422, mismo motivo)', async () => {
    const res = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      codeConceptId: CLIN.STUDY_GLICEMIA,
      basedOnNoteIds: [pacienteA.notaEnBorrador],
    }).expect(422);

    expect(res.body.reason).toBe('BASED_ON_NOTE_NOT_FOUND');
  });

  it('NEGATIVO · una nota del paciente pero de otra consulta da 422', async () => {
    const res = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      codeConceptId: CLIN.STUDY_GLICEMIA,
      basedOnNoteIds: [pacienteA.notaDeOtraConsulta],
    }).expect(422);

    expect(res.body.reason).toBe('BASED_ON_NOTE_ENCOUNTER_MISMATCH');
  });

  it('NEGATIVO · category que contradice categoryConceptId da 422', async () => {
    const res = await pedir({
      patientProfileId: pacienteA.id,
      encounterId: pacienteA.encuentro,
      codeConceptId: CLIN.STUDY_GLICEMIA,
      category: 'IMAGING',
      categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    }).expect(422);

    expect(res.body.reason).toBe('SERVICE_REQUEST_CATEGORY_MISMATCH');
  });

  it('NEGATIVO · el contrato rechaza una categoría fuera de las tres y notas repetidas (400)', async () => {
    await pedir({
      patientProfileId: pacienteA.id,
      category: 'CARDIO',
    }).expect(400);
    await pedir({
      patientProfileId: pacienteA.id,
      basedOnNoteIds: [pacienteA.nota, pacienteA.nota],
    }).expect(400);
  });

  it('NEGATIVO · un profesional sin vínculo asistencial no puede pedir la orden ni leer la ficha', async () => {
    await pedir(
      {
        patientProfileId: pacienteA.id,
        encounterId: pacienteA.encuentro,
        category: 'LAB',
        basedOnNoteIds: [pacienteA.nota],
      },
      ajeno.token,
    ).expect(403);

    await http()
      .get(`/diagnostics/patients/${pacienteA.id}/orders`)
      .set(bearer(ajeno.token))
      .expect(403);
  });
});
