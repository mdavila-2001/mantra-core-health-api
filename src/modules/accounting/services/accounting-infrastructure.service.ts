import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { OutboxService } from '../../messaging/services/outbox.service';
import { PRAC } from '../../practice/practice.concepts';
import { InfrastructureAccessService } from '../../practice/services/infrastructure-access.service';
import { AccountingErrorReason } from '../accounting.error-reasons';
import type {
  CostCenterUnitLinkDto,
  InfrastructureItemLocationDto,
  LinkCostCenterUnitDto,
  LocateInfrastructureItemDto,
} from '../dto';

/** Eventos de contabilidad ligados a la infraestructura (`asyncapi/fragments/f5fin.yaml`). */
export const ACCOUNTING_INFRA_EVENTS = {
  /** Un activo de infraestructura quedó ubicado (o desubicado) en un espacio. */
  itemLocated: 'accounting.infrastructure_item.located',
  /** Un centro de costo quedó vinculado a una unidad clínica. */
  costCenterUnitLinked: 'accounting.cost_center.unit_linked',
} as const;

const NOT_FOUND_ITEM = {
  message: 'Activo no encontrado',
  reason: AccountingErrorReason.INFRASTRUCTURE_ITEM_NOT_FOUND,
};
const NOT_FOUND_COST_CENTER = {
  message: 'Centro de costo no encontrado',
  reason: AccountingErrorReason.COST_CENTER_NOT_FOUND,
};

/**
 * Ubicación física de los activos y centro de costo por unidad (CONTRATO-F2-F5 F5f).
 *
 * - `PATCH /accounting/infrastructure-items/:id`: el activo se ubica en un espacio de
 *   **su misma práctica** (422 `INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH`). El texto
 *   libre `location_text` queda como lectura heredada y no se toca.
 * - `POST /accounting/cost-centers/:id/unit-link`: un centro de costo activo por
 *   unidad (409 `UNIT_ALREADY_HAS_COST_CENTER`); los cargos devengados toman el centro
 *   de costo de la unidad dueña del espacio.
 *
 * Permisos: Administrador de organización y `ACCOUNTING_APPROVER` escriben; nadie más
 * (el soporte de plataforma, el administrador de sucursal y Facturación no).
 * `infrastructure_items` y `cost_centers` no tienen `tenant_id`: su tenant es el de su
 * práctica, y se contrasta contra el del contexto antes de leer o escribir; lo
 * ajeno responde igual que lo inexistente.
 */
@Injectable()
export class AccountingInfrastructureService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Evaluador de la infraestructura (nivel en la estructura).
   * @param outbox - Outbox transaccional.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Ubica (o desubica) un activo de infraestructura.
   *
   * @param itemId - Activo.
   * @param dto - Espacio o `null`.
   * @param actor - Quien lo ubica.
   * @param correlationId - Id de correlación.
   */
  async locateItem(
    itemId: string,
    dto: LocateInfrastructureItemDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<InfrastructureItemLocationDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<
        { id: string; practice_id: string; care_space_id: string | null }[]
      >(
        `select i.id, i.practice_id, i.care_space_id
           from accounting.infrastructure_items i
           join practice.practices p on p.id = i.practice_id
          where i.id = ? and p.tenant_id = ? for update of i`,
        [itemId, tenantId],
      );
      if (rows.length === 0) throw this.notFound(NOT_FOUND_ITEM);
      const item = rows[0];
      await this.assertCanWrite(tx, actor, tenantId, NOT_FOUND_ITEM);

      if (dto.careSpaceId !== null) {
        const spaces = await tx.execute<
          { practice_id: string; status_concept_id: string }[]
        >(
          `select s.practice_id, cs.status_concept_id
             from practice.care_spaces cs
             join practice.practice_sites s on s.id = cs.practice_site_id
            where cs.id = ? and cs.tenant_id = ?`,
          [dto.careSpaceId, tenantId],
        );
        if (spaces.length === 0)
          throw new ResourceNotFoundException(
            'Espacio no encontrado',
            undefined,
            AccountingErrorReason.INFRASTRUCTURE_SPACE_NOT_FOUND,
          );
        if (spaces[0].practice_id !== item.practice_id)
          throw new PreconditionFailedException(
            'El espacio no es de la práctica del activo',
            { errors: [{ field: 'careSpaceId' }] },
            AccountingErrorReason.INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH,
          );
        if (spaces[0].status_concept_id === PRAC.SPACE_RETIRED)
          throw new PreconditionFailedException(
            'El espacio está clausurado: no aloja activos',
            { errors: [{ field: 'careSpaceId' }] },
            AccountingErrorReason.INFRASTRUCTURE_SPACE_RETIRED,
          );
      }

      await tx.execute(
        `update accounting.infrastructure_items
            set care_space_id = ?, updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
          where id = ?`,
        [dto.careSpaceId, actor.id, itemId],
      );
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: ACCOUNTING_INFRA_EVENTS.itemLocated,
        aggregateType: 'infrastructure_item',
        aggregateId: itemId,
        payloadJson: {
          infrastructureItemId: itemId,
          practiceId: item.practice_id,
          careSpaceId: dto.careSpaceId,
          previousCareSpaceId: item.care_space_id,
          tenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });
      return {
        id: itemId,
        practiceId: item.practice_id,
        careSpaceId: dto.careSpaceId,
      };
    });
  }

  /**
   * Vincula un centro de costo a una unidad clínica.
   *
   * @param costCenterId - Centro de costo.
   * @param dto - Unidad.
   * @param actor - Quien lo vincula.
   * @param correlationId - Id de correlación.
   */
  async linkCostCenterUnit(
    costCenterId: string,
    dto: LinkCostCenterUnitDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<CostCenterUnitLinkDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<
        {
          id: string;
          practice_id: string;
          status_concept_id: string;
          clinical_unit_id: string | null;
        }[]
      >(
        `select c.id, c.practice_id, c.status_concept_id, c.clinical_unit_id
           from accounting.cost_centers c
           join practice.practices p on p.id = c.practice_id
          where c.id = ? and p.tenant_id = ? for update of c`,
        [costCenterId, tenantId],
      );
      if (rows.length === 0) throw this.notFound(NOT_FOUND_COST_CENTER);
      const center = rows[0];
      await this.assertCanWrite(tx, actor, tenantId, NOT_FOUND_COST_CENTER);

      const units = await tx.execute<{ practice_id: string }[]>(
        `select s.practice_id
           from practice.clinical_units u
           join practice.practice_sites s on s.id = u.practice_site_id
          where u.id = ? and u.tenant_id = ?`,
        [dto.clinicalUnitId, tenantId],
      );
      if (units.length === 0)
        throw new ResourceNotFoundException(
          'Unidad no encontrada',
          undefined,
          AccountingErrorReason.COST_CENTER_UNIT_NOT_FOUND,
        );
      if (units[0].practice_id !== center.practice_id)
        throw new PreconditionFailedException(
          'La unidad no es de la práctica del centro de costo',
          { errors: [{ field: 'clinicalUnitId' }] },
          AccountingErrorReason.COST_CENTER_UNIT_PRACTICE_MISMATCH,
        );

      if (center.clinical_unit_id === dto.clinicalUnitId)
        return {
          id: costCenterId,
          practiceId: center.practice_id,
          clinicalUnitId: dto.clinicalUnitId,
        };

      if (center.status_concept_id === CONCEPTS.STATE_ACTIVE) {
        const other = await tx.execute<{ id: string }[]>(
          `select id from accounting.cost_centers
            where clinical_unit_id = ? and status_concept_id = ? and id <> ? limit 1`,
          [dto.clinicalUnitId, CONCEPTS.STATE_ACTIVE, costCenterId],
        );
        if (other.length > 0)
          throw new ConflictException(
            'La unidad ya tiene un centro de costo activo',
            { costCenterId: other[0].id },
            AccountingErrorReason.UNIT_ALREADY_HAS_COST_CENTER,
          );
      }

      await tx.execute(
        `update accounting.cost_centers
            set clinical_unit_id = ?, updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
          where id = ?`,
        [dto.clinicalUnitId, actor.id, costCenterId],
      );
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: ACCOUNTING_INFRA_EVENTS.costCenterUnitLinked,
        aggregateType: 'cost_center',
        aggregateId: costCenterId,
        payloadJson: {
          costCenterId,
          practiceId: center.practice_id,
          clinicalUnitId: dto.clinicalUnitId,
          previousClinicalUnitId: center.clinical_unit_id,
          tenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });
      return {
        id: costCenterId,
        practiceId: center.practice_id,
        clinicalUnitId: dto.clinicalUnitId,
      };
    });
  }

  /**
   * Administrador de organización o `ACCOUNTING_APPROVER` del tenant. Quien no
   * pertenece al tenant recibe el mismo 404 que ante un id inexistente; quien
   * pertenece pero no tiene el rol, 403 con los roles requeridos.
   */
  private async assertCanWrite(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    notFound: { message: string; reason: string },
  ): Promise<void> {
    if (roleAuthorizesInTenant(actor, 'ACCOUNTING_APPROVER', tenantId)) return;
    const level = (await this.access.structureLevel(tx, actor)).level;
    if (level === 'ORG') return;
    if (level === 'NONE') throw this.notFound(notFound);
    throw new InsufficientRoleException(
      'Ningún rol suyo permite esta acción',
      { requiredRoles: ['ORG_ADMIN', 'ACCOUNTING_APPROVER'] },
      'INFRA_ACTION_NOT_ALLOWED',
    );
  }

  private notFound(failure: {
    message: string;
    reason: string;
  }): ResourceNotFoundException {
    return new ResourceNotFoundException(
      failure.message,
      undefined,
      failure.reason,
    );
  }
}
