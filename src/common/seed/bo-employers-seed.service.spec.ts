import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BoEmployersSeedService } from './bo-employers-seed.service';
import {
  BO_EMPLOYER_OTHER_CODE,
  BO_EMPLOYER_SECTOR_PROPERTY_CODE,
  BO_EMPLOYER_VALUE_SET,
  BO_EMPLOYERS,
  boEmployerConceptCode,
  boEmployerConceptId,
  boEmployerDesignationId,
  boEmployerMemberId,
  boEmployerSectorPropertyId,
  boEmployerValueSetId,
  boEmployerVersionId,
} from './bo-employers.catalog';

/** Cuántas empresas declara el catálogo; el resto de las cuentas sale de acá. */
const EMPRESAS = BO_EMPLOYERS.length;

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `bo-occupations-seed.service.spec.ts`: un `em` en memoria que
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
  const service = new BoEmployersSeedService(orm as any, logger as any);

  return {
    service,
    created,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    logger,
  };
}

describe('BoEmployersSeedService', () => {
  describe('primera corrida sobre una base vacía', () => {
    it('materializa el conjunto, su versión vigente y todas las empresas', async () => {
      const { service, rowsOf } = build();

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 1,
        versions: 1,
        employers: EMPRESAS,
        // Una designación preferida y un sector económico por concepto.
        designations: EMPRESAS,
        properties: EMPRESAS,
        memberships: EMPRESAS,
      });

      const [conjunto] = rowsOf('ValueSets');
      expect(conjunto).toMatchObject({
        id: boEmployerValueSetId(),
        internalCode: BO_EMPLOYER_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el buscador
      // de empresas del alta de paciente.
      const [version] = rowsOf('ValueSetVersions');
      expect(version).toMatchObject({
        id: boEmployerVersionId(),
        valueSetId: boEmployerValueSetId(),
        isDefault: true,
      });
    });

    it('los conceptos llevan la razón social y son seleccionables', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const conceptos = rowsOf('CatalogConcepts');
      // La expansión filtra por `selectable`: una empresa no seleccionable
      // sería una opción que no se puede elegir.
      expect(conceptos.every((fila) => fila.selectable === true)).toBe(true);
      // El código va prefijado por el dominio: `catalog_concepts.code` es único
      // por versión del sistema de códigos, y todo el catálogo interno comparte
      // una sola — sin el prefijo, este `OTRA` chocaría con el de ocupaciones.
      expect(
        conceptos.every((fila) => String(fila.code).startsWith('employer:bo:')),
      ).toBe(true);
      expect(
        conceptos.some((fila) => fila.code === boEmployerConceptCode('ENTEL')),
      ).toBe(true);
    });

    it('la expansión conserva el orden declarado del catálogo', async () => {
      const { service, rowsOf } = build();

      await service.run();

      // El buscador no ordena nada del lado del cliente: se apoya en este
      // `ordinal`, que agrupa por sector y deja las salidas al final.
      const miembros = rowsOf('ValueSetMembers');
      expect(miembros.map((fila) => fila.ordinal)).toEqual(
        BO_EMPLOYERS.map((_, indice) => indice),
      );
      expect(miembros[0]).toMatchObject({
        conceptId: boEmployerConceptId(BO_EMPLOYERS[0]!.code),
        included: true,
      });
      // «Otra empresa» va al final a propósito: ofrecida entre medio se elige
      // por comodidad antes de haber buscado.
      expect(BO_EMPLOYERS[EMPRESAS - 1]?.code).toBe(BO_EMPLOYER_OTHER_CODE);
    });

    it('cada empresa guarda su sector económico', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const propiedades = rowsOf('ConceptProperties');
      expect(propiedades).toHaveLength(EMPRESAS);
      expect(propiedades[0]).toMatchObject({
        conceptId: boEmployerConceptId(BO_EMPLOYERS[0]!.code),
        propertyCode: BO_EMPLOYER_SECTOR_PROPERTY_CODE,
        valueJson: BO_EMPLOYERS[0]!.sector,
      });
    });
  });

  describe('segunda corrida', () => {
    it('no escribe nada: los ids son deterministas y ya están', async () => {
      const todo = new Set<string>([
        boEmployerValueSetId(),
        boEmployerVersionId(),
        ...BO_EMPLOYERS.flatMap((empresa) => [
          boEmployerConceptId(empresa.code),
          boEmployerMemberId(empresa.code),
        ]),
      ]);
      // Las designaciones y las propiedades tienen su propio derivador; se
      // agregan por su id real para que la pasada no cree ninguna.
      for (const empresa of BO_EMPLOYERS) {
        todo.add(boEmployerDesignationId(empresa.code));
        todo.add(boEmployerSectorPropertyId(empresa.code));
      }

      const { service, created } = build(todo);

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 0,
        versions: 0,
        employers: 0,
        designations: 0,
        properties: 0,
        memberships: 0,
      });
      expect(created).toHaveLength(0);
    });

    /**
     * Es el caso que esta lista va a vivir de verdad: está declarada como
     * provisional y pensada para crecer, así que agregar una empresa tiene que
     * sembrar esa y sólo esa.
     */
    it('agregar una empresa siembra sólo la nueva', async () => {
      const nueva = BO_EMPLOYERS[EMPRESAS - 1]!;
      const todo = new Set<string>([
        boEmployerValueSetId(),
        boEmployerVersionId(),
      ]);
      for (const empresa of BO_EMPLOYERS) {
        if (empresa.code === nueva.code) continue;
        todo.add(boEmployerConceptId(empresa.code));
        todo.add(boEmployerMemberId(empresa.code));
        todo.add(boEmployerDesignationId(empresa.code));
        todo.add(boEmployerSectorPropertyId(empresa.code));
      }

      const { service } = build(todo);

      const counters = await service.run();

      expect(counters).toEqual({
        valueSets: 0,
        versions: 0,
        employers: 1,
        designations: 1,
        properties: 1,
        memberships: 1,
      });
    });
  });

  describe('invariantes del catálogo', () => {
    it('ningún código se declara dos veces', () => {
      // Dos entradas con el mismo código colapsarían en el mismo id
      // determinista y una taparía a la otra sin que nadie se entere.
      const codigos = BO_EMPLOYERS.map((empresa) => empresa.code);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    it('ningún nombre se repite: dos opciones iguales en un buscador no se pueden elegir', () => {
      const nombres = BO_EMPLOYERS.map((empresa) => empresa.name);
      expect(new Set(nombres).size).toBe(nombres.length);
    });

    /**
     * La pantalla decide por este código cuándo pedir el nombre a mano. Si el
     * catálogo dejara de declararlo, «no está en la lista» se volvería una
     * opción sin salida y nadie se enteraría hasta verlo en producción.
     */
    it('declara la salida «Otra empresa», que es la que habilita el texto libre', () => {
      const otra = BO_EMPLOYERS.find(
        (empresa) => empresa.code === BO_EMPLOYER_OTHER_CODE,
      );
      expect(otra).toBeDefined();
      // El cliente la reconoce por el código FHIR, no por el nombre visible.
      expect(boEmployerConceptCode(BO_EMPLOYER_OTHER_CODE)).toBe(
        'employer:bo:OTRA',
      );
    });
  });
});
