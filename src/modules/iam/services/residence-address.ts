import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import {
  boDepartmentConceptId,
  boMunicipalityByConceptId,
} from '../../../common/seed/bo-geography.catalog';
import type { AddressesRepository } from '../../common/repositories';

/** Lo que hace falta para escribir el domicilio de quien se acaba de registrar. */
export interface ResidenceAddressData {
  /** La persona recién creada, dueña de la dirección. */
  readonly personId: string;
  /** Municipio elegido en el alta; `undefined` si no eligió ninguno. */
  readonly municipalityConceptId?: string;
  /** Quién escribe la fila, para la auditoría. */
  readonly actorUserId: string;
}

/**
 * Escribe el domicilio de residencia a partir del municipio elegido en el alta.
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
 * @param tx - Contexto transaccional del alta.
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
  if (!data.municipalityConceptId) {
    return false;
  }

  const municipality = boMunicipalityByConceptId(data.municipalityConceptId);
  if (!municipality) {
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
    administrativeAreaConceptId: boDepartmentConceptId(municipality.department),
    // `city` es texto libre y el municipio ya es el dato de catálogo; se copia
    // el nombre para que quien lea la dirección sin resolver conceptos —un
    // export, un sobre— tenga algo legible.
    city: municipality.name,
    useConceptId: CONCEPTS.ADDR_USE_HOME,
    typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
    actorUserId: data.actorUserId,
  });
  return true;
}
