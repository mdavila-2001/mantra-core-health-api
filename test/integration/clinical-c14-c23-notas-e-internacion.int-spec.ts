import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';

/**
 * C-14 (la cuadrícula de notas) y C-23 (la hoja de internación) del lote
 * `Noche-CorreccionesDoctor.ExpedienteYAceptacion`, contra la API real.
 *
 * **Ninguno de estos casos toca `VS_OBSERVATION_CODE` ni ningún value set de
 * clínica**: `codeConceptId` no se valida contra un catálogo
 * (`observations.service.ts` no lo mira), así que se usa cualquier concepto
 * de terminología, igual que hace `clinical-prescriptions-pdf.int-spec.ts`.
 *
 * `bootstrapTestApp()` se llama **sin** `{ reset: true }` a propósito: el
 * `.env` de esta máquina apunta a Neon compartida, y `resetBusinessData()`
 * hace `TRUNCATE … CASCADE` de todos los schemas. No usar `reset` acá.
 */
describe('C-14/C-23 · cuadrícula de notas y hoja de internación (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    userId: '',
    personId: '',
    email: '',
    token: '',
    hpid: '',
    tenantId: '',
  };
  const titular = { nationalId: '', token: '', pid: '' };
  const ajeno = { nationalId: '', token: '', pid: '' };

  let medicationConceptId1 = '';
  let medicationConceptId2 = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarPaciente(
    etiqueta: string,
  ): Promise<{ nationalId: string; token: string; pid: string }> {
    const nationalId = `C14-${etiqueta}-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente ${etiqueta}`,
        email: `c14-${etiqueta}-${sufijo}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    return { nationalId, token, pid: claims(token)['pid'] as string };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    medico.email = `c14-med-${sufijo}@example.test`;
    const altaMedico = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Marcelo',
        lastName: 'Ávila',
        licenseNumber: `LIC-C14-${sufijo}`,
        credentialNumber: `CRED-C14-${sufijo}`,
      })
      .expect(201);
    medico.userId = altaMedico.body.userId;
    medico.personId = altaMedico.body.personId;
    medico.hpid = altaMedico.body.practitionerProfileId;

    const loginMedico = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = loginMedico.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const t = await registrarPaciente('titular');
    titular.nationalId = t.nationalId;
    titular.token = t.token;
    titular.pid = t.pid;

    const a = await registrarPaciente('ajeno');
    ajeno.nationalId = a.nationalId;
    ajeno.token = a.token;
    ajeno.pid = a.pid;

    // Dos conceptos cualesquiera de terminología para hacer de "código de
    // medición": la API no exige que pertenezcan a un value set clínico.
    const concepts = await http()
      .get('/terminology/concepts?limit=2')
      .set(bearer(medico.token))
      .expect(200);
    medicationConceptId1 = concepts.body.items[0].conceptId;
    medicationConceptId2 = concepts.body.items[1].conceptId;
  });

  afterAll(async () => {
    // `medico` NO se limpia a propósito: el caso «acepta al médico apenas el
    // paciente responde su relación asistencial» ejercita
    // `POST /authz/care-relationships/request`, que sella un evento
    // `CARE_RELATIONSHIP_REQUESTED` en `audit.audit_log` con `user_id` =
    // `medico.userId` (`authz-care-relationships.service.ts:149`). Esa tabla
    // es WORM (`trg_forbid_mutation`, v4.0.10): ningún profesional que pase
    // por ese flujo puede borrarse después — no es un hueco del harness, es
    // el diseño. `clinical-prescriptions-pdf.int-spec.ts` deja el suyo por la
    // misma razón de fondo (nunca intenta limpiarlo). Mismo criterio que D5
    // del plan para los pacientes `@example.test`: queda declarado, no se
    // fuerza un DELETE contra una tabla de auditoría inmutable.
    await ctx.app.close();
  });

  describe('la guardia de lectura del expediente (FT-07)', () => {
    it('rechaza al médico sin relación asistencial ni turno con el paciente', async () => {
      await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(medico.token))
        .expect(403);
    });

    it('acepta al médico apenas el paciente responde su relación asistencial', async () => {
      const solicitud = await http()
        .post('/authz/care-relationships/request')
        .set(bearer(medico.token))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: titular.pid,
          relationshipType: 'TREATING',
          reasonText: 'Seguimiento C-14/C-23 (integración)',
        })
        .expect(201);

      await http()
        .post(`/authz/care-relationships/${solicitud.body.id}/respond`)
        .set(bearer(titular.token))
        .send({ decision: 'ACCEPT' })
        .expect(200);

      await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(medico.token))
        .expect(200);
    });

    it('el paciente titular lee su propia historia sin relación adicional', async () => {
      await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(titular.token))
        .expect(200);
    });
  });

  describe('C-14 · la fila es N observaciones con el mismo encounterId', () => {
    let encounterId = '';

    it('abre el encuentro', async () => {
      const checkIn = await http()
        .post('/clinical/encounters/check-in')
        .set(bearer(medico.token))
        .send({ patientProfileId: titular.pid, tenantId: medico.tenantId })
        .expect(201);
      encounterId = checkIn.body.id;
      expect(encounterId).toBeTruthy();
    });

    it('acepta dos observaciones distintas con el mismo encounterId', async () => {
      await http()
        .post('/clinical/observations')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId,
          codeConceptId: medicationConceptId1,
          quantityValue: 72.5,
        })
        .expect(201);

      await http()
        .post('/clinical/observations')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId,
          codeConceptId: medicationConceptId2,
          valueText: 'ruidos cardíacos rítmicos',
        })
        .expect(201);

      const resumen = await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(medico.token))
        .expect(200);

      const delEncuentro = (
        resumen.body.observations as Array<Record<string, unknown>>
      ).filter((o) => o['encounterId'] === encounterId);
      expect(delEncuentro).toHaveLength(2);
      // El tipo real que declara el DTO de lectura es string, no number
      // (`clinical-read.dto.ts:264`): se afirma para que la Fase 2 (front)
      // sepa qué formatear.
      const conCantidad = delEncuentro.find(
        (o) => o['codeConceptId'] === medicationConceptId1,
      );
      expect(typeof conCantidad?.['quantityValue']).toBe('string');
    });

    it('H3.S1.M2 — el servidor ACEPTA una tercera observación con el mismo encounterId', async () => {
      // La regla «una fila por sesión» es de la UI (`note-grid.ts`), no del
      // contrato: `observations.service.ts` no la mira. Documentado, no
      // corregido — no es un defecto, es el alcance real del contrato.
      const tercera = await http()
        .post('/clinical/observations')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId,
          codeConceptId: medicationConceptId1,
          quantityValue: 80,
        });
      expect(tercera.status).toBe(201);
    });

    it('rechaza un encounterId del paciente ajeno', async () => {
      const checkInAjeno = await http()
        .post('/clinical/encounters/check-in')
        .set(bearer(medico.token))
        .send({ patientProfileId: ajeno.pid, tenantId: medico.tenantId });
      // El médico no tiene relación con `ajeno`; si el check-in mismo ya
      // exige acceso, esto es un 403/404 y el caso queda documentado así.
      if (checkInAjeno.status !== 201) {
        expect([403, 404]).toContain(checkInAjeno.status);
        return;
      }
      await http()
        .post('/clinical/observations')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId: checkInAjeno.body.id,
          codeConceptId: medicationConceptId1,
          valueText: 'no debería escribirse',
        })
        .expect(404);
    });
  });

  describe('C-23 · la hoja de internación (care-episodes)', () => {
    it('D-02 — abre un episodio sin typeConceptId: el servidor lo acepta y queda sin tipo', async () => {
      const alta = await http()
        .post('/clinical/care-episodes')
        .set(bearer(medico.token))
        .send({
          patientProfileId: titular.pid,
          tenantId: medico.tenantId,
          responsiblePractitionerId: medico.hpid,
        })
        .expect(201);
      expect(alta.body.status).toBeTruthy();

      const resumen = await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(medico.token))
        .expect(200);
      const episodio = (
        resumen.body.careEpisodes as Array<Record<string, unknown>>
      ).find((e) => e['id'] === alta.body.id);
      expect(episodio).toBeTruthy();
      // Una FK nullable sin valor hidrata como `null`, nunca `undefined`
      // (MikroORM): ver la memoria del proyecto sobre este mismo patrón.
      expect(episodio?.['typeConceptId'] ?? null).toBeNull();
    });

    it('rechaza un segundo episodio activo con 409 y su motivo', async () => {
      const segundo = await http()
        .post('/clinical/care-episodes')
        .set(bearer(medico.token))
        .send({
          patientProfileId: titular.pid,
          tenantId: medico.tenantId,
          responsiblePractitionerId: medico.hpid,
        })
        .expect(409);
      expect(segundo.body.message).toMatch(/episodio activo/i);
    });

    it('H5.S2.M2 — la forma real del error de validación (startAt inválido)', async () => {
      const invalido = await http()
        .post('/clinical/care-episodes')
        .set(bearer(medico.token))
        .send({
          patientProfileId: ajeno.pid,
          tenantId: medico.tenantId,
          responsiblePractitionerId: medico.hpid,
          startAt: 'no-es-una-fecha',
        })
        .expect(400);
      expect(invalido.body.details?.violations).toBeDefined();
      expect(Array.isArray(invalido.body.details.violations)).toBe(true);
      // Se pega el cuerpo completo en el reporte para que la Fase 2 lo
      // reproduzca con `page.route` exactamente igual.

      console.log('CUERPO 400 CARE-EPISODES:', JSON.stringify(invalido.body));
    });

    it('hallazgo potencial — startAt en el futuro: ¿lo acepta el servidor?', async () => {
      const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const futuro = await http()
        .post('/clinical/care-episodes')
        .set(bearer(medico.token))
        .send({
          patientProfileId: ajeno.pid,
          tenantId: medico.tenantId,
          responsiblePractitionerId: medico.hpid,
          startAt: manana,
        });

      console.log(
        'STARTAT FUTURO → HTTP',
        futuro.status,
        JSON.stringify(futuro.body),
      );
      // No se afirma un status: es exploratorio. Regla 60.4 esperaría un
      // rechazo server-side; si acepta con 201, es un hallazgo para el
      // dueño de la API — no se corrige acá.
      expect([201, 400, 422]).toContain(futuro.status);
    });

    it('hallazgo potencial — ¿un médico SIN relación puede internar a cualquier paciente?', async () => {
      const sinRelacion = await registrarPaciente('sin-relacion');
      const intento = await http()
        .post('/clinical/care-episodes')
        .set(bearer(medico.token))
        .send({
          patientProfileId: sinRelacion.pid,
          tenantId: medico.tenantId,
          responsiblePractitionerId: medico.hpid,
        });

      console.log(
        'CARE-EPISODES SIN RELACIÓN → HTTP',
        intento.status,
        JSON.stringify(intento.body),
      );
      // Documentado, no corregido: si da 201, es un IDOR potencial para el
      // dueño de la API (regla 40, autorización por ownership).
      expect([201, 403, 404]).toContain(intento.status);
    });
  });

  describe('H5.S3.M2 · rastro de auditoría', () => {
    it('¿hay historial auditado para care_episodes? (SUPERADMIN)', async () => {
      const admin = await http()
        .post('/iam/auth/login')
        .send({ nationalId: 'admin@alovida.com', password: '12345678' });
      if (admin.status !== 200) {
        console.log(
          'No se pudo autenticar admin@alovida.com para leer auditoría:',
          admin.status,
        );
        return;
      }
      const historial = await http()
        .get(
          '/audit/history/care_episodes/00000000-0000-0000-0000-000000000000',
        )
        .set(bearer(admin.body.accessToken));

      console.log(
        'AUDIT HISTORY care_episodes → HTTP',
        historial.status,
        JSON.stringify(historial.body),
      );
      expect([200, 404]).toContain(historial.status);
    });
  });
});
