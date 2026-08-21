import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BoGeographySeedService } from './bo-geography-seed.service';
import {
  BO_DEPARTMENT_VALUE_SET,
  BO_DEPARTMENTS,
  boDepartmentConceptId,
  boDepartmentMemberId,
  boDepartmentValueSetId,
  boDepartmentVersionId,
} from './bo-geography.catalog';

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `glossary-seed.service.spec.ts`: un `em` en memoria que responde
 * `find`/`create`/`flush` sin tocar una base real.
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
  const service = new BoGeographySeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    logger,
  };
}

describe('BoGeographySeedService', () => {
  describe('primera corrida sobre una base vacía', () => {
    it('materializa el conjunto, su versión vigente y los nueve departamentos', async () => {
      const { service, rowsOf } = build();

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 1,
        versions: 1,
        departments: 9,
        designations: 9,
        properties: 9,
        memberships: 9,
      });

      const [conjunto] = rowsOf('ValueSets');
      expect(conjunto).toMatchObject({
        id: boDepartmentValueSetId(),
        internalCode: BO_DEPARTMENT_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el desplegable.
      const [version] = rowsOf('ValueSetVersions');
      expect(version).toMatchObject({
        id: boDepartmentVersionId(),
        valueSetId: boDepartmentValueSetId(),
        isDefault: true,
      });
    });

    it('los conceptos llevan el nombre en castellano, que es lo que pinta el desplegable', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const nombres = rowsOf('CatalogConcepts').map((fila) => fila.display);
      expect(nombres).toEqual([
        'Chuquisaca',
        'La Paz',
        'Cochabamba',
        'Oruro',
        'Potosí',
        'Tarija',
        'Santa Cruz',
        'Beni',
        'Pando',
      ]);
      // Todos seleccionables: la expansión filtra por `selectable` y un
      // departamento no seleccionable sería una opción que no se puede elegir.
      expect(
        rowsOf('CatalogConcepts').every((fila) => fila.selectable === true),
      ).toBe(true);
    });

    it('la expansión conserva el orden oficial en su ordinal', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const miembros = rowsOf('ValueSetMembers');
      expect(miembros.map((fila) => fila.ordinal)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8,
      ]);
      expect(miembros[0]).toMatchObject({
        id: boDepartmentMemberId('CH'),
        valueSetVersionId: boDepartmentVersionId(),
        conceptId: boDepartmentConceptId('CH'),
        included: true,
      });
      // Santa Cruz es el séptimo por número de departamento, no el primero por
      // población: el orden es el del INE, el mismo de todo documento oficial.
      expect(miembros[6]).toMatchObject({
        conceptId: boDepartmentConceptId('SC'),
      });
    });

    it('cada departamento lleva su subdivisión ISO 3166-2', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const isos = rowsOf('ConceptProperties').map((fila) => fila.valueJson);
      expect(isos).toEqual([
        'BO-H',
        'BO-L',
        'BO-C',
        'BO-O',
        'BO-P',
        'BO-T',
        'BO-S',
        'BO-B',
        'BO-N',
      ]);
    });
  });

  describe('idempotencia', () => {
    it('con todo ya sembrado no escribe una sola fila', async () => {
      // La base «ya sembrada» se arma con lo que escribe una primera corrida,
      // que es exactamente lo que habría en disco tras el primer arranque. Se
      // toman los ids de ahí y no de una lista escrita a mano para que la
      // prueba no pueda quedar desincronizada del seed.
      const primeraPasada = build();
      await primeraPasada.service.run();
      const yaSembrado = new Set<string>(
        primeraPasada.created.map((fila) => fila.data.id),
      );

      const segunda = build(yaSembrado);
      const counters = await segunda.service.run();

      expect(counters).toEqual({
        valueSets: 0,
        versions: 0,
        departments: 0,
        designations: 0,
        properties: 0,
        memberships: 0,
      });
      expect(segunda.created).toHaveLength(0);
      // Una corrida sin trabajo tampoco ensucia el log del arranque.
      expect(segunda.logger.info).not.toHaveBeenCalled();
    });

    it('una siembra a medias completa sólo lo que falta', async () => {
      // El caso real: alguien creó el conjunto a mano y nunca sus miembros.
      const { service, rowsOf } = build(
        new Set([boDepartmentValueSetId(), boDepartmentVersionId()]),
      );

      const counters = await service.run();

      expect(counters.valueSets).toBe(0);
      expect(counters.versions).toBe(0);
      expect(counters.departments).toBe(9);
      expect(counters.memberships).toBe(9);
      expect(rowsOf('ValueSets')).toHaveLength(0);
      expect(rowsOf('ValueSetVersions')).toHaveLength(0);
    });
  });

  describe('el catálogo en sí', () => {
    it('declara los nueve departamentos, sin siglas repetidas', () => {
      expect(BO_DEPARTMENTS).toHaveLength(9);
      const siglas = BO_DEPARTMENTS.map((department) => department.code);
      expect(new Set(siglas).size).toBe(9);
    });

    it('los ids son deterministas: dos derivaciones dan el mismo uuid', () => {
      expect(boDepartmentConceptId('SC')).toBe(boDepartmentConceptId('SC'));
      expect(boDepartmentConceptId('SC')).not.toBe(boDepartmentConceptId('LP'));
      // La idempotencia del seed descansa entera en esto: si el id de un
      // departamento cambiara entre corridas, cada arranque insertaría nueve
      // filas nuevas.
      expect(boDepartmentValueSetId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });
});
