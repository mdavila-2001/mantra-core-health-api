import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SegipOccupationsSeedService } from './segip-occupations-seed.service';
import {
  SEGIP_OCCUPATION_GROUP_PROPERTY_CODE,
  SEGIP_OCCUPATION_VALUE_SET,
  SEGIP_OCCUPATIONS,
  segipOccupationConceptCode,
  segipOccupationConceptId,
  segipOccupationMemberId,
  segipOccupationValueSetId,
  segipOccupationVersionId,
} from './segip-occupations.catalog';

/** Cuántas ocupaciones declara el catálogo; el resto de las cuentas sale de acá. */
const OCUPACIONES = SEGIP_OCCUPATIONS.length;

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
  const service = new SegipOccupationsSeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    logger,
  };
}

describe('SegipOccupationsSeedService', () => {
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
        id: segipOccupationValueSetId(),
        internalCode: SEGIP_OCCUPATION_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el desplegable
      // del alta de paciente.
      const [version] = rowsOf('ValueSetVersions');
      expect(version).toMatchObject({
        id: segipOccupationVersionId(),
        valueSetId: segipOccupationValueSetId(),
        isDefault: true,
      });
    });

    it('los conceptos llevan el nombre en castellano y son seleccionables', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const conceptos = rowsOf('CatalogConcepts');
      expect(conceptos[0]).toMatchObject({
        code: segipOccupationConceptCode('ABOGADO'),
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
          String(fila.code).startsWith('occupation:segip:'),
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
        SEGIP_OCCUPATIONS.map((_, indice) => indice),
      );
      expect(miembros[0]).toMatchObject({
        id: segipOccupationMemberId('ABOGADO'),
        conceptId: segipOccupationConceptId('ABOGADO'),
        included: true,
      });
      // «Otra ocupación» va al final a propósito: ofrecida entre medio se elige
      // por comodidad antes de haber buscado.
      expect(SEGIP_OCCUPATIONS[OCUPACIONES - 1]?.code).toBe('OTRA');
    });

    it('cada ocupación guarda su rama de actividad', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const propiedades = rowsOf('ConceptProperties');
      expect(propiedades).toHaveLength(OCUPACIONES);
      expect(propiedades[0]).toMatchObject({
        conceptId: segipOccupationConceptId('ABOGADO'),
        propertyCode: SEGIP_OCCUPATION_GROUP_PROPERTY_CODE,
        valueJson: 'Profesionales',
      });
    });
  });

  describe('segunda corrida', () => {
    it('no escribe nada: los ids son deterministas y ya están', async () => {
      const todo = new Set<string>([
        segipOccupationValueSetId(),
        segipOccupationVersionId(),
        ...SEGIP_OCCUPATIONS.flatMap((ocupacion) => [
          segipOccupationConceptId(ocupacion.code),
          segipOccupationMemberId(ocupacion.code),
        ]),
      ]);
      // Las designaciones y las propiedades tienen su propio derivador; se
      // agregan por su id real para que la pasada no cree ninguna.
      const { segipOccupationDesignationId, segipOccupationGroupPropertyId } =
        await import('./segip-occupations.catalog');
      for (const ocupacion of SEGIP_OCCUPATIONS) {
        todo.add(segipOccupationDesignationId(ocupacion.code));
        todo.add(segipOccupationGroupPropertyId(ocupacion.code));
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
      const codigos = SEGIP_OCCUPATIONS.map((ocupacion) => ocupacion.code);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    it('ningún nombre se repite: dos opciones iguales en un desplegable no se pueden elegir', () => {
      const nombres = SEGIP_OCCUPATIONS.map((ocupacion) => ocupacion.name);
      expect(new Set(nombres).size).toBe(nombres.length);
    });
  });
});
