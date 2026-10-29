import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../../common';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { OperatingRoomAccessService } from '../../../../procedures_perioperative/policies/operating-room-access.service';
import {
  FUNCTIONS,
  FUNCTION_PROFILES,
  type FunctionCode,
} from '../../../../practice/infrastructure-catalog';
import { PRAC } from '../../../../practice/practice.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { SchedulableResources } from '../../../entities';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  CARE_SPACES_REF_TYPE,
  DEFAULT_SLOT_CAPACITY,
  normalizeRefType,
  RESOURCE_TYPE_CONCEPT,
} from '../../../domain/catalog/catalog-concepts';
import type {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../../presentation/dto';

/** Evento que se publica al ligar un recurso a un espacio (`asyncapi/fragments/f4.yaml`). */
export const RESOURCE_LINKED_TO_SPACE_EVENT =
  'scheduling.resource.linked_to_space';

/**
 * Vincula un recurso agendable a un espacio de infraestructura (R0 de F4, INV-40).
 *
 * Reglas, en el orden en que se evalúan (cada una corta con su `reason`):
 *
 * 1. el tipo de recurso es `ROOM` (422 `SPACE_RESOURCE_MUST_BE_ROOM`);
 * 2. el espacio existe **en el tenant del contexto** (404 `SPACE_NOT_FOUND`, igual para uno
 *    de otro tenant);
 * 3. el actor puede vincularlo: administrador de la organización/sucursal/plataforma, o jefe
 *    de quirófano si el espacio es un quirófano (404 fuera de su sucursal, 403 sin permiso);
 * 4. el perfil de su función es `schedulable` (422 `SPACE_NOT_SCHEDULABLE`);
 * 5. el espacio está ACTIVO (422 `SPACE_NOT_ACTIVE`);
 * 6. no hay otro recurso activo para ese espacio (409 `RESOURCE_ALREADY_EXISTS_FOR_SPACE`;
 *    el único parcial `ux_schedulable_resources_care_space_active` es la red ante la carrera).
 *
 * Se escribe `care_space_id` (FK real); `resource_ref_type` es siempre `care_spaces` y
 * `resource_ref_id` el mismo espacio, como exige `ck_schedulable_resources_care_space_ref`.
 */
@Injectable()
export class SpaceResourceLinker {
  /**
   * @param access - Evaluador de la política de quirófanos/espacios.
   * @param catalogRepo - Repositorio del catálogo de agenda.
   * @param outbox - Outbox transaccional.
   */
  constructor(
    private readonly access: OperatingRoomAccessService,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Crea el recurso ligado al espacio dentro de la transacción `tx`.
   *
   * @param tx - Transacción activa.
   * @param dto - Cuerpo del alta.
   * @param actor - Quien lo pide.
   * @returns El recurso creado.
   */
  async link(
    tx: EntityManager,
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    const tenantId = requireTenantId();
    // Quien llama ya decidió el camino con `normalizeRefType`; se vuelve a comprobar para
    // que este vínculo nunca se use con otra cosa que un espacio.
    if (normalizeRefType(dto.resourceRefType) !== CARE_SPACES_REF_TYPE) {
      throw this.spaceNotFound();
    }
    if (dto.tenantId !== tenantId) throw this.spaceNotFound();
    if (dto.resourceType !== 'ROOM') {
      throw new PreconditionFailedException(
        'Un recurso que apunta a un espacio es de tipo ROOM',
        { resourceType: dto.resourceType },
        SchedulingErrorReason.SPACE_RESOURCE_MUST_BE_ROOM,
      );
    }

    const room = await this.access.loadRoom(tx, dto.resourceRefId);
    if (!room) throw this.spaceNotFound();
    const { space, site } = room;

    const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId);
    await this.access.assertCan(
      tx,
      actor,
      fn?.code === 'SPACE_FN_OPERATING_ROOM'
        ? 'OR_RESOURCE_LINK'
        : 'SPACE_RESOURCE_LINK',
      { site, space },
    );

    const profile = fn ? FUNCTION_PROFILES[fn.code as FunctionCode] : undefined;
    if (!profile?.schedulable) {
      throw new PreconditionFailedException(
        'La función del espacio no admite agenda',
        { careSpaceId: space.id, function: fn?.code ?? null },
        SchedulingErrorReason.SPACE_NOT_SCHEDULABLE,
      );
    }
    if (space.statusConceptId !== PRAC.SPACE_ACTIVE) {
      throw new PreconditionFailedException(
        'Sólo un espacio activo puede ser un recurso agendable',
        { careSpaceId: space.id },
        SchedulingErrorReason.SPACE_NOT_ACTIVE,
      );
    }

    const existing = await tx.findOne(SchedulableResources, {
      careSpaceId: space.id,
      tenantId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (existing) {
      throw new ConflictException(
        'El espacio ya es un recurso agendable activo',
        { careSpaceId: space.id, resourceId: existing.id },
        SchedulingErrorReason.RESOURCE_ALREADY_EXISTS_FOR_SPACE,
      );
    }

    const resource = this.catalogRepo.createResource(tx, {
      tenantId,
      practiceId: site.practiceId,
      resourceTypeConceptId: RESOURCE_TYPE_CONCEPT.ROOM,
      resourceRefType: CARE_SPACES_REF_TYPE,
      resourceRefId: space.id,
      careSpaceId: space.id,
      name: dto.name,
      timeZone: dto.timeZone,
      capacity: dto.capacity ?? DEFAULT_SLOT_CAPACITY,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: actor.id,
    });
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: RESOURCE_LINKED_TO_SPACE_EVENT,
      aggregateType: 'schedulable_resource',
      aggregateId: resource.id,
      payloadJson: {
        resourceId: resource.id,
        careSpaceId: space.id,
        siteId: site.id,
        practiceId: site.practiceId,
        tenantId,
        actorUserId: actor.id,
      },
      actorUserId: actor.id,
    });

    return {
      id: resource.id,
      name: dto.name,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    };
  }

  private spaceNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Espacio no encontrado',
      undefined,
      SchedulingErrorReason.SPACE_NOT_FOUND,
    );
  }
}
