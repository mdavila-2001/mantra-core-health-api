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
import type { ClinicalUnits } from '../entities';
import {
  UNIT_LIFECYCLE,
  UNIT_TRANSITIONS,
  type LifecycleAction,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  ClinicalUnitsRepository,
  SpaceUnitAssignmentsRepository,
} from '../repositories';
import type {
  ClinicalUnitNode,
  RetireBlocker,
  SpaceUnitAssignmentView,
} from '../dto/infrastructure.types';
import { assertRowVersion, withVersionConflict } from '../http/row-version';
import { RETIRE_SAMPLE_SIZE } from './retire-blockers';
import { StructureContextService } from './structure-context.service';
import { mapReferenceViolation } from './structure-errors';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';
import { toAssignmentView, toUnitNode } from './structure-mapper';

/** Ficha de una unidad: nodo, hijos y espacios vinculados. */
export interface ClinicalUnitDetail extends ClinicalUnitNode {
  readonly practiceSiteId: string;
  readonly unitTypeConceptId: string;
  readonly children: ClinicalUnitNode[];
  /** Espacios vinculados vigentes (con el rol de cada vínculo). */
  readonly assignments: SpaceUnitAssignmentView[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Cuerpo de `PATCH /clinical-units/:id`. */
export interface UnitPatch {
  /** Código: sólo mientras la unidad está planificada. */
  code?: string;
  /** Nombre. */
  name?: string;
  /** Descripción. */
  description?: string | null;
  /** Responsable (usuario). */
  responsibleUserId?: string | null;
}

/**
 * Unidades clínicas (árbol organizativo): lectura, edición y ciclo de vida
 * (CONTRATO-F0-F1 §3; `procesos/01` flujo D y `procesos/02`). El alta sigue en
 * `ClinicalStructureService.createClinicalUnit` (UC-14-04).
 */
@Injectable()
export class ClinicalUnitsService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param unitsRepo - Unidades.
   * @param assignmentsRepo - Vínculos con espacios.
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
   * `GET /sites/:siteId/clinical-units`.
   *
   * @param siteId - Establecimiento.
   * @param actor - Quien lee.
   * @returns Las unidades del establecimiento, por código.
   */
  async list(
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<ClinicalUnitNode[]> {
    return this.em.transactional(async (tx) => {
      const { site } = await this.context.site(tx, siteId, actor, 'read');
      const units = await this.unitsRepo.findBySite(tx, site.id);
      return units.sort((a, b) => a.code.localeCompare(b.code)).map(toUnitNode);
    });
  }

  /**
   * `GET /clinical-units/:id`.
   *
   * @param unitId - Unidad.
   * @param actor - Quien lee.
   * @returns La ficha.
   */
  async get(
    unitId: string,
    actor: AuthenticatedUser,
  ): Promise<ClinicalUnitDetail> {
    return this.em.transactional(async (tx) => {
      const { unit } = await this.context.unit(tx, unitId, actor, 'read');
      return this.detail(tx, unit);
    });
  }

  /**
   * `PATCH /clinical-units/:id` con `If-Match`.
   *
   * @param unitId - Unidad.
   * @param patch - Campos a cambiar.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien edita.
   * @param correlationId - Id de correlación.
   * @returns La ficha actualizada.
   */
  async patch(
    unitId: string,
    patch: UnitPatch,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<ClinicalUnitDetail> {
    return this.em.transactional(async (tx) => {
      const { unit, tenantId } = await this.context.unit(
        tx,
        unitId,
        actor,
        'write',
      );
      if (unit.statusConceptId === PRAC.UNIT_RETIRED) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
          'La unidad está clausurada: es de sólo lectura',
        );
      }
      assertRowVersion(unit.rowVersion, expectedVersion);
      const changed: string[] = [];

      const code = patch.code?.trim();
      if (code !== undefined && code !== unit.code) {
        if (unit.statusConceptId !== PRAC.UNIT_PLANNED) {
          throw this.invalid(
            PracticeErrorReason.SPACE_IMMUTABLE_FIELD,
            'El código de una unidad activada no se cambia',
          );
        }
        const clash = (
          await this.unitsRepo.findBySite(tx, unit.practiceSiteId)
        ).find((u) => u.code === code);
        if (clash) {
          throw new ConflictException(
            'Ya existe una unidad con ese código en el sitio',
            { code },
            PracticeErrorReason.SPACE_CODE_TAKEN,
          );
        }
        unit.code = code;
        changed.push('code');
      }
      if (patch.name !== undefined && patch.name.trim() !== unit.name) {
        if (!patch.name.trim())
          throw this.invalid('REQUIRED', 'El nombre no puede quedar vacío');
        unit.name = patch.name.trim();
        changed.push('name');
      }
      if (
        patch.description !== undefined &&
        (patch.description ?? null) !== (unit.description ?? null)
      ) {
        unit.description = (patch.description ?? null) as string;
        changed.push('description');
      }
      if (
        patch.responsibleUserId !== undefined &&
        (patch.responsibleUserId ?? null) !== (unit.responsibleUserId ?? null)
      ) {
        unit.responsibleUserId = (patch.responsibleUserId ?? null) as string;
        changed.push('responsibleUserId');
      }
      if (changed.length === 0) return this.detail(tx, unit);

      touch(unit, actor.id);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.unit, unit.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(unit),
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.unitUpdated,
        aggregateType: 'clinical_unit',
        aggregateId: unit.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          clinicalUnitId: unit.id,
          changedFields: changed,
          rowVersion: unit.rowVersion,
        },
      });
      return this.detail(tx, unit);
    });
  }

  /**
   * `POST /clinical-units/:id/lifecycle` con `If-Match`. La unidad con hijos,
   * espacios o personal activos no se retira (INV-12).
   *
   * @param unitId - Unidad.
   * @param action - `activate`, `suspend`, `reactivate` o `retire`.
   * @param reason - Motivo; obligatorio en `suspend` y `retire`.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien lo cambia.
   * @param correlationId - Id de correlación.
   * @returns La ficha actualizada.
   */
  async lifecycle(
    unitId: string,
    action: LifecycleAction,
    reason: string | undefined,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<ClinicalUnitDetail> {
    return this.em.transactional(async (tx) => {
      const { unit, tenantId } = await this.context.unit(
        tx,
        unitId,
        actor,
        'write',
      );
      // Misma razón que en la clausura de espacios: se bloquea la fila antes de leer el
      // estado y de recolectar los bloqueos (quien cuelga un centro de costo de la
      // unidad la toma `for share`) y se relee la entidad.
      await tx.execute(
        `select id from practice.clinical_units where id = ? and tenant_id = ? for update`,
        [unit.id, tenantId],
      );
      await tx.refresh(unit);
      assertRowVersion(unit.rowVersion, expectedVersion);
      const transition = UNIT_TRANSITIONS[action];
      if (!transition.from.includes(unit.statusConceptId)) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
          `No se puede ${action} una unidad ${UNIT_LIFECYCLE.byConceptId(unit.statusConceptId)?.code ?? 'en ese estado'}`,
        );
      }
      const cleanReason = reason?.trim();
      if (transition.requiresReason && !cleanReason) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_REASON_REQUIRED,
          `${action} exige un motivo`,
        );
      }
      if (
        (action === 'activate' || action === 'reactivate') &&
        unit.parentUnitId
      ) {
        const parent = await this.unitsRepo.findById(tx, unit.parentUnitId);
        if (!parent || parent.statusConceptId !== PRAC.UNIT_ACTIVE) {
          throw this.invalid(
            PracticeErrorReason.PARENT_NOT_ACTIVE,
            'La unidad padre no está activa: activala o reactivala primero',
          );
        }
      }
      if (action === 'retire') {
        const blockers = await this.blockers(tx, unit);
        if (blockers.length > 0) {
          throw new ConflictException(
            'No se puede clausurar la unidad: hay dependencias pendientes',
            { blockers, asOf: new Date().toISOString() },
            PracticeErrorReason.UNIT_RETIRE_BLOCKED,
          );
        }
      }

      const from = unit.statusConceptId;
      const now = new Date();
      unit.statusConceptId = transition.to;
      if (action === 'activate') unit.validFrom = unit.validFrom ?? now;
      if (action === 'retire') unit.validTo = now;
      touch(unit, actor.id, now);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.unit, unit.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: {
          ...structureSnapshot(unit),
          lifecycleAction: action,
          lifecycleReason: cleanReason ?? null,
        },
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.unitLifecycle,
        aggregateType: 'clinical_unit',
        aggregateId: unit.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          clinicalUnitId: unit.id,
          action,
          from: UNIT_LIFECYCLE.byConceptId(from)?.code ?? from,
          to: UNIT_LIFECYCLE.byConceptId(transition.to)?.code ?? transition.to,
          reason: cleanReason ?? null,
          rowVersion: unit.rowVersion,
        },
      });
      return this.detail(tx, unit);
    });
  }

  /** Hijos, espacios y personal que impiden retirar la unidad (INV-12). */
  private async blockers(
    tx: EntityManager,
    unit: ClinicalUnits,
  ): Promise<RetireBlocker[]> {
    const out: RetireBlocker[] = [];
    const push = (kind: string, ids: string[], nextAction: string): void => {
      if (ids.length > 0)
        out.push({
          kind,
          count: ids.length,
          sampleIds: ids.slice(0, RETIRE_SAMPLE_SIZE),
          nextAction,
        });
    };
    const children = await tx.execute<{ id: string }[]>(
      `select id from practice.clinical_units where parent_unit_id = ? and status_concept_id <> ?`,
      [unit.id, PRAC.UNIT_RETIRED],
    );
    push(
      'ACTIVE_CHILDREN',
      children.map((r) => r.id),
      'Clausurar o mover las unidades hijas',
    );
    const spaces = await tx.execute<{ id: string }[]>(
      `select id from practice.care_spaces where clinical_unit_id = ? and status_concept_id <> ?
       union
       select a.care_space_id from practice.space_unit_assignments a
         join practice.care_spaces s on s.id = a.care_space_id
        where a.clinical_unit_id = ? and a.valid_to is null and s.status_concept_id <> ?`,
      [unit.id, PRAC.SPACE_RETIRED, unit.id, PRAC.SPACE_RETIRED],
    );
    push(
      'ACTIVE_UNIT_SPACES',
      spaces.map((r) => r.id),
      'Desvincular o clausurar los espacios de la unidad',
    );
    const staff = await tx.execute<{ id: string }[]>(
      `select id from practice.practitioner_role_assignments
        where clinical_unit_id = ? and status_concept_id = ?
          and (valid_to is null or valid_to >= current_date)`,
      [unit.id, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    push(
      'ACTIVE_UNIT_STAFF',
      staff.map((r) => r.id),
      'Reasignar o finalizar al personal de la unidad',
    );
    return out;
  }

  /** Arma la ficha. */
  private async detail(
    tx: EntityManager,
    unit: ClinicalUnits,
  ): Promise<ClinicalUnitDetail> {
    const [siblings, open] = await Promise.all([
      this.unitsRepo.findBySite(tx, unit.practiceSiteId),
      this.assignmentsRepo.findOpenByUnit(tx, unit.id),
    ]);
    return {
      ...toUnitNode(unit),
      practiceSiteId: unit.practiceSiteId,
      unitTypeConceptId: unit.unitTypeConceptId,
      children: siblings
        .filter((u) => u.parentUnitId === unit.id)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(toUnitNode),
      assignments: open.map(toAssignmentView),
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  }

  private invalid(
    reason: string,
    message: string,
  ): PreconditionFailedException {
    return new PreconditionFailedException(message, undefined, reason);
  }
}
