import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
  type InfraStaff,
  type Planta,
} from './infrastructure-fixture';

/**
 * «Admisión crea el vínculo» (decisión del usuario 2026-10-31): admisión de
 * nivel sede interna a un paciente SIN huella previa en el tenant (aunque no
 * tenga cuenta) y el ingreso deja la huella auditada; enfermería, un rol
 * global suelto o un paciente de otra organización reciben el mismo 404. El
 * número del documento no llega a la base, al outbox ni al audit.
 */
describe('Admisión crea el vínculo · integración', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  const CI = `98${tag.replace(/[^0-9]/g, '7').padEnd(6, '1')} SC`;
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let admission: InfraStaff;
  let nurse: InfraStaff;

  const pacienteSinCuenta = async () =>
    (
      await http()
        .post('/profiles/patients')
        .set(bearer(ctx.adminToken))
        .send({
          patientCode: `EMG-${randomUUID().slice(0, 8)}`,
          displayName: `Paciente emergencia ${tag}`,
          birthDate: '1980-01-01',
        })
        .expect(201)
    ).body.profileId as string;

  const ingreso = (
    who: Record<string, string>,
    patientProfileId: string,
    extra: Record<string, unknown> = {},
  ) =>
    http()
      .post('/clinical/admissions')
      .set(who)
      .send({
        patientProfileId,
        practiceSiteId: orgA.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'Ingreso por emergencia',
        admissionOriginCode: 'EMERGENCY',
        identityVerification: { methodCode: 'IDV_CI', documentReference: CI },
        ...extra,
      });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `AVA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `AVB-${tag}`);
    planta = await armarPlanta(ctx, orgA, `AV-${tag}`, 1);
    admission = await crearPersonal(
      ctx,
      orgA,
      `AVM-${tag}`,
      DELEG.ASSIGN_ROLE_ADMISSION,
      { site: orgA.siteId },
    );
    nurse = await crearPersonal(
      ctx,
      orgA,
      `AVN-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('admisión de nivel sede interna a un paciente sin huella ni cuenta: 201, huella auditada, sin el número en claro', async () => {
    const p = await pacienteSinCuenta();
    const res = await ingreso(como(admission), p).expect(201);
    const fp = await q(
      `select tenant_id, encounter_id, practice_site_id, admission_origin_concept_id,
              identity_document_type, identity_document_last4, identity_document_hmac, recorded_by_user_id
         from clinical.patient_admission_footprints where patient_profile_id = ?`,
      [p],
    );
    const normalizado = CI.replace(/\s/g, '').toUpperCase();
    expect(fp).toEqual([
      {
        tenant_id: orgA.tenantId,
        encounter_id: res.body.encounterId,
        practice_site_id: orgA.siteId,
        admission_origin_concept_id: CLIN.ADM_ORIGIN_EMERGENCY,
        identity_document_type: 'IDV_CI',
        identity_document_last4: normalizado.slice(-4),
        identity_document_hmac: expect.stringMatching(/^[0-9a-f]{64}$/),
        recorded_by_user_id: admission.userId,
      },
    ]);
    // El mismo CI da el mismo HMAC (clave de la API, fuera de la base).
    const key =
      process.env.ADMISSION_ID_HMAC_KEY ??
      'dev-only-admission-id-hmac-key-change-me';
    expect(fp[0].identity_document_hmac).toBe(
      createHmac('sha256', key).update(normalizado, 'utf8').digest('hex'),
    );
    // El número completo no está en la huella, el outbox ni el audit.
    const digits = normalizado.slice(0, -2);
    const leaks = await q(
      `select
         (select count(*)::int from clinical.patient_admission_footprints t where t::text like ?) as huella,
         (select count(*)::int from messaging.domain_events e where e.payload_json::text like ?) as outbox,
         (select count(*)::int from audit.audit_log a where a::text like ?) as audit`,
      [`%${digits}%`, `%${digits}%`, `%${digits}%`],
    );
    expect(leaks[0]).toEqual({ huella: 0, outbox: 0, audit: 0 });
    const ev = await q(
      `select payload_json from messaging.domain_events
        where event_type = 'clinical.patient.admitted_without_prior_footprint' and aggregate_id = ?`,
      [res.body.encounterId],
    );
    expect(ev).toHaveLength(1);
    expect(ev[0].payload_json).toMatchObject({
      patientProfileId: p,
      admissionOriginCode: 'EMERGENCY',
      identityMethodCode: 'IDV_CI',
    });
    const audit = await q(
      `select count(*)::int as n from audit.audit_log where action = 'INPATIENT_ADMITTED' and entity_id = ?`,
      [res.body.encounterId],
    );
    expect(audit[0].n).toBe(1);
    // La huella cuenta para la regla general: el paciente ya es del tenant,
    // así que enfermería (sin permiso de ingreso sin huella) ya no recibe el
    // 404 sino la regla clínica siguiente (ya internado → 409).
    const segunda = await ingreso(como(nurse), p, {
      bed: { careSpaceId: planta.beds[0], mode: 'ASSIGN' },
    }).expect(409);
    expect(segunda.body.reason).toBe('PATIENT_ALREADY_ADMITTED');
    // Append-only: no se borra ni se reescribe.
    const del = await q(
      'delete from clinical.patient_admission_footprints where patient_profile_id = ?',
      [p],
    ).catch((e) => e);
    expect(String(del?.message ?? del)).toMatch(
      /forbid|inmutable|append|mutation|no se permite|prohib/i,
    );
  });

  it('sin origen o identidad → 422; enfermería, rol global suelto y paciente de otro tenant → el mismo 404', async () => {
    const p = await pacienteSinCuenta();
    const sinIdentidad = await ingreso(como(admission), p, {
      identityVerification: undefined,
    }).expect(422);
    expect(sinIdentidad.body.reason).toBe(
      'ADMISSION_ORIGIN_AND_IDENTITY_REQUIRED',
    );
    const shape = (r: request.Response) => ({
      status: r.status,
      code: r.body.code,
      message: r.body.message,
    });
    const enf = await ingreso(como(nurse), p, {
      bed: { careSpaceId: planta.beds[0], mode: 'ASSIGN' },
    });
    expect(enf.status).toBe(404);
    // Rol global sin ámbito en el tenant (plataforma): no internan sin huella.
    const global = await ingreso(
      { ...bearer(ctx.adminToken), 'X-Tenant-Id': orgA.tenantId },
      p,
    );
    expect([403, 404]).toContain(global.status);
    // Paciente de otra organización (huella propia en B): no se adopta.
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    const deB = (await registrarPaciente(ctx, orgB, `AVPB${tag}`, campos))
      .patientProfileId;
    const otro = await ingreso(como(admission), deB);
    const inexistente = await ingreso(como(admission), randomUUID());
    expect(shape(otro)).toEqual(shape(enf));
    expect(shape(inexistente)).toEqual(shape(enf));
    const n = await q(
      'select count(*)::int as n from clinical.patient_admission_footprints where patient_profile_id = any(?::uuid[])',
      [`{${p},${deB}}`],
    );
    expect(n[0].n).toBe(0);
  });

  it('derivación: de otro paciente o dirigida a otro tenant → rechazo; la propia, 201', async () => {
    const p = await pacienteSinCuenta();
    const otroPaciente = await pacienteSinCuenta();
    const referral = async (patient: string, targetTenant: string) => {
      const id = randomUUID();
      await q(
        `insert into clinical_ext.referrals (id, patient_profile_id, target_tenant_id, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, now(), now())`,
        [id, patient, targetTenant, CONCEPTS.STATE_ACTIVE],
      );
      return id;
    };
    const ajena = await referral(otroPaciente, orgA.tenantId);
    const aOtroTenant = await referral(p, orgB.tenantId);
    const propia = await referral(p, orgA.tenantId);
    for (const referralId of [ajena, aOtroTenant]) {
      const r = await ingreso(como(admission), p, {
        admissionOriginCode: 'REFERRAL',
        referralId,
      });
      expect(r.status).toBe(404);
    }
    // La base también lo rechaza (FK compuesta): 23503.
    const enc = randomUUID();
    await q(
      `insert into clinical.encounters (id, patient_profile_id, tenant_id, class_concept_id, status_concept_id, start_at, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now(), now())`,
      [
        enc,
        p,
        orgA.tenantId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        CLIN.ENCOUNTER_FINISHED,
      ],
    );
    const directo = await q(
      `insert into clinical.patient_admission_footprints
         (id, tenant_id, patient_profile_id, encounter_id, practice_site_id, admission_origin_concept_id,
          identity_verification_method_concept_id, identity_document_type, identity_document_last4,
          identity_document_hmac, referral_id, recorded_by_user_id, created_at)
       values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, 'IDV_CI', '0000', ?, ?, ?, now())`,
      [
        orgA.tenantId,
        p,
        enc,
        orgA.siteId,
        CLIN.ADM_ORIGIN_REFERRAL,
        CLIN.IDV_CI,
        'f'.repeat(64),
        ajena,
        admission.userId,
      ],
    ).catch((e) => e);
    expect(String(directo?.code ?? directo?.cause?.code ?? directo)).toContain(
      '23503',
    );
    const ok = await ingreso(como(admission), p, {
      admissionOriginCode: 'REFERRAL',
      referralId: propia,
    }).expect(201);
    const [fp] = await q(
      'select referral_id from clinical.patient_admission_footprints where encounter_id = ?',
      [ok.body.encounterId],
    );
    expect(fp.referral_id).toBe(propia);
  });
});
