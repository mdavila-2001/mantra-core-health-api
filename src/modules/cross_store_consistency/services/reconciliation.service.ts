import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { ReconciliationRepository } from '../repositories';
import { DRIFT_RESULTS, DRIFT_SEVERITY, type Severity } from '../constants';
import {
  RunReconciliationDto,
  ReconciliationResponseDto,
  RepairDriftDto,
  RepairJobResponseDto,
} from '../dto';

/**
 * Reconciliación y reparación de derivas (UC-62-05, 06, 07).
 *
 * **PostgreSQL es la única fuente de verdad.** Todo lo de aquí compara contra el
 * canónico y repara hacia los stores secundarios; una divergencia nunca se
 * resuelve cambiando el canónico.
 */
@Injectable()
export class ReconciliationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reconciliationRepo - Valor de reconciliation repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reconciliationRepo: ReconciliationRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReconciliationService.name);
  }

  /**
   * UC-62-05 + UC-62-06: comparar y abrir las derivas.
   *
   * Los dos casos de uso son una sola operación porque el segundo se declara
   * *interno, parte del primero*: detectar una divergencia y no registrarla en la
   * misma transacción dejaría una comparación cuyo resultado nadie recoge.
   *
   * La deduplicación por `(tenant, dataset, entidad, tipo)` mientras la deriva
   * siga abierta es lo que impide que una reconciliación horaria abra
   * veinticuatro incidentes idénticos al día del mismo problema.
   */
  async runReconciliation(
    dto: RunReconciliationDto,
    actor: AuthenticatedUser,
  ): Promise<ReconciliationResponseDto> {
    return this.em.transactional(async (tx) => {
      const run = this.reconciliationRepo.createRun(tx, {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        sourceBackendCode: dto.sourceBackendCode,
        targetBackendCode: dto.targetBackendCode,
        reconciliationScopeJson: dto.reconciliationScopeJson,
        status: 'RUNNING',
        startedAt: new Date(),
      });

      let matched = 0;
      let driftsOpened = 0;
      let driftsSkipped = 0;
      const driftsByType: Record<string, number> = {};
      const seen = new Set<string>();

      for (const item of dto.items) {
        if (seen.has(item.canonicalEntityId)) {
          throw new ConflictException(
            'La misma entidad canónica aparece dos veces en la corrida.',
            { canonicalEntityId: item.canonicalEntityId },
          );
        }
        seen.add(item.canonicalEntityId);

        const record = this.reconciliationRepo.createItem(tx, {
          reconciliationRunId: run.id,
          canonicalEntityId: item.canonicalEntityId,
          canonicalVersion: item.canonicalVersion,
          targetDocumentId: item.targetDocumentId,
          targetVersion: item.targetVersion,
          canonicalHash: item.canonicalHash,
          targetHash: item.targetHash,
          result: item.result,
        });

        if (!(DRIFT_RESULTS as readonly string[]).includes(item.result)) {
          matched += 1;
          continue;
        }

        const key = {
          tenantId: dto.tenantId,
          datasetId: dto.datasetId,
          canonicalEntityId: item.canonicalEntityId,
          driftType: item.result,
        };
        const open = await this.reconciliationRepo.findOpenDrift(
          tx,
          key,
          'OPEN',
        );
        if (open) {
          driftsSkipped += 1;
          continue;
        }

        const severity: Severity = DRIFT_SEVERITY[item.result] ?? 'MEDIUM';
        const drift = this.reconciliationRepo.createDrift(tx, {
          ...key,
          severity,
          canonicalVersion: item.canonicalVersion,
          targetVersion: item.targetVersion,
          reconciliationItemId: record.id,
          status: 'OPEN',
        });
        driftsOpened += 1;
        driftsByType[item.result] = (driftsByType[item.result] ?? 0) + 1;

        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'ProjectionDriftDetected',
          aggregateType: 'cross_store_consistency.projection_drift_events',
          aggregateId: drift.id,
          payloadJson: {
            datasetId: dto.datasetId,
            targetBackendCode: dto.targetBackendCode,
            canonicalEntityId: item.canonicalEntityId,
            driftType: item.result,
            severity,
          },
          actorUserId: actor.id,
        });
      }

      run.status = 'COMPLETED';
      run.completedAt = new Date();

      if (driftsOpened > 0) {
        this.logger.warn(
          {
            operation: 'xstore.reconciliation.drift',
            runId: run.id,
            datasetId: dto.datasetId,
            driftsOpened,
            driftsByType,
          },
          'Reconciliación detectó divergencias',
        );
      } else {
        this.logger.info(
          {
            operation: 'xstore.reconciliation.run',
            runId: run.id,
            itemsEvaluated: dto.items.length,
            matched,
          },
          'Reconciliación sin divergencias nuevas',
        );
      }

      return {
        id: run.id,
        status: run.status,
        itemsEvaluated: dto.items.length,
        matched,
        driftsOpened,
        driftsSkipped,
        driftsByType,
      };
    });
  }

  /**
   * UC-62-07: reparar la deriva.
   *
   * La reparación **recomputa desde el canónico** y sobrescribe el destino. Por
   * eso la acción por defecto es `REPROJECT`: la proyección se rehace, no se
   * parchea.
   *
   * `DELETE_ORPHAN` es la única que borra, y sólo tiene sentido sobre una deriva
   * `EXTRA` — un documento que el destino tiene y el canónico ya no. Aplicarla a
   * otra clase de deriva borraría dato que sí debería estar.
   *
   * La clave de idempotencia se deriva de `(deriva, acción)`: reintentar la
   * petición no encola dos reparaciones.
   */
  async repairDrift(
    driftId: string,
    dto: RepairDriftDto,
    actor: AuthenticatedUser,
  ): Promise<RepairJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const drift = await this.reconciliationRepo.findDriftForUpdate(
        tx,
        driftId,
      );
      if (!drift) {
        throw new ResourceNotFoundException('Evento de deriva no encontrado.', {
          driftId,
        });
      }
      if (drift.status !== 'OPEN') {
        throw new PreconditionFailedException('La deriva ya no está abierta.', {
          driftId,
          status: drift.status,
        });
      }

      if (dto.repairAction === 'DELETE_ORPHAN' && drift.driftType !== 'EXTRA') {
        throw new PreconditionFailedException(
          'Borrar el huérfano sólo repara una deriva de tipo EXTRA.',
          { driftId, driftType: drift.driftType },
        );
      }

      const idempotencyKey = createHash('sha256')
        .update(driftId)
        .update(dto.repairAction)
        .digest('hex');

      const duplicate = await this.reconciliationRepo.findRepairJobByKey(
        tx,
        idempotencyKey,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          repairAction: duplicate.repairAction,
          status: duplicate.status,
          projectionDriftEventId: driftId,
          duplicate: true,
        };
      }

      const job = this.reconciliationRepo.createRepairJob(tx, {
        tenantId: drift.tenantId,
        projectionDriftEventId: driftId,
        repairAction: dto.repairAction,
        idempotencyKey,
        status: 'REQUESTED',
      });

      let reindexJobId: string | undefined;
      if (dto.repairAction === 'REINDEX') {
        const reindex = this.reconciliationRepo.createReindexJob(tx, {
          tenantId: drift.tenantId,
          datasetId: drift.datasetId,
          sourceAlias: dto.sourceAlias,
          targetIndex: dto.targetIndex,
          targetSchemaVersion: dto.targetSchemaVersion,
          status: 'REQUESTED',
          startedAt: new Date(),
        });
        reindexJobId = reindex.id;
      }

      // La deriva se cierra al encolar la reparación, no al terminarla: si la
      // reparación falla, la siguiente reconciliación volverá a detectarla y
      // abrirá una nueva. Dejarla abierta bloquearía esa detección.
      drift.status = 'RESOLVED';

      await this.outbox.publishDomainEvent(tx, {
        tenantId: drift.tenantId,
        eventType: 'ProjectionRepairRequested',
        aggregateType: 'cross_store_consistency.projection_repair_jobs',
        aggregateId: job.id,
        payloadJson: {
          projectionDriftEventId: driftId,
          datasetId: drift.datasetId,
          canonicalEntityId: drift.canonicalEntityId,
          repairAction: dto.repairAction,
          reindexJobId: reindexJobId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'xstore.drift.repair',
          driftId,
          repairJobId: job.id,
          repairAction: dto.repairAction,
        },
        'Reparación de deriva encolada',
      );

      return {
        id: job.id,
        repairAction: job.repairAction,
        status: job.status,
        projectionDriftEventId: driftId,
        reindexJobId,
        duplicate: false,
      };
    });
  }
}
