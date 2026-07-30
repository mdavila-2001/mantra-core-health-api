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
  PharmacyPriceListsRepository,
  PharmacyProductsRepository,
  PharmacyProductPricesRepository,
} from '../repositories';
import { PHARM, PRICE_LIST_TYPE_CONCEPT_BY_CODE } from '../pharmacy.concepts';
import {
  CreatePriceDto,
  CreatePriceListDto,
  PriceListResponseDto,
  PriceResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Listas de precios y precios versionados de una farmacia.
 *  - UC-24-05: crear lista (pública / por aseguradora).
 *  - UC-24-06: fijar/versionar precio (inserta nueva versión y supersede la
 *    anterior en la misma transacción).
 *  - UC-24-10: cerrar/expirar una lista y superseder todos sus precios vigentes.
 */
@Injectable()
export class PharmacyPricingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaciesRepo - Valor de pharmacies repo requerido por la operación.
   * @param priceListsRepo - Valor de price lists repo requerido por la operación.
   * @param productsRepo - Valor de products repo requerido por la operación.
   * @param pricesRepo - Valor de prices repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly priceListsRepo: PharmacyPriceListsRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly pricesRepo: PharmacyProductPricesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyPricingService.name);
  }

  /** UC-24-05: crea una lista de precios ACTIVE sobre una farmacia activa. */
  async createPriceList(
    pharmacyId: string,
    dto: CreatePriceListDto,
    actor: AuthenticatedUser,
  ): Promise<PriceListResponseDto> {
    this.logger.info(
      { operation: 'pharmacy.price-list.create', pharmacyId, code: dto.code },
      'Creating price list',
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
      if (dto.priceListType === 'INSURER' && !dto.insurerTenantId) {
        throw new PreconditionFailedException(
          'Una lista por aseguradora requiere insurerTenantId',
          {
            code: dto.code,
          },
        );
      }

      const clash = await this.priceListsRepo.findByPharmacyAndCode(
        tx,
        pharmacyId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una lista con ese código en la farmacia',
          {
            code: dto.code,
          },
        );
      }

      const priceList = this.priceListsRepo.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        code: dto.code,
        priceListTypeConceptId:
          PRICE_LIST_TYPE_CONCEPT_BY_CODE[dto.priceListType],
        insurerTenantId: dto.insurerTenantId,
        currencyConceptId: dto.currencyConceptId ?? PHARM.CURRENCY_USD,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        publicVisibility: dto.publicVisibility,
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy.price-list.create',
          pharmacyId,
          priceListId: priceList.id,
        },
        'Price list created',
      );
      return {
        id: priceList.id,
        pharmacyId: priceList.pharmacyId,
        code: priceList.code,
        priceListType: priceList.priceListTypeConceptId,
        status: priceList.statusConceptId,
        createdAt: priceList.createdAt,
      };
    });
  }

  /** UC-24-06: inserta una nueva versión de precio y supersede la anterior. */
  async versionPrice(
    pharmacyId: string,
    priceListId: string,
    dto: CreatePriceDto,
    actor: AuthenticatedUser,
  ): Promise<PriceResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy.price.version',
        pharmacyId,
        priceListId,
        productId: dto.pharmacyProductId,
      },
      'Versioning product price',
    );
    return this.em.transactional(async (tx) => {
      const priceList = await this.priceListsRepo.findById(tx, priceListId);
      if (!priceList || priceList.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Lista de precios no encontrada', {
          priceListId,
        });
      }
      if (priceList.statusConceptId !== PHARM.PRICE_LIST_ACTIVE) {
        throw new PreconditionFailedException(
          'La lista de precios no está activa',
          { priceListId },
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

      const now = new Date();
      const active = await this.pricesRepo.findActiveByListAndProduct(
        tx,
        priceListId,
        dto.pharmacyProductId,
        PHARM.PRICE_ACTIVE,
      );
      for (const prev of active) {
        prev.statusConceptId = PHARM.PRICE_SUPERSEDED;
        prev.effectiveTo = now;
      }

      const maxVersion = await this.pricesRepo.maxVersionNumber(
        tx,
        priceListId,
        dto.pharmacyProductId,
      );
      const price = this.pricesRepo.create(tx, {
        pharmacyPriceListId: priceListId,
        pharmacyProductId: dto.pharmacyProductId,
        versionNumber: maxVersion + 1,
        unitAmount: String(dto.unitAmount),
        taxAmount:
          dto.taxAmount !== undefined ? String(dto.taxAmount) : undefined,
        patientAmount:
          dto.patientAmount !== undefined
            ? String(dto.patientAmount)
            : undefined,
        insurerAmount:
          dto.insurerAmount !== undefined
            ? String(dto.insurerAmount)
            : undefined,
        minimumQuantity:
          dto.minimumQuantity !== undefined
            ? String(dto.minimumQuantity)
            : undefined,
        effectiveFrom: now,
        statusConceptId: PHARM.PRICE_ACTIVE,
        recordedAt: now,
        recordedByUserId: actor.id,
      });

      touch(priceList, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy.price.version',
          priceId: price.id,
          versionNumber: price.versionNumber,
        },
        'Product price versioned',
      );
      return {
        id: price.id,
        pharmacyPriceListId: price.pharmacyPriceListId,
        pharmacyProductId: price.pharmacyProductId,
        versionNumber: price.versionNumber,
        unitAmount: price.unitAmount,
        status: price.statusConceptId,
        effectiveFrom: price.effectiveFrom,
      };
    });
  }

  /** UC-24-10: cierra una lista y supersede todos sus precios vigentes. */
  async closePriceList(
    pharmacyId: string,
    priceListId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'pharmacy.price-list.close', pharmacyId, priceListId },
      'Closing price list',
    );
    return this.em.transactional(async (tx) => {
      const priceList = await this.priceListsRepo.findById(tx, priceListId);
      if (!priceList || priceList.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Lista de precios no encontrada', {
          priceListId,
        });
      }
      if (priceList.statusConceptId !== PHARM.PRICE_LIST_ACTIVE) {
        throw new PreconditionFailedException(
          'La lista de precios no está activa',
          { priceListId },
        );
      }

      const now = new Date();
      priceList.statusConceptId = PHARM.PRICE_LIST_CLOSED;
      priceList.validTo = now;
      touch(priceList, actor.id);

      const prices = await this.pricesRepo.findActiveByList(
        tx,
        priceListId,
        PHARM.PRICE_ACTIVE,
      );
      for (const price of prices) {
        price.statusConceptId = PHARM.PRICE_SUPERSEDED;
        price.effectiveTo = now;
      }

      this.logger.info(
        {
          operation: 'pharmacy.price-list.close',
          priceListId,
          supersededPrices: prices.length,
        },
        'Price list closed',
      );
      return { ok: true };
    });
  }
}
