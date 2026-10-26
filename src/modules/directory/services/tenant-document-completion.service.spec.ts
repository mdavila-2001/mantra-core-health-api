import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DIR } from '../directory.concepts';
import { TenantDocumentCompletionService } from './tenant-document-completion.service';

const actor = { id: 'owner-1', roles: ['USER'] } as never;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = {
    transactional: fn((cb: (t: unknown) => unknown) => cb(tx)),
    fork: fn(() => tx),
  };
  const tenant = {
    id: 't-1',
    statusConceptId: DIR.TENANT_PENDING,
    tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PHARMACY,
    legalEntityTypeConceptId: undefined as string | undefined,
  };
  const tenantsRepo = { findById: fn(async () => tenant) };
  const representative = {
    personId: 'person-1',
    representativeRoleConceptId: 'rr-legal',
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    powerOfAttorneyDocumentId: undefined as string | undefined,
  };
  const legalRepo = { listLegalRepsByTenant: fn(async () => [representative]) };
  const tenantAdmin = {
    assertCanAdminister: fn().mockResolvedValue(undefined),
    assertCanRead: fn().mockResolvedValue(undefined),
  };
  const concepts = {
    resolve: fn(async () => ({
      documentType: new Map([
        ['CERTIFICADO_SEDES', 'dt-sedes'],
        ['NIT_EXHIBICION', 'dt-nit'],
        ['PODER_REPRESENTANTE_LEGAL', 'dt-poder'],
      ]),
      representativeRole: new Map([['REPRESENTANTE_LEGAL', 'rr-legal']]),
    })),
  };
  let seq = 0;
  const documents = {
    attachDocument: fn(async () => `doc-${++seq}`),
    attachPowerOfAttorney: fn(async () => `poder-${++seq}`),
  };
  const requirements = {
    liveDocumentsByType: fn(async () => new Map<string, string>()),
    evaluate: fn(async () => ({
      ready: false,
      missing: ['HEALTH_AUTHORITY_CERT_DOC'],
      documentIds: [],
    })),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new TenantDocumentCompletionService(
    em as never,
    tenantsRepo as never,
    legalRepo as never,
    tenantAdmin as never,
    concepts as never,
    documents as never,
    requirements as never,
    logger as never,
  );
  return {
    service,
    tx,
    tenant,
    tenantsRepo,
    representative,
    tenantAdmin,
    documents,
    requirements,
  };
}

const SEDES = '00000000-0000-4000-8000-000000000005';
const NIT = '00000000-0000-4000-8000-000000000002';
const PODER = '00000000-0000-4000-8000-000000000006';

describe('TenantDocumentCompletionService.complete', () => {
  it('vincula los papeles declarados con el NIT como número del tributario', async () => {
    const d = build();

    const res = await d.service.complete(
      't-1',
      {
        healthAuthorityCertificateFileId: SEDES,
        taxIdentifierFileId: NIT,
        taxIdentifier: '1023456029',
      },
      actor,
    );

    expect(res).toEqual({ registered: 2, documentIds: ['doc-1', 'doc-2'] });
    expect(d.documents.attachDocument).toHaveBeenCalledWith(
      d.tx,
      'TAX_IDENTIFIER_DOC',
      expect.objectContaining({
        tenantId: 't-1',
        ownerUserId: 'owner-1',
        fileId: NIT,
        documentNumber: '1023456029',
      }),
    );
    expect(d.documents.attachDocument).toHaveBeenCalledWith(
      d.tx,
      'HEALTH_AUTHORITY_CERT_DOC',
      expect.objectContaining({ fileId: SEDES, documentNumber: undefined }),
    );
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('ata el poder al representante legal del alta', async () => {
    const d = build();

    const res = await d.service.complete(
      't-1',
      { powerOfAttorneyFileId: PODER },
      actor,
    );

    expect(res.documentIds).toEqual(['poder-1']);
    expect(d.documents.attachPowerOfAttorney).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ relatedPersonId: 'person-1', fileId: PODER }),
    );
    expect(d.representative.powerOfAttorneyDocumentId).toBe('poder-1');
  });

  it('sin representante legal, el poder es un 422', async () => {
    const d = build();
    d.representative.statusConceptId = 'retired';

    await expect(
      d.service.complete('t-1', { powerOfAttorneyFileId: PODER }, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('sin ningún documento es un 422 sin abrir transacción', async () => {
    const d = build();

    await expect(d.service.complete('t-1', {}, actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(d.tenantsRepo.findById).not.toHaveBeenCalled();
  });

  it('el mismo archivo para dos papeles es un 422', async () => {
    const d = build();

    await expect(
      d.service.complete(
        't-1',
        { taxIdentifierFileId: SEDES, healthAuthorityCertificateFileId: SEDES },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un papel ya presentado es un 409 y no vincula nada', async () => {
    const d = build();
    d.requirements.liveDocumentsByType.mockResolvedValue(
      new Map([['dt-sedes', 'doc-old']]),
    );

    await expect(
      d.service.complete(
        't-1',
        { healthAuthorityCertificateFileId: SEDES },
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.documents.attachDocument).not.toHaveBeenCalled();
  });

  it('una organización ya verificada no completa papeles por acá', async () => {
    const d = build();
    d.tenant.statusConceptId = CONCEPTS.TENANT_ACTIVE;

    await expect(
      d.service.complete(
        't-1',
        { healthAuthorityCertificateFileId: SEDES },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('quien no la administra recibe 403 y no se vincula nada', async () => {
    const d = build();
    d.tenantAdmin.assertCanAdminister.mockRejectedValue(
      new ForbiddenException('no'),
    );

    await expect(
      d.service.complete(
        't-1',
        { healthAuthorityCertificateFileId: SEDES },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.documents.attachDocument).not.toHaveBeenCalled();
  });

  it('un tenant inexistente es un 404', async () => {
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.complete(
        't-x',
        { healthAuthorityCertificateFileId: SEDES },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('TenantDocumentCompletionService.pharmacyReadiness', () => {
  it('devuelve ready y missing de la farmacia', async () => {
    const d = build();

    const res = await d.service.pharmacyReadiness('t-1', actor);

    expect(res).toEqual({
      ready: false,
      missing: ['HEALTH_AUTHORITY_CERT_DOC'],
    });
    expect(d.tenantAdmin.assertCanRead).toHaveBeenCalled();
  });

  it('para una organización que no es farmacia es un 422', async () => {
    const d = build();
    d.tenant.tenantTypeConceptId = 'otro-tipo';

    await expect(
      d.service.pharmacyReadiness('t-1', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
