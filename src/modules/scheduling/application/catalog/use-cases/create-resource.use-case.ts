import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { Inject } from '@nestjs/common';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  CARE_SPACE_DIRECTORY_PORT,
  type CareSpaceDirectoryPort,
} from '../../ports/care-space-directory.port';
import { CatalogAccess } from '../support/catalog-access';
import {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_SLOT_CAPACITY,
  RESOURCE_TYPE_CONCEPT,
  canonicalRefType,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** UC-41-01: define un recurso agendable. */
@Injectable()
export class CreateResourceUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
    @Inject(CARE_SPACE_DIRECTORY_PORT)
    private readonly spaces: CareSpaceDirectoryPort,
  ) {
    this.logger.setContext(CreateResourceUseCase.name);
  }

  /** UC-41-01: da de alta un recurso agendable. */
  async execute(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    this.access.assertMayCreateResource(dto, actor);
    await this.access.assertAffiliationWithOrganization(dto.tenantId, actor);
    this.logger.info(
      { operation: 'scheduling.resource.create', tenantId: dto.tenantId },
      'Creating schedulable resource',
    );

    return this.em.transactional(async (tx) => {
      const refType = canonicalRefType(dto.resourceRefType);
      // R0 (CONTRATO-F2-F5 §F4.3): un recurso de `care_spaces` apunta a un
      // espacio real del tenant (404), agendable (422), activo (422) y único
      // entre los recursos activos (409); se escribe la FK `care_space_id`.
      let careSpaceId: string | undefined;
      if (refType === 'care_spaces') {
        const space = await this.spaces.describe(tx, dto.resourceRefId);
        if (!space || space.tenantId !== dto.tenantId) {
          throw new ResourceNotFoundException('Espacio no encontrado', {
            careSpaceId: dto.resourceRefId,
          });
        }
        if (!space.schedulable) {
          throw new PreconditionFailedException(
            'El espacio no es agendable',
            { functionCode: space.functionCode },
            SchedulingErrorReason.SPACE_NOT_SCHEDULABLE,
          );
        }
        if (!space.active) {
          throw new PreconditionFailedException(
            'El espacio no está activo',
            {},
            SchedulingErrorReason.SPACE_NOT_ACTIVE,
          );
        }
        if (await this.spaces.hasActiveResource(tx, dto.resourceRefId)) {
          throw new ConflictException(
            'El espacio ya tiene un recurso agendable activo',
            { careSpaceId: dto.resourceRefId },
            SchedulingErrorReason.RESOURCE_ALREADY_EXISTS_FOR_SPACE,
          );
        }
        careSpaceId = dto.resourceRefId;
      }
      const resource = this.catalogRepo.createResource(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        resourceTypeConceptId: RESOURCE_TYPE_CONCEPT[dto.resourceType],
        resourceRefType: refType,
        careSpaceId,
        resourceRefId: dto.resourceRefId,
        name: dto.name,
        timeZone: dto.timeZone,
        capacity: dto.capacity ?? DEFAULT_SLOT_CAPACITY,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      if (careSpaceId) {
        await tx.flush();
        await this.spaces.announceLinked(tx, {
          tenantId: dto.tenantId,
          resourceId: resource.id,
          careSpaceId,
          actorUserId: actor.id,
        });
      }
      return {
        id: resource.id,
        name: dto.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }
}
