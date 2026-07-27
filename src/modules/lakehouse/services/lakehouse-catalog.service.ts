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
import { LakehouseCatalogRepository } from '../repositories';
import {
  DefineZoneDto,
  ZoneResponseDto,
  RegisterCatalogDto,
  CatalogResponseDto,
  PublishProductVersionDto,
  ProductVersionResponseDto,
  RegisterDatasetDto,
  DatasetResponseDto,
} from '../dto';

/**
 * Catálogo del lakehouse (UC-63-01 … 04): dónde vive el dato, contra qué
 * metastore, qué contrato promete cada producto y qué tabla física lo
 * materializa.
 */
@Injectable()
export class LakehouseCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: LakehouseCatalogRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LakehouseCatalogService.name);
  }

  /** UC-63-01: definir una zona del lago. */
  async defineZone(
    dto: DefineZoneDto,
    actor: AuthenticatedUser,
  ): Promise<ZoneResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.catalogRepo.findZoneByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe una zona con ese código.', {
          code: dto.code,
        });
      }

      const zone = this.catalogRepo.createZone(tx, {
        code: dto.code,
        name: dto.name,
        zoneType: dto.zoneType,
        namespaceId: dto.namespaceId,
        encryptionProfileCode: dto.encryptionProfileCode,
        retentionPolicyCode: dto.retentionPolicyCode,
        state: 'active',
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'LakeZoneDefined',
        aggregateType: 'lakehouse.data_lake_zones',
        aggregateId: zone.id,
        payloadJson: { code: zone.code, zoneType: zone.zoneType },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'lakehouse.zone.define',
          zoneId: zone.id,
          zoneType: zone.zoneType,
        },
        'Zona del data lake definida',
      );

      return {
        id: zone.id,
        code: zone.code,
        zoneType: zone.zoneType,
        state: zone.state,
      };
    });
  }

  /** UC-63-02: registrar el catálogo / metastore. */
  async registerCatalog(
    dto: RegisterCatalogDto,
    actor: AuthenticatedUser,
  ): Promise<CatalogResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.catalogRepo.findCatalogByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe un catálogo con ese código.', {
          code: dto.code,
        });
      }

      const catalog = this.catalogRepo.createCatalog(tx, {
        code: dto.code,
        catalogType: dto.catalogType,
        metastoreUri: dto.metastoreUri,
        defaultFormat: dto.defaultFormat,
        defaultCompression: dto.defaultCompression,
        state: 'active',
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'LakehouseCatalogRegistered',
        aggregateType: 'lakehouse.lakehouse_catalogs',
        aggregateId: catalog.id,
        payloadJson: { code: catalog.code, catalogType: catalog.catalogType },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'lakehouse.catalog.register', catalogId: catalog.id },
        'Catálogo del lakehouse registrado',
      );

      return { id: catalog.id, code: catalog.code, state: catalog.state };
    });
  }

  /**
   * UC-63-03: publicar el producto de datos y su versión.
   *
   * El caso de uso declara `data_products — UPSERT` y a la vez pone el id del
   * producto en la ruta, así que la operación hace las dos cosas: si el producto
   * existe se actualiza, y si no, se crea con ese id. Es lo que permite publicar
   * la primera versión de un producto nuevo sin una llamada previa que el modelo
   * no declara.
   *
   * Publicar una versión **supersede** la vigente. Dos activas dejarían sin decidir
   * qué contrato promete el producto, que es lo único que un consumidor puede
   * asumir.
   */
  async publishProductVersion(
    productId: string,
    dto: PublishProductVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ProductVersionResponseDto> {
    return this.em.transactional(async (tx) => {
      let product = await this.catalogRepo.findProductForUpdate(tx, productId);
      if (!product) {
        // El código es la clave natural: si ya hay un producto con él, el id de la
        // ruta está equivocado y crear otro rompería la unicidad.
        const byCode = await this.catalogRepo.findProductByCode(
          tx,
          dto.tenantId,
          dto.code,
        );
        if (byCode) {
          throw new ConflictException(
            'Ya existe un producto con ese código para el tenant, con otro identificador.',
            { tenantId: dto.tenantId, code: dto.code, existingId: byCode.id },
          );
        }
        product = this.catalogRepo.createProduct(tx, {
          id: productId,
          tenantId: dto.tenantId,
          code: dto.code,
          name: dto.name,
          ownerTeamId: dto.ownerTeamId,
          businessPurpose: dto.businessPurpose,
          classificationCode: dto.classificationCode,
          containsPhi: dto.containsPhi === true,
          lifecycleState: 'published',
        });
      } else {
        if (product.code !== dto.code || product.tenantId !== dto.tenantId) {
          throw new ConflictException(
            'El producto existente tiene otro código o pertenece a otro tenant.',
            { productId, code: product.code },
          );
        }
        product.name = dto.name;
        if (dto.ownerTeamId) product.ownerTeamId = dto.ownerTeamId;
        if (dto.businessPurpose) product.businessPurpose = dto.businessPurpose;
        if (dto.classificationCode)
          product.classificationCode = dto.classificationCode;
        product.containsPhi = dto.containsPhi === true;
        product.lifecycleState = 'published';
      }

      const duplicateVersion = await this.catalogRepo.findProductVersion(
        tx,
        product.id,
        dto.version,
      );
      if (duplicateVersion) {
        throw new ConflictException(
          'Esa versión del producto ya está publicada.',
          {
            productId: product.id,
            version: dto.version,
          },
        );
      }

      const now = new Date();
      const previous = await this.catalogRepo.findActiveProductVersionForUpdate(
        tx,
        product.id,
        'active',
      );
      let supersededVersionId: string | undefined;
      if (previous) {
        previous.state = 'superseded';
        previous.effectiveTo = now;
        supersededVersionId = previous.id;
      }

      const version = this.catalogRepo.createProductVersion(tx, {
        dataProductId: product.id,
        version: dto.version,
        contractSchemaJson: dto.contractSchemaJson,
        qualitySloJson: dto.qualitySloJson,
        effectiveFrom: now,
        state: 'active',
      });

      let qualityRulesCreated = 0;
      const seenRuleCodes = new Set<string>();
      for (const rule of dto.qualityRules ?? []) {
        if (seenRuleCodes.has(rule.ruleCode)) {
          throw new ConflictException(
            'Dos reglas de calidad comparten el mismo código.',
            {
              ruleCode: rule.ruleCode,
            },
          );
        }
        seenRuleCodes.add(rule.ruleCode);

        this.catalogRepo.createQualityRule(tx, {
          dataProductVersionId: version.id,
          ruleCode: rule.ruleCode,
          dimension: rule.dimension,
          expression: rule.expression,
          severity: rule.severity,
          threshold: rule.threshold,
          state: 'active',
        });
        qualityRulesCreated += 1;
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'DataProductVersionPublished',
        aggregateType: 'lakehouse.data_product_versions',
        aggregateId: version.id,
        payloadJson: {
          dataProductId: product.id,
          code: product.code,
          version: dto.version,
          containsPhi: product.containsPhi,
          supersededVersionId: supersededVersionId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'lakehouse.product.publish',
          dataProductId: product.id,
          version: dto.version,
          qualityRulesCreated,
        },
        'Versión de producto de datos publicada',
      );

      return {
        dataProductId: product.id,
        id: version.id,
        version: version.version,
        state: version.state,
        supersededVersionId,
        qualityRulesCreated,
      };
    });
  }

  /**
   * UC-63-04: registrar el dataset y su esquema inicial.
   *
   * La versión del producto tiene que estar **activa**: registrar una tabla contra
   * un contrato superseded ataría almacenamiento a una promesa que ya no rige.
   *
   * Y la zona y el catálogo tienen que estar activos, por lo mismo: una tabla en
   * una zona retirada es una tabla que nadie va a mantener.
   */
  async registerDataset(
    dto: RegisterDatasetDto,
    actor: AuthenticatedUser,
  ): Promise<DatasetResponseDto> {
    return this.em.transactional(async (tx) => {
      const productVersion = await this.catalogRepo.findProductVersionById(
        tx,
        dto.dataProductVersionId,
      );
      if (!productVersion) {
        throw new ResourceNotFoundException(
          'Versión de producto no encontrada.',
          {
            dataProductVersionId: dto.dataProductVersionId,
          },
        );
      }
      if (productVersion.state !== 'active') {
        throw new PreconditionFailedException(
          'La versión del producto ya no es la vigente.',
          {
            dataProductVersionId: productVersion.id,
            state: productVersion.state,
          },
        );
      }

      const zone = await this.catalogRepo.findZoneById(tx, dto.dataLakeZoneId);
      if (!zone) {
        throw new ResourceNotFoundException('Zona no encontrada.', {
          dataLakeZoneId: dto.dataLakeZoneId,
        });
      }
      if (zone.state !== 'active') {
        throw new PreconditionFailedException('La zona no está activa.', {
          zoneId: zone.id,
        });
      }

      const catalog = await this.catalogRepo.findCatalogById(
        tx,
        dto.lakehouseCatalogId,
      );
      if (!catalog) {
        throw new ResourceNotFoundException('Catálogo no encontrado.', {
          lakehouseCatalogId: dto.lakehouseCatalogId,
        });
      }
      if (catalog.state !== 'active') {
        throw new PreconditionFailedException('El catálogo no está activo.', {
          catalogId: catalog.id,
        });
      }

      const duplicate = await this.catalogRepo.findDatasetByTable(
        tx,
        dto.lakehouseCatalogId,
        dto.databaseName,
        dto.tableName,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya hay un dataset registrado para esa tabla.',
          {
            databaseName: dto.databaseName,
            tableName: dto.tableName,
          },
        );
      }

      const dataset = this.catalogRepo.createDataset(tx, {
        tenantId: dto.tenantId,
        dataProductVersionId: dto.dataProductVersionId,
        dataLakeZoneId: dto.dataLakeZoneId,
        lakehouseCatalogId: dto.lakehouseCatalogId,
        databaseName: dto.databaseName,
        tableName: dto.tableName,
        // Del catálogo si no se declara: el formato por defecto existe para no
        // repetirlo en cada tabla.
        storageFormat: dto.storageFormat ?? catalog.defaultFormat ?? 'parquet',
        partitionSpecJson: dto.partitionSpecJson,
        sourceDatasetCode: dto.sourceDatasetCode,
        lifecycleState: 'active',
      });

      const schema = this.catalogRepo.createSchemaVersion(tx, {
        lakehouseDatasetId: dataset.id,
        schemaVersion: 1,
        schemaJson: dto.schemaJson,
        schemaFingerprint: dto.schemaFingerprint,
        compatibilityMode: dto.compatibilityMode ?? 'backward',
        effectiveFrom: new Date(),
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'LakehouseDatasetRegistered',
        aggregateType: 'lakehouse.lakehouse_datasets',
        aggregateId: dataset.id,
        payloadJson: {
          databaseName: dataset.databaseName,
          tableName: dataset.tableName,
          zoneType: zone.zoneType,
          storageFormat: dataset.storageFormat,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'lakehouse.dataset.register', datasetId: dataset.id },
        'Dataset del lakehouse registrado',
      );

      return {
        id: dataset.id,
        databaseName: dataset.databaseName,
        tableName: dataset.tableName,
        storageFormat: dataset.storageFormat,
        lifecycleState: dataset.lifecycleState,
        schemaVersionId: schema.id,
      };
    });
  }
}
