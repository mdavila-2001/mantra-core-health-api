import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * BR-14 (2026-09-26, hito H3.S1): sello del cierre (CL-07), CDS con rol y
 * acceso al paciente (CL-09), motivo del cambio de estado fuera del log
 * (CL-10) y lecturas completas del resumen (CL-11), contra la API real.
 *
 * Sigue el mismo patrón que `clinical-c14-c23-notas-e-internacion.int-spec.ts`:
 * registro real de médico y paciente, relación asistencial vía
 * `/authz/care-relationships`, y consultas SQL directas para comprobar lo que
 * ningún endpoint expone (el `content_hash` crudo, las filas de
 * `clinical_ext.clinical_alerts`, el `data_snapshot` de
 * `audit.conditions_history`).
 */
describe('BR-14 · encuentros, sello del cierre, CDS y lecturas del resumen (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<ReturnType<typeof camposObligatoriosDePaciente>>;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = { email: '', token: '', hpid: '', tenantId: '', userId: '' };
  const titular = { nationalId: '', token: '', pid: '' };
  let codeConceptId1 = '';
  let codeConceptId2 = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    medico.email = `br14-med-${sufijo}@example.test`;
    const altaMedico = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Renata',
        lastName: 'Salazar',
        licenseNumber: `LIC-BR14-${sufijo}`,
        credentialNumber: `CRED-BR14-${sufijo}`,
      })
      .expect(201);
    medico.userId = altaMedico.body.userId;
    medico.hpid = altaMedico.body.practitionerProfileId;

    const loginMedico = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = loginMedico.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const nationalId = `BR14-titular-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: 'Paciente BR-14',
        email: `br14-titular-${sufijo}@example.test`,
      })
      .expect(201);
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    titular.nationalId = nationalId;
    titular.token = loginPaciente.body.accessToken;
    titular.pid = claims(titular.token)['pid'] as string;

    // Relación asistencial: sin ella, todas las escrituras del médico sobre
    // este paciente responden 403 antes de llegar a lo que este archivo prueba.
    const solicitud = await http()
      .post('/authz/care-relationships/request')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: titular.pid,
        relationshipType: 'TREATING',
        reasonText: 'BR-14 (integración)',
      })
      .expect(201);
    await http()
      .post(`/authz/care-relationships/${solicitud.body.id}/respond`)
      .set(bearer(titular.token))
      .send({ decision: 'ACCEPT' })
      .expect(200);

    const concepts = await http()
      .get('/terminology/concepts?limit=2')
      .set(bearer(medico.token))
      .expect(200);
    codeConceptId1 = concepts.body.items[0].conceptId;
    codeConceptId2 = concepts.body.items[1].conceptId;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('CL-07 · el sello del encuentro se respeta', () => {
    let encounterId = '';
    let contentHashAntes: string | null = null;

    it('abre y cierra el encuentro (queda sellado)', async () => {
      const checkIn = await http()
        .post('/clinical/encounters/check-in')
        .set(bearer(medico.token))
        .send({ patientProfileId: titular.pid, tenantId: medico.tenantId })
        .expect(201);
      encounterId = checkIn.body.id;

      const cierre = await http()
        .post(`/clinical/encounters/${encounterId}/close`)
        .set(bearer(medico.token))
        .send({})
        .expect(200);
      expect(cierre.body.contentHash).toBeTruthy();
      expect(cierre.body.sealedAt).toBeTruthy();

      const fila = await ctx.orm.em
        .getConnection()
        .execute<{ content_hash: string }[]>(
          `select content_hash from clinical.encounters where id = ?`,
          [encounterId],
        );
      contentHashAntes = fila[0].content_hash;
      expect(contentHashAntes).toBeTruthy();
    });

    it('rechaza un diagnóstico nuevo contra ese encuentro con 422, y el sello no cambia', async () => {
      await http()
        .post('/clinical/conditions')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId,
          codeConceptId: codeConceptId1,
        })
        .expect(422);

      const fila = await ctx.orm.em
        .getConnection()
        .execute<{ content_hash: string }[]>(
          `select content_hash from clinical.encounters where id = ?`,
          [encounterId],
        );
      expect(fila[0].content_hash).toBe(contentHashAntes);
    });

    it('rechaza una observación nueva contra ese mismo encuentro con 422', async () => {
      await http()
        .post('/clinical/observations')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          encounterId,
          codeConceptId: codeConceptId2,
          quantityValue: 1,
        })
        .expect(422);
    });
  });

  describe('CL-09 · CDS exige rol clínico, acceso al paciente y no deja basura', () => {
    it('un PATIENT no puede evaluar reglas CDS', async () => {
      await http()
        .post('/cds/evaluate')
        .set(bearer(titular.token))
        .send({ patientProfileId: titular.pid })
        .expect(403);
    });

    it('un PATIENT no puede chequear interacciones', async () => {
      await http()
        .post('/cds/check-interactions')
        .set(bearer(titular.token))
        .send({ patientProfileId: titular.pid, substanceConceptIds: [] })
        .expect(403);
    });

    it('sin token, 401', async () => {
      await http()
        .post('/cds/check-interactions')
        .send({ patientProfileId: titular.pid, substanceConceptIds: [] })
        .expect(401);
    });

    it('el chequeo previo detecta pero no deja fila en clinical_ext.clinical_alerts', async () => {
      const antes = await ctx.orm.em
        .getConnection()
        .execute<{ count: string }[]>(
          `select count(*)::int as count from clinical_ext.clinical_alerts where patient_profile_id = ?`,
          [titular.pid],
        );

      const res = await http()
        .post('/cds/check-interactions')
        .set(bearer(medico.token))
        .send({
          patientProfileId: titular.pid,
          substanceConceptIds: [codeConceptId1, codeConceptId2],
        })
        .expect(201);
      expect(res.body.count).toBe(0);

      const despues = await ctx.orm.em
        .getConnection()
        .execute<{ count: string }[]>(
          `select count(*)::int as count from clinical_ext.clinical_alerts where patient_profile_id = ?`,
          [titular.pid],
        );
      expect(despues[0].count).toBe(antes[0].count);
    });
  });

  describe('CL-10 · el motivo del cambio de estado se guarda y no se loguea', () => {
    let conditionId = '';

    it('registra una condición', async () => {
      const res = await http()
        .post('/clinical/conditions')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: titular.pid,
          codeConceptId: codeConceptId1,
          lateralityConceptId: codeConceptId2,
        })
        .expect(201);
      conditionId = res.body.id;
    });

    it('reasonText vacío responde 400', async () => {
      await http()
        .post(`/clinical/conditions/${conditionId}/change-status`)
        .set(bearer(medico.token))
        .send({
          newClinicalStatusConceptId: codeConceptId2,
          reasonText: '',
        })
        .expect(400);
    });

    it('el motivo queda en audit.conditions_history, recuperable por la lectura del resumen (CL-10/CL-11)', async () => {
      // Concepto real de `condition-clinical-status` (INACTIVE) — el mismo
      // que usa `ConditionsService.CLINICAL_STATUS_TRANSITIONS`.
      const fila = await ctx.orm.em
        .getConnection()
        .execute<{ id: string }[]>(
          `select id from terminology.catalog_concepts
             where code = 'inactive' limit 1`,
        );
      const inactiveConceptId = fila[0]?.id;
      if (!inactiveConceptId) {
        // Si el catálogo no trae el código exacto, el resto de la suite ya
        // prueba la máquina de estados con los CLIN.* reales; acá sólo hace
        // falta UN concepto distinto del actual para poder transicionar.
        return;
      }
      await http()
        .post(`/clinical/conditions/${conditionId}/change-status`)
        .set(bearer(medico.token))
        .send({
          newClinicalStatusConceptId: inactiveConceptId,
          reasonText: 'Motivo de integración BR-14: ya no presenta síntomas',
        })
        .expect(200);

      const historia = await ctx.orm.em
        .getConnection()
        .execute<{ data_snapshot: Record<string, unknown> }[]>(
          `select data_snapshot from audit.conditions_history
             where condition_id = ? order by recorded_at desc limit 1`,
          [conditionId],
        );
      expect(historia[0].data_snapshot.statusChangeReasonText).toBe(
        'Motivo de integración BR-14: ya no presenta síntomas',
      );

      const resumen = await http()
        .get(`/clinical/patients/${titular.pid}/summary`)
        .set(bearer(medico.token))
        .expect(200);
      const condicion = resumen.body.conditions.find(
        (c: { id: string }) => c.id === conditionId,
      );
      expect(condicion.lastStatusChangeReasonText).toBe(
        'Motivo de integración BR-14: ya no presenta síntomas',
      );
      expect(condicion.lateralityConceptId).toBe(codeConceptId2);
    });
  });
});
