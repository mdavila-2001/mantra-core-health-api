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
  PharmacyReadRepository,
} from '../repositories';
import { IDENTIFIER_TYPE_CONCEPT_BY_CODE, PHARM } from '../pharmacy.concepts';
import {
  CreateProductDto,
  PharmacyProductReadDto,
  ProductResponseDto,
  StatusResultDto,
  UpdateProductDto,
} from '../dto';
import { displayName, toProductReadDto } from './pharmacy-read.service';

/** Los datos descriptivos que el `PATCH` puede cambiar: los de `UpdateProductDto`. */
const EDITABLE_FIELDS = [
  'brandName',
  'genericName',
  'strengthText',
  'packageSizeText',
  'requiresPrescription',
] as const;

/**
 * Catálogo de productos de una farmacia.
 *  - UC-24-04: publicar producto con identificadores (padre + N hijos).
 *  - P47 §2: editar los datos descriptivos de un producto activo (marca, genérico,
 *    concentración, empaque y receta).
 *  - UC-24-09: retirar (soft-delete) un producto, superseder sus precios vigentes
 *    e inactivar sus mapeos externos en la misma transacción.
 */
@Injectable()
export class PharmacyProductsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaciesRepo - Valor de pharmacies repo requerido por la operación.
   * @param productsRepo - Valor de products repo requerido por la operación.
   * @param identifiersRepo - Valor de identifiers repo requerido por la operación.
   * @param pricesRepo - Valor de prices repo requerido por la operación.
   * @param mappingsRepo - Valor de mappings repo requerido por la operación.
   * @param readRepo - Lecturas del catálogo, para devolver el producto como lo lista la búsqueda.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly identifiersRepo: PharmacyProductIdentifiersRepository,
    private readonly pricesRepo: PharmacyProductPricesRepository,
    private readonly mappingsRepo: PharmacyExternalProductMappingsRepository,
    private readonly readRepo: PharmacyReadRepository,
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

  /**
   * P47 §2: corrige los datos descriptivos de un producto activo.
   *
   * Cada clave del cuerpo es opcional: una ausente deja el dato como está y
   * `null` lo borra. Un cuerpo vacío no cambia nada y no toca las marcas de
   * modificación. Responde el producto como lo lista la búsqueda.
   */
  async updateProduct(
    pharmacyId: string,
    productId: string,
    dto: UpdateProductDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyProductReadDto> {
    this.logger.info(
      { operation: 'pharmacy.product.update', pharmacyId, productId },
      'Updating pharmacy product',
    );
    return this.em.transactional(async (tx) => {
      const pharmacy = await this.pharmaciesRepo.findById(tx, pharmacyId);
      if (!pharmacy)
        throw new ResourceNotFoundException('Farmacia no encontrada', {
          pharmacyId,
        });
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

      const changed = EDITABLE_FIELDS.filter(
        (field) => dto[field] !== undefined,
      );
      if (changed.length > 0) {
        // `null` borra el dato; la entidad generada tipa estas columnas como
        // `T | undefined`, así que se asigna por `Object.assign`.
        for (const field of changed) {
          Object.assign(product, { [field]: dto[field] });
        }
        touch(product, actor.id);
        await tx.flush();
      }

      const concepts = await this.readRepo.findConcepts(
        tx,
        [product.medicationConceptId, product.dosageFormConceptId].filter(
          (id): id is string => Boolean(id),
        ),
      );
      this.logger.info(
        {
          operation: 'pharmacy.product.update',
          productId,
          changedFields: changed,
        },
        'Pharmacy product updated',
      );
      return toProductReadDto(
        product,
        displayName(pharmacy),
        new Map(concepts.map((concept) => [concept.id, concept])),
      );
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
