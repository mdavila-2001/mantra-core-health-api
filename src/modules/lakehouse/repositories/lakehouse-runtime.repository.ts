import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TransformationDefinitions,
  TransformationRuns,
  LakehousePartitions,
  LakehouseFiles,
  LakehouseLineageEdges,
  LakehouseQualityRuns,
  LakehouseQualityIssues,
} from '../entities';

/**
 * Ejecución del lakehouse: definiciones y corridas de transformación, las
 * particiones y archivos que materializan, el linaje que dejan y las corridas de
 * calidad con sus hallazgos.
 *
 * Los archivos son **inmutables** y las particiones no se reescriben: una
 * corrección crea una partición nueva y supersede la anterior.
 */
@Injectable()
export class LakehouseRuntimeRepository {
  // --- Definiciones y corridas (UC-63-05) ---

  /**
   * Obtiene find definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find definition by id conforme al contrato `Promise<TransformationDefinitions | null>`.
   */
  findDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<TransformationDefinitions | null> {
    return em.findOne(TransformationDefinitions, { id });
  }

  /**
   * Corrida viva sobre el mismo dataset objetivo. `SKIP LOCKED` porque el segundo
   * disparo tiene que ver que ya hay una corriendo y rendirse, no bloquearse hasta
   * que termine la primera y entonces abrir otra.
   */
  findLiveRunByTargetForUpdate(
    em: EntityManager,
    transformationDefinitionId: string,
    liveStatuses: string[],
  ): Promise<TransformationRuns | null> {
    return em.findOne(
      TransformationRuns,
      { transformationDefinitionId, status: { $in: liveStatuses } },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  /**
   * Crea create run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create run conforme al contrato `TransformationRuns`.
   */
  createRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a transformation definition.
       */
      transformationDefinitionId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de source checkpoint mantenido por la instancia.
       */
      sourceCheckpoint?: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): TransformationRuns {
    return em.create(
      TransformationRuns,
      {
        ...data,
        inputRecordCount: '0',
        outputRecordCount: '0',
        rejectedRecordCount: '0',
      } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run by id conforme al contrato `Promise<TransformationRuns | null>`.
   */
  findRunById(
    em: EntityManager,
    id: string,
  ): Promise<TransformationRuns | null> {
    return em.findOne(TransformationRuns, { id });
  }

  // --- Particiones (UC-63-05, 07, 08) ---

  /**
   * Partición por su huella. Es lo que hace idempotente la corrida: reprocesar el
   * mismo lote reencuentra la partición en vez de duplicarla.
   */
  findPartitionByHash(
    em: EntityManager,
    lakehouseDatasetId: string,
    partitionSpecHash: string,
  ): Promise<LakehousePartitions | null> {
    return em.findOne(LakehousePartitions, {
      lakehouseDatasetId,
      partitionSpecHash,
    });
  }

  /**
   * Crea create partition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create partition conforme al contrato `LakehousePartitions`.
   */
  createPartition(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lakehouse dataset.
       */
      lakehouseDatasetId: string;
      /**
       * Valor de partition spec hash mantenido por la instancia.
       */
      partitionSpecHash: string;
      /**
       * Valor de partition values json mantenido por la instancia.
       */
      partitionValuesJson?: unknown;
      /**
       * Valor de record count mantenido por la instancia.
       */
      recordCount: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes: string;
      /**
       * Valor de min event at mantenido por la instancia.
       */
      minEventAt?: Date;
      /**
       * Valor de max event at mantenido por la instancia.
       */
      maxEventAt?: Date;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): LakehousePartitions {
    return em.create(LakehousePartitions, data as never, { partial: true });
  }

  /**
   * Obtiene find partition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find partition by id conforme al contrato `Promise<LakehousePartitions | null>`.
   */
  findPartitionById(
    em: EntityManager,
    id: string,
  ): Promise<LakehousePartitions | null> {
    return em.findOne(LakehousePartitions, { id });
  }

  // --- Archivos (UC-63-05, 07) ---

  /**
   * Append-only e inmutable. Un archivo del lago no se edita: si su contenido
   * cambia, es otro archivo con otro hash.
   */
  createFile(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lakehouse partition.
       */
      lakehousePartitionId: string;
      /**
       * Identificador asociado a object manifest.
       */
      objectManifestId?: string;
      /**
       * Valor de file format mantenido por la instancia.
       */
      fileFormat: string;
      /**
       * Valor de row count mantenido por la instancia.
       */
      rowCount: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de min max statistics json mantenido por la instancia.
       */
      minMaxStatisticsJson?: unknown;
    },
  ): LakehouseFiles {
    return em.create(
      LakehouseFiles,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find file by hash.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param lakehousePartitionId - Identificador de lakehouse partition.
   * @param contentHash - Valor de content hash requerido por la operación.
   * @returns Resultado de find file by hash conforme al contrato `Promise<LakehouseFiles | null>`.
   */
  findFileByHash(
    em: EntityManager,
    lakehousePartitionId: string,
    contentHash: string,
  ): Promise<LakehouseFiles | null> {
    return em.findOne(LakehouseFiles, { lakehousePartitionId, contentHash });
  }

  // --- Linaje (UC-63-06) ---

  /** Append-only: el linaje es un registro de qué produjo qué, y no se corrige. */
  createLineageEdge(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a source dataset.
       */
      sourceDatasetId: string;
      /**
       * Identificador asociado a target dataset.
       */
      targetDatasetId: string;
      /**
       * Identificador asociado a transformation run.
       */
      transformationRunId: string;
      /**
       * Identificador asociado a source partition.
       */
      sourcePartitionId?: string;
      /**
       * Identificador asociado a target partition.
       */
      targetPartitionId?: string;
    },
  ): LakehouseLineageEdges {
    return em.create(
      LakehouseLineageEdges,
      { ...data, recordedAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Calidad (UC-63-08) ---

  /**
   * Crea create quality run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create quality run conforme al contrato `LakehouseQualityRuns`.
   */
  createQualityRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a lakehouse dataset.
       */
      lakehouseDatasetId: string;
      /**
       * Identificador asociado a transformation run.
       */
      transformationRunId?: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): LakehouseQualityRuns {
    return em.create(
      LakehouseQualityRuns,
      { ...data, evaluatedRecordCount: '0', failedRecordCount: '0' } as never,
      { partial: true },
    );
  }

  /**
   * Crea create quality issue.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create quality issue conforme al contrato `LakehouseQualityIssues`.
   */
  createQualityIssue(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lakehouse quality run.
       */
      lakehouseQualityRunId: string;
      /**
       * Identificador asociado a lakehouse quality rule.
       */
      lakehouseQualityRuleId: string;
      /**
       * Identificador asociado a partition.
       */
      partitionId?: string;
      /**
       * Valor de issue count mantenido por la instancia.
       */
      issueCount: string;
      /**
       * Identificador asociado a sample object manifest.
       */
      sampleObjectManifestId?: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): LakehouseQualityIssues {
    return em.create(
      LakehouseQualityIssues,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }
}
