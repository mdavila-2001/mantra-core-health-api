import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../../../common';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { InfrastructureAccessService } from '../../../../practice/services/infrastructure-access.service';
import {
  DEFAULT_SLOT_CAPACITY,
  RESOURCE_TYPE_CONCEPT,
} from '../../../domain/catalog/catalog-concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Evento que se publica al ligar un recurso agendable a un equipo (`asyncapi/fragments/f5agenda.yaml`). */
export const RESOURCE_LINKED_TO_EQUIPMENT_EVENT =
  'scheduling.resource.linked_to_equipment';

/** El equipo con el sitio y la sala que importan para ligarlo. */
export interface EquipmentRef {
  readonly id: string;
  readonly tenantId: string;
  readonly careSpaceId: string | null;
  readonly practiceSiteId: string;
  readonly practiceId: string;
  readonly schedulableResourceId: string | null;
  readonly operationalStatusConceptId: string;
  readonly label: string;
}

/** Datos de alta que el cliente puede elegir. */
export interface EquipmentResourceInput {
  readonly name?: string;
  readonly timeZone?: string;
  readonly capacity?: number;
}

/** El 404 uniforme del equipo: inexistente y de otra organización responden igual. */
export function equipmentRefNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Equipo no encontrado',
    undefined,
    SchedulingErrorReason.RESOURCE_REF_NOT_FOUND,
  );
}

/**
 * Liga el equipo de diagnóstico a la agenda como recurso `EQUIPMENT` (F5a, INV-40).
 *
 * Reglas, en el orden en que se evalúan:
 *
 * 1. el equipo es de la organización del contexto (404 uniforme: inexistente y ajeno);
 * 2. el actor puede: administrador de la organización o de la sucursal de la sala, o quien
 *    coordina agendas del tenant (404 si no ve la sala, 403 `INFRA_ACTION_NOT_ALLOWED`);
 * 3. el equipo está ubicado en una sala (422 `EQUIPMENT_NOT_LOCATED`): sin sala no hay a qué
 *    atar la agenda del estudio;
 * 4. no hay otro recurso activo para el equipo (409 `RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT`,
 *    con el id del existente en `details`). La carrera se serializa bloqueando la fila del
 *    equipo (`FOR UPDATE`): no hay único parcial que la ataje en la base.
 *
 * El `tenant_id` del recurso sale del contexto, nunca del cuerpo.
 */
@Injectable()
export class EquipmentResourceLinker {
  /**
   * @param infra - Evaluador de la política de infraestructura.
   * @param catalogRepo - Repositorio del catálogo de agenda.
   * @param outbox - Outbox transaccional.
   */
  constructor(
    private readonly infra: InfrastructureAccessService,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Carga el equipo del tenant, bloqueando su fila si `lock`.
   *
   * @throws ResourceNotFoundException (404 uniforme).
   */
  async loadEquipment(
    tx: EntityManager,
    equipmentId: string,
    lock = false,
  ): Promise<EquipmentRef> {
    const tenantId = requireTenantId();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select e.id, u.tenant_id, e.care_space_id, s.practice_site_id, ps.practice_id,
              e.schedulable_resource_id, e.operational_status_concept_id,
              coalesce(nullif(btrim(concat_ws(' ', e.manufacturer, e.model)), ''), 'Equipo') as label
         from diagnostic_units.diagnostic_equipment e
         join diagnostic_units.diagnostic_unit_sites s on s.id = e.diagnostic_unit_site_id
         join diagnostic_units.diagnostic_units u on u.id = s.diagnostic_unit_id
         join practice.practice_sites ps on ps.id = s.practice_site_id
        where e.id = ? and u.tenant_id = ? ${lock ? 'for update of e' : ''}`,
      [equipmentId, tenantId],
    );
    const row = rows[0];
    if (!row) throw equipmentRefNotFound();
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      careSpaceId: (row.care_space_id as string | null) ?? null,
      practiceSiteId: String(row.practice_site_id),
      practiceId: String(row.practice_id),
      schedulableResourceId:
        (row.schedulable_resource_id as string | null) ?? null,
      operationalStatusConceptId: String(row.operational_status_concept_id),
      label: String(row.label),
    };
  }

  /**
   * Crea el recurso `EQUIPMENT` del equipo.
   *
   * @returns El recurso creado.
   */
  async link(
    tx: EntityManager,
    equipmentId: string,
    input: EquipmentResourceInput,
    actor: AuthenticatedUser,
  ): Promise<{ id: string; name: string; stateConceptId: string }> {
    const tenantId = requireTenantId();
    const equipment = await this.loadEquipment(tx, equipmentId, true);

    if (!equipment.careSpaceId) {
      // Antes del permiso no se sabe a qué sala atar; el 422 no revela nada ajeno porque el
      // equipo ya se comprobó del tenant.
      throw new PreconditionFailedException(
        'El equipo no está ubicado en una sala: ubíquelo antes de abrir su agenda',
        { equipmentId },
        SchedulingErrorReason.EQUIPMENT_NOT_LOCATED,
      );
    }
    if (!roleAuthorizesInTenant(actor, 'SCHEDULING_ADMIN', tenantId)) {
      await this.infra.assertCan(
        actor,
        'infra.agenda.assign',
        { careSpaceId: equipment.careSpaceId },
        tx,
      );
    }

    const existing = await tx.execute<{ id: string }[]>(
      `select id from scheduling.schedulable_resources
        where tenant_id = ? and resource_ref_type = 'diagnostic_equipment'
          and resource_ref_id = ? and state_concept_id = ?`,
      [tenantId, equipmentId, CONCEPTS.STATE_ACTIVE],
    );
    if (existing.length > 0) {
      throw new ConflictException(
        'El equipo ya tiene un recurso agendable activo',
        { equipmentId, resourceId: existing[0].id },
        SchedulingErrorReason.RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT,
      );
    }

    const name = (input.name ?? equipment.label).slice(0, 200);
    const resource = this.catalogRepo.createResource(tx, {
      tenantId,
      practiceId: equipment.practiceId,
      resourceTypeConceptId: RESOURCE_TYPE_CONCEPT.EQUIPMENT,
      resourceRefType: 'diagnostic_equipment',
      resourceRefId: equipmentId,
      name,
      timeZone: input.timeZone,
      capacity: input.capacity ?? DEFAULT_SLOT_CAPACITY,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: actor.id,
    });
    await tx.flush();
    await tx.execute(
      `update diagnostic_units.diagnostic_equipment
          set schedulable_resource_id = ?, updated_at = now(), updated_by_user_id = ?,
              row_version = row_version + 1
        where id = ?`,
      [resource.id, actor.id, equipmentId],
    );
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: RESOURCE_LINKED_TO_EQUIPMENT_EVENT,
      aggregateType: 'schedulable_resource',
      aggregateId: resource.id,
      payloadJson: {
        resourceId: resource.id,
        equipmentId,
        careSpaceId: equipment.careSpaceId,
        siteId: equipment.practiceSiteId,
        tenantId,
        actorUserId: actor.id,
      },
      actorUserId: actor.id,
    });
    return { id: resource.id, name, stateConceptId: CONCEPTS.STATE_ACTIVE };
  }
}
