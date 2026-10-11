import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GlossarySeedService } from './glossary-seed.service';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';
import { GLOSSARY_SOURCE_REFERENCES } from './glossary-source-provenance';
import {
  GLOSSARY_TAXONOMY,
  glossaryPreferredDesignationId,
  glossaryPropertyId,
  glossaryRelationshipId,
  glossarySynonymDesignationId,
  glossaryTermConceptId,
  glossaryValueSetMemberId,
  glossaryValueSetVersionId,
} from './glossary-taxonomy';
import {
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
  glossaryRelationTypeConceptId,
} from '../../modules/terminology/glossary.constants';

/** Filas por entidad y por id: el estado de la base de prueba. */
type Store = Map<string, Map<string, any>>;

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `dynamic-enum-seed.service.spec.ts`: un `em` en memoria que
 * responde `find`/`create`/`remove`/`flush` sin tocar una base real. Desde la
 * reconciliación guarda las filas enteras, porque `find` ya no pregunta sólo
 * por ids: compara contenido.
 *
 * @param initial - Filas que la base ya tiene, por entidad.
 * @returns Servicio, filas creadas y quitadas, y el estado final.
 */
function build(initial: Store = new Map()) {
  const store: Store = new Map(
    [...initial].map(([entity, rows]) => [
      entity,
      new Map([...rows].map(([id, row]) => [id, { ...row }])),
    ]),
  );
  const table = (entity: string): Map<string, any> => {
    if (!store.has(entity)) store.set(entity, new Map());
    return store.get(entity)!;
  };
  const matches = (row: any, where: Record<string, any>): boolean =>
    Object.entries(where).every(([key, value]) =>
      value !== null && typeof value === 'object' && '$in' in value
        ? (value.$in as unknown[]).includes(row[key])
        : row[key] === value,
    );

  const created: { entity: string; data: any }[] = [];
  const removed: { entity: string; data: any }[] = [];
  let flushes = 0;

  const em = {
    find: mockFn((entity: any, where: any) =>
      Promise.resolve(
        [...table(entity.name).values()].filter((row) => matches(row, where)),
      ),
    ),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      table(entity.name).set(data.id, data);
      return data;
    }),
    remove: mockFn((row: any) => {
      for (const [entity, rows] of store) {
        if (rows.get(row.id) === row) {
          rows.delete(row.id);
          removed.push({ entity, data: row });
        }
      }
    }),
    flush: mockFn(() => {
      flushes += 1;
      return Promise.resolve();
    }),
    // `backfillTermCodeSystem` (FND-25-03) es un `UPDATE ... WHERE` de una
    // sola sentencia: todo lo que siembra este doble ya cuelga del code
    // system propio, así que no hay nada que backfillear — 0.
    nativeUpdate: mockFn(() => Promise.resolve(0)),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new GlossarySeedService(orm as any, logger as any);

  return {
    service,
    created,
    removed,
    store,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    /** Filas que la base tiene ahora para una entidad. */
    rowsIn: (entity: string) => [...table(entity).values()],
    /** Cuántas veces se flusheó. */
    flushes: () => flushes,
    logger,
  };
}

/** Una base ya sembrada con el catálogo actual. */
async function seeded(): Promise<Store> {
  const g = build();
  await g.service.run();
  return g.store;
}

/** Cuántas relaciones declara el catálogo curado (contando la huérfana conocida). */
const TOTAL_DECLARED_RELATIONS = GLOSSARY_TERMS.reduce(
  (total, term) => total + term.relations.length,
  0,
);

/** Cuántas de esas relaciones resuelven a un slug conocido. */
const KNOWN_SLUGS = new Set(GLOSSARY_TERMS.map((term) => term.slug));
const TOTAL_RESOLVABLE_RELATIONS = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total +
    term.relations.filter((relation) => KNOWN_SLUGS.has(relation.targetSlug))
      .length,
  0,
);

/** Cuántas membresías `(value set, concepto)` declara el catálogo (categoría + etiquetas + paraguas). */
const TOTAL_MEMBERSHIPS = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total + 1 /* categoría */ + term.tagKeys.length + 1 /* paraguas */,
  0,
);

/** Cuántas designaciones declara el catálogo (preferida ES + sinónimos). */
const TOTAL_DESIGNATIONS = GLOSSARY_TERMS.reduce(
  (total, term) => total + 1 /* preferida */ + (term.esSynonyms?.length ?? 0),
  0,
);

/**
 * Cuántas propiedades declara el catálogo: 3 por término (slug, definición
 * clínica, resumen llano), fuentes editoriales cuando están curadas y 4 más
 * (`active_ingredients`/`dosage_form`/`route`/`manufacturer`) con `drugFacts`.
 */
const TOTAL_PROPERTIES = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total +
    3 +
    (GLOSSARY_SOURCE_REFERENCES[term.slug] !== undefined ? 1 : 0) +
    (term.drugFacts ? 4 : 0),
  0,
);

describe('GlossarySeedService', () => {
  it('materializa la taxonomía y el catálogo curado sobre una base vacía', async () => {
    const g = build();

    const result = await g.service.run();

    expect(g.rowsOf('ValueSets')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('ValueSetVersions')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('CatalogConcepts')).toHaveLength(GLOSSARY_TERMS.length);
    expect(g.rowsOf('ConceptDesignations')).toHaveLength(TOTAL_DESIGNATIONS);
    expect(g.rowsOf('ConceptProperties')).toHaveLength(TOTAL_PROPERTIES);
    expect(g.rowsOf('ValueSetMembers')).toHaveLength(TOTAL_MEMBERSHIPS);
    expect(g.rowsOf('ConceptRelationships')).toHaveLength(
      TOTAL_RESOLVABLE_RELATIONS,
    );

    expect(result.valueSets).toBe(GLOSSARY_TAXONOMY.length);
    expect(result.terms).toBe(GLOSSARY_TERMS.length);
    expect(result.memberships).toBe(TOTAL_MEMBERSHIPS);
    expect(result.relationships).toBe(TOTAL_RESOLVABLE_RELATIONS);
    expect(result.orphanRelationships).toBe(
      TOTAL_DECLARED_RELATIONS - TOTAL_RESOLVABLE_RELATIONS,
    );
    expect(result.orphanRelationships).toBe(0);
  });

  it('todo término se siembra activo (`TERM_ACTIVE`), nunca en borrador', async () => {
    const g = build();

    await g.service.run();

    for (const concept of g.rowsOf('CatalogConcepts')) {
      expect(concept.stateConceptId).toEqual(expect.any(String));
    }
    // Todos comparten el mismo estado: el activo.
    const states = new Set(
      g.rowsOf('CatalogConcepts').map((concept) => concept.stateConceptId),
    );
    expect(states.size).toBe(1);
  });

  it('no siembra ninguna propiedad `glossary-image`: decisión deliberada, no una omisión', async () => {
    const g = build();

    await g.service.run();

    const propertyCodes = new Set(
      g.rowsOf('ConceptProperties').map((property) => property.propertyCode),
    );
    // Los cuatro códigos de FND-25-02 (`active_ingredients`/`dosage_form`/
    // `route`/`manufacturer`) sólo aparecen para los términos que declaran
    // `drugFacts`; las fuentes editoriales sólo para términos documentados.
    // Este test también fija que `glossary-image` nunca aparece.
    expect(propertyCodes.has('glossary-image')).toBe(false);
    const expected = new Set([
      'glossary-slug',
      'glossary-clinical-definition',
      'glossary-plain-summary',
      'glossary-sources',
      'active_ingredients',
      'dosage_form',
      'route',
      'manufacturer',
    ]);
    for (const code of propertyCodes) {
      expect(expected.has(code)).toBe(true);
    }

    const sourceProperties = g
      .rowsOf('ConceptProperties')
      .filter(
        (property) =>
          property.propertyCode === GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
      );
    expect(sourceProperties).toHaveLength(
      Object.keys(GLOSSARY_SOURCE_REFERENCES).length,
    );
    for (const [slug, references] of Object.entries(
      GLOSSARY_SOURCE_REFERENCES,
    )) {
      const property = sourceProperties.find(
        (candidate) =>
          candidate.id ===
          glossaryPropertyId(slug, GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE),
      );
      expect(property).toMatchObject({
        conceptId: glossaryTermConceptId(slug),
        dataType: 'json',
        valueJson: references,
      });
    }
  });

  it('re-sembrar sobre una base ya poblada no duplica ninguna fila (reseed idempotente)', async () => {
    // Se siembra una vez y se vuelve a correr sobre lo que quedó — mismo
    // patrón que `DynamicEnumSeedService`.
    const second = build(await seeded());
    const result = await second.service.run();

    expect(second.created).toEqual([]);
    expect(second.removed).toEqual([]);
    expect(result).toEqual({
      valueSets: 0,
      terms: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
      relationships: 0,
      orphanRelationships: 0,
      codeSystemBackfilled: 0,
      updated: 0,
      removed: 0,
    });
  });

  it('los identificadores deterministas de dos corridas independientes coinciden byte a byte', async () => {
    const first = build();
    await first.service.run();
    const second = build();
    await second.service.run();

    const idsFirst = first.created.map((row) => row.data.id).sort();
    const idsSecond = second.created.map((row) => row.data.id).sort();
    expect(idsFirst).toEqual(idsSecond);
  });

  it('no deja advertencia por la relación de control de signos vitales, que ya tiene destino', async () => {
    const g = build();

    await g.service.run();

    expect(g.logger.warn).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSlug: 'hipertension-arterial',
        targetSlug: 'control-de-signos-vitales',
      }),
      expect.any(String),
    );
  });

  describe('reconciliación de una base sembrada con el catálogo anterior', () => {
    const PT = 'tiempo-de-protrombina';
    const BLOODCOUNT = 'hemograma-completo';

    /**
     * La base tal como la dejó el catálogo de antes de la auditoría del
     * 2026-09-30: hemograma en «Pruebas diagnósticas», «Hipertermia» como
     * sinónimo de fiebre, el INR como sinónimo del tiempo de protrombina, su
     * nombre en inglés viejo, el resumen viejo de la warfarina y una relación
     * entre curados que el catálogo ya no declara.
     */
    async function basePrevious(): Promise<Store> {
      const store = await seeded();
      const rows = (entity: string) => store.get(entity)!;
      const put = (entity: string, row: any) => rows(entity).set(row.id, row);

      const bloodCount = glossaryTermConceptId(BLOODCOUNT);
      rows('ValueSetMembers').delete(
        glossaryValueSetMemberId('glossary-category-lab', bloodCount),
      );
      put('ValueSetMembers', {
        id: glossaryValueSetMemberId(
          'glossary-category-diagnostic-test',
          bloodCount,
        ),
        valueSetVersionId: glossaryValueSetVersionId(
          'glossary-category-diagnostic-test',
        ),
        conceptId: bloodCount,
      });

      put('ConceptDesignations', {
        id: glossarySynonymDesignationId('fiebre', 1),
        conceptId: glossaryTermConceptId('fiebre'),
        value: 'Hipertermia',
      });

      rows('CatalogConcepts').get(glossaryTermConceptId(PT)).display =
        'Prothrombin time (INR)';
      rows('ConceptDesignations').get(
        glossarySynonymDesignationId(PT, 0),
      ).value = 'INR';
      put('ConceptDesignations', {
        id: glossarySynonymDesignationId(PT, 1),
        conceptId: glossaryTermConceptId(PT),
        value: 'TP',
      });

      rows('ConceptProperties').get(
        glossaryPropertyId('warfarina', GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE),
      ).valueJson = {
        es: 'Es un medicamento que hace la sangre más líquida para evitar coágulos.',
      };

      put('ConceptRelationships', {
        id: glossaryRelationshipId('dialisis', 'RELATED_TERM', 'corazon'),
        sourceConceptId: glossaryTermConceptId('dialisis'),
        targetConceptId: glossaryTermConceptId('corazon'),
        relationshipTypeConceptId:
          glossaryRelationTypeConceptId('RELATED_TERM'),
      });
      return store;
    }

    it('mueve la categoría, corrige textos y quita sinónimos y relaciones que ya no van', async () => {
      const g = build(await basePrevious());

      const result = await g.service.run();

      const bloodCount = glossaryTermConceptId(BLOODCOUNT);
      const categories = g
        .rowsIn('ValueSetMembers')
        .filter(
          (m) =>
            m.conceptId === bloodCount &&
            [
              glossaryValueSetVersionId('glossary-category-lab'),
              glossaryValueSetVersionId('glossary-category-diagnostic-test'),
            ].includes(m.valueSetVersionId),
        )
        .map((m) => m.valueSetVersionId);
      expect(categories).toEqual([
        glossaryValueSetVersionId('glossary-category-lab'),
      ]);

      const designation = (id: string) =>
        g.rowsIn('ConceptDesignations').find((d) => d.id === id);
      expect(
        designation(glossarySynonymDesignationId('fiebre', 1)),
      ).toBeUndefined();
      expect(designation(glossarySynonymDesignationId(PT, 0))?.value).toBe(
        'TP',
      );
      expect(designation(glossarySynonymDesignationId(PT, 1))).toBeUndefined();

      expect(
        g
          .rowsIn('CatalogConcepts')
          .find((c) => c.id === glossaryTermConceptId(PT))?.display,
      ).toBe('Prothrombin time (PT)');
      expect(
        g
          .rowsIn('ConceptProperties')
          .find(
            (p) =>
              p.id ===
              glossaryPropertyId(
                'warfarina',
                GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
              ),
          )?.valueJson.es,
      ).toContain('tarde más en coagular');

      expect(
        g
          .rowsIn('ConceptRelationships')
          .some(
            (r) =>
              r.id ===
              glossaryRelationshipId('dialisis', 'RELATED_TERM', 'corazon'),
          ),
      ).toBe(false);

      // 1 membresía nueva (lab); 3 filas actualizadas (display, sinónimo,
      // resumen); 4 quitadas (categoría vieja, 2 sinónimos, 1 relación).
      expect(result.memberships).toBe(1);
      expect(result.updated).toBe(3);
      expect(result.removed).toBe(4);
    });

    it('una segunda corrida sobre la base reconciliada no escribe nada', async () => {
      const first = build(await basePrevious());
      await first.service.run();

      const second = build(first.store);
      const result = await second.service.run();

      expect(second.created).toEqual([]);
      expect(second.removed).toEqual([]);
      expect(result.updated).toBe(0);
      expect(result.removed).toBe(0);
    });

    it('no toca filas ajenas colgadas de un término curado', async () => {
      const store = await seeded();
      const fever = glossaryTermConceptId('fiebre');
      const foreign: [string, any][] = [
        [
          'ConceptDesignations',
          { id: 'designacion-ajena', conceptId: fever, value: 'Calentura' },
        ],
        [
          'ConceptProperties',
          {
            id: 'propiedad-ajena',
            conceptId: fever,
            propertyCode: 'nota-local',
            valueJson: { es: 'x' },
          },
        ],
        [
          'ValueSetMembers',
          {
            id: 'membresia-ajena',
            conceptId: fever,
            valueSetVersionId: 'version-de-otro-value-set',
          },
        ],
        [
          'ConceptRelationships',
          {
            id: 'relacion-ajena',
            sourceConceptId: fever,
            targetConceptId: glossaryTermConceptId('corazon'),
            relationshipTypeConceptId:
              glossaryRelationTypeConceptId('RELATED_TERM'),
          },
        ],
        [
          'ConceptDesignations',
          {
            // Id fuera del espacio que este servicio genera para la preferida.
            id: `${glossaryPreferredDesignationId('fiebre')}-copia`,
            conceptId: fever,
            value: 'Fiebre (copia)',
          },
        ],
      ];
      for (const [entity, row] of foreign) store.get(entity)!.set(row.id, row);

      const g = build(store);
      const result = await g.service.run();

      for (const [entity, row] of foreign) {
        expect(g.rowsIn(entity).find((r) => r.id === row.id)).toEqual(row);
      }
      expect(result.updated).toBe(0);
      expect(result.removed).toBe(0);
    });
  });
});
