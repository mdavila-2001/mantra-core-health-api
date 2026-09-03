import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BoOccupationsSeedService } from './bo-occupations-seed.service';
import {
  BO_OCCUPATION_GROUP_PROPERTY_CODE,
  BO_OCCUPATION_VALUE_SET,
  BO_OCCUPATIONS,
  boOccupationConceptCode,
  boOccupationConceptId,
  boOccupationDesignationId,
  boOccupationGroupPropertyId,
  boOccupationMemberId,
  boOccupationValueSetId,
  boOccupationVersionId,
} from './bo-occupations.catalog';

/** Cuántas ocupaciones declara el catálogo; el resto de las cuentas sale de acá. */
const OCUPACIONES = BO_OCCUPATIONS.length;

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `bo-geography-seed.service.spec.ts`: un `em` en memoria que
 * responde `find`/`create`/`flush` sin tocar una base real.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @returns Servicio, filas creadas y utilidades de lectura.
 */
function build(existing: Set<string> = new Set()) {
  const created: { entity: string; data: any }[] = [];

  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
      );
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BoOccupationsSeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    logger,
  };
}

describe('BoOccupationsSeedService', () => {
  describe('primera corrida sobre una base vacía', () => {
    it('materializa el conjunto, su versión vigente y todas las ocupaciones', async () => {
      const { service, rowsOf } = build();

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 1,
        versions: 1,
        occupations: OCUPACIONES,
        // Una designación preferida y una rama de actividad por concepto.
        designations: OCUPACIONES,
        properties: OCUPACIONES,
        memberships: OCUPACIONES,
      });

      const [conjunto] = rowsOf('ValueSets');
      expect(conjunto).toMatchObject({
        id: boOccupationValueSetId(),
        internalCode: BO_OCCUPATION_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el desplegable
      // del alta de paciente.
      const [version] = rowsOf('ValueSetVersions');
      expect(version).toMatchObject({
        id: boOccupationVersionId(),
        valueSetId: boOccupationValueSetId(),
        isDefault: true,
      });
    });

    it('los conceptos llevan el nombre en castellano y son seleccionables', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const conceptos = rowsOf('CatalogConcepts');
      expect(conceptos[0]).toMatchObject({
        code: boOccupationConceptCode('ABOGADO'),
        display: 'Abogado / Abogada',
      });
      // La expansión filtra por `selectable`: una ocupación no seleccionable
      // sería una opción que no se puede elegir.
      expect(conceptos.every((fila) => fila.selectable === true)).toBe(true);
      // El código va prefijado por el dominio: `catalog_concepts.code` es único
      // por versión del sistema de códigos, y todo el catálogo interno comparte
      // una sola.
      expect(
        conceptos.every((fila) =>
          String(fila.code).startsWith('occupation:bo:'),
        ),
      ).toBe(true);
    });

    it('la expansión conserva el orden alfabético del catálogo', async () => {
      const { service, rowsOf } = build();

      await service.run();

      // El desplegable no ordena nada del lado del cliente: se apoya en este
      // `ordinal`, que es lo que hace que la lista se recorra por la letra.
      const miembros = rowsOf('ValueSetMembers');
      expect(miembros.map((fila) => fila.ordinal)).toEqual(
        BO_OCCUPATIONS.map((_, indice) => indice),
      );
      expect(miembros[0]).toMatchObject({
        id: boOccupationMemberId('ABOGADO'),
        conceptId: boOccupationConceptId('ABOGADO'),
        included: true,
      });
      // «Otra ocupación» va al final a propósito: ofrecida entre medio se elige
      // por comodidad antes de haber buscado.
      expect(BO_OCCUPATIONS[OCUPACIONES - 1]?.code).toBe('OTRA');
    });

    it('cada ocupación guarda su rama de actividad', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const propiedades = rowsOf('ConceptProperties');
      expect(propiedades).toHaveLength(OCUPACIONES);
      expect(propiedades[0]).toMatchObject({
        conceptId: boOccupationConceptId('ABOGADO'),
        propertyCode: BO_OCCUPATION_GROUP_PROPERTY_CODE,
        valueJson: 'Profesionales',
      });
    });
  });

  describe('segunda corrida', () => {
    it('no escribe nada: los ids son deterministas y ya están', async () => {
      const todo = new Set<string>([
        boOccupationValueSetId(),
        boOccupationVersionId(),
        ...BO_OCCUPATIONS.flatMap((ocupacion) => [
          boOccupationConceptId(ocupacion.code),
          boOccupationMemberId(ocupacion.code),
        ]),
      ]);
      // Las designaciones y las propiedades tienen su propio derivador; se
      // agregan por su id real para que la pasada no cree ninguna.
      for (const ocupacion of BO_OCCUPATIONS) {
        todo.add(boOccupationDesignationId(ocupacion.code));
        todo.add(boOccupationGroupPropertyId(ocupacion.code));
      }

      const { service, created } = build(todo);

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 0,
        versions: 0,
        occupations: 0,
        designations: 0,
        properties: 0,
        memberships: 0,
      });
      expect(created).toHaveLength(0);
    });
  });

  describe('invariantes del catálogo', () => {
    it('ningún código se declara dos veces', () => {
      // Dos entradas con el mismo código colapsarían en el mismo id
      // determinista y una taparía a la otra sin que nadie se entere.
      const codigos = BO_OCCUPATIONS.map((ocupacion) => ocupacion.code);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    it('ningún nombre se repite: dos opciones iguales en un desplegable no se pueden elegir', () => {
      const nombres = BO_OCCUPATIONS.map((ocupacion) => ocupacion.name);
      expect(new Set(nombres).size).toBe(nombres.length);
    });
  });
});
