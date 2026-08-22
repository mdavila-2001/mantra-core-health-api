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
import { GLOSSARY_TAXONOMY } from './glossary-taxonomy';

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `dynamic-enum-seed.service.spec.ts`: un `em` en memoria que
 * responde `find`/`create`/`flush` sin tocar una base real.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @returns Servicio, filas creadas y cuántas veces se flusheó.
 */
function build(existing: Set<string> = new Set()) {
  const created: { entity: string; data: any }[] = [];
  let flushes = 0;

  const em = {
    find: mockFn((entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
      );
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => {
      flushes += 1;
      return Promise.resolve();
    }),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new GlossarySeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    /** Cuántas veces se flusheó. */
    flushes: () => flushes,
    logger,
  };
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

describe('GlossarySeedService', () => {
  it('materializa la taxonomía y el catálogo curado sobre una base vacía', async () => {
    const g = build();

    const result = await g.service.run();

    expect(g.rowsOf('ValueSets')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('ValueSetVersions')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('CatalogConcepts')).toHaveLength(GLOSSARY_TERMS.length);
    expect(g.rowsOf('ConceptDesignations')).toHaveLength(TOTAL_DESIGNATIONS);
    // 3 propiedades por término: slug, definición clínica, resumen llano.
    expect(g.rowsOf('ConceptProperties')).toHaveLength(
      GLOSSARY_TERMS.length * 3,
    );
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
    // La única discrepancia conocida de la fuente (ver cabecera del catálogo).
    expect(result.orphanRelationships).toBe(1);
  });

  it('todo término se siembra activo (`TERM_ACTIVE`), nunca en borrador', async () => {
    const g = build();

    await g.service.run();

    for (const concept of g.rowsOf('CatalogConcepts')) {
      expect(concept.stateConceptId).toEqual(expect.any(String));
    }
    // Todos comparten el mismo estado: el activo.
    const estados = new Set(
      g.rowsOf('CatalogConcepts').map((concept) => concept.stateConceptId),
    );
    expect(estados.size).toBe(1);
  });

  it('no siembra ninguna propiedad `glossary-image`: decisión deliberada, no una omisión', async () => {
    const g = build();

    await g.service.run();

    const propertyCodes = new Set(
      g.rowsOf('ConceptProperties').map((property) => property.propertyCode),
    );
    expect(propertyCodes).toEqual(
      new Set([
        'glossary-slug',
        'glossary-clinical-definition',
        'glossary-plain-summary',
      ]),
    );
  });

  it('re-sembrar sobre una base ya poblada no duplica ninguna fila (reseed idempotente)', async () => {
    // Se siembra una vez para recoger los identificadores deterministas y se
    // vuelve a correr declarándolos como existentes — mismo patrón que
    // `DynamicEnumSeedService`.
    const primera = build();
    await primera.service.run();
    const yaExisten = new Set<string>(
      primera.created.map((row) => row.data.id as string),
    );

    const segunda = build(yaExisten);
    const result = await segunda.service.run();

    expect(segunda.created).toEqual([]);
    expect(result).toEqual({
      valueSets: 0,
      terms: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
      relationships: 0,
      orphanRelationships: 1,
    });
  });

  it('los identificadores deterministas de dos corridas independientes coinciden byte a byte', async () => {
    const primera = build();
    await primera.service.run();
    const segunda = build();
    await segunda.service.run();

    const idsPrimera = primera.created.map((row) => row.data.id).sort();
    const idsSegunda = segunda.created.map((row) => row.data.id).sort();
    expect(idsPrimera).toEqual(idsSegunda);
  });

  it('advierte, pero no falla, ante la relación huérfana declarada en la fuente', async () => {
    const g = build();

    await g.service.run();

    expect(g.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSlug: 'hipertension-arterial',
        targetSlug: 'control-de-signos-vitales',
      }),
      expect.any(String),
    );
  });
});
