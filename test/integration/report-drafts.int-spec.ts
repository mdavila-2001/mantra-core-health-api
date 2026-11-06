import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, SEED, TokenService, createdBy } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  deleteRegisteredOrganizations,
  ensureTestSession,
  identidadProfesional,
  type TestContext,
} from './harness';

/**
 * Written diagnostic report against the real app and Postgres: the performing
 * laboratory drafts the conclusion of an order, picks a signer among its
 * practitioner members, publishes it, and the patient receives the official
 * PDF. Once published, nothing about that report can change.
 */
describe('Informe redactado: borrador → publicado inmutable (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());
  let lab: { tenantId: string; token: string };
  let otroLab: { tenantId: string; token: string };
  let firmante: string;
  let firmanteToken: string;
  let pacienteToken: string;
  let pacienteId: string;
  let ordenId: string;
  let borradorId: string;

  const comoLab = (l = lab) => ({
    ...bearer(l.token),
    'X-Tenant-Id': l.tenantId,
  });
  const cuerpo = (texto: string) => ({
    version: 1,
    blocks: [
      { type: 'heading', level: 2, text: 'Hemograma' },
      { type: 'paragraph', runs: [{ text: texto, bold: true }] },
    ],
  });

  async function registrarLaboratorio(etiqueta: string) {
    const email = `informe-${etiqueta}-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `INFORME_${etiqueta}_${marca}`,
          legalName: `Laboratorio ${etiqueta} ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email, password, name: 'Dueña', lastName: etiqueta },
      })
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      tenantId: res.body.tenantId as string,
      token: login.body.accessToken as string,
    };
  }

  /** A practitioner who also works at the laboratory (active STAFF membership). */
  async function bioquimicoDelLaboratorio(
    tenantId: string,
  ): Promise<{ hpid: string; token: string }> {
    const email = `informe-bioq-${marca}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password,
        name: 'Bioquímica',
        lastName: `Firmante ${marca}`,
        licenseNumber: `LIC-INF-${marca}`,
        credentialNumber: `CRED-INF-${marca}`,
      })
      .expect(201);
    const em = ctx.orm.em.fork();
    em.create(
      TenantMemberships,
      {
        userId: alta.body.userId,
        tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      hpid: alta.body.practitionerProfileId as string,
      token: login.body.accessToken as string,
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    lab = await registrarLaboratorio('A');
    otroLab = await registrarLaboratorio('B');
    ({ hpid: firmante, token: firmanteToken } = await bioquimicoDelLaboratorio(
      lab.tenantId,
    ));

    const nationalId = `INT-INFORME-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...(await camposObligatoriosDePaciente(ctx)),
        nationalId,
        password,
        displayName: `Paciente Informe ${marca}`,
        email: `informe-paciente-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    pacienteToken = login.body.accessToken as string;
    const propias = await http()
      .get('/diagnostic-results/me/orders')
      .set(bearer(pacienteToken))
      .expect(200);
    pacienteId = propias.body.patientProfileId as string;

    const orden = await http()
      .post('/clinical/service-requests')
      .set({ ...bearer(ctx.adminToken), 'X-Tenant-Id': SEED.tenantId })
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId: propias.body.patientProfileId,
        codeConceptId: CLIN.STUDY_HEMOGRAMA,
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        performerTenantId: lab.tenantId,
      })
      .expect(201);
    ordenId = orden.body.id as string;
  });

  afterAll(async () => {
    await ctx.app.close();
    // Published reports are immutable by trigger; the run's fixtures stay in the
    // disposable test database, scoped by `marca`, and only the accounts go.
    await deleteRegisteredOrganizations(creados).catch(() => undefined);
  });

  it('el laboratorio ejecutor abre el borrador de la orden, y abrirlo de nuevo devuelve el mismo', async () => {
    const a = await http()
      .post('/diagnostics/report-drafts')
      .set(comoLab())
      .send({ serviceRequestId: ordenId })
      .expect(200);
    const b = await http()
      .post('/diagnostics/report-drafts')
      .set(comoLab())
      .send({ serviceRequestId: ordenId });
    expect(b.status).toBe(200);
    expect(b.body.id).toBe(a.body.id);
    expect(a.body.status).toBe('DRAFT');
    borradorId = a.body.id as string;
  });

  it('otro laboratorio no puede abrir el borrador de una orden ajena (404)', async () => {
    await http()
      .post('/diagnostics/report-drafts')
      .set(comoLab(otroLab))
      .send({ serviceRequestId: ordenId })
      .expect(404);
  });

  it('la lista de firmantes trae a la bioquímica vinculada al laboratorio', async () => {
    const res = await http()
      .get('/diagnostics/report-drafts/signers')
      .set(comoLab())
      .expect(200);
    expect(
      res.body.items.map((s: { profileId: string }) => s.profileId),
    ).toContain(firmante);
  });

  it('guardar deriva la conclusión en texto y un rowVersion viejo es 409', async () => {
    const actual = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .expect(200);
    const guardado = await http()
      .put(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .send({
        rowVersion: actual.body.rowVersion,
        body: cuerpo('Serie roja normal.'),
        signerProfileId: firmante,
        patientVisibility: 'VISIBLE',
      })
      .expect(200);
    expect(guardado.body.conclusionText).toContain('Serie roja normal.');
    await http()
      .put(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .send({
        rowVersion: actual.body.rowVersion,
        body: cuerpo('x'),
        signerProfileId: firmante,
        patientVisibility: 'VISIBLE',
      })
      .expect(409);
  });

  it('publicar exige confirmar que es irreversible', async () => {
    const actual = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .expect(200);
    await http()
      .post(`/diagnostics/report-drafts/${borradorId}/publish`)
      .set(comoLab())
      .send({ rowVersion: actual.body.rowVersion })
      .expect(400);
  });

  it('nadie publica con la firma de otro: la dueña recibe 403 y le pide la firma a la bioquímica', async () => {
    const actual = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .expect(200);
    const ajena = await http()
      .post(`/diagnostics/report-drafts/${borradorId}/publish`)
      .set(comoLab())
      .send({ rowVersion: actual.body.rowVersion, confirmIrreversible: true })
      .expect(403);
    expect(ajena.body.reason).toBe('REPORT_SIGNER_MUST_PUBLISH');
    await http()
      .post(`/diagnostics/report-drafts/${borradorId}/signature-request`)
      .set(comoLab())
      .expect(200);
  });

  it('la firmante publica con su sesión: el paciente recibe la conclusión y el PDF oficial, verificable sin PHI', async () => {
    const comoFirmante = {
      ...bearer(firmanteToken),
      'X-Tenant-Id': lab.tenantId,
    };
    const actual = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoFirmante)
      .expect(200);
    const pub = await http()
      .post(`/diagnostics/report-drafts/${borradorId}/publish`)
      .set(comoFirmante)
      .send({ rowVersion: actual.body.rowVersion, confirmIrreversible: true });
    expect([200, 201]).toContain(pub.status);
    expect(pub.body.status).toBe('PUBLISHED');

    const propios = await http()
      .get('/diagnostic-results/me')
      .set(bearer(pacienteToken))
      .expect(200);
    const resultado = propios.body.items.find(
      (r: { reportId: string }) => r.reportId === pub.body.reportId,
    );
    expect(resultado.conclusionText).toContain('Serie roja normal.');
    const oficial = resultado.files.find(
      (f: { role: string | null }) => f.role === 'OFFICIAL',
    );
    expect(oficial.fileId).toBe(pub.body.officialFileId);

    const pdf = await http()
      .get(
        `/diagnostic-results/me/${pub.body.reportId}/files/${oficial.fileId}/content`,
      )
      .set(bearer(pacienteToken))
      .buffer(true)
      .parse((res, cb) => {
        const parts: Buffer[] = [];
        res.on('data', (c: Buffer) => parts.push(c));
        res.on('end', () => cb(null, Buffer.concat(parts)));
      })
      .expect(200);
    expect((pdf.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');

    const verificacion = await http()
      .get(`/public/diagnostic-reports/${pub.body.versionId}/verify`)
      .expect(200);
    expect(verificacion.body.status).toBe('PUBLISHED');
    expect(JSON.stringify(verificacion.body)).not.toContain(
      `Paciente Informe ${marca}`,
    );
  });

  it('publicado es inmutable: guardar, adjuntar y crear versión responden 409', async () => {
    const actual = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .expect(200);
    expect(actual.body.status).toBe('PUBLISHED');
    const put = await http()
      .put(`/diagnostics/report-drafts/${borradorId}`)
      .set(comoLab())
      .send({
        rowVersion: actual.body.rowVersion,
        body: cuerpo('cambio'),
        signerProfileId: firmante,
        patientVisibility: 'VISIBLE',
      })
      .expect(409);
    expect(put.body.reason).toBe('REPORT_ALREADY_PUBLISHED');
    await http()
      .post(`/diagnostics/report-drafts/${borradorId}/publish`)
      .set(comoLab())
      .send({ rowVersion: actual.body.rowVersion, confirmIrreversible: true })
      .expect(409);
  });

  it('un paciente no puede usar los borradores del laboratorio (403)', async () => {
    const res = await http()
      .get(`/diagnostics/report-drafts/${borradorId}`)
      .set({ ...bearer(pacienteToken), 'X-Tenant-Id': lab.tenantId });
    expect([403, 404]).toContain(res.status);
  });

  it('una técnica del laboratorio (STAFF, rol USER) también puede abrir el borrador', async () => {
    const em = ctx.orm.em.fork();
    const tecnica = await em.findOneOrFail(TenantMemberships, {
      tenantId: lab.tenantId,
      tenantRoleConceptId: DIR.ROLE_STAFF,
    });
    await ensureTestSession(
      ctx.orm,
      tecnica.userId,
      `session-informe-${marca}`,
    );
    const token = ctx.app
      .get(TokenService)
      .signAccessToken(
        tecnica.userId,
        `session-informe-${marca}`,
        ['USER'],
        [lab.tenantId],
      );
    const res = await http()
      .post('/diagnostics/report-drafts')
      .set({ ...bearer(token), 'X-Tenant-Id': lab.tenantId })
      .send({ serviceRequestId: ordenId });
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBe(borradorId);
  });

  /**
   * HELD: the laboratory publishes the report retained, the doctor who asked
   * for it sees it next to the order and releases it to the patient. The
   * doctor reaches the chart the way a treating clinician does: an active
   * TREATING care relationship in the clinic (read) and an own open encounter
   * (write, to order the study).
   */
  describe('retenido por el laboratorio: el médico solicitante lo libera al paciente', () => {
    const medico = { token: '', hpid: '', tenantId: '' };
    let ordenRetenida: string;
    let publicado: { reportId: string; versionId: string };
    const comoMedico = () => ({
      ...bearer(medico.token),
      'X-Tenant-Id': medico.tenantId,
    });
    const fichaDelMedico = () =>
      http()
        .get(`/diagnostics/patients/${pacienteId}/orders`)
        .set(comoMedico())
        .expect(200);
    const informeEnFicha = (body: {
      reports: { id: string; patientVisibility: string | null }[];
    }) => body.reports.find((r) => r.id === publicado.reportId);

    beforeAll(async () => {
      const email = `informe-medico-${marca}@example.test`;
      const alta = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...identidadProfesional(email),
          email,
          password,
          name: 'Médica',
          lastName: `Solicitante ${marca}`,
          licenseNumber: `LIC-SOL-${marca}`,
          credentialNumber: `CRED-SOL-${marca}`,
        })
        .expect(201);
      medico.hpid = alta.body.practitionerProfileId as string;
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);
      medico.token = login.body.accessToken as string;
      const [, claims] = medico.token.split('.');
      medico.tenantId = (
        JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'))
          .tenants as string[]
      )[0];

      await http()
        .post('/authz/care-relationships')
        .set(bearer(ctx.adminToken))
        .send({
          tenantId: medico.tenantId,
          patientProfileId: pacienteId,
          practitionerProfileId: medico.hpid,
          relationshipType: 'TREATING',
        })
        .expect(201);
      const consulta = await http()
        .post('/clinical/encounters/check-in')
        .set(bearer(medico.token))
        .send({ patientProfileId: pacienteId, tenantId: medico.tenantId })
        .expect(201);
      const orden = await http()
        .post('/clinical/service-requests')
        .set(comoMedico())
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId: pacienteId,
          encounterId: consulta.body.id,
          // Another study: a second blood count would trip the duplicate check.
          codeConceptId: CLIN.STUDY_GLICEMIA,
          categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
          performerTenantId: lab.tenantId,
        })
        .expect(201);
      ordenRetenida = orden.body.id as string;

      const comoFirmante = {
        ...bearer(firmanteToken),
        'X-Tenant-Id': lab.tenantId,
      };
      const borrador = await http()
        .post('/diagnostics/report-drafts')
        .set(comoFirmante)
        .send({ serviceRequestId: ordenRetenida })
        .expect(200);
      const guardado = await http()
        .put(`/diagnostics/report-drafts/${borrador.body.id}`)
        .set(comoFirmante)
        .send({
          rowVersion: borrador.body.rowVersion,
          body: cuerpo('Leucocitosis: revisar con su médico.'),
          signerProfileId: firmante,
          patientVisibility: 'HELD',
        })
        .expect(200);
      const pub = await http()
        .post(`/diagnostics/report-drafts/${borrador.body.id}/publish`)
        .set(comoFirmante)
        .send({
          rowVersion: guardado.body.rowVersion,
          confirmIrreversible: true,
        })
        .expect(200);
      publicado = {
        reportId: pub.body.reportId as string,
        versionId: pub.body.versionId as string,
      };
      const leido = await http()
        .get(`/diagnostics/report-drafts/${borrador.body.id}`)
        .set(comoFirmante)
        .expect(200);
      expect(leido.body.officialFileId).toBe(pub.body.officialFileId);
    });

    it('el laboratorio ve la orden con su informe publicado en la bandeja', async () => {
      const res = await http()
        .get('/diagnostics/lab/orders')
        .set(comoLab())
        .expect(200);
      const fila = res.body.items.find(
        (o: { orderId: string }) => o.orderId === ordenRetenida,
      );
      expect(fila.report).toEqual({
        draftStatus: 'PUBLISHED',
        publishedVersionId: publicado.versionId,
      });
    });

    it('la médica solicitante ve el informe del laboratorio junto a su orden, retenido', async () => {
      const ficha = await fichaDelMedico();
      expect(informeEnFicha(ficha.body)).toMatchObject({
        serviceRequestId: ordenRetenida,
        releasedVersionId: publicado.versionId,
        patientVisibility: 'HELD',
      });
    });

    it('mientras está retenido el paciente no lo ve', async () => {
      const propios = await http()
        .get('/diagnostic-results/me')
        .set(bearer(pacienteToken))
        .expect(200);
      expect(
        propios.body.items.some(
          (r: { reportId: string }) => r.reportId === publicado.reportId,
        ),
      ).toBe(false);
    });

    it('la médica lo libera: queda visible en su ficha y el paciente lo recibe con el PDF oficial', async () => {
      const liberado = await http()
        .post(`/diagnostics/reports/${publicado.reportId}/patient-release`)
        .set(comoMedico())
        .expect(200);
      expect(liberado.body).toEqual({
        reportId: publicado.reportId,
        versionId: publicado.versionId,
        patientVisibility: 'VISIBLE',
      });

      const ficha = await fichaDelMedico();
      expect(informeEnFicha(ficha.body)?.patientVisibility).toBe('VISIBLE');

      const propios = await http()
        .get('/diagnostic-results/me')
        .set(bearer(pacienteToken))
        .expect(200);
      const resultado = propios.body.items.find(
        (r: { reportId: string }) => r.reportId === publicado.reportId,
      );
      expect(resultado.conclusionText).toContain('Leucocitosis');
      expect(
        resultado.files.some((f: { role: string }) => f.role === 'OFFICIAL'),
      ).toBe(true);

      await http()
        .post(`/diagnostics/reports/${publicado.reportId}/patient-release`)
        .set(comoMedico())
        .expect(409);
    });

    it('otro laboratorio no ve la ficha ni libera el informe', async () => {
      const res = await http()
        .post(`/diagnostics/reports/${publicado.reportId}/patient-release`)
        .set(comoLab(otroLab));
      expect([403, 404]).toContain(res.status);
    });
  });
});
