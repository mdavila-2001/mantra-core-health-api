import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { OutboxService } from '../../../messaging/services/outbox.service';
import { PRAC } from '../../../practice/practice.concepts';
import {
  FUNCTION_PROFILE_BY_CODE,
  PRACTICE_CONCEPT_BY_ID,
} from '../../../practice/domain/structure/structure-catalog';
import type {
  CareSpaceDirectoryPort,
  CareSpaceForResource,
} from '../../application/ports/care-space-directory.port';

/**
 * `CareSpaceDirectoryPort` sobre `practice.care_spaces` (SQL de sólo lectura,
 * en la transacción y con el tenant del llamador) y el outbox.
 */
@Injectable()
export class PracticeCareSpaceDirectoryAdapter implements CareSpaceDirectoryPort {
  constructor(private readonly outbox: OutboxService) {}

  /** @inheritdoc */
  async describe(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceForResource | null> {
    const [row] = await tx.execute<
      {
        tenant_id: string;
        practice_site_id: string;
        space_type_concept_id: string;
        status_concept_id: string;
        valid_from: string | null;
        valid_to: string | null;
      }[]
    >(
      `SELECT tenant_id, practice_site_id, space_type_concept_id, status_concept_id, valid_from, valid_to
         FROM practice.care_spaces WHERE id = ?`,
      [careSpaceId],
      'all',
    );
    if (!row) return null;
    const functionCode =
      PRACTICE_CONCEPT_BY_ID.get(row.space_type_concept_id)?.code ?? null;
    const now = Date.now();
    return {
      tenantId: row.tenant_id,
      practiceSiteId: row.practice_site_id,
      functionCode,
      schedulable: functionCode
        ? (FUNCTION_PROFILE_BY_CODE.get(functionCode)?.schedulable ?? false)
        : false,
      active:
        row.status_concept_id === PRAC.SPACE_ACTIVE &&
        (!row.valid_from || new Date(row.valid_from).getTime() <= now) &&
        (!row.valid_to || new Date(row.valid_to).getTime() > now),
    };
  }

  /** @inheritdoc */
  async hasActiveResource(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<boolean> {
    const rows = await tx.execute<{ id: string }[]>(
      'SELECT id FROM scheduling.schedulable_resources WHERE care_space_id = ? AND state_concept_id = ? LIMIT 1',
      [careSpaceId, CONCEPTS.STATE_ACTIVE],
      'all',
    );
    return rows.length > 0;
  }

  /** @inheritdoc */
  async announceLinked(
    tx: EntityManager,
    input: {
      tenantId: string;
      resourceId: string;
      careSpaceId: string;
      actorUserId: string;
    },
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: input.tenantId,
      eventType: 'scheduling.resource.linked_to_space',
      aggregateType: 'scheduling.schedulable_resources',
      aggregateId: input.resourceId,
      payloadJson: {
        resourceId: input.resourceId,
        careSpaceId: input.careSpaceId,
      },
      actorUserId: input.actorUserId,
    });
  }
}
