import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser, CONCEPTS, ConceptName } from '../../../common';
import { AddressesRepository } from '../repositories';
import { Addresses } from '../entities';
import { AddressResponseDto, CreateAddressDto, OwnerType } from '../dto';

/** Separador con el que se serializan las líneas en la columna `lines` (varchar). */
const LINE_SEPARATOR = '\n';

/**
 * Casos de uso de direcciones postales (UC-02-04).
 *
 * Escrituras en `em.transactional` con un `EntityManager` aislado por petición.
 */
@Injectable()
export class AddressesService {
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

    // Solo existe el concepto de país PE en el catálogo; cualquier otro se ignora
    // y se usa el valor por defecto para no romper la FK a catalog_concepts.
    const countryConceptId = CONCEPTS.COUNTRY_PE;

    return this.em.transactional(async (tx) => {
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}`],
        ownerId: dto.ownerId,
        lines: dto.lines.join(LINE_SEPARATOR),
        city: dto.city,
        postalCode: dto.postalCode,
        countryConceptId,
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
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
      country: 'PE',
      createdAt: entity.createdAt,
    };
  }
}
