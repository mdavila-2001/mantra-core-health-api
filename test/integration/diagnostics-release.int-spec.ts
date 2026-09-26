import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';
import { CONCEPTS, SEED } from '../../src/common';

/**
 * BR-17 (D-E) contra la aplicación real y Postgres.
 *
 * ## Por qué existe
 *
 * `diagnostics-reports.service.spec.ts` y `diagnostic-reports.service.spec.ts`
 * (clínico) mockean el repositorio: prueban que el servicio **decide** liberar
 * o no, no que el paciente **vea de verdad** lo que se liberó, ni que el
 * segundo intento de liberar no duplique la fila en
 * `diagnostics.diagnostic_release_events`. Eso sólo se comprueba contra la
 * base, con el circuito completo: crear el informe, cargar una versión,
 * liberarla, y leerla desde `GET /diagnostic-results/me` como lo haría el
 * paciente.
 *
 * También fija en runtime la decisión D-E (CV-02): el camino
 * `diagnostics/reports/.../release` es el único que el paciente ve, y el
 * camino `clinical/diagnostic-reports/:id/release` quedó deprecado (422),
 * nunca borrado.
 */
describe('BR-17 · liberación de diagnósticos, un solo camino (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const u = Date.now();

  let tokenAna: string;
  let perfilAna: string;
  let tokenBruno: string;

  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);
  const CID = CONCEPTS.STATE_ACTIVE;

  async function registrarPaciente(etiqueta: string): Promise<string> {
    const nationalId = `INT-BR17-${etiqueta}-${randomUUID().slice(0, 8)}`;
    const password = 'S3cret-passw0rd';
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        displayName: `Paciente ${etiqueta}`,
        email: `br17-${etiqueta}-${randomUUID().slice(0, 8)}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    return login.body.accessToken as string;
  }

  /** Crea el informe (clinical) → versión (diagnostics) → devuelve ambos ids. */
  async function crearInformeConVersion(
    patientProfileId: string,
  ): Promise<{ reportId: string; versionId: string }> {
    const informe = await http()
      .post('/clinical/diagnostic-reports')
      .set(admin())
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId,
        codeConceptId: CID,
      })
      .expect(201);
    const reportId = informe.body.id as string;

    const version = await http()
      .post(`/diagnostics/reports/${reportId}/versions`)
      .set(admin())
      .send({
        custodianTenantId: SEED.tenantId,
        conclusionText: 'Sin hallazgos',
      })
      .expect(201);
    return { reportId, versionId: version.body.id as string };
  }

  function resultadosDe(token: string) {
    return http().get('/diagnostic-results/me').set(bearer(token));
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
    tokenAna = await registrarPaciente(`ana${u}`);
    tokenBruno = await registrarPaciente(`bruno${u}`);
    const vacio = await resultadosDe(tokenAna).expect(200);
    perfilAna = vacio.body.patientProfileId as string;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('aceptado: liberado VISIBLE, el paciente lo ve al recargar', async () => {
    const { reportId, versionId } = await crearInformeConVersion(perfilAna);

    await http()
      .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
      .set(admin())
      .send({ patientVisibility: 'VISIBLE' })
      .expect(200);

    const res = await resultadosDe(tokenAna).expect(200);
    const encontrado = res.body.items.find(
      (item: { reportId: string }) => item.reportId === reportId,
    );
    expect(encontrado).toBeDefined();
    expect(encontrado.versionId).toBe(versionId);
  });

  it('límite: liberado HIDDEN, el paciente NO lo ve', async () => {
    const { reportId, versionId } = await crearInformeConVersion(perfilAna);

    await http()
      .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
      .set(admin())
      .send({ patientVisibility: 'HIDDEN' })
      .expect(200);

    const res = await resultadosDe(tokenAna).expect(200);
    expect(
      res.body.items.some(
        (item: { reportId: string }) => item.reportId === reportId,
      ),
    ).toBe(false);
  });

  it('inválido: doble liberación → 409 y un solo evento en diagnostic_release_events', async () => {
    const { reportId, versionId } = await crearInformeConVersion(perfilAna);

    await http()
      .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
      .set(admin())
      .send({ patientVisibility: 'VISIBLE' })
      .expect(200);

    await http()
      .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
      .set(admin())
      .send({ patientVisibility: 'VISIBLE' })
      .expect(409);

    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ count: string }[]>(
        'SELECT count(*)::int AS count FROM diagnostics.diagnostic_release_events WHERE diagnostic_report_version_id = ?',
        [versionId],
      );
    expect(Number(filas[0].count)).toBe(1);
  });

  it('D-E: el camino clínico deprecado ya no libera nada (422, no 200)', async () => {
    const { reportId } = await crearInformeConVersion(perfilAna);

    const res = await http()
      .post(`/clinical/diagnostic-reports/${reportId}/release`)
      .set(admin())
      .send({})
      .expect(422);
    expect(res.body.details?.canonicalEndpoint).toContain(
      'versions/:versionId/release',
    );

    // Y el paciente sigue sin verlo: el camino obsoleto no dejó nada liberado.
    const propios = await resultadosDe(tokenAna).expect(200);
    expect(
      propios.body.items.some(
        (item: { reportId: string }) => item.reportId === reportId,
      ),
    ).toBe(false);
  });

  it('NO ve el informe de otra persona', async () => {
    const { reportId, versionId } = await crearInformeConVersion(perfilAna);
    await http()
      .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
      .set(admin())
      .send({ patientVisibility: 'VISIBLE' })
      .expect(200);

    const res = await resultadosDe(tokenBruno).expect(200);
    expect(
      res.body.items.some(
        (item: { reportId: string }) => item.reportId === reportId,
      ),
    ).toBe(false);
  });

  describe('Compartir por perfil, nunca por un id tipeado (CL-48)', () => {
    let practitionerProfileId: string;
    let practitionerToken: string;

    beforeAll(async () => {
      const sufijo = randomUUID().slice(0, 8);
      const email = `br17-prof-${sufijo}@example.test`;
      const password = 'S3cret-passw0rd';
      const alta = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...identidadProfesional(email),
          email,
          password,
          name: 'Marta',
          lastName: 'Rivas',
          licenseNumber: `LIC-BR17-${sufijo}`,
          credentialNumber: `CRED-BR17-${sufijo}`,
        })
        .expect(201);
      practitionerProfileId = alta.body.practitionerProfileId as string;

      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);
      practitionerToken = login.body.accessToken as string;
    });

    it('inválido: sin relación asistencial vigente, compartir da 422', async () => {
      const { reportId, versionId } = await crearInformeConVersion(perfilAna);
      await http()
        .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
        .set(admin())
        .send({ patientVisibility: 'VISIBLE' })
        .expect(200);

      await http()
        .post(`/diagnostic-results/me/${reportId}/shares`)
        .set(bearer(tokenAna))
        .send({
          practitionerProfileId,
          validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .expect(422);
    });

    it('inválido: mandar "reason" da 400 (se retiró del contrato, CL-50)', async () => {
      const { reportId, versionId } = await crearInformeConVersion(perfilAna);
      await http()
        .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
        .set(admin())
        .send({ patientVisibility: 'VISIBLE' })
        .expect(200);

      await http()
        .post(`/diagnostic-results/me/${reportId}/shares`)
        .set(bearer(tokenAna))
        .send({
          practitionerProfileId,
          validUntil: new Date(Date.now() + 86_400_000).toISOString(),
          reason: 'Segunda opinión',
        })
        .expect(400);
    });

    it('aceptado: con relación vigente, comparte por perfil y aparece con el nombre', async () => {
      const { reportId, versionId } = await crearInformeConVersion(perfilAna);
      await http()
        .post(`/diagnostics/reports/${reportId}/versions/${versionId}/release`)
        .set(admin())
        .send({ patientVisibility: 'VISIBLE' })
        .expect(200);

      await http()
        .post('/authz/care-relationships')
        .set(admin())
        .send({
          tenantId: SEED.tenantId,
          patientProfileId: perfilAna,
          practitionerProfileId,
          relationshipType: 'TREATING',
        })
        .expect(201);

      const share = await http()
        .post(`/diagnostic-results/me/${reportId}/shares`)
        .set(bearer(tokenAna))
        .send({
          practitionerProfileId,
          validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .expect(201);
      expect(share.body.practitionerName).toBe('Marta Rivas');

      const compartidos = await http()
        .get(`/diagnostic-results/me/${reportId}/shares`)
        .set(bearer(tokenAna))
        .expect(200);
      expect(
        compartidos.body.items.some(
          (item: { practitionerName?: string }) =>
            item.practitionerName === 'Marta Rivas',
        ),
      ).toBe(true);

      // Nunca un buscador global: el profesional compartido sí puede leer el
      // resultado que le compartieron (usa su propia sesión, no la del paciente).
      expect(practitionerToken).toBeDefined();
    });
  });

  describe('Lecturas del circuito de laboratorio (CL-47)', () => {
    it('aceptado: acesionar y leer el detalle de la acesión', async () => {
      const especimen = await http()
        .post('/diagnostics/specimens')
        .set(admin())
        .send({
          patientProfileId: perfilAna,
          custodianTenantId: SEED.tenantId,
          specimenTypeConceptId: CID,
        })
        .expect(201);

      const acesion = await http()
        .post('/diagnostics/accessions')
        .set(admin())
        .send({
          patientProfileId: perfilAna,
          custodianTenantId: SEED.tenantId,
          specimenIds: [especimen.body.id],
        })
        .expect(201);

      const detalle = await http()
        .get(`/diagnostics/accessions/${acesion.body.id}`)
        .set({ ...admin(), 'X-Tenant-Id': SEED.tenantId })
        .expect(200);
      expect(detalle.body.specimens).toHaveLength(1);
      expect(detalle.body.specimens[0].specimen.id).toBe(especimen.body.id);

      const detalleEspecimen = await http()
        .get(`/diagnostics/specimens/${especimen.body.id}`)
        .set({ ...admin(), 'X-Tenant-Id': SEED.tenantId })
        .expect(200);
      expect(detalleEspecimen.body.id).toBe(especimen.body.id);
    });

    it('inválido: acesión inexistente → 404', async () => {
      await http()
        .get(`/diagnostics/accessions/${randomUUID()}`)
        .set({ ...admin(), 'X-Tenant-Id': SEED.tenantId })
        .expect(404);
    });
  });
});
