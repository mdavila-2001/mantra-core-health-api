import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import type {
  PharmacyExternalProductMappings,
  PharmacyIntegrationConnections,
} from '../entities';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import {
  PharmaciesRepository,
  PharmacyReferencesRepository,
  PharmacyProductsRepository,
  PharmacyIntegrationConnectionsRepository,
  PharmacyExternalProductMappingsRepository,
} from '../repositories';
import { INTEGRATION_MODE_CONCEPT_BY_CODE, PHARM } from '../pharmacy.concepts';
import {
  assertReferenceInScope,
  requireManagedPharmacy,
} from './pharmacy-scope';
import {
  ConnectionResponseDto,
  CreateConnectionDto,
  CreateMappingDto,
  MappingResponseDto,
  UpdateMappingDto,
} from '../dto';

/**
 * Integración externa de una farmacia.
 *  - UC-24-07: establecer una conexión de integración.
 *  - UC-24-08: mapear un producto a un código de proveedor externo (requiere
 *    conexión ACTIVE que soporte consulta de stock o de precio).
 *  - Corregir un vínculo (producto, código o unidad) con las mismas
 *    condiciones que el alta, y deshacerlo siempre (también con la conexión
 *    inactiva): un vínculo equivocado no puede quedar para siempre.
 */
@Injectable()
export class PharmacyIntegrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaciesRepo - Valor de pharmacies repo requerido por la operación.
   * @param productsRepo - Valor de products repo requerido por la operación.
   * @param connectionsRepo - Valor de connections repo requerido por la operación.
   * @param mappingsRepo - Valor de mappings repo requerido por la operación.
   * @param referencesRepo - Comprobación de propiedad de las referencias del cuerpo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly connectionsRepo: PharmacyIntegrationConnectionsRepository,
    private readonly mappingsRepo: PharmacyExternalProductMappingsRepository,
    private readonly referencesRepo: PharmacyReferencesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyIntegrationService.name);
  }

  /** UC-24-07: establece una conexión de integración sobre una farmacia activa. */
  async createConnection(
    pharmacyId: string,
    dto: CreateConnectionDto,
    actor: AuthenticatedUser,
  ): Promise<ConnectionResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.connection.create',
        pharmacyId,
        mode: dto.integrationMode,
      },
      'Creating integration connection',
    );
    return this.em.transactional(async (tx) => {
      const pharmacy = await requireManagedPharmacy(
        this.pharmaciesRepo,
        tx,
        pharmacyId,
        actor,
      );
      if (pharmacy.statusConceptId !== PHARM.PHARMACY_ACTIVE) {
        throw new PreconditionFailedException('La farmacia no está activa', {
          pharmacyId,
        });
      }

      if (dto.pharmacySiteId) {
        assertReferenceInScope(
          (await this.referencesRepo.findPharmacySiteInPharmacy(
            tx,
            dto.pharmacySiteId,
            pharmacy.id,
          )) !== null,
        );
      }

      const connection = this.connectionsRepo.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        integrationModeConceptId:
          INTEGRATION_MODE_CONCEPT_BY_CODE[dto.integrationMode],
        inventoryAuthorityConceptId: dto.inventoryAuthorityConceptId,
        supportsStockQuery: dto.supportsStockQuery,
        supportsPriceQuery: dto.supportsPriceQuery,
        supportsReservation: dto.supportsReservation,
        supportsDispenseConfirmation: dto.supportsDispenseConfirmation,
        manualFallbackAllowed: dto.manualFallbackAllowed,
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy.connection.create',
          pharmacyId,
          connectionRowId: connection.id,
        },
        'Integration connection created',
      );
      return {
        id: connection.id,
        pharmacyId: connection.pharmacyId,
        connectionId: connection.connectionId ?? null,
        status: connection.statusConceptId,
        createdAt: connection.createdAt,
      };
    });
  }

  /** UC-24-08: mapea un producto a un código externo sobre una conexión activa. */
  async mapProduct(
    pharmacyId: string,
    connectionRowId: string,
    dto: CreateMappingDto,
    actor: AuthenticatedUser,
  ): Promise<MappingResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.mapping.create',
        pharmacyId,
        connectionRowId,
        productId: dto.pharmacyProductId,
      },
      'Mapping product to external code',
    );
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const connection = await this.requireConnection(
        tx,
        pharmacyId,
        connectionRowId,
      );
      assertConnectionMappable(connection);
      await this.requireMappableProduct(tx, pharmacyId, dto.pharmacyProductId);
      await this.assertProductFree(tx, connectionRowId, dto.pharmacyProductId);

      const mapping = this.mappingsRepo.create(tx, {
        pharmacyIntegrationConnectionId: connectionRowId,
        pharmacyProductId: dto.pharmacyProductId,
        externalProductCode: dto.externalProductCode,
        externalUnitCode: dto.externalUnitCode,
        mappingVersion: dto.mappingVersion,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy.mapping.create', mappingId: mapping.id },
        'Product mapped to external code',
      );
      return mappingResponse(mapping);
    });
  }

  /**
   * Corrige un vínculo: otro producto, otro código externo u otra unidad. Con
   * las condiciones del alta (conexión activa que consulte stock o precio,
   * producto activo de la farmacia y sin otro vínculo en la conexión) y
   * vuelve a quedar sin verificar: es otro vínculo.
   */
  async updateMapping(
    pharmacyId: string,
    connectionRowId: string,
    mappingId: string,
    dto: UpdateMappingDto,
    actor: AuthenticatedUser,
  ): Promise<MappingResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.mapping.update',
        pharmacyId,
        connectionRowId,
        mappingId,
      },
      'Correcting external product mapping',
    );
    if (
      dto.pharmacyProductId === undefined &&
      dto.externalProductCode === undefined &&
      dto.externalUnitCode === undefined
    ) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'La corrección del vínculo no trae ningún campo',
        {
          reason: PharmacyErrorReason.EXTERNAL_MAPPING_EMPTY_UPDATE,
          fields: [
            'pharmacyProductId',
            'externalProductCode',
            'externalUnitCode',
          ],
        },
        PharmacyErrorReason.EXTERNAL_MAPPING_EMPTY_UPDATE,
      );
    }
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const connection = await this.requireConnection(
        tx,
        pharmacyId,
        connectionRowId,
      );
      const mapping = await this.requireMapping(tx, connectionRowId, mappingId);
      assertConnectionMappable(connection);
      if (
        dto.pharmacyProductId !== undefined &&
        dto.pharmacyProductId !== mapping.pharmacyProductId
      ) {
        await this.requireMappableProduct(
          tx,
          pharmacyId,
          dto.pharmacyProductId,
        );
        await this.assertProductFree(
          tx,
          connectionRowId,
          dto.pharmacyProductId,
        );
        mapping.pharmacyProductId = dto.pharmacyProductId;
      }
      if (dto.externalProductCode !== undefined) {
        mapping.externalProductCode = dto.externalProductCode;
      }
      if (dto.externalUnitCode !== undefined) {
        mapping.externalUnitCode = dto.externalUnitCode ?? undefined;
      }
      mapping.verificationStatusConceptId = PHARM.VERIFICATION_PENDING;
      touch(mapping, actor.id);
      await tx.flush();
      this.logger.info(
        { operation: 'pharmacy.mapping.update', mappingId: mapping.id },
        'External product mapping corrected',
      );
      return mappingResponse(mapping);
    });
  }

  /**
   * Deshace un vínculo. Siempre se puede, también con la conexión inactiva.
   * El stock que la sincronización ya asentó para ese producto se conserva:
   * el libro no se reescribe, y la sede lo cambia como siempre.
   *
   * @returns El vínculo tal como estaba, para el registro de auditoría.
   */
  async unmapProduct(
    pharmacyId: string,
    connectionRowId: string,
    mappingId: string,
    actor: AuthenticatedUser,
  ): Promise<MappingResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.mapping.delete',
        pharmacyId,
        connectionRowId,
        mappingId,
      },
      'Removing external product mapping',
    );
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      await this.requireConnection(tx, pharmacyId, connectionRowId);
      const mapping = await this.requireMapping(tx, connectionRowId, mappingId);
      const removed = mappingResponse(mapping);
      this.mappingsRepo.remove(tx, mapping);
      await tx.flush();
      this.logger.info(
        {
          operation: 'pharmacy.mapping.delete',
          mappingId,
          productId: removed.pharmacyProductId,
          externalProductCode: removed.externalProductCode,
        },
        'External product mapping removed',
      );
      return removed;
    });
  }

  /** La conexión de la farmacia; 404 si no existe o es de otra. */
  private async requireConnection(
    tx: EntityManager,
    pharmacyId: string,
    connectionRowId: string,
  ): Promise<PharmacyIntegrationConnections> {
    const connection = await this.connectionsRepo.findById(tx, connectionRowId);
    if (!connection || connection.pharmacyId !== pharmacyId) {
      throw new ResourceNotFoundException('Conexión no encontrada', {
        connectionRowId,
      });
    }
    return connection;
  }

  /** El vínculo de la conexión; 404 si no existe o es de otra. */
  private async requireMapping(
    tx: EntityManager,
    connectionRowId: string,
    mappingId: string,
  ): Promise<PharmacyExternalProductMappings> {
    const mapping = await this.mappingsRepo.findInConnection(
      tx,
      connectionRowId,
      mappingId,
    );
    if (!mapping) {
      throw new ResourceNotFoundException(
        'Vínculo no encontrado',
        { mappingId },
        PharmacyErrorReason.EXTERNAL_MAPPING_NOT_AVAILABLE,
      );
    }
    return mapping;
  }

  /** Un producto activo de la farmacia, que es lo único que se vincula. */
  private async requireMappableProduct(
    tx: EntityManager,
    pharmacyId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.productsRepo.findById(tx, productId);
    if (!product || product.pharmacyId !== pharmacyId) {
      throw new ResourceNotFoundException('Producto no encontrado', {
        productId,
      });
    }
    if (product.statusConceptId !== PHARM.PRODUCT_ACTIVE) {
      throw new PreconditionFailedException('El producto no está activo', {
        productId,
      });
    }
  }

  /** Un producto tiene a lo sumo un vínculo por conexión. */
  private async assertProductFree(
    tx: EntityManager,
    connectionRowId: string,
    productId: string,
  ): Promise<void> {
    const clash = await this.mappingsRepo.findByConnectionAndProduct(
      tx,
      connectionRowId,
      productId,
    );
    if (clash) {
      throw new ConflictException(
        'El producto ya está mapeado en esta conexión',
        { productId, mappingId: clash.id },
        PharmacyErrorReason.EXTERNAL_MAPPING_PRODUCT_TAKEN,
      );
    }
  }
}

/** Una conexión acepta vínculos si está activa y consulta stock o precio. */
function assertConnectionMappable(
  connection: PharmacyIntegrationConnections,
): void {
  if (connection.statusConceptId !== PHARM.CONNECTION_ACTIVE) {
    throw new PreconditionFailedException('La conexión no está activa', {
      connectionRowId: connection.id,
    });
  }
  if (!connection.supportsStockQuery && !connection.supportsPriceQuery) {
    throw new PreconditionFailedException(
      'La conexión no soporta consulta de stock ni de precio',
      { connectionRowId: connection.id },
    );
  }
}

function mappingResponse(
  mapping: PharmacyExternalProductMappings,
): MappingResponseDto {
  return {
    id: mapping.id,
    pharmacyIntegrationConnectionId: mapping.pharmacyIntegrationConnectionId,
    pharmacyProductId: mapping.pharmacyProductId,
    externalProductCode: mapping.externalProductCode,
    externalUnitCode: mapping.externalUnitCode ?? null,
    verificationStatus: mapping.verificationStatusConceptId,
    createdAt: mapping.createdAt,
  };
}
