import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../../common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../../practice/services/care-space-ops.port';
import { OperatingRoomBlocks } from '../../entities';
import { PERIOP } from '../../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as R } from '../../procedures_perioperative.error-reasons';

/** Estados del caso que ocupan el quirófano (los del EXCLUDE). */
const LIVE_STATES = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
  CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
];

/** Lo que se programa. */
export interface OrSchedulingInput {
  readonly operatingRoomId: string;
  readonly practiceSiteId?: string | null;
  readonly start: Date;
  readonly end: Date;
  readonly caseType: string;
  readonly specialtyConceptId?: string | null;
  readonly surgeonProfileId?: string | null;
  readonly excludeCaseId?: string;
}

/** Lo que el caso guarda (la ventana reservada la calcula el trigger). */
export interface OrSchedulingResult {
  readonly schedulableResourceId: string;
  readonly operatingRoomBlockId: string | null;
  readonly prepMinutes: number;
  readonly cleanupMinutes: number;
  readonly reservedStartAt: Date;
  readonly reservedEndAt: Date;
}

/**
 * Validaciones 1–7 de §F4.3 antes de programar o reprogramar un caso: el
 * quirófano es un espacio del tenant (404, por el puerto de F2), de la misma
 * sede (422), con función quirófano (422), activo y sin bloqueo en la ventana
 * reservada (422 `OPERATING_ROOM_NOT_AVAILABLE`), con recurso agendable activo
 * (422), sin bloque de otro dueño salvo urgencia (409) y sin solape de
 * ventanas reservadas (409 `OPERATING_ROOM_SLOT_CONFLICT`). La ventana
 * reservada se calcula acá sólo para validar: la escribe el trigger
 * `trg_procedure_cases_reserved_window`.
 */
@Injectable()
export class OperatingRoomValidator {
  constructor(
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /**
   * @param tx - Transacción.
   * @param input - Quirófano, sede, ventana y dueño del caso.
   */
  async validate(
    tx: EntityManager,
    input: OrSchedulingInput,
  ): Promise<OrSchedulingResult> {
    const room = await this.ops.getOperationalState(tx, input.operatingRoomId);
    if (input.practiceSiteId && room.practiceSiteId !== input.practiceSiteId) {
      throw new PreconditionFailedException(
        'El quirófano es de otra sede',
        { operatingRoomId: input.operatingRoomId },
        R.OPERATING_ROOM_SITE_MISMATCH,
      );
    }
    if (room.functionCode !== 'SPACE_FN_OPERATING_ROOM') {
      throw new PreconditionFailedException(
        'El espacio no es un quirófano',
        { functionCode: room.functionCode },
        R.OPERATING_ROOM_INVALID_FUNCTION,
      );
    }
    const prepMinutes = room.prepMinutes ?? 0;
    const cleanupMinutes = room.cleanupMinutes ?? 0;
    const reservedStartAt = new Date(
      input.start.getTime() - prepMinutes * 60_000,
    );
    const reservedEndAt = new Date(
      input.end.getTime() + cleanupMinutes * 60_000,
    );
    try {
      await this.ops.assertBookable(tx, input.operatingRoomId, {
        start: reservedStartAt,
        end: reservedEndAt,
      });
    } catch (error) {
      const e = error as { reason?: string; details?: Record<string, unknown> };
      if (e.reason !== 'SPACE_NOT_BOOKABLE') throw error;
      throw new PreconditionFailedException(
        'El quirófano no está disponible en esa ventana',
        e.details ?? {},
        R.OPERATING_ROOM_NOT_AVAILABLE,
      );
    }
    const [resource] = await tx.execute<{ id: string }[]>(
      'SELECT id FROM scheduling.schedulable_resources WHERE care_space_id = ? AND state_concept_id = ? LIMIT 1',
      [input.operatingRoomId, CONCEPTS.STATE_ACTIVE],
      'all',
    );
    if (!resource) {
      throw new PreconditionFailedException(
        'El quirófano no tiene recurso agendable activo',
        { operatingRoomId: input.operatingRoomId },
        R.OPERATING_ROOM_WITHOUT_RESOURCE,
      );
    }
    const blocks = await tx.find(OperatingRoomBlocks, {
      operatingRoomId: input.operatingRoomId,
      statusConceptId: PERIOP.ORB_ACTIVE,
      startsAt: { $lt: input.end },
      endsAt: { $gt: input.start },
    });
    let blockId: string | null = null;
    for (const b of blocks) {
      const own =
        (b.ownerKindConceptId === PERIOP.ORB_OWNER_SERVICE &&
          !!b.surgicalSpecialtyConceptId &&
          b.surgicalSpecialtyConceptId === input.specialtyConceptId) ||
        (b.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON &&
          !!b.surgeonProfileId &&
          b.surgeonProfileId === input.surgeonProfileId);
      if (own) {
        blockId ??= b.id;
      } else if (input.caseType === 'ELECTIVE') {
        throw new ConflictException(
          'La ventana cae en un bloque de otro dueño',
          {
            blockId: b.id,
            owner:
              b.ownerKindConceptId === PERIOP.ORB_OWNER_SERVICE
                ? 'SERVICE'
                : 'SURGEON',
          },
          R.OR_BLOCK_OWNED_BY_OTHER,
        );
      }
    }
    const [conflict] = await tx.execute<
      { id: string; reserved_start_at: string; reserved_end_at: string }[]
    >(
      `SELECT id, reserved_start_at, reserved_end_at FROM procedures_perioperative.procedure_cases
        WHERE operating_room_id = ? AND status_concept_id = ANY(?::uuid[])
          AND reserved_start_at < ? AND reserved_end_at > ? AND id <> ?
        ORDER BY reserved_start_at LIMIT 1`,
      [
        input.operatingRoomId,
        `{${LIVE_STATES.join(',')}}`,
        reservedEndAt,
        reservedStartAt,
        input.excludeCaseId ?? '00000000-0000-0000-0000-000000000000',
      ],
      'all',
    );
    if (conflict) {
      throw new ConflictException(
        'El quirófano ya está reservado en esa ventana',
        {
          operatingRoomId: input.operatingRoomId,
          conflictingCaseId: conflict.id,
          reservedStartAt: new Date(conflict.reserved_start_at).toISOString(),
          reservedEndAt: new Date(conflict.reserved_end_at).toISOString(),
        },
        R.OPERATING_ROOM_SLOT_CONFLICT,
      );
    }
    return {
      schedulableResourceId: resource.id,
      operatingRoomBlockId: blockId,
      prepMinutes,
      cleanupMinutes,
      reservedStartAt,
      reservedEndAt,
    };
  }
}
