import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthenticatedUser,
  CONCEPTS,
  ConceptName,
  ConflictException,
} from '../../../common';
import { IdentifiersRepository } from '../repositories';
import { Identifiers } from '../entities';
import {
  CreateIdentifierDto,
  IdentifierResponseDto,
  IdentifierType,
} from '../dto';

/**
 * Traduce el tipo de identificador de la API a la clave de concepto. Es explícito
 * porque las claves del catálogo (`ID_TYPE_NATIONAL`) no coinciden 1:1 con los
 * valores de entrada (`NATIONAL_ID`).
 */
const ID_TYPE_CONCEPT: Readonly<Record<IdentifierType, ConceptName>> = {
  [IdentifierType.NATIONAL_ID]: 'ID_TYPE_NATIONAL',
  [IdentifierType.MRN]: 'ID_TYPE_MRN',
  [IdentifierType.PASSPORT]: 'ID_TYPE_PASSPORT',
};

/**
 * Casos de uso de identificadores oficiales (UC-02-01).
 *
 * Cada escritura corre en `em.transactional`, obteniendo un `EntityManager`
 * aislado por petición (no hay `RequestContext` global). La regla de negocio
 * -unicidad del par ACTIVO (tipo, sistema, valor)- vive aquí, no en el repo.
 */
@Injectable()
export class IdentifiersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param identifiersRepo - Valor de identifiers repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentifiersService.name);
  }

  /** UC-02-01: crea un identificador ACTIVO rechazando duplicados. */
  async create(
    dto: CreateIdentifierDto,
    actor: AuthenticatedUser,
  ): Promise<IdentifierResponseDto> {
    this.logger.info(
      {
        operation: 'common.identifier.create',
        ownerId: dto.ownerId,
        type: dto.type,
      },
      'Creating identifier',
    );

    const typeConceptId = CONCEPTS[ID_TYPE_CONCEPT[dto.type]];

    return this.em.transactional(async (tx) => {
      const duplicate = await this.identifiersRepo.findActiveDuplicate(tx, {
        typeConceptId,
        system: dto.system,
        value: dto.value,
      });
      if (duplicate) {
        this.logger.warn(
          { operation: 'common.identifier.create', type: dto.type },
          'Rejected duplicate active identifier',
        );
        throw new ConflictException(
          'Ya existe un identificador activo con ese tipo, sistema y valor',
        );
      }

      const identifier = this.identifiersRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}`],
        ownerId: dto.ownerId,
        typeConceptId,
        system: dto.system,
        value: dto.value,
        useConceptId: dto.use ? CONCEPTS[`USE_${dto.use}`] : undefined,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'common.identifier.create', identifierId: identifier.id },
        'Identifier created',
      );
      return this.toResponse(identifier, dto);
    });
  }

  /**
   * Transforma to response.
   *
   * @param entity - Valor de entity requerido por la operación.
   * @param dto - Datos validados de la operación.
   * @returns Resultado de to response conforme al contrato `IdentifierResponseDto`.
   */
  private toResponse(
    entity: Identifiers,
    dto: CreateIdentifierDto,
  ): IdentifierResponseDto {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      ownerType: dto.ownerType,
      type: dto.type,
      system: entity.system,
      value: entity.value,
      state: 'ACTIVE',
      createdAt: entity.createdAt,
    };
  }
}
