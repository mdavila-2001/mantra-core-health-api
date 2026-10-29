import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { ATTRIBUTES } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  ClinicalUnitsRepository,
  SpaceUnitAssignmentsRepository,
} from '../repositories';
import type { SpaceUnitAssignmentView } from '../dto/infrastructure.types';
import { practiceOutOfScope } from './practice-scope';
import { StructureContextService } from './structure-context.service';
import { mapReferenceViolation } from './structure-errors';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';
import { toAssignmentView } from './structure-mapper';

const OWNER = ATTRIBUTES.unitRole.byInput('SPACE_UNIT_ROLE_OWNER')!;

/**
 * Vínculo espacio ↔ unidad con vigencia y rol (`OWNER` / `SHARED` / `LOAN`).
 *
 * Un solo `OWNER` vigente por espacio y un solo vínculo vigente por par
 * (INV-16). El vínculo `OWNER` se refleja en `care_spaces.clinical_unit_id`.
 * Desvincular **cierra la vigencia** (`valid_to`): no borra la fila (INV-14).
 */
@Injectable()
export class SpaceUnitAssignmentsService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param unitsRepo - Unidades.
   * @param assignmentsRepo - Vínculos.
   * @param historyRepo - Historia.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly events: StructureEventsService,
  ) {}

  /**
   * `POST /care-spaces/:id/unit-assignments`.
   *
   * @param spaceId - Espacio.
   * @param clinicalUnitId - Unidad a vincular.
   * @param roleCode - `OWNER`, `SHARED` o `LOAN` (también con el prefijo completo).
   * @param actor - Quien vincula.
   * @param correlationId - Id de correlación.
   * @returns El vínculo creado.
   */
  async assign(
    spaceId: string,
    clinicalUnitId: string,
    roleCode: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SpaceUnitAssignmentView> {
    return this.em.transactional(async (tx) => {
      const { space, tenantId } = await this.context.space(
        tx,
        spaceId,
        actor,
        'write',
      );
      if (space.statusConceptId === PRAC.SPACE_RETIRED) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
          'El espacio está clausurado',
        );
      }
      const role = ATTRIBUTES.unitRole.byInput(roleCode);
      if (!role) {
        throw this.invalid(
          PracticeErrorReason.CATALOG_CODE_INVALID,
          `Rol de vínculo desconocido: ${roleCode}`,
        );
      }
      const unit = await this.unitsRepo.findById(tx, clinicalUnitId);
      if (!unit || unit.tenantId !== tenantId)
        throw practiceOutOfScope('Unidad no encontrada');
      if (unit.practiceSiteId !== space.practiceSiteId) {
        throw this.invalid(
          PracticeErrorReason.UNIT_SITE_MISMATCH,
          'La unidad es de otro establecimiento',
        );
      }
      if (unit.statusConceptId === PRAC.UNIT_RETIRED) {
        throw this.invalid(
          PracticeErrorReason.UNIT_NOT_AVAILABLE,
          'La unidad está clausurada',
        );
      }

      const open = await this.assignmentsRepo.findOpenBySpaces(tx, [space.id]);
      if (open.some((row) => row.clinicalUnitId === unit.id)) {
        throw new ConflictException(
          'El espacio ya está vinculado a esa unidad',
          { nextAction: 'Cerrar el vínculo actual antes de crear otro' },
          PracticeErrorReason.SPACE_UNIT_ASSIGNMENT_EXISTS,
        );
      }
      if (
        role.id === OWNER.id &&
        open.some((row) => row.roleConceptId === OWNER.id)
      ) {
        throw new ConflictException(
          'El espacio ya tiene una unidad propietaria vigente',
          {
            nextAction: 'Cerrar el vínculo OWNER actual antes de asignar otro',
          },
          PracticeErrorReason.SPACE_UNIT_OWNER_TAKEN,
        );
      }

      const now = new Date();
      const row = this.assignmentsRepo.create(tx, {
        tenantId,
        careSpaceId: space.id,
        clinicalUnitId: unit.id,
        roleConceptId: role.id,
        validFrom: now,
        actorUserId: actor.id,
      });
      if (role.id === OWNER.id) {
        space.clinicalUnitId = unit.id;
        touch(space, actor.id, now);
      }
      await mapReferenceViolation(() => tx.flush());
      if (role.id === OWNER.id)
        await this.recordSpace(tx, space, actor.id, tenantId);
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.assignmentCreated,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          assignmentId: row.id,
          careSpaceId: space.id,
          clinicalUnitId: unit.id,
          role: role.code,
        },
      });
      return toAssignmentView(row);
    });
  }

  /**
   * `DELETE /care-spaces/:id/unit-assignments/:assignmentId`: cierra la vigencia.
   *
   * @param spaceId - Espacio.
   * @param assignmentId - Vínculo.
   * @param actor - Quien desvincula.
   * @param correlationId - Id de correlación.
   * @returns El vínculo ya cerrado.
   */
  async close(
    spaceId: string,
    assignmentId: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SpaceUnitAssignmentView> {
    return this.em.transactional(async (tx) => {
      const { space, tenantId } = await this.context.space(
        tx,
        spaceId,
        actor,
        'write',
      );
      const row = await this.assignmentsRepo.findByIdInTenant(
        tx,
        assignmentId,
        tenantId,
      );
      if (!row || row.careSpaceId !== space.id)
        throw practiceOutOfScope('Vínculo no encontrado');
      if (row.validTo) {
        throw new ConflictException(
          'El vínculo ya está cerrado',
          undefined,
          PracticeErrorReason.SPACE_UNIT_ASSIGNMENT_CLOSED,
        );
      }
      const now = new Date();
      row.validTo = now;
      touch(row, actor.id, now);
      const wasOwner = row.roleConceptId === OWNER.id;
      if (wasOwner && space.clinicalUnitId === row.clinicalUnitId) {
        space.clinicalUnitId = null as unknown as string;
        touch(space, actor.id, now);
      }
      await mapReferenceViolation(() => tx.flush());
      if (wasOwner) await this.recordSpace(tx, space, actor.id, tenantId);
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.assignmentClosed,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          assignmentId: row.id,
          careSpaceId: space.id,
          clinicalUnitId: row.clinicalUnitId,
        },
      });
      return toAssignmentView(row);
    });
  }

  /** El espejo `clinical_unit_id` cambió: una revisión del espacio. */
  private async recordSpace(
    tx: EntityManager,
    space: Parameters<typeof structureSnapshot>[0],
    actorId: string,
    tenantId: string,
  ): Promise<void> {
    await this.historyRepo.append(
      tx,
      STRUCTURE_HISTORY.space,
      (space as { id: string }).id,
      {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(space),
        changedByUserId: actorId,
        tenantId,
      },
    );
  }

  private invalid(
    reason: string,
    message: string,
  ): PreconditionFailedException {
    return new PreconditionFailedException(message, undefined, reason);
  }
}
