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

  createRun(
    em: EntityManager,
    data: {
      transformationDefinitionId: string;
      tenantId: string;
      sourceCheckpoint?: string;
      status: string;
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

  createPartition(
    em: EntityManager,
    data: {
      lakehouseDatasetId: string;
      partitionSpecHash: string;
      partitionValuesJson?: unknown;
      recordCount: string;
      sizeBytes: string;
      minEventAt?: Date;
      maxEventAt?: Date;
      state: string;
    },
  ): LakehousePartitions {
    return em.create(LakehousePartitions, data as never, { partial: true });
  }

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
      lakehousePartitionId: string;
      objectManifestId?: string;
      fileFormat: string;
      rowCount: string;
      sizeBytes: string;
      contentHash: string;
      minMaxStatisticsJson?: unknown;
    },
  ): LakehouseFiles {
    return em.create(
      LakehouseFiles,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

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
      tenantId: string;
      sourceDatasetId: string;
      targetDatasetId: string;
      transformationRunId: string;
      sourcePartitionId?: string;
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

  createQualityRun(
    em: EntityManager,
    data: {
      tenantId: string;
      lakehouseDatasetId: string;
      transformationRunId?: string;
      status: string;
      startedAt: Date;
    },
  ): LakehouseQualityRuns {
    return em.create(
      LakehouseQualityRuns,
      { ...data, evaluatedRecordCount: '0', failedRecordCount: '0' } as never,
      { partial: true },
    );
  }

  createQualityIssue(
    em: EntityManager,
    data: {
      lakehouseQualityRunId: string;
      lakehouseQualityRuleId: string;
      partitionId?: string;
      issueCount: string;
      sampleObjectManifestId?: string;
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
