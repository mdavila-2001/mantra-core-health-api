import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  CONCEPT_DEFS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  getCurrentTenantId,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  AttachableFileService,
  FileUploadService,
} from '../../common/services';
import type { FileContentDto } from '../../common/dto';
import { PracticeTenantLookupService } from '../../practice/services';
import { ServiceCatalogRepository } from '../repositories';
import {
  CreateServiceCatalogItemDto,
  SearchServiceCatalogResponseDto,
  ServiceCatalogItemDto,
  UpdateServiceCatalogItemDto,
} from '../dto';

/** Tope de servicios por página cuando el cliente no pide uno. */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Lo que puede servir la ruta de imagen de un servicio: una imagen de la
 * categoría «imagen» y de tipo web. Es lo que impide que un `imageFileId`
 * apuntado a otro archivo (evidencia de identidad, un PDF clínico) se
 * convierta en una descarga por esta ruta.
 */
const SERVICE_IMAGE_OPTIONS = {
  allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  operation: 'billing.service-catalog.image',
} as const;

/**
 * Sigla de las monedas globales, por concepto.
 *
 * Sólo las dos del juego global: el proyecto arrastra cuatro juegos de conceptos
 * de moneda sin unificar y adivinar la sigla de los otros sería inventar.
 */
const CURRENCY_CODE_BY_CONCEPT: Readonly<Record<string, string>> =
  Object.freeze({
    [CONCEPTS.CURRENCY_BOB]: CONCEPT_DEFS.CURRENCY_BOB.code,
    [CONCEPTS.CURRENCY_USD]: CONCEPT_DEFS.CURRENCY_USD.code,
  });

/**
 * Catálogo maestro de servicios (`billing.service_catalog`): lista fija sobre la
 * que cada doctor arma su presupuesto. El precio de catálogo es sólo referencia
 * — cada presupuesto lleva el precio propio que puso el profesional, nunca
 * `defaultPrice` a ciegas.
 */
/**
 * Un precio en 0 no se acepta al dar de alta ni al corregir un servicio: la
 * cita se cobraría en 0,00 (FAC-06). Un negativo ya lo rechaza el DTO con 400;
 * acá solo llega un importe no negativo con hasta dos decimales. Lo que crea
 * el sistema («Cita médica» en `0.00` al dar de alta una práctica) no pasa por
 * este servicio y sigue igual.
 *
 * @param price - Importe validado por el DTO, como texto.
 * @throws PreconditionFailedException (422) si el importe es 0.
 */
function assertPricePositive(price: string): void {
  if (Number(price) > 0) return;
  throw new PreconditionFailedException(
    'El precio tiene que ser mayor que 0',
    { defaultPrice: price },
    BillingErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
  );
}

@Injectable()
export class BillingServiceCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceCatalogRepo - Valor de service catalog repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly attachableFiles: AttachableFileService,
    private readonly fileUpload: FileUploadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BillingServiceCatalogService.name);
  }

  /**
   * Lista una página del catálogo, ordenada por código.
   *
   * Sin rol de administración: cualquier profesional que arme un presupuesto
   * necesita leer la lista fija de servicios sobre la que cotiza.
   *
   * @param options - Filtros y paginación de la búsqueda.
   * @returns Página de servicios del catálogo.
   */
  async search(options: {
    /** Práctica dueña del catálogo. */
    practiceId: string;
    /** Texto libre sobre código o nombre. */
    query?: string;
    /** Sólo servicios activos cuando es `true`. */
    isActive?: boolean;
    /** Cursor opaco devuelto por la página anterior. */
    cursor?: string;
    /** Tope de filas de la página. */
    limit?: number;
  }): Promise<SearchServiceCatalogResponseDto> {
    const em = this.em.fork();
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterCode = typeof after?.code === 'string' ? after.code : undefined;

    // Se pide una fila de más para saber si hay página siguiente sin pagar un
    // COUNT sobre toda la tabla en cada página.
    const rows = await this.serviceCatalogRepo.searchPage(
      em,
      {
        practiceId: options.practiceId,
        query: options.query,
        isActive: options.isActive,
        afterCode,
      },
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((row) => toItemDto(row)),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last ? encodeKeysetCursor({ code: last.code }) : null,
    };
  }

  /**
   * Bytes de la imagen de un servicio, para quien puede ver ese servicio
   * (decisión P-22-8, opción 1).
   *
   * `common.files` solo entrega un archivo a quien lo subió o a un rol de
   * revisión (`canActorReadOwnFile`), así que un paciente que consulta el
   * servicio recibiría 403. La política global de archivos no se abre: esta
   * ruta autoriza **por contexto**, que es el patrón de chat y de community.
   *
   * «Puede ver el servicio» significa, acá y sin más: sesión autenticada con
   * tenant verificado, servicio **activo** y la práctica que lo ofrece
   * pertenece a ese tenant. El tenant sale de `requireTenantId()`, nunca del
   * cliente. Un servicio inactivo, ajeno o inexistente responde el mismo 404;
   * también el que no tiene imagen, o cuyo archivo no es una imagen de
   * sensibilidad normal con versión vigente utilizable, para no decirle a
   * quien prueba uuids cuáles existen.
   *
   * No hay variante anónima: el catálogo público sigue sin exponer
   * `image_file_id` (opción 2, no elegida).
   *
   * @param id - Servicio del catálogo (`billing.service_catalog.id`).
   * @returns Bytes y tipo MIME de la imagen.
   * @throws ResourceNotFoundException (404 uniforme) en cualquier caso en que el actor no deba verla.
   */
  async getImageContent(id: string): Promise<FileContentDto> {
    const tenantId = requireTenantId();
    const notVisible = {
      message: 'Imagen no encontrada',
      reason: BillingErrorReason.SERVICE_CATALOG_ITEM_NOT_VISIBLE,
    };
    const em = this.em.fork();
    const item = await this.serviceCatalogRepo.findById(em, id);
    const practiceTenantId = item
      ? await this.practiceTenantLookup.findTenantOfPractice(item.practiceId)
      : null;
    // Lanza el 404 uniforme si el servicio no existe o su práctica es ajena.
    const visible = assertResourceInTenant(
      item,
      practiceTenantId,
      tenantId,
      notVisible,
    );
    const imageFileId = visible.isActive ? visible.imageFileId : undefined;
    if (!imageFileId) {
      throw new ResourceNotFoundException(
        notVisible.message,
        undefined,
        notVisible.reason,
      );
    }

    try {
      const { file } =
        await this.attachableFiles.assertUsableForAuthorizedContext(
          em,
          imageFileId,
          SERVICE_IMAGE_OPTIONS,
        );
      // Pertenencia: el `imageFileId` guardado no prueba que el archivo sea de
      // esta organización (el alta lo aceptaba sin validar). Un archivo de otro
      // tenant no se sirve aunque el servicio ya lo apunte.
      if (
        file.sensitivityConceptId === CONCEPTS.SENSITIVITY_NORMAL &&
        file.tenantId === tenantId
      ) {
        const content = await this.fileUpload.downloadForAuthorizedContext(
          imageFileId,
          SERVICE_IMAGE_OPTIONS.operation,
        );
        // Se valida una versión y se descarga la vigente: se vuelve a comprobar
        // sobre lo que de verdad se va a enviar.
        const allowed: readonly string[] =
          SERVICE_IMAGE_OPTIONS.allowedMimeTypes;
        if (allowed.includes(content.mimeType)) {
          return content;
        }
      }
    } catch {
      // Archivo inexistente, borrado, infectado o de otro tipo: para quien
      // pregunta es lo mismo que «el servicio no tiene imagen». Los detalles
      // (el uuid del archivo) no salen en la respuesta.
    }
    this.logger.warn(
      { operation: SERVICE_IMAGE_OPTIONS.operation, serviceCatalogId: id },
      'Service image is not servable',
    );
    throw new ResourceNotFoundException(
      notVisible.message,
      undefined,
      notVisible.reason,
    );
  }

  /**
   * Crea un servicio nuevo en el catálogo maestro.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Servicio recién creado.
   * @throws ConflictException si ya existe un servicio con ese código en la práctica.
   */
  async create(
    dto: CreateServiceCatalogItemDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceCatalogItemDto> {
    this.logger.info(
      {
        operation: 'billing.service-catalog.create',
        practiceId: dto.practiceId,
        code: dto.code,
        actorId: actor.id,
      },
      'Creating service catalog item',
    );
    await this.assertRegistrationCanRegister(actor, dto.practiceId);
    assertPricePositive(dto.defaultPrice);
    if (dto.imageFileId !== undefined) {
      await this.assertImageUsable(dto.imageFileId, actor);
    }
    return this.em.transactional(async (tx) => {
      const clash = await this.serviceCatalogRepo.findByCode(
        tx,
        dto.practiceId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un servicio con ese código en el catálogo',
          { code: dto.code },
          BillingErrorReason.SERVICE_CATALOG_CODE_ALREADY_EXISTS,
        );
      }

      const item = this.serviceCatalogRepo.create(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        descriptionText: dto.descriptionText,
        imageFileId: dto.imageFileId,
        serviceConceptId: dto.serviceConceptId,
        defaultPrice: dto.defaultPrice,
        currencyConceptId: dto.currencyConceptId,
        taxCodeId: dto.taxCodeId,
        incomeAccountId: dto.incomeAccountId,
        isActive: dto.isActive ?? true,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'billing.service-catalog.create',
          serviceCatalogId: item.id,
        },
        'Service catalog item created',
      );
      return toItemDto(item);
    });
  }

  /**
   * Exige que el archivo que se quiere poner como imagen del servicio sea del
   * actor, de su organización, una imagen de sensibilidad normal y utilizable.
   *
   * Es la misma regla que aplica el logo de la organización
   * (`assertUsableBy`: propio, vivo, con versión vigente sin infectar y del tipo
   * admitido) más la sensibilidad y el tenant. Sin esto, `imageFileId` apuntaba a
   * cualquier uuid y la ruta de imagen lo habría servido a toda la organización.
   * Cualquier incumplimiento —archivo inexistente, ajeno, de otro tenant o de
   * otro tipo— responde el mismo 404, para no confirmar qué uuids existen.
   */
  private async assertImageUsable(
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = requireTenantId();
    try {
      const { file } = await this.attachableFiles.assertUsableBy(
        this.em.fork(),
        fileId,
        actor,
        SERVICE_IMAGE_OPTIONS,
      );
      if (
        file.sensitivityConceptId === CONCEPTS.SENSITIVITY_NORMAL &&
        file.tenantId === tenantId
      ) {
        return;
      }
    } catch {
      // Se uniforma abajo: el motivo concreto no sale en la respuesta.
    }
    throw new ResourceNotFoundException(
      'Imagen no encontrada',
      undefined,
      BillingErrorReason.SERVICE_CATALOG_IMAGE_NOT_USABLE,
    );
  }

  /**
   * Quién puede dar de alta un servicio en una práctica.
   *
   * La administración de la organización, en cualquiera de las suyas; un profesional,
   * **sólo en su consultorio propio**. En una organización ajena el catálogo es de la
   * organización y el profesional sólo corrige precio y duraciones (ver `update`).
   *
   * Falla con 404 y no con 403 por el mismo motivo que `update`: el id de una
   * práctica ajena responde igual que uno inventado.
   *
   * Es público porque la importación en lote desde el arancel
   * (`ProcedureImportService`) exige **exactamente** el mismo alcance que el alta
   * individual: una sola regla, no dos copias que se desalineen.
   */
  async assertRegistrationCanRegister(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<void> {
    const administra =
      actor.roles.includes('SECURITY_ADMIN') ||
      actor.roles.includes('SUPERADMIN');
    if (administra) return;
    if (await this.practiceTenantLookup.isOwnOffice(practiceId, actor.id)) {
      return;
    }
    throw new ResourceNotFoundException('Práctica no encontrada', {
      practiceId,
    });
  }

  /**
   * Corrige un servicio del catálogo de una práctica propia (FT-22-R05).
   *
   * Existe porque «el precio es editable» no tenía endpoint: el alta la hace una
   * cuenta administradora y hasta acá el catálogo era inmutable. Lo que se edita
   * es el precio con su moneda, el nombre y si sigue ofreciéndose; el código y
   * la práctica identifican al servicio y no se mueven.
   *
   * @param id - Servicio a corregir (`billing.service_catalog.id`).
   * @param dto - Campos a corregir; los ausentes se conservan.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns El servicio ya corregido.
   * @throws ResourceNotFoundException si el servicio no existe o no es alcanzable por el actor.
   */
  async update(
    id: string,
    dto: UpdateServiceCatalogItemDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceCatalogItemDto> {
    this.logger.info(
      { operation: 'billing.service-catalog.update', id, actorId: actor.id },
      'Updating service catalog item',
    );
    return this.em.transactional(async (tx) => {
      const item = await this.serviceCatalogRepo.findById(tx, id);
      if (item === null) {
        throw new ResourceNotFoundException(
          'Servicio no encontrado',
          { id },
          BillingErrorReason.SERVICE_CATALOG_ITEM_NOT_FOUND,
        );
      }
      await this.assertCanEdit(actor, item.practiceId, id);

      if (dto.name !== undefined) item.name = dto.name;
      if (dto.isActive !== undefined) item.isActive = dto.isActive;
      if (dto.termsText !== undefined) {
        // Vacío es lo mismo que null: «sin términos propios», no un contrato
        // en blanco.
        const terms = dto.termsText?.trim() ?? '';
        item.termsText = terms === '' ? undefined : terms;
      }
      if (dto.defaultPrice !== undefined) {
        assertPricePositive(dto.defaultPrice);
        item.defaultPrice = dto.defaultPrice;
        // Un importe sin moneda no es un precio. La fila puede venir de un alta
        // que no la declaró: la primera edición la fija, y el boliviano es la
        // moneda del producto (lo mismo que hace el resto del código nuevo).
        item.currencyConceptId =
          dto.currencyConceptId ??
          item.currencyConceptId ??
          CONCEPTS.CURRENCY_BOB;
      }
      touch(item, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'billing.service-catalog.update',
          serviceCatalogId: item.id,
        },
        'Service catalog item updated',
      );
      return toItemDto(item);
    });
  }

  /**
   * Exige que el actor alcance esa práctica, por vinculación o por organización.
   *
   * Dos caminos, porque son dos figuras legítimas sobre el mismo catálogo: el
   * profesional que atiende en la práctica —y por eso pone el precio de lo que
   * ofrece— y la cuenta administradora de la organización, que es la que dio de
   * alta el servicio y tiene que poder corregirlo.
   *
   * **Falla siempre con 404, nunca 403**: un id de otra práctica responde lo
   * mismo que un id inventado, así que probar uuids no confirma la existencia de
   * nada (AC-22-3). Es la diferencia deliberada con
   * `LedgerReadService.verificarPracticaDelTenant`, donde quien pregunta ya tenía
   * el id de la práctica; acá el id es el del servicio.
   */
  private async assertCanEdit(
    actor: AuthenticatedUser,
    practiceId: string,
    serviceId: string,
  ): Promise<void> {
    if (actor.practitionerProfileId !== undefined) {
      const own =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          actor.practitionerProfileId,
        );
      if (own.includes(practiceId)) return;
    }

    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      const tenantPractice =
        await this.practiceTenantLookup.findTenantOfPractice(practiceId);
      // Sin tenant en contexto son los carriles internos, que no pasan por la
      // cabecera: lo único que se exige es que la práctica exista.
      if (
        tenantPractice !== null &&
        (tenantId === undefined || tenantPractice === tenantId)
      ) {
        return;
      }
    }

    throw new ResourceNotFoundException(
      'Servicio no encontrado',
      {
        id: serviceId,
      },
      BillingErrorReason.SERVICE_CATALOG_ITEM_NOT_VISIBLE,
    );
  }
}

/**
 * Traduce la entidad persistente a su forma pública de transporte.
 *
 * @param row - Entidad `ServiceCatalog` leída o recién creada.
 * @returns DTO de respuesta con los mismos datos.
 */
function toItemDto(row: {
  id: string;
  practiceId: string;
  code: string;
  name: string;
  descriptionText?: string;
  termsText?: string | null;
  imageFileId?: string;
  serviceConceptId?: string;
  defaultPrice: string;
  currencyConceptId?: string;
  taxCodeId?: string;
  incomeAccountId?: string;
  isActive: boolean;
}): ServiceCatalogItemDto {
  return {
    id: row.id,
    practiceId: row.practiceId,
    code: row.code,
    name: row.name,
    descriptionText: row.descriptionText,
    termsText: row.termsText ?? undefined,
    imageFileId: row.imageFileId,
    serviceConceptId: row.serviceConceptId,
    defaultPrice: row.defaultPrice,
    currencyConceptId: row.currencyConceptId,
    currencyCode:
      row.currencyConceptId === undefined
        ? undefined
        : CURRENCY_CODE_BY_CONCEPT[row.currencyConceptId],
    taxCodeId: row.taxCodeId,
    incomeAccountId: row.incomeAccountId,
    isActive: row.isActive,
  };
}
