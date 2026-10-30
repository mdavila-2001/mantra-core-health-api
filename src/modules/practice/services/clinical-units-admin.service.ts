import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { OutboxService } from '../../messaging/services/outbox.service';
import { PRAC } from '../practice.concepts';
import {
  PracticeErrorReason,
  conflict,
  ruleException,
} from '../practice.error-reasons';
import { PractitionerRoleAssignments, type ClinicalUnits } from '../entities';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  SpaceUnitAssignmentsRepository,
} from '../repositories';
import type {
  ClinicalUnitDetailDto,
  ClinicalUnitNodeDto,
  LifecycleChangeDto,
  UpdateClinicalUnitDto,
} from '../dto';
import {
  judgeParentAllows,
  judgeTransition,
  type LifecycleState,
} from '../domain/structure/lifecycle';
import { judgeNoCycle } from '../domain/structure/structure-rules';
import { blocker, type Blocker } from '../domain/structure/retire-blockers';
import { StructureAccessService } from './structure-access.service';
import { appendStructureRevision } from './structure-history';
import { STRUCTURE_EVENTS, publishStructureEvent } from './structure-events';
import { flushStructure } from './structure-write-errors';
import {
  childrenIndex,
  toAssignment,
  toSpaceNode,
  toUnitNode,
} from './structure-mapper';
import { assertIfMatch, stateOf } from './structure-input';

const UNIT_STATUS: Record<LifecycleState, string> = {
  PLANNED: PRAC.UNIT_PLANNED,
  ACTIVE: PRAC.UNIT_ACTIVE,
  SUSPENDED: PRAC.UNIT_SUSPENDED,
  RETIRED: PRAC.UNIT_RETIRED,
};

/** Vinculaciones de personal que siguen contando (no finalizadas ni rechazadas). */
const LIVE_STAFF = [
  PRAC.ROLE_ASSIGNMENT_ACTIVE,
  PRAC.ROLE_ASSIGNMENT_PENDING,
  PRAC.ROLE_ASSIGNMENT_SUSPENDED,
];

/**
 * Árbol organizativo de una sede (F1, contrato §3): listado, ficha, edición y
 * ciclo de vida de unidades clínicas. El alta sigue en
 * `ClinicalStructureService.createClinicalUnit` (UC-14-04).
 *
 * «Unidad con hijos, espacios o personal activos no se retira»: hijos no
 * retirados, espacios no retirados con la unidad como principal o con un
 * vínculo vigente, y vinculaciones de profesionales vivas en la unidad.
 */
@Injectable()
export class ClinicalUnitsAdminService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: StructureAccessService,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly outbox: OutboxService,
  ) {}

  /** `GET /sites/:siteId/clinical-units`. */
  async list(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ClinicalUnitNodeDto[]> {
    await this.access.requireSite(this.em, siteId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    const units = await this.unitsRepo.findBySite(this.em, siteId);
    return units
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((u) => toUnitNode(u, units));
  }

  /** `GET /clinical-units/:id`. */
  async detail(
    unitId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ClinicalUnitDetailDto> {
    const unit = await this.access.requireUnit(this.em, unitId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    return this.toDetail(this.em, unit);
  }

  /**
   * `PATCH /clinical-units/:id` con `If-Match`. El código sólo cambia
   * mientras la unidad está PLANNED; el padre, sin ciclos y en la misma sede.
   */
  async update(
    unitId: string,
    dto: UpdateClinicalUnitDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ClinicalUnitDetailDto> {
    return this.em.transactional(async (tx) => {
      const { unit, siteUnits } = await this.writable(
        tx,
        unitId,
        tenantId,
        actor,
      );
      if (unit.statusConceptId === PRAC.UNIT_RETIRED) {
        throw ruleException(PracticeErrorReason.SPACE_RETIRED, { unitId });
      }
      assertIfMatch(ifMatch, unit.rowVersion);
      const changes: string[] = [];

      if (dto.code !== undefined && dto.code !== unit.code) {
        if (stateOf(unit) !== 'PLANNED') {
          throw ruleException(PracticeErrorReason.SPACE_IMMUTABLE_FIELD, {
            fields: ['code'],
            status: stateOf(unit),
          });
        }
        if (siteUnits.some((u) => u.id !== unit.id && u.code === dto.code)) {
          throw conflict(
            PracticeErrorReason.UNIT_CODE_TAKEN,
            'Ya existe una unidad con ese código en el sitio',
            { code: dto.code },
          );
        }
        unit.code = dto.code;
        changes.push('code');
      }
      if (dto.parentUnitId !== undefined) {
        const parentId = dto.parentUnitId;
        if (parentId !== null) {
          const parent = siteUnits.find((u) => u.id === parentId);
          if (!parent) {
            throw new ResourceNotFoundException(
              'Unidad clínica no encontrada',
              { parentUnitId: parentId },
            );
          }
          const lifecycle = judgeParentAllows(stateOf(unit)!, stateOf(parent));
          if (!lifecycle.ok)
            throw ruleException(lifecycle.reason, lifecycle.details);
        }
        const cycle = judgeNoCycle(
          unit.id,
          parentId,
          new Map(siteUnits.map((u) => [u.id, u.parentUnitId ?? null])),
        );
        if (!cycle.ok) {
          throw ruleException(PracticeErrorReason.UNIT_CYCLE, cycle.details);
        }
        unit.parentUnitId = parentId ?? undefined;
        changes.push('parentUnitId');
      }
      for (const key of [
        'name',
        'description',
        'responsibleUserId',
        'specialtyConceptId',
      ] as const) {
        if (dto[key] === undefined) continue;
        (unit as unknown as Record<string, unknown>)[key] =
          dto[key] ?? undefined;
        changes.push(key);
      }
      touch(unit, actor.id);
      await flushStructure(tx);
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'unit',
        unit,
        AUD.OPERATION_UPDATE,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.unitUpdated,
        {
          tenantId: unit.tenantId,
          aggregateId: unit.id,
          actorUserId: actor.id,
          payload: {
            siteId: unit.practiceSiteId,
            unitId: unit.id,
            changes,
            rowVersion: unit.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.toDetail(tx, unit);
    });
  }

  /** `POST /clinical-units/:id/lifecycle`, mismo patrón que los espacios. */
  async changeLifecycle(
    unitId: string,
    dto: LifecycleChangeDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ClinicalUnitDetailDto> {
    return this.em.transactional(async (tx) => {
      const { unit, siteUnits } = await this.writable(
        tx,
        unitId,
        tenantId,
        actor,
      );
      assertIfMatch(ifMatch, unit.rowVersion);
      const from = stateOf(unit) ?? 'ACTIVE';
      const verdict = judgeTransition(from, dto.action, dto.reason);
      if (!verdict.ok) throw ruleException(verdict.reason, verdict.details);
      const to = verdict.to!;
      const parent = unit.parentUnitId
        ? siteUnits.find((u) => u.id === unit.parentUnitId)
        : undefined;
      const now = new Date();

      if (to === 'ACTIVE') {
        const allowed = judgeParentAllows(
          'ACTIVE',
          parent ? stateOf(parent) : null,
        );
        if (!allowed.ok) throw ruleException(allowed.reason, allowed.details);
        if (!unit.validFrom) unit.validFrom = now;
      }
      if (to === 'SUSPENDED') {
        const b = blocker(
          'ACTIVE_CHILD_UNITS',
          siteUnits
            .filter(
              (u) =>
                u.parentUnitId === unit.id &&
                u.statusConceptId === PRAC.UNIT_ACTIVE,
            )
            .map((u) => u.id),
        );
        if (b) {
          throw conflict(
            PracticeErrorReason.UNIT_SUSPEND_BLOCKED,
            'La unidad tiene unidades hijas activas',
            { blockers: [b] },
          );
        }
      }
      if (to === 'RETIRED') {
        const blockers = await this.retireBlockers(tx, unit, siteUnits);
        if (blockers.length > 0) {
          throw conflict(
            PracticeErrorReason.UNIT_RETIRE_BLOCKED,
            'La unidad no se puede retirar todavía',
            { blockers },
          );
        }
        unit.validTo = now;
      }
      unit.statusConceptId = UNIT_STATUS[to];
      touch(unit, actor.id, now);
      await flushStructure(tx);
      await this.historyRepo.append(tx, 'clinical_units', unit.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: {
          ...Object.fromEntries(
            Object.entries(unit).filter(
              ([k, v]) => !k.startsWith('__') && typeof v !== 'function',
            ),
          ),
          lifecycleAction: dto.action,
          lifecycleReason: dto.reason ?? null,
        },
        changedByUserId: actor.id,
        tenantId: unit.tenantId,
      });
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.unitLifecycleChanged,
        {
          tenantId: unit.tenantId,
          aggregateId: unit.id,
          actorUserId: actor.id,
          payload: {
            siteId: unit.practiceSiteId,
            unitId: unit.id,
            action: dto.action,
            from,
            to,
            reasonProvided: Boolean(dto.reason?.trim()),
            rowVersion: unit.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.toDetail(tx, unit);
    });
  }

  private async writable(
    tx: EntityManager,
    unitId: string,
    tenantId: string,
    actor: AuthenticatedUser,
  ) {
    const unit = await this.access.requireUnit(tx, unitId, tenantId);
    const site = await this.access.requireSite(
      tx,
      unit.practiceSiteId,
      tenantId,
    );
    await this.access.assertCanWriteSite(tx, site, actor);
    const siteUnits = await this.unitsRepo.findBySite(tx, site.id);
    return { unit, site, siteUnits };
  }

  private async retireBlockers(
    tx: EntityManager,
    unit: ClinicalUnits,
    siteUnits: readonly ClinicalUnits[],
  ): Promise<Blocker[]> {
    const children = siteUnits.filter(
      (u) =>
        u.parentUnitId === unit.id && u.statusConceptId !== PRAC.UNIT_RETIRED,
    );
    const spaces = (
      await this.spacesRepo.findBySite(tx, unit.practiceSiteId)
    ).filter(
      (s) =>
        s.clinicalUnitId === unit.id &&
        s.statusConceptId !== PRAC.SPACE_RETIRED,
    );
    const linked = await this.assignmentsRepo.findCurrentByUnit(tx, unit.id);
    const spaceIds = [
      ...new Set([
        ...spaces.map((s) => s.id),
        ...linked.map((a) => a.careSpaceId),
      ]),
    ];
    const staff = await tx.find(
      PractitionerRoleAssignments,
      { clinicalUnitId: unit.id, statusConceptId: { $in: LIVE_STAFF } },
      { fields: ['id'], limit: 50 },
    );
    return [
      blocker(
        'ACTIVE_CHILD_UNITS',
        children.map((u) => u.id),
      ),
      blocker('ACTIVE_SPACES', spaceIds),
      blocker(
        'ACTIVE_STAFF',
        staff.map((r) => r.id),
      ),
    ].filter((b): b is Blocker => b !== null);
  }

  private async toDetail(
    tx: EntityManager,
    unit: ClinicalUnits,
  ): Promise<ClinicalUnitDetailDto> {
    const siteUnits = await this.unitsRepo.findBySite(tx, unit.practiceSiteId);
    const siteSpaces = await this.spacesRepo.findBySite(
      tx,
      unit.practiceSiteId,
    );
    const assignments = await this.assignmentsRepo.findCurrentByUnit(
      tx,
      unit.id,
    );
    const children = childrenIndex(siteSpaces);
    return {
      ...toUnitNode(unit, siteUnits),
      practiceSiteId: unit.practiceSiteId,
      validFrom: unit.validFrom ?? null,
      validTo: unit.validTo ?? null,
      children: siteUnits
        .filter((u) => u.parentUnitId === unit.id)
        .map((u) => toUnitNode(u, siteUnits)),
      spaces: siteSpaces
        .filter((s) => s.clinicalUnitId === unit.id)
        .map((s) => toSpaceNode(s, children)),
      assignments: assignments.map(toAssignment),
    };
  }
}
