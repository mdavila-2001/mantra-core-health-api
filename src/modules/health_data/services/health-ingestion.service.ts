import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  HealthIngestionRepository,
  CanonicalResourcesRepository,
  HealthProvenanceRepository,
} from '../repositories';
import {
  OpenIngestionBatchDto,
  IngestionBatchResponseDto,
  RecordIngestionRecordDto,
  IngestionRecordResponseDto,
  CloseIngestionBatchDto,
  CloseBatchResponseDto,
  ProjectCanonicalResourceDto,
  CanonicalResourceVersionResponseDto,
} from '../dto';

/**
 * Ingesta y proyección canónica: lotes desde una conexión de origen, registros
 * crudos y su normalización a recurso canónico versionado
 * (UC-52-01 … 03).
 */
@Injectable()
export class HealthIngestionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ingestionRepo - Valor de ingestion repo requerido por la operación.
   * @param resourcesRepo - Valor de resources repo requerido por la operación.
   * @param provenanceRepo - Valor de provenance repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ingestionRepo: HealthIngestionRepository,
    private readonly resourcesRepo: CanonicalResourcesRepository,
    private readonly provenanceRepo: HealthProvenanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthIngestionService.name);
  }

  /**
   * UC-52-01: abrir el lote. Un mismo identificador en la misma conexión es el
   * mismo lote: reabrirlo duplicaría todo lo que trae dentro.
   */
  async openBatch(
    dto: OpenIngestionBatchDto,
    actor: AuthenticatedUser,
  ): Promise<IngestionBatchResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.batch.open',
        connectionId: dto.healthSourceConnectionId,
        batchIdentifier: dto.batchIdentifier,
      },
      'Opening ingestion batch',
    );

    return this.em.transactional(async (tx) => {
      const connection = await this.ingestionRepo.findConnectionForUpdate(
        tx,
        dto.healthSourceConnectionId,
      );
      if (!connection) {
        throw new ResourceNotFoundException(
          'Conexión de origen no encontrada',
          {
            healthSourceConnectionId: dto.healthSourceConnectionId,
          },
        );
      }
      if (connection.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La conexión de origen no está activa',
          {
            healthSourceConnectionId: dto.healthSourceConnectionId,
          },
        );
      }

      const existing = await this.ingestionRepo.findBatchByIdentifier(
        tx,
        dto.healthSourceConnectionId,
        dto.batchIdentifier,
      );
      if (existing) {
        return {
          id: existing.id,
          batchIdentifier: dto.batchIdentifier,
          statusConceptId: existing.statusConceptId,
          duplicate: true,
        };
      }

      const batch = this.ingestionRepo.createBatch(tx, {
        tenantId: dto.tenantId,
        healthSourceConnectionId: dto.healthSourceConnectionId,
        batchIdentifier: dto.batchIdentifier,
        ingestionModeConceptId: dto.ingestionModeConceptId,
        sourcePeriodStart: dto.sourcePeriodStart
          ? new Date(dto.sourcePeriodStart)
          : undefined,
        sourcePeriodEnd: dto.sourcePeriodEnd
          ? new Date(dto.sourcePeriodEnd)
          : undefined,
        payloadManifestFileId: dto.payloadManifestFileId,
        statusConceptId: CONCEPTS.BATCH_RECEIVING,
      });

      connection.lastSuccessAt = new Date();
      touch(connection, actor.id);

      return {
        id: batch.id,
        batchIdentifier: dto.batchIdentifier,
        statusConceptId: CONCEPTS.BATCH_RECEIVING,
        duplicate: false,
      };
    });
  }

  /**
   * UC-52-02: registrar un registro crudo del lote. Se deduplica por
   * `(lote, identificador de origen, versión de origen)`: el worker reintenta y
   * el mismo registro no debe encolarse dos veces.
   */
  async recordIngestionRecord(
    batchId: string,
    dto: RecordIngestionRecordDto,
  ): Promise<IngestionRecordResponseDto> {
    return this.em.transactional(async (tx) => {
      const batch = await this.ingestionRepo.findBatchForUpdate(tx, batchId);
      if (!batch) {
        throw new ResourceNotFoundException('Lote no encontrado', { batchId });
      }
      if (batch.statusConceptId !== CONCEPTS.BATCH_RECEIVING) {
        throw new PreconditionFailedException(
          'El lote ya no está recibiendo registros',
          {
            batchId,
          },
        );
      }

      const duplicate = await this.ingestionRepo.findRecordBySource(
        tx,
        batchId,
        dto.sourceRecordIdentifier,
        dto.sourceVersion,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          processingStatusConceptId: duplicate.processingStatusConceptId,
          duplicate: true,
        };
      }

      const record = this.ingestionRepo.createRecord(tx, {
        healthIngestionBatchId: batchId,
        sourceRecordIdentifier: dto.sourceRecordIdentifier,
        resourceTypeConceptId: dto.resourceTypeConceptId,
        sourceVersion: dto.sourceVersion,
        sourceLastUpdatedAt: dto.sourceLastUpdatedAt
          ? new Date(dto.sourceLastUpdatedAt)
          : undefined,
        payloadHash: dto.payloadHash,
        payloadFileId: dto.payloadFileId,
        validationStatusConceptId: CONCEPTS.RECORD_VALIDATION_PENDING,
        processingStatusConceptId: CONCEPTS.RECORD_QUEUED,
      });

      return {
        id: record.id,
        processingStatusConceptId: CONCEPTS.RECORD_QUEUED,
        duplicate: false,
      };
    });
  }

  /**
   * UC-52-02: cerrar el lote conciliando sus contadores contra la tabla de
   * registros. Los que declara el origen sirven de referencia, pero lo que se
   * guarda es lo que realmente entró.
   */
  async closeBatch(
    batchId: string,
    dto: CloseIngestionBatchDto,
  ): Promise<CloseBatchResponseDto> {
    this.logger.info(
      { operation: 'health-data.batch.close', batchId },
      'Closing ingestion batch',
    );

    return this.em.transactional(async (tx) => {
      const batch = await this.ingestionRepo.findBatchForUpdate(tx, batchId);
      if (!batch) {
        throw new ResourceNotFoundException('Lote no encontrado', { batchId });
      }
      // El lote se cierra una vez: reabrirlo cambiaría el contenido de algo que
      // ya se dio por completo aguas abajo.
      if (batch.statusConceptId !== CONCEPTS.BATCH_RECEIVING) {
        throw new ConflictException('El lote ya está cerrado', { batchId });
      }

      const records = await this.ingestionRepo.findRecordsByBatch(tx, batchId);
      const rejectedAtSource = dto.recordsRejected ?? 0;

      batch.statusConceptId = CONCEPTS.BATCH_COMPLETED;
      // Los contadores son `bigint`: viajan y se guardan como cadena para
      // que un lote grande no pierda precisión al pasar por `number`.
      batch.recordsReceived = String(records.length + rejectedAtSource);
      batch.recordsAccepted = String(records.length);
      batch.recordsRejected = String(rejectedAtSource);
      batch.contentHash = dto.contentHash;
      batch.completedAt = new Date();

      return {
        id: batchId,
        statusConceptId: CONCEPTS.BATCH_COMPLETED,
        recordsReceived: String(records.length + rejectedAtSource),
        recordsAccepted: String(records.length),
        recordsRejected: String(rejectedAtSource),
      };
    });
  }

  /**
   * UC-52-03: proyectar el registro crudo a recurso canónico y versionarlo.
   *
   * La versión es inmutable y el `content_hash` decide si hay algo nuevo: si el
   * payload normalizado es idéntico al vigente no se versiona, porque una
   * versión que no cambia nada sólo ensucia el historial y desplaza a la que sí
   * importa.
   */
  async projectResource(
    dto: ProjectCanonicalResourceDto,
    actor: AuthenticatedUser,
  ): Promise<CanonicalResourceVersionResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.resource.project',
        recordId: dto.healthIngestionRecordId,
        logicalIdentifier: dto.logicalIdentifier,
      },
      'Projecting canonical resource version',
    );

    return this.em.transactional(async (tx) => {
      const record = await this.ingestionRepo.findRecordForUpdate(
        tx,
        dto.healthIngestionRecordId,
      );
      if (!record) {
        throw new ResourceNotFoundException(
          'Registro de ingesta no encontrado',
          {
            healthIngestionRecordId: dto.healthIngestionRecordId,
          },
        );
      }
      if (record.processingStatusConceptId !== CONCEPTS.RECORD_QUEUED) {
        throw new PreconditionFailedException(
          'El registro no está en cola de proyección',
          {
            healthIngestionRecordId: dto.healthIngestionRecordId,
          },
        );
      }

      const contentHash = this.contentHash(dto.normalizedPayloadJson);
      let resource = await this.resourcesRepo.findResourceByLogicalIdForUpdate(
        tx,
        dto.custodianTenantId,
        record.resourceTypeConceptId,
        dto.logicalIdentifier,
      );
      const created = resource === null;

      if (!resource) {
        resource = this.resourcesRepo.createResource(tx, {
          custodianTenantId: dto.custodianTenantId,
          resourceTypeConceptId: record.resourceTypeConceptId,
          logicalIdentifier: dto.logicalIdentifier,
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          sourceSystemId: dto.sourceSystemId,
          lifecycleStatusConceptId: CONCEPTS.RESOURCE_ACTIVE,
          securityLabelsJson: dto.securityLabelsJson,
        });
      } else if (
        resource.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED
      ) {
        throw new PreconditionFailedException('El recurso está retirado', {
          resourceId: resource.id,
        });
      }

      const previous = created
        ? null
        : await this.resourcesRepo.findLatestVersion(tx, resource.id);

      if (previous?.contentHash === contentHash) {
        record.processingStatusConceptId = CONCEPTS.RECORD_PROJECTED;
        record.canonicalResourceId = resource.id;

        return {
          resourceId: resource.id,
          contentHash,
          created: false,
          unchanged: true,
        };
      }

      // La procedencia se escribe antes que la versión porque ésta la
      // referencia: la trazabilidad no es un añadido posterior.
      const provenance = this.provenanceRepo.createProvenanceRecord(tx, {
        custodianTenantId: dto.custodianTenantId,
        activityConceptId: CONCEPTS.PROV_INGEST,
        sourceSystemId: dto.sourceSystemId,
        responsibleAgentId: actor.id,
        contentHash,
      });

      const versionNumber = (previous?.versionNumber ?? 0) + 1;
      const version = this.resourcesRepo.createResourceVersion(tx, {
        canonicalHealthResourceId: resource.id,
        versionNumber,
        healthIngestionRecordId: record.id,
        effectiveStartAt: dto.effectiveStartAt
          ? new Date(dto.effectiveStartAt)
          : undefined,
        changeTypeConceptId: previous
          ? CONCEPTS.RESOURCE_CHANGE_UPDATE
          : CONCEPTS.RESOURCE_CHANGE_CREATE,
        payloadFormatConceptId: dto.payloadFormatConceptId,
        normalizedPayloadJson: dto.normalizedPayloadJson,
        originalPayloadFileId: dto.originalPayloadFileId,
        contentHash,
        provenanceRecordId: provenance.id,
        supersedesVersionId: previous?.id,
      });

      this.provenanceRepo.createProvenanceTarget(tx, {
        healthProvenanceRecordId: provenance.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_RESOURCE_VERSION,
        targetId: version.id,
      });
      this.provenanceRepo.createLineageEdge(tx, {
        tenantId: dto.custodianTenantId,
        sourceTypeConceptId: CONCEPTS.HD_ENTITY_INGESTION_RECORD,
        sourceId: record.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_RESOURCE_VERSION,
        targetId: version.id,
        transformationTypeConceptId: CONCEPTS.LINEAGE_NORMALIZE,
        contentHash,
      });

      resource.currentVersionId = version.id;
      resource.patientProfileId ??= dto.patientProfileId;
      resource.encounterId ??= dto.encounterId;
      resource.updatedAt = new Date();

      record.processingStatusConceptId = CONCEPTS.RECORD_PROJECTED;
      record.canonicalResourceId = resource.id;

      return {
        resourceId: resource.id,
        versionId: version.id,
        versionNumber,
        contentHash,
        created,
        unchanged: false,
        provenanceRecordId: provenance.id,
      };
    });
  }

  // --- Apoyo ---

  /** Hash del payload con las claves ordenadas: identifica el contenido, no su orden. */
  private contentHash(payload: unknown): string {
    return createHash('sha256')
      .update(this.canonicalise(payload))
      .digest('hex');
  }

  /**
   * Obtiene canonicalise.
   *
   * @param value - Valor de value requerido por la operación.
   * @returns Resultado de canonicalise conforme al contrato `string`.
   */
  private canonicalise(value: unknown): string {
    if (value === null || typeof value !== 'object')
      return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalise(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        ([key, item]) => `${JSON.stringify(key)}:${this.canonicalise(item)}`,
      );

    return `{${entries.join(',')}}`;
  }
}
