import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AffiliationCatalogsSeedService } from './affiliation-catalogs-seed.service';
import {
  AFFILIATION_CATALOG_SETS,
  affiliationCodeSystemVersionId,
  affiliationConceptId,
  affiliationMemberId,
  affiliationSetId,
  affiliationSetVersionId,
} from './affiliation-catalogs.catalog';
import {
  AFFILIATION_DOCUMENT_ROLES,
  AFFILIATION_DOCUMENT_VALUE_SETS,
  BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE,
  DOCUMENT_TYPE_CODE_BY_ROLE,
  DOCUMENT_VERIFICATION_PENDING,
  ISSUING_AUTHORITY_OTHER,
} from '../../modules/directory/affiliation-documents';
import {
  LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
  REPRESENTATIVE_ROLE_CODE,
} from '../../modules/directory/legal-representatives';
import { AffiliationDocumentConceptsService } from '../../modules/directory/services/affiliation-document-concepts.service';

/** Todo id que el seeder puede producir: sirve para simular «ya está sembrado». */
function allSeededIds(): Set<string> {
  const ids = new Set<string>();
  for (const set of AFFILIATION_CATALOG_SETS) {
    ids.add(affiliationCodeSystemVersionId(set));
    ids.add(affiliationSetId(set));
    ids.add(affiliationSetVersionId(set));
    for (const member of set.members) {
      ids.add(affiliationConceptId(set, member.code));
      ids.add(affiliationMemberId(set, member.code));
    }
  }
  return ids;
}

/** Cuántos conceptos / membresías declara el catálogo en total. */
const TOTAL_MEMBERS = AFFILIATION_CATALOG_SETS.reduce(
  (sum, set) => sum + set.members.length,
  0,
);

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `bo-geography-seed.service.spec.ts`: un `em` en memoria que
 * responde `find`/`findOne`/`create`/`flush` sin tocar una base real.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @param foreignValueSets - Conjuntos que ya están por `internal_code` con un
 *   id AJENO a este seeder (los que dejó el paquete de seeds del modelo).
 * @returns Servicio, filas creadas y utilidades de lectura.
 */
function build(
  existing: Set<string> = new Set(),
  foreignValueSets: Map<string, string> = new Map(),
) {
  const created: { entity: string; data: any }[] = [];
  const idByCode = new Map(
    AFFILIATION_CATALOG_SETS.map((set) => [set.code, affiliationSetId(set)]),
  );

  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
      );
    }),
    findOne: mockFn((entity: any, where: any) => {
      if (entity?.name !== 'ValueSets') return Promise.resolve(null);
      const code: string | undefined = where?.internalCode;
      if (!code) return Promise.resolve(null);
      const foreign = foreignValueSets.get(code);
      if (foreign) return Promise.resolve({ id: foreign });
      const own = idByCode.get(code);
      return Promise.resolve(own && existing.has(own) ? { id: own } : null);
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AffiliationCatalogsSeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    logger,
  };
}

describe('AffiliationCatalogsSeedService', () => {
  describe('primera corrida sobre una base vacía', () => {
    it('materializa los cuatro conjuntos completos con su versión vigente', async () => {
      const { service, rowsOf } = build();

      const counters = await service.run();

      expect(counters).toEqual({
        codeSystemVersions: 4,
        concepts: TOTAL_MEMBERS,
        valueSets: 4,
        versions: 4,
        memberships: TOTAL_MEMBERS,
        skippedForeignSets: 0,
      });
      expect(rowsOf('ValueSets').map((row) => row.internalCode)).toEqual([
        'VS_AFFILIATION_DOCUMENT_TYPE',
        'VS_ISSUING_AUTHORITY',
        'VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS',
        'VS_LEGAL_REPRESENTATIVE_ROLE',
      ]);
      // Sin `is_default`, `findIncludedConceptIdsByValueSet` devuelve null y el
      // alta responde igual «no está disponible».
      expect(rowsOf('ValueSetVersions').every((row) => row.isDefault)).toBe(
        true,
      );
    });

    it('declara el tamaño exacto del paquete del modelo: 9 / 7 / 5 / 7', () => {
      expect(AFFILIATION_CATALOG_SETS.map((set) => set.members.length)).toEqual(
        [9, 7, 5, 7],
      );
    });

    it('ordena la expansión con el ordinal del orden declarado', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const type = AFFILIATION_CATALOG_SETS[0];
      const versionId = affiliationSetVersionId(type);
      const ordinals = rowsOf('ValueSetMembers')
        .filter((row) => row.valueSetVersionId === versionId)
        .map((row) => row.ordinal);
      expect(ordinals).toEqual(type.members.map((_, index) => index));
    });

    it('no marca como vigente la versión de sistema de códigos que aloja los conceptos', async () => {
      const { service, rowsOf } = build();

      await service.run();

      expect(
        rowsOf('CodeSystemVersions').every((row) => row.isDefault === false),
      ).toBe(true);
    });

    it('deja que OTRO viva en tres conjuntos sin chocar: un concepto por versión de sistema de códigos', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const others = rowsOf('CatalogConcepts').filter(
        (row) => row.code === 'OTRO',
      );
      expect(others).toHaveLength(3);
      expect(new Set(others.map((row) => row.id)).size).toBe(3);
      expect(new Set(others.map((row) => row.codeSystemVersionId)).size).toBe(
        3,
      );
    });

    it('nunca repite el par (versión de sistema de códigos, código)', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const pairs = rowsOf('CatalogConcepts').map(
        (row) => `${row.codeSystemVersionId}|${row.code}`,
      );
      expect(new Set(pairs).size).toBe(pairs.length);
    });
  });

  describe('segunda corrida sobre una base ya sembrada', () => {
    it('no escribe nada', async () => {
      const { service, created } = build(allSeededIds());

      const counters = await service.run();

      expect(counters).toEqual({
        codeSystemVersions: 0,
        concepts: 0,
        valueSets: 0,
        versions: 0,
        memberships: 0,
        skippedForeignSets: 0,
      });
      expect(created).toHaveLength(0);
    });

    it('completa una siembra a medias sin duplicar lo que ya estaba', async () => {
      const existing = allSeededIds();
      const type = AFFILIATION_CATALOG_SETS[0];
      // Se perdió la membresía de un concepto.
      existing.delete(affiliationMemberId(type, 'NIT_EXHIBICION'));
      const { service, rowsOf } = build(existing);

      const counters = await service.run();

      expect(counters.memberships).toBe(1);
      expect(counters.concepts).toBe(0);
      expect(rowsOf('ValueSetMembers')).toHaveLength(1);
      expect(rowsOf('ValueSetMembers')[0].id).toBe(
        affiliationMemberId(type, 'NIT_EXHIBICION'),
      );
    });
  });

  describe('base que ya trae los conjuntos del paquete de seeds del modelo', () => {
    it('no toca un conjunto con otro id y avisa', async () => {
      const foreign = new Map([
        [
          'VS_AFFILIATION_DOCUMENT_TYPE',
          '5317e908-a0ea-599f-b5ff-b366376b4a07',
        ],
      ]);
      const { service, rowsOf, logger } = build(new Set(), foreign);

      const counters = await service.run();

      expect(counters.skippedForeignSets).toBe(1);
      expect(counters.valueSets).toBe(3);
      expect(rowsOf('ValueSets').map((row) => row.internalCode)).not.toContain(
        'VS_AFFILIATION_DOCUMENT_TYPE',
      );
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('si todos son ajenos, no inserta ninguna fila', async () => {
      const foreign = new Map(
        AFFILIATION_CATALOG_SETS.map(
          (set) => [set.code, 'ffffffff-ffff-5fff-bfff-ffffffffffff'] as const,
        ),
      );
      const { service, created } = build(new Set(), foreign);

      const counters = await service.run();

      expect(counters.skippedForeignSets).toBe(4);
      expect(created).toHaveLength(0);
    });
  });

  describe('forma del catálogo frente a lo que exige el dominio', () => {
    const codesOf = (valueSet: string): string[] =>
      AFFILIATION_CATALOG_SETS.find(
        (set) => set.code === valueSet,
      )!.members.map((member) => member.code);

    it('usa como internal_code las mismas constantes que consulta el servicio de dominio', () => {
      expect(AFFILIATION_CATALOG_SETS.map((set) => set.code)).toEqual([
        AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
        AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
        AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
        LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
      ]);
    });

    it('incluye un tipo de documento por cada rol de afiliación', () => {
      const required = AFFILIATION_DOCUMENT_ROLES.map(
        (role) => DOCUMENT_TYPE_CODE_BY_ROLE[role],
      );
      expect(codesOf(AFFILIATION_DOCUMENT_VALUE_SETS.documentType)).toEqual(
        expect.arrayContaining(required),
      );
    });

    it('incluye cada autoridad emisora boliviana y la de jurisdicción sin nombrar', () => {
      expect(codesOf(AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority)).toEqual(
        expect.arrayContaining([
          ...Object.values(BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE),
          ISSUING_AUTHORITY_OTHER,
        ]),
      );
    });

    it('incluye el estado con el que nace todo documento', () => {
      expect(
        codesOf(AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus),
      ).toContain(DOCUMENT_VERIFICATION_PENDING);
    });

    it('incluye cada rol de representante y de gerencia', () => {
      expect(codesOf(LEGAL_REPRESENTATIVE_ROLE_VALUE_SET)).toEqual(
        expect.arrayContaining(Object.values(REPRESENTATIVE_ROLE_CODE)),
      );
    });

    it('escribe todos los códigos en MAYÚSCULAS, como los busca el servicio', () => {
      for (const set of AFFILIATION_CATALOG_SETS) {
        for (const member of set.members) {
          expect(member.code).toBe(member.code.toUpperCase());
        }
      }
    });
  });

  describe('contrato con AffiliationDocumentConceptsService (doble, sin base)', () => {
    /**
     * Alimenta al servicio REAL con las filas que el seeder acaba de crear, a
     * través de dobles de los dos repositorios. Prueba que lo sembrado alcanza
     * para que `resolve()` no responda «no está disponible» ni «no incluye el
     * código». No prueba el SQL: los repositorios son un doble.
     */
    it('resuelve los cuatro mapas con lo que sembró el seeder', async () => {
      const { service, rowsOf } = build();
      await service.run();

      const valueSets = rowsOf('ValueSets');
      const versions = rowsOf('ValueSetVersions');
      const members = rowsOf('ValueSetMembers');
      const concepts = new Map(
        rowsOf('CatalogConcepts').map((row) => [row.id, row] as const),
      );

      const valueSetsRepo = {
        findByInternalCode: mockFn((_em: any, code: string) =>
          Promise.resolve(
            valueSets.find((row) => row.internalCode === code) ?? null,
          ),
        ),
        findIncludedConceptIdsByValueSet: mockFn(
          (_em: any, valueSetId: string) => {
            const version = versions.find(
              (row) => row.valueSetId === valueSetId && row.isDefault,
            );
            if (!version) return Promise.resolve(null);
            return Promise.resolve(
              members
                .filter(
                  (row) => row.valueSetVersionId === version.id && row.included,
                )
                .map((row) => row.conceptId),
            );
          },
        ),
      };
      const conceptsRepo = {
        findByIds: mockFn((_em: any, ids: string[]) =>
          Promise.resolve(
            new Map(ids.map((id) => [id, concepts.get(id)] as const)),
          ),
        ),
      };
      const domain = new AffiliationDocumentConceptsService(
        valueSetsRepo as any,
        conceptsRepo as any,
      );

      const resolved = await domain.resolve({} as any);

      expect(resolved.documentType.get('NIT_EXHIBICION')).toBeDefined();
      expect(resolved.issuingAuthority.get('SEDES')).toBeDefined();
      expect(resolved.verificationStatus.get('PENDIENTE')).toBeDefined();
      expect(
        resolved.representativeRole.get('GERENTE_COMERCIAL'),
      ).toBeDefined();
    });
  });
});
