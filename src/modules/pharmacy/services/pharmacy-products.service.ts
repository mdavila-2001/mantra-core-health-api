import { BadRequestException, Injectable } from '@nestjs/common';
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
  MedicineCatalogRepository,
  type MedicineCatalogProduct,
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

/** Lo que el servidor deriva del catálogo y completa en el alta. */
interface CatalogDerivedFields {
  catalogProductConceptId: string;
  catalogPresentationCode: string;
  brandName: string;
  genericName: string;
  strengthText: string;
  packageSizeText: string;
  requiresPrescription: boolean;
  medicationConceptId: string;
}

/** Datos del producto que, con `catalogProductId`, no se aceptan del cliente. */
const CATALOG_DERIVED_INPUTS = [
  'brandName',
  'genericName',
  'strengthText',
  'packageSizeText',
  'requiresPrescription',
  'medicationConceptId',
] as const satisfies readonly (keyof CreateProductDto)[];

/**
 * Catálogo de productos de una farmacia.
 *  - UC-24-04: publicar producto con identificadores (padre + N hijos).
 *  - P47 §2: editar los datos descriptivos de un producto activo (marca, genérico,
 *    concentración, empaque y receta).
 *  - UC-24-09: retirar (soft-delete) un producto, superseder sus precios vigentes
 *    e inactivar sus mapeos externos en la misma transacción.
 *
 * ## El producto sale del catálogo universal
 *
 * Con `catalogProductId` el alta **no recibe** los datos del producto: marca,
 * genérico, concentración, presentación, receta y el medicamento del vademécum
 * (el que usa la receta, por igualdad exacta de ATC nivel 5) los deriva el
 * servidor del registro oficial. Así dos farmacias que venden el mismo
 * medicamento lo cargan idéntico y «dónde comprar mi receta» los reconoce como
 * uno. Sin `catalogProductId` el alta sigue como antes (producto cargado a
 * mano): es el camino de la importación masiva hasta que ésta cargue por id.
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
   * @param catalogRepo - Lectura del catálogo universal de medicamentos.
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
    private readonly catalogRepo: MedicineCatalogRepository,
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

      const fromCatalog = await this.deriveFromCatalog(tx, pharmacyId, dto);
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
        ...fromCatalog,
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
      // Un producto del catálogo universal no corrige lo oficial: los cinco
      // datos descriptivos son del registro sanitario, no de la farmacia.
      if (product.catalogProductConceptId != null && changed.length > 0) {
        throw new BadRequestException(
          `${changed.join(', ')} vienen del catálogo oficial y no se editan`,
        );
      }
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

  /**
   * Los datos del producto que salen del catálogo oficial, o nada si el alta no
   * lo referencia.
   *
   * Reglas, en este orden: el producto existe (404); su registro está vigente
   * (422, como el resto de las precondiciones del módulo); no se mandaron a la
   * vez los datos que el catálogo ya trae (400); la presentación pertenece al
   * producto, y es obligatoria si el producto tiene más de una (400); la
   * farmacia no lo cargó ya con esa presentación (409).
   */
  private async deriveFromCatalog(
    tx: EntityManager,
    pharmacyId: string,
    dto: CreateProductDto,
  ): Promise<Partial<CatalogDerivedFields>> {
    if (dto.catalogProductId === undefined) {
      if (dto.catalogPresentationCode !== undefined) {
        throw new BadRequestException(
          'catalogPresentationCode sólo se manda junto con catalogProductId',
        );
      }
      return {};
    }
    const catalog = await this.catalogRepo.findProductById(
      tx,
      dto.catalogProductId,
    );
    if (!catalog) {
      throw new ResourceNotFoundException(
        'Producto del catálogo no encontrado',
        { catalogProductId: dto.catalogProductId },
      );
    }
    if (!catalog.selectable) {
      throw new PreconditionFailedException(
        'El registro sanitario de ese producto no está vigente',
        {
          catalogProductId: catalog.id,
          regulatoryStatus: catalog.regulatoryStatus,
        },
      );
    }
    const supplied = CATALOG_DERIVED_INPUTS.filter(
      (field) => dto[field] !== undefined,
    );
    if (supplied.length > 0) {
      throw new BadRequestException(
        `${supplied.join(', ')} vienen del catálogo oficial y no se mandan con catalogProductId`,
      );
    }
    const presentation = this.pickPresentation(
      catalog,
      dto.catalogPresentationCode,
    );
    const duplicate = await this.productsRepo.findByPharmacyAndCatalog(
      tx,
      pharmacyId,
      catalog.id,
      dto.catalogPresentationCode ?? null,
    );
    if (duplicate) {
      throw new ConflictException('Ya cargaste ese producto y presentación', {
        catalogProductId: catalog.id,
        catalogPresentationCode: dto.catalogPresentationCode,
      });
    }
    return {
      catalogProductConceptId: catalog.id,
      catalogPresentationCode: dto.catalogPresentationCode,
      brandName: catalog.display,
      genericName:
        catalog.activeIngredients.map((i) => i.name).join(' + ') || undefined,
      strengthText: catalog.strengthText ?? undefined,
      packageSizeText: presentation?.name,
      requiresPrescription: catalog.requiresPrescription ?? undefined,
      medicationConceptId:
        (await this.catalogRepo.findVademecumConceptIdByAtc(tx, catalog.atc)) ??
        undefined,
    };
  }

  /** La presentación pedida, validada contra el producto; obligatoria si hay más de una. */
  private pickPresentation(
    catalog: MedicineCatalogProduct,
    code: string | undefined,
  ): MedicineCatalogProduct['presentations'][number] | undefined {
    const sellable = catalog.presentations.filter(
      (p) => p.active !== false && p.code !== null,
    );
    if (code === undefined) {
      if (sellable.length > 1) {
        throw new BadRequestException(
          'El producto tiene más de una presentación: mandá catalogPresentationCode',
        );
      }
      return undefined;
    }
    const found = sellable.find((p) => p.code === code);
    if (!found) {
      throw new BadRequestException(
        'catalogPresentationCode no es una presentación de ese producto',
      );
    }
    return found;
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
