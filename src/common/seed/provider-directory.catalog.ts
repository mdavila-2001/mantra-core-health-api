/**
 * Directorio de médicos habilitados de Alianza y Nacional Seguros.
 *
 * El dataset trae 961 filas; el directorio publica **763 fichas**, porque 198
 * profesionales atienden para las dos redes y son una sola persona. **Ninguno
 * tiene cuenta**: el dataset no trae correo y el alta de la API lo exige, así
 * que esto es consulta y nada más — lo que pide el registro de procesos en
 * PACIENTE §3.2, «revisar cuáles son los médicos que trabajan con cada
 * aseguradora».
 *
 * El modelo es el de `bolivia-facilities.catalog.ts`: un concepto por ficha, con
 * sus atributos en `concept_properties`.
 *
 * ## La fusión no es cosmética
 *
 * El dataset viene partido por aseguradora y las dos redes escriben lo mismo
 * distinto: el nombre con coma o sin ella, la especialidad capitalizada o a los
 * gritos. Comparando el texto crudo, 454 médicos de Alianza y 507 de Nacional
 * —todos de Santa Cruz— daban **cero** coincidencias, que es imposible.
 *
 * Sin normalizar, el directorio muestra 198 doctores repetidos y ofrece cada
 * especialidad dos veces en el filtro. El síntoma no es un error visible: es una
 * guía que se ve razonable y está mal. Los guardarraíles están en el `.spec`.
 *
 * ## Lo que la normalización NO hace, a propósito
 *
 * Unifica **grafías** —acentos y mayúsculas—, no significados. Quedan fichas con
 * «Cirugía Pediatra» y «CIRUGIA PEDIATRICA», que son la misma especialidad
 * escrita de dos formas y el código las deja como dos.
 *
 * Es deliberado. De los 90 pares de especialidades parecidas que trae el
 * dataset, la enorme mayoría son **distintas de verdad** —«Cirugía general» y
 * «Cirugía Laparoscópica», «Infectología» e «Infectología pediátrica»,
 * «Medicina General» y «Medicina Interna»—, y colapsarlas por parecido borraría
 * información clínica real. Separar un caso del otro es un mapeo de sinónimos
 * que tiene que revisar alguien que sepa de medicina, no una regla de texto.
 */

import { deterministicId } from '../constants/concepts';
import dataset from './data/bolivia/provider-networks.dataset.json';

/** Una sede donde el profesional atiende. */
export interface ProviderDirectorySede {
  readonly direccion: string;
  readonly telefonos: readonly string[];
}

/** Lo que el directorio declara de cada médico. */
export interface ProviderDirectoryEntry {
  /** Tal como viene de la red: «APELLIDOS, NOMBRES». */
  readonly nombre: string;
  readonly especialidades: readonly string[];
  readonly ciudad: string;
  readonly sedes: readonly ProviderDirectorySede[];
  /** Planes habilitados, ya unidos si atiende en las dos redes. */
  readonly planes: readonly string[];
  /** Aseguradoras con las que trabaja: «Alianza», «Nacional Seguros». */
  readonly aseguradoras: readonly string[];
}

/** El conjunto de valores que gobierna el directorio. */
export const PROVIDER_DIRECTORY_VALUE_SET = 'VS_BO_PROVIDER_DIRECTORY';

/** Nombre legible del conjunto. */
export const PROVIDER_DIRECTORY_VALUE_SET_NAME =
  'Directorio de médicos habilitados — Alianza y Nacional Seguros';

/** Versión del conjunto; subirla al cambiar el padrón. */
export const PROVIDER_DIRECTORY_VERSION = '1.0.0';

/**
 * Clave de identidad de un profesional: su nombre, normalizado.
 *
 * Es lo que decide si dos filas de redes distintas son la misma persona.
 *
 * **La coma se descarta, y no es un detalle.** Las dos redes escriben el nombre
 * distinto —Alianza como «ABASTO VEGA, ROSEMARY», Nacional como «ABASTO VEGA
 * ROSEMARY»—, así que comparar el texto crudo daba **cero** coincidencias entre
 * 454 y 507 médicos de la misma ciudad, que es imposible. Quitarla —junto con
 * los espacios repetidos y los acentos— es lo que hace que la fusión exista.
 *
 * La ciudad **no** entra en la clave: la misma persona figura como «SANTA CRUZ»
 * en una red y «SANTA CRUZ - PUERTO SUAREZ» en la otra, y partirla por eso
 * duplicaría la ficha. Se conserva como atributo, no como identidad.
 *
 * No incluye la especialidad por lo mismo: las redes no coinciden en cómo la
 * escriben.
 */
function sinAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/s+/g, ' ')
    .trim();
}

/**
 * Cual de dos grafias de la misma especialidad se muestra.
 *
 * Las redes la escriben distinto —Alianza «Pediatria», Nacional «PEDIATRIA»—, y
 * sin unificarlas el filtro por especialidad ofrece la misma dos veces. De las
 * 160 grafias del dataset solo hay **134** especialidades: 26 llegan duplicadas.
 *
 * Gana la que NO esta toda en mayusculas, que es la legible; a igualdad, la
 * primera que llego, para que el resultado no dependa del orden de las redes.
 */
function mejorGrafia(actual: string, candidata: string): string {
  const actualEsGrito = actual === actual.toUpperCase();
  const candidataEsGrito = candidata === candidata.toUpperCase();
  if (actualEsGrito && !candidataEsGrito) return candidata;
  return actual;
}

function claveDeIdentidad(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Los profesionales del directorio, fusionados por identidad.
 *
 * El orden es determinista —el de aparición en el dataset— para que el `ordinal`
 * de la expansión no baile entre corridas.
 */
export const PROVIDER_DIRECTORY_ENTRIES: readonly ProviderDirectoryEntry[] =
  (() => {
    // Primero el diccionario global de especialidades: normalizada -> grafia
    // elegida. Tiene que ser global y no por ficha, porque un medico que solo
    // figura en la red que grita ve su especialidad solo en mayusculas, y el
    // filtro del front —que lista TODAS— volveria a ofrecer «Pediatria» y
    // «PEDIATRIA» como dos opciones.
    const grafiaDeEspecialidad = new Map<string, string>();
    for (const red of dataset.datos.redes) {
      for (const profesional of red.profesionales) {
        for (const especialidad of profesional.especialidades) {
          const clave = sinAcentos(especialidad);
          const previa = grafiaDeEspecialidad.get(clave);
          grafiaDeEspecialidad.set(
            clave,
            previa === undefined
              ? especialidad
              : mejorGrafia(previa, especialidad),
          );
        }
      }
    }

    const porClave = new Map<
      string,
      {
        nombre: string;
        ciudad: string;
        especialidades: Map<string, string>;
        sedes: Map<string, ProviderDirectorySede>;
        planes: Set<string>;
        aseguradoras: Set<string>;
      }
    >();

    for (const red of dataset.datos.redes) {
      for (const profesional of red.profesionales) {
        const clave = claveDeIdentidad(profesional.nombre);
        let ficha = porClave.get(clave);
        if (ficha === undefined) {
          ficha = {
            nombre: profesional.nombre,
            ciudad: profesional.ciudad,
            especialidades: new Map(),
            sedes: new Map(),
            planes: new Set(),
            aseguradoras: new Set(),
          };
          porClave.set(clave, ficha);
        }

        // El rotulo visible: gana la forma con coma. Las dos redes traen a la
        // misma persona, pero solo Alianza marca donde terminan los apellidos
        // —«ABASTO VEGA, ROSEMARY» dice mas que «ABASTO VEGA ROSEMARY»—.
        if (!ficha.nombre.includes(',') && profesional.nombre.includes(',')) {
          ficha.nombre = profesional.nombre;
        }
        // La ciudad mas especifica gana: «SANTA CRUZ - PUERTO SUAREZ» sobre
        // «SANTA CRUZ», que es el default de la red que no desglosa.
        if (profesional.ciudad.length > ficha.ciudad.length) {
          ficha.ciudad = profesional.ciudad;
        }

        for (const especialidad of profesional.especialidades) {
          const clave = sinAcentos(especialidad);
          ficha.especialidades.set(
            clave,
            grafiaDeEspecialidad.get(clave) ?? especialidad,
          );
        }
        for (const plan of profesional.planes) {
          ficha.planes.add(plan);
        }
        ficha.aseguradoras.add(red.aseguradora);
        // La dirección es la clave de la sede: la misma clínica llega con
        // teléfonos distintos según la red, y son todos válidos.
        for (const sede of profesional.sedes) {
          const previa = ficha.sedes.get(sede.direccion);
          const telefonos = new Set([
            ...(previa?.telefonos ?? []),
            ...sede.telefonos,
          ]);
          ficha.sedes.set(sede.direccion, {
            direccion: sede.direccion,
            telefonos: [...telefonos],
          });
        }
      }
    }

    return [...porClave.values()].map((ficha) => ({
      nombre: ficha.nombre,
      ciudad: ficha.ciudad,
      especialidades: [...ficha.especialidades.values()],
      sedes: [...ficha.sedes.values()],
      planes: [...ficha.planes],
      aseguradoras: [...ficha.aseguradoras],
    }));
  })();

/**
 * El `code` que se guarda en `catalog_concepts`.
 *
 * Lleva el prefijo del conjunto por la misma razón que los conceptos de módulo
 * guardan su clave: `catalog_concepts` tiene `UNIQUE(code_system_version_id,
 * code)` y todos los conceptos internos comparten versión, así que un nombre
 * propio a secas podría chocar con cualquier otro catálogo.
 */
export const providerDirectoryConceptCode = (
  profesional: ProviderDirectoryEntry,
): string =>
  `${PROVIDER_DIRECTORY_VALUE_SET}:${claveDeIdentidad(profesional.nombre)}`;

/** UUID determinista del concepto de un profesional. */
export const providerDirectoryConceptId = (
  profesional: ProviderDirectoryEntry,
): string => deterministicId(providerDirectoryConceptCode(profesional));

/** UUID determinista de su fila en la expansión del conjunto. */
export const providerDirectoryMemberId = (
  profesional: ProviderDirectoryEntry,
): string =>
  deterministicId(`${providerDirectoryConceptCode(profesional)}:member`);

/** UUID determinista de una de sus propiedades. */
export const providerDirectoryPropertyId = (
  profesional: ProviderDirectoryEntry,
  propertyCode: string,
): string =>
  deterministicId(
    `${providerDirectoryConceptCode(profesional)}:property:${propertyCode}`,
  );

/** Los atributos que cada ficha declara. */
export const PROVIDER_DIRECTORY_PROPERTY_CODES = {
  especialidades: 'especialidades',
  ciudad: 'ciudad',
  sedes: 'sedes',
  planes: 'planes',
  aseguradoras: 'aseguradoras',
} as const;

/**
 * Todas las propiedades son `json`.
 *
 * `concept_properties` tiene una sola columna de valor (`value_json`, jsonb), y
 * las listas viajan como arrays: filtrar por especialidad es una consulta sobre
 * el array, no un `LIKE` sobre texto concatenado.
 */
export const PROVIDER_DIRECTORY_PROPERTY_DATA_TYPE = 'json';

/** URL canónica del conjunto. */
export const providerDirectoryCanonicalUrl = (): string =>
  `urn:alovida:vs:bo-provider-directory:${PROVIDER_DIRECTORY_VERSION}`;

/** UUID determinista del conjunto. */
export const providerDirectoryValueSetId = (): string =>
  deterministicId(`${PROVIDER_DIRECTORY_VALUE_SET}:value-set`);

/** UUID determinista de su versión vigente. */
export const providerDirectoryVersionId = (): string =>
  deterministicId(
    `${PROVIDER_DIRECTORY_VALUE_SET}:version:${PROVIDER_DIRECTORY_VERSION}`,
  );
