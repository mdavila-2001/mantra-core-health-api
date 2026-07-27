import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  HistoryRepository,
  DataAccessLogRepository,
  AuditLogRepository,
} from '../repositories';
import { AUD } from '../audit.concepts';
import { HistoryQueryDto, HistoryTimelineDto } from '../dto';

/**
 * UC-10-05: consulta de historial / línea de tiempo de un registro. Es lectura
 * sobre tablas append-only, pero la propia consulta también se audita (INSERT en
 * `data_access_log` + provenance en `audit_log`), por eso corre en transacción.
 */
@Injectable()
export class AuditHistoryService {
  constructor(
    private readonly em: EntityManager,
    private readonly historyRepo: HistoryRepository,
    private readonly dataAccessRepo: DataAccessLogRepository,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditHistoryService.name);
  }

  /** Reconstruye la línea de tiempo (o el estado point-in-time) de `id`. */
  async getTimeline(
    entity: string,
    id: string,
    query: HistoryQueryDto,
    actor: AuthenticatedUser,
  ): Promise<HistoryTimelineDto> {
    this.logger.info(
      {
        operation: 'audit.history.read',
        actorId: actor.id,
        entity,
        id,
        asOf: query.as_of,
      },
      'Reading record history',
    );
    if (!this.historyRepo.isSupported(entity)) {
      throw new ResourceNotFoundException('Entidad de historial no soportada', {
        entity,
      });
    }

    return this.em.transactional(async (tx) => {
      const asOf = query.as_of ? new Date(query.as_of) : undefined;
      const revisions = await this.historyRepo.timeline(tx, entity, id, asOf);

      // La consulta de historial también se audita (accounting WORM + provenance).
      this.dataAccessRepo.record(tx, {
        userId: actor.id,
        actionConceptId: AUD.ACTION_READ,
        resourceType: `${entity}_history`,
        resourceId: id,
        recordedByUserId: actor.id,
      });
      await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'HISTORY_READ',
        entity,
        entityId: id,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
      });

      return { entity, entityId: id, count: revisions.length, revisions };
    });
  }
}
