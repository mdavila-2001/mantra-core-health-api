import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import {
  CONCEPT_INDEX_BY_ID,
  DYNAMIC_ENUM_CATALOG,
} from './dynamic-enum-catalog';
import { CONCEPTS } from '../constants/concepts';

/**
 * Construye el seed con un contexto de persistencia controlado.
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
  const service = new DynamicEnumSeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    /** Cuántas veces se flusheó, que es el orden por niveles. */
    flushes: () => flushes,
  };
}

/** Cuántas opciones declara el catálogo en total. */
const TOTAL_OPTIONS = DYNAMIC_ENUM_CATALOG.reduce(
  (total, entry) => total + entry.concepts.length,
  0,
);

/** Cuántos amarres declara el catálogo en total. */
const TOTAL_TARGETS = DYNAMIC_ENUM_CATALOG.reduce(
  (total, entry) => total + entry.targets.length,
  0,
);

describe('DynamicEnumSeedService', () => {
  it('materializa los siete niveles del catálogo sobre una base vacía', async () => {
    const d = build();

    const result = await d.service.run();

    expect(d.rowsOf('ValueSets')).toHaveLength(DYNAMIC_ENUM_CATALOG.length);
    expect(d.rowsOf('ValueSetVersions')).toHaveLength(
      DYNAMIC_ENUM_CATALOG.length,
    );
    expect(d.rowsOf('ValueSetMembers')).toHaveLength(TOTAL_OPTIONS);
    expect(d.rowsOf('DynamicEnumDefinitions')).toHaveLength(
      DYNAMIC_ENUM_CATALOG.length,
    );
    expect(d.rowsOf('DynamicEnumVersions')).toHaveLength(
      DYNAMIC_ENUM_CATALOG.length,
    );
    expect(d.rowsOf('DynamicEnumOptions')).toHaveLength(TOTAL_OPTIONS);
    expect(d.rowsOf('DynamicEnumBindings')).toHaveLength(TOTAL_TARGETS);
    expect(result.bindings).toBe(TOTAL_TARGETS);
  });

  it('flushea por niveles, porque las FK son columnas uuid planas', async () => {
    const d = build();

    await d.service.run();

    // Un solo flush al final violaría la FK del padre: MikroORM no ordena los
    // inserts a partir de columnas `uuid` que no son relaciones.
    expect(d.flushes()).toBe(7);
  });

  it('no reinserta nada cuando el catálogo ya está sembrado', async () => {
    // Se siembra una vez para recoger los identificadores deterministas y se
    // vuelve a correr declarándolos como existentes.
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
      definitions: 0,
      options: 0,
      bindings: 0,
    });
  });

  it('resuelve código y rótulo de cada opción contra el catálogo de conceptos', async () => {
    const d = build();

    await d.service.run();

    for (const option of d.rowsOf('DynamicEnumOptions')) {
      const concepto = CONCEPT_INDEX_BY_ID.get(option.conceptId);
      expect(option.code).toBe(concepto?.code);
      expect(option.display).toBe(concepto?.display);
      expect(option.enabled).toBe(true);
    }
  });

  it('marca por defecto exactamente la opción que el catálogo declara', async () => {
    const d = build();

    await d.service.run();

    const conDefecto = DYNAMIC_ENUM_CATALOG.filter(
      (entry) => entry.defaultConceptId,
    );
    const marcadas = d
      .rowsOf('DynamicEnumOptions')
      .filter((option) => option.isDefault);

    expect(marcadas).toHaveLength(conDefecto.length);
    for (const entry of conDefecto) {
      expect(
        marcadas.some((option) => option.conceptId === entry.defaultConceptId),
      ).toBe(true);
    }
  });

  it('parte cada destino en esquema, tabla y columna', async () => {
    const d = build();

    await d.service.run();

    const genero = d
      .rowsOf('DynamicEnumBindings')
      .find(
        (binding) =>
          binding.targetFieldName === 'administrative_gender_concept_id',
      );

    expect(genero).toMatchObject({
      targetSchemaName: 'profiles',
      targetEntityName: 'persons',
      statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
      validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
    });
  });

  it('publica la versión de la enumeración, no la deja en borrador', async () => {
    const d = build();

    await d.service.run();

    for (const version of d.rowsOf('DynamicEnumVersions')) {
      expect(version.statusConceptId).toBe(CONCEPTS.ENUM_VERSION_PUBLISHED);
      expect(version.cacheToken).toEqual(expect.any(String));
    }
  });

  it('deriva un testigo de caché distinto por enumeración', async () => {
    const d = build();

    await d.service.run();

    const testigos = d
      .rowsOf('DynamicEnumVersions')
      .map((version) => version.cacheToken);

    expect(new Set(testigos).size).toBe(testigos.length);
  });

  it('numera los miembros y las opciones en el orden declarado', async () => {
    const d = build();

    await d.service.run();

    const primera = DYNAMIC_ENUM_CATALOG[0];
    const opciones = d
      .rowsOf('DynamicEnumOptions')
      .slice(0, primera.concepts.length);

    expect(opciones.map((option) => option.ordinal)).toEqual(
      primera.concepts.map((_, index) => index),
    );
    expect(opciones.map((option) => option.conceptId)).toEqual([
      ...primera.concepts,
    ]);
  });
});
