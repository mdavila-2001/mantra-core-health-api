import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { OutboxService } from '../../../messaging/services/outbox.service';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../../practice/services/care-space-ops.port';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { CleaningOrderObservers } from '../../../practice/services/ops/cleaning-order-observers';
import { translateInfraWriteError } from '../../../practice/services/ops/ops-errors';
import {
  OperatingRoomBlocks,
  OperatingRoomBlockSeries,
  OperatingRoomUtilizationEvents,
  ProcedureCases,
  SurgicalSafetyChecklists,
  SurgicalSafetyItems,
  SurgicalSafetyResponses,
} from '../../entities';
import { PERIOP } from '../../procedures_perioperative.concepts';
import { PRAC } from '../../../practice/practice.concepts';
import { ProceduresPerioperativeErrorReason as R } from '../../procedures_perioperative.error-reasons';
import { PeriopCasesRepository } from '../../repositories';
import { loadCaseForUpdateInScope, loadCaseInScope } from '../periop-scope';
import { assertChecklistPhase, type ChecklistGate } from './checklist-gates';
import {
  WHO_CHECKLIST_ITEMS,
  WHO_CHECKLIST_VERSION,
} from './who-checklist-2009';

/** Petición de quirófano. */
export interface OrRequest {
  readonly actor: AuthenticatedUser;
  readonly tenantId: string;
  readonly requestId?: string;
}

const PHASE: Record<ChecklistGate, string> = {
  SIGN_IN: CONCEPTS.PHASE_SIGN_IN,
  TIME_OUT: CONCEPTS.PHASE_TIME_OUT,
  SIGN_OUT: CONCEPTS.PHASE_SIGN_OUT,
};

/** Orden obligatorio de los eventos de sala y la fase OMS que exige cada uno. */
export const ROOM_EVENT_ORDER = [
  'PATIENT_IN_ROOM',
  'ANESTHESIA_START',
  'INCISION',
  'CLOSURE',
  'PATIENT_OUT_OF_ROOM',
] as const;
export type RoomEventCode = (typeof ROOM_EVENT_ORDER)[number];
const EVENT_CONCEPT: Record<RoomEventCode, string> = {
  PATIENT_IN_ROOM: PERIOP.OR_EVENT_PATIENT_IN_ROOM,
  ANESTHESIA_START: PERIOP.OR_EVENT_ANESTHESIA_START,
  INCISION: PERIOP.OR_EVENT_INCISION,
  CLOSURE: PERIOP.OR_EVENT_CLOSURE,
  PATIENT_OUT_OF_ROOM: PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
};
const EVENT_GATE: Partial<Record<RoomEventCode, ChecklistGate>> = {
  ANESTHESIA_START: 'SIGN_IN',
  INCISION: 'TIME_OUT',
  PATIENT_OUT_OF_ROOM: 'SIGN_OUT',
};
const EVENT_MILESTONE: Partial<Record<RoomEventCode, string>> = {
  PATIENT_IN_ROOM: PERIOP.MILESTONE_PATIENT_IN_ROOM,
  INCISION: PERIOP.MILESTONE_INCISION,
  PATIENT_OUT_OF_ROOM: PERIOP.MILESTONE_PATIENT_OUT_OF_ROOM,
};

/**
 * Juicio puro del orden de los eventos de sala (§F4.3): 409 si ya está, 422 si
 * falta el anterior.
 *
 * @param recorded - Códigos ya registrados.
 * @param next - Código pedido.
 */
export function judgeRoomEvent(
  recorded: readonly RoomEventCode[],
  next: RoomEventCode,
):
  | { ok: true }
  | { ok: false; reason: string; details: Record<string, unknown> } {
  if (recorded.includes(next))
    return {
      ok: false,
      reason: R.ROOM_EVENT_ALREADY_RECORDED,
      details: { eventCode: next },
    };
  const idx = ROOM_EVENT_ORDER.indexOf(next);
  const missing = ROOM_EVENT_ORDER.slice(0, idx).filter(
    (e) => !recorded.includes(e),
  );
  return missing.length > 0
    ? {
        ok: false,
        reason: R.ROOM_EVENT_OUT_OF_ORDER,
        details: { eventCode: next, missing },
      }
    : { ok: true };
}

async function publish(
  outbox: OutboxService,
  tx: EntityManager,
  eventType: string,
  tenantId: string,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  actorUserId?: string,
): Promise<void> {
  try {
    await outbox.publishDomainEvent(tx, {
      tenantId,
      eventType,
      aggregateType,
      aggregateId,
      payloadJson: payload,
      actorUserId,
    });
  } catch (error) {
    throw translateInfraWriteError(error);
  }
}

/**
 * Check-list OMS del caso (§F4.3): crea (idempotente) y lee por fases. Hasta
 * F4 nada llamaba a `createChecklist`; los ítems OMS 2009 se siembran acá si
 * el catálogo no los trae.
 */
@Injectable()
export class SafetyChecklistUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * `POST /procedure-cases/:id/safety-checklists`.
   *
   * @param caseId - Caso.
   * @param req - Actor y tenant.
   * @returns El check-list y si se creó ahora.
   */
  create(
    caseId: string,
    req: OrRequest,
  ): Promise<{ created: boolean; checklist: Record<string, unknown> }> {
    return this.em.transactional(async (tx) => {
      const surgicalCase = await loadCaseForUpdateInScope(
        this.casesRepo,
        tx,
        caseId,
      );
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new ConflictException(
          'El caso está cancelado',
          { caseId },
          R.CASE_CANCELLED,
        );
      }
      const existing = await this.casesRepo.findSafetyChecklistByCase(
        tx,
        caseId,
        CONCEPTS.CHECKLIST_WHO,
      );
      if (existing)
        return { created: false, checklist: await this.view(tx, existing) };
      await this.seedItems(tx, req.actor.id);
      const now = new Date();
      const checklist = tx.create(
        SurgicalSafetyChecklists,
        {
          procedureCaseId: caseId,
          checklistTypeConceptId: CONCEPTS.CHECKLIST_WHO,
          checklistVersion: WHO_CHECKLIST_VERSION,
          statusConceptId: CONCEPTS.CHECKLIST_IN_PROGRESS,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      await tx.flush();
      await publish(
        this.outbox,
        tx,
        'periop.checklist.created',
        surgicalCase.custodianTenantId,
        'procedures_perioperative.surgical_safety_checklists',
        checklist.id,
        {
          checklistId: checklist.id,
          caseId,
          version: WHO_CHECKLIST_VERSION,
        },
        req.actor.id,
      );
      return { created: true, checklist: await this.view(tx, checklist) };
    });
  }

  /**
   * `GET /procedure-cases/:id/safety-checklists/:checklistId`.
   *
   * @param caseId - Caso.
   * @param checklistId - Check-list.
   */
  async get(
    caseId: string,
    checklistId: string,
  ): Promise<Record<string, unknown>> {
    const em = this.em.fork();
    await loadCaseInScope(this.casesRepo, em, caseId);
    const checklist = await em.findOne(SurgicalSafetyChecklists, {
      id: checklistId,
    });
    if (!checklist || checklist.procedureCaseId !== caseId) {
      throw new ResourceNotFoundException('Check-list no encontrado', {
        checklistId,
      });
    }
    return this.view(em, checklist);
  }

  private async seedItems(
    tx: EntityManager,
    actorUserId: string,
  ): Promise<void> {
    const present = await tx.find(SurgicalSafetyItems, {
      checklistTypeConceptId: CONCEPTS.CHECKLIST_WHO,
      checklistVersion: WHO_CHECKLIST_VERSION,
    });
    const have = new Set(present.map((i) => i.itemCode));
    const now = new Date();
    WHO_CHECKLIST_ITEMS.forEach((item, idx) => {
      if (have.has(item.code)) return;
      tx.create(
        SurgicalSafetyItems,
        {
          checklistTypeConceptId: CONCEPTS.CHECKLIST_WHO,
          checklistVersion: WHO_CHECKLIST_VERSION,
          phaseConceptId: PHASE[item.phase],
          itemCode: item.code,
          promptText: item.prompt,
          responseTypeConceptId: PERIOP.SSC_RESPONSE_CHECK,
          displayOrder: idx + 1,
          isMandatory: true,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
        { partial: true },
      );
    });
    await tx.flush();
  }

  private async view(
    em: EntityManager,
    c: SurgicalSafetyChecklists,
  ): Promise<Record<string, unknown>> {
    const items = await em.find(
      SurgicalSafetyItems,
      {
        checklistTypeConceptId: c.checklistTypeConceptId,
        checklistVersion: c.checklistVersion,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { orderBy: { displayOrder: 'asc' } },
    );
    const responses = await em.find(SurgicalSafetyResponses, {
      surgicalSafetyChecklistId: c.id,
    });
    const completed: Record<ChecklistGate, Date | undefined> = {
      SIGN_IN: c.signInCompletedAt,
      TIME_OUT: c.timeOutCompletedAt,
      SIGN_OUT: c.signOutCompletedAt,
    };
    return {
      id: c.id,
      version: c.checklistVersion,
      phases: (['SIGN_IN', 'TIME_OUT', 'SIGN_OUT'] as const).map((phase) => ({
        phase,
        completedAt: completed[phase]?.toISOString() ?? null,
        items: items
          .filter((i) => i.phaseConceptId === PHASE[phase])
          .map((i) => {
            const r = responses.find((x) => x.surgicalSafetyItemId === i.id);
            return {
              id: i.id,
              code: i.itemCode,
              prompt: i.promptText,
              mandatory: i.isMandatory,
              response: r
                ? {
                    status: r.responseStatusConceptId,
                    respondedAt: r.respondedAt.toISOString(),
                  }
                : null,
            };
          }),
      })),
    };
  }
}

/**
 * `POST /procedure-cases/:id/room-events` (§F4.3): orden obligatorio
 * IN_ROOM → ANESTHESIA_START → INCISION → CLOSURE → OUT_OF_ROOM, con las
 * fases OMS bloqueantes; `PATIENT_OUT_OF_ROOM` deja la sala sucia con orden
 * `OR_TURNOVER` en la cola de F2.
 */
@Injectable()
export class RecordRoomEventUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly outbox: OutboxService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /**
   * @param caseId - Caso.
   * @param eventCode - Evento.
   * @param occurredAt - Momento (por defecto, ahora).
   * @param req - Actor, tenant, requestId.
   */
  execute(
    caseId: string,
    eventCode: RoomEventCode,
    occurredAt: Date | undefined,
    req: OrRequest,
  ) {
    return this.em.transactional(async (tx) => {
      const surgicalCase = await loadCaseForUpdateInScope(
        this.casesRepo,
        tx,
        caseId,
      );
      if (!surgicalCase.operatingRoomId) {
        throw new PreconditionFailedException(
          'El caso no tiene quirófano',
          { caseId },
          R.OPERATING_ROOM_NOT_AVAILABLE,
        );
      }
      const now = new Date();
      const at = occurredAt ?? now;
      if (at.getTime() > now.getTime() + 60_000) {
        throw new PreconditionFailedException(
          'La fecha no puede ser futura',
          {},
          R.OCCURRED_AT_IN_FUTURE,
        );
      }
      const recorded = await tx.find(OperatingRoomUtilizationEvents, {
        procedureCaseId: caseId,
        eventTypeConceptId: { $in: Object.values(EVENT_CONCEPT) },
      });
      const codes = recorded
        .map((e) =>
          ROOM_EVENT_ORDER.find(
            (c) => EVENT_CONCEPT[c] === e.eventTypeConceptId,
          ),
        )
        .filter((c): c is RoomEventCode => !!c);
      const verdict = judgeRoomEvent(codes, eventCode);
      if (!verdict.ok) {
        throw verdict.reason === (R.ROOM_EVENT_ALREADY_RECORDED as string)
          ? new ConflictException(
              'El evento ya se registró',
              verdict.details,
              verdict.reason,
            )
          : new PreconditionFailedException(
              'Falta el evento anterior',
              verdict.details,
              verdict.reason,
            );
      }
      const gate = EVENT_GATE[eventCode];
      if (gate) await assertChecklistPhase(this.casesRepo, tx, caseId, gate);
      const event = tx.create(
        OperatingRoomUtilizationEvents,
        {
          tenantId: surgicalCase.custodianTenantId,
          operatingRoomId: surgicalCase.operatingRoomId,
          procedureCaseId: caseId,
          eventTypeConceptId: EVENT_CONCEPT[eventCode],
          occurredAt: at,
          recordedByUserId: req.actor.id,
          operatingRoomBlockId: surgicalCase.operatingRoomBlockId,
          createdAt: now,
        },
        { partial: true },
      );
      let milestoneId: string | null = null;
      const milestoneType = EVENT_MILESTONE[eventCode];
      if (milestoneType) {
        milestoneId = this.casesRepo.createMilestone(tx, {
          procedureCaseId: caseId,
          milestoneTypeConceptId: milestoneType,
          occurredAt: at,
          statusConceptId: CONCEPTS.MILESTONE_REACHED,
        }).id;
      }
      if (eventCode === 'ANESTHESIA_START' && !surgicalCase.actualStartAt)
        surgicalCase.actualStartAt = at;
      if (eventCode === 'PATIENT_OUT_OF_ROOM') surgicalCase.actualEndAt ??= at;
      await tx.flush();
      let cleaningOrderId: string | null = null;
      if (eventCode === 'PATIENT_OUT_OF_ROOM') {
        cleaningOrderId = (
          await this.ops.markDirtyFromSource(tx, surgicalCase.operatingRoomId, {
            trigger: 'CLN_TRG_OR_TURNOVER',
            sourceRefId: caseId,
            terminal: false,
            actor: req.actor,
            requestId: req.requestId,
          })
        ).cleaningOrderId;
      }
      await publish(
        this.outbox,
        tx,
        'periop.case.room_event_recorded',
        surgicalCase.custodianTenantId,
        'procedures_perioperative.procedure_cases',
        caseId,
        {
          caseId,
          eventCode,
          occurredAt: at.toISOString(),
          utilizationEventId: event.id,
          cleaningOrderId,
          requestId: req.requestId ?? null,
        },
        req.actor.id,
      );
      return { utilizationEventId: event.id, milestoneId, cleaningOrderId };
    });
  }
}

/**
 * Recambio de quirófano con datos reales (§F4.3): las transiciones de la
 * orden `OR_TURNOVER` de F2 escriben `OR_EVENT_CLEANUP_START`/`CLEANUP_END` y
 * la inspección (o la terminación) `OR_EVENT_ROOM_READY`, en la misma
 * transacción de la orden.
 */
@Injectable()
export class OrTurnoverObserver implements OnModuleInit {
  constructor(private readonly observers: CleaningOrderObservers) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.observers.register(async (tx, notice) => {
      if (notice.cleaningType !== 'CLEAN_OR_TURNOVER') return;
      const types: string[] = [];
      if (notice.eventType === 'practice.cleaning_order.started')
        types.push(PERIOP.OR_EVENT_CLEANUP_START);
      if (notice.eventType === 'practice.cleaning_order.finished')
        types.push(PERIOP.OR_EVENT_CLEANUP_END);
      if (notice.eventType === 'practice.cleaning_order.inspected')
        types.push(PERIOP.OR_EVENT_ROOM_READY);
      const now = new Date();
      for (const eventTypeConceptId of types) {
        tx.create(
          OperatingRoomUtilizationEvents,
          {
            tenantId: notice.order.tenantId,
            operatingRoomId: notice.order.careSpaceId,
            procedureCaseId: notice.order.sourceRefId ?? undefined,
            eventTypeConceptId,
            occurredAt: now,
            recordedByUserId: notice.actorUserId,
            detailsJson: { cleaningOrderId: notice.order.id },
            createdAt: now,
          },
          { partial: true },
        );
      }
      if (types.length) await tx.flush();
    });
  }
}

/** Cuerpo de alta de bloques. */
export interface CreateOrBlocksInput {
  operatingRoomId: string;
  ownerKind: 'SERVICE' | 'SURGEON';
  clinicalUnitId?: string;
  specialtyConceptId?: string;
  surgeonProfileId?: string;
  startsAt: Date;
  endsAt: Date;
  releaseHours?: number;
  recurrence?: { weekdays: number[]; until: string };
}

/**
 * Bloques de quirófano (§F4.3): alta (con serie semanal, máx. 400
 * instancias), liberación, cancelación, tick de liberación automática y
 * lecturas. Sólo Jefe QX sobre quirófanos (`f4.or-block.manage`).
 */
@Injectable()
export class OrBlocksUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly outbox: OutboxService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /**
   * `POST /sites/:siteId/or-blocks`.
   *
   * @param siteId - Sede.
   * @param input - Bloque o serie.
   * @param req - Actor, tenant, requestId.
   */
  create(siteId: string, input: CreateOrBlocksInput, req: OrRequest) {
    return this.em.transactional(async (tx) => {
      const { target } = await this.access.assertCan(
        req.actor,
        'f4.or-block.manage',
        { careSpaceId: input.operatingRoomId },
        tx,
        req.tenantId,
      );
      if (target.site.id !== siteId || !target.isOperatingRoom) {
        throw new PreconditionFailedException(
          'El espacio no es un quirófano de la sede',
          {},
          R.OR_BLOCK_INVALID_ROOM,
        );
      }
      if (input.clinicalUnitId) {
        // La unidad dueña la manda el cliente: de la misma sede y tenant, o 404.
        const [unit] = await tx.execute<{ id: string }[]>(
          'SELECT id FROM practice.clinical_units WHERE id = ? AND practice_site_id = ? AND tenant_id = ?',
          [input.clinicalUnitId, siteId, req.tenantId],
          'all',
        );
        if (!unit)
          throw new ResourceNotFoundException('Unidad clínica no encontrada', {
            unitId: input.clinicalUnitId,
          });
      }
      const owner =
        input.ownerKind === 'SERVICE'
          ? PERIOP.ORB_OWNER_SERVICE
          : PERIOP.ORB_OWNER_SURGEON;
      if (
        (input.ownerKind === 'SERVICE' &&
          !input.clinicalUnitId &&
          !input.specialtyConceptId) ||
        (input.ownerKind === 'SURGEON' && !input.surgeonProfileId)
      ) {
        throw new PreconditionFailedException(
          'El bloque necesita dueño',
          {},
          R.OR_BLOCK_OWNER_REQUIRED,
        );
      }
      if (input.startsAt.getTime() < Date.now()) {
        throw new PreconditionFailedException(
          'El bloque no puede empezar en el pasado',
          {},
          R.OR_BLOCK_IN_PAST,
        );
      }
      const releaseHours = input.releaseHours ?? 72;
      const durationMs = input.endsAt.getTime() - input.startsAt.getTime();
      const starts: Date[] = [input.startsAt];
      let seriesId: string | undefined;
      const now = new Date();
      if (
        input.endsAt.getTime() <= input.startsAt.getTime() ||
        durationMs > 24 * 3_600_000
      ) {
        throw new PreconditionFailedException(
          'El bloque debe terminar después de empezar y durar como mucho 24 h',
          {},
          R.OR_BLOCK_INVALID_ROOM,
        );
      }
      if (input.recurrence) {
        const until = new Date(`${input.recurrence.until}T23:59:59Z`);
        const horizon = input.startsAt.getTime() + 366 * 86_400_000;
        const weekdays = input.recurrence.weekdays;
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(input.recurrence.until) ||
          Number.isNaN(until.getTime()) ||
          until.getTime() < input.startsAt.getTime() ||
          until.getTime() > horizon ||
          weekdays.length === 0 ||
          new Set(weekdays).size !== weekdays.length ||
          weekdays.some((w) => !Number.isInteger(w) || w < 1 || w > 7)
        ) {
          throw new PreconditionFailedException(
            'La serie necesita días ISO 1–7 sin repetir y un fin dentro del año siguiente',
            {},
            R.OR_BLOCK_OWNER_REQUIRED,
          );
        }
        starts.length = 0;
        let iterations = 0;
        for (
          let d = new Date(input.startsAt);
          d <= until && iterations < 366 && starts.length <= 400;
          d = new Date(d.getTime() + 86_400_000), iterations += 1
        ) {
          const iso = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
          if (weekdays.includes(iso)) starts.push(new Date(d));
        }
        if (starts.length > 400)
          throw new PreconditionFailedException(
            'Máximo 400 instancias',
            {},
            R.OR_BLOCK_OWNER_REQUIRED,
          );
        const series = tx.create(
          OperatingRoomBlockSeries,
          {
            tenantId: req.tenantId,
            practiceSiteId: siteId,
            operatingRoomId: input.operatingRoomId,
            ownerKindConceptId: owner,
            clinicalUnitId: input.clinicalUnitId,
            surgicalSpecialtyConceptId: input.specialtyConceptId,
            surgeonProfileId: input.surgeonProfileId,
            weekdays: input.recurrence.weekdays,
            startTime: input.startsAt.toISOString().slice(11, 19),
            endTime: input.endsAt.toISOString().slice(11, 19),
            validFrom: input.startsAt.toISOString().slice(0, 10),
            validTo: input.recurrence.until,
            releaseHours,
            statusConceptId: PERIOP.ORB_ACTIVE,
            createdAt: now,
            updatedAt: now,
            createdByUserId: req.actor.id,
            updatedByUserId: req.actor.id,
          } as never,
          { partial: true },
        );
        seriesId = series.id;
      }
      const blocks: OperatingRoomBlocks[] = [];
      for (const s of starts) {
        await this.ops
          .assertBookable(tx, input.operatingRoomId, {
            start: s,
            end: new Date(s.getTime() + durationMs),
          })
          .catch((e: { reason?: string }) => {
            if (e.reason === 'SPACE_NOT_BOOKABLE')
              throw new PreconditionFailedException(
                'El quirófano no está disponible',
                {},
                R.OR_BLOCK_INVALID_ROOM,
              );
            throw e;
          });
        blocks.push(
          tx.create(
            OperatingRoomBlocks,
            {
              tenantId: req.tenantId,
              seriesId,
              operatingRoomId: input.operatingRoomId,
              ownerKindConceptId: owner,
              clinicalUnitId: input.clinicalUnitId,
              surgicalSpecialtyConceptId: input.specialtyConceptId,
              surgeonProfileId: input.surgeonProfileId,
              startsAt: s,
              endsAt: new Date(s.getTime() + durationMs),
              releaseAt: new Date(s.getTime() - releaseHours * 3_600_000),
              statusConceptId: PERIOP.ORB_ACTIVE,
              createdAt: now,
              updatedAt: now,
              createdByUserId: req.actor.id,
              updatedByUserId: req.actor.id,
            },
            { partial: true },
          ),
        );
      }
      try {
        await tx.flush();
      } catch (error) {
        throw translateInfraWriteError(error);
      }
      for (const b of blocks) {
        await publish(
          this.outbox,
          tx,
          'periop.or_block.created',
          req.tenantId,
          'procedures_perioperative.operating_room_blocks',
          b.id,
          {
            blockId: b.id,
            seriesId: seriesId ?? null,
            operatingRoomId: b.operatingRoomId,
            startsAt: b.startsAt.toISOString(),
          },
          req.actor.id,
        );
      }
      return { seriesId: seriesId ?? null, blocks: blocks.map(blockView) };
    });
  }

  /**
   * `POST /or-blocks/:id/release` y `/cancel`.
   *
   * @param blockId - Bloque.
   * @param action - Liberar o cancelar.
   * @param reasonText - Motivo.
   * @param req - Actor, tenant, requestId (`null` = tick automático).
   */
  close(
    blockId: string,
    action: 'release' | 'cancel',
    reasonText: string | undefined,
    req: OrRequest,
  ) {
    return this.em.transactional(async (tx) => {
      const block = await tx.findOne(OperatingRoomBlocks, { id: blockId });
      if (!block || block.tenantId !== req.tenantId)
        throw new ResourceNotFoundException('Bloque no encontrado', {
          blockId,
        });
      await this.access.assertCan(
        req.actor,
        'f4.or-block.manage',
        { careSpaceId: block.operatingRoomId },
        tx,
        req.tenantId,
      );
      return this.closeInTx(tx, block, action, reasonText, req.actor.id);
    });
  }

  /** `POST /internal/periop/or-blocks-release-tick` (SYSTEM): libera los vencidos sin casos. */
  tick(): Promise<{ released: number }> {
    return this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      const due = await tx.find(OperatingRoomBlocks, {
        statusConceptId: PERIOP.ORB_ACTIVE,
        releaseAt: { $lte: new Date() },
      });
      let released = 0;
      for (const b of due) {
        const cases = await tx.count(ProcedureCases, {
          operatingRoomBlockId: b.id,
          statusConceptId: { $ne: CONCEPTS.CASE_CANCELLED },
        });
        if (cases > 0) continue;
        await this.closeInTx(
          tx,
          b,
          'release',
          'Liberación automática',
          undefined,
        );
        released += 1;
      }
      return { released };
    });
  }

  /**
   * `GET /sites/:siteId/or-blocks?from&to&operatingRoomId`.
   *
   * @param siteId - Sede.
   * @param q - Rango y sala.
   * @param req - Actor y tenant.
   */
  async list(
    siteId: string,
    q: { from?: string; to?: string; operatingRoomId?: string },
    req: OrRequest,
  ) {
    const em = this.em.fork();
    const filter = await this.access.scopeFilter(
      req.actor,
      'f4.or.read',
      siteId,
      em,
      req.tenantId,
    );
    const rooms = (
      await em.execute<{ id: string }[]>(
        'SELECT id FROM practice.care_spaces WHERE practice_site_id = ? AND space_type_concept_id = ?',
        [siteId, PRAC.SPACE_FN_OPERATING_ROOM],
        'all',
      )
    )
      .map((r) => r.id)
      .filter((id) => filter.allowsSpace(id));
    // La sala que pide el cliente tiene que ser un quirófano de la sede y
    // estar en el alcance; si no, 404 (revisión de seguridad F4).
    if (q.operatingRoomId && !rooms.includes(q.operatingRoomId)) {
      throw new ResourceNotFoundException('Quirófano no encontrado', {
        operatingRoomId: q.operatingRoomId,
      });
    }
    const from = parseInstant(q.from, 'from');
    const to = parseInstant(q.to, 'to');
    const blocks = await em.find(
      OperatingRoomBlocks,
      {
        tenantId: req.tenantId,
        operatingRoomId: {
          $in: q.operatingRoomId ? [q.operatingRoomId] : rooms,
        },
        ...(from ? { endsAt: { $gte: from } } : {}),
        ...(to ? { startsAt: { $lte: to } } : {}),
      },
      { orderBy: { startsAt: 'asc' }, limit: 1000 },
    );
    const cases = blocks.length
      ? await em.find(ProcedureCases, {
          operatingRoomBlockId: { $in: blocks.map((b) => b.id) },
          statusConceptId: { $ne: CONCEPTS.CASE_CANCELLED },
        })
      : [];
    return blocks.map((b) => {
      const linked = cases.filter((c) => c.operatingRoomBlockId === b.id);
      const used = linked.reduce(
        (a, c) =>
          a +
          ((c.scheduledEndAt?.getTime() ?? 0) -
            (c.scheduledStartAt?.getTime() ?? 0)) /
            60_000,
        0,
      );
      return {
        ...blockView(b),
        usedMinutes: used,
        cases: linked.map((c) => c.id),
      };
    });
  }

  private async closeInTx(
    tx: EntityManager,
    block: OperatingRoomBlocks,
    action: 'release' | 'cancel',
    reasonText: string | undefined,
    actorId: string | undefined,
  ) {
    if (block.statusConceptId !== PERIOP.ORB_ACTIVE)
      throw new ConflictException(
        'El bloque no está activo',
        {},
        R.OR_BLOCK_NOT_ACTIVE,
      );
    const cases = await tx.find(ProcedureCases, {
      operatingRoomBlockId: block.id,
      statusConceptId: { $ne: CONCEPTS.CASE_CANCELLED },
    });
    if (cases.length > 0) {
      throw new PreconditionFailedException(
        'El bloque tiene casos ligados: reubicarlos primero',
        { caseIds: cases.map((c) => c.id) },
        R.OR_BLOCK_HAS_CASES,
      );
    }
    const now = new Date();
    block.statusConceptId =
      action === 'release' ? PERIOP.ORB_RELEASED : PERIOP.ORB_CANCELLED;
    block.releasedAt = now;
    block.releasedByUserId = actorId;
    block.releaseReason = reasonText;
    block.releasedMinutes = Math.max(
      0,
      Math.round(
        (block.endsAt.getTime() -
          Math.max(now.getTime(), block.startsAt.getTime())) /
          60_000,
      ),
    );
    block.updatedAt = now;
    block.updatedByUserId = actorId;
    try {
      await tx.flush();
    } catch (error) {
      throw translateInfraWriteError(error);
    }
    await publish(
      this.outbox,
      tx,
      action === 'release'
        ? 'periop.or_block.released'
        : 'periop.or_block.cancelled',
      block.tenantId,
      'procedures_perioperative.operating_room_blocks',
      block.id,
      {
        blockId: block.id,
        automatic: !actorId,
        releasedMinutes: block.releasedMinutes,
      },
      actorId,
    );
    return blockView(block);
  }
}

/** Vista de un bloque. */
export function blockView(b: OperatingRoomBlocks): Record<string, unknown> {
  return {
    id: b.id,
    seriesId: b.seriesId ?? null,
    operatingRoomId: b.operatingRoomId,
    owner: {
      kind:
        b.ownerKindConceptId === PERIOP.ORB_OWNER_SERVICE
          ? 'SERVICE'
          : 'SURGEON',
      clinicalUnitId: b.clinicalUnitId ?? null,
      specialtyConceptId: b.surgicalSpecialtyConceptId ?? null,
      surgeonProfileId: b.surgeonProfileId ?? null,
    },
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    releaseAt: b.releaseAt.toISOString(),
    status:
      b.statusConceptId === PERIOP.ORB_ACTIVE
        ? 'ORB_ACTIVE'
        : b.statusConceptId === PERIOP.ORB_RELEASED
          ? 'ORB_RELEASED'
          : 'ORB_CANCELLED',
    releasedAt: b.releasedAt?.toISOString() ?? null,
    releasedByUserId: b.releasedByUserId ?? null,
    releaseReason: b.releaseReason ?? null,
    releasedMinutes: b.releasedMinutes ?? null,
    rowVersion: b.rowVersion,
  };
}

/**
 * Instante de un parámetro de consulta, o 422 si no es una fecha.
 *
 * @param value - Texto ISO.
 * @param name - Parámetro.
 */
function parseInstant(
  value: string | undefined,
  name: string,
): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (value.length > 40 || Number.isNaN(d.getTime())) {
    throw new PreconditionFailedException(
      'Fecha inválida',
      { [name]: value },
      R.INDICATOR_RANGE_TOO_LONG,
    );
  }
  return d;
}
