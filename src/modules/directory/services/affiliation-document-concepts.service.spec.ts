import { jest } from '@jest/globals';

import { PreconditionFailedException } from '../../../common';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';

/** El proyecto corre jest en ESM: los dobles se arman con este envoltorio. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** IDs y códigos de juguete para los tres value sets; no necesitan ser uuid5 reales. */
const DOCUMENT_TYPE_MEMBERS: Record<string, string> = {
  'concept-escritura': 'ESCRITURA_CONSTITUCION',
  'concept-nit': 'NIT_EXHIBICION',
  'concept-seprec': 'MATRICULA_SEPREC',
  'concept-licencia': 'LICENCIA_FUNCIONAMIENTO',
  'concept-sedes': 'CERTIFICADO_SEDES',
  // Subtarea 1.4: `load()` ahora exige los SEIS roles de
  // `AFFILIATION_DOCUMENT_ROLES`, no sólo los cinco del autorregistro.
  'concept-poder': 'PODER_REPRESENTANTE_LEGAL',
};
const ISSUING_AUTHORITY_MEMBERS: Record<string, string> = {
  'concept-notaria': 'NOTARIA',
  'concept-siat': 'SIAT',
  'concept-seprec-auth': 'SEPREC',
  'concept-municipal': 'GOBIERNO_MUNICIPAL',
  'concept-sedes-auth': 'SEDES',
  'concept-otro': 'OTRO',
};
const VERIFICATION_STATUS_MEMBERS: Record<string, string> = {
  'concept-pendiente': 'PENDIENTE',
};
/** Los cuatro roles que `tenant_legal_representatives` puede declarar (subtarea 1.4). */
const REPRESENTATIVE_ROLE_MEMBERS: Record<string, string> = {
  'concept-representante': 'REPRESENTANTE_LEGAL',
  'concept-gerente-general': 'GERENTE_GENERAL',
  'concept-gerente-comercial': 'GERENTE_COMERCIAL',
  'concept-gerente-marketing': 'GERENTE_MARKETING',
};

function conceptsFor(members: Record<string, string>) {
  return new Map(
    Object.entries(members).map(([id, code]) => [id, { id, code }]),
  );
}

type ValueSetKey =
  | 'documentType'
  | 'issuingAuthority'
  | 'verificationStatus'
  | 'representativeRole';

function build(
  overrides: {
    missingValueSet?: ValueSetKey;
    missingMembers?: ValueSetKey;
    missingCode?: { valueSet: ValueSetKey; code: string };
  } = {},
) {
  const setsByCode: Record<string, { id: string }> = {
    VS_AFFILIATION_DOCUMENT_TYPE: { id: 'vs-document-type' },
    VS_ISSUING_AUTHORITY: { id: 'vs-issuing-authority' },
    VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS: {
      id: 'vs-verification-status',
    },
    VS_LEGAL_REPRESENTATIVE_ROLE: { id: 'vs-representative-role' },
  };
  const membersByValueSetId: Record<string, string[]> = {
    'vs-document-type': Object.keys(DOCUMENT_TYPE_MEMBERS),
    'vs-issuing-authority': Object.keys(ISSUING_AUTHORITY_MEMBERS),
    'vs-verification-status': Object.keys(VERIFICATION_STATUS_MEMBERS),
    'vs-representative-role': Object.keys(REPRESENTATIVE_ROLE_MEMBERS),
  };
  const conceptsByValueSetId: Record<
    string,
    Map<string, { id: string; code: string }>
  > = {
    'vs-document-type': conceptsFor(DOCUMENT_TYPE_MEMBERS),
    'vs-issuing-authority': conceptsFor(ISSUING_AUTHORITY_MEMBERS),
    'vs-verification-status': conceptsFor(VERIFICATION_STATUS_MEMBERS),
    'vs-representative-role': conceptsFor(REPRESENTATIVE_ROLE_MEMBERS),
  };

  const codeByKey = {
    documentType: 'VS_AFFILIATION_DOCUMENT_TYPE',
    issuingAuthority: 'VS_ISSUING_AUTHORITY',
    verificationStatus: 'VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS',
    representativeRole: 'VS_LEGAL_REPRESENTATIVE_ROLE',
  } as const;

  if (overrides.missingValueSet) {
    delete setsByCode[codeByKey[overrides.missingValueSet]];
  }
  if (overrides.missingMembers) {
    const vsId = setsByCode[codeByKey[overrides.missingMembers]].id;
    membersByValueSetId[vsId] = undefined as never;
  }
  if (overrides.missingCode) {
    const vsId = setsByCode[codeByKey[overrides.missingCode.valueSet]]?.id;
    if (vsId) {
      const map = conceptsByValueSetId[vsId];
      for (const [id, concept] of [...map.entries()]) {
        if (concept.code === overrides.missingCode.code) map.delete(id);
      }
    }
  }

  const valueSets = {
    findByInternalCode: mockFn((_em: unknown, code: string) =>
      Promise.resolve(setsByCode[code] ?? null),
    ),
    findIncludedConceptIdsByValueSet: mockFn(
      (_em: unknown, valueSetId: string) => {
        const ids = membersByValueSetId[valueSetId];
        return Promise.resolve(ids === undefined ? null : ids);
      },
    ),
  };
  const catalogConcepts = {
    findByIds: mockFn((_em: unknown, ids: string[]) => {
      const valueSetId = Object.keys(conceptsByValueSetId).find((vsId) =>
        membersByValueSetId[vsId]?.some((id) => ids.includes(id)),
      );
      const source = valueSetId ? conceptsByValueSetId[valueSetId] : new Map();
      const result = new Map<string, { id: string; code: string }>();
      for (const id of ids) {
        const concept = source.get(id);
        if (concept) result.set(id, concept);
      }
      return Promise.resolve(result);
    }),
  };

  const service = new AffiliationDocumentConceptsService(
    valueSets as never,
    catalogConcepts as never,
  );
  return { service, valueSets, catalogConcepts, em: {} as never };
}

describe('AffiliationDocumentConceptsService', () => {
  it('resuelve los tres mapas por código', async () => {
    const d = build();

    const result = await d.service.resolve(d.em);

    expect(result.documentType.get('CERTIFICADO_SEDES')).toBe('concept-sedes');
    expect(result.documentType.get('PODER_REPRESENTANTE_LEGAL')).toBe(
      'concept-poder',
    );
    expect(result.issuingAuthority.get('SEDES')).toBe('concept-sedes-auth');
    expect(result.verificationStatus.get('PENDIENTE')).toBe(
      'concept-pendiente',
    );
    expect(result.representativeRole.get('GERENTE_COMERCIAL')).toBe(
      'concept-gerente-comercial',
    );
  });

  it('422 con el sujeto "roles de representante legal" si falta un código de gerencia', async () => {
    const d = build({
      missingCode: {
        valueSet: 'representativeRole',
        code: 'GERENTE_MARKETING',
      },
    });

    await expect(d.service.resolve(d.em)).rejects.toMatchObject({
      message: expect.stringContaining('roles de representante legal'),
      details: expect.objectContaining({ code: 'GERENTE_MARKETING' }),
    });
  });

  it('conceptIdOf resuelve por código en mayúsculas indistintamente del caso', () => {
    const d = build();
    const map = new Map([['CERTIFICADO_SEDES', 'concept-sedes']]);

    expect(
      d.service.conceptIdOf(
        map,
        'VS_AFFILIATION_DOCUMENT_TYPE',
        'certificado_sedes',
      ),
    ).toBe('concept-sedes');
  });

  it('conceptIdOf lanza 422 si el código no está en el mapa', () => {
    const d = build();
    const map = new Map<string, string>();

    expect(() =>
      d.service.conceptIdOf(map, 'VS_ISSUING_AUTHORITY', 'INEXISTENTE'),
    ).toThrow(PreconditionFailedException);
  });

  it('422 si el value set no está sembrado', async () => {
    const d = build({ missingValueSet: 'documentType' });

    await expect(d.service.resolve(d.em)).rejects.toThrow(
      PreconditionFailedException,
    );
  });

  it('422 si el value set no tiene versión vigente (sin miembros)', async () => {
    const d = build({ missingMembers: 'issuingAuthority' });

    await expect(d.service.resolve(d.em)).rejects.toThrow(
      PreconditionFailedException,
    );
  });

  it('422 con detalle del código si falta CERTIFICADO_SEDES (base sin el --refresh)', async () => {
    const d = build({
      missingCode: { valueSet: 'documentType', code: 'CERTIFICADO_SEDES' },
    });

    await expect(d.service.resolve(d.em)).rejects.toMatchObject({
      details: expect.objectContaining({ code: 'CERTIFICADO_SEDES' }),
    });
  });

  it('cachea la resolución exitosa: una segunda llamada no vuelve a consultar', async () => {
    const d = build();

    await d.service.resolve(d.em);
    await d.service.resolve(d.em);

    expect(d.valueSets.findByInternalCode).toHaveBeenCalledTimes(4);
  });

  it('un fallo no queda cacheado: la siguiente llamada reintenta', async () => {
    const d = build({ missingValueSet: 'documentType' });

    await expect(d.service.resolve(d.em)).rejects.toThrow();
    await expect(d.service.resolve(d.em)).rejects.toThrow();

    // 2 intentos completos: el primero encuentra `documentType` ausente y
    // corta ahí; el mismo corte se repite en el segundo intento.
    expect(d.valueSets.findByInternalCode).toHaveBeenCalledTimes(2);
  });
});
