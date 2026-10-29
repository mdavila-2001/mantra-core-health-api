import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services/outbox.service';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../practice/services/care-space-ops.port';
import type { OmsPhase } from '../domain/oms-checklist';
import { OperatingRoomUtilizationEvents } from '../entities';
import { PeriopCasesRepository } from '../repositories';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import type { RecordRoomEventDto, RoomEventCode } from '../dto';
import { PeriopChecklistGateService } from './periop-checklist-gate.service';
import { loadCaseForUpdateInScope } from './periop-scope';

/** Evento que publica el registro de un hecho de sala (`asyncapi/asyncapi.yaml`). */
export const ROOM_EVENT_RECORDED = 'periop.case.room_event_recorded';

/** Orden obligatorio de los hechos de un caso en sala. */
export const ROOM_EVENT_SEQUENCE: readonly RoomEventCode[] = [
  'PATIENT_IN_ROOM',
  'ANESTHESIA_START',
  'INCISION',
  'CLOSURE',
  'PATIENT_OUT_OF_ROOM',
];

/** Concepto del evento de sala de cada hecho. */
const EVENT_CONCEPT: Readonly<Record<RoomEventCode, string>> = {
  PATIENT_IN_ROOM: PERIOP.OR_EVENT_PATIENT_IN_ROOM,
  ANESTHESIA_START: PERIOP.OR_EVENT_ANESTHESIA_START,
  INCISION: PERIOP.OR_EVENT_INCISION,
  CLOSURE: PERIOP.OR_EVENT_CLOSURE,
  PATIENT_OUT_OF_ROOM: PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
};

/** Hito que deja cada hecho; el cierre no tiene hito propio. */
const EVENT_MILESTONE: Readonly<Partial<Record<RoomEventCode, string>>> = {
  PATIENT_IN_ROOM: PERIOP.MILESTONE_PATIENT_IN_ROOM,
  ANESTHESIA_START: CONCEPTS.MILESTONE_ANESTHESIA_START,
  INCISION: PERIOP.MILESTONE_INCISION,
  PATIENT_OUT_OF_ROOM: PERIOP.MILESTONE_PATIENT_OUT_OF_ROOM,
};

/** Fase del check-list que exige cada hecho. */
const EVENT_GATE: Readonly<Partial<Record<RoomEventCode, OmsPhase>>> = {
  ANESTHESIA_START: 'SIGN_IN',
  INCISION: 'TIME_OUT',
  PATIENT_OUT_OF_ROOM: 'SIGN_OUT',
};

/** Estados del caso en los que todavía se registran hechos de sala. */
const ACTIVE_FOR_ROOM_EVENTS: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
  CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
];

/** Respuesta de registrar un hecho de sala. */
export interface RoomEventResult {
  utilizationEventId: string;
  milestoneId: string | null;
  cleaningOrderId: string | null;
}

/**
 * Hechos del caso en sala (`POST /procedure-cases/:id/room-events`): entrada del paciente,
 * inicio de anestesia, incisión, cierre y salida, en ese orden. Cada uno deja su evento en
 * `operating_room_utilization_events` (la materia prima de la utilización y del recambio), su
 * hito cuando corresponde y un evento en el outbox. Algunos exigen una fase del check-list OMS
 * (INV-39) y la salida del paciente ensucia el quirófano a través del puerto de F2.
 */
@Injectable()
export class PeriopRoomEventsService {
  /**
   * @param em - Contexto de persistencia.
   * @param casesRepo - Casos, hitos y eventos de sala.
   * @param gate - Compuerta del check-list OMS.
   * @param careSpaceOps - Puerto de operación de espacios (F2).
   * @param outbox - Outbox transaccional.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly gate: PeriopChecklistGateService,
    @Inject(CARE_SPACE_OPS_PORT)
    private readonly careSpaceOps: CareSpaceOpsPort,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PeriopRoomEventsService.name);
  }

  /**
   * Registra un hecho de sala.
   *
   * @param caseId - Caso de la ruta.
   * @param dto - Hecho y su instante.
   * @param actor - Quien lo registra.
   * @param correlationId - Id de correlación de la petición.
   * @param now - Ahora (inyectable en pruebas).
   */
  async record(
    caseId: string,
    dto: RecordRoomEventDto,
    actor: AuthenticatedUser,
    correlationId?: string,
    now: Date = new Date(),
  ): Promise<RoomEventResult> {
    this.logger.info(
      { operation: 'periop.case.room_event', caseId, eventCode: dto.eventCode },
      'Recording room event',
    );
    const occurredAt = new Date(dto.occurredAt);
    if (occurredAt.getTime() > now.getTime()) {
      throw new PreconditionFailedException(
        'El hecho no puede estar en el futuro',
        { occurredAt: dto.occurredAt },
        Reason.OCCURRED_AT_IN_FUTURE,
      );
    }

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
          Reason.CASE_WITHOUT_OPERATING_ROOM,
        );
      }
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new ConflictException(
          'El caso está cancelado',
          { caseId },
          Reason.CASE_CANCELLED,
        );
      }
      if (!ACTIVE_FOR_ROOM_EVENTS.includes(surgicalCase.statusConceptId)) {
        throw new PreconditionFailedException(
          'El caso ya terminó: no admite hechos de sala',
          { caseId, statusConceptId: surgicalCase.statusConceptId },
          Reason.CASE_NOT_ACTIVE_FOR_ROOM_EVENTS,
        );
      }

      const recorded = await tx.find(
        OperatingRoomUtilizationEvents,
        {
          procedureCaseId: caseId,
          eventTypeConceptId: {
            $in: ROOM_EVENT_SEQUENCE.map((c) => EVENT_CONCEPT[c]),
          },
        },
        { orderBy: { occurredAt: 'ASC' } },
      );
      const recordedCodes = new Set(
        recorded.map((e) =>
          ROOM_EVENT_SEQUENCE.find(
            (c) => EVENT_CONCEPT[c] === e.eventTypeConceptId,
          )!,
        ),
      );
      if (recordedCodes.has(dto.eventCode)) {
        throw new ConflictException(
          'Ese hecho ya está registrado',
          { caseId, eventCode: dto.eventCode },
          Reason.ROOM_EVENT_ALREADY_RECORDED,
        );
      }
      const expected = ROOM_EVENT_SEQUENCE.find((c) => !recordedCodes.has(c));
      if (expected !== dto.eventCode) {
        throw new PreconditionFailedException(
          'Los hechos de sala se registran en orden',
          { caseId, expected, received: dto.eventCode },
          Reason.ROOM_EVENT_OUT_OF_ORDER,
        );
      }
      const previous = recorded[recorded.length - 1];
      if (previous && occurredAt < previous.occurredAt) {
        throw new PreconditionFailedException(
          'El hecho no puede ser anterior al hecho previo',
          {
            caseId,
            previousOccurredAt: previous.occurredAt.toISOString(),
            occurredAt: dto.occurredAt,
          },
          Reason.ROOM_EVENT_OUT_OF_ORDER,
        );
      }

      // INV-39: algunos hechos exigen una fase del check-list.
      const phase = EVENT_GATE[dto.eventCode];
      if (phase) await this.gate.assertPhase(tx, caseId, phase);

      const utilization = this.casesRepo.createUtilizationEvent(tx, {
        operatingRoomId: surgicalCase.operatingRoomId,
        procedureCaseId: caseId,
        eventTypeConceptId: EVENT_CONCEPT[dto.eventCode],
        recordedByUserId: actor.id,
        tenantId: surgicalCase.custodianTenantId,
        operatingRoomBlockId: surgicalCase.operatingRoomBlockId,
        occurredAt,
      });

      let milestoneId: string | null = null;
      const milestoneType = EVENT_MILESTONE[dto.eventCode];
      if (milestoneType) {
        // La inducción anestésica ya deja el hito de inicio de anestesia: no se duplica.
        const existing = await this.casesRepo.findMilestone(
          tx,
          caseId,
          milestoneType,
        );
        if (existing) {
          milestoneId = existing.id;
        } else {
          const milestone = this.casesRepo.createMilestone(tx, {
            procedureCaseId: caseId,
            milestoneTypeConceptId: milestoneType,
            occurredAt,
            statusConceptId: CONCEPTS.MILESTONE_REACHED,
          });
          milestoneId = milestone.id;
        }
      }

      // La salida del paciente deja el quirófano sucio: la orden de recambio la crea F2.
      let cleaningOrderId: string | null = null;
      if (dto.eventCode === 'PATIENT_OUT_OF_ROOM') {
        const dirty = await this.careSpaceOps.markDirtyFromSource(
          tx,
          surgicalCase.operatingRoomId,
          {
            trigger: 'OR_TURNOVER',
            sourceRefId: caseId,
            terminal: false,
            actor,
            requestId: correlationId,
          },
        );
        cleaningOrderId = dirty.cleaningOrderId;
      }

      await tx.flush();
      await this.outbox.publishDomainEvent(tx, {
        tenantId: surgicalCase.custodianTenantId,
        eventType: ROOM_EVENT_RECORDED,
        aggregateType: 'procedure_case',
        aggregateId: caseId,
        payloadJson: {
          procedureCaseId: caseId,
          operatingRoomId: surgicalCase.operatingRoomId,
          operatingRoomBlockId: surgicalCase.operatingRoomBlockId ?? null,
          eventCode: dto.eventCode,
          occurredAt: occurredAt.toISOString(),
          utilizationEventId: utilization.id,
          milestoneId,
          cleaningOrderId,
          tenantId: surgicalCase.custodianTenantId,
          actorUserId: actor.id,
          requestId: correlationId ?? null,
        },
        correlationId,
        actorUserId: actor.id,
      });

      return {
        utilizationEventId: utilization.id,
        milestoneId,
        cleaningOrderId,
      };
    });
  }
}
