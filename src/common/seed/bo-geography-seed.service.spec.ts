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
const ID_POR_CODIGO: Record<string, string> = {
  [BO_DEPARTMENT_VALUE_SET]: boDepartmentValueSetId(),
  [BO_MUNICIPALITY_VALUE_SET]: boMunicipalityValueSetId(),
};

/** Id determinista de la versión de cada conjunto, por el id del conjunto. */
const VERSION_POR_CONJUNTO: Record<string, string> = {
  [boDepartmentValueSetId()]: boDepartmentVersionId(),
  [boMunicipalityValueSetId()]: boMunicipalityVersionId(),
};

/** Cuántos municipios declara el catálogo; el resto de las cuentas sale de acá. */
const MUNICIPIOS = BO_MUNICIPALITIES.length;

/**
 * Construye el seed con un contexto de persistencia controlado — el mismo
 * patrón que `glossary-seed.service.spec.ts`: un `em` en memoria que responde
 * `find`/`create`/`flush` sin tocar una base real.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @param valueSetsPorCodigo - Conjuntos que ya están, por `internal_code`, con
 *   el id REAL que tienen en la base. Sirve para el caso en que el conjunto
 *   llegó antes desde el paquete de seeds del modelo con otro id.
 * @param versionesPorConjunto - Versiones que ya están, por el id del conjunto
 *   al que pertenecen, con el id REAL que tienen en la base.
 * @returns Servicio, filas creadas y utilidades de lectura.
 */
function build(
  existing: Set<string> = new Set(),
  valueSetsPorCodigo: Map<string, string> = new Map(),
  versionesPorConjunto: Map<string, string> = new Map(),
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
        const codigo: string | undefined = where?.internalCode;
        if (!codigo) return Promise.resolve(null);
        const ajeno = valueSetsPorCodigo.get(codigo);
        if (ajeno) return Promise.resolve({ id: ajeno });
        const determinista = ID_POR_CODIGO[codigo];
        return Promise.resolve(
          determinista && existing.has(determinista)
            ? { id: determinista }
            : null,
        );
      }
      if (entity?.name === 'ValueSetVersions') {
        const conjunto: string | undefined = where?.valueSetId;
        if (!conjunto) return Promise.resolve(null);
        const ajena = versionesPorConjunto.get(conjunto);
        if (ajena) return Promise.resolve({ id: ajena });
        const determinista = VERSION_POR_CONJUNTO[conjunto];
        return Promise.resolve(
          determinista && existing.has(determinista)
            ? { id: determinista }
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
        municipalities: MUNICIPIOS,
        // Una designación preferida por concepto, de los dos niveles.
        designations: 9 + MUNICIPIOS,
        // El ISO de cada departamento, más provincia y padre de cada municipio.
        properties: 9 + MUNICIPIOS * 2,
        memberships: 9 + MUNICIPIOS,
      });

      const [departamentos, municipios] = rowsOf('ValueSets');
      expect(departamentos).toMatchObject({
        id: boDepartmentValueSetId(),
        internalCode: BO_DEPARTMENT_VALUE_SET,
      });
      expect(municipios).toMatchObject({
        id: boMunicipalityValueSetId(),
        internalCode: BO_MUNICIPALITY_VALUE_SET,
      });

      // Sin `isDefault`, `readExpansion` sin versión explícita devolvería 404
      // aunque el conjunto y sus miembros existan: es lo que pide el desplegable.
      const [versionDepartamentos, versionMunicipios] =
        rowsOf('ValueSetVersions');
      expect(versionDepartamentos).toMatchObject({
        id: boDepartmentVersionId(),
        valueSetId: boDepartmentValueSetId(),
        isDefault: true,
      });
      expect(versionMunicipios).toMatchObject({
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
      const nombres = rowsOf('CatalogConcepts')
        .slice(0, 9)
        .map((fila) => fila.display);
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

      const miembros = rowsOf('ValueSetMembers').slice(0, 9);
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

      const isos = rowsOf('ConceptProperties')
        .slice(0, 9)
        .map((fila) => fila.valueJson);
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
        municipalities: 0,
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

      // El conjunto de municipios sigue faltando entero, así que ése sí se crea.
      expect(counters.valueSets).toBe(1);
      expect(counters.versions).toBe(1);
      expect(counters.departments).toBe(9);
      expect(counters.municipalities).toBe(MUNICIPIOS);
      expect(counters.memberships).toBe(9 + MUNICIPIOS);
      expect(rowsOf('ValueSets')).toHaveLength(1);
      expect(rowsOf('ValueSetVersions')).toHaveLength(1);
    });

    it('un conjunto que ya está con OTRO id no se vuelve a crear', async () => {
      // El defecto que rompía el arranque contra la base de la nube: el
      // conjunto había llegado antes desde el paquete de seeds del modelo con
      // un id distinto del determinista. La comprobación por id decía «no
      // está», el insert chocaba con `uq_value_sets_internal_code` y el paso
      // entero quedaba omitido — sin departamentos ni municipios.
      const idAjeno = '11111111-2222-5333-8444-555555555555';
      const { service, rowsOf } = build(
        new Set(),
        new Map([[BO_MUNICIPALITY_VALUE_SET, idAjeno]]),
      );

      const counters = await service.run();

      // Se crea el de departamentos y NO el de municipios.
      expect(counters.valueSets).toBe(1);
      const conjuntos = rowsOf('ValueSets');
      expect(conjuntos).toHaveLength(1);
      expect(conjuntos[0].internalCode).toBe(BO_DEPARTMENT_VALUE_SET);

      // Y la versión de municipios cuelga del id que la base tiene de verdad,
      // no del determinista: si apuntara al otro, la FK no resolvería.
      const versionMunicipios = rowsOf('ValueSetVersions').find(
        (fila) => fila.id === boMunicipalityVersionId(),
      );
      expect(versionMunicipios.valueSetId).toBe(idAjeno);
    });

    it('una versión que ya está con OTRO id tampoco se duplica', async () => {
      // El segundo choque, un nivel más abajo: resuelto el conjunto por su
      // clave natural, su versión «1.0.0» ya existía con otro id y el insert
      // moría contra `uq_value_set_versions_value_set_id_version`.
      const conjuntoAjeno = '11111111-2222-5333-8444-555555555555';
      const versionAjena = '66666666-7777-5888-8999-aaaaaaaaaaaa';
      const { service, rowsOf } = build(
        new Set(),
        new Map([[BO_MUNICIPALITY_VALUE_SET, conjuntoAjeno]]),
        new Map([[conjuntoAjeno, versionAjena]]),
      );

      const counters = await service.run();

      // Sólo se crea la versión de departamentos.
      expect(counters.versions).toBe(1);
      expect(rowsOf('ValueSetVersions')).toHaveLength(1);

      // Y los 340 municipios se afilian a la versión que existe de verdad.
      const miembros = rowsOf('ValueSetMembers').slice(9);
      expect(miembros).toHaveLength(MUNICIPIOS);
      expect(
        miembros.every((fila) => fila.valueSetVersionId === versionAjena),
      ).toBe(true);
    });
  });

  describe('los municipios', () => {
    it('siembra los 340 con su código del INE por código de concepto', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const municipios = rowsOf('CatalogConcepts').slice(9);
      expect(municipios).toHaveLength(MUNICIPIOS);
      expect(municipios[0]).toMatchObject({
        id: boMunicipalityConceptId('010101'),
        code: boMunicipalityConceptCode('010101'),
        display: 'Sucre',
        selectable: true,
      });
    });

    it('cada municipio apunta al concepto de su departamento', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const propiedades = rowsOf('ConceptProperties').slice(9);
      // Dos por municipio: provincia y departamento padre, en ese orden.
      expect(propiedades).toHaveLength(MUNICIPIOS * 2);
      expect(propiedades[0]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        propertyCode: 'geo:bo:province',
        valueJson: 'Oropeza',
      });
      expect(propiedades[1]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        propertyCode: 'geo:bo:department',
        valueJson: boDepartmentConceptId('CH'),
      });
    });

    it('la expansión los numera desde cero, aparte de la de departamentos', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const miembros = rowsOf('ValueSetMembers').slice(9);
      expect(miembros).toHaveLength(MUNICIPIOS);
      expect(miembros[0]).toMatchObject({
        conceptId: boMunicipalityConceptId('010101'),
        valueSetVersionId: boMunicipalityVersionId(),
        ordinal: 0,
      });
      expect(miembros[MUNICIPIOS - 1].ordinal).toBe(MUNICIPIOS - 1);
    });
  });

  describe('el catálogo en sí', () => {
    it('declara los nueve departamentos, sin siglas repetidas', () => {
      expect(BO_DEPARTMENTS).toHaveLength(9);
      const siglas = BO_DEPARTMENTS.map((department) => department.code);
      expect(new Set(siglas).size).toBe(9);
    });

    it('todo municipio cuelga del departamento que dice su código del INE', () => {
      // Es la invariante de la que vive el árbol del frontend: arma los grupos
      // con el prefijo del código, así que un municipio cuyo prefijo y cuyo
      // departamento declarado no coincidan aparecería bajo el departamento
      // equivocado.
      const siglas = new Set(BO_DEPARTMENTS.map((d) => d.code));
      for (const municipality of BO_MUNICIPALITIES) {
        expect(siglas.has(municipality.department)).toBe(true);
        expect(
          BO_DEPARTMENT_BY_INE_PREFIX.get(municipality.ine.slice(0, 2)),
        ).toBe(municipality.department);
      }
    });

    it('no repite códigos del INE, aunque sí repita nombres', () => {
      const codigos = BO_MUNICIPALITIES.map((m) => m.ine);
      expect(new Set(codigos).size).toBe(MUNICIPIOS);
      // Y justamente por eso la clave es el código: hay nombres repetidos entre
      // departamentos, y sobre el nombre no se puede construir una identidad.
      const nombres = new Set(BO_MUNICIPALITIES.map((m) => m.name));
      expect(nombres.size).toBeLessThan(MUNICIPIOS);
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
