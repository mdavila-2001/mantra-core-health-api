import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import {
  boDepartmentConceptId,
  boMunicipalityByConceptId,
} from '../../../common/seed/bo-geography.catalog';
import type { AddressesRepository } from '../repositories';

/** Lo que hace falta para escribir una dirección de una persona. */
export interface ResidenceAddressData {
  /** La persona dueña de la dirección. */
  readonly personId: string;
  /** Municipio elegido en el alta; `undefined` si no eligió ninguno. */
  readonly municipalityConceptId?: string;
  /**
   * Calle y número, tal como la persona lo escribe.
   *
   * La columna es un varchar único (`common.addresses.lines`), no un arreglo.
   */
  readonly lines?: string;
  /**
   * Latitud, si la persona compartió su ubicación.
   *
   * Llega como número y se guarda como texto: la columna es `numeric` y la
   * entidad la mapea a string, así que convertirla acá evita que cada llamador
   * repita el `String(...)`.
   */
  readonly latitude?: number;
  /** Longitud. Ver {@link ResidenceAddressData.latitude}. */
  readonly longitude?: number;
  /** Quién escribe la fila, para la auditoría. */
  readonly actorUserId: string;
}

/**
 * Escribe el domicilio de residencia a partir del municipio elegido.
 *
 * ## Por qué vive en `common` y no donde nació
 *
 * Nació junto al auto-registro, en `iam`, cuando el alta era el único momento en
 * que alguien declaraba dónde vive. Desde que el paciente puede corregir su
 * domicilio, el segundo llamador es `profiles`, y `profiles` no depende de `iam`
 * —es al revés: `iam` compone el alta con las piezas de `profiles`—. Traer la
 * función desde allá invertiría esa dirección por una regla que no es de ninguno
 * de los dos: la dirección es de `common`, que es donde está su tabla.
 *
 * ## Por qué el departamento no viaja en el DTO
 *
 * Porque se deriva. El código del INE de un municipio lleva adentro el de su
 * departamento, así que el par siempre es coherente si lo arma quien tiene el
 * catálogo. Recibir los dos del cliente abriría la puerta a un municipio de
 * Tarija con el departamento de Beni, y no habría criterio para decidir cuál de
 * los dos gana.
 *
 * ## Por qué valida contra el catálogo
 *
 * `municipality_concept_id` es FK a `terminology.catalog_concepts`. Un uuid con
 * forma válida que no sea un municipio pasaría el `@IsUUID` del DTO y reventaría
 * en el `INSERT`, con un error de integridad que no le dice nada a nadie. Acá se
 * rechaza con un 400 que nombra el problema.
 *
 * No hace nada si no se eligió municipio: el domicilio es opcional y una
 * dirección con país y nada más no es un dato, es una fila.
 *
 * @param repo - Repositorio de `common.addresses`.
 * @param tx - Contexto transaccional de quien escribe.
 * @param data - Persona, municipio elegido y actor.
 * @returns `true` si escribió la dirección.
 * @throws BadRequestException si el municipio no pertenece a `VS_BO_MUNICIPALITY`.
 *   Es la de Nest y no una `DomainException`: `AllExceptionsFilter` ya la
 *   traduce a 400 con `VALIDATION_FAILED`, que es exactamente el código que le
 *   corresponde a un valor de catálogo que no existe.
 */
export function createResidenceAddress(
  repo: AddressesRepository,
  tx: EntityManager,
  data: ResidenceAddressData,
): boolean {
  return writeAddress(repo, tx, data, CONCEPTS.ADDR_USE_HOME);
}

/**
 * Escribe el domicilio **laboral** de una persona.
 *
 * Es una segunda fila de `common.addresses` sobre la misma persona, distinguida
 * por `use_concept_id`: para eso existe esa columna. El registro de paciente
 * pide domicilio y trabajo por separado, y quien reparte un medicamento necesita
 * saber a cuál de los dos ir.
 *
 * @param repo - Repositorio de `common.addresses`.
 * @param tx - Contexto transaccional.
 * @param data - Persona, municipio, calle, coordenadas y actor.
 * @returns `true` si escribió la dirección.
 * @throws BadRequestException si el municipio no pertenece a `VS_BO_MUNICIPALITY`.
 */
export function createWorkAddress(
  repo: AddressesRepository,
  tx: EntityManager,
  data: ResidenceAddressData,
): boolean {
  return writeAddress(repo, tx, data, CONCEPTS.ADDR_USE_WORK);
}

/**
 * El cuerpo compartido por los dos usos: lo único que los distingue es el
 * concepto de uso.
 */
function writeAddress(
  repo: AddressesRepository,
  tx: EntityManager,
  data: ResidenceAddressData,
  useConceptId: string,
): boolean {
  const coordenadas = coordinatesOf(data);

  // Sin municipio, sin calle y sin coordenadas no hay dirección: una fila con
  // país y nada más no es un dato, es una fila.
  if (!data.municipalityConceptId && !data.lines && !coordenadas) {
    return false;
  }

  const municipality = data.municipalityConceptId
    ? boMunicipalityByConceptId(data.municipalityConceptId)
    : undefined;
  if (data.municipalityConceptId && !municipality) {
    throw new BadRequestException(
      'El municipio indicado no pertenece al catálogo de municipios de Bolivia',
    );
  }

  repo.create(tx, {
    ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
    ownerId: data.personId,
    countryConceptId: CONCEPTS.COUNTRY_BO,
    municipalityConceptId: data.municipalityConceptId,
    // Derivado, nunca recibido: ver arriba.
    administrativeAreaConceptId: municipality
      ? boDepartmentConceptId(municipality.department)
      : undefined,
    // `city` es texto libre y el municipio ya es el dato de catálogo; se copia
    // el nombre para que quien lea la dirección sin resolver conceptos —un
    // export, un sobre— tenga algo legible.
    city: municipality?.name,
    lines: data.lines,
    latitude: coordenadas?.latitude,
    longitude: coordenadas?.longitude,
    useConceptId,
    typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
    actorUserId: data.actorUserId,
  });
  return true;
}

/**
 * El par de coordenadas, sólo si vinieron las dos.
 *
 * Media coordenada no ubica nada, y guardar una sola dejaría una fila que
 * miente: parece tener ubicación y no la tiene. El DTO ya rechaza el par
 * incompleto; esto protege a los demás llamadores.
 */
function coordinatesOf(
  data: ResidenceAddressData,
): { latitude: string; longitude: string } | undefined {
  if (data.latitude === undefined || data.longitude === undefined) {
    return undefined;
  }
  return {
    latitude: String(data.latitude),
    longitude: String(data.longitude),
  };
}
