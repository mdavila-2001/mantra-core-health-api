import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * F1 de infraestructura hospitalaria · establecimiento regulado (CONTRATO-F0-F1
 * §3 y Desvíos de F1b), contra la base real.
 *
 * - datos regulatorios con `If-Match`, `TYPOLOGY_CONFLICT` con la lista;
 * - SNIS: sólo la plataforma verifica, un código verificado por otra
 *   organización responde un 409 genérico, cambiar el código borra la
 *   verificación;
 * - habilitaciones sobre `organization_extensions.facility_licenses` con el
 *   vencimiento calculado al leer;
 * - capacidad declarada vs derivada (se deriva contando espacios activos);
 * - administrador de sucursal: ve y escribe sólo la estructura de su sucursal,
 *   no toca lo regulatorio (403) y la sede de otra sucursal responde 404.
 */
describe('Infraestructura F1 · establecimiento regulado', () => {
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
    email: `f1r-${letra.toLowerCase()}-${sufijo}@example.test`,
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
  const comoPlataforma = (org: Org) => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': org.tenantId,
  });
  const ifMatch = (rowVersion: number) => ({ 'If-Match': `"${rowVersion}"` });

  async function registrar(org: Org, letra: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F1R_${letra}_${sufijo.toUpperCase()}`,
          legalName: `Hospital F1R ${letra} ${sufijo}`,
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
          code: `F1R-PRACT-${letra}-${sufijo}`,
          name: `Hospital F1R ${letra}`,
          timeZone: 'America/La_Paz',
        })
        .expect(201)
    ).body.id;
    org.siteId = await sede(
      org,
      `F1R-SEDE-${letra}-${sufijo}`,
      `Sede ${letra}`,
    );
  }

  async function sede(
    org: Org,
    code: string,
    name: string,
    branchId?: string,
  ): Promise<string> {
    const res = await http()
      .post(`/practices/${org.practiceId}/sites`)
      .set(como(org))
      .send({ code, name, ...(branchId ? { branchId } : {}) })
      .expect(201);
    return res.body.id;
  }

  async function filas(sql: string, params: unknown[] = []): Promise<any[]> {
    return ctx.orm.em.fork().getConnection().execute(sql, params);
  }

  async function regulatorio(org: Org, siteId = org.siteId): Promise<any> {
    return (
      await http().get(`/sites/${siteId}/regulatory`).set(como(org)).expect(200)
    ).body;
  }

  async function espacio(
    org: Org,
    body: Record<string, unknown>,
    siteId = org.siteId,
  ): Promise<any> {
    return (
      await http()
        .post(`/sites/${siteId}/care-spaces`)
        .set(como(org))
        .send(body)
        .expect(201)
    ).body;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrar(orgA, 'A');
    await registrar(orgB, 'B');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------ datos regulatorios
  describe('datos regulatorios', () => {
    it('el OWNER los edita con If-Match; persisten y salen en la lectura, con historia y evento', async () => {
      const antes = await regulatorio(orgA);
      expect(antes).toMatchObject({
        snisCode: null,
        snisVerified: false,
        typology: null,
      });

      const sin = await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .send({ municipalityName: 'Santa Cruz de la Sierra' })
        .expect(428);
      expect(sin.body.reason).toBe('IF_MATCH_REQUIRED');
      await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(antes.rowVersion + 3))
        .send({ municipalityName: 'X' })
        .expect(412);

      const res = await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(antes.rowVersion))
        .send({
          subsectorCode: 'SUBSECTOR_PUBLIC',
          careLevelCode: 'CARE_LEVEL_2',
          typologyCode: 'TYPOLOGY_HOSPITAL_L2',
          sedesCode: 'SEDES_SCZ',
          managingEntityName: 'Gobierno Municipal',
          healthNetworkName: 'Red 1',
          municipalityName: 'Santa Cruz de la Sierra',
        })
        .expect(200);
      expect(res.body).toMatchObject({
        subsector: { code: 'SUBSECTOR_PUBLIC' },
        careLevel: { code: 'CARE_LEVEL_2' },
        typology: { code: 'TYPOLOGY_HOSPITAL_L2' },
        sedes: { code: 'SEDES_SCZ' },
        rowVersion: antes.rowVersion + 1,
      });
      expect(res.body.typology.source).toContain('Segundo Nivel');

      // Recarga: la lectura trae lo mismo y la tabla también.
      const recarga = await regulatorio(orgA);
      expect(recarga.typology.code).toBe('TYPOLOGY_HOSPITAL_L2');
      const [fila] = await filas(
        'select municipality_name, row_version from practice.practice_sites where id = ?',
        [orgA.siteId],
      );
      expect(fila).toMatchObject({
        municipality_name: 'Santa Cruz de la Sierra',
        row_version: antes.rowVersion + 1,
      });
      const hist = await filas(
        'select tenant_id from audit.practice_sites_history where practice_site_id = ?',
        [orgA.siteId],
      );
      expect(hist.length).toBeGreaterThanOrEqual(2);
      expect(hist.every((h: any) => h.tenant_id === orgA.tenantId)).toBe(true);
      const ev = await filas(
        "select count(*)::int as n from messaging.domain_events where aggregate_id = ? and event_type = 'practice.site.regulatory_updated'",
        [orgA.siteId],
      );
      expect(ev[0].n).toBe(1);
      // La bitácora sella también los intentos rechazados (428 y 412): uno
      // exitoso y dos fallidos.
      const sello = await filas(
        `select outcome_concept_id, count(*)::int as n from audit.audit_log
          where action = 'PRACTICE_SITE_REGULATORY_UPDATED' and entity_id = ?
          group by 1`,
        [orgA.siteId],
      );
      const porResultado = Object.fromEntries(
        sello.map((r: any) => [r.outcome_concept_id, r.n]),
      );
      expect(porResultado[CONCEPTS.OUTCOME_SUCCESS]).toBe(1);
      expect(porResultado[CONCEPTS.OUTCOME_FAILURE]).toBe(2);
    });

    it('un código de catálogo inválido responde 422 con el campo', async () => {
      const reg = await regulatorio(orgA);
      const res = await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(reg.rowVersion))
        .send({ typologyCode: 'TYPOLOGY_INEXISTENTE' })
        .expect(422);
      expect(res.body.details.errors[0]).toMatchObject({
        field: 'typologyCode',
        reason: 'CATALOG_CODE_INVALID',
      });
    });

    it('cambiar a Puesto de Salud con un quirófano activo responde 409 TYPOLOGY_CONFLICT que lo lista; nada cambia', async () => {
      const qx = await espacio(orgA, {
        code: 'QX-TIPO',
        name: 'Quirófano 1',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
        areaM2: 40,
        pressureCode: 'PRESSURE_POSITIVE',
        airChangesPerHour: 20,
        hvacValidatedOn: '2026-10-01',
        activate: true,
      });
      const reg = await regulatorio(orgA);
      const res = await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(reg.rowVersion))
        .send({ typologyCode: 'TYPOLOGY_HEALTH_POST' })
        .expect(409);
      expect(res.body.reason).toBe('TYPOLOGY_CONFLICT');
      expect(res.body.details.spaces).toEqual([
        expect.objectContaining({
          id: qx.id,
          code: 'QX-TIPO',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
          rule: 'TYPO_ALLOWED',
          nextAction: expect.any(String),
        }),
      ]);
      expect((await regulatorio(orgA)).typology.code).toBe(
        'TYPOLOGY_HOSPITAL_L2',
      );
    });
  });

  // --------------------------------------------------------------- SNIS
  describe('código SNIS', () => {
    const codigo = `SNIS-${sufijo}`;
    let sedeB: string;
    let sedeB2: string;

    beforeAll(async () => {
      sedeB = orgB.siteId;
      sedeB2 = await sede(orgB, `F1R-SEDE-B2-${sufijo}`, 'Sede B2');
    });

    it('sin verificar, dos organizaciones pueden declarar el mismo código', async () => {
      const a = await regulatorio(orgA);
      await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(a.rowVersion))
        .send({ snisCode: codigo })
        .expect(200);
      const b = await regulatorio(orgB, sedeB);
      const res = await http()
        .patch(`/sites/${sedeB}/regulatory`)
        .set(como(orgB))
        .set(ifMatch(b.rowVersion))
        .send({ snisCode: codigo })
        .expect(200);
      expect(res.body).toMatchObject({ snisCode: codigo, snisVerified: false });
    });

    it('el tenant no puede verificar; un usuario sin rol de plataforma recibe 403', async () => {
      await http()
        .post(`/sites/${orgA.siteId}/snis-verification`)
        .set(como(orgA))
        .expect(403);
      expect((await regulatorio(orgA)).snisVerified).toBe(false);
    });

    it('la plataforma verifica con el tenant en contexto; queda persistido con quién y cuándo', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/snis-verification`)
        .set(comoPlataforma(orgA))
        .expect(200);
      expect(res.body).toMatchObject({ snisCode: codigo, snisVerified: true });
      const [fila] = await filas(
        'select snis_verified_at, snis_verified_by_user_id from practice.practice_sites where id = ?',
        [orgA.siteId],
      );
      expect(fila.snis_verified_at).not.toBeNull();
      expect(fila.snis_verified_by_user_id).toBe(ctx.adminUserId);
      expect((await regulatorio(orgA)).snisVerified).toBe(true);
      // Sin tenant de la sede en contexto, ni la plataforma la ve.
      await http()
        .post(`/sites/${orgA.siteId}/snis-verification`)
        .set(comoPlataforma(orgB))
        .expect(404);
    });

    it('desde que A lo verificó, otra sede de B que quiera el mismo código recibe un 409 genérico', async () => {
      const b2 = await regulatorio(orgB, sedeB2);
      const res = await http()
        .patch(`/sites/${sedeB2}/regulatory`)
        .set(como(orgB))
        .set(ifMatch(b2.rowVersion))
        .send({ snisCode: codigo })
        .expect(409);
      expect(res.body.reason).toBe('SNIS_CODE_UNAVAILABLE');
      // No dice de quién es ni si existe: ningún dato de A en el cuerpo.
      const cuerpo = JSON.stringify(res.body);
      expect(cuerpo).not.toContain(orgA.siteId);
      expect(cuerpo).not.toContain(orgA.tenantId);
      expect(res.body.details).toBeUndefined();
      // Un código que nadie tiene sigue disponible; y la respuesta de «no existe» es indistinguible.
      const libre = await http()
        .patch(`/sites/${sedeB2}/regulatory`)
        .set(como(orgB))
        .set(ifMatch(b2.rowVersion))
        .send({ snisCode: `LIBRE-${sufijo}` })
        .expect(200);
      expect(libre.body.snisCode).toBe(`LIBRE-${sufijo}`);
    });

    it('dos sedes de la misma organización no repiten código', async () => {
      const b2 = await regulatorio(orgB, sedeB2);
      const res = await http()
        .patch(`/sites/${sedeB2}/regulatory`)
        .set(como(orgB))
        .set(ifMatch(b2.rowVersion))
        .send({ snisCode: codigo })
        .expect(409);
      expect(res.body.reason).toBe('SNIS_CODE_UNAVAILABLE');
    });

    it('cambiar el código borra la verificación', async () => {
      const a = await regulatorio(orgA);
      const res = await http()
        .patch(`/sites/${orgA.siteId}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(a.rowVersion))
        .send({ snisCode: `NUEVO-${sufijo}` })
        .expect(200);
      expect(res.body).toMatchObject({
        snisCode: `NUEVO-${sufijo}`,
        snisVerified: false,
      });
      const [fila] = await filas(
        'select snis_verified_at, snis_verified_by_user_id from practice.practice_sites where id = ?',
        [orgA.siteId],
      );
      expect(fila.snis_verified_at).toBeNull();
      expect(fila.snis_verified_by_user_id).toBeNull();
      expect((await regulatorio(orgA)).snisVerified).toBe(false);
    });

    it('verificar una sede sin código responde 422', async () => {
      await http()
        .post(`/sites/${sedeB2}/snis-verification`)
        .set(comoPlataforma(orgB))
        .expect(200);
      const sinCodigo = await sede(orgB, `F1R-SEDE-B3-${sufijo}`, 'Sede B3');
      const res = await http()
        .post(`/sites/${sinCodigo}/snis-verification`)
        .set(comoPlataforma(orgB))
        .expect(422);
      expect(res.body.reason).toBe('SNIS_CODE_MISSING');
    });
  });

  // ------------------------------------------------------- habilitaciones
  describe('habilitaciones', () => {
    it('una habilitación vigente con vencimiento de ayer se lee LIC_EXPIRED aunque se guardó LIC_VALID', async () => {
      const ayer = new Date(Date.now() - 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const creada = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({
          authorityName: 'SEDES Santa Cruz',
          resolutionNumber: `RES-${sufijo}-1`,
          issuedOn: '2024-01-10',
          expiresOn: ayer,
          status: 'LIC_VALID',
        })
        .expect(201);
      expect(creada.body).toMatchObject({
        resolutionNumber: `RES-${sufijo}-1`,
        authorityName: 'SEDES Santa Cruz',
        status: { code: 'LIC_EXPIRED' },
        storedStatus: { code: 'LIC_VALID' },
      });
      const lista = await http()
        .get(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .expect(200);
      expect(lista.body.map((l: any) => l.id)).toContain(creada.body.id);
      // Quedó en facility_licenses, con el tenant, la sede y el concepto LIC_* tal cual.
      const [fila] = await filas(
        'select tenant_id, practice_site_id, license_number from organization_extensions.facility_licenses where id = ?',
        [creada.body.id],
      );
      expect(fila).toMatchObject({
        tenant_id: orgA.tenantId,
        practice_site_id: orgA.siteId,
        license_number: `RES-${sufijo}-1`,
      });
      // No hay tabla site_licenses.
      const tabla = await filas(
        "select to_regclass('practice.site_licenses') as t",
      );
      expect(tabla[0].t).toBeNull();
    });

    it('una vigente a futuro se lee LIC_VALID; PATCH con If-Match; número repetido 409; vencimiento anterior a la emisión 422', async () => {
      const creada = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({
          authorityName: 'SEDES',
          resolutionNumber: `RES-${sufijo}-2`,
          issuedOn: '2026-01-01',
          expiresOn: '2099-01-01',
          status: 'LIC_VALID',
        })
        .expect(201);
      expect(creada.body.status.code).toBe('LIC_VALID');
      const dup = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({ resolutionNumber: `RES-${sufijo}-2` })
        .expect(409);
      expect(dup.body.reason).toBe('LICENSE_NUMBER_TAKEN');
      const rango = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({
          resolutionNumber: `RES-${sufijo}-3`,
          issuedOn: '2026-05-01',
          expiresOn: '2026-01-01',
        })
        .expect(422);
      expect(rango.body.reason).toBe('VALIDITY_RANGE_INVALID');

      await http()
        .patch(`/site-licenses/${creada.body.id}`)
        .set(como(orgA))
        .send({ status: 'LIC_SUSPENDED' })
        .expect(428);
      await http()
        .patch(`/site-licenses/${creada.body.id}`)
        .set(como(orgA))
        .set(ifMatch(9))
        .send({ status: 'LIC_SUSPENDED' })
        .expect(412);
      const suspendida = await http()
        .patch(`/site-licenses/${creada.body.id}`)
        .set(como(orgA))
        .set(ifMatch(creada.body.rowVersion))
        .send({ status: 'LIC_SUSPENDED' })
        .expect(200);
      expect(suspendida.body).toMatchObject({
        status: { code: 'LIC_SUSPENDED' },
        rowVersion: creada.body.rowVersion + 1,
      });
      // No hay DELETE: la habilitación no se borra.
      await http()
        .delete(`/site-licenses/${creada.body.id}`)
        .set(como(orgA))
        .expect(404);
    });

    it('el alcance por unidad o servicio de otra organización responde 404', async () => {
      const unidadB = (
        await http()
          .post(`/sites/${orgB.siteId}/clinical-units`)
          .set(como(orgB))
          .send({ code: 'UN-B-LIC', name: 'Unidad B' })
          .expect(201)
      ).body;
      const res = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({
          resolutionNumber: `RES-${sufijo}-4`,
          clinicalUnitId: unidadB.id,
        })
        .expect(404);
      expect(res.body.reason).toBe('PRACTICE_RESOURCE_OUT_OF_SCOPE');
      const propia = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(como(orgA))
          .send({ code: 'UN-A-LIC', name: 'Unidad A' })
          .expect(201)
      ).body;
      const ok = await http()
        .post(`/sites/${orgA.siteId}/licenses`)
        .set(como(orgA))
        .send({
          resolutionNumber: `RES-${sufijo}-5`,
          clinicalUnitId: propia.id,
        })
        .expect(201);
      expect(ok.body.clinicalUnitId).toBe(propia.id);
    });

    it('desde A, las habilitaciones de B no se ven ni se editan', async () => {
      const deB = await http()
        .post(`/sites/${orgB.siteId}/licenses`)
        .set(como(orgB))
        .send({ resolutionNumber: `RES-B-${sufijo}` })
        .expect(201);
      await http()
        .patch(`/site-licenses/${deB.body.id}`)
        .set(como(orgA))
        .set(ifMatch(1))
        .send({ status: 'LIC_VALID' })
        .expect(404);
      const [fila] = await filas(
        'select verification_status_concept_id, row_version from organization_extensions.facility_licenses where id = ?',
        [deB.body.id],
      );
      expect(fila.row_version).toBe(1);
    });
  });

  // ----------------------------------------------------------- capacidad
  describe('capacidad declarada vs derivada', () => {
    it('la derivada cuenta camas censables activas (sin contador); la declarada se agrega y la brecha se reporta', async () => {
      const sitio = await sede(
        orgA,
        `F1R-SEDE-CAP-${sufijo}`,
        'Sede capacidad',
      );
      const hab = await espacio(
        orgA,
        {
          code: 'CAP-HAB',
          name: 'Hab',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_INPATIENT_ROOM',
          activate: true,
        },
        sitio,
      );
      const camas: any[] = [];
      for (let i = 1; i <= 3; i += 1) {
        camas.push(
          await espacio(
            orgA,
            {
              code: `CAP-C${i}`,
              name: `Cama ${i}`,
              formCode: 'LOC_FORM_BED',
              functionCode: 'SPACE_FN_BED_STANDARD',
              parentSpaceId: hab.id,
              bedCategoryCode: 'BED_CAT_PRIVATE',
              censable: i < 3,
            },
            sitio,
          ),
        );
      }
      const derivadas = async (): Promise<Record<string, number>> => {
        const res = await http()
          .get(`/sites/${sitio}/capacity`)
          .set(como(orgA))
          .expect(200);
        return Object.fromEntries(
          res.body.derived.map((d: any) => [d.kindCode, d.quantity]),
        );
      };
      // Planificadas: no cuentan.
      expect(await derivadas()).toMatchObject({
        CAP_BEDS_CENSABLE: 0,
        CAP_BEDS_NON_CENSABLE: 0,
      });

      const activar = async (cama: any) =>
        (
          await http()
            .post(`/care-spaces/${cama.id}/lifecycle`)
            .set(como(orgA))
            .set(ifMatch(cama.rowVersion))
            .send({ action: 'activate' })
            .expect(200)
        ).body;
      await activar(camas[0]);
      expect(await derivadas()).toMatchObject({
        CAP_BEDS_CENSABLE: 1,
        CAP_BEDS_NON_CENSABLE: 0,
      });
      await activar(camas[1]);
      await activar(camas[2]);
      expect(await derivadas()).toMatchObject({
        CAP_BEDS_CENSABLE: 2,
        CAP_BEDS_NON_CENSABLE: 1,
      });

      // La ficha de la habitación deriva lo mismo.
      const ficha = await http()
        .get(`/care-spaces/${hab.id}`)
        .set(como(orgA))
        .expect(200);
      expect(ficha.body.derived).toEqual({
        beds: 3,
        censableBeds: 2,
        activeChildren: 3,
      });

      const sinDeclarar = await http()
        .get(`/sites/${sitio}/capacity`)
        .set(como(orgA))
        .expect(200);
      expect(sinDeclarar.body.declared).toEqual([]);
      expect(sinDeclarar.body.gaps).toEqual([]);

      const decl = await http()
        .post(`/sites/${sitio}/declared-capacities`)
        .set(como(orgA))
        .send({
          capacityKindCode: 'CAP_BEDS_CENSABLE',
          quantity: 50,
          asOf: '2026-09-01',
          resolutionNumber: 'RES-CAP-1',
        })
        .expect(201);
      expect(decl.body).toMatchObject({
        kindCode: 'CAP_BEDS_CENSABLE',
        quantity: 50,
        asOf: '2026-09-01',
      });
      const cap = await http()
        .get(`/sites/${sitio}/capacity`)
        .set(como(orgA))
        .expect(200);
      expect(cap.body.declared).toEqual([
        {
          kindCode: 'CAP_BEDS_CENSABLE',
          quantity: 50,
          asOf: '2026-09-01',
          resolutionNumber: 'RES-CAP-1',
        },
      ]);
      expect(cap.body.gaps).toEqual([
        { kindCode: 'CAP_BEDS_CENSABLE', declared: 50, derived: 2 },
      ]);

      // Una declaración posterior no sobrescribe: vale la más reciente y la vieja sigue en la tabla.
      await http()
        .post(`/sites/${sitio}/declared-capacities`)
        .set(como(orgA))
        .send({
          capacityKindCode: 'CAP_BEDS_CENSABLE',
          quantity: 2,
          asOf: '2026-10-01',
        })
        .expect(201);
      const despues = await http()
        .get(`/sites/${sitio}/capacity`)
        .set(como(orgA))
        .expect(200);
      expect(despues.body.declared[0].quantity).toBe(2);
      expect(despues.body.gaps).toEqual([]);
      const [{ n }] = await filas(
        'select count(*)::int as n from practice.site_declared_capacities where practice_site_id = ?',
        [sitio],
      );
      expect(n).toBe(2);
      // Mueve un contador sin tocarlo: retirar una cama baja la derivada.
      const c0 = (
        await http()
          .get(`/care-spaces/${camas[0].id}`)
          .set(como(orgA))
          .expect(200)
      ).body;
      await http()
        .post(`/care-spaces/${camas[0].id}/lifecycle`)
        .set(como(orgA))
        .set(ifMatch(c0.rowVersion))
        .send({ action: 'retire', reason: 'Baja' })
        .expect(200);
      expect(await derivadas()).toMatchObject({ CAP_BEDS_CENSABLE: 1 });
    });

    it('un Hospital de 2.º nivel sin box de emergencias, internación ni quirófano lo advierte, sin bloquear', async () => {
      const sitio = await sede(
        orgA,
        `F1R-SEDE-ADV-${sufijo}`,
        'Sede advertencias',
      );
      const reg = await regulatorio(orgA, sitio);
      await http()
        .patch(`/sites/${sitio}/regulatory`)
        .set(como(orgA))
        .set(ifMatch(reg.rowVersion))
        .send({ typologyCode: 'TYPOLOGY_HOSPITAL_L2' })
        .expect(200);
      const antes = await http()
        .get(`/sites/${sitio}/capacity`)
        .set(como(orgA))
        .expect(200);
      expect(
        antes.body.warnings.map((w: any) => w.functionCode).sort(),
      ).toEqual([
        'SPACE_FN_EMERGENCY_BOX',
        'SPACE_FN_INPATIENT_ROOM',
        'SPACE_FN_OPERATING_ROOM',
      ]);
      await espacio(
        orgA,
        {
          code: 'ADV-BOX',
          name: 'Box',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_EMERGENCY_BOX',
          activate: true,
        },
        sitio,
      );
      const despues = await http()
        .get(`/sites/${sitio}/capacity`)
        .set(como(orgA))
        .expect(200);
      expect(
        despues.body.warnings.map((w: any) => w.functionCode),
      ).not.toContain('SPACE_FN_EMERGENCY_BOX');
    });

    it('tipo de capacidad inválido o declaración de otro tenant', async () => {
      await http()
        .post(`/sites/${orgA.siteId}/declared-capacities`)
        .set(como(orgA))
        .send({ capacityKindCode: 'CAP_NADA', quantity: 1, asOf: '2026-10-01' })
        .expect(422);
      await http()
        .post(`/sites/${orgB.siteId}/declared-capacities`)
        .set(como(orgA))
        .send({
          capacityKindCode: 'CAP_BEDS_CENSABLE',
          quantity: 1,
          asOf: '2026-10-01',
        })
        .expect(404);
    });
  });

  // ------------------------------------------------- administrador de sucursal
  describe('administrador de sucursal (access_scope BRANCH)', () => {
    let b1: string;
    let b2: string;
    let sedeB1: string;
    let sedeB2: string;
    let adminB1: { token: string; tenantId: string };
    let staff: { token: string; tenantId: string };

    async function usuarioConMembresia(
      etiqueta: string,
      cuerpo: Record<string, unknown>,
    ): Promise<{ token: string; tenantId: string }> {
      const email = `f1r-${etiqueta}-${sufijo}@example.test`;
      const user = await http()
        .post('/iam/users')
        .set(bearer(ctx.adminToken))
        .send({ displayName: etiqueta, email, password, initialRole: 'USER' })
        .expect(201);
      await http()
        .post(`/tenants/${orgA.tenantId}/memberships`)
        .set(como(orgA))
        .send({ userId: user.body.id, ...cuerpo })
        .expect(201);
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);
      return { token: login.body.accessToken, tenantId: orgA.tenantId };
    }
    const comoUsuario = (u: { token: string; tenantId: string }) => ({
      ...bearer(u.token),
      'X-Tenant-Id': u.tenantId,
    });

    beforeAll(async () => {
      b1 = (
        await http()
          .post(`/tenants/${orgA.tenantId}/branches`)
          .set(como(orgA))
          .send({ code: `F1R-BR1-${sufijo}`, name: 'Sucursal 1' })
          .expect(201)
      ).body.id;
      b2 = (
        await http()
          .post(`/tenants/${orgA.tenantId}/branches`)
          .set(como(orgA))
          .send({ code: `F1R-BR2-${sufijo}`, name: 'Sucursal 2' })
          .expect(201)
      ).body.id;
      sedeB1 = await sede(
        orgA,
        `F1R-SEDE-S1-${sufijo}`,
        'Sede de la sucursal 1',
        b1,
      );
      sedeB2 = await sede(
        orgA,
        `F1R-SEDE-S2-${sufijo}`,
        'Sede de la sucursal 2',
        b2,
      );
      adminB1 = await usuarioConMembresia('admin-b1', {
        role: 'ADMIN',
        accessScope: 'BRANCH',
        primaryBranchId: b1,
      });
      staff = await usuarioConMembresia('staff', {
        role: 'STAFF',
        accessScope: 'ALL_TENANT',
      });
    });

    it('en su sucursal ve la estructura y puede crear espacios, unidades y moverlos', async () => {
      await http()
        .get(`/sites/${sedeB1}/structure`)
        .set(comoUsuario(adminB1))
        .expect(200);
      const creado = await http()
        .post(`/sites/${sedeB1}/care-spaces`)
        .set(comoUsuario(adminB1))
        .send({ code: 'BR-ESP', name: 'Espacio de la sucursal' })
        .expect(201);
      expect(creado.body.status.code).toBe('SPACE_PLANNED');
      await http()
        .post(`/sites/${sedeB1}/clinical-units`)
        .set(comoUsuario(adminB1))
        .send({ code: 'BR-UN', name: 'Unidad de la sucursal' })
        .expect(201);
      const [fila] = await filas(
        'select created_by_user_id from practice.care_spaces where id = ?',
        [creado.body.id],
      );
      expect(fila.created_by_user_id).not.toBeNull();
    });

    it('la sede de OTRA sucursal responde 404 en lectura y escritura, igual que una inexistente', async () => {
      const lectura = await http()
        .get(`/sites/${sedeB2}/structure`)
        .set(comoUsuario(adminB1))
        .expect(404);
      const inexistente = await http()
        .get(`/sites/${randomUUID()}/structure`)
        .set(comoUsuario(adminB1))
        .expect(404);
      expect(lectura.body.reason).toBe(inexistente.body.reason);
      expect(lectura.body.message).toBe(inexistente.body.message);
      await http()
        .post(`/sites/${sedeB2}/care-spaces`)
        .set(comoUsuario(adminB1))
        .send({ code: 'B2-ESP', name: 'Intruso' })
        .expect(404);
      await http()
        .post(`/sites/${sedeB2}/clinical-units`)
        .set(comoUsuario(adminB1))
        .send({ code: 'B2-UN', name: 'Intruso' })
        .expect(404);
      // La sede de la organización sin sucursal tampoco es suya.
      await http()
        .get(`/sites/${orgA.siteId}/structure`)
        .set(comoUsuario(adminB1))
        .expect(404);
      const [{ n }] = await filas(
        "select count(*)::int as n from practice.care_spaces where practice_site_id = ? and code = 'B2-ESP'",
        [sedeB2],
      );
      expect(n).toBe(0);
    });

    it('un espacio de otra sucursal tampoco se lee ni se edita por id', async () => {
      const ajeno = await espacio(
        orgA,
        { code: 'AJENO-B2', name: 'De la sucursal 2' },
        sedeB2,
      );
      await http()
        .get(`/care-spaces/${ajeno.id}`)
        .set(comoUsuario(adminB1))
        .expect(404);
      await http()
        .patch(`/care-spaces/${ajeno.id}`)
        .set(comoUsuario(adminB1))
        .set(ifMatch(ajeno.rowVersion))
        .send({ name: 'x' })
        .expect(404);
      await http()
        .get(`/care-spaces/${ajeno.id}/retire-check`)
        .set(comoUsuario(adminB1))
        .expect(404);
    });

    it('ve lo regulatorio de su sede pero no lo cambia: 403 (S5), no 404', async () => {
      const reg = (
        await http()
          .get(`/sites/${sedeB1}/regulatory`)
          .set(comoUsuario(adminB1))
          .expect(200)
      ).body;
      const res = await http()
        .patch(`/sites/${sedeB1}/regulatory`)
        .set(comoUsuario(adminB1))
        .set(ifMatch(reg.rowVersion))
        .send({ municipalityName: 'Intento' })
        .expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
      await http()
        .post(`/sites/${sedeB1}/licenses`)
        .set(comoUsuario(adminB1))
        .send({ resolutionNumber: 'BR-LIC' })
        .expect(403);
      await http()
        .post(`/sites/${sedeB1}/declared-capacities`)
        .set(comoUsuario(adminB1))
        .send({
          capacityKindCode: 'CAP_BEDS_CENSABLE',
          quantity: 1,
          asOf: '2026-10-01',
        })
        .expect(403);
      expect(
        (
          await http()
            .get(`/sites/${sedeB1}/regulatory`)
            .set(comoUsuario(adminB1))
            .expect(200)
        ).body.municipalityName,
      ).toBeNull();
    });

    it('un miembro STAFF con alcance a todo el tenant lee la estructura y no escribe (403)', async () => {
      await http()
        .get(`/sites/${orgA.siteId}/structure`)
        .set(comoUsuario(staff))
        .expect(200);
      const res = await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(comoUsuario(staff))
        .send({ code: 'STAFF-ESP', name: 'No debería' })
        .expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
      await http()
        .post(`/sites/${orgA.siteId}/clinical-units`)
        .set(comoUsuario(staff))
        .send({ code: 'STAFF-UN', name: 'No debería' })
        .expect(403);
    });

    it('el OWNER de la organización sigue viendo y escribiendo todas las sucursales', async () => {
      await http()
        .get(`/sites/${sedeB2}/structure`)
        .set(como(orgA))
        .expect(200);
      await http()
        .post(`/sites/${sedeB2}/care-spaces`)
        .set(como(orgA))
        .send({ code: 'OWNER-ESP', name: 'Del dueño' })
        .expect(201);
    });
  });
});
