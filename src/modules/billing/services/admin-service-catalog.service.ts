import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  CONCEPT_DEFS,
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import { CatalogConcepts } from '../../terminology/entities';
import { PracticesRepository } from '../../practice/repositories';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  ADMIN_SERVICE_CATALOG_DEFAULT_LIMIT,
  type AdminCreateServiceDto,
  type AdminListServicesQueryDto,
  type AdminServiceItemDto,
  type AdminServicePageDto,
  type AdminServiceScopesDto,
  type AdminUpdateServiceDto,
} from '../dto/admin-service-catalog.dto';
import { ServiceCatalogRepository } from '../repositories';

/** Sigla de las dos monedas del juego global (misma tabla que el catálogo por práctica). */
const CURRENCY_CODE_BY_CONCEPT: Readonly<Record<string, string>> =
  Object.freeze({
    [CONCEPTS.CURRENCY_BOB]: CONCEPT_DEFS.CURRENCY_BOB.code,
    [CONCEPTS.CURRENCY_USD]: CONCEPT_DEFS.CURRENCY_USD.code,
  });

/** Resultado de un alta: `created` distingue la primera vez de un reintento idempotente. */
export interface AdminServiceCreateResult {
  readonly item: AdminServiceItemDto;
  readonly created: boolean;
}

/** Fila mínima que necesita el mapeo (entidad `ServiceCatalog` o equivalente). */
interface CatalogRow {
  id: string;
  practiceId: string;
  code: string;
  name: string;
  descriptionText?: string | null;
  termsText?: string | null;
  serviceConceptId?: string | null;
  defaultPrice: string;
  currencyConceptId?: string | null;
  isActive: boolean;
  rowVersion: number;
  updatedAt: Date;
  updatedByUserId?: string | null;
}

/**
 * Editor administrativo del catálogo maestro de servicios (`billing.service_catalog`).
 *
 * Reutiliza la tabla y las reglas del catálogo por práctica
 * (`BillingServiceCatalogService`): sin tablas ni columnas nuevas. Lo que añade
 * es la vista **de toda la organización** (varias prácticas, filtrable por el
 * tipo de organización dueña), la versión visible, la edición con bloqueo
 * optimista y la desactivación como estado (nunca se borra).
 *
 * Autoridad: el rol lo filtra el controlador; la pertenencia al tenant se
 * comprueba acá, siempre contra `requireTenantId()` y nunca contra un id del
 * cliente. Un servicio o práctica ajenos responden el mismo 404 que uno
 * inexistente.
 */
@Injectable()
export class AdminServiceCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ServiceCatalogRepository,
    private readonly practices: PracticesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminServiceCatalogService.name);
  }

  /**
   * Tipos de organización, prácticas activas y monedas con las que se arma el
   * editor. Sólo de la organización del token (`requireTenantId()`).
   */
  async scopes(): Promise<AdminServiceScopesDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const practices = await this.practices.findByTenant(
      em,
      tenantId,
      PRAC.PRACTICE_ACTIVE,
    );
    const typeIds = [...new Set(practices.map((p) => p.typeConceptId))];
    const concepts =
      typeIds.length === 0
        ? []
        : await em.find(CatalogConcepts, { id: { $in: typeIds } });
    return {
      types: concepts
        .map((c) => ({ conceptId: c.id, code: c.code, display: c.display }))
        .sort((a, b) => a.display.localeCompare(b.display)),
      practices: practices
        .map((p) => ({
          id: p.id,
          name: p.name,
          typeConceptId: p.typeConceptId,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      currencies: Object.entries(CURRENCY_CODE_BY_CONCEPT).map(
        ([conceptId, code]) => ({ conceptId, code }),
      ),
    };
  }

  /** Página de servicios de las prácticas activas de la organización del actor. */
  async list(query: AdminListServicesQueryDto): Promise<AdminServicePageDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const limit = query.limit ?? ADMIN_SERVICE_CATALOG_DEFAULT_LIMIT;

    const tenantPractices = await this.practices.findByTenant(
      em,
      tenantId,
      PRAC.PRACTICE_ACTIVE,
    );
    if (
      query.practiceId !== undefined &&
      !tenantPractices.some((p) => p.id === query.practiceId)
    ) {
      throw this.practiceNotFound();
    }
    const scoped = tenantPractices.filter(
      (p) =>
        (query.practiceId === undefined || p.id === query.practiceId) &&
        (query.practiceTypeConceptId === undefined ||
          p.typeConceptId === query.practiceTypeConceptId),
    );
    const typeByPractice = new Map(
      tenantPractices.map((p) => [p.id, p.typeConceptId] as const),
    );

    let after: { code: string; id: string } | undefined;
    if (query.cursor) {
      const key = decodeKeysetCursor(query.cursor);
      if (typeof key.code === 'string' && typeof key.id === 'string') {
        after = { code: key.code, id: key.id };
      }
    }

    const rows = await this.repo.searchAdminPage(
      em,
      {
        practiceIds: scoped.map((p) => p.id),
        query: query.q,
        isActive: query.isActive,
        after,
      },
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);
    return {
      items: page.map((row) =>
        toAdminDto(row, typeByPractice.get(row.practiceId) as string),
      ),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ code: last.code, id: last.id })
          : null,
    };
  }

  /** Un servicio de la organización del actor. */
  async get(id: string): Promise<AdminServiceItemDto> {
    const em = this.em.fork();
    const { item, typeConceptId } = await this.loadInTenant(em, id);
    return toAdminDto(item, typeConceptId);
  }

  /**
   * Alta idempotente por clave natural `(practiceId, code)`.
   *
   * El mismo cuerpo repetido devuelve el servicio existente (`created: false`)
   * sin escribir; un código ocupado con datos distintos es 409.
   */
  async create(
    dto: AdminCreateServiceDto,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceCreateResult> {
    const tenantId = requireTenantId();
    assertPricePositive(dto.defaultPrice);
    return this.em.transactional(async (tx) => {
      const practice = await this.practices.findById(tx, dto.practiceId);
      if (!practice || practice.tenantId !== tenantId) {
        throw this.practiceNotFound();
      }
      const clash = await this.repo.findByCode(tx, dto.practiceId, dto.code);
      if (clash) {
        if (sameCreatePayload(clash, dto)) {
          return {
            item: toAdminDto(clash, practice.typeConceptId),
            created: false,
          };
        }
        throw new ConflictException(
          'Ya existe un servicio con ese código en el catálogo',
          { code: dto.code },
          BillingErrorReason.SERVICE_CATALOG_CODE_ALREADY_EXISTS,
        );
      }
      const item = this.repo.create(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        descriptionText: dto.descriptionText,
        serviceConceptId: dto.serviceConceptId,
        defaultPrice: dto.defaultPrice,
        currencyConceptId: dto.currencyConceptId ?? CONCEPTS.CURRENCY_BOB,
        isActive: dto.isActive ?? true,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'billing.admin-service-catalog.create', id: item.id },
        'Admin service catalog item created',
      );
      return { item: toAdminDto(item, practice.typeConceptId), created: true };
    });
  }

  /** Edición con precondición de versión: `expectedRowVersion` desfasada es 409. */
  async update(
    id: string,
    dto: AdminUpdateServiceDto,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.em.transactional(async (tx) => {
      const { item, typeConceptId } = await this.loadInTenant(tx, id);
      assertVersion(item.rowVersion, dto.expectedRowVersion, id);

      if (dto.name !== undefined) item.name = dto.name;
      if (dto.descriptionText !== undefined) {
        const text = dto.descriptionText?.trim() ?? '';
        item.descriptionText = (text === '' ? null : text) as never;
      }
      if (dto.termsText !== undefined) {
        const text = dto.termsText?.trim() ?? '';
        item.termsText = (text === '' ? null : text) as never;
      }
      if (dto.serviceConceptId !== undefined) {
        item.serviceConceptId = dto.serviceConceptId;
      }
      if (dto.defaultPrice !== undefined) {
        assertPricePositive(dto.defaultPrice);
        item.defaultPrice = dto.defaultPrice;
        item.currencyConceptId =
          dto.currencyConceptId ??
          item.currencyConceptId ??
          CONCEPTS.CURRENCY_BOB;
      }
      touch(item, actor.id);
      await tx.flush();
      return toAdminDto(item, typeConceptId);
    });
  }

  /**
   * Desactiva (`false`) o reactiva (`true`) un servicio. Idempotente: si ya está
   * en el estado pedido devuelve el servicio tal cual, sin subir la versión.
   */
  async setActive(
    id: string,
    isActive: boolean,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.em.transactional(async (tx) => {
      const { item, typeConceptId } = await this.loadInTenant(tx, id);
      if (item.isActive === isActive) return toAdminDto(item, typeConceptId);
      assertVersion(item.rowVersion, expectedRowVersion, id);
      item.isActive = isActive;
      touch(item, actor.id);
      await tx.flush();
      return toAdminDto(item, typeConceptId);
    });
  }

  /** Servicio + tipo de su práctica, o 404 uniforme si no existe o es de otra organización. */
  private async loadInTenant(em: EntityManager, id: string) {
    const tenantId = requireTenantId();
    const item = await this.repo.findById(em, id);
    const practice = item
      ? await this.practices.findById(em, item.practiceId)
      : null;
    if (!item || !practice || practice.tenantId !== tenantId) {
      throw new ResourceNotFoundException(
        'Servicio no encontrado',
        undefined,
        BillingErrorReason.SERVICE_CATALOG_ITEM_NOT_VISIBLE,
      );
    }
    return { item, typeConceptId: practice.typeConceptId };
  }

  private practiceNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Práctica no encontrada',
      undefined,
      BillingErrorReason.SERVICE_CATALOG_ITEM_NOT_VISIBLE,
    );
  }
}

function assertPricePositive(price: string): void {
  if (Number(price) > 0) return;
  throw new PreconditionFailedException(
    'El precio tiene que ser mayor que 0',
    { defaultPrice: price },
    BillingErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
  );
}

function assertVersion(actual: number, expected: number, id: string): void {
  if (actual === expected) return;
  throw new ConcurrencyConflictException(
    'El servicio fue modificado por otra persona; recargue y reintente',
    { id, expected, actual },
    BillingErrorReason.SERVICE_CATALOG_VERSION_MISMATCH,
  );
}

/** ¿Un alta repetida describe el mismo servicio? Compara sólo lo que el alta fija. */
function sameCreatePayload(
  row: CatalogRow,
  dto: AdminCreateServiceDto,
): boolean {
  return (
    row.name === dto.name &&
    Number(row.defaultPrice) === Number(dto.defaultPrice) &&
    (row.descriptionText ?? undefined) === dto.descriptionText &&
    (row.serviceConceptId ?? undefined) === dto.serviceConceptId
  );
}

function toAdminDto(
  row: CatalogRow,
  typeConceptId: string,
): AdminServiceItemDto {
  return {
    id: row.id,
    practiceId: row.practiceId,
    practiceTypeConceptId: typeConceptId,
    code: row.code,
    name: row.name,
    descriptionText: row.descriptionText ?? undefined,
    termsText: row.termsText ?? undefined,
    serviceConceptId: row.serviceConceptId ?? undefined,
    defaultPrice: row.defaultPrice,
    currencyConceptId: row.currencyConceptId ?? undefined,
    currencyCode:
      row.currencyConceptId == null
        ? undefined
        : CURRENCY_CODE_BY_CONCEPT[row.currencyConceptId],
    isActive: row.isActive,
    rowVersion: row.rowVersion,
    updatedAt: row.updatedAt.toISOString(),
    updatedByUserId: row.updatedByUserId ?? undefined,
  };
}
