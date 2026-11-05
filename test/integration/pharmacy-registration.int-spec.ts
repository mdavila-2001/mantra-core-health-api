import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';
import {
  assertPermanentResidueTarget,
  resolveResetTarget,
} from './disposable-database';
import { CONCEPTS, TokenService } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import {
  Branches,
  TenantAffiliationDocuments,
  Tenants,
} from '../../src/modules/directory/entities';
import {
  Pharmacies,
  PharmacyProductCategories,
  PharmacySites,
} from '../../src/modules/pharmacy/entities';
import { Practices, PracticeSites } from '../../src/modules/practice/entities';
import { Addresses } from '../../src/modules/common/entities';

/**
 * P50 · alta pública de farmacia de punta a punta contra la base real.
 *
 * 1. El cuerpo exacto que arma `IamClient.registerPharmacyOrganization` del
 *    front (con `taxIdentifier` y representante sin poder) da 201 y deja, en
 *    una transacción, la farmacia en borrador, su práctica, la casa central y
 *    la sucursal como sedes físicas y dispensadoras, y la central enlazada.
 * 2. `pharmacy` con otro tipo de organización → 422.
 * 3. La plataforma no puede verificar una farmacia sin sus papeles (422 con lo
 *    que falta); otra organización no puede completarlos (403); el owner sí,
 *    y entonces la verificación la activa y deja los papeles VERIFICADO.
 */
describe('P50 · alta pública de farmacia (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8).toUpperCase();
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  const PDF = Buffer.from('%PDF-1.7\nP50 farmacia\n');

  /** Sube un PDF anónimo y devuelve su `fileId`. */
  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    return res.body.fileId as string;
  }

  /** Token de sesión del owner: membresía OWNER, rol global `USER`. */
  async function tokenDelOwner(ownerUserId: string, tenantId: string) {
    const sid = `p50-${ownerUserId}`;
    await ensureTestSession(ctx.orm, ownerUserId, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(ownerUserId, sid, ['USER'], [tenantId]);
  }

  /** El cuerpo que arma el front (datos sintéticos). */
  function cuerpoDelFront(
    sufijo: string,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    const nit = `${sufijo}${marca}`.replace(/[^A-Z0-9]/g, '');
    return {
      organization: {
        code: `FARM-${nit}`,
        legalName: `Farmacia Sintética ${sufijo} ${marca} S.R.L.`,
        taxIdentifier: nit,
        legalEntityType: 'SRL',
        tenantType: 'PHARMACY',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        legalRepresentative: {
          fullName: 'Mariana Siles Justiniano',
          email: `p50-${sufijo.toLowerCase()}-${marca.toLowerCase()}@example.test`,
          idNumber: '4872190 SC',
        },
        pharmacy: {
          address: 'Av. Cristo Redentor 1234',
          latitude: -17.7833,
          longitude: -63.1821,
          branches: [
            {
              name: 'Sucursal Equipetrol',
              latitude: -17.7651,
              longitude: -63.1964,
              description: 'Frente a la plaza',
            },
          ],
        },
        ...extra,
      },
      owner: {
        email: `p50-${sufijo.toLowerCase()}-${marca.toLowerCase()}@example.test`,
        password: 'S3cret-passw0rd',
        displayName: 'Mariana Siles Justiniano',
      },
    };
  }

  async function registrar(
    sufijo: string,
    extra: Record<string, unknown> = {},
  ) {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpoDelFront(sufijo, extra))
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    return res.body as {
      tenantId: string;
      ownerUserId: string;
      pharmacyId: string;
      legalDocumentsRegistered?: number;
    };
  }

  beforeAll(async () => {
    // Completar papeles y verificar son rutas `@Audited`: dejan filas en
    // `audit.audit_log` (WORM) que nombran al tenant, y ese tenant ya no se
    // puede borrar. Igual que lane16: sólo contra una base descartable.
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    // Limpieza de mejor esfuerzo, una organización por vez: la que quedó
    // fijada por la bitácora WORM se informa como residuo y no rompe la suite;
    // cualquier otro fallo de limpieza sí.
    const residuo: string[] = [];
    for (const fixture of creados) {
      try {
        await deleteRegisteredOrganizations([fixture]);
      } catch (error) {
        if (!String(error).includes('audit_log')) throw error;
        residuo.push(fixture.tenantId);
      }
    }
    if (residuo.length > 0) {
      console.warn(
        `P50: ${residuo.length} organización(es) sintética(s) quedan fijadas por audit.audit_log: ${residuo.join(', ')}`,
      );
    }
  });

  it('escenario 1 · el cuerpo del front → 201 con farmacia, central enlazada y sucursal', async () => {
    const alta = await registrar('ALTA');
    expect(alta.pharmacyId).toEqual(expect.any(String));

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: alta.tenantId });
    expect(tenant.tenantTypeConceptId).toBe(CONCEPTS.TENANT_TYPE_PHARMACY);
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);

    const pharmacy = await em.findOneOrFail(Pharmacies, {
      id: alta.pharmacyId,
    });
    expect(pharmacy.tenantId).toBe(alta.tenantId);
    expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_DRAFT);
    expect(pharmacy.verificationStatusConceptId).toBe(
      PHARM.VERIFICATION_PENDING,
    );
    expect(pharmacy.primaryPracticeSiteId).toEqual(expect.any(String));

    // P47: la farmacia nueva nace con las seis categorías por defecto.
    expect(
      await em.count(PharmacyProductCategories, { pharmacyId: pharmacy.id }),
    ).toBe(6);

    const central = await em.findOneOrFail(PracticeSites, {
      id: pharmacy.primaryPracticeSiteId!,
    });
    expect(central.name).toBe('Casa central');
    const practice = await em.findOneOrFail(Practices, {
      id: central.practiceId,
    });
    expect(practice.typeConceptId).toBe(PRAC.PRACTICE_TYPE_PHARMACY);
    expect(practice.adminUserId).toBe(alta.ownerUserId);
    const address = await em.findOneOrFail(Addresses, {
      id: central.addressId!,
    });
    expect(address.lines).toBe('Av. Cristo Redentor 1234');
    expect(Number(address.latitude)).toBeCloseTo(-17.7833, 4);

    const sites = await em.find(
      PharmacySites,
      { pharmacyId: pharmacy.id },
      { orderBy: { code: 'asc' } },
    );
    expect(sites.map((s) => s.code)).toEqual([
      'CASA-CENTRAL',
      'SUCURSAL-EQUIPETROL',
    ]);
    expect(sites[0].practiceSiteId).toBe(central.id);
    expect(sites.every((s) => s.statusConceptId === PHARM.SITE_ACTIVE)).toBe(
      true,
    );

    // El portal de la organización sigue viendo la central y la sucursal.
    const branches = await em.find(Branches, { tenantId: alta.tenantId });
    expect(branches.map((b) => b.name).sort()).toEqual([
      'Casa central',
      'Sucursal Equipetrol',
    ]);
  });

  it('escenario 2 · el bloque pharmacy con otro tipo de organización → 422, sin cuenta', async () => {
    const cuerpo = cuerpoDelFront('MAL', { tenantType: 'HOSPITAL' });
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(422);
    expect(JSON.stringify(res.body)).toContain('`pharmacy`');

    const em = ctx.orm.em.fork();
    const tenant = await em.findOne(Tenants, {
      code: (cuerpo.organization as { code: string }).code,
    });
    expect(tenant).toBeNull();
  });

  it('escenario 3 · sin papeles no opera; otra organización no los completa; el owner sí y la verificación la activa', async () => {
    const propia = await registrar('OPERA');
    const ajena = await registrar('AJENA');
    const tokenPropio = await tokenDelOwner(
      propia.ownerUserId,
      propia.tenantId,
    );
    const tokenAjeno = await tokenDelOwner(ajena.ownerUserId, ajena.tenantId);

    // 3.1) La plataforma no puede verificarla: faltan los seis papeles.
    const rechazo = await http()
      .post(`/admin/tenants/${propia.tenantId}/verification`)
      .set(bearer(ctx.adminToken))
      .send({})
      .expect(422);
    expect(JSON.stringify(rechazo.body)).toContain('HEALTH_AUTHORITY_CERT_DOC');
    let em = ctx.orm.em.fork();
    expect(
      (await em.findOneOrFail(Pharmacies, { id: propia.pharmacyId }))
        .statusConceptId,
    ).toBe(PHARM.PHARMACY_DRAFT);

    // 3.2) La lectura de requisitos: el owner la ve, otra organización no.
    const lectura = await http()
      .get(`/tenants/${propia.tenantId}/pharmacy-readiness`)
      .set(bearer(tokenPropio))
      .expect(200);
    expect(lectura.body).toEqual({
      ready: false,
      missing: [
        'CONSTITUTION_DOC',
        'TAX_IDENTIFIER_DOC',
        'COMMERCE_REGISTRY_DOC',
        'OPERATING_LICENSE_DOC',
        'HEALTH_AUTHORITY_CERT_DOC',
        'POWER_OF_ATTORNEY_DOC',
      ],
    });
    await http()
      .get(`/tenants/${propia.tenantId}/pharmacy-readiness`)
      .set(bearer(tokenAjeno))
      .expect(403);

    // 3.3) Negativo de autorización: otra organización no le sube papeles.
    const sedesAjeno = await subirPdf('sedes-ajeno.pdf');
    await http()
      .post(`/tenants/${propia.tenantId}/affiliation-documents`)
      .set(bearer(tokenAjeno))
      .send({ healthAuthorityCertificateFileId: sedesAjeno })
      .expect(403);
    em = ctx.orm.em.fork();
    expect(
      await em.count(TenantAffiliationDocuments, { tenantId: propia.tenantId }),
    ).toBe(0);

    // 3.3b) Revisión de seguridad: un rol de plataforma acotado a OTRA
    // organización (`scopedRoles`) no administra ésta, y un tenant que no
    // existe responde 403 a quien no tiene permiso (no 404).
    const sidAcotado = `p50-scoped-${ajena.ownerUserId}`;
    await ensureTestSession(ctx.orm, ajena.ownerUserId, sidAcotado);
    const tokenAcotado = ctx.app
      .get(TokenService)
      .signAccessToken(
        ajena.ownerUserId,
        sidAcotado,
        ['USER', 'SECURITY_ADMIN'],
        [ajena.tenantId],
        { scopedRoles: { [ajena.tenantId]: ['SECURITY_ADMIN'] } },
      );
    await http()
      .post(`/tenants/${propia.tenantId}/affiliation-documents`)
      .set(bearer(tokenAcotado))
      .send({ healthAuthorityCertificateFileId: sedesAjeno })
      .expect(403);
    const inexistente = randomUUID();
    await http()
      .post(`/tenants/${inexistente}/affiliation-documents`)
      .set(bearer(tokenAjeno))
      .send({ healthAuthorityCertificateFileId: sedesAjeno })
      .expect(403);
    await http()
      .get(`/tenants/${inexistente}/pharmacy-readiness`)
      .set(bearer(tokenAjeno))
      .expect(403);

    // 3.4) El owner completa los seis papeles.
    const papeles = {
      constitutionFileId: await subirPdf('escritura.pdf'),
      taxIdentifierFileId: await subirPdf('nit.pdf'),
      commerceRegistryFileId: await subirPdf('seprec.pdf'),
      operatingLicenseFileId: await subirPdf('licencia.pdf'),
      healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
      powerOfAttorneyFileId: await subirPdf('poder.pdf'),
      taxIdentifier: '1023456029',
    };
    const completado = await http()
      .post(`/tenants/${propia.tenantId}/affiliation-documents`)
      .set(bearer(tokenPropio))
      .send(papeles)
      .expect(201);
    expect(completado.body.registered).toBe(6);

    // 3.5) Repetir un papel ya presentado es 409.
    await http()
      .post(`/tenants/${propia.tenantId}/affiliation-documents`)
      .set(bearer(tokenPropio))
      .send({ healthAuthorityCertificateFileId: await subirPdf('sedes-2.pdf') })
      .expect(409);

    const lista = await http()
      .get(`/tenants/${propia.tenantId}/pharmacy-readiness`)
      .set(bearer(tokenPropio))
      .expect(200);
    expect(lista.body).toEqual({ ready: true, missing: [] });

    // 3.6) Ahora sí: la verificación activa la farmacia y atestigua los papeles.
    await http()
      .post(`/admin/tenants/${propia.tenantId}/verification`)
      .set(bearer(ctx.adminToken))
      .send({})
      .expect(200);

    em = ctx.orm.em.fork();
    const activa = await em.findOneOrFail(Pharmacies, {
      id: propia.pharmacyId,
    });
    expect(activa.statusConceptId).toBe(PHARM.PHARMACY_ACTIVE);
    expect(activa.verificationStatusConceptId).toBe(
      PHARM.VERIFICATION_VERIFIED,
    );
    const docs = await em.find(TenantAffiliationDocuments, {
      tenantId: propia.tenantId,
    });
    expect(docs).toHaveLength(6);
    expect(docs.every((d) => d.verifiedByUserId !== undefined)).toBe(true);
    expect(docs.every((d) => d.verifiedAt instanceof Date)).toBe(true);
    const nit = docs.find(
      (d) => d.documentNumber !== undefined && d.documentNumber !== null,
    );
    expect(nit?.documentNumber).toBe('1023456029');
  });
});
