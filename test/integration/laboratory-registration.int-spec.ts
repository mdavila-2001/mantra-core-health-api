import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService } from '../../src/common';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { Branches, Tenants } from '../../src/modules/directory/entities';
import { PracticeSites } from '../../src/modules/practice/entities';
import {
  DiagnosticUnits,
  DiagnosticUnitSites,
  DiagnosticStudyOfferings,
} from '../../src/modules/diagnostic_units/entities';

/**
 * P51 · alta pública de laboratorio (`/auth/register/laboratory` del front)
 * contra la API real.
 *
 * El cuerpo se arma **como lo arma el front** (`RegisterLaboratory.datos()` +
 * `IamClient.registerLaboratoryOrganization`): los cuatro conceptos (tipo de
 * unidad, modalidad, país y jurisdicción) se leen por código de los
 * `GET /system-context/dynamic-enums` públicos, no se importan de las
 * constantes del servidor. Si el catálogo dejara de publicarlos, el alta del
 * front no podría armarse y esta suite lo diría.
 *
 * Datos sintéticos: razones sociales, NIT, nombres y correos inventados
 * (`@example.test`), marcados con un sufijo aleatorio por corrida.
 */
describe('P51 · alta de laboratorio contra la API real (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());

  /** Código de concepto → id, por destino, como `DiagnosisCenterEnrollment.catalogs()`. */
  let catalogos: Record<
    'tipoDeUnidad' | 'modalidad' | 'pais' | 'jurisdiccion',
    Map<string, string>
  >;

  async function porCodigo(target: string): Promise<Map<string, string>> {
    const res = await http()
      .get('/system-context/dynamic-enums')
      .query({ target })
      .expect(200);
    return new Map(
      (res.body.options as { code: string; conceptId: string }[]).map((o) => [
        o.code,
        o.conceptId,
      ]),
    );
  }

  function concepto(mapa: Map<string, string>, codigo: string): string {
    const id = mapa.get(codigo);
    if (id === undefined) throw new Error(`El catálogo no publica ${codigo}`);
    return id;
  }

  /** El cuerpo del front, con las sucursales de la carga en lote. */
  function cuerpoDelFront(
    sufijo: string,
    opciones: {
      legalEntityType?: string;
      sinTipo?: boolean;
      tipo?: string;
      locationUrl?: string;
      idNumber?: string | null;
    } = {},
  ) {
    const nit = `${Date.now() % 1_000_000}${sufijo.length}`;
    const legalName = `Laboratorio ${sufijo} ${marca} S.R.L.`;
    const representante: Record<string, unknown> = {
      fullName: 'Lucía Vargas Antelo',
      email: `p51-rep-${sufijo}-${marca}@example.test`,
    };
    if (opciones.idNumber !== null) {
      representante.idNumber = opciones.idNumber ?? '7654321 SC';
    }
    return {
      organization: {
        code: `LAB-${nit}${sufijo}${marca}`.slice(0, 60),
        legalName,
        legalEntityType: opciones.legalEntityType ?? 'UNIPERSONAL',
        tenantType: 'DIAGNOSTIC_CENTER',
        countryConceptId: concepto(catalogos.pais, 'BO'),
        jurisdictionConceptId: concepto(
          catalogos.jurisdiccion,
          'JURISDICTION_NATIONAL',
        ),
        diagnosticUnit: {
          name: legalName,
          ...(opciones.sinTipo
            ? {}
            : {
                diagnosticUnitTypeConceptId:
                  opciones.tipo ??
                  concepto(catalogos.tipoDeUnidad, 'DU_TYPE_LAB'),
              }),
          modalityConceptIds: [
            concepto(catalogos.modalidad, 'DU_MODALITY_LAB'),
          ],
          primarySite: {
            name: 'Casa central',
            address: {
              lines: ['Av. Cañoto 456'],
              latitude: -17.7833,
              longitude: -63.1821,
            },
          },
          branches: [
            {
              name: 'Sucursal Equipetrol',
              address: {
                lines: ['Calle 9 Oeste 12'],
                latitude: -17.7652,
                longitude: -63.1961,
              },
              description: 'Toma de muestras de 7 a 11',
              locationUrl:
                opciones.locationUrl ??
                'https://www.google.com/maps?q=-17.7652,-63.1961',
            },
            { name: 'Sucursal Plan 3000', address: { lines: [] } },
          ],
        },
        legalRepresentative: representante,
      },
      owner: {
        email: `p51-${sufijo}-${marca}@example.test`,
        password: 'S3cret-passw0rd',
        displayName: 'Lucía Vargas Antelo',
      },
    };
  }

  async function tokenDelOwner(ownerUserId: string, tenantId: string) {
    const sid = `p51-${ownerUserId}`;
    await ensureTestSession(ctx.orm, ownerUserId, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(ownerUserId, sid, ['USER'], [tenantId]);
  }

  async function cuentasConCorreo(email: string): Promise<number> {
    const filas = await ctx.orm.em
      .fork()
      .getConnection()
      .execute<{ id: string }[]>(
        `select c.user_id as id from iam.authentication_credentials c where c.external_subject = ?`,
        [email],
      );
    return filas.length;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    catalogos = {
      tipoDeUnidad: await porCodigo(
        'diagnostic_units.diagnostic_units.diagnostic_unit_type_concept_id',
      ),
      modalidad: await porCodigo(
        'diagnostic_units.diagnostic_study_offerings.modality_concept_id',
      ),
      pais: await porCodigo('directory.tenants.country_concept_id'),
      jurisdiccion: await porCodigo(
        'profiles.jurisdiction_authorizations.jurisdiction_concept_id',
      ),
    };
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('los catálogos públicos traen los cuatro conceptos que el front resuelve por código', () => {
    expect(catalogos.tipoDeUnidad.get('DU_TYPE_LAB')).toBe(
      DUNIT.UNIT_TYPE_LABORATORY,
    );
    expect(catalogos.modalidad.get('DU_MODALITY_LAB')).toBe(
      DUNIT.MODALITY_LABORATORY,
    );
    expect(catalogos.pais.get('BO')).toBe(CONCEPTS.COUNTRY_BO);
    expect(catalogos.jurisdiccion.get('JURISDICTION_NATIONAL')).toEqual(
      expect.any(String),
    );
  });

  it('el cuerpo del front → 201: unidad de laboratorio, central y dos sucursales como sedes y como directory.branches', async () => {
    const cuerpo = cuerpoDelFront('OK');
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    expect(res.body.diagnosticUnitId).toEqual(expect.any(String));

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.tenantTypeConceptId).toBe(
      CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
    );

    const unit = await em.findOneOrFail(DiagnosticUnits, {
      id: res.body.diagnosticUnitId,
    });
    expect(unit.diagnosticUnitTypeConceptId).toBe(DUNIT.UNIT_TYPE_LABORATORY);
    expect(unit.verificationStatusConceptId).toBe(DUNIT.VERIFICATION_PENDING);

    const unitSites = await em.find(DiagnosticUnitSites, {
      diagnosticUnitId: unit.id,
    });
    expect(unitSites).toHaveLength(3);
    expect(
      unitSites.filter((s) => s.siteRoleConceptId === DUNIT.SITE_ROLE_PRIMARY),
    ).toHaveLength(1);
    expect(
      unitSites.filter(
        (s) => s.siteRoleConceptId === DUNIT.SITE_ROLE_COLLECTION,
      ),
    ).toHaveLength(2);
    expect(unitSites.every((s) => s.sampleCollectionAvailable === true)).toBe(
      true,
    );

    const sedes = await em.find(PracticeSites, { practiceId: unit.practiceId });
    expect(sedes.map((s) => s.name).sort()).toEqual(
      ['Casa central', 'Sucursal Equipetrol', 'Sucursal Plan 3000'].sort(),
    );

    const ofertas = await em.find(DiagnosticStudyOfferings, {
      diagnosticUnitId: unit.id,
    });
    expect(ofertas.map((o) => o.modalityConceptId)).toEqual([
      DUNIT.MODALITY_LABORATORY,
    ]);

    const sucursales = await em.find(
      Branches,
      { tenantId: res.body.tenantId },
      { orderBy: { code: 'asc' } },
    );
    expect(
      sucursales.map((b) => ({
        code: b.code,
        name: b.name,
        description: b.description ?? null,
        locationUrl: b.locationUrl ?? null,
      })),
    ).toEqual([
      {
        code: 'CASA-CENTRAL',
        name: 'Casa central',
        description: null,
        locationUrl: null,
      },
      {
        code: 'SUCURSAL-EQUIPETROL',
        name: 'Sucursal Equipetrol',
        description: 'Toma de muestras de 7 a 11',
        locationUrl: 'https://www.google.com/maps?q=-17.7652,-63.1961',
      },
      {
        code: 'SUCURSAL-PLAN-3000',
        name: 'Sucursal Plan 3000',
        description: null,
        locationUrl: null,
      },
    ]);
    const equipetrol = sucursales.find((b) => b.code === 'SUCURSAL-EQUIPETROL');
    expect(Number(equipetrol!.latitude)).toBeCloseTo(-17.7652, 4);
    expect(Number(equipetrol!.longitude)).toBeCloseTo(-63.1961, 4);
  });

  it('la pestaña Sucursales (GET /tenants/{id}/branches) las lista para su owner; 403 para otra organización; 401 sin sesión', async () => {
    const propia = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpoDelFront('LISTA'))
      .expect(201);
    creados.push({
      userId: propia.body.ownerUserId,
      tenantId: propia.body.tenantId,
    });
    const ajena = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpoDelFront('AJENA'))
      .expect(201);
    creados.push({
      userId: ajena.body.ownerUserId,
      tenantId: ajena.body.tenantId,
    });
    const ruta = `/tenants/${propia.body.tenantId}/branches`;

    const token = await tokenDelOwner(
      propia.body.ownerUserId,
      propia.body.tenantId,
    );
    const lista = await http().get(ruta).set(bearer(token)).expect(200);
    const filas = (
      Array.isArray(lista.body) ? lista.body : lista.body.items
    ) as { name: string; description?: string; locationUrl?: string }[];
    const equipetrol = filas.find((b) => b.name === 'Sucursal Equipetrol');
    expect(equipetrol).toMatchObject({
      description: 'Toma de muestras de 7 a 11',
      locationUrl: 'https://www.google.com/maps?q=-17.7652,-63.1961',
    });
    expect(filas).toHaveLength(3);

    const tokenAjeno = await tokenDelOwner(
      ajena.body.ownerUserId,
      ajena.body.tenantId,
    );
    await http().get(ruta).set(bearer(tokenAjeno)).expect(403);
    await http().get(ruta).expect(401);
  });

  it('sin diagnosticUnitTypeConceptId, con la modalidad de laboratorio → unidad de laboratorio (D-1), no de imágenes', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpoDelFront('SINTIPO', { sinTipo: true }))
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const unit = await ctx.orm.em
      .fork()
      .findOneOrFail(DiagnosticUnits, { id: res.body.diagnosticUnitId });
    expect(unit.diagnosticUnitTypeConceptId).toBe(DUNIT.UNIT_TYPE_LABORATORY);
  });

  it('un locationUrl que no es http(s) → 400 y no queda ninguna cuenta', async () => {
    const cuerpo = cuerpoDelFront('URL', {
      locationUrl: 'javascript:alert(1)',
    });
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(400);
    expect(JSON.stringify(res.body)).toContain('locationUrl');
    expect(await cuentasConCorreo(cuerpo.owner.email)).toBe(0);
  });

  it('sucursales en una unidad de imágenes declarada → 422 y no queda ninguna cuenta', async () => {
    const cuerpo = cuerpoDelFront('IMG', {
      tipo: concepto(catalogos.tipoDeUnidad, 'DU_TYPE_IMAGING'),
    });
    await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(422);
    expect(await cuentasConCorreo(cuerpo.owner.email)).toBe(0);
  });

  it('una S.R.L. sin poder notariado del representante → 422 nombrando el documento (D-3)', async () => {
    const cuerpo = cuerpoDelFront('PODER', { legalEntityType: 'SRL' });
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(422);
    expect(res.body.details).toMatchObject({
      document: 'powerOfAttorneyFileId',
    });
    expect(await cuentasConCorreo(cuerpo.owner.email)).toBe(0);
  });

  it('el representante sin cédula → 400 (D-3: idNumber obligatorio)', async () => {
    const cuerpo = cuerpoDelFront('CI', { idNumber: null });
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(400);
    expect(JSON.stringify(res.body)).toContain('idNumber');
  });
});
