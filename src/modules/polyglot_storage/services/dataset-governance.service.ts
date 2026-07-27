import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  DatasetsRepository,
  PlacementsRepository,
  StorageBackendsRepository,
  StoragePoliciesRepository,
} from '../repositories';
import {
  BINDING_STATE,
  COMPATIBILITY_MODE,
  DATASET_LIFECYCLE,
  INITIAL_DATASET_VERSION,
  PLACEMENT_ROLE,
  PLACEMENT_STATE,
  POLICY_STATE,
  VERSION_STATE,
} from '../constants';
import {
  DefineDatasetDto,
  DatasetResponseDto,
  PublishDatasetVersionDto,
  DatasetVersionResponseDto,
  ApprovePlacementDto,
  PlacementResponseDto,
  DefineAccessPolicyDto,
  AccessPolicyResponseDto,
  BindTenantStorageDto,
  TenantBindingResponseDto,
} from '../dto';

/**
 * Gobierno del dato: datasets con sus versiones, aprobación de colocaciones,
 * políticas de acceso y vínculo del tenant
 * (UC-54-02, 03, 05, 07, 08).
 */
@Injectable()
export class DatasetGovernanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly datasetsRepo: DatasetsRepository,
    private readonly placementsRepo: PlacementsRepository,
    private readonly backendsRepo: StorageBackendsRepository,
    private readonly policiesRepo: StoragePoliciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DatasetGovernanceService.name);
  }

  /** UC-54-02: definir el dataset y su versión 1.0.0 en la misma transacción. */
  async defineDataset(dto: DefineDatasetDto): Promise<DatasetResponseDto> {
    this.logger.info(
      { operation: 'polyglot.dataset.define', code: dto.code },
      'Defining governed dataset',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.datasetsRepo.findDatasetByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe un dataset con ese código', {
          code: dto.code,
        });
      }

      const classification = await this.datasetsRepo.findClassificationById(
        tx,
        dto.dataClassificationId,
      );
      if (!classification) {
        throw new ResourceNotFoundException(
          'Clasificación de datos no encontrada',
          {
            dataClassificationId: dto.dataClassificationId,
          },
        );
      }

      const dataset = this.datasetsRepo.createDataset(tx, {
        code: dto.code,
        name: dto.name,
        owningModuleCode: dto.owningModuleCode,
        dataClassificationId: dto.dataClassificationId,
        sourceOfTruth: dto.sourceOfTruth,
        canonicalEntityType: dto.canonicalEntityType,
        lifecycleState: DATASET_LIFECYCLE.DRAFT,
      });

      // La primera versión no tiene con qué ser compatible.
      const version = this.datasetsRepo.createDatasetVersion(tx, {
        datasetDefinitionId: dataset.id,
        version: INITIAL_DATASET_VERSION,
        schemaFingerprint: dto.schemaFingerprint,
        compatibilityMode: COMPATIBILITY_MODE.NONE,
        schemaDocumentFileId: dto.schemaDocumentFileId,
        effectiveFrom: new Date(),
        state: VERSION_STATE.DRAFT,
      });

      return {
        id: dataset.id,
        code: dto.code,
        lifecycleState: DATASET_LIFECYCLE.DRAFT,
        initialVersionId: version.id,
        initialVersion: INITIAL_DATASET_VERSION,
      };
    });
  }

  /**
   * UC-54-03: publicar una versión nueva del dataset.
   *
   * La primera publicación activa el dataset. La versión anterior queda
   * superseded en la misma transacción: dos versiones vigentes dejarían sin
   * decidir contra cuál esquema validar una escritura.
   */
  async publishDatasetVersion(
    datasetId: string,
    dto: PublishDatasetVersionDto,
  ): Promise<DatasetVersionResponseDto> {
    this.logger.info(
      {
        operation: 'polyglot.dataset.version',
        datasetId,
        version: dto.version,
      },
      'Publishing dataset version',
    );

    return this.em.transactional(async (tx) => {
      const dataset = await this.datasetsRepo.findDatasetForUpdate(
        tx,
        datasetId,
      );
      if (!dataset) {
        throw new ResourceNotFoundException('Dataset no encontrado', {
          datasetId,
        });
      }

      const duplicate = await this.datasetsRepo.findDatasetVersion(
        tx,
        datasetId,
        dto.version,
      );
      if (duplicate) {
        throw new ConflictException('El dataset ya tiene esa versión', {
          datasetId,
          version: dto.version,
        });
      }

      // La primera versión declara NONE porque no hay predecesora; a partir de
      // la segunda, decir NONE es declarar una ruptura sin decirlo.
      const previous =
        await this.datasetsRepo.findActiveDatasetVersionForUpdate(
          tx,
          datasetId,
          VERSION_STATE.ACTIVE,
        );
      if (previous && dto.compatibilityMode === COMPATIBILITY_MODE.NONE) {
        throw new PreconditionFailedException(
          'Una versión que sucede a otra debe declarar su compatibilidad',
          { datasetId, version: dto.version },
        );
      }

      const now = new Date();
      if (previous) {
        previous.state = VERSION_STATE.SUPERSEDED;
        previous.effectiveTo = now;
      }

      const version = this.datasetsRepo.createDatasetVersion(tx, {
        datasetDefinitionId: datasetId,
        version: dto.version,
        schemaFingerprint: dto.schemaFingerprint,
        compatibilityMode: dto.compatibilityMode,
        schemaDocumentFileId: dto.schemaDocumentFileId,
        effectiveFrom: now,
        state: VERSION_STATE.ACTIVE,
      });

      dataset.lifecycleState = DATASET_LIFECYCLE.ACTIVE;
      dataset.updatedAt = now;

      return {
        id: version.id,
        version: dto.version,
        state: VERSION_STATE.ACTIVE,
        datasetLifecycleState: DATASET_LIFECYCLE.ACTIVE,
        supersededVersionId: previous?.id,
      };
    });
  }

  /**
   * UC-54-05: aprobar la colocación.
   *
   * Es la puerta de gobierno del módulo: **residencia, clasificación, cifrado y
   * aislamiento tienen que cumplirse a la vez**. Aprobar con una sola de ellas
   * incumplida basta para colocar datos de paciente en un país donde no pueden
   * estar, que es exactamente lo que este caso de uso existe para impedir.
   */
  async approvePlacement(
    dto: ApprovePlacementDto,
  ): Promise<PlacementResponseDto> {
    this.logger.info(
      {
        operation: 'polyglot.placement.approve',
        datasetVersionId: dto.datasetVersionId,
        regionId: dto.storageBackendRegionId,
      },
      'Approving dataset placement',
    );

    const placementRole = dto.placementRole ?? PLACEMENT_ROLE.PRIMARY;

    return this.em.transactional(async (tx) => {
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
      if (version.state !== VERSION_STATE.ACTIVE) {
        throw new PreconditionFailedException(
          'La versión del dataset no está activa',
          {
            datasetVersionId: dto.datasetVersionId,
            state: version.state,
          },
        );
      }

      const existing = await this.placementsRepo.findPlacement(
        tx,
        dto.datasetVersionId,
        dto.storageBackendRegionId,
        placementRole,
      );
      if (existing) {
        return {
          id: existing.id,
          state: existing.state,
          placementRole,
          duplicate: true,
        };
      }

      const collection = await this.datasetsRepo.findCollectionById(
        tx,
        dto.collectionDefinitionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada', {
          collectionDefinitionId: dto.collectionDefinitionId,
        });
      }

      const region = await this.backendsRepo.findRegionById(
        tx,
        dto.storageBackendRegionId,
      );
      if (!region) {
        throw new ResourceNotFoundException('Región no encontrada', {
          storageBackendRegionId: dto.storageBackendRegionId,
        });
      }

      const residency = await this.policiesRepo.findResidencyPolicyById(
        tx,
        dto.residencyPolicyId,
      );
      if (!residency) {
        throw new ResourceNotFoundException(
          'Política de residencia no encontrada',
          {
            residencyPolicyId: dto.residencyPolicyId,
          },
        );
      }

      const encryption = await this.policiesRepo.findEncryptionProfileById(
        tx,
        dto.encryptionProfileId,
      );
      if (!encryption) {
        throw new ResourceNotFoundException('Perfil de cifrado no encontrado', {
          encryptionProfileId: dto.encryptionProfileId,
        });
      }

      const dataset = await this.datasetsRepo.findDatasetById(
        tx,
        version.datasetDefinitionId,
      );
      const classification = dataset
        ? await this.datasetsRepo.findClassificationById(
            tx,
            dataset.dataClassificationId,
          )
        : null;

      this.assertResidency(residency, region, dto);
      // Un dataset con datos de paciente exige cifrado a nivel de campo: el
      // cifrado en reposo del disco no protege de quien tiene acceso al motor.
      if (classification?.containsPhi && !encryption.fieldLevelEncryption) {
        throw new PreconditionFailedException(
          'Un dataset con datos de paciente exige cifrado a nivel de campo',
          {
            datasetVersionId: dto.datasetVersionId,
            encryptionProfileId: dto.encryptionProfileId,
          },
        );
      }

      const placement = this.placementsRepo.createPlacement(tx, {
        datasetVersionId: dto.datasetVersionId,
        storageBackendRegionId: dto.storageBackendRegionId,
        collectionDefinitionId: dto.collectionDefinitionId,
        placementRole,
        residencyPolicyId: dto.residencyPolicyId,
        replicationPolicyId: dto.replicationPolicyId,
        consistencyPolicyId: dto.consistencyPolicyId,
        encryptionProfileId: dto.encryptionProfileId,
        state: PLACEMENT_STATE.APPROVED,
      });

      return {
        id: placement.id,
        state: PLACEMENT_STATE.APPROVED,
        placementRole,
        duplicate: false,
      };
    });
  }

  /** UC-54-07: definir la política de acceso al dato del dataset. */
  async defineAccessPolicy(
    datasetId: string,
    dto: DefineAccessPolicyDto,
  ): Promise<AccessPolicyResponseDto> {
    return this.em.transactional(async (tx) => {
      const dataset = await this.datasetsRepo.findDatasetById(tx, datasetId);
      if (!dataset) {
        throw new ResourceNotFoundException('Dataset no encontrado', {
          datasetId,
        });
      }
      if (dataset.lifecycleState !== DATASET_LIFECYCLE.ACTIVE) {
        throw new PreconditionFailedException('El dataset no está activo', {
          datasetId,
        });
      }

      const duplicate = await this.datasetsRepo.findAccessPolicy(
        tx,
        datasetId,
        dto.purposeOfUseCode,
        dto.principalType,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una política para ese propósito y tipo de principal',
          { datasetId, purposeOfUseCode: dto.purposeOfUseCode },
        );
      }

      const policy = this.datasetsRepo.createAccessPolicy(tx, {
        datasetDefinitionId: datasetId,
        purposeOfUseCode: dto.purposeOfUseCode,
        principalType: dto.principalType,
        fieldPolicyJson: dto.fieldPolicyJson,
        rowFilterExpression: dto.rowFilterExpression,
        maskingProfileCode: dto.maskingProfileCode,
        state: POLICY_STATE.ACTIVE,
      });

      return {
        id: policy.id,
        datasetDefinitionId: datasetId,
        state: POLICY_STATE.ACTIVE,
      };
    });
  }

  /**
   * UC-54-08: atar el tenant a su colocación.
   *
   * Es lo que activa la colocación: aprobada significa "cumple el gobierno",
   * activada significa "hay alguien escribiendo aquí". Sin vínculo no debe
   * escribirse nada en el backend.
   */
  async bindTenantStorage(
    tenantId: string,
    dto: BindTenantStorageDto,
  ): Promise<TenantBindingResponseDto> {
    this.logger.info(
      {
        operation: 'polyglot.tenant.bind',
        tenantId,
        datasetId: dto.datasetDefinitionId,
      },
      'Binding tenant to storage placement',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.placementsRepo.findBinding(
        tx,
        tenantId,
        dto.datasetDefinitionId,
      );
      if (duplicate) {
        throw new ConflictException(
          'El tenant ya está vinculado a ese dataset',
          {
            tenantId,
            datasetDefinitionId: dto.datasetDefinitionId,
          },
        );
      }

      const primary = await this.placementsRepo.findPlacementForUpdate(
        tx,
        dto.primaryPlacementId,
      );
      if (!primary) {
        throw new ResourceNotFoundException(
          'Colocación primaria no encontrada',
          {
            primaryPlacementId: dto.primaryPlacementId,
          },
        );
      }
      if (
        primary.state !== PLACEMENT_STATE.APPROVED &&
        primary.state !== PLACEMENT_STATE.ACTIVATED
      ) {
        throw new PreconditionFailedException(
          'La colocación primaria no está aprobada',
          {
            primaryPlacementId: dto.primaryPlacementId,
            state: primary.state,
          },
        );
      }

      if (dto.secondaryPlacementId) {
        const secondary = await this.placementsRepo.findPlacementById(
          tx,
          dto.secondaryPlacementId,
        );
        if (!secondary) {
          throw new ResourceNotFoundException(
            'Colocación secundaria no encontrada',
            {
              secondaryPlacementId: dto.secondaryPlacementId,
            },
          );
        }
        if (secondary.id === primary.id) {
          throw new PreconditionFailedException(
            'La colocación secundaria no puede ser la misma que la primaria',
            { primaryPlacementId: dto.primaryPlacementId },
          );
        }
      }

      const binding = this.placementsRepo.createBinding(tx, {
        tenantId,
        datasetDefinitionId: dto.datasetDefinitionId,
        primaryPlacementId: dto.primaryPlacementId,
        secondaryPlacementId: dto.secondaryPlacementId,
        tenantPartitionKey: dto.tenantPartitionKey,
        tenantEncryptionKeyRef: dto.tenantEncryptionKeyRef,
        state: BINDING_STATE.ACTIVE,
      });

      primary.state = PLACEMENT_STATE.ACTIVATED;

      return {
        id: binding.id,
        tenantId,
        state: BINDING_STATE.ACTIVE,
        primaryPlacementState: PLACEMENT_STATE.ACTIVATED,
      };
    });
  }

  // --- Apoyo ---

  /**
   * La residencia se comprueba contra el país **y** la región de la ubicación
   * física. Prohibido gana sobre permitido: una lista de permitidos por
   * descuido no debe habilitar un país explícitamente vetado.
   */
  private assertResidency(
    residency: {
      allowedCountryCodes?: string[];
      forbiddenCountryCodes?: string[];
      allowedRegionCodes?: string[];
    },
    region: { countryCode: string; regionCode: string },
    dto: ApprovePlacementDto,
  ): void {
    const forbidden = residency.forbiddenCountryCodes ?? [];
    if (forbidden.includes(region.countryCode)) {
      throw new PreconditionFailedException(
        'La política de residencia prohíbe ese país',
        {
          countryCode: region.countryCode,
          residencyPolicyId: dto.residencyPolicyId,
        },
      );
    }

    const allowedCountries = residency.allowedCountryCodes ?? [];
    if (
      allowedCountries.length > 0 &&
      !allowedCountries.includes(region.countryCode)
    ) {
      throw new PreconditionFailedException(
        'El país de la región no está entre los permitidos por la residencia',
        {
          countryCode: region.countryCode,
          residencyPolicyId: dto.residencyPolicyId,
        },
      );
    }

    const allowedRegions = residency.allowedRegionCodes ?? [];
    if (
      allowedRegions.length > 0 &&
      !allowedRegions.includes(region.regionCode)
    ) {
      throw new PreconditionFailedException(
        'La región no está entre las permitidas por la residencia',
        {
          regionCode: region.regionCode,
          residencyPolicyId: dto.residencyPolicyId,
        },
      );
    }
  }
}
