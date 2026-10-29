import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { RetireBlockerRegistry } from '../../src/modules/practice/services';

/**
 * F1 de infraestructura hospitalaria · estructura (CONTRATO-F0-F1 §3,
 * `procesos/01` y `procesos/02`), contra la base real.
 *
 * Cada bloque tiene un caso permitido y uno que debe fallar cerrado:
 *
 * - árbol de N niveles, reglas padre→hijo, perfil de función y tipología;
 * - alta masiva e importación con dry-run, todo o nada;
 * - `If-Match` (412 / 428), inmutabilidad de `code` y `formCode` tras activar;
 * - mover (ciclos), ciclo de vida, `retire-check` y bloqueos con `nextAction`,
 *   y el registro de proveedores `RETIRE_BLOCKER_PROVIDERS`;
 * - vínculos espacio ↔ unidad;
 * - 404 cruzado por tenant en **todas** las rutas, y por sucursal.
 *
 * Los datos se crean por la API real (sin mocks); las comprobaciones de
 * persistencia leen las tablas.
 */
describe('Infraestructura F1 · estructura', () => {
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
  const mk = (letra: string): Org => ({
    email: `f1-${letra.toLowerCase()}-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  });
  const orgA = mk('A');
  const orgB = mk('B');

  const como = (org: Org) => ({
    ...bearer(org.token),
    'X-Tenant-Id': org.tenantId,
  });

  async function registrar(org: Org, letra: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F1_${letra}_${sufijo.toUpperCase()}`,
          legalName: `Hospital F1 ${letra} ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email: org.email, password, name: 'Dueña', lastName: letra },
      })
      .expect(201);
    org.tenantId = alta.body.tenantId;
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: org.email, password })
      .expect(200);
    org.token = login.body.accessToken;
    const practica = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: org.tenantId,
        code: `F1-PRACT-${letra}-${sufijo}`,
        name: `Hospital F1 ${letra}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    org.practiceId = practica.body.id;
    const sede = await http()
      .post(`/practices/${org.practiceId}/sites`)
      .set(como(org))
      .send({ code: `F1-SEDE-${letra}-${sufijo}`, name: `Sede ${letra}` })
      .expect(201);
    org.siteId = sede.body.id;
  }

  async function filas(sql: string, params: unknown[] = []): Promise<any[]> {
    return ctx.orm.em.fork().getConnection().execute(sql, params);
  }

  /** Crea un espacio por la API y devuelve el detalle. */
  async function crear(
    org: Org,
    body: Record<string, unknown>,
    expected = 201,
  ): Promise<any> {
    const res = await http()
      .post(`/sites/${org.siteId}/care-spaces`)
      .set(como(org))
      .send(body)
      .expect(expected);
    return res.body;
  }

  const ifMatch = (rowVersion: number) => ({ 'If-Match': `"${rowVersion}"` });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrar(orgA, 'A');
    await registrar(orgB, 'B');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------------ catálogo
  describe('catálogo', () => {
    it('GET /practice/infrastructure-catalog trae formas, funciones con perfil y reglas leídas de la base', async () => {
      const res = await http()
        .get('/practice/infrastructure-catalog')
        .set(como(orgA))
        .expect(200);
      expect(res.body.forms).toHaveLength(10);
      const quirofano = res.body.functions.find(
        (f: any) => f.code === 'SPACE_FN_OPERATING_ROOM',
      );
      expect(quirofano).toMatchObject({
        forms: ['LOC_FORM_ROOM'],
        schedulable: true,
        requiresHvac: true,
      });
      expect(res.body.parentRules).toEqual(
        expect.arrayContaining([
          { parent: 'LOC_FORM_ROOM', child: 'LOC_FORM_BED' },
          { parent: 'LOC_FORM_LEVEL', child: 'LOC_FORM_WARD' },
        ]),
      );
      expect(res.body.rootForms).toEqual([
        'LOC_FORM_BUILDING',
        'LOC_FORM_AREA',
        'LOC_FORM_ROOM',
        'LOC_FORM_VIRTUAL',
      ]);
      const regla = res.body.typologyRules.find(
        (r: any) =>
          r.typology === 'TYPOLOGY_HOSPITAL_L2' &&
          r.function === 'SPACE_FN_OPERATING_ROOM',
      );
      expect(regla).toMatchObject({ rule: 'TYPO_REQUIRED' });
      expect(regla.source).toContain('Segundo Nivel');
      expect(res.body.limits.maxBatchSize).toBe(200);
    });

    it('sin sesión responde 401', async () => {
      await http().get('/practice/infrastructure-catalog').expect(401);
    });
  });

  // ------------------------------------------------- árbol y reglas de forma
  describe('árbol físico', () => {
    const ids: Record<string, string> = {};

    it('edificio → piso → sala → habitación → cama: cada paso 201 y el nodo sobrevive a la recarga', async () => {
      const edificio = await crear(orgA, {
        code: 'EDIF-A',
        name: 'Edificio A',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
      });
      expect(edificio.status.code).toBe('SPACE_PLANNED');
      expect(edificio.form.code).toBe('LOC_FORM_BUILDING');
      expect(edificio.path).toEqual([]);
      ids.edificio = edificio.id;

      const piso = await crear(orgA, {
        code: 'PISO-3',
        name: 'Piso 3',
        formCode: 'LOC_FORM_LEVEL',
        functionCode: 'SPACE_FN_LEVEL_GENERIC',
        parentSpaceId: ids.edificio,
        floorNumber: 3,
      });
      ids.piso = piso.id;
      const sala = await crear(orgA, {
        code: 'SALA-3B',
        name: 'Sala 3B',
        formCode: 'LOC_FORM_WARD',
        functionCode: 'SPACE_FN_WARD_GENERIC',
        parentSpaceId: ids.piso,
      });
      ids.sala = sala.id;
      const hab = await crear(orgA, {
        code: 'HAB-301',
        name: 'Hab. 301',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
        parentSpaceId: ids.sala,
      });
      ids.hab = hab.id;
      expect(hab.path.map((p: any) => p.code)).toEqual([
        'EDIF-A',
        'PISO-3',
        'SALA-3B',
      ]);
      const cama = await crear(orgA, {
        code: 'CAMA-301-A',
        name: 'Cama 301-A',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: ids.hab,
        bedCategoryCode: 'BED_CAT_PRIVATE',
        censable: true,
      });
      ids.cama = cama.id;

      const estructura = await http()
        .get(`/sites/${orgA.siteId}/structure`)
        .set(como(orgA))
        .expect(200);
      const codes = estructura.body.spaces.map((s: any) => s.code);
      expect(codes).toEqual(
        expect.arrayContaining([
          'EDIF-A',
          'PISO-3',
          'SALA-3B',
          'HAB-301',
          'CAMA-301-A',
        ]),
      );
      const nodoHab = estructura.body.spaces.find(
        (s: any) => s.code === 'HAB-301',
      );
      expect(nodoHab).toMatchObject({
        parentId: ids.sala,
        childCount: 1,
        rowVersion: 1,
      });
      expect(Date.parse(estructura.body.asOf)).toBeGreaterThan(0);

      // Persistencia: tenant, forma y función en la tabla.
      const [fila] = await filas(
        'select tenant_id, form_concept_id, space_type_concept_id from practice.care_spaces where id = ?',
        [ids.cama],
      );
      expect(fila.tenant_id).toBe(orgA.tenantId);
      expect(fila.form_concept_id).not.toBeNull();
    });

    it('una cama directo bajo un piso responde 422 SPACE_PARENT_RULE y no escribe nada', async () => {
      const antes = await filas(
        'select count(*)::int as n from practice.care_spaces where practice_site_id = ?',
        [orgA.siteId],
      );
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'CAMA-HUERFANA',
          name: 'Cama mal puesta',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: ids.piso,
        })
        .expect(422);
      expect(res.body.reason).toBe('SPACE_PARENT_RULE');
      const despues = await filas(
        'select count(*)::int as n from practice.care_spaces where practice_site_id = ?',
        [orgA.siteId],
      );
      expect(despues[0].n).toBe(antes[0].n);
    });

    it('una función que no admite la forma responde 422 SPACE_FUNCTION_FORM_MISMATCH', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'QUIROFANO-CAMA',
          name: 'Quirófano con forma de cama',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
          parentSpaceId: ids.hab,
        })
        .expect(422);
      expect(res.body.reason).toBe('SPACE_FUNCTION_FORM_MISMATCH');
    });

    it('sin padre sólo se admiten edificio, área, local y sala virtual', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'PISO-SUELTO',
          name: 'Piso sin edificio',
          formCode: 'LOC_FORM_LEVEL',
          functionCode: 'SPACE_FN_LEVEL_GENERIC',
        })
        .expect(422);
      expect(res.body.reason).toBe('SPACE_PARENT_RULE');
    });

    it('el código no se reutiliza: 409 SPACE_CODE_TAKEN', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({ code: 'HAB-301', name: 'Otra hab. 301' })
        .expect(409);
      expect(res.body.reason).toBe('SPACE_CODE_TAKEN');
    });

    it('el cuerpo anterior a F1 ({code, name}) sigue funcionando: local genérico planificado', async () => {
      const legado = await crear(orgA, { code: 'LEGADO-1', name: 'Legado' });
      expect(legado.form.code).toBe('LOC_FORM_ROOM');
      expect(legado.function.code).toBe('SPACE_TYPE_ROOM');
      expect(legado.status.code).toBe('SPACE_PLANNED');
    });

    it('GET /care-spaces/:id: detalle con ruta, hijos y recuentos derivados', async () => {
      const res = await http()
        .get(`/care-spaces/${ids.hab}`)
        .set(como(orgA))
        .expect(200);
      expect(res.body.children.map((c: any) => c.code)).toEqual(['CAMA-301-A']);
      // La cama sigue planificada: capacidad derivada = 0 hasta que se active.
      expect(res.body.derived).toEqual({
        beds: 0,
        censableBeds: 0,
        activeChildren: 0,
      });
    });

    it('la tipología del establecimiento filtra las funciones (INV-06)', async () => {
      const hospital = await http()
        .post(`/practices/${orgA.practiceId}/sites`)
        .set(como(orgA))
        .send({ code: `F1-SEDE-PS-${sufijo}`, name: 'Puesto de salud' })
        .expect(201);
      const site = hospital.body.id as string;
      const reg = await http()
        .get(`/sites/${site}/regulatory`)
        .set(como(orgA))
        .expect(200);
      await http()
        .patch(`/sites/${site}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(reg.body.rowVersion))
        .send({ typologyCode: 'TYPOLOGY_HEALTH_POST' })
        .expect(200);
      const quirofano = await http()
        .post(`/sites/${site}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'QX-1',
          name: 'Quirófano',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
        })
        .expect(422);
      expect(quirofano.body.reason).toBe('TYPOLOGY_NOT_ALLOWED');
      await http()
        .post(`/sites/${site}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'CONS-1',
          name: 'Consultorio',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_CONSULTING_ROOM',
        })
        .expect(201);
    });
  });

  // ------------------------------------------------ alta masiva e importación
  describe('alta masiva e importación', () => {
    let hab: string;

    beforeAll(async () => {
      const room = await crear(orgA, {
        code: 'HAB-BULK',
        name: 'Habitación del lote',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      });
      hab = room.id;
    });

    it('301-{A..H} crea 8 camas en una respuesta', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
        .set(como(orgA))
        .send({
          parentSpaceId: hab,
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          codePattern: 'LOTE-{A..H}',
          namePattern: 'Cama lote {n}',
          bedCategoryCode: 'BED_CAT_SHARED',
          censable: true,
        })
        .expect(201);
      expect(res.body.created).toHaveLength(8);
      expect(res.body.created.map((c: any) => c.code)).toEqual(
        'ABCDEFGH'.split('').map((l) => `LOTE-${l}`),
      );
      expect(res.body.created[0].name).toBe('Cama lote A');
      const [{ n }] = await filas(
        "select count(*)::int as n from practice.care_spaces where practice_site_id = ? and code like 'LOTE-%'",
        [orgA.siteId],
      );
      expect(n).toBe(8);
    });

    it('si un código choca no se crea ninguna (todo o nada)', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
        .set(como(orgA))
        .send({
          parentSpaceId: hab,
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          codePattern: 'LOTE-{A..L}',
          namePattern: 'Cama {code}',
        })
        .expect(422);
      expect(res.body.details.rows.length).toBe(8);
      const [{ n }] = await filas(
        "select count(*)::int as n from practice.care_spaces where practice_site_id = ? and code in ('LOTE-I','LOTE-J','LOTE-K','LOTE-L')",
        [orgA.siteId],
      );
      expect(n).toBe(0);
    });

    it('más de 200 y patrón inválido responden 422', async () => {
      const grande = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
        .set(como(orgA))
        .send({
          parentSpaceId: hab,
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          codePattern: 'X-{1..201}',
          namePattern: 'X {n}',
        })
        .expect(422);
      expect(grande.body.reason).toBe('SPACE_BULK_PATTERN_INVALID');
      await http()
        .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
        .set(como(orgA))
        .send({
          parentSpaceId: hab,
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          codePattern: 'SIN-RANGO',
          namePattern: 'x',
        })
        .expect(422);
    });

    const filasCsv = (extra: Record<string, unknown>[] = []) => [
      {
        code: 'IMP-EDIF',
        name: 'Edificio importado',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
      },
      {
        code: 'IMP-PISO',
        name: 'Piso importado',
        formCode: 'LOC_FORM_LEVEL',
        functionCode: 'SPACE_FN_LEVEL_GENERIC',
        parentCode: 'IMP-EDIF',
        floorNumber: '1',
      },
      {
        code: 'IMP-HAB',
        name: 'Hab importada',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
        parentCode: 'IMP-PISO',
      },
      ...extra,
    ];

    it('dryRun=true devuelve exactamente las 3 líneas con error, con campo y motivo, y no escribe', async () => {
      const rows = filasCsv([
        {
          code: 'IMP-MAL-1',
          name: 'Cama bajo piso',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentCode: 'IMP-PISO',
        },
        {
          code: 'HAB-301',
          name: 'Código ya usado',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_CONSULTING_ROOM',
          parentCode: 'IMP-PISO',
        },
        {
          code: 'IMP-MAL-3',
          name: 'Padre inexistente',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_CONSULTING_ROOM',
          parentCode: 'NO-EXISTE',
        },
      ]);
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/import?dryRun=true`)
        .set(como(orgA))
        .send({ rows })
        .expect(200);
      expect(res.body.ok).toBe(false);
      const conError = res.body.rows.filter((r: any) => r.status === 'error');
      expect(conError.map((r: any) => r.line)).toEqual([4, 5, 6]);
      expect(conError[0].errors[0]).toMatchObject({
        field: 'formCode',
        reason: 'SPACE_PARENT_RULE',
      });
      expect(conError[1].errors[0]).toMatchObject({
        field: 'code',
        reason: 'SPACE_CODE_TAKEN',
      });
      expect(conError[2].errors[0].field).toBe('parentCode');
      expect(res.body.created).toBeUndefined();
      const [{ n }] = await filas(
        "select count(*)::int as n from practice.care_spaces where practice_site_id = ? and code like 'IMP-%'",
        [orgA.siteId],
      );
      expect(n).toBe(0);
    });

    it('dryRun=false con errores no crea nada; corregido, crea todo el archivo (padres antes que hijos)', async () => {
      const mal = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/import?dryRun=false`)
        .set(como(orgA))
        .send({
          rows: filasCsv([
            {
              code: 'IMP-MAL',
              name: 'x',
              formCode: 'LOC_FORM_BED',
              functionCode: 'SPACE_FN_BED_STANDARD',
              parentCode: 'IMP-PISO',
            },
          ]),
        })
        .expect(200);
      expect(mal.body.ok).toBe(false);
      expect(mal.body.created).toBeUndefined();
      const [{ n0 }] = await filas(
        "select count(*)::int as n0 from practice.care_spaces where practice_site_id = ? and code like 'IMP-%'",
        [orgA.siteId],
      );
      expect(n0).toBe(0);

      // Las filas llegan con el hijo antes que el padre: el orden del archivo no importa.
      const rows = filasCsv().reverse();
      const ok = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/import?dryRun=false`)
        .set(como(orgA))
        .send({ rows })
        .expect(200);
      expect(ok.body).toMatchObject({ ok: true, created: 3 });
      const [hijo] = await filas(
        `select c.code, p.code as parent_code from practice.care_spaces c
           join practice.care_spaces p on p.id = c.parent_space_id
          where c.practice_site_id = ? and c.code = 'IMP-HAB'`,
        [orgA.siteId],
      );
      expect(hijo.parent_code).toBe('IMP-PISO');
    });

    it('un ciclo de parentCode se reporta en la línea', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces/import?dryRun=true`)
        .set(como(orgA))
        .send({
          rows: [
            {
              code: 'CIC-1',
              name: 'A',
              formCode: 'LOC_FORM_AREA',
              functionCode: 'SPACE_FN_AREA_GENERIC',
              parentCode: 'CIC-2',
            },
            {
              code: 'CIC-2',
              name: 'B',
              formCode: 'LOC_FORM_AREA',
              functionCode: 'SPACE_FN_AREA_GENERIC',
              parentCode: 'CIC-1',
            },
          ],
        })
        .expect(200);
      expect(res.body.ok).toBe(false);
      expect(res.body.rows[0].errors[0].reason).toBe('SPACE_CYCLE');
    });
  });

  // ---------------------------------------------- concurrencia y edición
  describe('edición y concurrencia (If-Match)', () => {
    let espacio: any;

    beforeAll(async () => {
      espacio = await crear(orgA, {
        code: 'EDIT-1',
        name: 'Para editar',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
      });
    });

    it('sin If-Match responde 428; con una versión vieja, 412; con la vigente, 200 y rowVersion + 1', async () => {
      const sin = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .send({ name: 'Nombre nuevo' })
        .expect(428);
      expect(sin.body.reason).toBe('IF_MATCH_REQUIRED');

      const viejo = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion + 7))
        .send({ name: 'Nombre nuevo' })
        .expect(412);
      expect(viejo.body.reason).toBe('ROW_VERSION_MISMATCH');

      const bien = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({
          name: 'Nombre nuevo',
          description: 'Consultorio de prueba',
          areaM2: 14.5,
          floorNumber: 2,
        })
        .expect(200);
      expect(bien.body.rowVersion).toBe(espacio.rowVersion + 1);
      expect(bien.body).toMatchObject({
        name: 'Nombre nuevo',
        areaM2: 14.5,
        floorNumber: 2,
      });
      espacio = bien.body;

      const [fila] = await filas(
        'select name, area_m2, row_version from practice.care_spaces where id = ?',
        [espacio.id],
      );
      expect(fila.name).toBe('Nombre nuevo');
      expect(Number(fila.area_m2)).toBe(14.5);
      expect(fila.row_version).toBe(espacio.rowVersion);
    });

    it('un PATCH sin cambios responde 200 sin tocar la versión', async () => {
      const res = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ name: espacio.name })
        .expect(200);
      expect(res.body.rowVersion).toBe(espacio.rowVersion);
    });

    it('rangos y catálogos inválidos responden 422 con el campo', async () => {
      const res = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ asepsisCode: 'ASEPSIS_INEXISTENTE' })
        .expect(422);
      expect(res.body.details.errors[0]).toMatchObject({
        field: 'asepsisCode',
        reason: 'CATALOG_CODE_INVALID',
      });
    });

    it('code y formCode son inmutables una vez activo (SPACE_IMMUTABLE_FIELD); name sí cambia', async () => {
      // Antes de activar, el código todavía se puede cambiar.
      const renombrado = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ code: 'EDIT-1B' })
        .expect(200);
      espacio = renombrado.body;
      const activo = await http()
        .post(`/care-spaces/${espacio.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ action: 'activate' })
        .expect(200);
      expect(activo.body.status.code).toBe('SPACE_ACTIVE');
      expect(activo.body.validFrom).not.toBeNull();
      espacio = activo.body;

      const codigo = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ code: 'EDIT-OTRO' })
        .expect(422);
      expect(codigo.body.reason).toBe('SPACE_IMMUTABLE_FIELD');
      const forma = await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
        })
        .expect(422);
      expect(forma.body.reason).toBe('SPACE_IMMUTABLE_FIELD');
      await http()
        .patch(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .set(ifMatch(espacio.rowVersion))
        .send({ name: 'Renombrado activo' })
        .expect(200);
    });

    it('cada mutación deja su revisión en audit.care_spaces_history y su evento en el outbox', async () => {
      const revisiones = await filas(
        `select revision_no, operation_concept_id, tenant_id, valid_to, data_snapshot
           from audit.care_spaces_history where care_space_id = ? order by revision_no`,
        [espacio.id],
      );
      expect(revisiones.length).toBeGreaterThanOrEqual(4);
      expect(revisiones.every((r: any) => r.tenant_id === orgA.tenantId)).toBe(
        true,
      );
      // Sólo la última revisión queda abierta (la anterior se cierra con valid_to).
      expect(revisiones.filter((r: any) => r.valid_to === null)).toHaveLength(
        1,
      );
      expect(revisiones.at(-1).data_snapshot.name).toBe('Renombrado activo');

      const eventos = await filas(
        `select event_type, payload_json from messaging.domain_events
          where aggregate_id = ? order by occurred_at`,
        [espacio.id],
      );
      const tipos = eventos.map((e: any) => e.event_type);
      expect(tipos).toEqual(
        expect.arrayContaining([
          'practice.care_space.created',
          'practice.care_space.updated',
          'practice.care_space.lifecycle_changed',
        ]),
      );
      const lc = eventos.find(
        (e: any) => e.event_type === 'practice.care_space.lifecycle_changed',
      );
      expect(lc.payload_json).toMatchObject({
        from: 'SPACE_PLANNED',
        to: 'SPACE_ACTIVE',
        tenantId: orgA.tenantId,
      });
      expect(lc.payload_json.requestId).toBeTruthy();
    });
  });

  // ----------------------------------------------------------- mover
  describe('mover (ciclos)', () => {
    it('mover un nodo bajo su propio hijo responde 422 SPACE_CYCLE; un movimiento válido mueve el subárbol', async () => {
      const a = await crear(orgA, {
        code: 'MV-A',
        name: 'A',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
      });
      const b = await crear(orgA, {
        code: 'MV-B',
        name: 'B',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
        parentSpaceId: a.id,
      });
      const c = await crear(orgA, {
        code: 'MV-C',
        name: 'C',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
        parentSpaceId: b.id,
      });
      const otro = await crear(orgA, {
        code: 'MV-D',
        name: 'D',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
      });

      const ciclo = await http()
        .post(`/care-spaces/${a.id}/move`)
        .set(como(orgA))
        .set(ifMatch(a.rowVersion))
        .send({ parentSpaceId: c.id })
        .expect(422);
      expect(ciclo.body.reason).toBe('SPACE_CYCLE');
      const sobreSi = await http()
        .post(`/care-spaces/${a.id}/move`)
        .set(como(orgA))
        .set(ifMatch(a.rowVersion))
        .send({ parentSpaceId: a.id })
        .expect(422);
      expect(sobreSi.body.reason).toBe('SPACE_CYCLE');

      const movido = await http()
        .post(`/care-spaces/${b.id}/move`)
        .set(como(orgA))
        .set(ifMatch(b.rowVersion))
        .send({ parentSpaceId: otro.id })
        .expect(200);
      expect(movido.body.parentId).toBe(otro.id);
      expect(movido.body.rowVersion).toBe(b.rowVersion + 1);
      const cDespues = await http()
        .get(`/care-spaces/${c.id}`)
        .set(como(orgA))
        .expect(200);
      expect(cDespues.body.path.map((p: any) => p.code)).toEqual([
        'MV-D',
        'MV-B',
      ]);

      const aRaiz = await http()
        .post(`/care-spaces/${b.id}/move`)
        .set(como(orgA))
        .set(ifMatch(movido.body.rowVersion))
        .send({ parentSpaceId: null })
        .expect(200);
      expect(aRaiz.body.parentId).toBeNull();
      await http()
        .post(`/care-spaces/${b.id}/move`)
        .set(como(orgA))
        .set(ifMatch(aRaiz.body.rowVersion))
        .send({})
        .expect(400);
    });
  });

  // ------------------------------------------------- ciclo de vida y clausura
  describe('ciclo de vida y clausura', () => {
    it('activar un hijo con el padre sin activar responde 422 PARENT_NOT_ACTIVE', async () => {
      const padre = await crear(orgA, {
        code: 'LC-P',
        name: 'Padre',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      });
      const hijo = await crear(orgA, {
        code: 'LC-H',
        name: 'Hijo',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: padre.id,
        bedCategoryCode: 'BED_CAT_PRIVATE',
        censable: true,
      });
      const res = await http()
        .post(`/care-spaces/${hijo.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(hijo.rowVersion))
        .send({ action: 'activate' })
        .expect(422);
      expect(res.body.reason).toBe('PARENT_NOT_ACTIVE');
    });

    it('retire: sin reason 422; con hijos vigentes 409 ACTIVE_CHILDREN con count y nextAction; sin bloqueos clausura y reserva el código', async () => {
      const habitacion = await crear(orgA, {
        code: 'RT-HAB',
        name: 'Hab',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      });
      const cama = await crear(orgA, {
        code: 'RT-CAMA',
        name: 'Cama',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: habitacion.id,
        bedCategoryCode: 'BED_CAT_PRIVATE',
        censable: true,
      });

      await http()
        .post(`/care-spaces/${habitacion.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(habitacion.rowVersion))
        .send({ action: 'retire' })
        .expect(422);

      const bloqueada = await http()
        .post(`/care-spaces/${habitacion.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(habitacion.rowVersion))
        .send({ action: 'retire', reason: 'Remodelación' })
        .expect(409);
      expect(bloqueada.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      expect(bloqueada.body.details.blockers).toEqual([
        expect.objectContaining({
          kind: 'ACTIVE_CHILDREN',
          count: 1,
          sampleIds: [cama.id],
          nextAction: expect.stringMatching(/hijos/i),
        }),
      ]);
      // El retire-check informativo ve lo mismo.
      const chequeo = await http()
        .get(`/care-spaces/${habitacion.id}/retire-check`)
        .set(como(orgA))
        .expect(200);
      expect(chequeo.body.blockers[0].kind).toBe('ACTIVE_CHILDREN');
      expect(chequeo.body.asOf).toBeTruthy();

      // Se resuelve el bloqueo: se clausura la cama y luego la habitación.
      const camaRetirada = await http()
        .post(`/care-spaces/${cama.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(cama.rowVersion))
        .send({ action: 'retire', reason: 'Cama dada de baja' })
        .expect(200);
      expect(camaRetirada.body.status.code).toBe('SPACE_RETIRED');
      expect(camaRetirada.body.validTo).not.toBeNull();
      const limpio = await http()
        .get(`/care-spaces/${habitacion.id}/retire-check`)
        .set(como(orgA))
        .expect(200);
      expect(limpio.body.blockers).toEqual([]);

      const retirada = await http()
        .post(`/care-spaces/${habitacion.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(habitacion.rowVersion))
        .send({ action: 'retire', reason: 'Remodelación' })
        .expect(200);
      expect(retirada.body.status.code).toBe('SPACE_RETIRED');

      // Sigue respondiendo en la lectura y en la historia (sin borrado físico).
      await http()
        .get(`/care-spaces/${habitacion.id}`)
        .set(como(orgA))
        .expect(200);
      const hist = await filas(
        'select data_snapshot from audit.care_spaces_history where care_space_id = ? order by revision_no desc limit 1',
        [habitacion.id],
      );
      expect(hist[0].data_snapshot).toMatchObject({
        lifecycleAction: 'retire',
        lifecycleReason: 'Remodelación',
      });
      // El código no se reutiliza.
      const reuso = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({ code: 'RT-HAB', name: 'Otra' })
        .expect(409);
      expect(reuso.body.reason).toBe('SPACE_CODE_TAKEN');
      // Un clausurado es de sólo lectura.
      await http()
        .patch(`/care-spaces/${habitacion.id}`)
        .set(como(orgA))
        .set(ifMatch(retirada.body.rowVersion))
        .send({ name: 'Intento' })
        .expect(422);
      // No existe ruta de borrado.
      await http()
        .delete(`/care-spaces/${habitacion.id}`)
        .set(como(orgA))
        .expect(404);
    });

    it('suspender exige motivo y se reactiva; las transiciones inválidas responden 422', async () => {
      const e = await crear(orgA, {
        code: 'SU-1',
        name: 'Suspendible',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
        activate: true,
      });
      expect(e.status.code).toBe('SPACE_ACTIVE');
      await http()
        .post(`/care-spaces/${e.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(e.rowVersion))
        .send({ action: 'suspend' })
        .expect(422);
      const susp = await http()
        .post(`/care-spaces/${e.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(e.rowVersion))
        .send({ action: 'suspend', reason: 'Fumigación' })
        .expect(200);
      expect(susp.body.status.code).toBe('SPACE_SUSPENDED');
      const inval = await http()
        .post(`/care-spaces/${e.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(susp.body.rowVersion))
        .send({ action: 'activate' })
        .expect(422);
      expect(inval.body.reason).toBe('LIFECYCLE_TRANSITION_INVALID');
      const react = await http()
        .post(`/care-spaces/${e.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(susp.body.rowVersion))
        .send({ action: 'reactivate' })
        .expect(200);
      expect(react.body.status.code).toBe('SPACE_ACTIVE');
    });

    it('activar exige los datos del perfil de la función (quirófano: área y HVAC)', async () => {
      const qx = await crear(orgA, {
        code: 'QX-PERFIL',
        name: 'Quirófano',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
      });
      const sinDatos = await http()
        .post(`/care-spaces/${qx.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(qx.rowVersion))
        .send({ action: 'activate' })
        .expect(422);
      expect(sinDatos.body.reason).toBe('SPACE_PROFILE_INCOMPLETE');
      expect(sinDatos.body.details.errors.map((e: any) => e.field)).toEqual(
        expect.arrayContaining([
          'areaM2',
          'pressureCode',
          'airChangesPerHour',
          'hvacValidatedOn',
        ]),
      );
      const completo = await http()
        .patch(`/care-spaces/${qx.id}`)
        .set(como(orgA))
        .set(ifMatch(qx.rowVersion))
        .send({
          areaM2: 36,
          pressureCode: 'PRESSURE_POSITIVE',
          airChangesPerHour: 20,
          hvacValidatedOn: '2026-10-01',
          prepMinutes: 15,
          cleanupMinutes: 25,
        })
        .expect(200);
      await http()
        .post(`/care-spaces/${qx.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(completo.body.rowVersion))
        .send({ action: 'activate' })
        .expect(200);
    });

    it('un módulo puede sumar su propio bloqueo al registro sin editar el servicio (RETIRE_BLOCKER_PROVIDERS)', async () => {
      const e = await crear(orgA, {
        code: 'RG-1',
        name: 'Con bloqueo ajeno',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_STORAGE',
      });
      ctx.app.get(RetireBlockerRegistry).register({
        kind: 'TEST_MODULE_BLOCKER',
        collect: async ({ rootId }) =>
          rootId === e.id
            ? {
                kind: 'TEST_MODULE_BLOCKER',
                count: 2,
                sampleIds: [randomUUID()],
                nextAction: 'Resolver en el módulo de prueba',
              }
            : null,
      });
      const res = await http()
        .post(`/care-spaces/${e.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(e.rowVersion))
        .send({ action: 'retire', reason: 'Prueba' })
        .expect(409);
      expect(res.body.details.blockers).toEqual([
        expect.objectContaining({
          kind: 'TEST_MODULE_BLOCKER',
          count: 2,
          nextAction: 'Resolver en el módulo de prueba',
        }),
      ]);
    });
  });

  // ------------------------------------------------ unidades y vínculos
  describe('unidades y vínculos espacio ↔ unidad', () => {
    let unidad: any;
    let otraUnidad: any;
    let espacio: any;

    beforeAll(async () => {
      unidad = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(como(orgA))
          .send({ code: 'UN-INT', name: 'Internación' })
          .expect(201)
      ).body;
      otraUnidad = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(como(orgA))
          .send({ code: 'UN-QX', name: 'Quirófanos' })
          .expect(201)
      ).body;
      espacio = await crear(orgA, {
        code: 'VN-1',
        name: 'Para vincular',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_PROCEDURE_ROOM',
      });
    });

    it('un solo OWNER vigente; SHARED y LOAN conviven; desvincular cierra la vigencia sin borrar', async () => {
      const owner = await http()
        .post(`/care-spaces/${espacio.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: unidad.id, roleCode: 'SPACE_UNIT_ROLE_OWNER' })
        .expect(201);
      expect(owner.body).toMatchObject({
        clinicalUnitId: unidad.id,
        validTo: null,
        role: { code: 'SPACE_UNIT_ROLE_OWNER' },
      });

      const segundo = await http()
        .post(`/care-spaces/${espacio.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: otraUnidad.id, roleCode: 'OWNER' })
        .expect(409);
      expect(segundo.body.reason).toBe('SPACE_UNIT_OWNER_TAKEN');
      const repetido = await http()
        .post(`/care-spaces/${espacio.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: unidad.id, roleCode: 'SHARED' })
        .expect(409);
      expect(repetido.body.reason).toBe('SPACE_UNIT_ASSIGNMENT_EXISTS');
      const shared = await http()
        .post(`/care-spaces/${espacio.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: otraUnidad.id, roleCode: 'SHARED' })
        .expect(201);

      const ficha = await http()
        .get(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .expect(200);
      expect(ficha.body.assignments).toHaveLength(2);
      expect(ficha.body.clinicalUnitId).toBe(unidad.id);

      const cerrado = await http()
        .delete(`/care-spaces/${espacio.id}/unit-assignments/${owner.body.id}`)
        .set(como(orgA))
        .expect(200);
      expect(cerrado.body.validTo).not.toBeNull();
      const [fila] = await filas(
        'select valid_to from practice.space_unit_assignments where id = ?',
        [owner.body.id],
      );
      expect(fila.valid_to).not.toBeNull();
      await http()
        .delete(`/care-spaces/${espacio.id}/unit-assignments/${owner.body.id}`)
        .set(como(orgA))
        .expect(409);
      const despues = await http()
        .get(`/care-spaces/${espacio.id}`)
        .set(como(orgA))
        .expect(200);
      expect(despues.body.clinicalUnitId).toBeNull();
      expect(despues.body.assignments.map((a: any) => a.id)).toEqual([
        shared.body.id,
      ]);
    });

    it('GET/PATCH de la unidad con If-Match; clinical-units del establecimiento lista las dos', async () => {
      const lista = await http()
        .get(`/sites/${orgA.siteId}/clinical-units`)
        .set(como(orgA))
        .expect(200);
      expect(lista.body.map((u: any) => u.code)).toEqual(
        expect.arrayContaining(['UN-INT', 'UN-QX']),
      );
      const ficha = await http()
        .get(`/clinical-units/${unidad.id}`)
        .set(como(orgA))
        .expect(200);
      expect(ficha.body.rowVersion).toBe(1);
      await http()
        .patch(`/clinical-units/${unidad.id}`)
        .set(como(orgA))
        .set(ifMatch(99))
        .send({ name: 'X' })
        .expect(412);
      const editada = await http()
        .patch(`/clinical-units/${unidad.id}`)
        .set(como(orgA))
        .set(ifMatch(1))
        .send({ name: 'Internación general', description: 'Piso 3' })
        .expect(200);
      expect(editada.body).toMatchObject({
        name: 'Internación general',
        rowVersion: 2,
      });
    });

    it('una unidad con espacios vinculados no se retira (UNIT_RETIRE_BLOCKED); sin ellos, sí', async () => {
      const bloqueada = await http()
        .post(`/clinical-units/${otraUnidad.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(1))
        .send({ action: 'retire', reason: 'Cierre del servicio' })
        .expect(409);
      expect(bloqueada.body.reason).toBe('UNIT_RETIRE_BLOCKED');
      expect(bloqueada.body.details.blockers[0]).toMatchObject({
        kind: 'ACTIVE_UNIT_SPACES',
        count: 1,
        nextAction: expect.any(String),
      });

      const vacia = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(como(orgA))
          .send({ code: 'UN-VACIA', name: 'Vacía' })
          .expect(201)
      ).body;
      const retirada = await http()
        .post(`/clinical-units/${vacia.id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(1))
        .send({ action: 'retire', reason: 'Sin uso' })
        .expect(200);
      expect(retirada.body.status.code).toBe('UNIT_RETIRED');
    });

    it('una unidad de otra sede o de otro tenant no se vincula', async () => {
      const ajena = (
        await http()
          .post(`/sites/${orgB.siteId}/clinical-units`)
          .set(como(orgB))
          .send({ code: 'UN-B', name: 'De B' })
          .expect(201)
      ).body;
      const res = await http()
        .post(`/care-spaces/${espacio.id}/unit-assignments`)
        .set(como(orgA))
        .send({ clinicalUnitId: ajena.id, roleCode: 'SHARED' })
        .expect(404);
      expect(res.body.reason).toBe('PRACTICE_RESOURCE_OUT_OF_SCOPE');
    });
  });

  // -------------------------------------- fail-closed por tenant (404 cruzado)
  describe('404 cruzado por tenant en todas las rutas', () => {
    let espacioB: any;
    let unidadB: any;

    beforeAll(async () => {
      espacioB = await crear(orgB, {
        code: 'B-ESP',
        name: 'Espacio de B',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
      });
      unidadB = (
        await http()
          .post(`/sites/${orgB.siteId}/clinical-units`)
          .set(como(orgB))
          .send({ code: 'B-UN', name: 'Unidad B' })
          .expect(201)
      ).body;
    });

    it('desde A, cada ruta con un id de B responde 404 uniforme y sin datos', async () => {
      const A = como(orgA);
      const cuerpos: Array<
        [string, string, Record<string, unknown>?, Record<string, string>?]
      > = [
        ['get', `/sites/${orgB.siteId}/structure`],
        ['get', `/sites/${orgB.siteId}/clinical-units`],
        ['get', `/sites/${orgB.siteId}/regulatory`],
        ['get', `/sites/${orgB.siteId}/licenses`],
        ['get', `/sites/${orgB.siteId}/capacity`],
        [
          'patch',
          `/sites/${orgB.siteId}/regulatory`,
          { municipalityName: 'Intruso' },
          ifMatch(1),
        ],
        ['post', `/sites/${orgB.siteId}/licenses`, { resolutionNumber: 'X-1' }],
        [
          'post',
          `/sites/${orgB.siteId}/declared-capacities`,
          {
            capacityKindCode: 'CAP_BEDS_CENSABLE',
            quantity: 1,
            asOf: '2026-10-01',
          },
        ],
        [
          'post',
          `/sites/${orgB.siteId}/care-spaces`,
          { code: 'INTRUSO', name: 'x' },
        ],
        [
          'post',
          `/sites/${orgB.siteId}/care-spaces/bulk`,
          {
            formCode: 'LOC_FORM_ROOM',
            functionCode: 'SPACE_TYPE_ROOM',
            codePattern: 'X-{1..2}',
            namePattern: 'x',
          },
        ],
        [
          'post',
          `/sites/${orgB.siteId}/care-spaces/import?dryRun=true`,
          { rows: [{ code: 'I', name: 'i' }] },
        ],
        ['get', `/care-spaces/${espacioB.id}`],
        [
          'patch',
          `/care-spaces/${espacioB.id}`,
          { name: 'Intruso' },
          ifMatch(1),
        ],
        [
          'post',
          `/care-spaces/${espacioB.id}/move`,
          { parentSpaceId: null },
          ifMatch(1),
        ],
        [
          'post',
          `/care-spaces/${espacioB.id}/lifecycle`,
          { action: 'activate' },
          ifMatch(1),
        ],
        ['get', `/care-spaces/${espacioB.id}/retire-check`],
        [
          'post',
          `/care-spaces/${espacioB.id}/unit-assignments`,
          { clinicalUnitId: unidadB.id, roleCode: 'SHARED' },
        ],
        ['get', `/clinical-units/${unidadB.id}`],
        [
          'patch',
          `/clinical-units/${unidadB.id}`,
          { name: 'Intruso' },
          ifMatch(1),
        ],
        [
          'post',
          `/clinical-units/${unidadB.id}/lifecycle`,
          { action: 'suspend', reason: 'x' },
          ifMatch(1),
        ],
        [
          'patch',
          `/site-licenses/${randomUUID()}`,
          { status: 'LIC_VALID' },
          ifMatch(1),
        ],
      ];
      const cuerposRespuesta: unknown[] = [];
      for (const [method, path, body, extra] of cuerpos) {
        let req = (http() as any)[method](path).set(A);
        if (extra) req = req.set(extra);
        const res = await (body ? req.send(body) : req);
        expect([method, path, res.status]).toEqual([method, path, 404]);
        expect(res.body.reason).toBe('PRACTICE_RESOURCE_OUT_OF_SCOPE');
        // El eco de la ruta que el propio cliente pidió (`path`) no cuenta; el
        // cuerpo del error no debe traer ningún dato del recurso.
        expect(res.body.message).not.toContain(orgB.siteId);
        expect(res.body.details).toBeUndefined();
        cuerposRespuesta.push({
          code: res.body.code,
          reason: res.body.reason,
          message: res.body.message,
        });
      }
      expect(cuerposRespuesta.length).toBe(cuerpos.length);

      // B no cambió.
      const [fila] = await filas(
        'select name, row_version from practice.care_spaces where id = ?',
        [espacioB.id],
      );
      expect(fila).toMatchObject({ name: 'Espacio de B', row_version: 1 });
      const intrusos = await filas(
        "select count(*)::int as n from practice.care_spaces where practice_site_id = ? and code in ('INTRUSO','X-1','X-2','I')",
        [orgB.siteId],
      );
      expect(intrusos[0].n).toBe(0);
    });

    it('un id inexistente responde exactamente lo mismo que uno de otro tenant', async () => {
      const ajeno = await http()
        .get(`/care-spaces/${espacioB.id}`)
        .set(como(orgA))
        .expect(404);
      const inexistente = await http()
        .get(`/care-spaces/${randomUUID()}`)
        .set(como(orgA))
        .expect(404);
      expect(ajeno.body.reason).toBe(inexistente.body.reason);
      expect(ajeno.body.message).toBe(inexistente.body.message);
      expect(ajeno.body.details).toEqual(inexistente.body.details);
    });

    it('un padre de otro tenant en el cuerpo responde 404 y no crea', async () => {
      await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({
          code: 'PADRE-AJENO',
          name: 'x',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: espacioB.id,
        })
        .expect(404);
      const propio = await crear(orgA, {
        code: 'MOVER-A-B',
        name: 'Mío',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_TYPE_ROOM',
      });
      await http()
        .post(`/care-spaces/${propio.id}/move`)
        .set(como(orgA))
        .set(ifMatch(propio.rowVersion))
        .send({ parentSpaceId: espacioB.id })
        .expect(404);
      const [fila] = await filas(
        'select parent_space_id from practice.care_spaces where id = ?',
        [propio.id],
      );
      expect(fila.parent_space_id).toBeNull();
    });
  });
});
