import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { CatalogAccess } from '../support/catalog-access';
import { SpaceResourceLinker } from '../support/space-resource-linker';
import {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_SLOT_CAPACITY,
  RESOURCE_REF_TYPE_SCHEMAS,
  RESOURCE_TYPE_CONCEPT,
  CARE_SPACES_REF_TYPE,
  normalizeRefType,
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
    private readonly spaceLinker: SpaceResourceLinker,
  ) {
    this.logger.setContext(CreateResourceUseCase.name);
  }

  /** UC-41-01: da de alta un recurso agendable. */
  async execute(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    // UN solo analizador para decidir el camino y para el valor que se guarda: lo que no
    // es un tipo admitido no se guarda, y lo que lo es se guarda en su forma canónica,
    // nunca la cruda (ver `normalizeRefType`).
    const refType = normalizeRefType(dto.resourceRefType);
    if (refType === null) {
      throw new PreconditionFailedException(
        'El tipo de referencia del recurso no está admitido',
        { allowed: Object.keys(RESOURCE_REF_TYPE_SCHEMAS) },
        SchedulingErrorReason.RESOURCE_REF_TYPE_NOT_ALLOWED,
      );
    }
    const canonicalDto: CreateResourceDto = {
      ...dto,
      resourceRefType: refType,
    };
    // Un recurso que apunta a un espacio de infraestructura no es «la agenda de un
    // profesional»: quién puede ligarlo lo decide la política del espacio (organización,
    // sucursal, jefe de quirófano), no el rol de administrador de agenda ni el vínculo de
    // afiliación. Ver `SpaceResourceLinker`.
    if (refType === CARE_SPACES_REF_TYPE) {
      return this.em.transactional((tx) =>
        this.spaceLinker.link(tx, canonicalDto, actor),
      );
    }
    this.access.assertMayCreateResource(canonicalDto, actor);
    await this.access.assertAffiliationWithOrganization(dto.tenantId, actor);
    this.logger.info(
      { operation: 'scheduling.resource.create', tenantId: dto.tenantId },
      'Creating schedulable resource',
    );

    return this.em.transactional(async (tx) => {
      const resource = this.catalogRepo.createResource(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        resourceTypeConceptId: RESOURCE_TYPE_CONCEPT[dto.resourceType],
        resourceRefType: refType,
        resourceRefId: dto.resourceRefId,
        name: dto.name,
        timeZone: dto.timeZone,
        capacity: dto.capacity ?? DEFAULT_SLOT_CAPACITY,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: resource.id,
        name: dto.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }
}
