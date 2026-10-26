import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AttachableFileService } from '../../common/services/attachable-file.service';
import {
  PharmacyProducts as PharmacyProductsEntity,
  type Pharmacies,
  type PharmacyProducts,
} from '../entities';
import {
  PharmaciesRepository,
  PharmacyProductsRepository,
  PharmacyProductIdentifiersRepository,
  PharmacyProductPricesRepository,
  PharmacyExternalProductMappingsRepository,
  PharmacyReadRepository,
  PharmacyCatalogRepository,
  MedicineCatalogRepository,
  type MedicineCatalogProduct,
} from '../repositories';
import { IDENTIFIER_TYPE_CONCEPT_BY_CODE, PHARM } from '../pharmacy.concepts';
import {
  CreateProductDto,
  InventoryUpdatedDto,
  PharmacyProductReadDto,
  ProductResponseDto,
  StatusResultDto,
  UpdateInventoryDto,
  UpdateProductDto,
} from '../dto';
import { displayName, PharmacyReadService } from './pharmacy-read.service';
import { requireManagedPharmacy } from './pharmacy-scope';
import { PharmacyCategoriesService } from './pharmacy-categories.service';
import {
  STATUS_CONCEPT,
  applyStockChange,
  normalizeMoney,
} from './pharmacy-catalog-rules';

/** Lo que administra la farmacia y comparten el alta y la edición (P47 §3-5). */
interface CatalogFieldsInput {
  unitPrice?: number | string | null;
  category?: string | null;
  description?: string | null;
  inStock?: boolean;
  stock?: number;
  minStock?: number;
  imageFileIds?: string[];
}

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
   * @param pharmacyCatalogRepo - Categorías, imágenes y lista `CATALOGO` (P47).
   * @param categories - Resolución de la categoría por nombre (P47).
   * @param readService - Proyección del producto como lo lista la búsqueda.
   * @param attachableFiles - Regla de «este archivo se puede colgar» (imágenes).
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
    private readonly pharmacyCatalogRepo: PharmacyCatalogRepository,
    private readonly categories: PharmacyCategoriesService,
    private readonly readService: PharmacyReadService,
    private readonly attachableFiles: AttachableFileService,
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

      assertOneStockForm(dto);
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
        statusConceptId: STATUS_CONCEPT[dto.status ?? 'PUBLISHED'],
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el producto antes de sus identificadores.
      await tx.flush();
      await this.applyCatalogFields(tx, pharmacy, product, dto, actor);

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
      const pharmacy = await requireManagedPharmacy(
        this.pharmaciesRepo,
        tx,
        pharmacyId,
        actor,
      );
      const product = await this.productsRepo.findById(tx, productId);
      if (!product || product.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Producto no encontrado', {
          productId,
        });
      }
      const retired = product.statusConceptId === PHARM.PRODUCT_RETIRED;
      const reactivating =
        retired && (dto.status === 'PUBLISHED' || dto.status === 'DRAFT');
      // Un retirado sólo se toca para volver a publicarlo o dejarlo en borrador.
      if (retired && !reactivating) {
        throw new PreconditionFailedException('El producto no está activo', {
          productId,
        });
      }
      assertOneStockForm(dto);

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
      // `null` borra el dato; la entidad generada tipa estas columnas como
      // `T | undefined`, así que se asigna por `Object.assign`.
      for (const field of changed) {
        Object.assign(product, { [field]: dto[field] });
      }

      if (dto.status === 'WITHDRAWN') {
        if (!retired) await this.retireInTx(tx, product, actor);
      } else if (dto.status !== undefined) {
        product.statusConceptId = STATUS_CONCEPT[dto.status];
      }
      const touched = await this.applyCatalogFields(
        tx,
        pharmacy,
        product,
        dto,
        actor,
      );
      if (changed.length > 0 || dto.status !== undefined || touched) {
        touch(product, actor.id);
        await tx.flush();
      }

      this.logger.info(
        {
          operation: 'pharmacy.product.update',
          productId,
          changedFields: [
            ...changed,
            ...CATALOG_FIELD_NAMES.filter((field) => dto[field] !== undefined),
            ...(dto.status !== undefined ? ['status'] : []),
          ],
        },
        'Pharmacy product updated',
      );
      const [view] = await this.readService.toCatalogDtos(
        tx,
        [product],
        new Map([[pharmacy.id, displayName(pharmacy)]]),
        true,
      );
      return view;
    });
  }

  /**
   * P47 D7: guarda de una vez las existencias de varios productos, todo o nada.
   *
   * Cada línea lleva cantidades (`stock`, `minStock`) **o** sólo `inStock`.
   * Las dos juntas, ninguna, un producto repetido, uno que no es de la farmacia
   * o uno retirado: 422 con el detalle de cada línea, y no se guarda ninguna.
   */
  async updateInventory(
    pharmacyId: string,
    dto: UpdateInventoryDto,
    actor: AuthenticatedUser,
  ): Promise<InventoryUpdatedDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const ids = dto.lines.map((line) => line.productId);
      const products = await tx.find(PharmacyProductsEntity, {
        id: { $in: [...new Set(ids)] },
        pharmacyId,
        statusConceptId: { $ne: PHARM.PRODUCT_RETIRED },
      });
      const byId = new Map(products.map((product) => [product.id, product]));
      const errors: { field: string; message: string }[] = [];
      const seen = new Set<string>();
      dto.lines.forEach((line, index) => {
        if (!byId.has(line.productId)) {
          errors.push({
            field: `lines.${index}.productId`,
            message: 'El producto no está en su catálogo',
          });
        }
        if (seen.has(line.productId)) {
          errors.push({
            field: `lines.${index}.productId`,
            message: 'El producto está repetido en el guardado',
          });
        }
        seen.add(line.productId);
        const quantities =
          line.stock !== undefined || line.minStock !== undefined;
        if (line.inStock === undefined && !quantities) {
          errors.push({
            field: `lines.${index}`,
            message:
              'La línea no dice qué cambiar: mande existencias, umbral o si hay',
          });
        }
        if (line.inStock !== undefined && line.stock !== undefined) {
          errors.push({
            field: `lines.${index}.inStock`,
            message:
              'Mande las existencias o si hay, no las dos: dirían dos cosas a la vez',
          });
        }
      });
      if (errors.length > 0) {
        throw new PreconditionFailedException(
          'El inventario tiene líneas inválidas',
          { errors },
        );
      }
      for (const line of dto.lines) {
        const product = byId.get(line.productId)!;
        applyStockChange(product, line);
        touch(product, actor.id);
      }
      await tx.flush();
      this.logger.info(
        {
          operation: 'pharmacy.inventory.update',
          pharmacyId,
          lines: dto.lines.length,
        },
        'Pharmacy inventory updated',
      );
      return { updated: dto.lines.length };
    });
  }

  /**
   * Aplica precio, categoría, descripción, existencias e imágenes (P47 §3-5).
   * El producto ya tiene que estar persistido (las FK lo exigen).
   *
   * @returns Si cambió algo.
   */
  private async applyCatalogFields(
    tx: EntityManager,
    pharmacy: Pharmacies,
    product: PharmacyProducts,
    input: CatalogFieldsInput,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    let touched = false;
    if (input.category !== undefined) {
      // La categoría se resuelve sólo entre las de ESTA farmacia; la FK
      // compuesta (pharmacy_id, categoría) lo vuelve a exigir en la base.
      const category =
        input.category === null
          ? null
          : await this.categories.resolveByName(
              tx,
              pharmacy.id,
              input.category,
            );
      Object.assign(product, {
        pharmacyProductCategoryId: category?.id ?? null,
      });
      touched = true;
    }
    if (input.description !== undefined) {
      const text = input.description?.trim() ?? '';
      Object.assign(product, { descriptionText: text === '' ? null : text });
      touched = true;
    }
    if (
      input.stock !== undefined ||
      input.minStock !== undefined ||
      input.inStock !== undefined
    ) {
      applyStockChange(product, input);
      touched = true;
    }
    if (input.imageFileIds !== undefined) {
      await this.replaceImages(tx, product, input.imageFileIds, actor);
      touched = true;
    }
    if (input.unitPrice !== undefined) {
      await this.setCatalogPrice(
        tx,
        pharmacy.id,
        product,
        input.unitPrice,
        actor,
      );
      touched = true;
    }
    return touched;
  }

  /**
   * Reemplaza las imágenes del producto. Las que ya tenía se conservan sin
   * volver a preguntar; una nueva tiene que ser un archivo de categoría IMAGE,
   * vivo, de un tipo de imagen admitido y **subido por quien edita**
   * (`AttachableFileService.assertUsableBy`, la misma regla que el avatar y la
   * media de una publicación). Un uuid ajeno o inventado no se cuelga.
   */
  private async replaceImages(
    tx: EntityManager,
    product: PharmacyProducts,
    fileIds: readonly string[],
    actor: AuthenticatedUser,
  ): Promise<void> {
    const current = new Set(
      (await this.pharmacyCatalogRepo.findImageFileIds(tx, [product.id])).get(
        product.id,
      ) ?? [],
    );
    for (const fileId of fileIds) {
      if (current.has(fileId)) continue;
      const { file } = await this.attachableFiles.assertUsableBy(
        tx,
        fileId,
        actor,
        {
          allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.IMAGE,
          operation: 'pharmacy.product.images',
        },
        {
          subject: 'La imagen del producto',
          notFound: 'La imagen del producto no existe',
        },
      );
      if (file.categoryConceptId !== CONCEPTS.FILE_CATEGORY_IMAGE) {
        throw new PreconditionFailedException(
          'La imagen del producto no es un archivo de imagen',
          { fileId },
        );
      }
    }
    await this.pharmacyCatalogRepo.replaceImages(
      tx,
      product.id,
      fileIds,
      actor.id,
    );
  }

  /**
   * Fija —o quita— el precio de venta en la lista pública `CATALOGO` de la
   * farmacia, con el mismo versionado que UC-24-06: la versión vigente pasa a
   * SUPERSEDED y la nueva toma `max+1`. El mismo importe otra vez no crea una
   * versión (idempotente ante reintentos). El importe es texto exacto.
   */
  private async setCatalogPrice(
    tx: EntityManager,
    pharmacyId: string,
    product: PharmacyProducts,
    value: number | string | null,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const amount = value === null ? null : normalizeMoney(value);
    if (value !== null && amount === null) {
      // El DTO ya lo valida; esto cubre a quien llame sin pasar por él.
      throw new BadRequestException(
        'unitPrice debe ser un importe positivo con hasta 2 decimales',
      );
    }
    let list = await this.pharmacyCatalogRepo.lockCatalogPriceList(
      tx,
      pharmacyId,
    );
    if (!list) {
      if (amount === null) return;
      list = this.pharmacyCatalogRepo.createCatalogPriceList(
        tx,
        pharmacyId,
        actor.id,
      );
      await tx.flush();
    }
    const active = await this.pricesRepo.findActiveByListAndProduct(
      tx,
      list.id,
      product.id,
      PHARM.PRICE_ACTIVE,
    );
    if (
      amount !== null &&
      active.length === 1 &&
      normalizeMoney(active[0].unitAmount) === amount
    ) {
      return;
    }
    const now = new Date();
    for (const previous of active) {
      previous.statusConceptId = PHARM.PRICE_SUPERSEDED;
      previous.effectiveTo = now;
    }
    if (amount === null) return;
    const maxVersion = await this.pricesRepo.maxVersionNumber(
      tx,
      list.id,
      product.id,
    );
    this.pricesRepo.create(tx, {
      pharmacyPriceListId: list.id,
      pharmacyProductId: product.id,
      versionNumber: maxVersion + 1,
      unitAmount: amount,
      effectiveFrom: now,
      statusConceptId: PHARM.PRICE_ACTIVE,
      recordedAt: now,
      recordedByUserId: actor.id,
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
      throw new ConflictException('Ya cargó ese producto y presentación', {
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
          'El producto tiene más de una presentación: mande catalogPresentationCode',
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
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const product = await this.productsRepo.findById(tx, productId);
      if (!product || product.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Producto no encontrado', {
          productId,
        });
      }
      // Publicado o borrador se retiran; un retirado ya no está activo.
      if (product.statusConceptId === PHARM.PRODUCT_RETIRED) {
        throw new PreconditionFailedException('El producto no está activo', {
          productId,
        });
      }

      await this.retireInTx(tx, product, actor);
      return { ok: true };
    });
  }

  /**
   * UC-24-09 en la transacción de quien llama: marca RETIRED, supersede los
   * precios vigentes e inactiva los mapeos externos. Lo usan el DELETE y el
   * `PATCH {status:'WITHDRAWN'}`.
   */
  private async retireInTx(
    tx: EntityManager,
    product: PharmacyProducts,
    actor: AuthenticatedUser,
  ): Promise<void> {
    product.statusConceptId = PHARM.PRODUCT_RETIRED;
    touch(product, actor.id);

    const now = new Date();
    const prices = await this.pricesRepo.findActiveByProduct(
      tx,
      product.id,
      PHARM.PRICE_ACTIVE,
    );
    for (const price of prices) {
      price.statusConceptId = PHARM.PRICE_SUPERSEDED;
      price.effectiveTo = now;
    }

    const mappings = await this.mappingsRepo.findActiveByProduct(
      tx,
      product.id,
      PHARM.MAPPING_INACTIVE,
    );
    for (const mapping of mappings) {
      mapping.verificationStatusConceptId = PHARM.MAPPING_INACTIVE;
      touch(mapping, actor.id);
    }

    this.logger.info(
      {
        operation: 'pharmacy.product.retire',
        productId: product.id,
        supersededPrices: prices.length,
        inactivatedMappings: mappings.length,
      },
      'Pharmacy product retired',
    );
  }
}

/** Claves del catálogo de la farmacia, para el log de cambios. */
const CATALOG_FIELD_NAMES = [
  'unitPrice',
  'category',
  'description',
  'inStock',
  'stock',
  'minStock',
  'imageFileIds',
] as const satisfies readonly (keyof UpdateProductDto)[];

/** `stock` e `inStock` juntos dirían dos cosas a la vez: 422. */
function assertOneStockForm(input: CatalogFieldsInput): void {
  if (input.stock !== undefined && input.inStock !== undefined) {
    throw new PreconditionFailedException(
      'Mande las existencias o si hay, no las dos: dirían dos cosas a la vez',
      { field: 'inStock' },
    );
  }
}
