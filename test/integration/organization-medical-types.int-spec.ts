import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  DIR,
  type TenantTypeCode,
} from '../../src/modules/directory/directory.concepts';
import {
  TenantAffiliationDocuments,
  TenantMemberships,
  Tenants,
} from '../../src/modules/directory/entities';
import { AuthenticationCredentials } from '../../src/modules/iam/entities';

/**
 * Alta pública de una organización médica por cada tipo institucional de
 * salud: hospital, clínica, consultorio, enfermería y otra institución.
 *
 * Por tipo, tres casos contra la API y la base reales: el correcto (201 y lo
 * persistido), uno de borde (el valor exacto que la validación admite) y uno
 * de error (4xx con su código y **nada** escrito). `CLINIC` es el código que
 * faltaba: antes de existir, el alta de una clínica era un 400 del DTO.
 */
describe('Alta de organización médica por tipo institucional (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  const PDF = Buffer.from('%PDF-1.7\norganizacion medica\n');

  const CONCEPTO_POR_TIPO: Readonly<Record<string, string>> = {
    HOSPITAL: CONCEPTS.TENANT_TYPE_HOSPITAL,
    CLINIC: CONCEPTS.TENANT_TYPE_CLINIC,
    MEDICAL_OFFICE: CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
    NURSING: CONCEPTS.TENANT_TYPE_NURSING,
    HEALTH_OTHER: CONCEPTS.TENANT_TYPE_HEALTH_OTHER,
  };

  /** Sube un PDF anónimo y devuelve su `fileId`. */
  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    return res.body.fileId as string;
  }

  /** El alta completa del formulario público: cinco PDF y el representante con su poder. */
  async function alta(tipo: TenantTypeCode | string, sufijo: string) {
    return {
      organization: {
        code: `OM_${sufijo}_${marca}`,
        legalName: `Organización ${sufijo} ${marca} S.R.L.`,
        tenantType: tipo,
        legalEntityType: 'SRL',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        legalDocuments: {
          constitutionFileId: await subirPdf('escritura.pdf'),
          taxIdentifierFileId: await subirPdf('nit.pdf'),
          commerceRegistryFileId: await subirPdf('seprec.pdf'),
          operatingLicenseFileId: await subirPdf('licencia.pdf'),
          healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
        },
        legalRepresentative: {
          name: 'Mariana',
          lastName: 'Siles',
          idNumber: '4872190 SC',
          email: `om-legal-${sufijo.toLowerCase()}-${marca}@example.test`,
          powerOfAttorneyFileId: await subirPdf('poder.pdf'),
        },
      } as Record<string, any>,
      owner: {
        email: `om-${sufijo.toLowerCase()}-${marca}@example.test`,
        password: 'S3cret-passw0rd',
        name: 'Marta',
        lastName: 'Rojas',
      } as Record<string, any>,
    };
  }

  /** Registra y comprueba en la base el tipo, el estado y la cuenta owner. */
  async function registrarYVerificar(
    tipo: string,
    cuerpo: Awaited<ReturnType<typeof alta>>,
    documentos: number,
  ) {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.tenantTypeConceptId).toBe(CONCEPTO_POR_TIPO[tipo]);
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).toBe(DIR.TENANT_UNVERIFIED);

    const credencial = await em.findOneOrFail(AuthenticationCredentials, {
      userId: res.body.ownerUserId,
    });
    expect(credencial.externalSubject).toBe(cuerpo.owner.email);
    const membresia = await em.findOneOrFail(TenantMemberships, {
      userId: res.body.ownerUserId,
      tenantId: res.body.tenantId,
    });
    expect(membresia.tenantRoleConceptId).toBe(DIR.ROLE_OWNER);
    expect(
      await em.count(TenantAffiliationDocuments, {
        tenantId: res.body.tenantId,
      }),
    ).toBe(documentos);
    return res;
  }

  /** Envía un alta que debe fallar y comprueba que no dejó nada escrito. */
  async function rechazadaSinRastro(
    cuerpo: Awaited<ReturnType<typeof alta>>,
    status: number,
  ) {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(cuerpo)
      .expect(status);
    const em = ctx.orm.em.fork();
    expect(
      await em.count(Tenants, { code: cuerpo.organization.code as string }),
    ).toBe(0);
    return res;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  describe.each([
    'HOSPITAL',
    'CLINIC',
    'MEDICAL_OFFICE',
    'NURSING',
    'HEALTH_OTHER',
  ])('%s', (tipo) => {
    it('correcto · 201, tipo y estado pendiente persistidos, 5 PDF + poder', async () => {
      await registrarYVerificar(tipo, await alta(tipo, `${tipo}_OK`), 6);
    });
  });

  describe('borde', () => {
    it('HOSPITAL · code de 100 caracteres se acepta y de 101 es 400', async () => {
      const largo = await alta('HOSPITAL', 'HOSPITAL_LX');
      largo.organization.code = `L${marca}_`.padEnd(101, 'X');
      await rechazadaSinRastro(largo, 400);

      const exacto = await alta('HOSPITAL', 'HOSPITAL_L');
      exacto.organization.code = `L${marca}_`.padEnd(100, 'X');
      await registrarYVerificar('HOSPITAL', exacto, 6);
    });

    it('CLINIC · UNIPERSONAL sin escritura ni poder se registra (excepción documentada)', async () => {
      const cuerpo = await alta('CLINIC', 'CLINIC_UNI');
      cuerpo.organization.legalEntityType = 'UNIPERSONAL';
      delete cuerpo.organization.legalDocuments.constitutionFileId;
      delete cuerpo.organization.legalRepresentative.powerOfAttorneyFileId;
      await registrarYVerificar('CLINIC', cuerpo, 4);
    });

    it('MEDICAL_OFFICE · contraseña de 8 caracteres se acepta y de 201 es 400', async () => {
      const larga = await alta('MEDICAL_OFFICE', 'MO_LX');
      larga.owner.password = 'p'.repeat(201);
      await rechazadaSinRastro(larga, 400);

      const minima = await alta('MEDICAL_OFFICE', 'MO_L');
      minima.owner.password = 'Clave-8!';
      await registrarYVerificar('MEDICAL_OFFICE', minima, 6);
    });

    it('NURSING · legalName de 300 caracteres se acepta y de 301 es 400', async () => {
      const largo = await alta('NURSING', 'NURSING_LX');
      largo.organization.legalName = 'E'.repeat(301);
      await rechazadaSinRastro(largo, 400);

      const exacto = await alta('NURSING', 'NURSING_L');
      exacto.organization.legalName = 'E'.repeat(300);
      await registrarYVerificar('NURSING', exacto, 6);
    });

    it('HEALTH_OTHER · owner.name de 100 caracteres se acepta y de 101 es 400', async () => {
      const largo = await alta('HEALTH_OTHER', 'HO_LX');
      largo.owner.name = 'N'.repeat(101);
      await rechazadaSinRastro(largo, 400);

      const exacto = await alta('HEALTH_OTHER', 'HO_L');
      exacto.owner.name = 'N'.repeat(100);
      exacto.organization.tradeName = 'T'.repeat(300);
      await registrarYVerificar('HEALTH_OTHER', exacto, 6);
    });
  });

  describe('error · 4xx con su código y nada persistido', () => {
    it('HOSPITAL · contraseña de 7 caracteres es 400 en owner.password', async () => {
      const cuerpo = await alta('HOSPITAL', 'HOSPITAL_E');
      cuerpo.owner.password = 'Clave-7';
      const res = await rechazadaSinRastro(cuerpo, 400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(JSON.stringify(res.body.details)).toContain('owner.password');
    });

    it('CLINIC · una SRL sin escritura de constitución es 422 y la nombra', async () => {
      const cuerpo = await alta('CLINIC', 'CLINIC_E');
      delete cuerpo.organization.legalDocuments.constitutionFileId;
      const res = await rechazadaSinRastro(cuerpo, 422);
      expect(JSON.stringify(res.body)).toContain('constitutionFileId');
    });

    it('CLINICA · el código mal escrito es 400 en organization.tenantType', async () => {
      const cuerpo = await alta('CLINICA', 'CLINICA_E');
      const res = await rechazadaSinRastro(cuerpo, 400);
      expect(JSON.stringify(res.body.details)).toContain(
        'organization.tenantType',
      );
    });

    it('MEDICAL_OFFICE · un correo ya registrado es 409', async () => {
      const primera = await alta('MEDICAL_OFFICE', 'MO_PRIMERA');
      await registrarYVerificar('MEDICAL_OFFICE', primera, 6);

      const repetida = await alta('MEDICAL_OFFICE', 'MO_E');
      repetida.owner.email = primera.owner.email;
      const res = await rechazadaSinRastro(repetida, 409);
      expect(res.body.reason).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('NURSING · sin jurisdicción es 422: es un tipo territorial', async () => {
      const cuerpo = await alta('NURSING', 'NURSING_E');
      delete cuerpo.organization.jurisdictionConceptId;
      await rechazadaSinRastro(cuerpo, 422);
    });

    it('HEALTH_OTHER · sin la licencia de funcionamiento es 400 (bloque todo o nada)', async () => {
      const cuerpo = await alta('HEALTH_OTHER', 'HO_E');
      delete cuerpo.organization.legalDocuments.operatingLicenseFileId;
      const res = await rechazadaSinRastro(cuerpo, 400);
      expect(JSON.stringify(res.body.details)).toContain(
        'organization.legalDocuments.operatingLicenseFileId',
      );
    });
  });
});
