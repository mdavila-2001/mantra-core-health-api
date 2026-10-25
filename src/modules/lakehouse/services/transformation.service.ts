import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { DataReleaseRepository } from '../../health_data/repositories';
import type { LakehouseDatasets } from '../entities';
import {
  LakehouseCatalogRepository,
  LakehouseRuntimeRepository,
} from '../repositories';
import { LIVE_RUN_STATUSES } from '../constants';
import {
  activeLakehouseTenant,
  assertLakehouseResourceInTenant,
  lakehouseOutsideTenant,
  requireFields,
} from '../lakehouse.tenant-scope';
import {
  RunTransformationDto,
  TransformationRunResponseDto,
  MaterializedPartitionDto,
  CuratedIngestionDto,
  CuratedIngestionResponseDto,
  RunQualityCheckDto,
  QualityRunResponseDto,
} from '../dto';

/** Lo que deja materializar un lote de particiones. */
interface MaterializationResult {
  /**
   * Valor de partitions committed mantenido por la instancia.
   */
  partitionsCommitted: number;
  /**
   * Valor de partitions skipped mantenido por la instancia.
   */
  partitionsSkipped: number;
  /**
   * Valor de files written mantenido por la instancia.
   */
  filesWritten: number;
  /**
   * Valor de lineage edges mantenido por la instancia.
   */
  lineageEdges: number;
}

/**
 * Ejecución del lakehouse (UC-63-05, 06, 07, 08): materializar particiones y
 * archivos, dejar el linaje, ingerir dato de salud ya de-identificado y evaluar
 * la calidad.
 *
 * Este servicio **no transforma nada**: recibe del worker lo que ya escribió en el
 * almacén y lo registra. Lo que aporta es que el registro sea idempotente, que el
 * linaje quede en la misma transacción que la corrida, y que un dato malo no siga
 * sirviéndose.
 */
@Injectable()
export class TransformationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param runtimeRepo - Valor de runtime repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param dataReleaseRepo - Valor de data release repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly runtimeRepo: LakehouseRuntimeRepository,
    private readonly catalogRepo: LakehouseCatalogRepository,
    private readonly dataReleaseRepo: DataReleaseRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransformationService.name);
  }

  /**
   * UC-63-05 + UC-63-06: registrar la corrida con sus particiones, archivos y
   * linaje.
   *
   * Una sola corrida viva por definición: dos escribiendo el mismo dataset
   * objetivo producirían particiones que se pisan, y el checkpoint dejaría de
   * decir hasta dónde se procesó.
   *
   * **Las correcciones no reescriben.** Una partición con la misma huella ya
   * existe y se salta; corregir es materializar una partición nueva que supersede
   * a la anterior. Es lo que permite reconstruir qué se sabía en cada momento.
   */
  async runTransformation(
    definitionId: string,
    dto: RunTransformationDto,
    actor: AuthenticatedUser,
  ): Promise<TransformationRunResponseDto> {
    const tenantId = activeLakehouseTenant(dto.tenantId);
    return this.em.transactional(async (tx) => {
      const definition = assertLakehouseResourceInTenant(
        await this.runtimeRepo.findDefinitionById(tx, tenantId, definitionId),
        tenantId,
        'Definición de transformación no encontrada.',
      );
      if (definition.state !== 'active') {
        throw new PreconditionFailedException(
          'La definición de transformación no está activa.',
          { definitionId, state: definition.state },
        );
      }

      const live = await this.runtimeRepo.findLiveRunByTargetForUpdate(
        tx,
        definitionId,
        [...LIVE_RUN_STATUSES],
      );
      if (live) {
        return {
          id: live.id,
          status: live.status,
          partitionsCommitted: 0,
          partitionsSkipped: 0,
          filesWritten: 0,
          lineageEdges: 0,
          alreadyRunning: true,
        };
      }

      const target = await this.requireWritableDataset(
        tx,
        tenantId,
        definition.targetDatasetId,
      );
      // Los datasets de origen entran al linaje de esta corrida: todos deben
      // ser del tenant.
      const sourceDatasetIds = definition.sourceDatasetIds ?? [];
      for (const sourceDatasetId of sourceDatasetIds) {
        assertLakehouseResourceInTenant(
          await this.catalogRepo.findDatasetById(tx, tenantId, sourceDatasetId),
          tenantId,
          'Dataset de origen no encontrado.',
        );
      }

      const now = new Date();
      const run = this.runtimeRepo.createRun(tx, {
        transformationDefinitionId: definitionId,
        tenantId,
        // Una corrida sin punto de control de origen (recarga completa) lo
        // registra vacío.
        sourceCheckpoint: dto.sourceCheckpoint ?? '',
        status: 'running',
        startedAt: now,
      });

      const result = await this.materialize(tx, {
        tenantId,
        dataset: target,
        partitions: dto.partitions,
        runId: run.id,
        sourceDatasetIds,
      });

      run.inputRecordCount = dto.inputRecordCount;
      run.outputRecordCount = dto.outputRecordCount;
      run.rejectedRecordCount = dto.rejectedRecordCount ?? '0';
      run.status = dto.failed === true ? 'failed' : 'succeeded';
      run.completedAt = new Date();

      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'TransformationRunCompleted',
        aggregateType: 'lakehouse.transformation_runs',
        aggregateId: run.id,
        payloadJson: {
          transformationDefinitionId: definitionId,
          targetDatasetId: target.id,
          status: run.status,
          partitionsCommitted: result.partitionsCommitted,
          filesWritten: result.filesWritten,
        },
        actorUserId: actor.id,
      });

      if (result.lineageEdges > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId,
          eventType: 'LineageRecorded',
          aggregateType: 'lakehouse.lakehouse_lineage_edges',
          aggregateId: run.id,
          payloadJson: {
            transformationRunId: run.id,
            edges: result.lineageEdges,
          },
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'lakehouse.transformation.run',
          runId: run.id,
          status: run.status,
          ...result,
        },
        'Corrida de transformación registrada',
      );

      return {
        id: run.id,
        status: run.status,
        ...result,
        alreadyRunning: false,
      };
    });
  }

  /**
   * UC-63-07: ingerir dato de salud ya de-identificado en la zona curada.
   *
   * El destino tiene que estar en zona `curated`. Es la regla que impide que dato
   * clínico sin de-identificar acabe en una zona desde la que se sirven releases:
   * la zona no es una etiqueta descriptiva, es una frontera.
   *
   * La corrida de de-identificación se registra en `health_data` **en la misma
   * transacción** que las particiones: si no, quedaría dato curado sin prueba de
   * qué perfil lo produjo, que es justo lo que un auditor pregunta primero.
   */
  async ingestCurated(
    dto: CuratedIngestionDto,
    actor: AuthenticatedUser,
  ): Promise<CuratedIngestionResponseDto> {
    const tenantId = activeLakehouseTenant(dto.tenantId);
    return this.em.transactional(async (tx) => {
      const dataset = await this.requireWritableDataset(
        tx,
        tenantId,
        dto.targetDatasetId,
      );

      const zone = await this.catalogRepo.findZoneById(
        tx,
        dataset.dataLakeZoneId,
      );
      if (!zone || zone.zoneType !== 'curated') {
        throw new PreconditionFailedException(
          'La ingesta de-identificada sólo puede escribir en la zona curated.',
          { targetDatasetId: dto.targetDatasetId, zoneType: zone?.zoneType },
        );
      }

      // Un perfil de otro tenant responde igual que uno inexistente.
      assertLakehouseResourceInTenant(
        await this.dataReleaseRepo.findDeidProfileById(
          tx,
          dto.deidentificationProfileId,
        ),
        tenantId,
        'Perfil de de-identificación no encontrado.',
      );

      const deidRun = this.dataReleaseRepo.createDeidRun(tx, {
        tenantId,
        healthDeidentificationProfileId: dto.deidentificationProfileId,
        purposeConceptId: dto.purposeConceptId,
        consentDirectiveId: dto.consentDirectiveId,
        startedAt: new Date(),
        statusConceptId: CONCEPTS.DEID_COMPLETED,
        inputManifestFileId: dto.inputManifestFileId,
        recordsProcessed: dto.recordsProcessed,
        recordsRejected: dto.recordsRejected,
      });

      const result = await this.materialize(tx, {
        tenantId,
        dataset,
        partitions: dto.partitions,
        sourceDatasetIds: [],
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'HealthBatchDeidentified',
        aggregateType: 'health_data.health_deidentification_runs',
        aggregateId: deidRun.id,
        payloadJson: {
          targetDatasetId: dataset.id,
          deidentificationProfileId: dto.deidentificationProfileId,
          recordsProcessed: dto.recordsProcessed,
          partitionsCommitted: result.partitionsCommitted,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'lakehouse.ingestion.curated',
          deidentificationRunId: deidRun.id,
          targetDatasetId: dataset.id,
          partitionsCommitted: result.partitionsCommitted,
        },
        'Lote de salud de-identificado e ingerido en la zona curada',
      );

      return {
        deidentificationRunId: deidRun.id,
        targetDatasetId: dataset.id,
        partitionsCommitted: result.partitionsCommitted,
        filesWritten: result.filesWritten,
      };
    });
  }

  /**
   * UC-63-08: evaluar la calidad y abrir hallazgos.
   *
   * Una regla `blocking` incumplida **cuarentena el dataset**. Es la diferencia
   * entre anotar que algo está mal y dejar de servirlo: sin la cuarentena, un
   * dataset con datos malos seguiría alimentando informes mientras alguien decide
   * qué hacer.
   *
   * El umbral se compara sobre el conteo de incidencias, no sobre un porcentaje:
   * es lo que declara la regla, y calcular un porcentaje aquí sería inventar la
   * semántica del umbral.
   */
  async runQualityCheck(
    datasetId: string,
    dto: RunQualityCheckDto,
    actor: AuthenticatedUser,
  ): Promise<QualityRunResponseDto> {
    const tenantId = activeLakehouseTenant(dto.tenantId);
    // La corrida evaluada es obligatoria: la tabla la exige y no hay corrida
    // por defecto.
    requireFields(
      dto,
      ['transformationRunId'],
      'registrar la corrida de calidad',
    );
    for (const finding of dto.findings ?? []) {
      requireFields(
        finding,
        ['partitionId', 'sampleObjectManifestId'],
        'registrar un hallazgo de calidad',
      );
    }
    return this.em.transactional(async (tx) => {
      const dataset = assertLakehouseResourceInTenant(
        await this.catalogRepo.findDatasetForUpdate(tx, tenantId, datasetId),
        tenantId,
        'Dataset no encontrado.',
      );
      // La corrida de transformación y las particiones citadas deben ser del
      // mismo tenant (y las particiones, del dataset evaluado).
      assertLakehouseResourceInTenant(
        await this.runtimeRepo.findRunById(
          tx,
          tenantId,
          dto.transformationRunId as string,
        ),
        tenantId,
        'Corrida de transformación no encontrada.',
      );
      for (const finding of dto.findings ?? []) {
        const partition = await this.runtimeRepo.findPartitionById(
          tx,
          finding.partitionId as string,
        );
        if (!partition || partition.lakehouseDatasetId !== dataset.id) {
          throw lakehouseOutsideTenant('Partición no encontrada.');
        }
      }

      const rules = await this.catalogRepo.findActiveQualityRules(
        tx,
        dataset.dataProductVersionId,
        'active',
      );
      const ruleByCode = new Map(rules.map((rule) => [rule.ruleCode, rule]));

      const run = this.runtimeRepo.createQualityRun(tx, {
        tenantId,
        lakehouseDatasetId: datasetId,
        transformationRunId: dto.transformationRunId,
        status: 'running',
        startedAt: new Date(),
      });

      let failedRecords = 0n;
      let issuesOpened = 0;
      let quarantine = false;

      for (const finding of dto.findings ?? []) {
        const rule = ruleByCode.get(finding.ruleCode);
        if (!rule) {
          throw new PreconditionFailedException(
            'El hallazgo cita una regla que no está activa para la versión del producto.',
            {
              ruleCode: finding.ruleCode,
              dataProductVersionId: dataset.dataProductVersionId,
            },
          );
        }

        this.runtimeRepo.createQualityIssue(tx, {
          lakehouseQualityRunId: run.id,
          lakehouseQualityRuleId: rule.id,
          partitionId: finding.partitionId,
          issueCount: finding.issueCount,
          sampleObjectManifestId: finding.sampleObjectManifestId,
          status: 'open',
        });
        issuesOpened += 1;
        failedRecords += BigInt(finding.issueCount);

        if (
          rule.severity === 'blocking' &&
          this.exceedsThreshold(finding.issueCount, rule.threshold)
        ) {
          quarantine = true;
        }
      }

      run.evaluatedRecordCount = dto.evaluatedRecordCount;
      run.failedRecordCount = failedRecords.toString();
      run.status = issuesOpened > 0 ? 'failed' : 'passed';
      run.completedAt = new Date();

      if (quarantine && dataset.lifecycleState !== 'quarantined') {
        dataset.lifecycleState = 'quarantined';
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'QualityRunEvaluated',
        aggregateType: 'lakehouse.lakehouse_quality_runs',
        aggregateId: run.id,
        payloadJson: {
          lakehouseDatasetId: datasetId,
          status: run.status,
          issuesOpened,
          failedRecordCount: run.failedRecordCount,
          datasetQuarantined: quarantine,
        },
        actorUserId: actor.id,
      });

      if (quarantine) {
        this.logger.warn(
          {
            operation: 'lakehouse.quality.quarantine',
            datasetId,
            qualityRunId: run.id,
          },
          'Dataset puesto en cuarentena por una regla bloqueante',
        );
      } else {
        this.logger.info(
          {
            operation: 'lakehouse.quality.run',
            datasetId,
            status: run.status,
            issuesOpened,
          },
          'Corrida de calidad evaluada',
        );
      }

      return {
        id: run.id,
        status: run.status,
        evaluatedRecordCount: run.evaluatedRecordCount,
        failedRecordCount: run.failedRecordCount,
        issuesOpened,
        datasetQuarantined: quarantine,
      };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  /**
   * Ejecuta la operación require writable dataset.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param datasetId - Identificador de dataset.
   * @returns Resultado de require writable dataset conforme al contrato `Promise<LakehouseDatasets>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async requireWritableDataset(
    tx: EntityManager,
    tenantId: string,
    datasetId: string,
  ): Promise<LakehouseDatasets> {
    const dataset = assertLakehouseResourceInTenant(
      await this.catalogRepo.findDatasetById(tx, tenantId, datasetId),
      tenantId,
      'Dataset objetivo no encontrado.',
    );
    // Escribir en un dataset en cuarentena añadiría datos a algo que ya se sabe
    // que está mal, y el problema sería más difícil de acotar después.
    if (dataset.lifecycleState !== 'active') {
      throw new PreconditionFailedException(
        'El dataset objetivo no está activo; no admite escrituras.',
        { datasetId, lifecycleState: dataset.lifecycleState },
      );
    }
    return dataset;
  }

  /**
   * Materializa las particiones con sus archivos y, si la corrida lo pide, el
   * linaje.
   *
   * Una partición cuya huella ya existe **no se toca**: es la idempotencia que
   * permite reintentar la corrida sin duplicar el lago. Lo mismo con el archivo y
   * su hash de contenido.
   */
  private async materialize(
    tx: EntityManager,
    input: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de dataset mantenido por la instancia.
       */
      dataset: LakehouseDatasets;
      /**
       * Valor de partitions mantenido por la instancia.
       */
      partitions: MaterializedPartitionDto[];
      /**
       * Identificador asociado a run.
       */
      runId?: string;
      /**
       * Valor de source dataset ids mantenido por la instancia.
       */
      sourceDatasetIds: string[];
    },
  ): Promise<MaterializationResult> {
    let partitionsCommitted = 0;
    let partitionsSkipped = 0;
    let filesWritten = 0;
    let lineageEdges = 0;

    // Partición de origen → dataset, verificada contra los orígenes de la
    // definición (que ya son del tenant): una partición ajena no entra al linaje.
    const sourcePartitionOwner = new Map<string, string>();

    for (const input$ of input.partitions) {
      const existing = await this.runtimeRepo.findPartitionByHash(
        tx,
        input.dataset.id,
        input$.partitionSpecHash,
      );

      if (!existing) {
        // La tabla exige la ventana de eventos de la partición y no hay una
        // por defecto: se rechaza antes de persistir.
        requireFields(
          input$,
          ['minEventAt', 'maxEventAt'],
          'registrar la partición',
        );
      }
      const partition =
        existing ??
        this.runtimeRepo.createPartition(tx, {
          lakehouseDatasetId: input.dataset.id,
          partitionSpecHash: input$.partitionSpecHash,
          // Tabla sin particionar: valores de partición vacíos.
          partitionValuesJson: input$.partitionValuesJson ?? {},
          recordCount: input$.recordCount,
          sizeBytes: input$.sizeBytes,
          minEventAt: new Date(input$.minEventAt as string),
          maxEventAt: new Date(input$.maxEventAt as string),
          state: 'committed',
        });

      if (existing) partitionsSkipped += 1;
      else partitionsCommitted += 1;

      for (const file of input$.files) {
        const duplicate = await this.runtimeRepo.findFileByHash(
          tx,
          partition.id,
          file.contentHash,
        );
        if (duplicate) continue;

        // El archivo apunta a su objeto en el almacén: no hay uno por defecto.
        requireFields(file, ['objectManifestId'], 'registrar el archivo');
        this.runtimeRepo.createFile(tx, {
          lakehousePartitionId: partition.id,
          objectManifestId: file.objectManifestId,
          fileFormat: file.fileFormat,
          rowCount: file.rowCount,
          sizeBytes: file.sizeBytes,
          contentHash: file.contentHash,
          // Sin estadísticas declaradas no hay poda por mínimos y máximos.
          minMaxStatisticsJson: file.minMaxStatisticsJson ?? {},
        });
        filesWritten += 1;
      }

      // El linaje se registra en la misma transacción que la corrida (UC-63-06):
      // un linaje que se escribe después puede no escribirse nunca.
      if (input.runId && input.sourceDatasetIds.length > 0) {
        // La arista exige la partición de origen: sin ella no hay linaje.
        requireFields(
          {
            sourcePartitionIds: input$.sourcePartitionIds?.length || undefined,
          },
          ['sourcePartitionIds'],
          'registrar el linaje de la partición',
        );
        for (const sourcePartitionId of input$.sourcePartitionIds ?? []) {
          let ownerDatasetId = sourcePartitionOwner.get(sourcePartitionId);
          if (ownerDatasetId === undefined) {
            const sourcePartition = await this.runtimeRepo.findPartitionById(
              tx,
              sourcePartitionId,
            );
            if (
              !sourcePartition ||
              !input.sourceDatasetIds.includes(
                sourcePartition.lakehouseDatasetId,
              )
            ) {
              throw lakehouseOutsideTenant(
                'Partición de origen no encontrada.',
              );
            }
            ownerDatasetId = sourcePartition.lakehouseDatasetId;
            sourcePartitionOwner.set(sourcePartitionId, ownerDatasetId);
          }
          this.runtimeRepo.createLineageEdge(tx, {
            tenantId: input.tenantId,
            sourceDatasetId: ownerDatasetId,
            targetDatasetId: input.dataset.id,
            transformationRunId: input.runId,
            sourcePartitionId,
            targetPartitionId: partition.id,
          });
          lineageEdges += 1;
        }
      }
    }

    return {
      partitionsCommitted,
      partitionsSkipped,
      filesWritten,
      lineageEdges,
    };
  }

  /**
   * Sin umbral declarado, cualquier incidencia de una regla bloqueante cuarentena:
   * una regla que se declaró bloqueante sin decir cuánto se tolera es una regla
   * que no tolera nada.
   */
  private exceedsThreshold(issueCount: string, threshold?: string): boolean {
    if (!threshold) return BigInt(issueCount) > 0n;
    return Number(issueCount) > Number(threshold);
  }
}
