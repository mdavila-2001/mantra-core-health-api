import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import {
  boDepartmentConceptId,
  boMunicipalityByConceptId,
} from '../../../common/seed/bo-geography.catalog';
import type { Addresses } from '../entities';
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

/* ============================================================================
    ALV-009: corregir el domicilio ya declarado, y leerlo de vuelta.

    Nace acá y no en `profiles` para que el profesional lo use sin duplicar
    la lógica de "cerrar la vigente y abrir otra" que `ProfilesPatientsService`
    ya tenía local (`reemplazarDireccion`). El servicio de pacientes NO se
    tocó: sigue con su copia — un refactor a esta función queda de
    seguimiento. Lo que sí comparten los dos es la tabla y el criterio de
    vigencia (`valid_to null` o futuro).
    ========================================================================== */

/** Lo que hace falta para reemplazar el domicilio ya declarado de una persona. */
export interface ReplaceResidenceAddressData {
  /** La persona dueña de la dirección. */
  readonly personId: string;
  /** `ADDR_USE_HOME` o `ADDR_USE_WORK`. */
  readonly useConceptId: string;
  /** `undefined` = no vino en este `PATCH`, se conserva lo vigente. */
  readonly municipalityConceptId?: string;
  /**
   * Calle y número. `undefined` conserva lo vigente; `''` la borra —es el
   * único de los tres con una forma explícita de vaciarse, porque es el
   * único cuya ausencia total tiene sentido (una dirección sin calle, con
   * sólo el municipio, sigue siendo un dato).
   */
  readonly lines?: string;
  /** Ambas o ninguna: el DTO ya rechaza el par incompleto. */
  readonly latitude?: number;
  readonly longitude?: number;
  /** Quién edita, para la auditoría y el cierre de la fila anterior. */
  readonly actorUserId: string;
}

/**
 * El número de una columna `numeric` que MikroORM mapea a `string`.
 *
 * `undefined` (sin fila vigente, o columna sin dato) se preserva tal cual:
 * `Number(undefined)` es `NaN`, y un `NaN !== NaN` rompería la comparación
 * de "sin cambios" de más abajo aunque nada haya cambiado.
 */
function numeroDeColumna(valor: string | undefined): number | undefined {
  return valor === undefined ? undefined : Number(valor);
}

/**
 * Cierra la fila vigente y abre otra con la mezcla de lo que llegó y lo que
 * ya estaba — mismo criterio que `ProfilesPatientsService.reemplazarDireccion`.
 *
 * No hace nada si, tras la mezcla, nada cambió: evita una fila nueva por
 * cada `PATCH` que repite el mismo domicilio.
 *
 * @param repo - Repositorio de `common.addresses`.
 * @param tx - Transacción activa.
 * @param data - Persona, uso, lo que trae el cuerpo y el actor.
 * @param ahora - Instante de la edición, fin de vigencia de la anterior.
 */
export async function replaceResidenceAddress(
  repo: AddressesRepository,
  tx: EntityManager,
  data: ReplaceResidenceAddressData,
  ahora: Date,
): Promise<void> {
  const vigente = await repo.findVigenteByOwnerAndUse(
    tx,
    data.personId,
    data.useConceptId,
  );

  const municipalityConceptId =
    data.municipalityConceptId ?? vigente?.municipalityConceptId;
  const lines =
    data.lines === undefined
      ? vigente?.lines
      : data.lines.trim() === ''
        ? undefined
        : data.lines.trim();
  const tieneGps = data.latitude !== undefined && data.longitude !== undefined;
  const latitude = tieneGps ? data.latitude : numeroDeColumna(vigente?.latitude);
  const longitude = tieneGps
    ? data.longitude
    : numeroDeColumna(vigente?.longitude);

  const sinCambios =
    (vigente?.municipalityConceptId ?? undefined) === municipalityConceptId &&
    (vigente?.lines ?? undefined) === lines &&
    numeroDeColumna(vigente?.latitude) === latitude &&
    numeroDeColumna(vigente?.longitude) === longitude;
  if (sinCambios) return;

  if (vigente) repo.closeVigente(vigente, ahora, data.actorUserId);

  const escribir =
    data.useConceptId === CONCEPTS.ADDR_USE_WORK
      ? createWorkAddress
      : createResidenceAddress;
  escribir(repo, tx, {
    personId: data.personId,
    municipalityConceptId,
    lines,
    latitude,
    longitude,
    actorUserId: data.actorUserId,
  });
}

/** Una dirección, tal como la ve un perfil propio. Mismo contrato que `OwnAddressDto`. */
export interface AddressSummary {
  readonly lines?: string;
  readonly city?: string;
  readonly municipalityConceptId?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

/**
 * Traduce una fila de `common.addresses` al resumen que un perfil devuelve.
 *
 * `undefined` —y no un objeto vacío— cuando no hay fila: la pantalla
 * distingue «no lo declaró» de «lo declaró sin datos».
 */
export function summarizeAddress(
  fila?: Addresses | null,
): AddressSummary | undefined {
  if (!fila) return undefined;
  return {
    ...(fila.lines === undefined ? {} : { lines: fila.lines }),
    ...(fila.city === undefined ? {} : { city: fila.city }),
    ...(fila.municipalityConceptId === undefined
      ? {}
      : { municipalityConceptId: fila.municipalityConceptId }),
    // Las coordenadas viajan juntas o no viajan: media coordenada no ubica
    // nada. Se compara con `== null` y no `=== undefined`: la columna es
    // nullable y la base devuelve `null`, no `undefined` — con la
    // comparación estricta `Number(null)` (que es 0) se cuela.
    ...(fila.latitude == null || fila.longitude == null
      ? {}
      : { latitude: Number(fila.latitude), longitude: Number(fila.longitude) }),
  };
}
