import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser, CONCEPTS } from '../../../common';
import { AddressesRepository } from '../repositories';
import { Addresses } from '../entities';
import { AddressResponseDto, CreateAddressDto } from '../dto';

/** Separador con el que se serializan las líneas en la columna `lines` (varchar). */
const LINE_SEPARATOR = '\n';

/**
 * Casos de uso de direcciones postales (UC-02-04).
 *
 * Escrituras en `em.transactional` con un `EntityManager` aislado por petición.
 */
@Injectable()
export class AddressesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param addressesRepo - Valor de addresses repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly addressesRepo: AddressesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AddressesService.name);
  }

  /** UC-02-04: registra una dirección (país PE por defecto, uso HOME, tipo POSTAL). */
  async create(
    dto: CreateAddressDto,
    actor: AuthenticatedUser,
  ): Promise<AddressResponseDto> {
    this.logger.info(
      { operation: 'common.address.create', ownerId: dto.ownerId },
      'Creating address',
    );

    // ALoVida es una plataforma boliviana: el único país sembrado que tiene
    // sentido por defecto es BO, no PE. Cualquier otro valor de `dto.country`
    // se ignora y se usa el valor por defecto para no romper la FK a
    // catalog_concepts (no hay más países sembrados hoy).
    const countryConceptId = CONCEPTS.COUNTRY_BO;

    return this.em.transactional(async (tx) => {
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}`],
        ownerId: dto.ownerId,
        lines: dto.lines.join(LINE_SEPARATOR),
        city: dto.city,
        postalCode: dto.postalCode,
        countryConceptId,
        municipalityConceptId: dto.municipalityConceptId,
        administrativeAreaConceptId: dto.administrativeAreaConceptId,
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
        latitude: dto.latitude !== undefined ? String(dto.latitude) : undefined,
        longitude:
          dto.longitude !== undefined ? String(dto.longitude) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'common.address.create', addressId: address.id },
        'Address created',
      );
      return this.toResponse(address, dto);
    });
  }

  /**
   * Transforma to response.
   *
   * @param entity - Valor de entity requerido por la operación.
   * @param dto - Datos validados de la operación.
   * @returns Resultado de to response conforme al contrato `AddressResponseDto`.
   */
  private toResponse(
    entity: Addresses,
    dto: CreateAddressDto,
  ): AddressResponseDto {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      ownerType: dto.ownerType,
      lines: entity.lines ? entity.lines.split(LINE_SEPARATOR) : [],
      city: entity.city,
      postalCode: entity.postalCode,
      country: 'BO',
      municipalityConceptId: entity.municipalityConceptId,
      administrativeAreaConceptId: entity.administrativeAreaConceptId,
      latitude:
        entity.latitude !== undefined ? Number(entity.latitude) : undefined,
      longitude:
        entity.longitude !== undefined ? Number(entity.longitude) : undefined,
      createdAt: entity.createdAt,
    };
  }
}
