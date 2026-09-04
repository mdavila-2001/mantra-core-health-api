import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceCatalogRepository } from '../repositories';
import {
  CreateServiceCatalogItemDto,
  SearchServiceCatalogResponseDto,
  ServiceCatalogItemDto,
} from '../dto';

/** Tope de servicios por página cuando el cliente no pide uno. */
const DEFAULT_PAGE_SIZE = 50;

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
    imageFileId: row.imageFileId,
    serviceConceptId: row.serviceConceptId,
    defaultPrice: row.defaultPrice,
    currencyConceptId: row.currencyConceptId,
    taxCodeId: row.taxCodeId,
    incomeAccountId: row.incomeAccountId,
    isActive: row.isActive,
  };
}
