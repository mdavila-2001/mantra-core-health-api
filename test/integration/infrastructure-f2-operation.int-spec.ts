import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  TEST_ADMIN_ID,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService, runWithTenant } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import {
  CARE_SPACE_OPS_PORT,
  RetireBlockerRegistry,
  type CareSpaceOpsPort,
} from '../../src/modules/practice/services';

/**
 * F2 de infraestructura hospitalaria · operación de espacios (CONTRATO-F2-F5 §F2.3 y
 * F2.5), contra la base real y por HTTP real.
 *
 * Por endpoint hay un caso permitido y uno que falla cerrado: otro tenant (404 idéntico al
 * de un id inexistente), mismo tenant sin rol que cubra el espacio (404) y con rol pero sin
 * la acción (403 `INFRA_ACTION_NOT_ALLOWED`). Además:
 *
 * - 1 y 2: bloqueo por mantenimiento con fecha estimada, motivos y versión operativa;
 * - 3: compromisos futuros del quirófano (`FUTURE_COMMITMENTS_CONFLICT`);
 * - 4: ciclo de limpieza con cuatro eventos A20 y otro usuario que inspecciona;
 * - 5: aislamiento aéreo sin AIIR validado, cohorte de camas hermanas y limpieza terminal;
 * - 6: Limpieza no ve pacientes ni bloquea; el organismo no sale a roles no clínicos;
 * - 7: 404 cruzado y `If-Match-Ops` viejo (412);
 * - 8: el evento A20 no se puede modificar en la base;
 * - flujo completo bloquear → mantener → limpiar → inspeccionar → liberar, con recarga;
 * - `blocks-tick` y el puerto `CareSpaceOpsPort` que usarán F3 y F4.
 *
 * Los datos se crean por la API real; las comprobaciones de persistencia leen las tablas.
 */
describe('Infraestructura F2 · operación de espacios', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';

  interface Org {
    email: string;
    tenantId: string;
    token: string;
    practiceId: string;
    siteId: string;
  }
  interface Actor {
    userId: string;
    token: string;
    tenantId: string;
  }
  const mk = (letra: string): Org => ({
    email: `f2-${letra.toLowerCase()}-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  });
  const orgA = mk('A');
  const orgB = mk('B');

  const como = (a: { token: string; tenantId: string }) => ({
    ...bearer(a.token),
    'X-Tenant-Id': a.tenantId,
  });
  const ops = (version: number) => ({ 'If-Match-Ops': `"${version}"` });
  const ifMatch = (version: number) => ({ 'If-Match': `"${version}"` });

  async function filas(sql: string, params: unknown[] = []): Promise<any[]> {
    return ctx.orm.em.fork().getConnection().execute(sql, params);
  }

  async function registrar(org: Org, letra: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F2_${letra}_${sufijo.toUpperCase()}`,
          legalName: `Hospital F2 ${letra} ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email: org.email, password, name: 'Dueña', lastName: letra },
      })
      .expect(201);
    org.tenantId = alta.body.tenantId;
    org.token = (
      await http()
        .post('/iam/auth/login')
        .send({ email: org.email, password })
        .expect(200)
    ).body.accessToken;
    org.practiceId = (
      await http()
        .post('/practices')
        .set(bearer(ctx.adminToken))
        .send({
          tenantId: org.tenantId,
          code: `F2-PRACT-${letra}-${sufijo}`,
          name: `Hospital F2 ${letra}`,
          timeZone: 'America/La_Paz',
        })
        .expect(201)
    ).body.id;
    org.siteId = (
      await http()
        .post(`/practices/${org.practiceId}/sites`)
        .set(como(org))
        .send({ code: `F2-SEDE-${letra}-${sufijo}`, name: `Sede ${letra}` })
        .expect(201)
    ).body.id;
  }

  /** Crea un espacio activo por la API real. */
  async function espacio(
    body: Record<string, unknown>,
    siteId = orgA.siteId,
    org: Org = orgA,
  ): Promise<any> {
    return (
      await http()
        .post(`/sites/${siteId}/care-spaces`)
        .set(como(org))
        .send({ activate: true, ...body })
        .expect(201)
    ).body;
  }

  const unidades: Record<string, string> = {};
  const ids: Record<string, string> = {};

  /** Cama activa bajo `parentId`, con la unidad U1 como dueña. */
  async function cama(
    code: string,
    parentId: string,
    unit: string | null = 'MED',
  ): Promise<string> {
    const creada = await espacio({
      code,
      name: `Cama ${code}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: parentId,
      bedCategoryCode: 'BED_CAT_PRIVATE',
      censable: true,
    });
    if (unit) {
      await http()
        .post(`/care-spaces/${creada.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: unidades[unit], roleCode: 'OWNER' })
        .expect(201);
    }
    ids[code] = creada.id;
    return creada.id;
  }

  async function crearUsuario(
    etiqueta: string,
    asignaciones: {
      role: string;
      scope: string;
      siteId?: string;
      unitId?: string;
      spaceId?: string;
    }[],
  ): Promise<Actor> {
    const email = `f2-${etiqueta}-${sufijo}@example.test`;
    const user = await http()
      .post('/iam/users')
      .set(bearer(ctx.adminToken))
      .send({ displayName: etiqueta, email, password, initialRole: 'USER' })
      .expect(201);
    await http()
      .post(`/tenants/${orgA.tenantId}/memberships`)
      .set(como(orgA))
      .send({ userId: user.body.id, role: 'STAFF', accessScope: 'ALL_TENANT' })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    const [membership] = await filas(
      'select id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
      [user.body.id, orgA.tenantId],
    );
    for (const a of asignaciones) {
      await filas(
        `insert into delegated_access.organization_user_assignments
           (id, tenant_membership_id, practice_site_id, clinical_unit_id, care_space_id,
            assignment_role_concept_id, access_scope_concept_id, status_concept_id,
            valid_from, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, now() - interval '1 minute', now(), now())`,
        [
          randomUUID(),
          membership.id,
          a.siteId ?? null,
          a.unitId ?? null,
          a.spaceId ?? null,
          a.role,
          a.scope,
          CONCEPTS.STATE_ACTIVE,
        ],
      );
    }
    return {
      userId: user.body.id,
      token: login.body.accessToken,
      tenantId: orgA.tenantId,
    };
  }

  const nurse = {} as Actor;
  const nurseSup = {} as Actor;
  const cleaner = {} as Actor;
  const cleaner2 = {} as Actor;
  const cleanerSup = {} as Actor;
  const maint = {} as Actor;
  const infection = {} as Actor;
  const orMgr = {} as Actor;
  const spaceNurse = {} as Actor;
  const admission = {} as Actor;
  const outsider = {} as Actor;
  const owner = (): Actor => ({
    userId: '',
    token: orgA.token,
    tenantId: orgA.tenantId,
  });
  const platform = (): Actor => ({
    userId: TEST_ADMIN_ID,
    token: ctx.adminToken,
    tenantId: orgA.tenantId,
  });
  const ownerB = (): Actor => ({
    userId: '',
    token: orgB.token,
    tenantId: orgB.tenantId,
  });

  const estado = (a: Actor, id: string) =>
    http().get(`/care-spaces/${id}/operational-state`).set(como(a));
  const opsVersion = async (id: string): Promise<number> =>
    (
      await filas('select ops_version from practice.care_spaces where id = ?', [
        id,
      ])
    )[0].ops_version;
  const rowVersion = async (id: string): Promise<number> =>
    (
      await filas('select row_version from practice.care_spaces where id = ?', [
        id,
      ])
    )[0].row_version;
  const disponibilidad = async (a: Actor, id: string, body: object) =>
    http()
      .post(`/care-spaces/${id}/availability`)
      .set(como(a))
      .set(ops(await opsVersion(id)))
      .send(body);
  const higiene = async (a: Actor, id: string, body: object) =>
    http()
      .post(`/care-spaces/${id}/hygiene`)
      .set(como(a))
      .set(ops(await opsVersion(id)))
      .send(body);
  const aislamiento = async (a: Actor, id: string, body: object) =>
    http()
      .post(`/care-spaces/${id}/isolation`)
      .set(como(a))
      .set(ops(await opsVersion(id)))
      .send(body);
  const evento = async (id: string, axis?: string) =>
    filas(
      `select e.*, c.code as axis_code from practice.care_space_status_events e
         join terminology.catalog_concepts c on c.id = e.axis_concept_id
        where e.care_space_id = ? ${axis ? 'and c.code = ?' : ''}
        order by e.occurred_at, e.created_at`,
      axis ? [id, `practice:${axis}`] : [id],
    );
  const outbox = async (tipo: string, aggregateId: string) =>
    filas(
      `select payload_json from messaging.domain_events
        where event_type = ? and aggregate_id = ? order by recorded_at`,
      [tipo, aggregateId],
    );
  const ordenAbierta = async (spaceId: string) =>
    (
      await filas(
        `select o.*, t.code as type_code, s.code as status_code
           from practice.cleaning_orders o
           join terminology.catalog_concepts t on t.id = o.cleaning_type_concept_id
           join terminology.catalog_concepts s on s.id = o.status_concept_id
          where o.care_space_id = ? order by o.created_at desc`,
        [spaceId],
      )
    )[0];

  /** Compara dos 404: el de un id ajeno tiene que ser idéntico al de uno inexistente. */
  async function es404Uniforme(
    llamar: (id: string) => request.Test,
    idAjeno: string,
  ): Promise<void> {
    const ajeno = await llamar(idAjeno).expect(404);
    const inexistente = await llamar(randomUUID()).expect(404);
    expect(ajeno.body.reason).toBe(inexistente.body.reason);
    expect(ajeno.body.message).toBe(inexistente.body.message);
    expect(ajeno.body.details).toBeUndefined();
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrar(orgA, 'A');
    await registrar(orgB, 'B');

    for (const [code, name] of [
      ['MED', 'Medicina Interna'],
      ['QX', 'Quirófanos'],
    ]) {
      unidades[code] = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(como(orgA))
          .send({ code, name })
          .expect(201)
      ).body.id;
    }

    const area = await espacio({
      code: 'PISO-4',
      name: 'Piso 4',
      formCode: 'LOC_FORM_AREA',
      functionCode: 'SPACE_FN_AREA_GENERIC',
    });
    ids.area = area.id;
    const habitacion = async (code: string, extra: object = {}) =>
      (
        await espacio({
          code,
          name: `Habitación ${code}`,
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_INPATIENT_ROOM',
          parentSpaceId: area.id,
          ...extra,
        })
      ).id;
    const h401 = await habitacion('HAB-401');
    ids['HAB-301'] = await habitacion('HAB-301');
    ids['HAB-302'] = await habitacion('HAB-302');
    for (const c of ['401-A', '401-B', '401-C', '401-D', '401-E', '401-F'])
      await cama(`CAMA-${c}`, h401);
    await cama('CAMA-301-A', ids['HAB-301']);
    await cama('CAMA-301-B', ids['HAB-301']);
    await cama('CAMA-302-A', ids['HAB-302']);
    await cama('CAMA-302-B', ids['HAB-302']);

    const hoy = new Date().toISOString().slice(0, 10);
    const aiir = (code: string, validated: string) =>
      habitacion(code, {
        functionCode: 'SPACE_FN_ISOLATION_AIIR',
        areaM2: 18,
        pressureCode: 'PRESSURE_NEGATIVE',
        airChangesPerHour: 12,
        hvacValidatedOn: validated,
      });
    ids['AIIR-1'] = await aiir('AIIR-1', hoy);
    ids['AIIR-2'] = await aiir('AIIR-2', '2024-01-01');
    await cama('CAMA-AIIR-1', ids['AIIR-1']);
    await cama('CAMA-AIIR-2', ids['AIIR-2']);

    const qx = await espacio({
      code: 'QX-1',
      name: 'Quirófano 1',
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_OPERATING_ROOM',
      areaM2: 30,
      pressureCode: 'PRESSURE_POSITIVE',
      airChangesPerHour: 20,
      hvacValidatedOn: hoy,
    });
    ids['QX-1'] = qx.id;
    await http()
      .post(`/care-spaces/${qx.id}/unit-assignments`)
      .set(como(orgA))
      .send({ clinicalUnitId: unidades.QX, roleCode: 'OWNER' })
      .expect(201);

    const D = DELEG;
    Object.assign(
      nurse,
      await crearUsuario('nurse', [
        {
          role: D.ASSIGN_ROLE_NURSE,
          scope: D.SCOPE_UNIT,
          unitId: unidades.MED,
        },
      ]),
    );
    Object.assign(
      nurseSup,
      await crearUsuario('nursesup', [
        {
          role: D.ASSIGN_ROLE_NURSE_SUPERVISOR,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      cleaner,
      await crearUsuario('cleaner', [
        {
          role: D.ASSIGN_ROLE_HOUSEKEEPING,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      cleaner2,
      await crearUsuario('cleaner2', [
        {
          role: D.ASSIGN_ROLE_HOUSEKEEPING,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      cleanerSup,
      await crearUsuario('cleanersup', [
        {
          role: D.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      maint,
      await crearUsuario('maint', [
        {
          role: D.ASSIGN_ROLE_MAINTENANCE,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      infection,
      await crearUsuario('infection', [
        { role: D.ASSIGN_ROLE_NURSE, scope: D.SCOPE_SITE, siteId: orgA.siteId },
        {
          role: D.ASSIGN_ROLE_INFECTION_CONTROL,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      orMgr,
      await crearUsuario('ormgr', [
        {
          role: D.ASSIGN_ROLE_OR_MANAGER,
          scope: D.SCOPE_SITE,
          siteId: orgA.siteId,
        },
      ]),
    );
    Object.assign(
      spaceNurse,
      await crearUsuario('spacenurse', [
        {
          role: D.ASSIGN_ROLE_NURSE,
          scope: D.SCOPE_SPACE,
          spaceId: ids['CAMA-401-B'],
        },
      ]),
    );
    Object.assign(
      admission,
      await crearUsuario('admission', [
        {
          role: D.ASSIGN_ROLE_ADMISSION,
          scope: D.SCOPE_UNIT,
          unitId: unidades.MED,
        },
      ]),
    );
    Object.assign(outsider, await crearUsuario('outsider', []));
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------------------ catálogo
  describe('catálogo', () => {
    it('GET /practice/infrastructure-catalog suma ejes, motivos por tipo, limpieza y las 7 reglas v2', async () => {
      const res = await http()
        .get('/practice/infrastructure-catalog')
        .set(como(orgA))
        .expect(200);
      const b = res.body;
      expect(b.availability.map((x: any) => x.code)).toEqual(
        expect.arrayContaining([
          'SPACE_OP_AVAILABLE',
          'SPACE_OP_BLOCKED_CLINICAL',
          'SPACE_OP_BLOCKED_ADMIN',
          'SPACE_OP_MAINTENANCE',
          'SPACE_OP_CLOSED',
        ]),
      );
      expect(b.hygiene).toHaveLength(5);
      expect(b.isolation).toHaveLength(5);
      expect(b.occupancy).toHaveLength(3);
      const mant = b.blockReasons.find(
        (r: any) => r.code === 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
      );
      expect(mant.kinds).toEqual(['BLOCK_MAINTENANCE']);
      const otro = b.blockReasons.find(
        (r: any) => r.code === 'BLOCK_RSN_OTHER',
      );
      expect(otro.requiresText).toBe(true);
      expect(b.cleaningTypes.map((x: any) => x.code)).toContain(
        'CLEAN_TERMINAL',
      );
      expect(b.cleaningPriorities).toHaveLength(3);
      expect(b.v2Map.rules).toHaveLength(7);
      expect(b.v2Map.codeSystemLocal).toBe('urn:mantra:bed-status');
    });
  });

  // ------------------------------------------------- 1 y 2: bloqueo / mantenimiento
  describe('disponibilidad: bloqueo, mantenimiento y versión operativa', () => {
    let blockId: string;
    const mañana = () => new Date(Date.now() + 86_400_000).toISOString();

    it('Limpieza no bloquea (403 INFRA_ACTION_NOT_ALLOWED con los roles requeridos) y no escribe nada', async () => {
      const id = ids['CAMA-401-A'];
      const antes = await opsVersion(id);
      const res = await disponibilidad(cleaner, id, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
      }).then((r) => r);
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(res.body.details.requiredRoles).toEqual(
        expect.arrayContaining(['NURSE']),
      );
      expect(await opsVersion(id)).toBe(antes);
      const n = await filas(
        'select count(*)::int as n from practice.care_space_blocks where care_space_id = ?',
        [id],
      );
      expect(n[0].n).toBe(0);
    });

    it('sin rol que cubra el espacio es 404 (no 403) y sin If-Match-Ops es 428', async () => {
      const id = ids['CAMA-401-A'];
      await disponibilidad(outsider, id, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
      }).then((r) => expect(r.status).toBe(404));
      // enfermería con alcance de unidad sobre una cama de OTRA unidad (quirófano): 404
      await disponibilidad(nurse, ids['QX-1'], {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
      }).then((r) => expect(r.status).toBe(404));
      await http()
        .post(`/care-spaces/${id}/availability`)
        .set(como(maint))
        .send({ action: 'start-maintenance' })
        .expect(428);
    });

    it('2: mantenimiento sin fecha estimada, motivo «otro» sin texto, motivo ausente o de otro tipo: 422 con su reason', async () => {
      const id = ids['CAMA-401-A'];
      const casos: [object, string][] = [
        [
          {
            action: 'start-maintenance',
            reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
          },
          'BLOCK_EXPECTED_END_REQUIRED',
        ],
        [
          {
            action: 'start-maintenance',
            reasonCode: 'BLOCK_RSN_OTHER',
            expectedEndAt: mañana(),
          },
          'BLOCK_REASON_TEXT_REQUIRED',
        ],
        [
          { action: 'start-maintenance', expectedEndAt: mañana() },
          'BLOCK_REASON_REQUIRED',
        ],
        [
          {
            action: 'start-maintenance',
            reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
            expectedEndAt: mañana(),
          },
          'BLOCK_REASON_KIND_MISMATCH',
        ],
        [
          {
            action: 'start-maintenance',
            reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
            expectedEndAt: new Date(Date.now() - 3_600_000).toISOString(),
          },
          'BLOCK_PERIOD_INVALID',
        ],
        [
          { action: 'block', reasonCode: 'BLOCK_RSN_OTHER' },
          'AVAILABILITY_ACTION_INVALID',
        ],
      ];
      for (const [body, reason] of casos) {
        const res = await disponibilidad(maint, id, body);
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe(reason);
      }
      expect(await evento(id)).toHaveLength(0);
    });

    it('1: bloquear una cama libre por mantenimiento preventivo con fecha estimada deja fila, evento A20 con C, outbox y la celda tras recargar', async () => {
      const id = ids['CAMA-401-A'];
      const fin = new Date(Date.now() + 2 * 86_400_000).toISOString();
      const antesOps = await opsVersion(id);
      const antesRow = await rowVersion(id);
      const res = await disponibilidad(maint, id, {
        action: 'block',
        kindCode: 'BLOCK_MAINTENANCE',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
        expectedEndAt: fin,
        workOrderRef: 'OT-1',
      });
      expect(res.status).toBe(200);
      blockId = res.body.blockId;
      expect(res.body.cell).toMatchObject({
        v2Code: 'C',
        assignable: false,
        availability: {
          code: 'SPACE_OP_MAINTENANCE',
          reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
        },
      });

      // Base: fila del bloqueo, evento A20 append-only y outbox.
      const [bloque] = await filas(
        'select * from practice.care_space_blocks where id = ?',
        [blockId],
      );
      expect(bloque).toMatchObject({
        tenant_id: orgA.tenantId,
        care_space_id: id,
        work_order_ref: 'OT-1',
        created_by_user_id: maint.userId,
      });
      expect(new Date(bloque.expected_end_at).toISOString()).toBe(fin);
      const eventos = await evento(id, 'AXIS_AVAILABILITY');
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toMatchObject({
        v2_0116_code: 'C',
        recorded_by_user_id: maint.userId,
      });
      expect(eventos[0].request_id).toBeTruthy();
      const [iniciado] = await outbox(
        'practice.care_space.block_started',
        blockId,
      );
      expect(iniciado.payload_json).toMatchObject({
        careSpaceId: id,
        kind: 'BLOCK_MAINTENANCE',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
        tenantId: orgA.tenantId,
      });
      const [cambio] = await outbox('practice.care_space.status_changed', id);
      expect(cambio.payload_json).toMatchObject({
        axis: 'AXIS_AVAILABILITY',
        v2Code: 'C',
      });

      // Versiones: la operativa sube, la de estructura no se toca.
      expect(await opsVersion(id)).toBe(antesOps + 1);
      expect(await rowVersion(id)).toBe(antesRow);
      // Historia de la fila y del bloqueo.
      const [h] = await filas(
        `select count(*)::int as n from audit.care_space_blocks_history where care_space_block_id = ?`,
        [blockId],
      );
      expect(h.n).toBe(1);
      const [hs] = await filas(
        `select data_snapshot->>'opsAction' as accion from audit.care_spaces_history
          where care_space_id = ? order by recorded_at desc limit 1`,
        [id],
      );
      expect(hs.accion).toBe('AVAILABILITY_BLOCK');

      // Recarga: la celda del tablero y la ficha operativa dicen «Mantenimiento · hasta …».
      const recarga = await estado(maint, id).expect(200);
      expect(recarga.body.cell.availability.expectedUntil).toBe(fin);
      expect(recarga.body.cell.availability.code).toBe('SPACE_OP_MAINTENANCE');
      expect(recarga.body.openBlocks).toHaveLength(1);
      expect(recarga.body.openBlocks[0]).toMatchObject({
        id: blockId,
        applied: true,
        overdue: false,
      });
      const tablero = await http()
        .get(`/sites/${orgA.siteId}/bed-board`)
        .set(como(maint))
        .expect(200);
      const celda = tablero.body.units
        .flatMap((u: any) => u.cells)
        .find((c: any) => c.id === id);
      expect(celda.availability.code).toBe('SPACE_OP_MAINTENANCE');
      expect(celda.v2Code).toBe('C');
    });

    it('un segundo bloqueo sobre la misma cama es 409 BLOCK_OVERLAP y la base también lo impide (EXCLUDE)', async () => {
      const id = ids['CAMA-401-A'];
      const res = await disponibilidad(owner(), id, {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      });
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('BLOCK_OVERLAP');
      await expect(
        filas(
          `insert into practice.care_space_blocks
             (id, tenant_id, care_space_id, kind_concept_id, reason_concept_id, starts_at,
              expected_end_at, created_at, updated_at)
           select gen_random_uuid(), tenant_id, care_space_id, kind_concept_id,
                  reason_concept_id, starts_at + interval '1 minute', expected_end_at, now(), now()
             from practice.care_space_blocks where id = ?`,
          [blockId],
        ),
      ).rejects.toThrow(/ex_care_space_blocks_time|conflicting key/);
    });

    it('If-Match-Ops viejo es 412 OPS_VERSION_MISMATCH y no escribe', async () => {
      const id = ids['CAMA-401-A'];
      const vieja = (await opsVersion(id)) - 1;
      const res = await http()
        .post(`/care-spaces/${id}/hygiene`)
        .set(como(nurse))
        .set(ops(vieja))
        .send({ action: 'mark-dirty', reasonText: 'Derrame' });
      expect(res.status).toBe(412);
      expect(res.body.reason).toBe('OPS_VERSION_MISMATCH');
      expect(res.body.details.currentOpsVersion).toBe(await opsVersion(id));
    });

    it('terminar el mantenimiento: otro rol lo permite, devuelve la cama a disponible, la deja sucia y abre la orden MAINTENANCE_END', async () => {
      const id = ids['CAMA-401-A'];
      // enfermería no levanta un mantenimiento (solo mantenimiento o un admin)
      await http()
        .post(`/care-space-blocks/${blockId}/end`)
        .set(como(nurse))
        .send({ note: 'x' })
        .expect(403);
      const antes = await ordenAbierta(id);
      expect(antes).toBeUndefined();
      const res = await http()
        .post(`/care-space-blocks/${blockId}/end`)
        .set(como(maint))
        .send({ note: 'Revisión terminada' })
        .expect(200);
      expect(res.body.cleaningOrderId).toBeTruthy();
      expect(res.body.cell.availability.code).toBe('SPACE_OP_AVAILABLE');
      expect(res.body.cell.hygiene.code).toBe('HYG_DIRTY');
      expect(res.body.cell.v2Code).toBe('H');
      const orden = await ordenAbierta(id);
      expect(orden).toMatchObject({
        id: res.body.cleaningOrderId,
        type_code: 'practice:CLEAN_ROUTINE',
        status_code: 'practice:CLN_PENDING',
      });
      const [fin] = await outbox('practice.care_space.block_ended', blockId);
      expect(fin.payload_json.cleaningOrderId).toBe(res.body.cleaningOrderId);
      const [ev] = await filas(
        'select ended_by_user_id, end_note from practice.care_space_blocks where id = ?',
        [blockId],
      );
      expect(ev).toMatchObject({
        ended_by_user_id: maint.userId,
        end_note: 'Revisión terminada',
      });
    });

    it('terminar de nuevo responde 409 BLOCK_ALREADY_ENDED', async () => {
      const res = await http()
        .post(`/care-space-blocks/${blockId}/end`)
        .set(como(maint))
        .send({});
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('BLOCK_ALREADY_ENDED');
    });

    it('GET /care-spaces/:id/blocks lista el bloqueo terminado solo con includeEnded', async () => {
      const id = ids['CAMA-401-A'];
      const abiertos = await http()
        .get(`/care-spaces/${id}/blocks`)
        .set(como(nurse))
        .expect(200);
      expect(abiertos.body).toHaveLength(0);
      const todos = await http()
        .get(`/care-spaces/${id}/blocks?includeEnded=true`)
        .set(como(nurse))
        .expect(200);
      expect(todos.body).toHaveLength(1);
      expect(todos.body[0]).toMatchObject({ id: blockId, applied: false });
      expect(todos.body[0].endedAt).toBeTruthy();
      await http()
        .get(`/care-spaces/${id}/blocks`)
        .set(como(outsider))
        .expect(404);
    });

    it('cancelar un bloqueo programado exige motivo; cancelado, no queda aplicado ni deja limpieza', async () => {
      const id = ids['CAMA-401-D'];
      const creado = await disponibilidad(owner(), id, {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
        startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      });
      expect(creado.status).toBe(200);
      expect(creado.body.cell.availability.code).toBe('SPACE_OP_AVAILABLE');
      const bid = creado.body.blockId;
      const vista = await http()
        .get(`/care-spaces/${id}/blocks`)
        .set(como(owner()))
        .expect(200);
      expect(vista.body[0]).toMatchObject({ id: bid, applied: false });
      await http()
        .post(`/care-space-blocks/${bid}/cancel`)
        .set(como(owner()))
        .send({ reason: '  ' })
        .expect(422);
      const res = await http()
        .post(`/care-space-blocks/${bid}/cancel`)
        .set(como(owner()))
        .send({ reason: 'Ya no hace falta' })
        .expect(200);
      expect(res.body.block.cancelReason).toBe('Ya no hace falta');
      expect(await ordenAbierta(id)).toBeUndefined();
      expect(
        (await outbox('practice.care_space.block_cancelled', bid)).length,
      ).toBe(1);
      const otra = await http()
        .post(`/care-space-blocks/${bid}/cancel`)
        .set(como(owner()))
        .send({ reason: 'otra vez' });
      expect(otra.status).toBe(409);
    });
  });

  // ------------------------------------------------------- 3: compromisos futuros
  describe('quirófano con compromisos futuros', () => {
    it('3: 409 FUTURE_COMMITMENTS_CONFLICT con el caso y su nextAction; con acknowledgeConflicts es 200 y el caso sigue listado', async () => {
      const qx = ids['QX-1'];
      const caso = randomUUID();
      const inicio = new Date(Date.now() + 86_400_000);
      await filas(
        `insert into procedures_perioperative.procedure_cases
           (id, custodian_tenant_id, patient_profile_id, case_number, case_type_concept_id,
            priority_concept_id, status_concept_id, operating_room_id, practice_site_id,
            scheduled_start_at, scheduled_end_at, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
        [
          caso,
          orgA.tenantId,
          ctx.patientSubtypeId,
          `F2-${sufijo}`,
          CONCEPTS.CASE_TYPE_ELECTIVE,
          CONCEPTS.CASE_PRIORITY_ROUTINE,
          CONCEPTS.CASE_SCHEDULED,
          qx,
          orgA.siteId,
          inicio,
          new Date(inicio.getTime() + 3_600_000),
        ],
      );
      const body = {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_INFRASTRUCTURE',
        expectedEndAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      };
      // el jefe de quirófano puede en quirófanos (función acotada); la enfermería de otra unidad, no ve el espacio
      const conflicto = await disponibilidad(owner(), qx, body);
      expect(conflicto.status).toBe(409);
      expect(conflicto.body.reason).toBe('FUTURE_COMMITMENTS_CONFLICT');
      expect(conflicto.body.details.conflicts).toHaveLength(1);
      expect(conflicto.body.details.conflicts[0]).toMatchObject({
        kind: 'PROCEDURE_CASE',
        id: caso,
      });
      expect(conflicto.body.details.conflicts[0].nextAction).toMatch(
        /Reprogramar/,
      );
      expect(
        (
          await filas(
            'select count(*)::int as n from practice.care_space_blocks where care_space_id = ?',
            [qx],
          )
        )[0].n,
      ).toBe(0);

      const ok = await disponibilidad(orMgr, qx, {
        ...body,
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        acknowledgeConflicts: true,
      });
      expect(ok.status).toBe(200);
      expect(ok.body.conflicts).toHaveLength(1);
      expect(ok.body.conflicts[0].id).toBe(caso);
      expect(ok.body.cell.availability.code).toBe('SPACE_OP_BLOCKED_ADMIN');
      // y se levanta con reopen no: es un bloqueo, no un cierre
      const mal = await disponibilidad(owner(), qx, { action: 'reopen' });
      expect(mal.status).toBe(422);
      expect(mal.body.reason).toBe('AVAILABILITY_ACTION_INVALID');
      await disponibilidad(owner(), qx, { action: 'unblock' }).then((r) =>
        expect(r.status).toBe(200),
      );
    });

    it('el jefe de quirófano solo opera quirófanos: sobre una cama es 403, no 404', async () => {
      const res = await disponibilidad(orMgr, ids['CAMA-401-D'], {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    });

    it('cerrar y reabrir: close exige motivo; reopen termina el cierre', async () => {
      const id = ids['QX-1'];
      const cerrado = await disponibilidad(owner(), id, {
        action: 'close',
        reasonCode: 'BLOCK_RSN_INFRASTRUCTURE',
        acknowledgeConflicts: true,
      });
      expect(cerrado.status).toBe(200);
      expect(cerrado.body.cell.availability.code).toBe('SPACE_OP_CLOSED');
      const reabierto = await disponibilidad(owner(), id, { action: 'reopen' });
      expect(reabierto.status).toBe(200);
      expect(reabierto.body.cell.availability.code).toBe('SPACE_OP_AVAILABLE');
    });
  });

  // ------------------------------------------------------ 4: ciclo de limpieza
  describe('ciclo de limpieza', () => {
    let orderId: string;
    const idB = () => ids['CAMA-401-B'];

    it('Limpieza marca sucia con motivo; sin motivo es 422; el espacio queda H y se abre la orden SPOT', async () => {
      await higiene(cleaner, idB(), { action: 'mark-dirty' }).then((r) => {
        expect(r.status).toBe(422);
        expect(r.body.reason).toBe('HYGIENE_REASON_REQUIRED');
      });
      const res = await higiene(cleaner, idB(), {
        action: 'mark-dirty',
        reasonText: 'Derrame de suero',
      });
      expect(res.status).toBe(200);
      orderId = res.body.cleaningOrderId;
      expect(res.body.cell).toMatchObject({
        v2Code: 'H',
        assignable: false,
        hygiene: { code: 'HYG_DIRTY' },
      });
      const orden = await ordenAbierta(idB());
      expect(orden).toMatchObject({
        id: orderId,
        type_code: 'practice:CLEAN_SPOT',
      });
      expect(
        (await outbox('practice.cleaning_order.created', orderId)).length,
      ).toBe(1);
    });

    it('marcar sucia otra vez es 409 CLEANING_ORDER_ALREADY_OPEN y devuelve la orden abierta', async () => {
      const res = await higiene(nurse, idB(), {
        action: 'mark-dirty',
        reasonText: 'otra',
      });
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('CLEANING_ORDER_ALREADY_OPEN');
      expect(res.body.details.cleaningOrderId).toBe(orderId);
    });

    it('la cola no lleva datos de paciente, pide una limpieza a mano duplicada responde 409 y fuera de alcance 404', async () => {
      const lista = await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(cleaner))
        .expect(200);
      const orden = lista.body.items.find((o: any) => o.id === orderId);
      expect(orden).toMatchObject({
        status: { code: 'CLN_PENDING' },
        type: { code: 'CLEAN_SPOT' },
        careSpace: { code: 'CAMA-401-B' },
      });
      expect(orden.ageMinutes).toBeGreaterThanOrEqual(0);
      expect(JSON.stringify(lista.body)).not.toMatch(/patient|encounter/i);
      expect(lista.body.generatedAt).toBeTruthy();
      const dup = await http()
        .post(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(cleaner))
        .send({
          careSpaceId: idB(),
          typeCode: 'ROUTINE',
          priorityCode: 'ROUTINE',
        });
      expect(dup.status).toBe(409);
      expect(dup.body.reason).toBe('CLEANING_ORDER_ALREADY_OPEN');
      // Mantenimiento no ve la cola (contrato: «—»)
      await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(maint))
        .expect(403);
      await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(outsider))
        .expect(404);
      // enfermería con alcance de espacio ve solo las órdenes de su cama
      const propia = await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(spaceNurse))
        .expect(200);
      expect(propia.body.items.every((o: any) => o.careSpaceId === idB())).toBe(
        true,
      );
      expect(propia.body.items.length).toBeGreaterThanOrEqual(1);
    });

    it('asignar valida al usuario del tenant (otro usuario ajeno: 404) y respeta If-Match', async () => {
      const [orden] = await filas(
        'select row_version from practice.cleaning_orders where id = ?',
        [orderId],
      );
      await http()
        .post(`/cleaning-orders/${orderId}/assign`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .send({ userId: randomUUID() })
        .expect(404);
      const ok = await http()
        .post(`/cleaning-orders/${orderId}/assign`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .send({ userId: cleaner.userId })
        .expect(200);
      expect(ok.body.assignedUserId).toBe(cleaner.userId);
      expect(ok.body.rowVersion).toBe(orden.row_version + 1);
      const vieja = await http()
        .post(`/cleaning-orders/${orderId}/assign`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .send({ userId: null });
      expect(vieja.status).toBe(412);
    });

    it('terminar una orden pendiente es 409 CLEANING_ORDER_INVALID_TRANSITION; dos operarios la toman: gana el primero', async () => {
      const [orden] = await filas(
        'select row_version from practice.cleaning_orders where id = ?',
        [orderId],
      );
      const salto = await http()
        .post(`/cleaning-orders/${orderId}/finish`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .send({});
      expect(salto.status).toBe(409);
      expect(salto.body.reason).toBe('CLEANING_ORDER_INVALID_TRANSITION');
      expect(salto.body.details).toMatchObject({ from: 'CLN_PENDING' });

      const primero = await http()
        .post(`/cleaning-orders/${orderId}/start`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .expect(200);
      expect(primero.body.status.code).toBe('CLN_IN_PROGRESS');
      expect(primero.body.startedByUserId).toBe(cleaner.userId);
      const segundo = await http()
        .post(`/cleaning-orders/${orderId}/start`)
        .set(como(cleaner2))
        .set(ifMatch(orden.row_version));
      expect(segundo.status).toBe(412);
      // y con la versión vigente igual falla por estado
      const otra = await http()
        .post(`/cleaning-orders/${orderId}/start`)
        .set(como(cleaner2))
        .set(ifMatch(primero.body.rowVersion));
      expect(otra.status).toBe(409);
    });

    it('4: terminar → quien limpió no inspecciona → otro usuario inspecciona: DIRTY→CLEANING→CLEAN→INSPECTED, cuatro eventos A20 en orden y la cama queda asignable', async () => {
      const [orden] = await filas(
        'select row_version from practice.cleaning_orders where id = ?',
        [orderId],
      );
      const fin = await http()
        .post(`/cleaning-orders/${orderId}/finish`)
        .set(como(cleaner))
        .set(ifMatch(orden.row_version))
        .send({ note: 'Listo' })
        .expect(200);
      expect(fin.body.finishedByUserId).toBe(cleaner.userId);
      expect(
        await estado(cleaner, idB()).then((r) => r.body.cell.hygiene.code),
      ).toBe('HYG_CLEAN');

      // Limpieza (operario) no inspecciona (no es supervisor): 403
      await http()
        .post(`/cleaning-orders/${orderId}/inspect`)
        .set(como(cleaner2))
        .set(ifMatch(fin.body.rowVersion))
        .send({ result: 'PASS' })
        .expect(403);
      // El rechazo exige motivo
      const sinMotivo = await http()
        .post(`/cleaning-orders/${orderId}/inspect`)
        .set(como(nurseSup))
        .set(ifMatch(fin.body.rowVersion))
        .send({ result: 'FAIL' });
      expect(sinMotivo.status).toBe(422);
      expect(sinMotivo.body.reason).toBe('INSPECTION_REASON_REQUIRED');

      const ok = await http()
        .post(`/cleaning-orders/${orderId}/inspect`)
        .set(como(nurseSup))
        .set(ifMatch(fin.body.rowVersion))
        .send({ result: 'PASS' })
        .expect(200);
      expect(ok.body.status.code).toBe('CLN_INSPECTED');
      expect(ok.body.inspectedByUserId).toBe(nurseSup.userId);

      const ev = await evento(idB(), 'AXIS_HYGIENE');
      expect(ev).toHaveLength(4);
      const destinos = await filas(
        `select c.code from practice.care_space_status_events e
           join terminology.catalog_concepts c on c.id = e.to_concept_id
          where e.care_space_id = ? and e.axis_concept_id = (
            select id from terminology.catalog_concepts where code = 'practice:AXIS_HYGIENE')
          order by e.occurred_at, e.created_at`,
        [idB()],
      );
      expect(destinos.map((d: any) => d.code)).toEqual([
        'practice:HYG_DIRTY',
        'practice:HYG_CLEANING',
        'practice:HYG_CLEAN',
        'practice:HYG_INSPECTED',
      ]);
      const celda = (await estado(nurse, idB()).expect(200)).body.cell;
      expect(celda).toMatchObject({
        hygiene: { code: 'HYG_INSPECTED' },
        v2Code: 'U',
        assignable: true,
        openCleaningOrderId: null,
      });
      // historial A20 paginado, del más reciente al más viejo
      const pagina1 = await http()
        .get(`/care-spaces/${idB()}/status-events?limit=2`)
        .set(como(nurse))
        .expect(200);
      expect(pagina1.body.items).toHaveLength(2);
      expect(pagina1.body.items[0].to.code).toBe('HYG_INSPECTED');
      expect(pagina1.body.nextCursor).toBeTruthy();
      const pagina2 = await http()
        .get(
          `/care-spaces/${idB()}/status-events?limit=2&cursor=${pagina1.body.nextCursor}&axis=HYGIENE`,
        )
        .set(como(nurse))
        .expect(200);
      expect(pagina2.body.items.map((e: any) => e.to.code)).toEqual([
        'HYG_CLEANING',
        'HYG_DIRTY',
      ]);
      await http()
        .get(`/care-spaces/${idB()}/status-events?axis=NADA`)
        .set(como(nurse))
        .expect(422);
    });

    it('el mismo usuario que terminó no puede inspeccionar (422 INSPECTION_BY_CLEANER_NOT_ALLOWED) y la base lo respalda', async () => {
      const id = ids['CAMA-401-E'];
      const sucia = await higiene(nurse, id, {
        action: 'mark-dirty',
        reasonText: 'Cambio de ropa',
      }).then((r) => r.body.cleaningOrderId);
      const v = async () =>
        (
          await filas(
            'select row_version from practice.cleaning_orders where id = ?',
            [sucia],
          )
        )[0].row_version;
      await http()
        .post(`/cleaning-orders/${sucia}/start`)
        .set(como(cleanerSup))
        .set(ifMatch(await v()))
        .expect(200);
      await http()
        .post(`/cleaning-orders/${sucia}/finish`)
        .set(como(cleanerSup))
        .set(ifMatch(await v()))
        .send({})
        .expect(200);
      const propio = await http()
        .post(`/cleaning-orders/${sucia}/inspect`)
        .set(como(cleanerSup))
        .set(ifMatch(await v()))
        .send({ result: 'PASS' });
      expect(propio.status).toBe(422);
      expect(propio.body.reason).toBe('INSPECTION_BY_CLEANER_NOT_ALLOWED');
      // red de seguridad en la base
      await expect(
        filas(
          `update practice.cleaning_orders set inspected_by_user_id = finished_by_user_id where id = ?`,
          [sucia],
        ),
      ).rejects.toThrow(/ck_cleaning_orders_inspector_differs/);

      // FAIL por otro usuario: orden REJECTED + nueva PENDING con la anterior enlazada y la cama sucia
      const fail = await http()
        .post(`/cleaning-orders/${sucia}/inspect`)
        .set(como(nurse))
        .set(ifMatch(await v()))
        .send({ result: 'FAIL', reasonText: 'Quedó polvo' })
        .expect(200);
      expect(fail.body.status.code).toBe('CLN_REJECTED');
      const nueva = await ordenAbierta(id);
      expect(nueva).toMatchObject({
        previous_order_id: sucia,
        status_code: 'practice:CLN_PENDING',
      });
      expect(nueva.id).not.toBe(sucia);
      expect((await estado(nurse, id)).body.cell.hygiene.code).toBe(
        'HYG_DIRTY',
      );
      expect(
        (await outbox('practice.cleaning_order.rejected', sucia)).length,
      ).toBe(1);

      // cancelar exige motivo; cancelada, la cama sigue sucia sin orden
      await http()
        .post(`/cleaning-orders/${nueva.id}/cancel`)
        .set(como(nurse))
        .set(ifMatch(nueva.row_version))
        .send({ reason: ' ' })
        .expect(422);
      const cancelada = await http()
        .post(`/cleaning-orders/${nueva.id}/cancel`)
        .set(como(nurse))
        .set(ifMatch(nueva.row_version))
        .send({ reason: 'Se pidió por error' })
        .expect(200);
      expect(cancelada.body.status.code).toBe('CLN_CANCELLED');
    });

    it('una limpieza manual sobre una cama con bandera terminal solo puede ser terminal (422 TERMINAL_CLEANING_REQUIRED)', async () => {
      const id = ids['CAMA-401-F'];
      const contaminada = await higiene(nurse, id, {
        action: 'mark-contaminated',
        reasonText: 'Sangre',
      });
      expect(contaminada.status).toBe(200);
      expect(contaminada.body.cell).toMatchObject({
        v2Code: 'K',
        hygiene: { code: 'HYG_CONTAMINATED', terminalRequired: true },
      });
      // Limpieza no marca contaminada (solo sucia)
      await higiene(cleaner, ids['CAMA-401-D'], {
        action: 'mark-contaminated',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(403));
      await ordenAbierta(id).then((o) =>
        expect(o).toMatchObject({ type_code: 'practice:CLEAN_TERMINAL' }),
      );
      // Cancelar la terminal para probar la regla de creación manual con la bandera activa
      const abierta = await ordenAbierta(id);
      await http()
        .post(`/cleaning-orders/${abierta.id}/cancel`)
        .set(como(nurse))
        .set(ifMatch(abierta.row_version))
        .send({ reason: 'Prueba de regla' })
        .expect(200);
      const res = await http()
        .post(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(nurse))
        .send({
          careSpaceId: id,
          typeCode: 'ROUTINE',
          priorityCode: 'ROUTINE',
        });
      expect(res.status).toBe(422);
      expect(res.body.reason).toBe('TERMINAL_CLEANING_REQUIRED');
      const terminal = await http()
        .post(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(como(nurse))
        .send({ careSpaceId: id, typeCode: 'TERMINAL', priorityCode: 'STAT' })
        .expect(201);
      expect(terminal.body.type.code).toBe('CLEAN_TERMINAL');
      expect(terminal.body.priority.code).toBe('CLN_PRIO_STAT');
    });
  });

  // ---------------------------------------------- hallazgo 1: inspección terminal
  describe('la limpieza terminal solo la libera un supervisor y solo si la orden es terminal', () => {
    const id = () => ids['CAMA-401-F'];
    const orden = async () => ordenAbierta(id());
    const v = async (oid: string) =>
      (
        await filas(
          'select row_version from practice.cleaning_orders where id = ?',
          [oid],
        )
      )[0].row_version;

    it('una orden rutinaria con la bandera activa no se aprueba y no apaga la bandera', async () => {
      // Se fuerza el estado a nivel de datos: orden DONE rutinaria + bandera activa (lo que
      // dejaría una carrera o un dato anterior); la API no debe liberar la cama.
      const o = await orden();
      await filas(
        `update practice.cleaning_orders set cleaning_type_concept_id =
           (select id from terminology.catalog_concepts where code = 'practice:CLEAN_ROUTINE'),
           status_concept_id = (select id from terminology.catalog_concepts where code = 'practice:CLN_DONE'),
           finished_by_user_id = ?, finished_at = now() where id = ?`,
        [cleaner.userId, o.id],
      );
      const flag = await filas(
        'select terminal_cleaning_required from practice.care_spaces where id = ?',
        [id()],
      );
      expect(flag[0].terminal_cleaning_required).toBe(true);

      // Una enfermera sin supervisión: 403 por la bandera (acto de supervisor)
      const sinPermiso = await http()
        .post(`/cleaning-orders/${o.id}/inspect`)
        .set(como(nurse))
        .set(ifMatch(await v(o.id)))
        .send({ result: 'PASS' });
      expect(sinPermiso.status).toBe(403);
      expect(sinPermiso.body.reason).toBe(
        'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
      );
      // Un supervisor tampoco la libera: la orden no es terminal
      const supervisor = await http()
        .post(`/cleaning-orders/${o.id}/inspect`)
        .set(como(nurseSup))
        .set(ifMatch(await v(o.id)))
        .send({ result: 'PASS' });
      expect(supervisor.status).toBe(422);
      expect(supervisor.body.reason).toBe('TERMINAL_CLEANING_REQUIRED');
      const despues = (await estado(nurseSup, id()).expect(200)).body.cell;
      expect(despues.hygiene.terminalRequired).toBe(true);
      expect(despues.assignable).toBe(false);
      expect(
        (
          await filas(
            'select terminal_cleaning_required from practice.care_spaces where id = ?',
            [id()],
          )
        )[0].terminal_cleaning_required,
      ).toBe(true);
    });

    it('la orden terminal: sin permiso 403, con supervisor sí; la bandera se apaga solo entonces', async () => {
      const o = await orden();
      // volvemos a dejarla terminal y hecha por otro usuario
      await filas(
        `update practice.cleaning_orders set cleaning_type_concept_id =
           (select id from terminology.catalog_concepts where code = 'practice:CLEAN_TERMINAL') where id = ?`,
        [o.id],
      );
      const bloqueado = await http()
        .post(`/cleaning-orders/${o.id}/inspect`)
        .set(como(nurse))
        .set(ifMatch(await v(o.id)))
        .send({ result: 'PASS' });
      expect(bloqueado.status).toBe(403);
      expect(bloqueado.body.reason).toBe(
        'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
      );
      expect(bloqueado.body.details.requiredRoles).toEqual(
        expect.arrayContaining(['NURSE_SUPERVISOR', 'HOUSEKEEPING_SUPERVISOR']),
      );
      // quien terminó (cleaner) tampoco, aunque fuese supervisor: usamos al supervisor de limpieza como finisher
      await filas(
        'update practice.cleaning_orders set finished_by_user_id = ? where id = ?',
        [cleanerSup.userId, o.id],
      );
      const propio = await http()
        .post(`/cleaning-orders/${o.id}/inspect`)
        .set(como(cleanerSup))
        .set(ifMatch(await v(o.id)))
        .send({ result: 'PASS' });
      expect(propio.status).toBe(422);
      expect(propio.body.reason).toBe('INSPECTION_BY_CLEANER_NOT_ALLOWED');
      const ok = await http()
        .post(`/cleaning-orders/${o.id}/inspect`)
        .set(como(nurseSup))
        .set(ifMatch(await v(o.id)))
        .send({ result: 'PASS' });
      expect(ok.status).toBe(200);
      const celda = (await estado(nurseSup, id()).expect(200)).body.cell;
      expect(celda).toMatchObject({
        hygiene: { code: 'HYG_INSPECTED', terminalRequired: false },
        assignable: true,
        v2Code: 'U',
      });
    });
  });

  // ---------------------------------------------------------- 5: aislamiento
  describe('aislamiento', () => {
    it('5: aéreo en una habitación sin AIIR validado es 422 ISOLATION_ROOM_NOT_CAPABLE con details.missing y no cambia nada', async () => {
      const id = ids['CAMA-301-A'];
      const antes = await opsVersion(id);
      const res = await aislamiento(nurse, id, {
        isolationCode: 'ISO_AIRBORNE',
        reasonText: 'Tuberculosis pulmonar',
      });
      expect(res.status).toBe(422);
      expect(res.body.reason).toBe('ISOLATION_ROOM_NOT_CAPABLE');
      expect(res.body.details.missing).toEqual(
        expect.arrayContaining([
          'AIIR',
          'NEGATIVE_PRESSURE',
          'HVAC_VALIDATION',
        ]),
      );
      expect(await opsVersion(id)).toBe(antes);
      expect(await evento(id, 'AXIS_ISOLATION')).toHaveLength(0);
    });

    it('un AIIR con la validación HVAC vencida solo falla por HVAC_VALIDATION; con validación vigente se aísla', async () => {
      const vencida = await aislamiento(nurse, ids['CAMA-AIIR-2'], {
        isolationCode: 'ISO_AIRBORNE',
        reasonText: 'Tuberculosis',
      });
      expect(vencida.status).toBe(422);
      expect(vencida.body.details.missing).toEqual(['HVAC_VALIDATION']);
      const ok = await aislamiento(nurse, ids['CAMA-AIIR-1'], {
        isolationCode: 'ISO_AIRBORNE',
        reasonText: 'Tuberculosis',
        organismText: 'M. tuberculosis',
      });
      expect(ok.status).toBe(200);
      expect(ok.body.cell).toMatchObject({
        v2Code: 'I',
        isolation: { code: 'ISO_AIRBORNE' },
      });
      expect(ok.body.cell.isolation.organism).toBe('M. tuberculosis');
    });

    it('aislar exige el motivo clínico y un código válido; Limpieza no aísla; fuera de alcance 404', async () => {
      const id = ids['CAMA-302-A'];
      await aislamiento(nurse, id, { isolationCode: 'ISO_CONTACT' }).then(
        (r) => {
          expect(r.status).toBe(422);
          expect(r.body.reason).toBe('ISOLATION_REASON_REQUIRED');
        },
      );
      await aislamiento(nurse, id, {
        isolationCode: 'NADA',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(422));
      await aislamiento(cleaner, id, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(403));
      await aislamiento(outsider, id, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(404));
    });

    it('en una habitación compartida las camas hermanas libres quedan bloqueadas por cohorte', async () => {
      const a = ids['CAMA-301-A'];
      const b = ids['CAMA-301-B'];
      const res = await aislamiento(nurse, a, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'MRSA',
        organismText: 'MRSA',
      });
      expect(res.status).toBe(200);
      expect(res.body.cell.v2Code).toBe('I');
      expect(res.body.companionBlocks).toHaveLength(1);
      expect(res.body.companionBlocks[0].careSpaceId).toBe(b);
      const hermana = (await estado(nurse, b).expect(200)).body;
      expect(hermana.cell.availability).toMatchObject({
        code: 'SPACE_OP_BLOCKED_CLINICAL',
        reasonCode: 'BLOCK_RSN_ISOLATION_COHORT',
      });
      expect(hermana.cell.v2Code).toBe('C');
      // A20 por cada cama afectada
      expect(await evento(a, 'AXIS_ISOLATION')).toHaveLength(1);
      expect(await evento(b, 'AXIS_AVAILABILITY')).toHaveLength(1);
    });

    it('cohorte avalada: sin el rol de control de infecciones es 403; con él, las hermanas quedan libres', async () => {
      const a = ids['CAMA-302-A'];
      const b = ids['CAMA-302-B'];
      const sinAval = await aislamiento(nurse, a, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'VRE',
        organismText: 'VRE',
        cohortApproved: true,
      });
      expect(sinAval.status).toBe(403);
      expect(sinAval.body.reason).toBe('ISOLATION_COHORT_REQUIRES_APPROVAL');
      const sinOrganismo = await aislamiento(infection, a, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'VRE',
        cohortApproved: true,
      });
      expect(sinOrganismo.status).toBe(422);
      expect(sinOrganismo.body.reason).toBe('ISOLATION_ORGANISM_REQUIRED');
      const ok = await aislamiento(infection, a, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'VRE',
        organismText: 'VRE',
        cohortApproved: true,
      });
      expect(ok.status).toBe(200);
      expect(ok.body.companionBlocks).toHaveLength(0);
      expect(
        (await estado(nurse, b).expect(200)).body.cell.availability.code,
      ).toBe('SPACE_OP_AVAILABLE');
    });

    it('al levantar el aislamiento: orden TERMINAL, bandera, cama no asignable hasta la inspección del supervisor, y se liberan los bloqueos de cohorte', async () => {
      const a = ids['CAMA-301-A'];
      const b = ids['CAMA-301-B'];
      const res = await aislamiento(nurse, a, { isolationCode: 'ISO_NONE' });
      expect(res.status).toBe(200);
      expect(res.body.cell).toMatchObject({
        assignable: false,
        hygiene: { terminalRequired: true, code: 'HYG_DIRTY' },
        isolation: { code: 'ISO_NONE' },
      });
      expect(res.body.companionBlocks).toEqual([
        expect.objectContaining({ careSpaceId: b }),
      ]);
      expect(
        (await estado(nurse, b).expect(200)).body.cell.availability.code,
      ).toBe('SPACE_OP_AVAILABLE');
      const orden = await ordenAbierta(a);
      expect(orden.type_code).toBe('practice:CLEAN_TERMINAL');

      const v = async () =>
        (
          await filas(
            'select row_version from practice.cleaning_orders where id = ?',
            [orden.id],
          )
        )[0].row_version;
      await http()
        .post(`/cleaning-orders/${orden.id}/start`)
        .set(como(cleaner))
        .set(ifMatch(await v()))
        .expect(200);
      await http()
        .post(`/cleaning-orders/${orden.id}/finish`)
        .set(como(cleaner))
        .set(ifMatch(await v()))
        .send({})
        .expect(200);
      expect((await estado(nurse, a)).body.cell.assignable).toBe(false);
      // enfermería sin supervisión no libera una terminal
      const noSup = await http()
        .post(`/cleaning-orders/${orden.id}/inspect`)
        .set(como(nurse))
        .set(ifMatch(await v()))
        .send({ result: 'PASS' });
      expect(noSup.status).toBe(403);
      expect(noSup.body.reason).toBe('TERMINAL_INSPECTION_REQUIRES_SUPERVISOR');
      await http()
        .post(`/cleaning-orders/${orden.id}/inspect`)
        .set(como(nurseSup))
        .set(ifMatch(await v()))
        .send({ result: 'PASS' })
        .expect(200);
      expect((await estado(nurse, a)).body.cell).toMatchObject({
        assignable: true,
        v2Code: 'U',
        hygiene: { terminalRequired: false },
      });
    });
  });

  // -------------------------------------- 6 y hallazgo 2: visibilidad por rol
  describe('visibilidad: paciente y texto clínico solo para roles clínicos', () => {
    const ocupada = () => ids['CAMA-401-C'];
    const reservada = () => ids['CAMA-302-B'];
    const aislada = () => ids['CAMA-AIIR-1'];

    const ubicacion = async (spaceId: string, estadoLoc: string) => {
      const enc = randomUUID();
      await filas(
        `insert into clinical.encounters (id, patient_profile_id, tenant_id, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, now(), now())`,
        [enc, ctx.patientSubtypeId, orgA.tenantId, CLIN.ENCOUNTER_IN_PROGRESS],
      );
      await filas(
        `insert into clinical.encounter_locations
           (id, encounter_id, practice_site_id, care_space_id, location_status_concept_id,
            period_start, is_bed_assignment, tenant_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, now() - interval '1 hour', true, ?, now(), now())`,
        [randomUUID(), enc, orgA.siteId, spaceId, estadoLoc, orgA.tenantId],
      );
      return enc;
    };
    let encuentro: string;

    beforeAll(async () => {
      await filas(
        `update profiles.persons set name = 'Ana', last_name = 'Quispe',
                birth_date = (current_date - interval '40 years')::date,
                administrative_gender_concept_id = ? where id = ?`,
        [PROF.GENDER_FEMALE, ctx.patientSubtypeId],
      );
      encuentro = await ubicacion(ocupada(), CLIN.LOCATION_ACTIVE);
      await ubicacion(reservada(), CLIN.LOCATION_RESERVED);
    });

    const celdas = (res: request.Response) =>
      res.body.units.flatMap((u: any) => u.cells);
    const tablero = (a: Actor, q = '') =>
      http().get(`/sites/${orgA.siteId}/bed-board${q}`).set(como(a));

    it('la ocupación se deriva de encounter_locations: O ocupada y R reservada; Enfermería de la unidad ve al paciente y el organismo', async () => {
      const res = await tablero(nurse).expect(200);
      expect(res.headers['x-data-as-of']).toBeTruthy();
      expect(res.body.generatedAt).toBeTruthy();
      expect(
        new Date(res.headers['x-data-as-of']).getTime(),
      ).toBeLessThanOrEqual(Date.now() + 1000);
      const o = celdas(res).find((c: any) => c.id === ocupada());
      expect(o).toMatchObject({
        v2Code: 'O',
        occupancy: { code: 'OCC_OCCUPIED' },
      });
      expect(o.occupancy.encounterId).toBe(encuentro);
      expect(o.occupancy.patient).toMatchObject({
        sexCode: expect.any(String),
      });
      expect(o.occupancy.patient).toEqual({
        initials: 'AQ',
        sexCode: 'F',
        ageYears: 40,
      });
      const r = celdas(res).find((c: any) => c.id === reservada());
      expect(r).toMatchObject({
        v2Code: 'R',
        occupancy: { code: 'OCC_RESERVED' },
      });
      // la cama aislada tiene organismo; la enfermería (alcance de unidad MED) la ve
      const i = celdas(res).find((c: any) => c.id === aislada());
      expect(i.isolation).toMatchObject({
        code: 'ISO_AIRBORNE',
        organism: 'M. tuberculosis',
      });
      // y no ve los espacios de otra unidad
      expect(celdas(res).some((c: any) => c.id === ids['QX-1'])).toBe(false);
      // recuentos derivados por unidad
      const med = res.body.units.find(
        (u: any) => u.name === 'Medicina Interna',
      );
      expect(med.counts.occupied).toBe(1);
      expect(med.counts.reserved).toBe(1);
      expect(med.counts.total).toBe(med.cells.length);
    });

    it('6: Limpieza, Mantenimiento y las administraciones leen el tablero sin paciente ni organismo; conservan el tipo de aislamiento', async () => {
      for (const quien of [cleaner, maint, owner(), platform()]) {
        const res = await tablero(quien).expect(200);
        const texto = JSON.stringify(res.body);
        expect(texto).not.toMatch(/"patient"/);
        expect(texto).not.toMatch(/"encounterId"/);
        expect(texto).not.toContain('M. tuberculosis');
        expect(texto).not.toContain('MRSA');
        expect(texto).not.toContain('VRE');
        const i = celdas(res).find((c: any) => c.id === aislada());
        expect(i.isolation.code).toBe('ISO_AIRBORNE');
        expect(i.isolation.organism).toBeNull();
        expect(i.isolation.since).toBeTruthy();
        expect(celdas(res).find((c: any) => c.id === ocupada()).v2Code).toBe(
          'O',
        );
      }
    });

    it('la ficha operativa, los bloqueos y el historial A20 tampoco filtran el organismo ni el motivo clínico', async () => {
      const id = aislada();
      const clinico = await http()
        .get(`/care-spaces/${id}/status-events?axis=ISOLATION`)
        .set(como(nurse))
        .expect(200);
      expect(clinico.body.items[0].reasonText).toBe('Tuberculosis');
      for (const quien of [cleaner, maint, owner()]) {
        const ficha = await estado(quien, id).expect(200);
        expect(JSON.stringify(ficha.body)).not.toContain('M. tuberculosis');
        expect(ficha.body.cell.isolation.organism).toBeNull();
        const ev = await http()
          .get(`/care-spaces/${id}/status-events?axis=ISOLATION`)
          .set(como(quien))
          .expect(200);
        expect(ev.body.items.length).toBeGreaterThan(0);
        expect(ev.body.items[0].to.code).toBe('ISO_AIRBORNE');
        expect(ev.body.items[0].reasonText).toBeNull();
      }
      // el control de infecciones y Admisión sí ven el organismo
      for (const quien of [infection, admission]) {
        const ficha = await estado(quien, id);
        if (quien === admission) {
          // Admisión (alcance de unidad MED) cubre la cama
          expect(ficha.status).toBe(200);
        }
        expect(ficha.body.cell.isolation.organism).toBe('M. tuberculosis');
      }
    });

    it('el outbox y la historia genérica no llevan el organismo ni el texto clínico', async () => {
      const id = aislada();
      const eventos = await filas(
        `select payload_json::text as p from messaging.domain_events
          where aggregate_id = ? or payload_json->>'careSpaceId' = ?`,
        [id, id],
      );
      expect(eventos.length).toBeGreaterThan(0);
      for (const e of eventos) {
        expect(e.p).not.toContain('M. tuberculosis');
        expect(e.p).not.toContain('Tuberculosis');
      }
      const aislamiento = await outbox(
        'practice.care_space.status_changed',
        id,
      );
      const iso = aislamiento.find(
        (e: any) => e.payload_json.axis === 'AXIS_ISOLATION',
      );
      expect(iso.payload_json.to).toBe('ISO_AIRBORNE');
      expect(iso.payload_json.reasonText).toBeNull();
      const hist = await filas(
        `select data_snapshot::text as s from audit.care_spaces_history where care_space_id = ?`,
        [id],
      );
      expect(hist.length).toBeGreaterThan(0);
      for (const h of hist) expect(h.s).not.toContain('M. tuberculosis');
      // la fila sí lo guarda (lo usa la regla de cohorte de F3)
      expect(
        (
          await filas(
            'select isolation_organism_text from practice.care_spaces where id = ?',
            [id],
          )
        )[0].isolation_organism_text,
      ).toBe('M. tuberculosis');
    });

    it('no se bloquea ni se cierra una cama ocupada o reservada (409 SPACE_OCCUPIED)', async () => {
      for (const id of [ocupada(), reservada()]) {
        const res = await disponibilidad(owner(), id, {
          action: 'block',
          kindCode: 'BLOCK_ADMIN',
          reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
        });
        expect(res.status).toBe(409);
        expect(res.body.reason).toBe('SPACE_OCCUPIED');
      }
    });

    it('filtros del tablero: v2Codes, functionCodes y un código inválido (422)', async () => {
      const soloO = await tablero(nurse, '?v2Codes=O').expect(200);
      expect(celdas(soloO).every((c: any) => c.v2Code === 'O')).toBe(true);
      expect(celdas(soloO)).toHaveLength(1);
      const camas = await tablero(
        nurse,
        '?functionCodes=SPACE_FN_BED_STANDARD&limit=3',
      ).expect(200);
      expect(celdas(camas)).toHaveLength(3);
      expect(camas.body.nextCursor).toBeTruthy();
      const sig = await tablero(
        nurse,
        `?functionCodes=SPACE_FN_BED_STANDARD&limit=3&cursor=${camas.body.nextCursor}`,
      ).expect(200);
      expect(celdas(sig).length).toBeGreaterThan(0);
      expect(
        celdas(sig).some((c: any) =>
          celdas(camas).some((d: any) => d.id === c.id),
        ),
      ).toBe(false);
      await tablero(nurse, '?v2Codes=Z').expect(422);
    });

    it('el tablero es fail-closed: sin rol que cubra la sede 404; otro tenant 404 idéntico a un id inexistente; Facturación-equivalente (sin rol) tampoco', async () => {
      await tablero(outsider).expect(404);
      await es404Uniforme(
        (id) => http().get(`/sites/${id}/bed-board`).set(como(ownerB())),
        orgA.siteId,
      );
    });
  });

  // ----------------------------------------------------- versiones y estructura
  describe('ops_version y row_version son independientes', () => {
    it('una edición de estructura con If-Match viejo de row_version sigue valiendo tras una operación de camas (y al revés)', async () => {
      const id = ids['CAMA-401-D'];
      const detalle = (
        await http().get(`/care-spaces/${id}`).set(como(orgA)).expect(200)
      ).body;
      const opsAntes = await opsVersion(id);
      // operación de camas: marcar sucia
      await higiene(nurse, id, {
        action: 'mark-dirty',
        reasonText: 'Prueba de versiones',
      }).then((r) => expect(r.status).toBe(200));
      expect(await opsVersion(id)).toBe(opsAntes + 1);
      expect(await rowVersion(id)).toBe(detalle.rowVersion);
      // la edición de estructura con la rowVersion anterior todavía es válida
      const edit = await http()
        .patch(`/care-spaces/${id}`)
        .set(como(orgA))
        .set(ifMatch(detalle.rowVersion))
        .send({ name: 'Cama 401-D renombrada' });
      expect(edit.status).toBe(200);
      // y la edición de estructura no mueve la versión operativa
      expect(await opsVersion(id)).toBe(opsAntes + 1);
    });
  });

  // ---------------------------------------------------- 8: A20 append-only
  describe('el evento A20 es append-only', () => {
    it('8: UPDATE y DELETE sobre care_space_status_events fallan en la base', async () => {
      const [fila] = await filas(
        'select id from practice.care_space_status_events limit 1',
      );
      expect(fila).toBeDefined();
      await expect(
        filas(
          "update practice.care_space_status_events set request_id = 'x' where id = ?",
          [fila.id],
        ),
      ).rejects.toThrow(/append-only/);
      await expect(
        filas('delete from practice.care_space_status_events where id = ?', [
          fila.id,
        ]),
      ).rejects.toThrow(/append-only/);
    });
  });

  // ----------------------------------------------------------- 7: 404 cruzado
  describe('404 cruzado por tenant en todas las rutas con :id', () => {
    it('desde B, cada ruta con un id de A responde el mismo 404 que un id inexistente, sin datos', async () => {
      const espacioA = ids['CAMA-401-B'];
      const [orden] = await filas(
        'select id, row_version from practice.cleaning_orders where care_space_id = ? limit 1',
        [espacioA],
      );
      const [bloque] = await filas(
        'select id from practice.care_space_blocks where tenant_id = ? limit 1',
        [orgA.tenantId],
      );
      const b = ownerB();
      const con = (v: number) => ({ ...ops(v), ...ifMatch(v) });
      const rutas: [string, (id: string) => request.Test, string][] = [
        ['estado', (id) => estado(b, id), espacioA],
        [
          'bloqueos',
          (id) => http().get(`/care-spaces/${id}/blocks`).set(como(b)),
          espacioA,
        ],
        [
          'eventos',
          (id) => http().get(`/care-spaces/${id}/status-events`).set(como(b)),
          espacioA,
        ],
        [
          'availability',
          (id) =>
            http()
              .post(`/care-spaces/${id}/availability`)
              .set(como(b))
              .set(con(1))
              .send({ action: 'unblock' }),
          espacioA,
        ],
        [
          'hygiene',
          (id) =>
            http()
              .post(`/care-spaces/${id}/hygiene`)
              .set(como(b))
              .set(con(1))
              .send({ action: 'mark-dirty', reasonText: 'x' }),
          espacioA,
        ],
        [
          'isolation',
          (id) =>
            http()
              .post(`/care-spaces/${id}/isolation`)
              .set(como(b))
              .set(con(1))
              .send({ isolationCode: 'ISO_NONE' }),
          espacioA,
        ],
        [
          'bloque end',
          (id) =>
            http().post(`/care-space-blocks/${id}/end`).set(como(b)).send({}),
          bloque.id,
        ],
        [
          'bloque cancel',
          (id) =>
            http()
              .post(`/care-space-blocks/${id}/cancel`)
              .set(como(b))
              .send({ reason: 'x' }),
          bloque.id,
        ],
        [
          'cola',
          (id) => http().get(`/sites/${id}/cleaning-orders`).set(como(b)),
          orgA.siteId,
        ],
        [
          'crear orden',
          (id) =>
            http().post(`/sites/${id}/cleaning-orders`).set(como(b)).send({
              careSpaceId: espacioA,
              typeCode: 'ROUTINE',
              priorityCode: 'ROUTINE',
            }),
          orgA.siteId,
        ],
        [
          'assign',
          (id) =>
            http()
              .post(`/cleaning-orders/${id}/assign`)
              .set(como(b))
              .set(ifMatch(orden.row_version))
              .send({ userId: null }),
          orden.id,
        ],
        [
          'start',
          (id) =>
            http()
              .post(`/cleaning-orders/${id}/start`)
              .set(como(b))
              .set(ifMatch(1)),
          orden.id,
        ],
        [
          'finish',
          (id) =>
            http()
              .post(`/cleaning-orders/${id}/finish`)
              .set(como(b))
              .set(ifMatch(1))
              .send({}),
          orden.id,
        ],
        [
          'inspect',
          (id) =>
            http()
              .post(`/cleaning-orders/${id}/inspect`)
              .set(como(b))
              .set(ifMatch(1))
              .send({ result: 'PASS' }),
          orden.id,
        ],
        [
          'cancel',
          (id) =>
            http()
              .post(`/cleaning-orders/${id}/cancel`)
              .set(como(b))
              .set(ifMatch(1))
              .send({ reason: 'x' }),
          orden.id,
        ],
      ];
      for (const [nombre, llamar, idAjeno] of rutas) {
        try {
          await es404Uniforme(llamar, idAjeno);
        } catch (error) {
          throw new Error(`${nombre}: ${(error as Error).message}`);
        }
      }
      // y B no pudo cambiar nada de A
      expect((await ordenAbierta(espacioA)).row_version).toBeGreaterThan(0);
    });

    it('con un espacio de A en el cuerpo de una orden de la sede de B también es 404', async () => {
      const sedeB = orgB.siteId;
      await http()
        .post(`/sites/${sedeB}/cleaning-orders`)
        .set(como(ownerB()))
        .send({
          careSpaceId: ids['CAMA-401-B'],
          typeCode: 'ROUTINE',
          priorityCode: 'ROUTINE',
        })
        .expect(404);
    });
  });

  // --------------------------------------------------- administración de sucursal
  describe('administrador de sucursal', () => {
    let sedeB1: string;
    let sedeB2: string;
    let adminB1: Actor;
    let camaB1: string;

    beforeAll(async () => {
      const rama = async (code: string) =>
        (
          await http()
            .post(`/tenants/${orgA.tenantId}/branches`)
            .set(como(orgA))
            .send({ code: `F2-${code}-${sufijo}`, name: `Sucursal ${code}` })
            .expect(201)
        ).body.id;
      const b1 = await rama('BR1');
      const b2 = await rama('BR2');
      const sede = async (code: string, branchId: string) =>
        (
          await http()
            .post(`/practices/${orgA.practiceId}/sites`)
            .set(como(orgA))
            .send({ code: `F2-${code}-${sufijo}`, name: code, branchId })
            .expect(201)
        ).body.id;
      sedeB1 = await sede('SEDE-B1', b1);
      sedeB2 = await sede('SEDE-B2', b2);
      const area = await espacio(
        {
          code: 'AREA-B1',
          name: 'Área B1',
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
        },
        sedeB1,
      );
      camaB1 = (
        await espacio(
          {
            code: 'CAMA-B1',
            name: 'Cama B1',
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
            parentSpaceId: area.id,
            bedCategoryCode: 'BED_CAT_PRIVATE',
            censable: true,
          },
          sedeB1,
        )
      ).id;
      const email = `f2-adminb1-${sufijo}@example.test`;
      const user = await http()
        .post('/iam/users')
        .set(bearer(ctx.adminToken))
        .send({ displayName: 'adminb1', email, password, initialRole: 'USER' })
        .expect(201);
      await http()
        .post(`/tenants/${orgA.tenantId}/memberships`)
        .set(como(orgA))
        .send({
          userId: user.body.id,
          role: 'ADMIN',
          accessScope: 'BRANCH',
          primaryBranchId: b1,
        })
        .expect(201);
      adminB1 = {
        userId: user.body.id,
        tenantId: orgA.tenantId,
        token: (
          await http()
            .post('/iam/auth/login')
            .send({ email, password })
            .expect(200)
        ).body.accessToken,
      };
    });

    it('ve el tablero de su sucursal y puede el bloqueo administrativo, pero no el clínico ni la higiene (separación de funciones)', async () => {
      await http()
        .get(`/sites/${sedeB1}/bed-board`)
        .set(como(adminB1))
        .expect(200);
      const admin = await disponibilidad(adminB1, camaB1, {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      });
      expect(admin.status).toBe(200);
      await disponibilidad(adminB1, camaB1, { action: 'unblock' }).then((r) =>
        expect(r.status).toBe(200),
      );
      const clinico = await disponibilidad(adminB1, camaB1, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
      });
      expect(clinico.status).toBe(403);
      await higiene(adminB1, camaB1, {
        action: 'mark-dirty',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(403));
      await aislamiento(adminB1, camaB1, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'x',
      }).then((r) => expect(r.status).toBe(403));
    });

    it('la sede de otra sucursal y la de la organización sin sucursal responden 404', async () => {
      await http()
        .get(`/sites/${sedeB2}/bed-board`)
        .set(como(adminB1))
        .expect(404);
      await http()
        .get(`/sites/${orgA.siteId}/bed-board`)
        .set(como(adminB1))
        .expect(404);
      await estado(adminB1, ids['CAMA-401-A']).expect(404);
    });
  });

  // ---------------------------------------------------- blocks-tick (SYSTEM)
  describe('blocks-tick', () => {
    const sistema = () =>
      ctx.app
        .get(TokenService)
        .signAccessToken(TEST_ADMIN_ID, 'test-session', ['SYSTEM']);

    it('solo SYSTEM lo ejecuta: un usuario normal recibe 403', async () => {
      await http()
        .post('/internal/practice/blocks-tick')
        .set(como(owner()))
        .expect(403);
      await http().post('/internal/practice/blocks-tick').expect(401);
    });

    it('aplica el bloqueo programado cuando llega su hora (el «aplicado» se deriva del espacio) y avisa una sola vez del vencido', async () => {
      const id = ids['CAMA-401-D'];
      // la cama quedó sucia con una orden abierta (prueba anterior): no estorba al bloqueo
      const inicio = new Date(Date.now() + 2500);
      const creado = await disponibilidad(owner(), id, {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
        startsAt: inicio.toISOString(),
        expectedEndAt: new Date(Date.now() + 86_400_000).toISOString(),
      });
      expect(creado.status).toBe(200);
      const bid = creado.body.blockId;
      expect(creado.body.cell.availability.code).toBe('SPACE_OP_AVAILABLE');
      // todavía no es la hora: el tick no lo aplica
      await http()
        .post('/internal/practice/blocks-tick')
        .set(bearer(sistema()))
        .expect(200);
      expect((await estado(owner(), id)).body.cell.availability.code).toBe(
        'SPACE_OP_AVAILABLE',
      );
      await new Promise((r) => setTimeout(r, 3000));
      const tick = await http()
        .post('/internal/practice/blocks-tick')
        .set(bearer(sistema()))
        .expect(200);
      expect(tick.body.applied).toBeGreaterThanOrEqual(1);
      const ficha = (await estado(owner(), id).expect(200)).body;
      expect(ficha.cell.availability.code).toBe('SPACE_OP_BLOCKED_ADMIN');
      expect(ficha.openBlocks[0]).toMatchObject({ id: bid, applied: true });
      const ev = await filas(
        `select s.code as src, e.recorded_by_user_id
           from practice.care_space_status_events e
           join terminology.catalog_concepts s on s.id = e.source_concept_id
          where e.care_space_id = ? and e.source_ref_id = ?`,
        [id, bid],
      );
      expect(ev).toHaveLength(1);
      expect(ev[0]).toMatchObject({
        src: 'practice:SRC_BLOCK',
        recorded_by_user_id: null,
      });
      expect(
        (await outbox('practice.care_space.block_started', bid)).length,
      ).toBe(1);
      // idempotente: otra pasada no repite nada
      await http()
        .post('/internal/practice/blocks-tick')
        .set(bearer(sistema()))
        .expect(200);
      expect(
        (await evento(id, 'AXIS_AVAILABILITY')).filter(
          (e: any) => e.source_ref_id === bid,
        ),
      ).toHaveLength(1);

      // vencido: la fecha estimada pasó y sigue abierto
      await filas(
        `update practice.care_space_blocks set starts_at = now() - interval '3 hours',
                expected_end_at = now() - interval '1 hour' where id = ?`,
        [bid],
      );
      const t1 = await http()
        .post('/internal/practice/blocks-tick')
        .set(bearer(sistema()))
        .expect(200);
      expect(t1.body.overdue).toBeGreaterThanOrEqual(1);
      await http()
        .post('/internal/practice/blocks-tick')
        .set(bearer(sistema()))
        .expect(200);
      const avisos = await outbox('practice.care_space.block_overdue', bid);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].payload_json.overdueMinutes).toBeGreaterThanOrEqual(59);
      expect(
        (await http().get(`/care-spaces/${id}/blocks`).set(como(owner())))
          .body[0].overdue,
      ).toBe(true);
      await disponibilidad(owner(), id, { action: 'unblock' }).then((r) =>
        expect(r.status).toBe(200),
      );
    });
  });

  // ----------------------------------------------------------- bloqueos de clausura
  describe('clausura (RETIRE_BLOCKER_PROVIDERS)', () => {
    it('F2 registra OPEN_CLEANING_ORDER y OPEN_BLOCK; un espacio con orden o bloqueo abiertos no se clausura', async () => {
      const kinds = ctx.app
        .get(RetireBlockerRegistry)
        .all()
        .map((p) => p.kind);
      expect(kinds).toEqual(
        expect.arrayContaining(['OPEN_CLEANING_ORDER', 'OPEN_BLOCK']),
      );
      const id = ids['CAMA-401-D'];
      // 401-D quedó sucia con orden abierta (prueba de versiones)
      const check = await http()
        .get(`/care-spaces/${id}/retire-check`)
        .set(como(orgA))
        .expect(200);
      const orden = check.body.blockers.find(
        (b: any) => b.kind === 'OPEN_CLEANING_ORDER',
      );
      expect(orden).toMatchObject({ count: 1 });
      expect(orden.nextAction).toBeTruthy();
      const bloqueada = await disponibilidad(owner(), id, {
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      });
      expect(bloqueada.status).toBe(200);
      const otra = await http()
        .get(`/care-spaces/${id}/retire-check`)
        .set(como(orgA))
        .expect(200);
      expect(otra.body.blockers.map((b: any) => b.kind)).toEqual(
        expect.arrayContaining(['OPEN_CLEANING_ORDER', 'OPEN_BLOCK']),
      );
      const retire = await http()
        .post(`/care-spaces/${id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(await rowVersion(id)))
        .send({ action: 'retire', reason: 'Baja' });
      expect(retire.status).toBe(409);
      expect(retire.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      await disponibilidad(owner(), id, { action: 'unblock' });
    });
  });

  // --------------------------------------------------------------------- puerto
  describe('puerto CareSpaceOpsPort (lo que usarán F3 y F4)', () => {
    const port = () => ctx.app.get<CareSpaceOpsPort>(CARE_SPACE_OPS_PORT);
    /** Ejecuta `fn` en una transacción del tenant A, como lo haría F3. */
    const enTx = <T>(fn: (tx: any) => Promise<T>): Promise<T> =>
      runWithTenant(orgA.tenantId, () =>
        ctx.orm.em.fork().transactional((tx) => fn(tx)),
      );

    it('getOperationalState entrega ejes, v2, asignable y la ocupación derivada; otro tenant es 404', async () => {
      const s = await enTx((tx) =>
        port().getOperationalState(tx, ids['CAMA-401-C']),
      );
      expect(s).toMatchObject({
        careSpaceId: ids['CAMA-401-C'],
        occupancy: 'OCC_OCCUPIED',
        v2Code: 'O',
        assignable: false,
        lifecycleActive: true,
      });
      await expect(
        runWithTenant(orgB.tenantId, () =>
          ctx.orm.em
            .fork()
            .transactional((tx) =>
              port().getOperationalState(tx, ids['CAMA-401-C']),
            ),
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('markDirtyFromSource deja sucia y abre la orden en la misma transacción; es idempotente y escala a terminal; si la transacción falla no queda nada', async () => {
      const id = ids['CAMA-302-B'];
      const ref = randomUUID();
      const r1 = await enTx((tx) =>
        port().markDirtyFromSource(tx, id, {
          trigger: 'DISCHARGE',
          sourceRefId: ref,
          terminal: false,
          actor: { id: nurse.userId },
          requestId: 'req-port-1',
        }),
      );
      const o = await ordenAbierta(id);
      expect(o).toMatchObject({
        id: r1.cleaningOrderId,
        type_code: 'practice:CLEAN_DISCHARGE',
        source_ref_id: ref,
      });
      const ev = await evento(id, 'AXIS_HYGIENE');
      expect(ev[ev.length - 1]).toMatchObject({ request_id: 'req-port-1' });
      const r2 = await enTx((tx) =>
        port().markDirtyFromSource(tx, id, {
          trigger: 'CLN_TRG_TRANSFER',
          terminal: true,
          actor: null,
        }),
      );
      expect(r2.cleaningOrderId).toBe(r1.cleaningOrderId);
      expect((await ordenAbierta(id)).type_code).toBe(
        'practice:CLEAN_TERMINAL',
      );
      expect((await estado(nurse, id)).body.cell.hygiene.terminalRequired).toBe(
        true,
      );

      // atomicidad: una transacción que falla después de marcar no deja orden ni evento
      const limpia = ids['CAMA-401-E'];
      const antes = (
        await filas(
          'select count(*)::int as n from practice.cleaning_orders where care_space_id = ?',
          [limpia],
        )
      )[0].n;
      await expect(
        enTx(async (tx) => {
          await port().markDirtyFromSource(tx, limpia, {
            trigger: 'MANUAL',
            terminal: false,
            actor: null,
          });
          throw new Error('el egreso falló');
        }),
      ).rejects.toThrow('el egreso falló');
      expect(
        (
          await filas(
            'select count(*)::int as n from practice.cleaning_orders where care_space_id = ?',
            [limpia],
          )
        )[0].n,
      ).toBe(antes);
    });

    it('recordOccupancyChange deja el evento A20 del eje OCCUPANCY, sube ops_version y publica status_changed', async () => {
      const id = ids['CAMA-302-A'];
      const antes = await opsVersion(id);
      await enTx((tx) =>
        port().recordOccupancyChange(tx, id, {
          from: 'FREE',
          to: 'OCC_OCCUPIED',
          sourceRefId: randomUUID(),
          actor: { userId: admission.userId },
          requestId: 'req-port-2',
        }),
      );
      expect(await opsVersion(id)).toBe(antes + 1);
      const ev = await evento(id, 'AXIS_OCCUPANCY');
      expect(ev).toHaveLength(1);
      expect(ev[0].v2_0116_code).toBe('I'); // la cama sigue aislada: la regla 3 pesa más que ocupada
      const ob = await outbox('practice.care_space.status_changed', id);
      expect(
        ob.some((e: any) => e.payload_json.axis === 'AXIS_OCCUPANCY'),
      ).toBe(true);
      // sin cambio no escribe
      await enTx((tx) =>
        port().recordOccupancyChange(tx, id, {
          from: 'OCC_FREE',
          to: 'OCC_FREE',
        }),
      );
      expect(await evento(id, 'AXIS_OCCUPANCY')).toHaveLength(1);
    });

    it('assertBookable: 422 SPACE_NOT_BOOKABLE con el bloqueo; fuera de la ventana pasa', async () => {
      const id = ids['CAMA-401-A'];
      const fin = new Date(Date.now() + 5 * 86_400_000);
      await disponibilidad(maint, id, {
        action: 'start-maintenance',
        reasonCode: 'BLOCK_RSN_INFRASTRUCTURE',
        expectedEndAt: fin.toISOString(),
        startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      }).then((r) => expect(r.status).toBe(200));
      const dentro = {
        start: new Date(Date.now() + 2 * 86_400_000),
        end: new Date(Date.now() + 2 * 86_400_000 + 3_600_000),
      };
      await expect(
        enTx((tx) => port().assertBookable(tx, id, dentro)),
      ).rejects.toMatchObject({
        status: 422,
        reason: 'SPACE_NOT_BOOKABLE',
      });
      // antes de que empiece el bloqueo programado sí se puede
      const antes = {
        start: new Date(Date.now() + 3_600_000),
        end: new Date(Date.now() + 7_200_000),
      };
      await expect(
        enTx((tx) => port().assertBookable(tx, id, antes)),
      ).resolves.toBeUndefined();
      // espacio de otro ciclo de vida: planificado
      const planificado = (
        await http()
          .post(`/sites/${orgA.siteId}/care-spaces`)
          .set(como(orgA))
          .send({ code: `PLAN-${sufijo}`, name: 'Planificado' })
          .expect(201)
      ).body.id;
      await expect(
        enTx((tx) => port().assertBookable(tx, planificado, antes)),
      ).rejects.toMatchObject({ reason: 'SPACE_NOT_BOOKABLE' });
    });
  });

  // ---------------------------------------------------- configuración infra.*
  describe('higiene inicial y ciclo tras el egreso (practice_settings)', () => {
    const ajuste = async (valor: boolean | null) => {
      await filas(
        `delete from practice.practice_settings where practice_id = ? and setting_key = 'infra.inspection_required'`,
        [orgA.practiceId],
      );
      if (valor === null) return;
      await filas(
        `insert into practice.practice_settings (id, practice_id, setting_key, value_json, created_at, updated_at)
         values (?, ?, 'infra.inspection_required', ?::jsonb, now(), now())`,
        [randomUUID(), orgA.practiceId, JSON.stringify(valor)],
      );
    };
    const orden = async (spaceId: string) => {
      const [o] = await filas(
        `select id, row_version from practice.cleaning_orders
          where care_space_id = ? order by created_at desc limit 1`,
        [spaceId],
      );
      return o;
    };
    const accion = async (
      actor: Actor,
      spaceId: string,
      que: 'start' | 'finish' | 'inspect',
      body: object = {},
    ) => {
      const o = await orden(spaceId);
      return http()
        .post(`/cleaning-orders/${o.id}/${que}`)
        .set(como(actor))
        .set(ifMatch(o.row_version))
        .send(body);
    };
    /** El egreso de F3 marca la cama sucia por el puerto, dentro de su transacción. */
    const egreso = (spaceId: string) =>
      runWithTenant(orgA.tenantId, () =>
        ctx.orm.em.fork().transactional((tx) =>
          ctx.app
            .get<CareSpaceOpsPort>(CARE_SPACE_OPS_PORT)
            .markDirtyFromSource(tx, spaceId, {
              trigger: 'DISCHARGE',
              sourceRefId: randomUUID(),
              terminal: false,
              actor: { id: nurse.userId },
            }),
        ),
      );
    const celda = async (spaceId: string) =>
      (await estado(nurse, spaceId).expect(200)).body.cell;

    afterEach(async () => {
      await ajuste(null);
    });

    it('una cama recién activada nace limpia, inspeccionada y asignable con el ajuste por omisión (inspección obligatoria)', async () => {
      await ajuste(null);
      const nueva = await cama('CAMA-NUEVA-1', ids['HAB-301']);
      const c = await celda(nueva);
      expect(c).toMatchObject({
        lifecycle: { code: 'SPACE_ACTIVE' },
        availability: { code: 'SPACE_OP_AVAILABLE' },
        hygiene: { code: 'HYG_INSPECTED', terminalRequired: false },
        v2Code: 'U',
        assignable: true,
      });
      // y con el ajuste explícito también: la inspección no rige el estado de partida
      await ajuste(true);
      expect((await celda(nueva)).assignable).toBe(true);
      // el alta no es un cambio de estado: ningún evento A20 de higiene
      expect(await evento(nueva, 'AXIS_HYGIENE')).toHaveLength(0);
    });

    it('un espacio planificado no es asignable y al activarse por el ciclo de vida queda asignable', async () => {
      const plan = (
        await http()
          .post(`/sites/${orgA.siteId}/care-spaces`)
          .set(como(orgA))
          .send({
            code: `CAMA-PLAN-${sufijo}`,
            name: 'Cama planificada',
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
            parentSpaceId: ids['HAB-301'],
            bedCategoryCode: 'BED_CAT_PRIVATE',
            censable: true,
          })
          .expect(201)
      ).body;
      await http()
        .post(`/care-spaces/${plan.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: unidades.MED, roleCode: 'OWNER' })
        .expect(201);
      expect((await celda(plan.id)).assignable).toBe(false);
      const [{ row_version: version }] = await filas(
        'select row_version from practice.care_spaces where id = ?',
        [plan.id],
      );
      await http()
        .post(`/care-spaces/${plan.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(version))
        .send({ action: 'activate' })
        .expect(200);
      expect(await celda(plan.id)).toMatchObject({
        hygiene: { code: 'HYG_INSPECTED' },
        assignable: true,
      });
    });

    it('tras el egreso queda sucia y no asignable; con inspección obligatoria hace falta limpiar Y inspeccionar', async () => {
      await ajuste(null);
      const id = await cama('CAMA-NUEVA-2', ids['HAB-301']);
      expect((await celda(id)).assignable).toBe(true);
      await egreso(id);
      expect(await celda(id)).toMatchObject({
        hygiene: { code: 'HYG_DIRTY' },
        v2Code: 'H',
        assignable: false,
      });
      await accion(cleaner, id, 'start').then((r) =>
        expect(r.status).toBe(200),
      );
      expect((await celda(id)).assignable).toBe(false);
      await accion(cleaner, id, 'finish', { note: 'ok' }).then((r) =>
        expect(r.status).toBe(200),
      );
      // limpia pero sin inspeccionar: sigue sin ser asignable
      expect(await celda(id)).toMatchObject({
        hygiene: { code: 'HYG_CLEAN' },
        v2Code: 'H',
        assignable: false,
      });
      await accion(nurseSup, id, 'inspect', { result: 'PASS' }).then((r) =>
        expect(r.status).toBe(200),
      );
      expect(await celda(id)).toMatchObject({
        hygiene: { code: 'HYG_INSPECTED' },
        v2Code: 'U',
        assignable: true,
      });
    });

    it('con infra.inspection_required=false, limpiar basta para volver a ser asignable; es dato, no constante', async () => {
      await ajuste(false);
      const id = await cama('CAMA-NUEVA-3', ids['HAB-301']);
      expect((await celda(id)).assignable).toBe(true);
      await egreso(id);
      expect((await celda(id)).assignable).toBe(false);
      await accion(cleaner, id, 'start').then((r) =>
        expect(r.status).toBe(200),
      );
      await accion(cleaner, id, 'finish').then((r) =>
        expect(r.status).toBe(200),
      );
      expect(await celda(id)).toMatchObject({
        hygiene: { code: 'HYG_CLEAN' },
        v2Code: 'U',
        assignable: true,
      });
      // la misma cama vuelve a exigir inspección si el ajuste se enciende
      await ajuste(true);
      expect(await celda(id)).toMatchObject({ v2Code: 'H', assignable: false });
    });
  });
});
