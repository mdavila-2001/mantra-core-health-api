import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OperationalImprovementItems } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create improvement data.
 */
export interface CreateImprovementData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Identificador asociado a postmortem action item.
   */
  postmortemActionItemId?: string;
  /**
   * Identificador asociado a readiness review finding.
   */
  readinessReviewFindingId?: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId: string;
  /**
   * Valor de due at mantenido por la instancia.
   */
  dueAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a `platform_ops.operational_improvement_items`.
 *
 * Tiene repositorio propio porque la tabla es el backlog común de tres fuentes
 * —postmortem, revisión de preparación y ejercicio de resiliencia—, y cada una
 * vive en un servicio distinto. Colgarla de cualquiera de ellos obligaría a los
 * otros dos a depender de un repositorio que no es suyo.
 */
@Injectable()
export class OpsImprovementsRepository {
  /**
   * Crea create improvement item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create improvement item conforme al contrato `OperationalImprovementItems`.
   */
  createImprovementItem(
    em: EntityManager,
    data: CreateImprovementData,
  ): OperationalImprovementItems {
    return em.create(
      OperationalImprovementItems,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        postmortemActionItemId: data.postmortemActionItemId,
        readinessReviewFindingId: data.readinessReviewFindingId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        title: data.title,
        description: data.description,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        ownerUserId: data.ownerUserId,
        dueAt: data.dueAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
