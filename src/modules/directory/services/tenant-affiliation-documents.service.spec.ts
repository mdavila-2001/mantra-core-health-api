import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { TenantAffiliationDocumentsService } from './tenant-affiliation-documents.service';
import { CONCEPTS, PreconditionFailedException } from '../../../common';

const DOCUMENTS = {
  CONSTITUTION_DOC: 'file-constitution',
  TAX_IDENTIFIER_DOC: 'file-tax',
  COMMERCE_REGISTRY_DOC: 'file-commerce',
  OPERATING_LICENSE_DOC: 'file-license',
  HEALTH_AUTHORITY_CERT_DOC: 'file-sedes',
};

const CONCEPTS_RESOLVED = {
  documentType: new Map([
    ['ESCRITURA_CONSTITUCION', 'ct-escritura'],
    ['NIT_EXHIBICION', 'ct-nit'],
    ['MATRICULA_SEPREC', 'ct-seprec'],
    ['LICENCIA_FUNCIONAMIENTO', 'ct-licencia'],
    ['CERTIFICADO_SEDES', 'ct-sedes'],
  ]),
  issuingAuthority: new Map([
    ['NOTARIA', 'ia-notaria'],
    ['SIAT', 'ia-siat'],
    ['SEPREC', 'ia-seprec'],
    ['GOBIERNO_MUNICIPAL', 'ia-municipal'],
    ['SEDES', 'ia-sedes'],
    ['OTRO', 'ia-otro'],
  ]),
  verificationStatus: new Map([['PENDIENTE', 'vs-pendiente']]),
};

/**
 * Reproduce el `conceptIdOf` real: código en mayúsculas, 422 si falta.
 * El servicio bajo prueba delega en `AffiliationDocumentConceptsService`, así
 * que el doble debe comportarse igual para que los tests digan algo real.
 */
function conceptIdOf(map: Map<string, string>, valueSet: string, code: string) {
  const conceptId = map.get(code.toUpperCase());
  if (!conceptId) {
    throw new PreconditionFailedException(
      `El catálogo de documentos de afiliación no incluye el código ${code.toUpperCase()}`,
      { valueSet, code: code.toUpperCase() },
    );
  }
  return conceptId;
}

function build() {
  const legalRepo = {
    findAffiliationDocumentByFile: fn(async () => null),
    createAffiliationDocument: fn((_tx: unknown, data: unknown) => ({
      id: `doc-${(data as { fileId: string }).fileId}`,
    })),
  };
  const concepts = {
    resolve: fn(async () => CONCEPTS_RESOLVED),
    conceptIdOf: fn(conceptIdOf),
  };
  const attachable = {
    claimAnonymousUpload: fn(async () => ({ file: {}, version: {} })),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  const service = new TenantAffiliationDocumentsService(
    legalRepo as never,
    concepts as never,
    attachable as never,
    logger as never,
  );
  return { service, legalRepo, concepts, attachable, tx: {} as never };
}

describe('TenantAffiliationDocumentsService', () => {
  it('crea las 5 filas con is_required_for_affiliation, PENDIENTE y ACTIVE', async () => {
    const d = build();

    const ids = await d.service.attachRegistrationDocuments(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: 'SRL',
      taxIdentifier: 'NIT-12345',
      documents: DOCUMENTS,
    });

    expect(ids).toHaveLength(5);
    expect(d.legalRepo.createAffiliationDocument).toHaveBeenCalledTimes(5);
    for (const [, data] of d.legalRepo.createAffiliationDocument.mock.calls) {
      expect(data).toMatchObject({
        tenantId: 'tenant-1',
        verificationStatusConceptId: 'vs-pendiente',
        isRequiredForAffiliation: true,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: 'user-1',
      });
    }
  });

  it('reclama cada archivo antes de crear la fila, con la categoría y el PDF exigidos', async () => {
    const d = build();

    await d.service.attachRegistrationDocuments(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      documents: DOCUMENTS,
    });

    expect(d.attachable.claimAnonymousUpload).toHaveBeenCalledTimes(5);
    for (const call of d.attachable.claimAnonymousUpload.mock.calls) {
      expect(call[2]).toMatchObject({
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
      });
      expect(call[3]).toMatchObject({
        allowedMimeTypes: ['application/pdf'],
        allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      });
    }
  });

  it('sólo el NIT lleva document_number; el resto no', async () => {
    const d = build();

    await d.service.attachRegistrationDocuments(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      taxIdentifier: 'NIT-12345',
      documents: DOCUMENTS,
    });

    const byFile = new Map<string, any>(
      d.legalRepo.createAffiliationDocument.mock.calls.map(
        ([, data]: [unknown, any]) => [data.fileId, data],
      ),
    );
    expect(byFile.get('file-tax').documentNumber).toBe('NIT-12345');
    expect(byFile.get('file-constitution').documentNumber).toBeUndefined();
  });

  it('en Bolivia usa las autoridades nombradas del rol', async () => {
    const d = build();

    await d.service.attachRegistrationDocuments(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: 'SRL',
      documents: DOCUMENTS,
    });

    const byFile = new Map<string, any>(
      d.legalRepo.createAffiliationDocument.mock.calls.map(
        ([, data]: [unknown, any]) => [data.fileId, data],
      ),
    );
    expect(byFile.get('file-tax').issuingAuthorityConceptId).toBe('ia-siat');
    expect(byFile.get('file-sedes').issuingAuthorityConceptId).toBe('ia-sedes');
  });

  it('fuera de Bolivia (US_LLC) las cinco autoridades son OTRO', async () => {
    const d = build();

    await d.service.attachRegistrationDocuments(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: 'US_LLC',
      documents: DOCUMENTS,
    });

    for (const [, data] of d.legalRepo.createAffiliationDocument.mock.calls as [
      unknown,
      any,
    ][]) {
      expect(data.issuingAuthorityConceptId).toBe('ia-otro');
    }
  });

  it('422 si un mismo archivo respalda dos documentos, sin reclamar nada', async () => {
    const d = build();

    await expect(
      d.service.attachRegistrationDocuments(d.tx, {
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        documents: {
          ...DOCUMENTS,
          TAX_IDENTIFIER_DOC: DOCUMENTS.CONSTITUTION_DOC,
        },
      }),
    ).rejects.toThrow(PreconditionFailedException);

    expect(d.attachable.claimAnonymousUpload).not.toHaveBeenCalled();
    expect(d.legalRepo.createAffiliationDocument).not.toHaveBeenCalled();
  });

  it('422 si el archivo ya está vinculado a otra organización', async () => {
    const d = build();
    d.legalRepo.findAffiliationDocumentByFile.mockImplementationOnce(
      async () => ({ id: 'doc-existente' }),
    );

    await expect(
      d.service.attachRegistrationDocuments(d.tx, {
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        documents: DOCUMENTS,
      }),
    ).rejects.toThrow(PreconditionFailedException);

    expect(d.attachable.claimAnonymousUpload).not.toHaveBeenCalled();
  });

  it('propaga el error del reclamo (archivo ajeno, no-PDF, ya reclamado)', async () => {
    const d = build();
    d.attachable.claimAnonymousUpload.mockRejectedValueOnce(
      new PreconditionFailedException(
        'El documento el NIT tiene que ser un PDF',
      ),
    );

    await expect(
      d.service.attachRegistrationDocuments(d.tx, {
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        documents: DOCUMENTS,
      }),
    ).rejects.toThrow(PreconditionFailedException);
  });
});
