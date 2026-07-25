import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthenticatedUser,
  CONCEPTS,
  ConceptName,
  ResourceNotFoundException,
} from '../../../common';
import { ContactPointsRepository } from '../repositories';
import { ContactPoints } from '../entities';
import {
  ContactPointResponseDto,
  ContactSystem,
  CreateContactPointDto,
  OwnerType,
  VerifyContactPointDto,
} from '../dto';

/**
 * Casos de uso de puntos de contacto (UC-02-02, UC-02-03).
 *
 * Escrituras en `em.transactional` con un `EntityManager` aislado por petición.
 */
@Injectable()
export class ContactPointsService {
  constructor(
    private readonly em: EntityManager,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ContactPointsService.name);
  }

  /** UC-02-02: registra un punto de contacto no verificado. */
  async create(
    dto: CreateContactPointDto,
    actor: AuthenticatedUser,
  ): Promise<ContactPointResponseDto> {
    this.logger.info(
      { operation: 'common.contactPoint.create', ownerId: dto.ownerId, system: dto.system },
      'Creating contact point',
    );

    return this.em.transactional(async (tx) => {
      const contactPoint = this.contactPointsRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}` as ConceptName],
        ownerId: dto.ownerId,
        systemConceptId: CONCEPTS[`CONTACT_${dto.system}` as ConceptName],
        value: dto.value,
        useConceptId: dto.use ? CONCEPTS[`CONTACT_USE_${dto.use}` as ConceptName] : undefined,
        rank: dto.rank,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'common.contactPoint.create', contactPointId: contactPoint.id },
        'Contact point created',
      );
      return this.toResponse(contactPoint);
    });
  }

  /**
   * UC-02-03: marca un punto de contacto como verificado.
   *
   * En esta implementación se acepta cualquier `code`. Un flujo real emitiría un
   * reto (OTP por email/SMS) y confirmaría el código contra un challenge store con
   * expiración e intentos limitados antes de marcar `verified = true`.
   */
  async verify(
    id: string,
    _dto: VerifyContactPointDto,
    actor: AuthenticatedUser,
  ): Promise<ContactPointResponseDto> {
    this.logger.info(
      { operation: 'common.contactPoint.verify', contactPointId: id },
      'Verifying contact point',
    );

    return this.em.transactional(async (tx) => {
      const contactPoint = await this.contactPointsRepo.findById(tx, id);
      if (!contactPoint) {
        this.logger.warn(
          { operation: 'common.contactPoint.verify', contactPointId: id },
          'Contact point not found',
        );
        throw new ResourceNotFoundException('Punto de contacto no encontrado');
      }

      contactPoint.verified = true;
      contactPoint.updatedAt = new Date();
      contactPoint.updatedByUserId = actor.id;
      await tx.flush();

      this.logger.info(
        { operation: 'common.contactPoint.verify', contactPointId: id },
        'Contact point verified',
      );
      return this.toResponse(contactPoint);
    });
  }

  private toResponse(entity: ContactPoints): ContactPointResponseDto {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      ownerType: this.ownerTypeOf(entity.ownerTypeConceptId),
      system: this.systemOf(entity.systemConceptId),
      value: entity.value,
      verified: entity.verified ?? false,
      createdAt: entity.createdAt,
    };
  }

  private ownerTypeOf(conceptId: string): OwnerType {
    if (conceptId === CONCEPTS.OWNER_PATIENT) return OwnerType.PATIENT;
    if (conceptId === CONCEPTS.OWNER_TENANT) return OwnerType.TENANT;
    return OwnerType.USER;
  }

  private systemOf(conceptId: string): ContactSystem {
    return conceptId === CONCEPTS.CONTACT_PHONE ? ContactSystem.PHONE : ContactSystem.EMAIL;
  }
}
