import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { TenantAffiliationDocuments, Tenants } from '../../src/modules/directory/entities';
import { Files } from '../../src/modules/common/entities';
import { CatalogConcepts } from '../../src/modules/terminology/entities';

/**
 * Subtarea 1.2 · los cinco documentos legales en PDF del autorregistro
 * público de aseguradora.
 *
 * Cubre el par «pre-carga anónima + reclamo dentro de la transacción del
 * alta»: subir un PDF sin sesión, rechazar lo que no es PDF, vincular los
 * cinco a `directory.tenant_affiliation_documents` con las autoridades
 * emisoras correctas, y que un archivo ya reclamado no pueda reutilizarse.
 */
describe('1.2 · documentos legales del alta de organización (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  const PDF = Buffer.from('%PDF-1.7\nsubtarea 1.2\n');

  /** Sube un PDF anónimo y devuelve su `fileId`. */
  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    expect(res.body).toMatchObject({
      originalName: nombre,
      mimeType: 'application/pdf',
    });
    expect(res.body.sizeBytes).toBeGreaterThan(0);
    return res.body.fileId;
  }

  function altaDto(overrides: {
    code: string;
    email: string;
    legalEntityType?: string;
    legalDocuments?: Record<string, string>;
  }) {
    return {
      organization: {
        code: overrides.code,
        legalName: `Aseguradora ${overrides.code} S.R.L.`,
        tenantType: 'PAYER',
        legalEntityType: overrides.legalEntityType,
        payer: {
          carrierCode: `CAR_${overrides.code}`,
          sigla: overrides.code.slice(0, 6),
          address: 'Av. Siempre Viva 123',
          regulatorIdentifier: `NIT-${overrides.code}`,
        },
        legalDocuments: overrides.legalDocuments,
      },
      owner: {
        email: overrides.email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
      },
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('escenario 1 · los 5 PDF quedan vinculados, pendientes y con las autoridades bolivianas', async () => {
    const codigo = `DOC1_${marca}`;
    const fileIds = {
      constitutionFileId: await subirPdf('escritura.pdf'),
      taxIdentifierFileId: await subirPdf('nit.pdf'),
      commerceRegistryFileId: await subirPdf('seprec.pdf'),
      operatingLicenseFileId: await subirPdf('licencia.pdf'),
      healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
    };

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `doc1-${marca}@example.test`,
          legalEntityType: 'SRL',
          legalDocuments: fileIds,
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    expect(res.body.legalDocumentsRegistered).toBe(5);

    const em = ctx.orm.em.fork();
    const documentos = await em.find(TenantAffiliationDocuments, {
      tenantId: res.body.tenantId,
    });
    expect(documentos).toHaveLength(5);
    for (const doc of documentos) {
      expect(doc.isRequiredForAffiliation).toBe(true);
    }

    const nit = documentos.find((d) => d.fileId === fileIds.taxIdentifierFileId);
    expect(nit?.documentNumber).toBe(`NIT-${codigo}`);

    const otro = documentos.find(
      (d) => d.fileId === fileIds.constitutionFileId,
    );
    // `null`, no `undefined`: así hidrata MikroORM una columna nullable sin
    // valor al leerla de vuelta (aunque no se declaró al crear la fila).
    expect(otro?.documentNumber).toBeNull();

    // Los 5 archivos pasaron del tenant DEFAULT al tenant recién creado, con
    // el owner como dueño.
    const archivos = await em.find(Files, {
      id: { $in: Object.values(fileIds) },
    });
    expect(archivos).toHaveLength(5);
    for (const archivo of archivos) {
      expect(archivo.tenantId).toBe(res.body.tenantId);
      expect(archivo.createdByUserId).toBe(res.body.ownerUserId);
    }
  });

  it('escenario 2 · un .docx (o cualquier no-PDF) es 422 en la pre-carga', async () => {
    const zipComoDocx = Buffer.from('PK\x03\x04word/document.xml');
    await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', zipComoDocx, {
        filename: 'contrato.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .expect(422);

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(422);
  });

  it('escenario 3 · un fileId ya reclamado da 422 y no crea ni cuenta ni tenant', async () => {
    const codigoBase = `DOC3A_${marca}`;
    const fileIds = {
      constitutionFileId: await subirPdf('escritura.pdf'),
      taxIdentifierFileId: await subirPdf('nit.pdf'),
      commerceRegistryFileId: await subirPdf('seprec.pdf'),
      operatingLicenseFileId: await subirPdf('licencia.pdf'),
      healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
    };
    const primero = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigoBase,
          email: `doc3a-${marca}@example.test`,
          legalDocuments: fileIds,
        }),
      )
      .expect(201);
    creados.push({
      userId: primero.body.ownerUserId,
      tenantId: primero.body.tenantId,
    });

    const codigoSegundo = `DOC3B_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigoSegundo,
          email: `doc3b-${marca}@example.test`,
          legalDocuments: fileIds,
        }),
      )
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');

    const em = ctx.orm.em.fork();
    const segundoTenant = await em.findOne(Tenants, { code: codigoSegundo });
    expect(segundoTenant).toBeNull();
  });

  it('escenario 4 · sin legalDocuments, el alta sigue 201 y sin filas', async () => {
    const codigo = `DOC4_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(altaDto({ code: codigo, email: `doc4-${marca}@example.test` }))
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    expect(res.body.legalDocumentsRegistered).toBeUndefined();

    const em = ctx.orm.em.fork();
    const documentos = await em.find(TenantAffiliationDocuments, {
      tenantId: res.body.tenantId,
    });
    expect(documentos).toHaveLength(0);
  });

  it('escenario 5 · un fileId inexistente es 422; el bloque con 4 campos es 400', async () => {
    const codigoInexistente = `DOC5A_${marca}`;
    const resInexistente = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigoInexistente,
          email: `doc5a-${marca}@example.test`,
          legalDocuments: {
            constitutionFileId: randomUUID(),
            taxIdentifierFileId: randomUUID(),
            commerceRegistryFileId: randomUUID(),
            operatingLicenseFileId: randomUUID(),
            healthAuthorityCertificateFileId: randomUUID(),
          },
        }),
      )
      .expect(422);
    expect(resInexistente.body.code).toBe('PRECONDITION_FAILED');

    const codigoIncompleto = `DOC5B_${marca}`;
    await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigoIncompleto,
          email: `doc5b-${marca}@example.test`,
          legalDocuments: {
            constitutionFileId: randomUUID(),
            taxIdentifierFileId: randomUUID(),
            commerceRegistryFileId: randomUUID(),
            operatingLicenseFileId: randomUUID(),
            // Falta healthAuthorityCertificateFileId.
          },
        }),
      )
      .expect(400);
  });

  it('escenario 6 · US_LLC persiste las 5 autoridades como OTRO', async () => {
    const codigo = `DOC6_${marca}`;
    const fileIds = {
      constitutionFileId: await subirPdf('escritura.pdf'),
      taxIdentifierFileId: await subirPdf('nit.pdf'),
      commerceRegistryFileId: await subirPdf('seprec.pdf'),
      operatingLicenseFileId: await subirPdf('licencia.pdf'),
      healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
    };

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `doc6-${marca}@example.test`,
          legalEntityType: 'US_LLC',
          legalDocuments: fileIds,
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const documentos = await em.find(TenantAffiliationDocuments, {
      tenantId: res.body.tenantId,
    });
    expect(documentos).toHaveLength(5);
    const autoridades = new Set(
      await Promise.all(
        documentos.map(async (d) => {
          const concepto = await em.findOneOrFail(CatalogConcepts, {
            id: d.issuingAuthorityConceptId,
          });
          return concepto.code;
        }),
      ),
    );
    expect(autoridades).toEqual(new Set(['OTRO']));
  });
});
