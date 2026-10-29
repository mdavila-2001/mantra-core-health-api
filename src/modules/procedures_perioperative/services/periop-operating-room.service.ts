import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  DomainException,
  PreconditionFailedException,
  requireTenantId,
} from '../../../common';
import { SchedulableResources } from '../../scheduling/entities';
import { PRAC } from '../../practice/practice.concepts';
import type { CareSpaces } from '../../practice/entities';
import {
  OperatingRoomAccessService,
  operatingRoomNotFound,
  type OperatingRoomRef,
} from '../policies/operating-room-access.service';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../practice/services/care-space-ops.port';
import { OpsErrorReason } from '../../practice/practice-ops.error-reasons';
import type { Interval } from '../domain/or-window';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';

/**
 * El bloqueo que impidió reservar, a partir de los `details` de `SPACE_NOT_BOOKABLE`
 * del puerto de operación de espacios; `null` si el impedimento no fue un bloqueo
 * (ciclo de vida, disponibilidad cerrada sin fila de bloqueo).
 */
function blockOf(details: unknown): Record<string, unknown> | null {
  const d = (details ?? {}) as Record<string, unknown>;
  if (typeof d.blockId !== 'string') return null;
  return {
    id: d.blockId,
    kind: d.blockKind ?? null,
    startsAt: d.blockStartsAt ?? null,
    expectedEndAt: d.blockExpectedEndAt ?? null,
  };
}

/** Una sala validada para reservar. */
export interface BookableRoom {
  /** Espacio y sede. */
  readonly room: OperatingRoomRef;
  /** Recurso agendable activo de la sala (R0). */
  readonly resourceId: string;
}

/**
 * Reglas de «esto es un quirófano y se puede usar» (CONTRATO-F2-F5 §F4.3, validaciones 1 a 5)
 * compartidas por programar y reprogramar un caso y por crear bloques.
 */
@Injectable()
export class PeriopOperatingRoomService {
  /**
   * @param access - Carga de espacios del tenant.
   * @param careSpaceOps - Puerto de operación de espacios (F2).
   */
  constructor(
    private readonly access: OperatingRoomAccessService,
    @Inject(CARE_SPACE_OPS_PORT)
    private readonly careSpaceOps: CareSpaceOpsPort,
  ) {}

  /**
   * Reglas 1 a 3: el espacio existe en el tenant, es de la sede indicada y su función es
   * quirófano.
   *
   * @param tx - Transacción activa.
   * @param operatingRoomId - Espacio pedido.
   * @param practiceSiteId - Sede que el cliente declara (si la declara).
   * @param invalid - Cómo se informa la falla de sede o función: programar usa los `reason`
   *   del caso; los bloques usan `OR_BLOCK_INVALID_ROOM`.
   * @returns El espacio con su sede.
   * @throws ResourceNotFoundException (404) si no existe en el tenant.
   * @throws PreconditionFailedException (422) si la sede o la función no corresponden.
   */
  async resolveRoom(
    tx: EntityManager,
    operatingRoomId: string,
    practiceSiteId?: string,
    invalid: 'CASE' | 'BLOCK' = 'CASE',
  ): Promise<OperatingRoomRef> {
    const room = await this.access.loadRoom(tx, operatingRoomId);
    if (!room) throw operatingRoomNotFound();

    if (practiceSiteId && room.space.practiceSiteId !== practiceSiteId) {
      throw new PreconditionFailedException(
        'El quirófano no es de la sede indicada',
        { operatingRoomId, practiceSiteId, cause: 'SITE_MISMATCH' },
        invalid === 'BLOCK'
          ? Reason.OR_BLOCK_INVALID_ROOM
          : Reason.OPERATING_ROOM_SITE_MISMATCH,
      );
    }
    if (room.space.spaceTypeConceptId !== PRAC.SPACE_FN_OPERATING_ROOM) {
      throw new PreconditionFailedException(
        'El espacio no es un quirófano',
        { operatingRoomId, cause: 'INVALID_FUNCTION' },
        invalid === 'BLOCK'
          ? Reason.OR_BLOCK_INVALID_ROOM
          : Reason.OPERATING_ROOM_INVALID_FUNCTION,
      );
    }
    return room;
  }

  /**
   * Reglas 1 a 5 para reservar una ventana: además de las anteriores, el espacio está activo y
   * vigente, `assertBookable` (mantenimiento, bloqueos) y existe su recurso agendable (R0).
   *
   * @param tx - Transacción activa.
   * @param input - Sala, sede declarada y ventana reservada `[prep, limpieza)`.
   * @returns La sala y el id del recurso agendable.
   */
  async resolveForBooking(
    tx: EntityManager,
    input: {
      operatingRoomId: string;
      practiceSiteId?: string;
      /** La ventana reservada, o cómo calcularla con las cifras del espacio ya cargado. */
      window: Interval | ((space: CareSpaces) => Interval);
    },
  ): Promise<BookableRoom> {
    const room = await this.resolveRoom(
      tx,
      input.operatingRoomId,
      input.practiceSiteId,
    );
    const { space } = room;
    const window =
      typeof input.window === 'function' ? input.window(space) : input.window;

    const lifecycleOk =
      space.statusConceptId === PRAC.SPACE_ACTIVE &&
      (!space.validFrom || space.validFrom <= window.start) &&
      (!space.validTo || space.validTo >= window.end);
    if (!lifecycleOk) {
      throw this.notAvailable(input.operatingRoomId, 'LIFECYCLE');
    }
    try {
      await this.careSpaceOps.assertBookable(tx, space.id, {
        start: window.start,
        end: window.end,
      });
    } catch (error) {
      if (
        error instanceof DomainException &&
        error.reason === OpsErrorReason.SPACE_NOT_BOOKABLE
      ) {
        throw this.notAvailable(
          input.operatingRoomId,
          'BLOCKED',
          blockOf(error.details),
        );
      }
      throw error;
    }

    const tenantId = requireTenantId();
    const resource = await tx.findOne(SchedulableResources, {
      careSpaceId: space.id,
      tenantId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (!resource) {
      throw new PreconditionFailedException(
        'El quirófano no es un recurso agendable activo',
        { operatingRoomId: input.operatingRoomId },
        Reason.OPERATING_ROOM_WITHOUT_RESOURCE,
      );
    }
    return { room, resourceId: resource.id };
  }

  private notAvailable(
    operatingRoomId: string,
    cause: string,
    block: unknown = null,
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      'El quirófano no está disponible en esa ventana',
      { operatingRoomId, cause, block },
      Reason.OPERATING_ROOM_NOT_AVAILABLE,
    );
  }
}
