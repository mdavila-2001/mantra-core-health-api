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
  BO_DEPARTMENT_BY_INE_PREFIX,
  BO_DEPARTMENT_VALUE_SET,
  BO_DEPARTMENTS,
  BO_MUNICIPALITIES,
  BO_MUNICIPALITY_VALUE_SET,
  boDepartmentConceptId,
  boDepartmentMemberId,
  boDepartmentValueSetId,
  boDepartmentVersionId,
  boMunicipalityByConceptId,
  boMunicipalityConceptCode,
  boMunicipalityConceptId,
  boMunicipalityValueSetId,
  boMunicipalityVersionId,
} from './bo-geography.catalog';

/** Id determinista de cada conjunto, por su clave natural. */
const ID_BY_CODE: Record<string, string> = {
  [BO_DEPARTMENT_VALUE_SET]: boDepartmentValueSetId(),
  [BO_MUNICIPALITY_VALUE_SET]: boMunicipalityValueSetId(),
};

/** Id determinista de la versión de cada conjunto, por el id del conjunto. */
const VERSION_BY_SET: Record<string, string> = {
  [boDepartmentValueSetId()]: boDepartmentVersionId(),
  [boMunicipalityValueSetId()]: boMunicipalityVersionId(),
};

/** Cuántos municipios declara el catálogo; el resto de las cuentas sale de acá. */
const MUNICIPALITIES = BO_MUNICIPALITIES.length;

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `glossary-seed.service.spec.ts`: un `em` en memoria que responde
 * `find`/`create`/`flush` sin tocar una base real.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @param valueSetsByCode - Conjuntos que ya están, por `internal_code`, con
 *   el id REAL que tienen en la base. Sirve para el caso en que el conjunto
 *   llegó antes desde el paquete de seeds del modelo con otro id.
 * @param versionsBySet - Versiones que ya están, por el id del conjunto
 *   al que pertenecen, con el id REAL que tienen en la base.
 * @returns Servicio, filas creadas y utilidades de lectura.
 */
function build(
  existing: Set<string> = new Set(),
  valueSetsByCode: Map<string, string> = new Map(),
  versionsBySet: Map<string, string> = new Map(),
) {
  const created: { entity: string; data: any }[] = [];

  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
      );
    }),
    // Una fila que existe, existe por su id Y por su clave natural. El doble
    // resuelve las dos claves naturales que el seed consulta: el `internal_code`
    // del conjunto y el par `(value_set_id, version)` de su versión. En ambos
    // casos gana el id ajeno declarado, y si no lo hay se responde con el
    // determinista sólo cuando `existing` dice que está.
    findOne: mockFn((entity: any, where: any) => {
      if (entity?.name === 'ValueSets') {
        const code: string | undefined = where?.internalCode;
        if (!code) return Promise.resolve(null);
        const foreign = valueSetsByCode.get(code);
        if (foreign) return Promise.resolve({ id: foreign });
        const deterministic = ID_BY_CODE[code];
        return Promise.resolve(
          deterministic && existing.has(deterministic)
            ? { id: deterministic }
            : null,
        );
      }
      if (entity?.name === 'ValueSetVersions') {
        const set: string | undefined = where?.valueSetId;
        if (!set) return Promise.resolve(null);
        const foreign = versionsBySet.get(set);
        if (foreign) return Promise.resolve({ id: foreign });
        const deterministic = VERSION_BY_SET[set];
        return Promise.resolve(
          deterministic && existing.has(deterministic)
            ? { id: deterministic }
            : null,
        );
      }
      return Promise.resolve(null);
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
    it('materializa los dos conjuntos, sus versiones vigentes y todo el árbol', async () => {
      const { service, rowsOf } = build();

      const counters = await service.run();

      expect(counters).toEqual({
        // Dos conjuntos: departamentos y municipios.
        valueSets: 2,
        versions: 2,
        departments: 9,
        municipalities: MUNICIPALITIES,
        // Una designación preferida por concepto, de los dos niveles.
        designations: 9 + MUNICIPALITIES,
        // El ISO de cada departamento, más provincia y padre de cada municipio.
        properties: 9 + MUNICIPALITIES * 2,
        memberships: 9 + MUNICIPALITIES,
      });

      const [departments, municipalities] = rowsOf('ValueSets');
      expect(departments).toMatchObject({
        id: boDepartmentValueSetId(),
        internalCode: BO_DEPARTMENT_VALUE_SET,
      });
      expect(municipalities).toMatchObject({
        id: boMunicipalityValueSetId(),
        internalCode: BO_MUNICIPALITY_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el desplegable.
      const [versionDepartments, versionMunicipalities] =
        rowsOf('ValueSetVersions');
      expect(versionDepartments).toMatchObject({
        id: boDepartmentVersionId(),
        valueSetId: boDepartmentValueSetId(),
        isDefault: true,
      });
      expect(versionMunicipalities).toMatchObject({
        id: boMunicipalityVersionId(),
        valueSetId: boMunicipalityValueSetId(),
        isDefault: true,
      });
    });

    it('los conceptos llevan el nombre en castellano, que es lo que pinta el desplegable', async () => {
      const { service, rowsOf } = build();

      await service.run();

      // Los nueve primeros conceptos son los departamentos; detrás vienen los
      // municipios, que tienen su propia prueba.
      const names = rowsOf('CatalogConcepts')
        .slice(0, 9)
        .map((row) => row.display);
      expect(names).toEqual([
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
        rowsOf('CatalogConcepts').every((row) => row.selectable === true),
      ).toBe(true);
    });

    it('la expansión conserva el orden oficial en su ordinal', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const members = rowsOf('ValueSetMembers').slice(0, 9);
      expect(members.map((row) => row.ordinal)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8,
      ]);
      expect(members[0]).toMatchObject({
        id: boDepartmentMemberId('CH'),
        valueSetVersionId: boDepartmentVersionId(),
        conceptId: boDepartmentConceptId('CH'),
        included: true,
      });
      // Santa Cruz es el séptimo por número de departamento, no el primero por
      // población: el orden es el del INE, el mismo de todo documento oficial.
      expect(members[6]).toMatchObject({
        conceptId: boDepartmentConceptId('SC'),
      });
    });

    it('cada departamento lleva su subdivisión ISO 3166-2', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const isos = rowsOf('ConceptProperties')
        .slice(0, 9)
        .map((row) => row.valueJson);
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
      const firstPass = build();
      await firstPass.service.run();
      const alreadySeeded = new Set<string>(
        firstPass.created.map((row) => row.data.id),
      );

      const second = build(alreadySeeded);
      const counters = await second.service.run();

      expect(counters).toEqual({
        valueSets: 0,
        versions: 0,
        departments: 0,
        municipalities: 0,
        designations: 0,
        properties: 0,
        memberships: 0,
      });
      expect(second.created).toHaveLength(0);
      // Una corrida sin trabajo tampoco ensucia el log del arranque.
      expect(second.logger.info).not.toHaveBeenCalled();
    });

    it('una siembra a medias completa sólo lo que falta', async () => {
      // El caso real: alguien creó el conjunto a mano y nunca sus miembros.
      const { service, rowsOf } = build(
        new Set([boDepartmentValueSetId(), boDepartmentVersionId()]),
      );

      const counters = await service.run();

      // El conjunto de municipios sigue faltando entero, así que ése sí se crea.
      expect(counters.valueSets).toBe(1);
      expect(counters.versions).toBe(1);
      expect(counters.departments).toBe(9);
      expect(counters.municipalities).toBe(MUNICIPALITIES);
      expect(counters.memberships).toBe(9 + MUNICIPALITIES);
      expect(rowsOf('ValueSets')).toHaveLength(1);
      expect(rowsOf('ValueSetVersions')).toHaveLength(1);
    });

    it('un conjunto que ya está con OTRO id no se vuelve a crear', async () => {
      // El defecto que rompía el arranque contra la base de la nube: el
      // conjunto había llegado antes desde el paquete de seeds del modelo con
      // un id distinto del determinista. La comprobación por id decía «no
      // está», el insert chocaba con `uq_value_sets_internal_code` y el paso
      // entero quedaba omitido — sin departamentos ni municipios.
      const idForeign = '11111111-2222-5333-8444-555555555555';
      const { service, rowsOf } = build(
        new Set(),
        new Map([[BO_MUNICIPALITY_VALUE_SET, idForeign]]),
      );

      const counters = await service.run();

      // Se crea el de departamentos y NO el de municipios.
      expect(counters.valueSets).toBe(1);
      const sets = rowsOf('ValueSets');
      expect(sets).toHaveLength(1);
      expect(sets[0].internalCode).toBe(BO_DEPARTMENT_VALUE_SET);

      // Y la versión de municipios cuelga del id que la base tiene de verdad,
      // no del determinista: si apuntara al otro, la FK no resolvería.
      const versionMunicipalities = rowsOf('ValueSetVersions').find(
        (row) => row.id === boMunicipalityVersionId(),
      );
      expect(versionMunicipalities.valueSetId).toBe(idForeign);
    });

    it('una versión que ya está con OTRO id tampoco se duplica', async () => {
      // El segundo choque, un nivel más abajo: resuelto el conjunto por su
      // clave natural, su versión «1.0.0» ya existía con otro id y el insert
      // moría contra `uq_value_set_versions_value_set_id_version`.
      const foreignSet = '11111111-2222-5333-8444-555555555555';
      const versionForeign = '66666666-7777-5888-8999-aaaaaaaaaaaa';
      const { service, rowsOf } = build(
        new Set(),
        new Map([[BO_MUNICIPALITY_VALUE_SET, foreignSet]]),
        new Map([[foreignSet, versionForeign]]),
      );

      const counters = await service.run();

      // Sólo se crea la versión de departamentos.
      expect(counters.versions).toBe(1);
      expect(rowsOf('ValueSetVersions')).toHaveLength(1);

      // Y los 340 municipios se afilian a la versión que existe de verdad.
      const members = rowsOf('ValueSetMembers').slice(9);
      expect(members).toHaveLength(MUNICIPALITIES);
      expect(
        members.every((row) => row.valueSetVersionId === versionForeign),
      ).toBe(true);
    });
  });

  describe('los municipios', () => {
    it('siembra los 340 con su código del INE por código de concepto', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const municipalities = rowsOf('CatalogConcepts').slice(9);
      expect(municipalities).toHaveLength(MUNICIPALITIES);
      expect(municipalities[0]).toMatchObject({
        id: boMunicipalityConceptId('010101'),
        code: boMunicipalityConceptCode('010101'),
        display: 'Sucre',
        selectable: true,
      });
    });

    it('cada municipio apunta al concepto de su departamento', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const properties = rowsOf('ConceptProperties').slice(9);
      // Dos por municipio: provincia y departamento padre, en ese orden.
      expect(properties).toHaveLength(MUNICIPALITIES * 2);
      expect(properties[0]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        propertyCode: 'geo:bo:province',
        valueJson: 'Oropeza',
      });
      expect(properties[1]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        propertyCode: 'geo:bo:department',
        valueJson: boDepartmentConceptId('CH'),
      });
    });

    it('la expansión los numera desde cero, aparte de la de departamentos', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const members = rowsOf('ValueSetMembers').slice(9);
      expect(members).toHaveLength(MUNICIPALITIES);
      expect(members[0]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        valueSetVersionId: boMunicipalityVersionId(),
        ordinal: 0,
      });
      expect(members[MUNICIPALITIES - 1].ordinal).toBe(MUNICIPALITIES - 1);
    });
  });

  describe('el catálogo en sí', () => {
    it('declara los nueve departamentos, sin siglas repetidas', () => {
      expect(BO_DEPARTMENTS).toHaveLength(9);
      const acronyms = BO_DEPARTMENTS.map((department) => department.code);
      expect(new Set(acronyms).size).toBe(9);
    });

    it('todo municipio cuelga del departamento que dice su código del INE', () => {
      // Es la invariante de la que vive el árbol del frontend: arma los grupos
      // con el prefijo del código, así que un municipio cuyo prefijo y cuyo
      // departamento declarado no coincidan aparecería bajo el departamento
      // equivocado.
      const acronyms = new Set(BO_DEPARTMENTS.map((d) => d.code));
      for (const municipality of BO_MUNICIPALITIES) {
        expect(acronyms.has(municipality.department)).toBe(true);
        expect(
          BO_DEPARTMENT_BY_INE_PREFIX.get(municipality.ine.slice(0, 2)),
        ).toBe(municipality.department);
      }
    });

    it('no repite códigos del INE, aunque sí repita nombres', () => {
      const codes = BO_MUNICIPALITIES.map((m) => m.ine);
      expect(new Set(codes).size).toBe(MUNICIPALITIES);
      // Y justamente por eso la clave es el código: hay nombres repetidos entre
      // departamentos, y sobre el nombre no se puede construir una identidad.
      const names = new Set(BO_MUNICIPALITIES.map((m) => m.name));
      expect(names.size).toBeLessThan(MUNICIPALITIES);
    });

    it('el camino inverso resuelve el municipio desde el uuid de su concepto', () => {
      const sucre = boMunicipalityByConceptId(
        boMunicipalityConceptId('010101'),
      );
      expect(sucre).toMatchObject({
        ine: '010101',
        name: 'Sucre',
        department: 'CH',
      });
      // Un uuid que no es de un municipio no resuelve: es lo que impide escribir
      // una FK colgando en `common.addresses`.
      expect(
        boMunicipalityByConceptId(boDepartmentConceptId('CH')),
      ).toBeUndefined();
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
