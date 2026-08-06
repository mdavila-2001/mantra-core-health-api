import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * Los flujos de lectura que el frontend consume de `profiles`, `scheduling`,
 * `chart` y `clinical`, ejercidos de punta a punta contra la aplicación real.
 *
 * Existe porque los cuatro módulos eran **de sólo escritura**: se podía dar de
 * alta un paciente, generar una agenda, escribir una nota y firmar una receta,
 * y no había ninguna operación para volver a leer nada de eso. Las pruebas
 * unitarias con dobles no lo detectaban —cada servicio hacía exactamente lo que
 * su spec le pedía— porque el fallo no estaba en lo implementado sino en lo que
 * faltaba.
 *
 * Cada caso escribe con los endpoints reales y **vuelve a leer con los de
 * lectura**: es la única forma de que un dato que se persiste pero no se
 * devuelve —el patrón que ya se coló una vez con la expansión de terminología—
 * haga fallar la suite en vez de pasar inadvertido.
 */
describe('Flujos de lectura del frontend (integración)', () => {
  let ctx: TestContext;
  /** Sufijo único: la suite corre contra una base con datos de otras corridas. */
  const u = Date.now();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);

  /** Da de alta un paciente y devuelve su `profileId`. */
  async function createPatient(suffix: string): Promise<string> {
    const res = await http()
      .post('/profiles/patients')
      .set(auth())
      .send({
        patientCode: `PAC-${u}-${suffix}`,
        displayName: `Paciente ${suffix}`,
        birthDate: '1990-05-14',
      })
      .expect(201);
    return res.body.profileId as string;
  }

  /** Da de alta un profesional y devuelve su `profileId`. */
  async function createPractitioner(suffix: string): Promise<string> {
    const res = await http()
      .post('/profiles/practitioners')
      .set(auth())
      .send({
        practitionerCode: `MED-${u}-${suffix}`,
        displayName: `Dr. ${suffix}`,
        licenseNumber: `LIC-${u}-${suffix}`,
        credentialNumber: `CRED-${u}-${suffix}`,
      })
      .expect(201);
    return res.body.profileId as string;
  }

  describe('profiles: la ficha de filiación se puede volver a leer', () => {
    it('el paciente recién dado de alta aparece en el listado y en su ficha', async () => {
      const profileId = await createPatient('lectura');

      const detail = await http()
        .get(`/profiles/patients/${profileId}`)
        .set(auth())
        .expect(200);

      expect(detail.body.profileId).toBe(profileId);
      expect(detail.body.patientCode).toBe(`PAC-${u}-lectura`);
      expect(detail.body.displayName).toBe('Paciente lectura');
      expect(detail.body.relatedPersons).toEqual([]);

      // La búsqueda tiene que encontrarlo por su código: un listado que
      // devuelve filas pero cuyo filtro no filtra es el fallo que se busca.
      const list = await http()
        .get(`/profiles/patients?q=PAC-${u}-lectura`)
        .set(auth())
        .expect(200);

      expect(list.body.count).toBe(1);
      expect(list.body.items[0].profileId).toBe(profileId);
    });

    it('el contacto de emergencia registrado se devuelve con su nombre, no sólo su id', async () => {
      const profileId = await createPatient('contacto');

      await http()
        .post(`/profiles/patients/${profileId}/related-persons`)
        .set(auth())
        .send({
          displayName: 'Ana Contacto',
          isEmergencyContact: true,
        })
        .expect(201);

      const detail = await http()
        .get(`/profiles/patients/${profileId}`)
        .set(auth())
        .expect(200);

      expect(detail.body.relatedPersons).toHaveLength(1);
      // Un contacto de emergencia sin nombre no sirve de nada: el vínculo vive
      // en `related_persons` pero el nombre está en `persons`, y resolverlo es
      // justo lo que se probaría de menos con un doble.
      expect(detail.body.relatedPersons[0].displayName).toBe('Ana Contacto');
      expect(detail.body.relatedPersons[0].isEmergencyContact).toBe(true);
    });

    it('un perfil inexistente es 404 y no una ficha vacía', async () => {
      await http()
        .get('/profiles/patients/00000000-0000-4000-8000-0000000000ff')
        .set(auth())
        .expect(404);
    });

    it('el cursor pagina sin repetir ni saltarse filas', async () => {
      await createPatient('pag-a');
      await createPatient('pag-b');
      await createPatient('pag-c');

      const first = await http()
        .get(`/profiles/patients?q=PAC-${u}-pag&limit=2`)
        .set(auth())
        .expect(200);

      expect(first.body.count).toBe(2);
      expect(first.body.nextCursor).toBeTruthy();

      const second = await http()
        .get(
          `/profiles/patients?q=PAC-${u}-pag&limit=2&cursor=${encodeURIComponent(
            first.body.nextCursor,
          )}`,
        )
        .set(auth())
        .expect(200);

      const codes = [
        ...first.body.items.map((i: { patientCode: string }) => i.patientCode),
        ...second.body.items.map((i: { patientCode: string }) => i.patientCode),
      ];
      expect(codes).toHaveLength(3);
      expect(new Set(codes).size).toBe(3);
      expect(second.body.nextCursor).toBeNull();
    });
  });

  describe('scheduling: la agenda se puede leer y reservar desde lo leído', () => {
    /**
     * Monta un recurso con plantilla y slots materializados en una ventana
     * futura, y devuelve los ids.
     */
    async function seedAgenda(suffix: string): Promise<{
      resourceId: string;
      from: string;
      to: string;
    }> {
      const practitionerId = await createPractitioner(suffix);
      const resource = await http()
        .post('/scheduling/resources')
        .set(auth())
        .send({
          tenantId: SEED.tenantId,
          resourceType: 'PRACTITIONER',
          resourceRefType: 'practitioner_profiles',
          resourceRefId: practitionerId,
          name: `Consultorio ${suffix}`,
          timeZone: 'America/La_Paz',
          capacity: 1,
        })
        .expect(201);

      const template = await http()
        .post(`/scheduling/resources/${resource.body.id}/templates`)
        .set(auth())
        .send({
          name: 'Mañanas',
          slotMinutes: 30,
          rules: [
            { dayOfWeek: 0, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 2, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 3, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 4, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 5, startTime: '08:00:00', endTime: '10:00:00' },
            { dayOfWeek: 6, startTime: '08:00:00', endTime: '10:00:00' },
          ],
        })
        .expect(201);

      // Ventana cubriendo toda la semana siguiente: la plantilla declara los
      // siete días, así que siempre caen slots sea cual sea el día en que corra
      // la suite.
      const from = new Date(Date.now() + 24 * 60 * 60 * 1000);
      from.setUTCHours(0, 0, 0, 0);
      const to = new Date(from.getTime() + 8 * 24 * 60 * 60 * 1000);

      const generated = await http()
        .post(`/scheduling/templates/${template.body.id}/generate-slots`)
        .set(auth())
        .send({ from: from.toISOString(), to: to.toISOString() })
        .expect(201);

      // Si la generación no materializa nada, la prueba de lectura de abajo
      // pasaría trivialmente con una agenda vacía.
      expect(generated.body.created).toBeGreaterThan(0);

      return {
        resourceId: resource.body.id as string,
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    it('los slots generados se listan y el id devuelto sirve para tomar el hold', async () => {
      const { resourceId, from, to } = await seedAgenda('agenda');
      const patientProfileId = await createPatient('agenda');

      const agenda = await http()
        .get(
          `/scheduling/resources/${resourceId}/slots?from=${from}&to=${to}&limit=5`,
        )
        .set(auth())
        .expect(200);

      expect(agenda.body.count).toBeGreaterThan(0);
      expect(agenda.body.items[0].available).toBe(true);

      // El contrato completo: el `slotId` que devuelve la lectura es el que
      // acepta el endpoint de reserva. Si no lo fuera, la agenda sería
      // decorativa.
      const slotId = agenda.body.items[0].id;
      const hold = await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(auth())
        .send({ patientProfileId })
        .expect(201);

      const booking = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
        .set(auth())
        .send({
          tenantId: SEED.tenantId,
          patientProfileId,
          channel: 'PORTAL',
        })
        .expect(201);

      const listed = await http()
        .get(`/scheduling/bookings?patientProfileId=${patientProfileId}`)
        .set(auth())
        .expect(200);

      expect(listed.body.count).toBe(1);
      expect(listed.body.items[0].id).toBe(booking.body.id);
      // El instante vive en el slot, no en la cita: si no se resolviera, el
      // listado no podría ordenarse ni pintarse en un calendario.
      expect(listed.body.items[0].startAt).toBe(agenda.body.items[0].startAt);
    });

    it('el slot reservado deja de ofrecerse como disponible', async () => {
      const { resourceId, from, to } = await seedAgenda('ocupado');
      const patientProfileId = await createPatient('ocupado');

      const before = await http()
        .get(`/scheduling/resources/${resourceId}/slots?from=${from}&to=${to}`)
        .set(auth())
        .expect(200);
      const slotId = before.body.items[0].id;

      const hold = await http()
        .post(`/scheduling/slots/${slotId}/holds`)
        .set(auth())
        .send({ patientProfileId })
        .expect(201);
      await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
        .set(auth())
        .send({ tenantId: SEED.tenantId, patientProfileId, channel: 'PORTAL' })
        .expect(201);

      const after = await http()
        .get(`/scheduling/resources/${resourceId}/slots?from=${from}&to=${to}`)
        .set(auth())
        .expect(200);

      const stillOffered = after.body.items.some(
        (slot: { id: string }) => slot.id === slotId,
      );
      // Ofrecer un slot sin cupo lleva al paciente a un 409 al confirmar: el
      // filtro va por capacidad restante y no por el estado del slot.
      expect(stillOffered).toBe(false);

      const withOccupied = await http()
        .get(
          `/scheduling/resources/${resourceId}/slots?from=${from}&to=${to}&onlyAvailable=false`,
        )
        .set(auth())
        .expect(200);
      const occupied = withOccupied.body.items.find(
        (slot: { id: string }) => slot.id === slotId,
      );
      expect(occupied).toBeDefined();
      expect(occupied.available).toBe(false);
    });

    it('la cita cancelada desaparece del listado salvo que se pidan las canceladas', async () => {
      const { resourceId, from, to } = await seedAgenda('cancel');
      const patientProfileId = await createPatient('cancel');

      const agenda = await http()
        .get(`/scheduling/resources/${resourceId}/slots?from=${from}&to=${to}`)
        .set(auth())
        .expect(200);
      const hold = await http()
        .post(`/scheduling/slots/${agenda.body.items[0].id}/holds`)
        .set(auth())
        .send({ patientProfileId })
        .expect(201);
      const booking = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
        .set(auth())
        .send({ tenantId: SEED.tenantId, patientProfileId, channel: 'PORTAL' })
        .expect(201);

      await http()
        .post(`/scheduling/bookings/${booking.body.id}/cancel`)
        .set(auth())
        .send({ cancelledBy: 'PATIENT' })
        .expect(200);

      const active = await http()
        .get(`/scheduling/bookings?patientProfileId=${patientProfileId}`)
        .set(auth())
        .expect(200);
      expect(active.body.count).toBe(0);

      const all = await http()
        .get(
          `/scheduling/bookings?patientProfileId=${patientProfileId}&includeCancelled=true`,
        )
        .set(auth())
        .expect(200);
      expect(all.body.count).toBe(1);
      expect(all.body.items[0].id).toBe(booking.body.id);
    });

    it('listar citas sin acotar por paciente ni recurso se rechaza', async () => {
      // Sin este corte la consulta devolvería las citas de todos los pacientes
      // de todos los tenants.
      await http().get('/scheduling/bookings').set(auth()).expect(422);
    });

    it('una ventana invertida se rechaza en vez de devolver una agenda vacía', async () => {
      const { resourceId, from, to } = await seedAgenda('ventana');
      await http()
        .get(`/scheduling/resources/${resourceId}/slots?from=${to}&to=${from}`)
        .set(auth())
        .expect(422);
    });

    it('un recurso inexistente es 404 y no una agenda sin huecos', async () => {
      const from = new Date().toISOString();
      const to = new Date(Date.now() + 86_400_000).toISOString();
      await http()
        .get(
          `/scheduling/resources/00000000-0000-4000-8000-0000000000ff/slots?from=${from}&to=${to}`,
        )
        .set(auth())
        .expect(404);
    });
  });

  describe('chart y clinical: lo escrito en el expediente se vuelve a leer', () => {
    it('la nota firmada y liberada aparece en el expediente con su texto', async () => {
      const patientProfileId = await createPatient('nota');
      const authorProfileId = await createPractitioner('nota');

      const note = await http()
        .post('/charts/notes')
        .set(auth())
        .send({
          patientProfileId,
          authorProfileId,
          chiefComplaintText: 'Dolor abdominal',
          subjectiveText: 'Refiere dolor de tres días',
          assessmentText: 'Gastroenteritis probable',
          planText: 'Hidratación y control',
        })
        .expect(201);

      await http()
        .post(
          `/charts/notes/${note.body.noteId}/versions/${note.body.versionId}/sign`,
        )
        .set(auth())
        .send({ signerProfileId: authorProfileId })
        .expect(201);

      await http()
        .post(`/charts/notes/versions/${note.body.versionId}/release`)
        .set(auth())
        .send({ policyVersion: 'v1' })
        .expect(201);

      const chart = await http()
        .get(`/charts/patients/${patientProfileId}/chart`)
        .set(auth())
        .expect(200);

      expect(chart.body.notes).toHaveLength(1);
      const read = chart.body.notes[0];
      expect(read.noteId).toBe(note.body.noteId);
      // El texto vive en la versión, no en la cabecera: sin resolverla, el
      // expediente devolvería una lista de notas sin contenido.
      expect(read.chiefComplaintText).toBe('Dolor abdominal');
      expect(read.assessmentText).toBe('Gastroenteritis probable');
      expect(read.versionNumber).toBe(1);
      expect(read.signedAt).toBeTruthy();
      expect(read.releasedToPatient).toBe(true);
    });

    it('el plan de cuidados se lee con sus actividades', async () => {
      const patientProfileId = await createPatient('plan');
      const authorProfileId = await createPractitioner('plan');

      await http()
        .post('/charts/care-plans')
        .set(auth())
        .send({
          patientProfileId,
          authorProfileId,
          goalText: 'Recuperar hidratación',
          startDate: '2026-08-06',
          activities: [{ detailText: 'Control en 48h' }],
        })
        .expect(201);

      const chart = await http()
        .get(`/charts/patients/${patientProfileId}/chart`)
        .set(auth())
        .expect(200);

      expect(chart.body.carePlans).toHaveLength(1);
      expect(chart.body.carePlans[0].goalText).toBe('Recuperar hidratación');
      // Las actividades se resuelven en bloque para todos los planes; con un
      // solo plan esto verifica que el agrupado por plan no las pierde.
      expect(chart.body.carePlans[0].activities).toHaveLength(1);
      expect(chart.body.carePlans[0].activities[0].detailText).toBe(
        'Control en 48h',
      );
    });

    it('el expediente de un paciente sin nada es vacío pero no falla', async () => {
      const patientProfileId = await createPatient('vacio');

      const chart = await http()
        .get(`/charts/patients/${patientProfileId}/chart`)
        .set(auth())
        .expect(200);

      expect(chart.body.notes).toEqual([]);
      expect(chart.body.carePlans).toEqual([]);
      expect(chart.body.documents).toEqual([]);
      // Un expediente vacío tiene que ser distinguible de uno recortado.
      expect(chart.body.truncated).toEqual([]);
    });

    it('el expediente declara el recorte en vez de callarlo', async () => {
      const patientProfileId = await createPatient('recorte');
      const authorProfileId = await createPractitioner('recorte');

      for (let i = 0; i < 3; i++) {
        await http()
          .post('/charts/notes')
          .set(auth())
          .send({
            patientProfileId,
            authorProfileId,
            chiefComplaintText: `Consulta ${i}`,
          })
          .expect(201);
      }

      const chart = await http()
        .get(`/charts/patients/${patientProfileId}/chart?limit=2`)
        .set(auth())
        .expect(200);

      expect(chart.body.notes).toHaveLength(2);
      // Recortar en silencio haría que un expediente incompleto se leyera como
      // completo, que es la clase de omisión que no puede pasar en una historia
      // clínica.
      expect(chart.body.truncated).toContain('notes');
    });

    it('condición, alergia, observación y receta se leen del historial clínico', async () => {
      const patientProfileId = await createPatient('clinico');
      const prescriberProfileId = await createPractitioner('clinico');

      // Cualquier concepto real del catálogo sirve como código: lo que se
      // prueba es la lectura, no la semántica del término.
      const concepts = await http()
        .get('/terminology/concepts?limit=1')
        .set(auth())
        .expect(200);
      const codeConceptId = concepts.body.items[0].conceptId;

      const episode = await http()
        .post('/clinical/care-episodes')
        .set(auth())
        .send({ patientProfileId, tenantId: SEED.tenantId })
        .expect(201);

      const encounter = await http()
        .post('/clinical/encounters/check-in')
        .set(auth())
        .send({
          patientProfileId,
          tenantId: SEED.tenantId,
          episodeId: episode.body.id,
          reasonText: 'Dolor abdominal',
        })
        .expect(201);

      await http()
        .post('/clinical/conditions')
        .set(auth())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId,
          encounterId: encounter.body.id,
          codeConceptId,
        })
        .expect(201);

      await http()
        .post('/clinical/allergy-intolerances')
        .set(auth())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId,
          substanceConceptId: codeConceptId,
        })
        .expect(201);

      await http()
        .post('/clinical/observations')
        .set(auth())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId,
          codeConceptId,
          valueDecimal: 37.8,
        })
        .expect(201);

      const prescription = await http()
        .post('/clinical/medication-requests')
        .set(auth())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId,
          medicationConceptId: codeConceptId,
          prescriberProfileId,
          doseText: '500 mg',
          frequencyText: 'cada 8 horas',
        })
        .expect(201);

      const summary = await http()
        .get(`/clinical/patients/${patientProfileId}/summary`)
        .set(auth())
        .expect(200);

      expect(summary.body.conditions).toHaveLength(1);
      expect(summary.body.allergies).toHaveLength(1);
      expect(summary.body.observations).toHaveLength(1);
      expect(summary.body.encounters).toHaveLength(1);
      expect(summary.body.medicationRequests).toHaveLength(1);
      expect(summary.body.medicationRequests[0].id).toBe(prescription.body.id);
      expect(summary.body.medicationRequests[0].doseText).toBe('500 mg');
      expect(summary.body.truncated).toEqual([]);
    });

    it('el historial de un paciente ajeno no se mezcla con el del otro', async () => {
      const first = await createPatient('aislado-a');
      const second = await createPatient('aislado-b');
      const concepts = await http()
        .get('/terminology/concepts?limit=1')
        .set(auth())
        .expect(200);

      await http()
        .post('/clinical/conditions')
        .set(auth())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId: first,
          codeConceptId: concepts.body.items[0].conceptId,
        })
        .expect(201);

      const other = await http()
        .get(`/clinical/patients/${second}/summary`)
        .set(auth())
        .expect(200);

      // Un filtro por paciente que no filtra es exactamente el fallo que este
      // archivo existe para atrapar.
      expect(other.body.conditions).toEqual([]);
    });
  });

  describe('terminology: los ids de concepto se resuelven a etiqueta', () => {
    it('resuelve en lote los conceptId que devuelve el resto del contrato', async () => {
      const patientProfileId = await createPatient('etiquetas');

      const detail = await http()
        .get(`/profiles/patients/${patientProfileId}`)
        .set(auth())
        .expect(200);

      const ids = [
        detail.body.personStatusConceptId,
        detail.body.vitalStatusConceptId,
        detail.body.recordLinkageStatusConceptId,
      ].filter(Boolean);
      expect(ids.length).toBeGreaterThan(0);

      const resolved = await http()
        .get(`/terminology/concepts?ids=${ids.join(',')}`)
        .set(auth())
        .expect(200);

      // Sin esto el frontend sólo puede pintar UUIDs: ninguna otra operación
      // del catálogo resuelve un id (`$lookup` exige sistema y código).
      expect(resolved.body.count).toBe(ids.length);
      for (const item of resolved.body.items) {
        expect(item.display).toBeTruthy();
        expect(ids).toContain(item.conceptId);
      }
    });

    it('un id inexistente no aparece, y la lista se deduplica', async () => {
      const concepts = await http()
        .get('/terminology/concepts?limit=1')
        .set(auth())
        .expect(200);
      const real = concepts.body.items[0].conceptId;

      const resolved = await http()
        .get(
          `/terminology/concepts?ids=${real},${real},00000000-0000-4000-8000-0000000000ff`,
        )
        .set(auth())
        .expect(200);

      expect(resolved.body.count).toBe(1);
      expect(resolved.body.items[0].conceptId).toBe(real);
    });

    it('una lista mal formada es 400 del cliente, no 500 del servidor', async () => {
      await http()
        .get('/terminology/concepts?ids=no-es-uuid')
        .set(auth())
        .expect(400);
    });

    it('`ids` vacío se rechaza en vez de devolver el catálogo entero', async () => {
      // Sin este corte, `?ids=` se comportaría como "dame todos": una
      // resolución puntual que devuelve el catálogo completo.
      await http().get('/terminology/concepts?ids=').set(auth()).expect(400);
    });
  });
});
