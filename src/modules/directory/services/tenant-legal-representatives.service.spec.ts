import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { TenantLegalRepresentativesService } from './tenant-legal-representatives.service';

const REPRESENTATIVE_ROLE_RESOLVED = new Map([
  ['REPRESENTANTE_LEGAL', 'ct-representante'],
  ['GERENTE_GENERAL', 'ct-general'],
  ['GERENTE_COMERCIAL', 'ct-comercial'],
  ['GERENTE_MARKETING', 'ct-marketing'],
]);

/**
 * Reproduce el `conceptIdOf` real: código en mayúsculas, 422 si falta. El
 * servicio bajo prueba delega en `AffiliationDocumentConceptsService`, así
 * que el doble debe comportarse igual para que los tests digan algo real.
 */
function conceptIdOf(
  map: Map<string, string>,
  valueSet: string,
  code: string,
  subject: string,
) {
  const conceptId = map.get(code.toUpperCase());
  if (!conceptId) {
    throw new PreconditionFailedException(
      `El catálogo de ${subject} no incluye el código ${code.toUpperCase()}`,
      { valueSet, code: code.toUpperCase() },
    );
  }
  return conceptId;
}

function build(
  overrides: { representativeRoleResolved?: Map<string, string> } = {},
) {
  const orden: string[] = [];
  const legalRepo = {
    createLegalRepresentative: fn(
      (_tx: unknown, data: { personId: string }) => {
        orden.push('createLegalRepresentative');
        return { id: `rep-${data.personId}` };
      },
    ),
  };
  const concepts = {
    resolve: fn(async () => ({
      documentType: new Map(),
      issuingAuthority: new Map(),
      verificationStatus: new Map(),
      representativeRole:
        overrides.representativeRoleResolved ?? REPRESENTATIVE_ROLE_RESOLVED,
    })),
    conceptIdOf: fn(conceptIdOf),
  };
  const documents = {
    attachPowerOfAttorney: fn(async () => {
      orden.push('attachPowerOfAttorney');
      return 'doc-poder-1';
    }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const tx = {
    flush: fn(async () => {
      orden.push('flush');
    }),
  };

  const service = new TenantLegalRepresentativesService(
    legalRepo as never,
    concepts as never,
    documents as never,
    logger as never,
  );
  return { service, legalRepo, concepts, documents, tx: tx as never, orden };
}

describe('TenantLegalRepresentativesService', () => {
  it('sin representante ni gerencias, no escribe nada', async () => {
    const d = build();

    const resultado = await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: [],
    });

    expect(resultado).toEqual({ count: 0 });
    expect(d.concepts.resolve).not.toHaveBeenCalled();
    expect(d.documents.attachPowerOfAttorney).not.toHaveBeenCalled();
    expect(d.legalRepo.createLegalRepresentative).not.toHaveBeenCalled();
  });

  it('con representante legal: vincula el poder, flushea, y crea la fila con isPrimary=true', async () => {
    const d = build();

    const resultado = await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: ['file-constitution'],
      legalRepresentative: {
        personId: 'person-rep',
        ciIdentifierId: 'ci-1',
        powerOfAttorneyFileId: 'file-poder',
      },
    });

    expect(d.documents.attachPowerOfAttorney).toHaveBeenCalledWith(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      legalEntityType: undefined,
      fileId: 'file-poder',
      relatedPersonId: 'person-rep',
      alreadyDeclaredFileIds: ['file-constitution'],
    });
    expect(d.legalRepo.createLegalRepresentative).toHaveBeenCalledWith(d.tx, {
      tenantId: 'tenant-1',
      personId: 'person-rep',
      representativeRoleConceptId: 'ct-representante',
      ciIdentifierId: 'ci-1',
      powerOfAttorneyDocumentId: 'doc-poder-1',
      isPrimary: true,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: 'user-1',
    });
    expect(resultado).toEqual({
      legalRepresentativeId: 'rep-person-rep',
      count: 1,
    });
  });

  it('flushea el documento del poder ANTES de crear la fila del representante', async () => {
    const d = build();

    await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: [],
      legalRepresentative: {
        personId: 'person-rep',
        powerOfAttorneyFileId: 'file-poder',
      },
    });

    expect(d.orden).toEqual([
      'attachPowerOfAttorney',
      'flush',
      'createLegalRepresentative',
    ]);
  });

  it('ciIdentifierId es opcional: sin CI declarado, la fila no lo lleva', async () => {
    const d = build();

    await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: [],
      legalRepresentative: {
        personId: 'person-rep',
        powerOfAttorneyFileId: 'file-poder',
      },
    });

    expect(d.legalRepo.createLegalRepresentative).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ ciIdentifierId: undefined }),
    );
  });

  it('con las tres gerencias: crea 3 filas SIN `isPrimary` en la llamada', async () => {
    const d = build();

    const resultado = await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: [],
      executives: [
        { role: 'GENERAL_MANAGER', personId: 'person-gm' },
        { role: 'COMMERCIAL_MANAGER', personId: 'person-cm' },
        { role: 'MARKETING_MANAGER', personId: 'person-mm' },
      ],
    });

    expect(d.legalRepo.createLegalRepresentative).toHaveBeenCalledTimes(3);
    for (const [, data] of d.legalRepo.createLegalRepresentative.mock.calls as [
      unknown,
      Record<string, unknown>,
    ][]) {
      expect(data).not.toHaveProperty('isPrimary');
      expect(data.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
    }
    const roles = d.legalRepo.createLegalRepresentative.mock.calls.map(
      ([, data]: [unknown, { representativeRoleConceptId: string }]) =>
        data.representativeRoleConceptId,
    );
    expect(roles).toEqual(['ct-general', 'ct-comercial', 'ct-marketing']);
    expect(resultado).toEqual({ legalRepresentativeId: undefined, count: 3 });
    expect(d.documents.attachPowerOfAttorney).not.toHaveBeenCalled();
  });

  it('representante y gerencias juntos: cuenta los 4 vínculos', async () => {
    const d = build();

    const resultado = await d.service.attachRegistrationRepresentatives(d.tx, {
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      alreadyDeclaredFileIds: [],
      legalRepresentative: {
        personId: 'person-rep',
        powerOfAttorneyFileId: 'file-poder',
      },
      executives: [
        { role: 'GENERAL_MANAGER', personId: 'person-gm' },
        { role: 'COMMERCIAL_MANAGER', personId: 'person-cm' },
        { role: 'MARKETING_MANAGER', personId: 'person-mm' },
      ],
    });

    expect(resultado).toEqual({
      legalRepresentativeId: 'rep-person-rep',
      count: 4,
    });
  });

  it('422 si el catálogo de roles no tiene sembrado el código del rol', async () => {
    const d = build({
      representativeRoleResolved: new Map([
        ['REPRESENTANTE_LEGAL', 'ct-representante'],
        ['GERENTE_GENERAL', 'ct-general'],
        // GERENTE_COMERCIAL y GERENTE_MARKETING sin sembrar (base sin el
        // --refresh que carga los códigos nuevos de la subtarea 1.4).
      ]),
    });

    await expect(
      d.service.attachRegistrationRepresentatives(d.tx, {
        tenantId: 'tenant-1',
        ownerUserId: 'user-1',
        alreadyDeclaredFileIds: [],
        executives: [{ role: 'COMMERCIAL_MANAGER', personId: 'person-cm' }],
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('GERENTE_COMERCIAL'),
    });

    expect(d.legalRepo.createLegalRepresentative).not.toHaveBeenCalled();
  });
});
