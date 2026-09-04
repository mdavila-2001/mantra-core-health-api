import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  CONCEPT_DEFS,
  ConflictException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
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
        );
      }

      const item = this.serviceCatalogRepo.create(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
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
        throw new ResourceNotFoundException('Servicio no encontrado', { id });
      }
      await this.assertPuedeEditar(actor, item.practiceId, id);

      if (dto.name !== undefined) item.name = dto.name;
      if (dto.isActive !== undefined) item.isActive = dto.isActive;
      if (dto.defaultPrice !== undefined) {
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
  private async assertPuedeEditar(
    actor: AuthenticatedUser,
    practiceId: string,
    serviceId: string,
  ): Promise<void> {
    if (actor.practitionerProfileId !== undefined) {
      const propias =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          actor.practitionerProfileId,
        );
      if (propias.includes(practiceId)) return;
    }

    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      const tenantDeLaPractica =
        await this.practiceTenantLookup.findTenantOfPractice(practiceId);
      // Sin tenant en contexto son los carriles internos, que no pasan por la
      // cabecera: lo único que se exige es que la práctica exista.
      if (
        tenantDeLaPractica !== null &&
        (tenantId === undefined || tenantDeLaPractica === tenantId)
      ) {
        return;
      }
    }

    throw new ResourceNotFoundException('Servicio no encontrado', {
      id: serviceId,
    });
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
