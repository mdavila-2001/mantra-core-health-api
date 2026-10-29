import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { CONCEPTS } from '../../src/common';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import {
  como,
  comoDueno,
  createPlainMember,
  createSpace,
  createStaffUser,
  ensureConcept,
  ifMatch,
  rect,
  registerOrg,
  sql,
  type PlanOrg,
} from './plan-fixtures';

/**
 * F1c · Plano de planta · estado superpuesto y tarjeta del paciente
 * (CONTRATO-PLANO §3.6, §3.7 y §4), contra la base real.
 *
 * El eje de la suite: **el paciente no viaja a quien no lo ve**. Para cada rol
 * se comprueba el cuerpo de la respuesta de red (que la clave `patient` no
 * exista), no sólo que la pantalla lo oculte.
 */
describe('Infraestructura F1c · plano · estado y tarjeta del paciente', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  let org: PlanOrg;
  const ids: Record<string, string> = {};
  let plan: any;
  const users: Record<string, { userId: string; token: string }> = {};

  const filas = (text: string, params: unknown[] = []) =>
    sql<any>(ctx, text, params);
  const mk = (
    code: string,
    form: string,
    fn: string,
    parent?: string,
    extra = {},
  ) =>
    createSpace(ctx, org, {
      code,
      name: `Espacio ${code}`,
      formCode: `LOC_FORM_${form}`,
      functionCode: `SPACE_FN_${fn}`,
      parentSpaceId: parent,
      ...extra,
    });
  const estado = (who: string, query = '') =>
    http()
      .get(`/floor-plans/${plan.id}/state${query}`)
      .set(como(who === 'dueno' ? org.token : users[who].token, org.tenantId));
  const tarjeta = (who: string, spaceId: string) =>
    http()
      .get(`/care-spaces/${spaceId}/plan-card`)
      .set(como(who === 'dueno' ? org.token : users[who].token, org.tenantId));

  /** Un paciente ingresado en una cama (fixture SQL: el ADT real se prueba en infrastructure-f3-adt). */
  async function ingresar(
    bedId: string,
    name: string,
    lastName: string,
    birth: string,
  ) {
    const personId = randomUUID();
    const encounterId = randomUUID();
    await filas(
      `insert into profiles.persons (id, person_status_concept_id, name, last_name, birth_date, created_at, updated_at)
       values (?::uuid, ?::uuid, ?, ?, ?::date, now(), now())`,
      [personId, CONCEPTS.STATE_ACTIVE, name, lastName, birth],
    );
    await filas(
      `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at)
       values (?::uuid, ?, now(), now())`,
      [personId, `PAC-${personId.slice(0, 8)}`],
    );
    await filas(
      `insert into clinical.encounters (id, patient_profile_id, tenant_id, status_concept_id, start_at, created_at, updated_at)
       values (?::uuid, ?::uuid, ?::uuid, ?::uuid, now() - interval '3 days', now(), now())`,
      [encounterId, personId, org.tenantId, CONCEPTS.STATE_ACTIVE],
    );
    await filas(
      `insert into clinical.encounter_locations
         (id, encounter_id, practice_site_id, care_space_id, location_status_concept_id, period_start, tenant_id, created_at, updated_at)
       values (gen_random_uuid(), ?::uuid, ?::uuid, ?::uuid, ?::uuid, now() - interval '3 days', ?::uuid, now(), now())`,
      [encounterId, org.siteId, bedId, CLIN.LOCATION_ACTIVE, org.tenantId],
    );
    return { personId, encounterId };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    org = await registerOrg(ctx, 'E', sufijo);

    ids.edif = (await mk('EDIF', 'BUILDING', 'BUILDING_GENERIC')).id;
    ids.piso = (await mk('PISO-1', 'LEVEL', 'LEVEL_GENERIC', ids.edif)).id;
    ids.sala = (await mk('SALA-A', 'WARD', 'WARD_GENERIC', ids.piso)).id;
    ids.h1 = (await mk('HAB-1', 'ROOM', 'INPATIENT_ROOM', ids.sala)).id;
    ids.h2 = (await mk('HAB-2', 'ROOM', 'INPATIENT_ROOM', ids.sala)).id;
    const bed = { bedCategoryCode: 'BED_CAT_PRIVATE', censable: true };
    ids.b1a = (await mk('CAMA-1A', 'BED', 'BED_STANDARD', ids.h1, bed)).id;
    ids.b1b = (await mk('CAMA-1B', 'BED', 'BED_STANDARD', ids.h1, bed)).id;
    ids.b2a = (await mk('CAMA-2A', 'BED', 'BED_STANDARD', ids.h2, bed)).id;
    // Las camas y locales se activan por SQL: activar por API exige el perfil completo de cada función.
    await filas(
      'update practice.care_spaces set status_concept_id = ? where practice_site_id = ?',
      [PRAC.SPACE_ACTIVE, org.siteId],
    );

    plan = (
      await http()
        .post(`/sites/${org.siteId}/floor-plans`)
        .set(comoDueno(org))
        .send({
          code: 'EST-P1',
          name: 'Piso 1',
          anchorSpaceId: ids.piso,
          widthM: 40,
          heightM: 20,
        })
        .expect(201)
    ).body;
    await http()
      .patch(`/floor-plans/${plan.id}/layout`)
      .set(comoDueno(org))
      .set(ifMatch(plan.layoutVersion))
      .send({
        upsert: {
          placements: [
            { spaceId: ids.sala, geometry: rect(2, 2, 20, 8.5) },
            { spaceId: ids.h1, geometry: rect(2, 2, 10, 8.5) },
            { spaceId: ids.h2, geometry: rect(12, 2, 10, 8.5) },
            { spaceId: ids.b1a, geometry: rect(3, 3, 1, 2) },
            { spaceId: ids.b1b, geometry: rect(6, 3, 1, 2) },
            { spaceId: ids.b2a, geometry: rect(14, 3, 1, 2) },
          ],
        },
      })
      .expect(200);

    // Dos unidades y su vínculo con cada habitación.
    for (const [key, code, room] of [
      ['uA', 'UN-A', ids.h1],
      ['uB', 'UN-B', ids.h2],
    ] as const) {
      const unit = (
        await http()
          .post(`/sites/${org.siteId}/clinical-units`)
          .set(comoDueno(org))
          .send({ code, name: code })
          .expect(201)
      ).body;
      ids[key] = unit.id;
      await http()
        .post(`/care-spaces/${room}/unit-assignments`)
        .set(comoDueno(org))
        .send({ clinicalUnitId: unit.id, roleCode: 'OWNER' })
        .expect(201);
    }

    users.enf = await createStaffUser(
      ctx,
      org,
      'DA_ASSIGN_NURSE',
      { kind: 'UNIT', unitId: ids.uA },
      'enf',
    );
    users.adm = await createStaffUser(
      ctx,
      org,
      'DA_ASSIGN_ADMISSION',
      { kind: 'SITE', siteId: org.siteId },
      'adm',
    );
    users.lim = await createStaffUser(
      ctx,
      org,
      'DA_ASSIGN_HOUSEKEEPING',
      { kind: 'SITE', siteId: org.siteId },
      'lim',
    );
    users.man = await createStaffUser(
      ctx,
      org,
      'DA_ASSIGN_MAINTENANCE',
      { kind: 'SITE', siteId: org.siteId },
      'man',
    );
    users.fac = await createStaffUser(
      ctx,
      org,
      'DA_ASSIGN_BILLING',
      { kind: 'SITE', siteId: org.siteId },
      'fac',
    );
    users.miembro = await createPlainMember(ctx, org, 'miembro');

    await ingresar(ids.b1a, 'Ana', 'Pérez', '1980-05-05');
    await ingresar(ids.b2a, 'Luis', 'Gómez', '1992-01-20');
    // Estado de F2 que ningún endpoint de esta rama escribe: higiene sucia y mantenimiento.
    const sucia = await ensureConcept(
      ctx,
      'practice',
      'HYG_DIRTY',
      'HYG_DIRTY',
    );
    await filas(
      `update practice.care_spaces set hygiene_status_concept_id = ?::uuid, hygiene_changed_at = now(),
              ops_version = ops_version + 1, updated_at = now() where id = ?::uuid`,
      [sucia, ids.b1b],
    );
    const bloqueo = await ensureConcept(
      ctx,
      'practice',
      'BLOCK_ADMIN',
      'BLOCK_ADMIN',
    );
    const motivo = await ensureConcept(
      ctx,
      'practice',
      'BLOCK_RSN_OTHER',
      'BLOCK_RSN_OTHER',
    );
    await filas(
      `insert into practice.care_space_blocks (id, tenant_id, care_space_id, kind_concept_id, reason_concept_id, reason_text, starts_at, created_at, updated_at)
       values (gen_random_uuid(), ?::uuid, ?::uuid, ?::uuid, ?::uuid, 'Fuga en el techo', now(), now(), now())`,
      [org.tenantId, ids.b2a, bloqueo, motivo],
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('estado superpuesto', () => {
    it('el dueño ve disponibilidad, ocupación, higiene y v2 por cama, los recuentos por contenedor y el asOf — sin paciente', async () => {
      const res = await estado('dueno').expect(200);
      const celdas = res.body.spaces;
      expect(Object.keys(celdas).sort()).toEqual(
        [ids.b1a, ids.b1b, ids.b2a, ids.h1, ids.h2].sort(),
      );
      expect(celdas[ids.b1a]).toMatchObject({
        lifecycle: { code: 'SPACE_ACTIVE' },
        occupancy: { code: 'OCC_OCCUPIED' },
        v2Code: 'O',
        assignable: false,
      });
      expect(celdas[ids.b1b]).toMatchObject({
        hygiene: { code: 'HYG_DIRTY', terminalRequired: false },
        occupancy: { code: 'OCC_FREE' },
        v2Code: 'H',
        assignable: false,
      });
      expect(res.body.rollups[ids.h1]).toMatchObject({
        beds: 2,
        occupied: 1,
        dirty: 1,
        censable: 2,
      });
      expect(res.body.rollups[ids.sala]).toMatchObject({
        beds: 3,
        occupied: 2,
        dirty: 1,
      });
      expect(res.body.counts).toMatchObject({
        total: 3,
        occupied: 2,
        dirty: 1,
        assignable: 0,
      });
      expect(Date.parse(res.body.asOf)).toBeGreaterThan(0);
      expect(res.body.layoutVersion).toBe(2);
      expect(res.body.viewer).toMatchObject({
        canSeeState: true,
        canSeePatient: false,
        scope: 'ALL',
      });
      // Ausente ≠ nulo: la clave ni existe, y el cuerpo no trae iniciales ni nombres.
      const texto = JSON.stringify(res.body);
      expect(texto).not.toContain('patient');
      expect(texto).not.toContain('initials');
      expect(texto).not.toMatch(/Ana|Pérez|Luis|Gómez/);
    });

    it('ETag y 304 mientras nada cambia; cambia al mover una higiene (la huella sube)', async () => {
      const primero = await estado('dueno').expect(200);
      const etag = primero.headers.etag as string;
      expect(etag).toMatch(/^W\/"fs:/);
      await estado('dueno').set('If-None-Match', etag).expect(304);
      const limpia = await ensureConcept(
        ctx,
        'practice',
        'HYG_INSPECTED',
        'HYG_INSPECTED',
      );
      // F2: sin la excepción de la práctica, una cama limpia sigue «H» hasta
      // que se inspecciona (infra.inspection_required por defecto).
      await filas(
        `update practice.care_spaces set hygiene_status_concept_id = ?::uuid, ops_version = ops_version + 1, updated_at = now() where id = ?::uuid`,
        [limpia, ids.b1b],
      );
      const despues = await estado('dueno')
        .set('If-None-Match', etag)
        .expect(200);
      expect(despues.headers.etag).not.toBe(etag);
      expect(despues.body.spaces[ids.b1b].v2Code).toBe('U');
      expect(despues.body.spaces[ids.b1b].assignable).toBe(true);
      expect(despues.body.counts.assignable).toBe(1);
    });

    it('el ETag depende del rol: el de un rol no sirve a otro', async () => {
      const dueno = await estado('dueno').expect(200);
      const lim = await estado('lim')
        .set('If-None-Match', dueno.headers.etag as string)
        .expect(200);
      expect(lim.headers.etag).not.toBe(dueno.headers.etag);
    });

    it('axis limita los ejes que viajan', async () => {
      const res = await estado('dueno', '?axis=occupancy').expect(200);
      const celda = res.body.spaces[ids.b1a];
      expect(celda.occupancy).toBeDefined();
      expect(celda).not.toHaveProperty('hygiene');
      expect(celda).not.toHaveProperty('availability');
      expect(celda.v2Code).toBe('O');
      await estado('dueno', '?axis=otra').expect(400);
    });

    it('ventana y foco acotan los espacios del estado', async () => {
      const foco = await estado('dueno', `?focusSpaceId=${ids.h2}`).expect(200);
      expect(Object.keys(foco.body.spaces).sort()).toEqual(
        [ids.b2a, ids.h2].sort(),
      );
      const caja = await estado('dueno', '?bbox=2,2,8,10').expect(200);
      expect(Object.keys(caja.body.spaces)).toEqual(
        expect.arrayContaining([ids.b1a, ids.b1b]),
      );
      expect(caja.body.spaces[ids.b2a]).toBeUndefined();
    });
  });

  // ------------------------------------------------------- datos clínicos libres
  describe('texto clínico (aislamiento y condición del paciente): sólo Enfermería, Admisión y Control de infecciones', () => {
    const ORGANISMO = 'Mycobacterium tuberculosis';
    const CONDICION = 'Paciente con diarrea persistente';
    const PIE = ['lim', 'man', 'dueno'] as const;

    beforeAll(async () => {
      users.ic = await createStaffUser(
        ctx,
        org,
        'DA_ASSIGN_INFECTION_CONTROL',
        { kind: 'SITE', siteId: org.siteId },
        'ic',
      );
      const aire = await ensureConcept(
        ctx,
        'practice',
        'ISO_AIRBORNE',
        'ISO_AIRBORNE',
      );
      await filas(
        `update practice.care_spaces set isolation_concept_id = ?::uuid, isolation_organism_text = ?,
                isolation_changed_at = now(), ops_version = ops_version + 1, updated_at = now() where id = ?::uuid`,
        [aire, ORGANISMO, ids.b1a],
      );
      const clinico = await ensureConcept(
        ctx,
        'practice',
        'BLOCK_CLINICAL',
        'BLOCK_CLINICAL',
      );
      const condicion = await ensureConcept(
        ctx,
        'practice',
        'BLOCK_RSN_PATIENT_CONDITION',
        'BLOCK_RSN_PATIENT_CONDITION',
      );
      await filas(
        `insert into practice.care_space_blocks (id, tenant_id, care_space_id, kind_concept_id, reason_concept_id, reason_text, starts_at, created_at, updated_at)
         values (gen_random_uuid(), ?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, now() - interval '1 minute', now(), now())`,
        [org.tenantId, ids.b1b, clinico, condicion, CONDICION],
      );
      // Como lo deja F2 al bloquear: el eje de disponibilidad con el mismo motivo.
      const bloqueada = await ensureConcept(
        ctx,
        'practice',
        'SPACE_OP_BLOCKED_CLINICAL',
        'SPACE_OP_BLOCKED_CLINICAL',
      );
      await filas(
        `update practice.care_spaces set operational_status_concept_id = ?::uuid, availability_reason_concept_id = ?::uuid,
                availability_changed_at = now(), ops_version = ops_version + 1, updated_at = now() where id = ?::uuid`,
        [bloqueada, condicion, ids.b1b],
      );
    });

    const sinTextoClinico = (body: unknown, conPaciente = false) => {
      const texto = JSON.stringify(body);
      expect(texto).not.toContain(ORGANISMO);
      expect(texto).not.toContain('Mycobacterium');
      expect(texto).not.toContain(CONDICION);
      expect(texto).not.toContain('diarrea');
      expect(texto).not.toContain('"organism"');
      if (!conPaciente) {
        expect(texto).not.toContain('"patient"');
        expect(texto).not.toContain('"initials"');
      }
    };

    it.each(['enf', 'adm', 'ic'])(
      '%s: ve el organismo y el texto de la condición del paciente',
      async (rol) => {
        const res = await estado(rol).expect(200);
        expect(res.body.spaces[ids.b1a].isolation.organism).toBe(ORGANISMO);
        expect(res.body.spaces[ids.b1b].availability.reasonText).toBe(
          CONDICION,
        );
        const card = await tarjeta(rol, ids.b1b).expect(200);
        expect(card.body.openBlocks[0].reasonText).toBe(CONDICION);
      },
    );

    it('Enfermería de la otra unidad no los ve (el alcance es el de su unidad)', async () => {
      const otraUnidad = await createStaffUser(
        ctx,
        org,
        'DA_ASSIGN_NURSE',
        { kind: 'UNIT', unitId: ids.uB },
        'enfB',
      );
      users.enfB = otraUnidad;
      const res = await estado('enfB').expect(200);
      expect(res.body.spaces[ids.b1a]).toBeUndefined();
      sinTextoClinico(res.body, true); // sí ve a sus pacientes (UN-B), no el texto de UN-A
    });

    it.each(PIE)(
      '%s: la clave organism y el texto de condición NO existen en el estado (ausente, no nulo)',
      async (rol) => {
        const res = await estado(rol).expect(200);
        const iso = res.body.spaces[ids.b1a].isolation;
        expect(iso.code).toBe('ISO_AIRBORNE'); // el tipo de aislamiento sí: son las precauciones
        expect(iso).not.toHaveProperty('organism');
        expect(res.body.spaces[ids.b1b].availability).not.toHaveProperty(
          'reasonText',
        );
        sinTextoClinico(res.body);
      },
    );

    it.each(PIE)(
      '%s: ni en el sondeo con un ETag viejo ni con axis acotado',
      async (rol) => {
        const primero = await estado(rol).expect(200);
        const viejo = await estado(rol)
          .set('If-None-Match', 'W/"fs:viejo"')
          .expect(200);
        sinTextoClinico(viejo.body);
        const acotado = await estado(
          rol,
          '?axis=isolation,availability',
        ).expect(200);
        sinTextoClinico(acotado.body);
        await estado(rol)
          .set('If-None-Match', primero.headers.etag as string)
          .expect(304);
      },
    );

    it.each(PIE)(
      '%s: ni en plan-card (ausente la clave del texto) ni en el layout',
      async (rol) => {
        const card = await tarjeta(rol, ids.b1b).expect(200);
        expect(card.body.openBlocks).toHaveLength(1);
        expect(card.body.openBlocks[0].reasonCode).toBe(
          'BLOCK_RSN_PATIENT_CONDITION',
        );
        expect(card.body.openBlocks[0]).not.toHaveProperty('reasonText');
        sinTextoClinico(card.body);
        const layout = await http()
          .get(`/floor-plans/${plan.id}/layout?detail=full`)
          .set(
            como(rol === 'dueno' ? org.token : users[rol].token, org.tenantId),
          )
          .expect(200);
        sinTextoClinico(layout.body);
      },
    );

    it('el texto clínico no llega al outbox ni al historial de ejes', async () => {
      const eventos = await filas(
        `select payload_json::text as p from messaging.domain_events where tenant_id = ?::uuid`,
        [org.tenantId],
      );
      for (const e of eventos) {
        expect(e.p).not.toContain('Mycobacterium');
        expect(e.p).not.toContain('diarrea');
      }
    });
  });

  describe('el paciente según el rol', () => {
    it('Enfermería de la unidad: iniciales sólo en su unidad; la cama de la otra unidad no aparece', async () => {
      const res = await estado('enf').expect(200);
      expect(res.body.viewer).toMatchObject({
        canSeePatient: true,
        scope: 'UNITS',
        unitIds: [ids.uA],
      });
      expect(Object.keys(res.body.spaces).sort()).toEqual(
        [ids.b1a, ids.b1b, ids.h1].sort(),
      );
      expect(res.body.spaces[ids.b1a].occupancy.patient).toMatchObject({
        initials: 'AP',
        ageYears: expect.any(Number),
        sexCode: expect.any(String),
      });
      const texto = JSON.stringify(res.body);
      expect(texto).not.toMatch(/Ana|Pérez|Luis|Gómez|"LG"/);
      expect(texto).not.toContain(ids.b2a);
      expect(res.body.rollups[ids.sala]).toBeUndefined();
      expect(res.body.rollups[ids.h1]).toBeDefined();
    });

    it('Admisión: iniciales de todas las camas del establecimiento', async () => {
      const res = await estado('adm').expect(200);
      expect(res.body.spaces[ids.b1a].occupancy.patient.initials).toBe('AP');
      expect(res.body.spaces[ids.b2a].occupancy.patient.initials).toBe('LG');
    });

    it.each(['lim', 'man', 'miembro'])(
      '%s: la respuesta de red NO contiene `patient` ni iniciales ni nombres (y sí la ocupación sin persona)',
      async (rol) => {
        const res = await estado(rol).expect(200);
        const texto = JSON.stringify(res.body);
        expect(texto).not.toContain('patient');
        expect(texto).not.toContain('initials');
        expect(texto).not.toMatch(/Ana|Pérez|Luis|Gómez/);
        if (rol !== 'miembro') {
          expect(res.body.viewer.canSeePatient).toBe(false);
          expect(res.body.spaces[ids.b1a].occupancy).toMatchObject({
            code: 'OCC_OCCUPIED',
          });
        } else {
          expect(res.body.viewer.canSeeState).toBe(false);
          expect(res.body.spaces).toEqual({});
        }
      },
    );

    it('Facturación no ve estado sobre el plano (200 vacío, no 403) y lo dice en viewer', async () => {
      const res = await estado('fac').expect(200);
      expect(res.body).toMatchObject({
        spaces: {},
        rollups: {},
        viewer: { canSeeState: false, scope: 'NONE' },
      });
      expect(res.body.counts.total).toBe(0);
    });

    it('plan-card: Enfermería ve el nombre sólo en su unidad; en la ajena es 404', async () => {
      const mia = await tarjeta('enf', ids.b1a).expect(200);
      expect(mia.body.patient).toMatchObject({
        displayName: 'Ana Pérez',
        initials: 'AP',
        losDays: 3,
        encounterId: expect.any(String),
      });
      expect(mia.headers['cache-control']).toBe('private, no-store');
      await tarjeta('enf', ids.b2a).expect(404);
    });

    it('plan-card: Admisión ve el nombre de cualquier cama del establecimiento', async () => {
      const res = await tarjeta('adm', ids.b2a).expect(200);
      expect(res.body.patient.displayName).toBe('Luis Gómez');
      expect(res.body.openBlocks).toEqual([
        expect.objectContaining({
          reasonText: 'Fuga en el techo',
          kind: 'BLOCK_ADMIN',
        }),
      ]);
    });

    it.each(['lim', 'man', 'dueno', 'miembro', 'fac'])(
      'plan-card: %s recibe 200 SIN la clave `patient` ni el nombre (no 403)',
      async (rol) => {
        const res = await tarjeta(rol, ids.b1a).expect(200);
        expect(res.body).not.toHaveProperty('patient');
        expect(JSON.stringify(res.body)).not.toMatch(/Ana|Pérez/);
        expect(res.headers['cache-control']).toBe('private, no-store');
      },
    );

    it('Limpieza y Mantenimiento siguen viendo el bloqueo de la cama', async () => {
      for (const rol of ['lim', 'man']) {
        const res = await tarjeta(rol, ids.b2a).expect(200);
        expect(res.body.openBlocks[0].reasonText).toBe('Fuga en el techo');
        expect(res.body).not.toHaveProperty('patient');
      }
    });

    it('leer el nombre deja rastro en data_access_log, sin repetirse dentro de 60 s; quien no lo ve no deja rastro', async () => {
      const antes = await filas(
        `select count(*)::int as n from audit.data_access_log where resource_type = 'PLAN_OCCUPANT_VIEWED' and resource_id = ?`,
        [ids.b1a],
      );
      await tarjeta('adm', ids.b1a).expect(200);
      await tarjeta('adm', ids.b1a).expect(200);
      await tarjeta('lim', ids.b1a).expect(200);
      const filasLog = await filas(
        `select user_id, tenant_id, patient_profile_id from audit.data_access_log
          where resource_type = 'PLAN_OCCUPANT_VIEWED' and resource_id = ? and user_id = ?`,
        [ids.b1a, users.adm.userId],
      );
      expect(filasLog).toHaveLength(1);
      expect(filasLog[0].tenant_id).toBe(org.tenantId);
      const despues = await filas(
        `select count(*)::int as n from audit.data_access_log where resource_type = 'PLAN_OCCUPANT_VIEWED' and resource_id = ?`,
        [ids.b1a],
      );
      expect(despues[0].n - antes[0].n).toBe(1);
      expect(
        (
          await filas(
            `select count(*)::int as n from audit.data_access_log where resource_type = 'PLAN_OCCUPANT_VIEWED' and user_id = ?`,
            [users.lim.userId],
          )
        )[0].n,
      ).toBe(0);
    });

    it('un usuario de otra organización no obtiene nada: 404', async () => {
      const otro = await registerOrg(ctx, 'F', sufijo);
      await http()
        .get(`/floor-plans/${plan.id}/state`)
        .set(comoDueno(otro))
        .expect(404);
      await http()
        .get(`/care-spaces/${ids.b1a}/plan-card`)
        .set(comoDueno(otro))
        .expect(404);
    });
  });
});
