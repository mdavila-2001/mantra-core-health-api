import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PharmaciesRepository,
  PharmacyProductsRepository,
  PharmacyIntegrationConnectionsRepository,
  PharmacyExternalProductMappingsRepository,
} from '../repositories';
import { INTEGRATION_MODE_CONCEPT_BY_CODE, PHARM } from '../pharmacy.concepts';
import {
  ConnectionResponseDto,
  CreateConnectionDto,
  CreateMappingDto,
  MappingResponseDto,
} from '../dto';

/**
 * Integración externa de una farmacia.
 *  - UC-24-07: establecer una conexión de integración.
 *  - UC-24-08: mapear un producto a un código de proveedor externo (requiere
 *    conexión ACTIVE que soporte consulta de stock o de precio).
 */
@Injectable()
export class PharmacyIntegrationService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly connectionsRepo: PharmacyIntegrationConnectionsRepository,
    private readonly mappingsRepo: PharmacyExternalProductMappingsRepository,
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
      const pharmacy = await this.pharmaciesRepo.findById(tx, pharmacyId);
      if (!pharmacy)
        throw new ResourceNotFoundException('Farmacia no encontrada', {
          pharmacyId,
        });
      if (pharmacy.statusConceptId !== PHARM.PHARMACY_ACTIVE) {
        throw new PreconditionFailedException('La farmacia no está activa', {
          pharmacyId,
        });
      }

      if (dto.connectionId) {
        const clash = await this.connectionsRepo.findByPharmacyAndConnection(
          tx,
          pharmacyId,
          dto.connectionId,
        );
        if (clash) {
          throw new ConflictException(
            'Ya existe una conexión para esa integración',
            {
              connectionId: dto.connectionId,
            },
          );
        }
      }

      const connection = this.connectionsRepo.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        connectionId: dto.connectionId,
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
        connectionId: connection.connectionId,
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
      const connection = await this.connectionsRepo.findById(
        tx,
        connectionRowId,
      );
      if (!connection || connection.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionRowId,
        });
      }
      if (connection.statusConceptId !== PHARM.CONNECTION_ACTIVE) {
        throw new PreconditionFailedException('La conexión no está activa', {
          connectionRowId,
        });
      }
      if (!connection.supportsStockQuery && !connection.supportsPriceQuery) {
        throw new PreconditionFailedException(
          'La conexión no soporta consulta de stock ni de precio',
          { connectionRowId },
        );
      }

      const product = await this.productsRepo.findById(
        tx,
        dto.pharmacyProductId,
      );
      if (!product || product.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Producto no encontrado', {
          productId: dto.pharmacyProductId,
        });
      }
      if (product.statusConceptId !== PHARM.PRODUCT_ACTIVE) {
        throw new PreconditionFailedException('El producto no está activo', {
          productId: dto.pharmacyProductId,
        });
      }

      const clash = await this.mappingsRepo.findByConnectionAndProduct(
        tx,
        connectionRowId,
        dto.pharmacyProductId,
      );
      if (clash) {
        throw new ConflictException(
          'El producto ya está mapeado en esta conexión',
          {
            productId: dto.pharmacyProductId,
          },
        );
      }

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
      return {
        id: mapping.id,
        pharmacyIntegrationConnectionId:
          mapping.pharmacyIntegrationConnectionId,
        pharmacyProductId: mapping.pharmacyProductId,
        externalProductCode: mapping.externalProductCode,
        verificationStatus: mapping.verificationStatusConceptId,
        createdAt: mapping.createdAt,
      };
    });
  }
}
