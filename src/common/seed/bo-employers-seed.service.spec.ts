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
const COMPANIES = BO_EMPLOYERS.length;

/**
 * Los 155 códigos de la primera versión del catálogo.
 *
 * Están congelados acá porque el id de cada concepto se deriva del código y hay
 * `work_employer_concept_id` guardados que los apuntan: ampliar la lista no
 * puede retirar ni renombrar ninguno.
 */
const ORIGINAL_CODES = [
  'BANCO_BISA',
  'BANCO_CENTRAL_BOLIVIA',
  'BANCO_CREDITO_BCP',
  'BANCO_ECONOMICO',
  'BANCO_FIE',
  'BANCO_FORTALEZA',
  'BANCO_GANADERO',
  'BANCO_MERCANTIL_SANTA_CRUZ',
  'BANCO_NACIONAL_BOLIVIA',
  'BANCO_PRODEM',
  'BANCO_PYME_ECOFUTURO',
  'BANCO_SOL',
  'BANCO_UNION',
  'BBVA_PREVISION_AFP',
  'FUTURO_DE_BOLIVIA_AFP',
  'GESTORA_SEGURIDAD_SOCIAL',
  'ALIANZA_SEGUROS',
  'BISA_SEGUROS',
  'LA_BOLIVIANA_CIACRUZ',
  'NACIONAL_SEGUROS',
  'UNIVIDA',
  'ZURICH_BOLIVIANA',
  'AXS_BOLIVIA',
  'COMTECO',
  'COTAS',
  'COTEL',
  'ENTEL',
  'TIGO',
  'VIVA',
  'PETROBRAS_BOLIVIA',
  'REPSOL_BOLIVIA',
  'TOTALENERGIES_BOLIVIA',
  'YPFB',
  'YPFB_ANDINA',
  'YPFB_CHACO',
  'YPFB_REFINACION',
  'YPFB_TRANSPORTE',
  'CRE',
  'DELAPAZ',
  'ELFEC',
  'ENDE',
  'GUARACACHI',
  'SETAR',
  'COMIBOL',
  'EMPRESA_MINERA_COLQUIRI',
  'EMPRESA_MINERA_HUANUNI',
  'EMPRESA_METALURGICA_VINTO',
  'MANQUIRI',
  'MINERA_SAN_CRISTOBAL',
  'SINCHI_WAYRA',
  'YLB',
  'COBOCE',
  'EMPRESA_SIDERURGICA_MUTUN',
  'FANCESA',
  'ITACAMBA_CEMENTO',
  'SOBOCE',
  'ADM_SAO',
  'AVICOLA_SOFIA',
  'CBN',
  'DELIZIA',
  'EBA',
  'EMBOL',
  'EMAPA',
  'GRAVETAL_BOLIVIA',
  'IASA_FINO',
  'INGENIO_GUABIRA',
  'INGENIO_SAN_AURELIO',
  'INDUSTRIAS_VENADO',
  'LA_FRANCESA',
  'NUTRIOIL',
  'PIL_ANDINA',
  'UNAGRO',
  'VASCAL',
  'CASA_IDEAL',
  'FARMACIAS_CHAVEZ',
  'FARMACORP',
  'FIDALGA',
  'HIPERMAXI',
  'IC_NORTE',
  'IMCRUZ',
  'KETAL',
  'MULTICENTER',
  'TIENDAS_TIA',
  'TOYOSA',
  'AASANA',
  'ABC_CARRETERAS',
  'AMASZONAS',
  'BOA',
  'CORREOS_DE_BOLIVIA',
  'ECOJET',
  'FERROVIARIA_ANDINA',
  'FERROVIARIA_ORIENTAL',
  'MI_TELEFERICO',
  'SABSA',
  'CAJA_BANCA_PRIVADA',
  'CAJA_CORDES',
  'CAJA_NACIONAL_SALUD',
  'CAJA_PETROLERA_SALUD',
  'CLINICA_FOIANINI',
  'CLINICA_INCOR',
  'DROGUERIA_INTI',
  'HOSPITAL_ARCO_IRIS',
  'LABORATORIOS_BAGO',
  'LABORATORIOS_IFA',
  'LABORATORIOS_VITA',
  'MINISTERIO_SALUD',
  'SEDES',
  'MINISTERIO_EDUCACION',
  'NUR',
  'UAGRM',
  'UAJMS',
  'UATF',
  'UCB',
  'UDABOL',
  'UMSA',
  'UMSS',
  'UNIFRANZ',
  'UNIVALLE',
  'UPB',
  'UPEA',
  'UPSA',
  'UTO',
  'ADUANA_NACIONAL',
  'AGETIC',
  'ASFI',
  'ATT',
  'CONTRALORIA',
  'EPSAS',
  'FUERZAS_ARMADAS',
  'GOBERNACION',
  'GOBIERNO_MUNICIPAL',
  'IMPUESTOS_NACIONALES',
  'INE',
  'MINISTERIO_PUBLICO',
  'ORGANO_JUDICIAL',
  'POLICIA_BOLIVIANA',
  'SAGUAPAC',
  'SEGIP',
  'SEMAPA',
  'SEPREC',
  'SERECI',
  'ATB',
  'BOLIVIA_TV',
  'BOLIVISION',
  'EL_DEBER',
  'EL_DIARIO',
  'LA_RAZON',
  'LOS_TIEMPOS',
  'OPINION',
  'RED_UNO',
  'UNITEL',
  'INDEPENDIENTE',
  'NEGOCIO_PROPIO',
  'SIN_EMPLEADOR',
  'OTRA',
];

/** Las salidas genéricas, en el orden en que cierran la lista. */
const EXIT_CODES = ['INDEPENDIENTE', 'NEGOCIO_PROPIO', 'SIN_EMPLEADOR', 'OTRA'];

/** La colación con la que se ordena cada sector: español, sin mayúsculas ni tildes. */
const collator = new Intl.Collator('es', { sensitivity: 'base' });

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
        employers: COMPANIES,
        // Una designación preferida y un sector económico por concepto.
        designations: COMPANIES,
        properties: COMPANIES,
        memberships: COMPANIES,
      });

      const [set] = rowsOf('ValueSets');
      expect(set).toMatchObject({
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

      const concepts = rowsOf('CatalogConcepts');
      // La expansión filtra por `selectable`: una empresa no seleccionable
      // sería una opción que no se puede elegir.
      expect(concepts.every((row) => row.selectable === true)).toBe(true);
      // El código va prefijado por el dominio: `catalog_concepts.code` es único
      // por versión del sistema de códigos, y todo el catálogo interno comparte
      // una sola — sin el prefijo, este `OTRA` chocaría con el de ocupaciones.
      expect(
        concepts.every((row) => String(row.code).startsWith('employer:bo:')),
      ).toBe(true);
      expect(
        concepts.some((row) => row.code === boEmployerConceptCode('ENTEL')),
      ).toBe(true);
    });

    it('la expansión conserva el orden declarado del catálogo', async () => {
      const { service, rowsOf } = build();

      await service.run();

      // El buscador no ordena nada del lado del cliente: se apoya en este
      // `ordinal`, que agrupa por sector y deja las salidas al final.
      const members = rowsOf('ValueSetMembers');
      expect(members.map((row) => row.ordinal)).toEqual(
        BO_EMPLOYERS.map((_, index) => index),
      );
      expect(members[0]).toMatchObject({
        conceptId: boEmployerConceptId(BO_EMPLOYERS[0]!.code),
        included: true,
      });
      // «Otra empresa» va al final a propósito: ofrecida entre medio se elige
      // por comodidad antes de haber buscado.
      expect(BO_EMPLOYERS[COMPANIES - 1]?.code).toBe(BO_EMPLOYER_OTHER_CODE);
    });

    it('cada empresa guarda su sector económico', async () => {
      const { service, rowsOf } = build();

      await service.run();

      const properties = rowsOf('ConceptProperties');
      expect(properties).toHaveLength(COMPANIES);
      expect(properties[0]).toMatchObject({
        conceptId: boEmployerConceptId(BO_EMPLOYERS[0]!.code),
        propertyCode: BO_EMPLOYER_SECTOR_PROPERTY_CODE,
        valueJson: BO_EMPLOYERS[0]!.sector,
      });
    });
  });

  describe('segunda corrida', () => {
    it('no escribe nada: los ids son deterministas y ya están', async () => {
      const all = new Set<string>([
        boEmployerValueSetId(),
        boEmployerVersionId(),
        ...BO_EMPLOYERS.flatMap((company) => [
          boEmployerConceptId(company.code),
          boEmployerMemberId(company.code),
        ]),
      ]);
      // Las designaciones y las propiedades tienen su propio derivador; se
      // agregan por su id real para que la pasada no cree ninguna.
      for (const company of BO_EMPLOYERS) {
        all.add(boEmployerDesignationId(company.code));
        all.add(boEmployerSectorPropertyId(company.code));
      }

      const { service, created } = build(all);

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
      const fresh = BO_EMPLOYERS[COMPANIES - 1]!;
      const all = new Set<string>([
        boEmployerValueSetId(),
        boEmployerVersionId(),
      ]);
      for (const company of BO_EMPLOYERS) {
        if (company.code === fresh.code) continue;
        all.add(boEmployerConceptId(company.code));
        all.add(boEmployerMemberId(company.code));
        all.add(boEmployerDesignationId(company.code));
        all.add(boEmployerSectorPropertyId(company.code));
      }

      const { service } = build(all);

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

  describe('catálogo ampliado sobre una base ya sembrada', () => {
    it('reordena las membresías existentes para que el orden declarado se mantenga', async () => {
      const entel = boEmployerMemberId('ENTEL');
      const otra = boEmployerMemberId('OTRA');
      // Las membresías como quedaron con la lista de 155: posiciones viejas.
      const stored: Record<string, { id: string; ordinal: number }> = {
        [entel]: { id: entel, ordinal: 26 },
        [otra]: { id: otra, ordinal: 154 },
      };
      const created: unknown[] = [];
      const em = {
        find: mockFn((_entity: any, where: any) => {
          const ids: string[] = where?.id?.$in ?? [];
          return Promise.resolve(
            ids.filter((id) => id in stored).map((id) => stored[id]),
          );
        }),
        create: mockFn((_entity: any, data: any) => {
          created.push(data);
          return data;
        }),
        flush: mockFn(() => Promise.resolve()),
      };
      const service = new BoEmployersSeedService(
        { em: { fork: mockFn(() => em) } } as any,
        { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
      );

      const counters = await service.run();

      expect(stored[entel]?.ordinal).toBe(
        BO_EMPLOYERS.findIndex((company) => company.code === 'ENTEL'),
      );
      // «Otra empresa» sigue cerrando la lista aunque la lista haya crecido.
      expect(stored[otra]?.ordinal).toBe(COMPANIES - 1);
      // Las dos ya sembradas se actualizan en su lugar, no se vuelven a crear.
      expect(counters.memberships).toBe(COMPANIES - 2);
    });

    it('no toca el ordinal de una membresía que ya está en su lugar', async () => {
      const entel = boEmployerMemberId('ENTEL');
      const position = BO_EMPLOYERS.findIndex(
        (company) => company.code === 'ENTEL',
      );
      const stored = {
        id: entel,
        ordinal: position,
        updatedAt: new Date(0),
      };
      const em = {
        find: mockFn((_entity: any, where: any) => {
          const ids: string[] = where?.id?.$in ?? [];
          return Promise.resolve(ids.includes(entel) ? [stored] : []);
        }),
        create: mockFn((_entity: any, data: any) => data),
        flush: mockFn(() => Promise.resolve()),
      };
      const service = new BoEmployersSeedService(
        { em: { fork: mockFn(() => em) } } as any,
        { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
      );

      await service.run();

      expect(stored.ordinal).toBe(position);
      expect(stored.updatedAt).toEqual(new Date(0));
    });
  });

  describe('invariantes del catálogo', () => {
    it('ningún código se declara dos veces', () => {
      // Dos entradas con el mismo código colapsarían en el mismo id
      // determinista y una taparía a la otra sin que nadie se entere.
      const codes = BO_EMPLOYERS.map((company) => company.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('ningún nombre se repite: dos opciones iguales en un buscador no se pueden elegir', () => {
      const names = BO_EMPLOYERS.map((company) => company.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('conserva todos los códigos de la primera versión', () => {
      const codes = new Set(BO_EMPLOYERS.map((company) => company.code));
      expect(ORIGINAL_CODES).toHaveLength(155);
      expect(ORIGINAL_CODES.filter((code) => !codes.has(code))).toEqual([]);
    });

    it('cierra con las cuatro salidas genéricas, en su orden', () => {
      expect(
        BO_EMPLOYERS.slice(-EXIT_CODES.length).map((company) => company.code),
      ).toEqual(EXIT_CODES);
    });

    it('cada sector ocupa un único bloque contiguo', () => {
      const seen: string[] = [];
      for (const company of BO_EMPLOYERS) {
        if (seen[seen.length - 1] === company.sector) continue;
        expect(seen).not.toContain(company.sector);
        seen.push(company.sector);
      }
    });

    it('dentro de cada sector las empresas van en orden alfabético por nombre', () => {
      const companies = BO_EMPLOYERS.slice(0, -EXIT_CODES.length);
      const outOfOrder = companies.filter(
        (company, index) =>
          index > 0 &&
          companies[index - 1]!.sector === company.sector &&
          collator.compare(companies[index - 1]!.name, company.name) > 0,
      );
      expect(outOfOrder.map((company) => company.code)).toEqual([]);
    });

    it('los códigos son claves estables: mayúsculas, dígitos y guion bajo', () => {
      const invalid = BO_EMPLOYERS.filter(
        (company) => !/^[A-Z0-9_]+$/.test(company.code),
      );
      expect(invalid).toEqual([]);
    });

    it('cubre las nueve gobernaciones y las alcaldías de las capitales y El Alto', () => {
      const codes = new Set(BO_EMPLOYERS.map((company) => company.code));
      for (const department of [
        'BENI',
        'CHUQUISACA',
        'COCHABAMBA',
        'LA_PAZ',
        'ORURO',
        'PANDO',
        'POTOSI',
        'SANTA_CRUZ',
        'TARIJA',
      ]) {
        expect(codes.has(`GOBERNACION_${department}`)).toBe(true);
      }
      for (const city of [
        'COBIJA',
        'COCHABAMBA',
        'EL_ALTO',
        'LA_PAZ',
        'ORURO',
        'POTOSI',
        'SANTA_CRUZ',
        'SUCRE',
        'TARIJA',
        'TRINIDAD',
      ]) {
        expect(codes.has(`ALCALDIA_${city}`)).toBe(true);
      }
    });

    /**
     * La pantalla decide por este código cuándo pedir el nombre a mano. Si el
     * catálogo dejara de declararlo, «no está en la lista» se volvería una
     * opción sin salida y nadie se enteraría hasta verlo en producción.
     */
    it('declara la salida «Otra empresa», que es la que habilita el texto libre', () => {
      const other = BO_EMPLOYERS.find(
        (company) => company.code === BO_EMPLOYER_OTHER_CODE,
      );
      expect(other).toBeDefined();
      // El cliente la reconoce por el código FHIR, no por el nombre visible.
      expect(boEmployerConceptCode(BO_EMPLOYER_OTHER_CODE)).toBe(
        'employer:bo:OTRA',
      );
    });
  });
});
