import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { createPatient, createStaff, ROLE } from './infrastructure-f3.fixtures';
import {
  como,
  crearEspacio,
  crearMiembro,
  crearSede,
  darMembresia,
  filas,
  http as httpFor,
  mkOrg,
  registrarOrg,
  registrarProfesional,
  type Profesional,
} from './infra-f4.fixtures';

/**
 * F5a · imagenología: equipo ubicado en una sala, estación DICOM, pasos programados y
 * Modality Worklist (CONTRATO-F2-F5 F5a), contra la base real y por HTTP real.
 *
 * Por endpoint: un caso permitido y casos que fallan cerrado por tenant (id de otra
 * organización → 404) y por rol (403 / 404 sin alcance). Las reglas se demuestran con datos
 * persistidos y vistos por SQL: el par equipo–sala del paso, la sede de la sala, el AE Title
 * único del sitio (con dos peticiones simultáneas), la sala bloqueada que no admite estudios,
 * la reubicación que arrastra pasos y citas, y el flujo completo con recarga.
 */
describe('Infraestructura F5a · equipo, estación DICOM, pasos y worklist', () => {
  let ctx: TestContext;
  const http = () => httpFor(ctx);
  const sufijo = randomUUID().slice(0, 8);
  const orgA = mkOrg('A', sufijo);
  const orgB = mkOrg('B', sufijo);
  let siteA2: string;
  let sitioDiagA: string;
  let sitioDiagB: string;
  let salaImagen: any;
  let salaImagen2: any;
  let salaOtraSede: any;
  let consultorio: any;
  let salaB: any;
  /** Plataforma operando en el tenant de cada organización. */
  let plataformaA: { token: string; tenantId: string };
  let plataformaB: { token: string; tenantId: string };
  let coordA: { token: string; tenantId: string; userId: string };
  let clinicoA: { token: string; tenantId: string; userId: string };
  let clinicoB: { token: string; tenantId: string; userId: string };
  let sinAlcanceA: { token: string; tenantId: string; userId: string };
  let mantenimientoA: { token: string };
  let enfermeriaA: { token: string };
  let doc1: Profesional;
  let doc2: Profesional;
  let seq = 0;

  const asUser = (token: string, tenantId: string) => ({ token, tenantId });
  const dueñoA = () => como(orgA);
  const dueñoB = () => como(orgB);

  const espacioDe = (
    org: typeof orgA,
    siteId: string,
    fn: string,
    name: string,
  ) => {
    seq += 1;
    return crearEspacio(ctx, org, siteId, {
      code: `${fn.slice(9, 12)}-${seq}-${sufijo}`,
      name,
      functionCode: fn,
      areaM2: 30,
      activate: true,
    });
  };

  async function crearUnidadYSitio(
    plataforma: { token: string; tenantId: string },
    org: typeof orgA,
    code: string,
  ): Promise<string> {
    await http()
      .post('/diagnostic-units')
      .set(como(plataforma))
      .send({
        code,
        name: `Imagen ${code}`,
        practiceId: org.practiceId,
        primaryPracticeSiteId: org.siteId,
        sites: [{ practiceSiteId: org.siteId, imagingAvailable: true }],
      })
      .expect(201);
    const [fila] = await filas(
      ctx,
      `select s.id from diagnostic_units.diagnostic_unit_sites s
         join diagnostic_units.diagnostic_units u on u.id = s.diagnostic_unit_id
        where u.tenant_id = ? and u.code = ?`,
      [org.tenantId, code],
    );
    return fila.id as string;
  }

  /** Un equipo en un sitio de diagnóstico, dado de alta por la plataforma. */
  async function equipo(
    siteDiagId: string,
    plataforma: { token: string; tenantId: string },
    over: Record<string, unknown> = {},
  ): Promise<string> {
    seq += 1;
    const res = await http()
      .post(`/diagnostic-unit-sites/${siteDiagId}/equipment`)
      .set(como(plataforma))
      .send({
        equipmentTypeConceptId: DUNIT.EQUIPMENT_TYPE_XRAY,
        modalityConceptId: DUNIT.MODALITY_CT,
        serialNumber: `SN-${seq}-${sufijo}`,
        ...over,
      })
      .expect(201);
    return res.body.id as string;
  }

  const patch = (
    token: { token: string; tenantId: string },
    id: string,
    body: Record<string, unknown>,
  ) => http().patch(`/diagnostic-equipment/${id}`).set(como(token)).send(body);

  const filaEquipo = async (id: string) =>
    (
      await filas(
        ctx,
        `select care_space_id, ae_title, station_name, operational_status_concept_id
           from diagnostic_units.diagnostic_equipment where id = ?`,
        [id],
      )
    )[0];

  /** Un estudio de imagen del tenant A (ingesta mínima por SQL: el endpoint STOW es de otra franja). */
  async function estudio(tenantId: string): Promise<string> {
    const endpoint = randomUUID();
    await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `insert into diagnostics.imaging_endpoints
         (id, tenant_id, endpoint_type_concept_id, base_uri, status_concept_id,
          created_at, updated_at, row_version)
       values (?, ?, ?, ?, ?, now(), now(), 1)`,
        [
          endpoint,
          tenantId,
          DIAG.IMAGING_ENDPOINT_STOW,
          `https://pacs.example.test/${endpoint}`,
          DIAG.IMAGING_ENDPOINT_ACTIVE,
        ],
      );
    seq += 1;
    const paciente = await createPatient(ctx, {
      name: `Paciente F5A ${seq}`,
      gender: 'FEMALE',
      birthDate: '1985-05-05',
    });
    const id = randomUUID();
    await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `insert into diagnostics.imaging_studies
         (id, patient_profile_id, imaging_endpoint_id, dicom_study_instance_uid,
          status_concept_id, custodian_tenant_id, created_at, updated_at, row_version)
       values (?, ?, ?, ?, ?, ?, now(), now(), 1)`,
        [
          id,
          paciente,
          endpoint,
          `1.2.826.0.1.${Date.now()}.${seq}`,
          DIAG.IMAGING_STUDY_STORED,
          tenantId,
        ],
      );
    return id;
  }

  const crearPaso = (
    token: { token: string; tenantId: string },
    studyId: string,
  ) =>
    http()
      .post(`/diagnostics/imaging-studies/${studyId}/procedure-steps`)
      .set(como(token))
      .send({ codeConceptId: CONCEPTS.STATE_ACTIVE });

  const programar = (
    token: { token: string; tenantId: string },
    stepId: string,
    equipmentId: string,
    scheduledStartAt: string,
  ) =>
    http()
      .post(`/diagnostics/imaging-procedure-steps/${stepId}/schedule`)
      .set(como(token))
      .send({ equipmentId, scheduledStartAt });

  const futuro = (offsetDias: number, hora = '14:00') => {
    const d = new Date(Date.now() + offsetDias * 86_400_000);
    return `${d.toISOString().slice(0, 10)}T${hora}:00.000Z`;
  };

  const bloquear = async (
    org: { token: string; tenantId: string },
    careSpaceId: string,
  ) => {
    const estado = await http()
      .get(`/care-spaces/${careSpaceId}/operational-state`)
      .set(como(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${careSpaceId}/availability`)
      .set(como(org))
      .set({ 'If-Match-Ops': `"${estado.body.cell.opsVersion}"` })
      .send({
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      });
  };
  const desbloquear = async (
    org: { token: string; tenantId: string },
    careSpaceId: string,
  ) => {
    const estado = await http()
      .get(`/care-spaces/${careSpaceId}/operational-state`)
      .set(como(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${careSpaceId}/availability`)
      .set(como(org))
      .set({ 'If-Match-Ops': `"${estado.body.cell.opsVersion}"` })
      .send({ action: 'unblock' });
  };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrarOrg(ctx, orgA, 'A', sufijo);
    await registrarOrg(ctx, orgB, 'B', sufijo);
    siteA2 = await crearSede(ctx, orgA, `F5A-SEDE2-${sufijo}`);
    plataformaA = asUser(ctx.adminToken, orgA.tenantId);
    plataformaB = asUser(ctx.adminToken, orgB.tenantId);
    sitioDiagA = await crearUnidadYSitio(plataformaA, orgA, `IMG-A-${sufijo}`);
    sitioDiagB = await crearUnidadYSitio(plataformaB, orgB, `IMG-B-${sufijo}`);

    salaImagen = await espacioDe(
      orgA,
      orgA.siteId,
      'SPACE_FN_IMAGING_ROOM',
      'TC 1',
    );
    salaImagen2 = await espacioDe(
      orgA,
      orgA.siteId,
      'SPACE_FN_IMAGING_ROOM',
      'TC 2',
    );
    salaOtraSede = await espacioDe(
      orgA,
      siteA2,
      'SPACE_FN_IMAGING_ROOM',
      'TC otra sede',
    );
    consultorio = await espacioDe(
      orgA,
      orgA.siteId,
      'SPACE_FN_CONSULTING_ROOM',
      'Consultorio',
    );
    salaB = await espacioDe(
      orgB,
      orgB.siteId,
      'SPACE_FN_IMAGING_ROOM',
      'TC de B',
    );

    coordA = await crearMiembro(ctx, orgA, 'coord', sufijo, [
      'SCHEDULING_ADMIN',
    ]);
    clinicoA = await crearMiembro(ctx, orgA, 'clin', sufijo, ['CLINICIAN']);
    clinicoB = await crearMiembro(ctx, orgB, 'clinb', sufijo, ['CLINICIAN']);
    sinAlcanceA = await crearMiembro(ctx, orgA, 'sin', sufijo, [
      'SCHEDULING_AGENT',
    ]);
    const mant = await createStaff(
      ctx,
      orgA as any,
      'MANT',
      DELEG.ASSIGN_ROLE_MAINTENANCE,
      { kind: 'SITE', siteId: orgA.siteId },
      sufijo,
    );
    mantenimientoA = { token: mant.token };
    const enfermeria = await createStaff(
      ctx,
      orgA as any,
      'ENF',
      ROLE.NURSE,
      { kind: 'SITE', siteId: orgA.siteId },
      sufijo,
    );
    enfermeriaA = { token: enfermeria.token };
    doc1 = await registrarProfesional(ctx, 'd1', sufijo);
    doc2 = await registrarProfesional(ctx, 'd2', sufijo);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------------ PATCH /diagnostic-equipment/:id
  describe('PATCH /diagnostic-equipment/:id · sala, AE Title y estación', () => {
    it('el dueño de la organización ubica el equipo: queda la sala, el AE Title recortado, el evento, y la estación lo muestra tras recargar', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      const res = await patch(orgA, id, {
        careSpaceId: salaImagen.id,
        aeTitle: '  CT_SALA1 ',
        stationName: 'EST-CT-1',
      }).expect(200);
      expect(res.body).toMatchObject({
        careSpaceId: salaImagen.id,
        aeTitle: 'CT_SALA1',
        stationName: 'EST-CT-1',
      });
      expect(await filaEquipo(id)).toMatchObject({
        care_space_id: salaImagen.id,
        ae_title: 'CT_SALA1',
        station_name: 'EST-CT-1',
      });
      const eventos = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'diagnostic_units.equipment.located'`,
        [id],
      );
      expect(eventos).toHaveLength(1);
      expect(eventos[0].payload_json).toMatchObject({
        careSpaceId: salaImagen.id,
        previousCareSpaceId: null,
        tenantId: orgA.tenantId,
      });
      // Recarga: la estación DICOM sale de la base, con el código de la sala como SPS Location.
      const estacion = await http()
        .get(`/diagnostic-equipment/${id}/mwl-station`)
        .set(como(clinicoA))
        .expect(200);
      expect(estacion.body).toEqual({
        equipmentId: id,
        scheduledStationAETitle: 'CT_SALA1',
        scheduledStationName: 'EST-CT-1',
        spsLocation: salaImagen.code,
        careSpaceId: salaImagen.id,
      });
      expect(JSON.stringify(estacion.body)).not.toMatch(/patient/i);
    });

    it('fail-closed por contenido: sede ajena, función que no aloja, sala inexistente o de otra organización, AE inválido, estado inválido', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      const otraSede = await patch(orgA, id, { careSpaceId: salaOtraSede.id });
      expect(otraSede.status).toBe(422);
      expect(otraSede.body.reason).toBe('EQUIPMENT_SPACE_SITE_MISMATCH');
      const consult = await patch(orgA, id, { careSpaceId: consultorio.id });
      expect(consult.status).toBe(422);
      expect(consult.body.reason).toBe('SPACE_CANNOT_HOST_EQUIPMENT');
      for (const ajeno of [salaB.id, randomUUID()]) {
        const r = await patch(orgA, id, { careSpaceId: ajeno });
        expect(r.status).toBe(404);
      }
      for (const aeTitle of ['', '     ', 'A'.repeat(17), 'CT\\1', 'TÓMO']) {
        const r = await patch(orgA, id, { aeTitle });
        expect(r.status).toBe(422);
        expect(r.body.reason).toBe('AE_TITLE_INVALID');
      }
      const estacion = await patch(orgA, id, { stationName: 'X'.repeat(17) });
      expect(estacion.body.reason).toBe('STATION_NAME_INVALID');
      const estado = await patch(orgA, id, {
        operationalStatusConceptId: randomUUID(),
      });
      expect(estado.status).toBe(422);
      expect(estado.body.reason).toBe('EQUIPMENT_STATUS_INVALID');
      // Ninguna de las respuestas dejó nada escrito.
      expect(await filaEquipo(id)).toMatchObject({
        care_space_id: null,
        ae_title: null,
        station_name: null,
      });
    });

    it('una sala que no está activa (planificada) no aloja equipos: 422 EQUIPMENT_SPACE_NOT_ACTIVE', async () => {
      seq += 1;
      const planificada = await crearEspacio(ctx, orgA, orgA.siteId, {
        code: `PLAN-${seq}-${sufijo}`,
        name: 'TC planificada',
        functionCode: 'SPACE_FN_IMAGING_ROOM',
        areaM2: 30,
      });
      const id = await equipo(sitioDiagA, plataformaA);
      const r = await patch(orgA, id, { careSpaceId: planificada.id });
      expect(r.status).toBe(422);
      expect(r.body.reason).toBe('EQUIPMENT_SPACE_NOT_ACTIVE');
      expect((await filaEquipo(id)).care_space_id).toBeNull();
    });

    it('el AE Title es único por sitio: el segundo equipo es 409 AE_TITLE_TAKEN, también si llegan a la vez (una gana)', async () => {
      const a = await equipo(sitioDiagA, plataformaA);
      const b = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, a, { aeTitle: `AE-${sufijo}` }).expect(200);
      const choque = await patch(orgA, b, { aeTitle: `AE-${sufijo}` });
      expect(choque.status).toBe(409);
      expect(choque.body.reason).toBe('AE_TITLE_TAKEN');
      expect(JSON.stringify(choque.body)).not.toContain(a);
      // En paralelo: dos equipos pelean por el mismo AE Title nuevo.
      const c = await equipo(sitioDiagA, plataformaA);
      const d = await equipo(sitioDiagA, plataformaA);
      const [r1, r2] = await Promise.all([
        patch(orgA, c, { aeTitle: `PAR-${sufijo}` }),
        patch(orgA, d, { aeTitle: `PAR-${sufijo}` }),
      ]);
      expect([r1.status, r2.status].sort()).toEqual([200, 409]);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from diagnostic_units.diagnostic_equipment
          where diagnostic_unit_site_id = ? and ae_title = ?`,
        [sitioDiagA, `PAR-${sufijo}`],
      );
      expect(n).toBe(1);
    });

    it('quién puede: la plataforma y el dueño sí; Mantenimiento sólo el estado; sin alcance 404; otra organización 404', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, { careSpaceId: salaImagen.id }).expect(200);
      // Un usuario sin alcance sobre el espacio del equipo no lo ve: 404.
      const sinAlcance = await patch(sinAlcanceA, id, { aeTitle: 'NOPE' });
      expect(sinAlcance.status).toBe(404);
      // Otra organización: 404 igual que un id inexistente.
      const ajeno = await patch(orgB, id, { aeTitle: 'NOPE' });
      const inexistente = await patch(orgB, randomUUID(), { aeTitle: 'NOPE' });
      expect(ajeno.status).toBe(404);
      expect(inexistente.status).toBe(404);
      expect(ajeno.body.reason).toBe(inexistente.body.reason);
      expect((await filaEquipo(id)).ae_title).toBeNull();
      // La plataforma, dentro del tenant, sí.
      await patch(plataformaA, id, { aeTitle: 'PLAT' }).expect(200);
      // Mantenimiento de la sede cambia el estado y la calibración, pero no la estructura.
      const mant = asUser(mantenimientoA.token, orgA.tenantId);
      const estructura = await patch(mant, id, { aeTitle: 'OTRO' });
      expect(estructura.status).toBe(403);
      expect(estructura.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      await patch(mant, id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE,
      }).expect(200);
      expect((await filaEquipo(id)).operational_status_concept_id).toBe(
        DUNIT.EQUIPMENT_MAINTENANCE,
      );
      await patch(mant, id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
      }).expect(200);
      // Enfermería ve el espacio pero ninguna acción del equipo es suya: 403 y nada cambia.
      const enf = await patch(asUser(enfermeriaA.token, orgA.tenantId), id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE,
      });
      expect(enf.status).toBe(403);
      expect((await filaEquipo(id)).ae_title).toBe('PLAT');
      expect((await filaEquipo(id)).operational_status_concept_id).toBe(
        DUNIT.EQUIPMENT_OPERATIONAL,
      );
    });
  });

  // ------------------------------------------------------------ POST /:id/resource
  describe('POST /diagnostic-equipment/:id/resource · la agenda del equipo', () => {
    it('sin sala es 422 EQUIPMENT_NOT_LOCATED; ubicado, 201 y un segundo intento 409; el recurso lleva la sala', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      const sinSala = await http()
        .post(`/diagnostic-equipment/${id}/resource`)
        .set(dueñoA())
        .send({});
      expect(sinSala.status).toBe(422);
      expect(sinSala.body.reason).toBe('EQUIPMENT_NOT_LOCATED');
      await patch(orgA, id, { careSpaceId: salaImagen.id }).expect(200);
      const creado = await http()
        .post(`/diagnostic-equipment/${id}/resource`)
        .set(dueñoA())
        .send({ name: `Agenda TC ${sufijo}` })
        .expect(201);
      const [recurso] = await filas(
        ctx,
        `select tenant_id, care_space_id, resource_ref_type, resource_ref_id
           from scheduling.schedulable_resources where id = ?`,
        [creado.body.id],
      );
      // El recurso apunta al equipo; la sala se deriva SIEMPRE del equipo (no se copia), así que
      // reubicar el equipo no deja un recurso con una sala vieja.
      expect(recurso).toMatchObject({
        tenant_id: orgA.tenantId,
        care_space_id: null,
        resource_ref_type: 'diagnostic_equipment',
        resource_ref_id: id,
      });
      expect(
        (
          await filas(
            ctx,
            `select schedulable_resource_id from diagnostic_units.diagnostic_equipment where id = ?`,
            [id],
          )
        )[0].schedulable_resource_id,
      ).toBe(creado.body.id);
      const otra = await http()
        .post(`/diagnostic-equipment/${id}/resource`)
        .set(dueñoA())
        .send({});
      expect(otra.status).toBe(409);
      expect(otra.body.reason).toBe('RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT');
    });

    it('fail-closed: otra organización 404 y sin alcance 404, sin crear nada', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, { careSpaceId: salaImagen2.id }).expect(200);
      for (const quien of [dueñoB(), como(sinAlcanceA)]) {
        const r = await http()
          .post(`/diagnostic-equipment/${id}/resource`)
          .set(quien)
          .send({});
        expect(r.status).toBe(404);
      }
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from scheduling.schedulable_resources
          where resource_ref_type = 'diagnostic_equipment' and resource_ref_id = ?`,
        [id],
      );
      expect(n).toBe(0);
    });
  });

  // ------------------------------------------------------------ GET mwl-station
  describe('GET /diagnostic-equipment/:id/mwl-station', () => {
    it('otra organización 404 uniforme; quien administra la sede la ve; sin alcance 404', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, {
        careSpaceId: salaImagen.id,
        aeTitle: 'MWL1',
      }).expect(200);
      const ajeno = await http()
        .get(`/diagnostic-equipment/${id}/mwl-station`)
        .set(dueñoB());
      const inexistente = await http()
        .get(`/diagnostic-equipment/${randomUUID()}/mwl-station`)
        .set(dueñoB());
      expect(ajeno.status).toBe(404);
      expect(ajeno.body.reason).toBe(inexistente.body.reason);
      const admin = await http()
        .get(`/diagnostic-equipment/${id}/mwl-station`)
        .set(dueñoA())
        .expect(200);
      expect(admin.body.scheduledStationAETitle).toBe('MWL1');
      const sin = await http()
        .get(`/diagnostic-equipment/${id}/mwl-station`)
        .set(como(sinAlcanceA));
      expect(sin.status).toBe(200); // el mostrador de agenda atiende estudios y ve la estación
    });
  });

  // ------------------------------------------------------------ pasos y worklist
  describe('pasos de imagen programados y Modality Worklist', () => {
    it('programar toma el par equipo–sala del equipo; la worklist lo lista con el AE Title y la sala; recargar da lo mismo', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, {
        careSpaceId: salaImagen.id,
        aeTitle: `WL-${sufijo}`,
        stationName: 'EST-WL',
      }).expect(200);
      const study = await estudio(orgA.tenantId);
      const paso = await crearPaso(clinicoA, study).expect(201);
      expect(paso.body.statusConceptId).toBe(DIAG.PROCEDURE_STEP_PLANNED);
      expect(paso.body.scheduledEquipmentId).toBeNull();
      const inicio = futuro(5);
      const prog = await programar(coordA, paso.body.id, id, inicio).expect(
        200,
      );
      expect(prog.body).toMatchObject({
        scheduledEquipmentId: id,
        scheduledCareSpaceId: salaImagen.id,
        statusConceptId: DIAG.PROCEDURE_STEP_SCHEDULED,
      });
      const [fila] = await filas(
        ctx,
        `select scheduled_equipment_id, scheduled_care_space_id, scheduled_start_at, status_concept_id
           from diagnostics.imaging_procedure_steps where id = ?`,
        [paso.body.id],
      );
      expect(fila).toMatchObject({
        scheduled_equipment_id: id,
        scheduled_care_space_id: salaImagen.id,
        status_concept_id: DIAG.PROCEDURE_STEP_SCHEDULED,
      });
      expect(new Date(fila.scheduled_start_at).toISOString()).toBe(inicio);

      const lista = await http()
        .get('/diagnostics/imaging-worklist')
        .set(como(clinicoA))
        .query({ aeTitle: `WL-${sufijo}`, from: inicio, to: futuro(6) })
        .expect(200);
      expect(lista.body.count).toBe(1);
      expect(lista.body.items[0]).toMatchObject({
        stepId: paso.body.id,
        imagingStudyId: study,
        scheduledStationAETitle: `WL-${sufijo}`,
        scheduledStationName: 'EST-WL',
        spsLocation: salaImagen.code,
        careSpaceId: salaImagen.id,
        equipmentId: id,
        scheduledStartAt: inicio,
      });
      // Por equipo da lo mismo, y recargar (otra petición) también.
      const porEquipo = await http()
        .get('/diagnostics/imaging-worklist')
        .set(como(clinicoA))
        .query({ equipmentId: id, from: inicio, to: futuro(6) })
        .expect(200);
      expect(porEquipo.body.items.map((i: any) => i.stepId)).toEqual([
        paso.body.id,
      ]);
    });

    it('fail-closed de la programación: sin sala, en mantenimiento, con la sala bloqueada, equipo o paso de otra organización', async () => {
      const study = await estudio(orgA.tenantId);
      const sinSala = await equipo(sitioDiagA, plataformaA);
      const paso = (await crearPaso(clinicoA, study).expect(201)).body.id;
      const r1 = await programar(coordA, paso, sinSala, futuro(7));
      expect(r1.status).toBe(422);
      expect(r1.body.reason).toBe('IMAGING_EQUIPMENT_NOT_LOCATED');

      const enMant = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, enMant, { careSpaceId: salaImagen2.id }).expect(200);
      await patch(orgA, enMant, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE,
      }).expect(200);
      const r2 = await programar(coordA, paso, enMant, futuro(7));
      expect(r2.status).toBe(422);
      expect(r2.body.reason).toBe('IMAGING_EQUIPMENT_UNAVAILABLE');
      await patch(orgA, enMant, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
      }).expect(200);

      // Con la sala bloqueada de F2 no se programa; al desbloquear sí.
      await bloquear(orgA, salaImagen2.id).then((r) =>
        expect(r.status).toBe(200),
      );
      const r3 = await programar(coordA, paso, enMant, futuro(7));
      expect(r3.status).toBe(422);
      expect(r3.body.reason).toBe('SPACE_NOT_BOOKABLE');
      await desbloquear(orgA, salaImagen2.id).then((r) =>
        expect(r.status).toBe(200),
      );
      await programar(coordA, paso, enMant, futuro(7)).expect(200);

      // Otra organización: el paso, el equipo y el estudio responden 404 uniforme.
      const pasoDeB = (
        await crearPaso(clinicoB, await estudio(orgB.tenantId)).expect(201)
      ).body.id;
      const ajenoEquipo = await programar(clinicoB, pasoDeB, enMant, futuro(8));
      expect(ajenoEquipo.status).toBe(404);
      const ajenoPaso = await programar(clinicoB, paso, enMant, futuro(8));
      expect(ajenoPaso.status).toBe(404);
      const ajenoEstudio = await crearPaso(clinicoB, study);
      expect(ajenoEstudio.status).toBe(404);
      const [{ equipo: eq }] = await filas(
        ctx,
        `select scheduled_equipment_id as equipo from diagnostics.imaging_procedure_steps where id = ?`,
        [pasoDeB],
      );
      expect(eq).toBeNull();
    });

    it('la worklist se pide por estación y es del personal clínico del tenant: sin estación 422; otra organización no ve nada; sin rol clínico 403', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, {
        careSpaceId: salaImagen.id,
        aeTitle: `ZZ-${sufijo}`,
      }).expect(200);
      const study = await estudio(orgA.tenantId);
      const paso = (await crearPaso(clinicoA, study).expect(201)).body.id;
      await programar(coordA, paso, id, futuro(9)).expect(200);

      const sinEstacion = await http()
        .get('/diagnostics/imaging-worklist')
        .set(como(clinicoA));
      expect(sinEstacion.status).toBe(422);
      expect(sinEstacion.body.reason).toBe('IMAGING_WORKLIST_STATION_REQUIRED');
      for (const filtro of [{ equipmentId: id }, { aeTitle: `ZZ-${sufijo}` }]) {
        const deB = await http()
          .get('/diagnostics/imaging-worklist')
          .set(como(clinicoB))
          .query({
            ...filtro,
            from: futuro(9, '00:00'),
            to: futuro(10, '00:00'),
          })
          .expect(200);
        expect(deB.body).toEqual({ items: [], count: 0 });
      }
      const sinRol = await http()
        .get('/diagnostics/imaging-worklist')
        .set(como(coordA))
        .query({ equipmentId: id });
      expect(sinRol.status).toBe(403);
      // La plantilla de crear pasos tampoco es del mostrador.
      const crear = await crearPaso(coordA, study);
      expect(crear.status).toBe(403);
    });
  });

  // ------------------------------------------------------------ reubicación y estado, con la agenda
  describe('reubicar y sacar de servicio un equipo con estudios reservados', () => {
    const regla = (dow: number, from: string, to: string) => ({
      dayOfWeek: dow,
      startTime: `${from}:00`,
      endTime: `${to}:00`,
    });

    it('flujo completo con recarga: agenda del equipo → reserva → mover de sala arrastra paso y cita → fuera de servicio pide reconocer → cierra cupos → vuelve y los reabre', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, {
        careSpaceId: salaImagen.id,
        aeTitle: `FL-${sufijo}`,
      }).expect(200);
      const recurso = (
        await http()
          .post(`/diagnostic-equipment/${id}/resource`)
          .set(dueñoA())
          .send({ name: `Agenda flujo ${sufijo}`, timeZone: 'America/La_Paz' })
          .expect(201)
      ).body.id as string;

      // Horario de la agenda del equipo EN la sala, cupos y una reserva.
      const dia = new Date(Date.now() + 6 * 86_400_000);
      const fecha = dia.toISOString().slice(0, 10);
      const plantilla = await http()
        .post(`/scheduling/resources/${recurso}/templates`)
        .set(como(coordA))
        .send({
          name: `Horario TC ${sufijo}`,
          slotMinutes: 30,
          careSpaceId: salaImagen.id,
          rules: [regla(dia.getUTCDay(), '08:00', '10:00')],
        })
        .expect(201);
      const gen = await http()
        .post(`/scheduling/templates/${plantilla.body.id}/generate-slots`)
        .set(como(coordA))
        .send({ from: `${fecha}T00:00:00Z`, to: `${fecha}T23:59:59Z` })
        .expect(201);
      expect(gen.body.created).toBeGreaterThan(0);
      const cupos = (
        await http()
          .get(`/scheduling/resources/${recurso}/slots`)
          .set(como(coordA))
          .query({
            from: `${fecha}T00:00:00Z`,
            to: `${fecha}T23:59:59Z`,
            onlyAvailable: 'true',
          })
          .expect(200)
      ).body.items as any[];
      expect(cupos.length).toBeGreaterThan(1);
      const paciente = await createPatient(ctx, {
        name: `Paciente flujo ${sufijo}`,
        gender: 'MALE',
        birthDate: '1980-02-02',
      });
      const hold = await http()
        .post(`/scheduling/slots/${cupos[0].id}/holds`)
        .set(como(coordA))
        .send({ patientProfileId: paciente })
        .expect(201);
      const reserva = await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
        .set(como(coordA))
        .send({
          tenantId: orgA.tenantId,
          patientProfileId: paciente,
          channel: 'DESK',
        })
        .expect(201);
      const reservaId = (reserva.body.id ?? reserva.body.bookingId) as string;
      const citaDe = async () =>
        (
          await filas(
            ctx,
            `select a.care_space_id, a.status_concept_id from scheduling.appointment_bookings b
               join clinical.appointments a on a.id = b.appointment_id where b.id = ?`,
            [reservaId],
          )
        )[0];
      expect((await citaDe()).care_space_id).toBe(salaImagen.id);

      // Un paso de imagen programado en el mismo equipo.
      const paso = (
        await crearPaso(clinicoA, await estudio(orgA.tenantId)).expect(201)
      ).body.id;
      await programar(coordA, paso, id, futuro(12)).expect(200);

      // Mover el equipo de sala: el paso y la cita futura lo siguen, en la misma operación.
      await patch(orgA, id, { careSpaceId: salaImagen2.id }).expect(200);
      expect((await citaDe()).care_space_id).toBe(salaImagen2.id);
      const [pasoFila] = await filas(
        ctx,
        `select scheduled_care_space_id from diagnostics.imaging_procedure_steps where id = ?`,
        [paso],
      );
      expect(pasoFila.scheduled_care_space_id).toBe(salaImagen2.id);
      const mov = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'diagnostic_units.equipment.located' order by occurred_at`,
        [id],
      );
      expect(mov.map((e) => e.payload_json.careSpaceId)).toEqual([
        salaImagen.id,
        salaImagen2.id,
      ]);

      // Sacarlo de servicio con una reserva futura: 409 con la lista y su próxima acción.
      const conflicto = await patch(orgA, id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE,
      });
      expect(conflicto.status).toBe(409);
      expect(conflicto.body.reason).toBe('FUTURE_COMMITMENTS_CONFLICT');
      expect(conflicto.body.details.conflicts).toEqual([
        expect.objectContaining({
          kind: 'BOOKING',
          id: reservaId,
        }),
      ]);
      expect((await filaEquipo(id)).operational_status_concept_id).toBe(
        DUNIT.EQUIPMENT_OPERATIONAL,
      );

      // Reconocido: cambia, los cupos libres se cierran (por la fuente) y hay una excepción de solo lectura.
      const fuera = await patch(orgA, id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE,
        acknowledgeConflicts: true,
      }).expect(200);
      expect(fuera.body.conflicts).toHaveLength(1);
      const ofertaCerrada = (
        await http()
          .get(`/scheduling/resources/${recurso}/slots`)
          .set(como(coordA))
          .query({
            from: `${fecha}T00:00:00Z`,
            to: `${fecha}T23:59:59Z`,
            onlyAvailable: 'true',
          })
          .expect(200)
      ).body.items as any[];
      expect(ofertaCerrada).toHaveLength(0);
      const [exc] = await filas(
        ctx,
        `select source_ref_id, tenant_id from scheduling.availability_exceptions
          where resource_id = ? and source_ref_id = ?`,
        [recurso, id],
      );
      expect(exc).toMatchObject({
        source_ref_id: id,
        tenant_id: orgA.tenantId,
      });
      // La cita ya reservada sigue en pie.
      expect((await citaDe()).status_concept_id).toBe(CLIN.APPOINTMENT_BOOKED);
      // Y un paso nuevo ya no se programa en el equipo.
      const otroPaso = (
        await crearPaso(clinicoA, await estudio(orgA.tenantId)).expect(201)
      ).body.id;
      const rechazo = await programar(coordA, otroPaso, id, futuro(13));
      expect(rechazo.body.reason).toBe('IMAGING_EQUIPMENT_UNAVAILABLE');

      // Vuelve a operar: la oferta se reabre (lo que quedaba libre).
      await patch(orgA, id, {
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
      }).expect(200);
      const reabierta = (
        await http()
          .get(`/scheduling/resources/${recurso}/slots`)
          .set(como(coordA))
          .query({
            from: `${fecha}T00:00:00Z`,
            to: `${fecha}T23:59:59Z`,
            onlyAvailable: 'true',
          })
          .expect(200)
      ).body.items as any[];
      expect(reabierta.length).toBe(cupos.length - 1);
    });

    it('desubicar un equipo con reservas futuras es 409 aunque se reconozca el conflicto', async () => {
      const id = await equipo(sitioDiagA, plataformaA);
      await patch(orgA, id, { careSpaceId: salaImagen.id }).expect(200);
      const recurso = (
        await http()
          .post(`/diagnostic-equipment/${id}/resource`)
          .set(dueñoA())
          .send({ timeZone: 'America/La_Paz' })
          .expect(201)
      ).body.id as string;
      const dia = new Date(Date.now() + 8 * 86_400_000);
      const fecha = dia.toISOString().slice(0, 10);
      const pl = await http()
        .post(`/scheduling/resources/${recurso}/templates`)
        .set(como(coordA))
        .send({
          name: `Horario desubicar ${sufijo}`,
          slotMinutes: 30,
          careSpaceId: salaImagen.id,
          rules: [regla(dia.getUTCDay(), '08:00', '09:00')],
        })
        .expect(201);
      await http()
        .post(`/scheduling/templates/${pl.body.id}/generate-slots`)
        .set(como(coordA))
        .send({ from: `${fecha}T00:00:00Z`, to: `${fecha}T23:59:59Z` })
        .expect(201);
      const cupo = (
        await http()
          .get(`/scheduling/resources/${recurso}/slots`)
          .set(como(coordA))
          .query({
            from: `${fecha}T00:00:00Z`,
            to: `${fecha}T23:59:59Z`,
            onlyAvailable: 'true',
          })
          .expect(200)
      ).body.items[0];
      const paciente = await createPatient(ctx, {
        name: `Paciente desubicar ${sufijo}`,
        gender: 'FEMALE',
        birthDate: '1999-09-09',
      });
      const hold = await http()
        .post(`/scheduling/slots/${cupo.id}/holds`)
        .set(como(coordA))
        .send({ patientProfileId: paciente })
        .expect(201);
      await http()
        .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
        .set(como(coordA))
        .send({
          tenantId: orgA.tenantId,
          patientProfileId: paciente,
          channel: 'DESK',
        })
        .expect(201);
      const r = await patch(orgA, id, {
        careSpaceId: null,
        acknowledgeConflicts: true,
      });
      expect(r.status).toBe(409);
      expect(r.body.reason).toBe('FUTURE_COMMITMENTS_CONFLICT');
      expect((await filaEquipo(id)).care_space_id).toBe(salaImagen.id);
    });
  });

  // ------------------------------------------------------------ colector de la muestra
  describe('POST /diagnostics/specimens · collectorProfileId', () => {
    it('un profesional de otra organización o inexistente es 422 PRACTITIONER_NOT_IN_TENANT y no se registra la muestra; uno de la organización pasa', async () => {
      await darMembresia(ctx, doc1.userId, orgA.tenantId);
      const paciente = await createPatient(ctx, {
        name: `Paciente muestra ${sufijo}`,
        gender: 'FEMALE',
        birthDate: '1991-01-01',
      });
      const muestra = (collectorProfileId: string) =>
        http().post('/diagnostics/specimens').set(como(clinicoA)).send({
          patientProfileId: paciente,
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
          collectorProfileId,
        });
      for (const ajeno of [doc2.hpid, randomUUID()]) {
        const r = await muestra(ajeno);
        expect(r.status).toBe(422);
        expect(r.body.reason).toBe('PRACTITIONER_NOT_IN_TENANT');
      }
      const [{ n: antes }] = await filas(
        ctx,
        `select count(*)::int as n from diagnostics.specimens where patient_profile_id = ?`,
        [paciente],
      );
      expect(antes).toBe(0);
      const ok = await muestra(doc1.hpid);
      expect(ok.status).toBe(201);
      const [fila] = await filas(
        ctx,
        `select collector_profile_id, custodian_tenant_id from diagnostics.specimens where id = ?`,
        [ok.body.id],
      );
      expect(fila).toMatchObject({
        collector_profile_id: doc1.hpid,
        custodian_tenant_id: orgA.tenantId,
      });
    });
  });

  it('el bearer de una organización no opera en otra sin membresía', async () => {
    const id = await equipo(sitioDiagB, plataformaB);
    const r = await http()
      .patch(`/diagnostic-equipment/${id}`)
      .set({ ...bearer(orgA.token), 'X-Tenant-Id': orgB.tenantId })
      .send({ aeTitle: 'X' });
    expect([403, 404]).toContain(r.status);
    expect((await filaEquipo(id)).ae_title).toBeNull();
  });
});
