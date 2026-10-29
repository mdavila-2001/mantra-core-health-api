import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../../common';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { CatalogAccess } from '../support/catalog-access';
import { SpaceResourceLinker } from '../support/space-resource-linker';
import { EquipmentResourceLinker } from '../support/equipment-resource-linker';
import {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_SLOT_CAPACITY,
  RESOURCE_REF_TYPE_SCHEMAS,
  RESOURCE_TYPE_CONCEPT,
  CARE_SPACES_REF_TYPE,
  EQUIPMENT_REF_TYPE,
  PRACTICE_SITES_REF_TYPE,
  REF_TYPES_BY_RESOURCE,
  normalizeRefType,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/**
 * El tipo de recurso tiene que corresponder a lo que referencia: una sala no apunta a un perfil
 * profesional ni un equipo a una sede. La referencia libre sin validar deja de existir (INV-40).
 * Un recurso que apunta a un espacio ya lo exige `SpaceResourceLinker` (`SPACE_RESOURCE_MUST_BE_ROOM`).
 */
function assertRefMatchesType(dto: CreateResourceDto, refType: string): void {
  if (!REF_TYPES_BY_RESOURCE[dto.resourceType].includes(refType)) {
    throw new PreconditionFailedException(
      'El tipo de recurso no corresponde a lo que referencia',
      { resourceType: dto.resourceType },
      SchedulingErrorReason.RESOURCE_REF_TYPE_MISMATCH,
    );
  }
}

/** UC-41-01: define un recurso agendable. */
@Injectable()
export class CreateResourceUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
    private readonly spaceLinker: SpaceResourceLinker,
    private readonly equipmentLinker: EquipmentResourceLinker,
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
    // Un equipo de diagnóstico: su agenda se ata a la sala donde está, y quién la abre lo decide
    // la política del espacio (no el rol de administrador de agenda). Ver `EquipmentResourceLinker`.
    if (refType === EQUIPMENT_REF_TYPE) {
      assertRefMatchesType(dto, refType);
      const active = getCurrentTenantId();
      if (active !== undefined && dto.tenantId !== active) {
        throw new ResourceNotFoundException(
          'Equipo no encontrado',
          undefined,
          SchedulingErrorReason.RESOURCE_REF_NOT_FOUND,
        );
      }
      return this.em.transactional((tx) =>
        this.equipmentLinker.link(
          tx,
          dto.resourceRefId,
          { name: dto.name, timeZone: dto.timeZone, capacity: dto.capacity },
          actor,
        ),
      );
    }
    this.access.assertMayCreateResource(canonicalDto, actor);
    assertRefMatchesType(dto, refType);
    await this.access.assertAffiliationWithOrganization(dto.tenantId, actor);
    this.logger.info(
      { operation: 'scheduling.resource.create', tenantId: dto.tenantId },
      'Creating schedulable resource',
    );

    return this.em.transactional(async (tx) => {
      // Una sede referenciada es una sede de la organización (404 uniforme si no).
      if (refType === PRACTICE_SITES_REF_TYPE) {
        const sites = await tx.execute<{ id: string }[]>(
          `select id from practice.practice_sites where id = ? and tenant_id = ?`,
          [dto.resourceRefId, getCurrentTenantId() ?? dto.tenantId],
        );
        if (sites.length === 0) {
          throw new ResourceNotFoundException(
            'Sede no encontrada',
            undefined,
            SchedulingErrorReason.RESOURCE_REF_NOT_FOUND,
          );
        }
      }
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
