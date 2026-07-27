import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PharmaciesRepository,
  PharmacyProductsRepository,
  PharmacyProductIdentifiersRepository,
  PharmacyProductPricesRepository,
  PharmacyExternalProductMappingsRepository,
} from '../repositories';
import { IDENTIFIER_TYPE_CONCEPT_BY_CODE, PHARM } from '../pharmacy.concepts';
import { CreateProductDto, ProductResponseDto, StatusResultDto } from '../dto';

/**
 * Catálogo de productos de una farmacia.
 *  - UC-24-04: publicar producto con identificadores (padre + N hijos).
 *  - UC-24-09: retirar (soft-delete) un producto, superseder sus precios vigentes
 *    e inactivar sus mapeos externos en la misma transacción.
 */
@Injectable()
export class PharmacyProductsService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly identifiersRepo: PharmacyProductIdentifiersRepository,
    private readonly pricesRepo: PharmacyProductPricesRepository,
    private readonly mappingsRepo: PharmacyExternalProductMappingsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyProductsService.name);
  }

  /** UC-24-04: publica un producto con sus identificadores sobre una farmacia activa. */
  async publishProduct(
    pharmacyId: string,
    dto: CreateProductDto,
    actor: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.product.publish',
        pharmacyId,
        productCode: dto.productCode,
      },
      'Publishing pharmacy product',
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

      const clash = await this.productsRepo.findByPharmacyAndCode(
        tx,
        pharmacyId,
        dto.productCode,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un producto con ese código en la farmacia',
          {
            productCode: dto.productCode,
          },
        );
      }

      const product = this.productsRepo.create(tx, {
        pharmacyId,
        productCode: dto.productCode,
        medicationConceptId: dto.medicationConceptId,
        manufacturerTenantId: dto.manufacturerTenantId,
        brandName: dto.brandName,
        genericName: dto.genericName,
        strengthText: dto.strengthText,
        dosageFormConceptId: dto.dosageFormConceptId,
        packageSizeText: dto.packageSizeText,
        requiresPrescription: dto.requiresPrescription,
        coldChainRequired: dto.coldChainRequired,
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el producto antes de sus identificadores.
      await tx.flush();

      const identifiers = dto.identifiers ?? [];
      for (const idf of identifiers) {
        this.identifiersRepo.create(tx, {
          pharmacyProductId: product.id,
          identifierTypeConceptId:
            IDENTIFIER_TYPE_CONCEPT_BY_CODE[idf.identifierType],
          identifierValue: idf.identifierValue,
          assigningAuthorityTenantId: idf.assigningAuthorityTenantId,
          validFrom: idf.validFrom ? new Date(idf.validFrom) : undefined,
          validTo: idf.validTo ? new Date(idf.validTo) : undefined,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy.product.publish',
          pharmacyId,
          productId: product.id,
        },
        'Pharmacy product published',
      );
      return {
        id: product.id,
        pharmacyId: product.pharmacyId,
        productCode: product.productCode,
        status: product.statusConceptId,
        identifierCount: identifiers.length,
        createdAt: product.createdAt,
      };
    });
  }

  /** UC-24-09: retira un producto y supersede en cascada precios y mapeos vigentes. */
  async retireProduct(
    pharmacyId: string,
    productId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'pharmacy.product.retire', pharmacyId, productId },
      'Retiring pharmacy product',
    );
    return this.em.transactional(async (tx) => {
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

      product.statusConceptId = PHARM.PRODUCT_RETIRED;
      touch(product, actor.id);

      const now = new Date();
      const prices = await this.pricesRepo.findActiveByProduct(
        tx,
        productId,
        PHARM.PRICE_ACTIVE,
      );
      for (const price of prices) {
        price.statusConceptId = PHARM.PRICE_SUPERSEDED;
        price.effectiveTo = now;
      }

      const mappings = await this.mappingsRepo.findActiveByProduct(
        tx,
        productId,
        PHARM.MAPPING_INACTIVE,
      );
      for (const mapping of mappings) {
        mapping.verificationStatusConceptId = PHARM.MAPPING_INACTIVE;
        touch(mapping, actor.id);
      }

      this.logger.info(
        {
          operation: 'pharmacy.product.retire',
          productId,
          supersededPrices: prices.length,
          inactivatedMappings: mappings.length,
        },
        'Pharmacy product retired',
      );
      return { ok: true };
    });
  }
}
