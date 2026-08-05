import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  StorageBackendsRepository,
  DatasetsRepository,
  StoragePoliciesRepository,
} from '../repositories';
import {
  BACKEND_STATE,
  CAPABILITY_VERIFICATION,
  COLLECTION_LIFECYCLE,
  DATASET_LIFECYCLE,
  POLICY_STATE,
  REGION_STATE,
  VERSION_STATE,
} from '../constants';
import {
  RegisterBackendDto,
  BackendResponseDto,
  DefineCollectionDto,
  CollectionResponseDto,
  DefineConsistencyPolicyDto,
  PolicyResponseDto,
  DefineEncryptionProfileDto,
  EncryptionProfileResponseDto,
  DefineStoragePoliciesDto,
  StoragePoliciesResponseDto,
} from '../dto';

/**
 * Gobierno de la infraestructura: backends con sus regiones y capacidades,
 * colecciones físicas con su esquema, y las políticas que después evalúa una
 * colocación (UC-54-01, 04, 06, 09, 10).
 */
@Injectable()
export class StorageGovernanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param backendsRepo - Valor de backends repo requerido por la operación.
   * @param datasetsRepo - Valor de datasets repo requerido por la operación.
   * @param policiesRepo - Valor de policies repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly backendsRepo: StorageBackendsRepository,
    private readonly datasetsRepo: DatasetsRepository,
    private readonly policiesRepo: StoragePoliciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StorageGovernanceService.name);
  }

  /**
   * UC-54-01: registrar el backend con sus regiones y capacidades.
   *
   * Nace en `REGISTERED`, no en `ACTIVE`: declarar un motor no es lo mismo que
   * haber comprobado que responde. Sus capacidades nacen sin verificar por la
   * misma razón — lo que dice soportar y lo que soporta son cosas distintas
   * hasta que alguien lo prueba.
   */
  async registerBackend(dto: RegisterBackendDto): Promise<BackendResponseDto> {
    this.logger.info(
      { operation: 'polyglot.backend.register', code: dto.code },
      'Registering storage backend',
    );

    // Dos regiones primarias dejarían sin decidir dónde escribe por defecto.
    const primaries = dto.regions.filter((region) => region.isPrimary);
    if (primaries.length > 1) {
      throw new PreconditionFailedException(
        'Sólo una región puede ser la primaria',
        {
          code: dto.code,
          primaries: primaries.length,
        },
      );
    }
    this.assertUnique(
      dto.regions.map((region) => region.regionCode),
      'La región está repetida',
      dto.code,
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.backendsRepo.findBackendByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe un backend con ese código', {
          code: dto.code,
        });
      }

      const backend = this.backendsRepo.createBackend(tx, {
        code: dto.code,
        name: dto.name,
        backendType: dto.backendType,
        providerCode: dto.providerCode,
        controlPlaneEndpoint: dto.controlPlaneEndpoint,
        supportsTransactions: dto.supportsTransactions ?? false,
        supportsTtl: dto.supportsTtl ?? false,
        supportsEncryption: dto.supportsEncryption ?? false,
        supportsVersioning: dto.supportsVersioning ?? false,
        supportsWorm: dto.supportsWorm ?? false,
        supportsVectorSearch: dto.supportsVectorSearch ?? false,
        supportsFullText: dto.supportsFullText ?? false,
        state: BACKEND_STATE.REGISTERED,
      });

      const regionIds = dto.regions.map(
        (region) =>
          this.backendsRepo.createRegion(tx, {
            storageBackendId: backend.id,
            regionCode: region.regionCode,
            countryCode: region.countryCode,
            jurisdictionCode: region.jurisdictionCode,
            endpointUri: region.endpointUri,
            isPrimary: region.isPrimary ?? false,
            state: REGION_STATE.ACTIVE,
          }).id,
      );

      let capabilityCount = 0;
      for (const capability of dto.capabilities ?? []) {
        this.backendsRepo.createCapability(tx, {
          storageBackendId: backend.id,
          capabilityCode: capability.capabilityCode,
          capabilityVersion: capability.capabilityVersion,
          configurationJson: capability.configurationJson,
          verificationStatus: CAPABILITY_VERIFICATION.PENDING,
        });
        capabilityCount += 1;
      }

      return {
        id: backend.id,
        code: dto.code,
        state: BACKEND_STATE.REGISTERED,
        regionIds,
        capabilityCount,
      };
    });
  }

  /**
   * UC-54-04: definir la colección física y su esquema versionado.
   *
   * Exige dataset activo y backend disponible: materializar una colección para
   * un dataset que todavía es borrador ataría almacenamiento a algo que aún
   * puede cambiar de forma.
   */
  async defineCollection(
    dto: DefineCollectionDto,
  ): Promise<CollectionResponseDto> {
    return this.em.transactional(async (tx) => {
      const dataset = await this.datasetsRepo.findDatasetById(
        tx,
        dto.datasetDefinitionId,
      );
      if (!dataset) {
        throw new ResourceNotFoundException('Dataset no encontrado', {
          datasetDefinitionId: dto.datasetDefinitionId,
        });
      }
      if (dataset.lifecycleState !== DATASET_LIFECYCLE.ACTIVE) {
        throw new PreconditionFailedException('El dataset no está activo', {
          datasetDefinitionId: dto.datasetDefinitionId,
          lifecycleState: dataset.lifecycleState,
        });
      }

      const backend = await this.backendsRepo.findBackendById(
        tx,
        dto.storageBackendId,
      );
      if (!backend) {
        throw new ResourceNotFoundException('Backend no encontrado', {
          storageBackendId: dto.storageBackendId,
        });
      }

      const version = await this.datasetsRepo.findDatasetVersionById(
        tx,
        dto.datasetVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión del dataset no encontrada',
          {
            datasetVersionId: dto.datasetVersionId,
          },
        );
      }
      if (version.datasetDefinitionId !== dto.datasetDefinitionId) {
        throw new PreconditionFailedException(
          'La versión pertenece a otro dataset',
          {
            datasetVersionId: dto.datasetVersionId,
          },
        );
      }

      const duplicate = await this.datasetsRepo.findCollectionByName(
        tx,
        dto.storageBackendId,
        dto.logicalName,
      );
      if (duplicate) {
        throw new ConflictException(
          'El backend ya tiene una colección con ese nombre',
          {
            storageBackendId: dto.storageBackendId,
            logicalName: dto.logicalName,
          },
        );
      }

      const collection = this.datasetsRepo.createCollection(tx, {
        storageBackendId: dto.storageBackendId,
        datasetDefinitionId: dto.datasetDefinitionId,
        logicalName: dto.logicalName,
        physicalNamePattern: dto.physicalNamePattern,
        partitioningStrategy: dto.partitioningStrategy,
        tenantIsolationMode: dto.tenantIsolationMode,
        routingKeyExpression: dto.routingKeyExpression,
        shardKeyExpression: dto.shardKeyExpression,
        lifecycleState: COLLECTION_LIFECYCLE.DRAFT,
      });

      const schemaVersion = this.datasetsRepo.createSchemaVersion(tx, {
        collectionDefinitionId: collection.id,
        datasetVersionId: dto.datasetVersionId,
        schemaVersion: dto.schemaVersion,
        validationMode: dto.validationMode,
        schemaDocumentJson: dto.schemaDocumentJson,
        migrationStrategy: dto.migrationStrategy,
        effectiveFrom: new Date(),
        state: VERSION_STATE.ACTIVE,
      });

      return {
        id: collection.id,
        logicalName: dto.logicalName,
        lifecycleState: COLLECTION_LIFECYCLE.DRAFT,
        schemaVersionId: schemaVersion.id,
      };
    });
  }

  /**
   * UC-54-06: definir la política de consistencia.
   *
   * Exigir leer lo propio recién escrito y a la vez tolerar lecturas rancias es
   * una contradicción: la primera condición sólo se cumple con tolerancia cero.
   */
  async defineConsistencyPolicy(
    dto: DefineConsistencyPolicyDto,
  ): Promise<PolicyResponseDto> {
    const tolerance = dto.staleReadToleranceSeconds ?? 0;
    if (dto.requiresReadYourWrites && tolerance > 0) {
      throw new PreconditionFailedException(
        'Exigir leer lo propio recién escrito obliga a tolerancia cero de lectura rancia',
        { code: dto.code, staleReadToleranceSeconds: tolerance },
      );
    }

    return this.em.transactional(async (tx) => {
      const duplicate = await this.policiesRepo.findConsistencyPolicyByCode(
        tx,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una política de consistencia con ese código',
          {
            code: dto.code,
          },
        );
      }

      const policy = this.policiesRepo.createConsistencyPolicy(tx, {
        code: dto.code,
        readConsistency: dto.readConsistency,
        writeConsistency: dto.writeConsistency,
        conflictResolution: dto.conflictResolution,
        staleReadToleranceSeconds: tolerance,
        requiresReadYourWrites: dto.requiresReadYourWrites ?? false,
        state: POLICY_STATE.ACTIVE,
      });

      return { id: policy.id, code: dto.code, state: POLICY_STATE.ACTIVE };
    });
  }

  /**
   * UC-54-09: definir el perfil de cifrado con su política de rotación.
   *
   * La referencia de la clave apunta al KMS; la clave misma nunca pasa por
   * aquí. La rotación se crea o se reutiliza por código, para que dos perfiles
   * puedan compartir la misma cadencia sin duplicarla.
   */
  async defineEncryptionProfile(
    dto: DefineEncryptionProfileDto,
  ): Promise<EncryptionProfileResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.policiesRepo.findEncryptionProfileByCode(
        tx,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe un perfil de cifrado con ese código',
          {
            code: dto.code,
          },
        );
      }

      let rotationPolicyId: string | undefined;
      if (dto.rotationPolicy) {
        const existing = await this.policiesRepo.findRotationPolicyByCode(
          tx,
          dto.rotationPolicy.code,
        );
        rotationPolicyId =
          existing?.id ??
          this.policiesRepo.createRotationPolicy(tx, {
            code: dto.rotationPolicy.code,
            rotationIntervalDays: dto.rotationPolicy.rotationIntervalDays,
            overlapDays: dto.rotationPolicy.overlapDays ?? 0,
            reencryptExistingData:
              dto.rotationPolicy.reencryptExistingData ?? false,
            emergencyRotationEnabled:
              dto.rotationPolicy.emergencyRotationEnabled ?? false,
            state: POLICY_STATE.ACTIVE,
          }).id;
      }

      const profile = this.policiesRepo.createEncryptionProfile(tx, {
        code: dto.code,
        algorithm: dto.algorithm,
        keyManagementProvider: dto.keyManagementProvider,
        keyReference: dto.keyReference,
        envelopeEncryption: dto.envelopeEncryption ?? true,
        fieldLevelEncryption: dto.fieldLevelEncryption ?? false,
        deterministicFieldsJson: dto.deterministicFieldsJson,
        rotationPolicyId,
        state: POLICY_STATE.ACTIVE,
      });

      return {
        id: profile.id,
        code: dto.code,
        state: POLICY_STATE.ACTIVE,
        rotationPolicyId,
      };
    });
  }

  /**
   * UC-54-10: definir residencia, replicación y retención.
   *
   * Van en un solo endpoint porque el caso de uso las declara en la misma
   * transacción: son las tres caras de la misma decisión de gobierno sobre
   * dónde vive el dato, cuántas copias hay y cuánto se conserva.
   */
  async defineStoragePolicies(
    dto: DefineStoragePoliciesDto,
  ): Promise<StoragePoliciesResponseDto> {
    if (!dto.residency && !dto.replication && !dto.retention) {
      throw new PreconditionFailedException(
        'Hay que declarar al menos una política',
        {},
      );
    }

    // Prohibir la réplica entre regiones y a la vez no acotar países deja la
    // restricción sin efecto: no habría nada que impidiera colocar fuera.
    if (
      dto.replication &&
      dto.replication.crossRegionEnabled === false &&
      dto.residency &&
      (dto.residency.allowedCountryCodes ?? []).length === 0
    ) {
      throw new PreconditionFailedException(
        'Prohibir la réplica entre regiones exige declarar los países permitidos',
        { replicationCode: dto.replication.code },
      );
    }

    return this.em.transactional(async (tx) => {
      let residencyPolicyId: string | undefined;
      let replicationPolicyId: string | undefined;
      let retentionPolicyId: string | undefined;
      let created = 0;

      if (dto.residency) {
        const duplicate = await this.policiesRepo.findResidencyPolicyByCode(
          tx,
          dto.residency.code,
        );
        if (duplicate) {
          throw new ConflictException(
            'Ya existe una política de residencia con ese código',
            {
              code: dto.residency.code,
            },
          );
        }

        residencyPolicyId = this.policiesRepo.createResidencyPolicy(tx, {
          code: dto.residency.code,
          allowedCountryCodes: dto.residency.allowedCountryCodes,
          forbiddenCountryCodes: dto.residency.forbiddenCountryCodes,
          allowedRegionCodes: dto.residency.allowedRegionCodes,
          requiresInCountryBackup:
            dto.residency.requiresInCountryBackup ?? false,
          crossBorderTransferBasis: dto.residency.crossBorderTransferBasis,
          state: POLICY_STATE.ACTIVE,
        }).id;
        created += 1;
      }

      if (dto.replication) {
        const duplicate = await this.policiesRepo.findReplicationPolicyByCode(
          tx,
          dto.replication.code,
        );
        if (duplicate) {
          throw new ConflictException(
            'Ya existe una política de replicación con ese código',
            {
              code: dto.replication.code,
            },
          );
        }

        replicationPolicyId = this.policiesRepo.createReplicationPolicy(tx, {
          code: dto.replication.code,
          replicaCount: dto.replication.replicaCount,
          replicationMode: dto.replication.replicationMode,
          crossRegionEnabled: dto.replication.crossRegionEnabled ?? false,
          maxReplicationLagSeconds: dto.replication.maxReplicationLagSeconds,
          failoverMode: dto.replication.failoverMode,
          state: POLICY_STATE.ACTIVE,
        }).id;
        created += 1;
      }

      if (dto.retention) {
        const duplicate = await this.policiesRepo.findRetentionPolicyByCode(
          tx,
          dto.retention.code,
        );
        if (duplicate) {
          throw new ConflictException(
            'Ya existe una política de retención con ese código',
            {
              code: dto.retention.code,
            },
          );
        }

        retentionPolicyId = this.policiesRepo.createRetentionPolicy(tx, {
          code: dto.retention.code,
          retentionDays: dto.retention.retentionDays,
          archiveAfterDays: dto.retention.archiveAfterDays,
          deletionMode: dto.retention.deletionMode,
          legalHoldOverridesDeletion:
            dto.retention.legalHoldOverridesDeletion ?? true,
          jurisdictionCode: dto.retention.jurisdictionCode,
          state: POLICY_STATE.ACTIVE,
        }).id;
        created += 1;
      }

      return {
        residencyPolicyId,
        replicationPolicyId,
        retentionPolicyId,
        created,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Valida assert unique.
   *
   * @param values - Valor de values requerido por la operación.
   * @param message - Valor de message requerido por la operación.
   * @param code - Valor de code requerido por la operación.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertUnique(values: string[], message: string, code: string): void {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) {
        throw new PreconditionFailedException(message, { code, value });
      }
      seen.add(value);
    }
  }
}
