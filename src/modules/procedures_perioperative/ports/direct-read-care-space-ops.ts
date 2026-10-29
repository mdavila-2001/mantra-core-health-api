import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import {
  SPACE_NOT_BOOKABLE,
  type BookingWindow,
  type CareSpaceOpsPort,
  type MarkDirtySource,
} from './care-space-ops.port';

/**
 * Enlace por omisión del puerto de operación de espacios, para mientras la franja F2 no
 * está integrada.
 *
 * - `assertBookable` **sí** decide con lo que hay en la base: ciclo de vida del espacio, su
 *   vigencia y los bloqueos de `practice.care_space_blocks` (mantenimiento, cierre…) que
 *   se solapan con la ventana. Es una lectura; no escribe.
 * - `markDirtyFromSource` **no** crea la orden de limpieza: esa cola es de F2. Registra el
 *   hecho en el log y devuelve `cleaningOrderId: null`; el recambio del quirófano queda
 *   medido por los eventos de sala, no por la orden. En cuanto se enlace el puerto de F2 el
 *   hecho pasa a generar su orden sin tocar el servicio de eventos.
 */
@Injectable()
export class DirectReadCareSpaceOps implements CareSpaceOpsPort {
  /** @param logger - Registro estructurado. */
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DirectReadCareSpaceOps.name);
  }

  /** @inheritdoc */
  async assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: BookingWindow,
  ): Promise<void> {
    const space = await tx.execute<
      {
        status_concept_id: string;
        valid_from: Date | null;
        valid_to: Date | null;
      }[]
    >(
      `select status_concept_id, valid_from, valid_to
         from practice.care_spaces where id = ?`,
      [careSpaceId],
    );
    const row = space[0];
    const notBookable = (
      cause: string,
      block?: Record<string, unknown>,
    ): PreconditionFailedException =>
      new PreconditionFailedException(
        'El espacio no puede reservarse en esa ventana',
        { careSpaceId, cause, ...(block ? { block } : {}) },
        SPACE_NOT_BOOKABLE,
      );
    if (!row) throw notBookable('NOT_FOUND');
    if (row.status_concept_id !== PRAC.SPACE_ACTIVE) {
      throw notBookable('LIFECYCLE_NOT_ACTIVE');
    }
    if (
      (row.valid_from && new Date(row.valid_from) > window.start) ||
      (row.valid_to && new Date(row.valid_to) < window.end)
    ) {
      throw notBookable('OUT_OF_VALIDITY');
    }
    const blocks = await tx.execute<
      {
        id: string;
        kind_concept_id: string;
        starts_at: Date;
        expected_end_at: Date | null;
      }[]
    >(
      `select id, kind_concept_id, starts_at, expected_end_at
         from practice.care_space_blocks
        where care_space_id = ?
          and ended_at is null and cancelled_at is null
          and starts_at < ?
          and (expected_end_at is null or expected_end_at > ?)
        order by starts_at
        limit 1`,
      [careSpaceId, window.end, window.start],
    );
    if (blocks[0]) {
      throw notBookable('BLOCKED', {
        id: blocks[0].id,
        kindConceptId: blocks[0].kind_concept_id,
        startsAt: blocks[0].starts_at,
        expectedEndAt: blocks[0].expected_end_at,
      });
    }
  }

  /** @inheritdoc */
  markDirtyFromSource(
    _tx: EntityManager,
    careSpaceId: string,
    source: MarkDirtySource,
  ): Promise<{ cleaningOrderId: string | null }> {
    this.logger.warn(
      {
        operation: 'periop.care_space_ops.mark_dirty.unbound',
        careSpaceId,
        trigger: source.trigger,
        sourceRefId: source.sourceRefId,
      },
      'Puerto de operación de espacios sin enlazar: no se creó la orden de limpieza',
    );
    return Promise.resolve({ cleaningOrderId: null });
  }
}
