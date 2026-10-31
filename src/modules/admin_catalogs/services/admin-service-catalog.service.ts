import { Injectable } from '@nestjs/common';
import { OptimisticLockError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  CONCEPT_DEFS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  decodeKeysetCursor,
  encodeKeysetCursor,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { ServiceCatalog } from '../../billing/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { Practices } from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { AdminCatalogsErrorReason } from '../admin-catalogs.error-reasons';
import type {
  AdminCreateServiceDto,
  AdminServiceCreateResult,
  AdminServiceItemDto,
  AdminServiceListQueryDto,
  AdminServicePageDto,
  AdminServiceScopesDto,
  AdminUpdateServiceDto,
} from '../dto/admin-service-catalog.dto';

const DEFAULT_PAGE_SIZE = 50;

/** Monedas admitidas en el catálogo: sólo las dos del juego global (no se adivina la sigla de otras). */
const CURRENCIES: readonly { conceptId: string; code: string }[] = [
  { conceptId: CONCEPTS.CURRENCY_BOB, code: CONCEPT_DEFS.CURRENCY_BOB.code },
  { conceptId: CONCEPTS.CURRENCY_USD, code: CONCEPT_DEFS.CURRENCY_USD.code },
];
const CURRENCY_CODE_BY_CONCEPT = new Map(
  CURRENCIES.map((c) => [c.conceptId, c.code]),
);

const PRACTICE_NOT_FOUND = {
  message: 'Práctica no encontrada',
  reason: AdminCatalogsErrorReason.SERVICE_PRACTICE_NOT_FOUND,
};
const SERVICE_NOT_FOUND = {
  message: 'Servicio no encontrado',
  reason: AdminCatalogsErrorReason.SERVICE_NOT_FOUND,
};

/** Un precio en cero no se acepta: la cita se cobraría en 0,00. */
function assertPricePositive(price: string): void {
  if (Number(price) > 0) return;
  throw new PreconditionFailedException(
    'El precio tiene que ser mayor que 0',
    { defaultPrice: price },
    AdminCatalogsErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
  );
}

/** Vacío o `null` limpia el texto. */
function cleared(value: string | null): string | undefined {
  return value === null || value.trim() === '' ? undefined : value.trim();
}

/**
 * Editor de catálogos globales · Servicios (`billing.service_catalog`).
 *
 * - **Alcance**: todo se acota a las prácticas de la organización del token
 *   (`requireTenantId()`, nunca del cuerpo). Un servicio o una práctica de otra
 *   organización responde el mismo 404 que uno inexistente.
 * - **Versión optimista**: toda edición trae `expectedRowVersion`; si no es la
 *   vigente, 409 `SERVICE_CATALOG_VERSION_MISMATCH` con `expected`/`actual` y
 *   nada se escribe. La carrera entre dos edición simultáneas la cierra el
 *   `version: true` de la entidad (`OptimisticLockError` → mismo 409).
 * - **Sin borrado**: desactivar conserva el registro. Desactivar o reactivar lo
 *   que ya está en ese estado es idempotente y no sube la versión.
 * - El «tipo de usuario» de un servicio es el tipo de la organización dueña
 *   (`practice.practices.type_concept_id`).
 */
@Injectable()
export class AdminServiceCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminServiceCatalogService.name);
  }

  /** Tipos de organización, prácticas activas y monedas con las que se arma el editor. */
  async scopes(): Promise<AdminServiceScopesDto> {
    const em = this.em.fork();
    const practices = await this.activePractices(em);
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
      currencies: [...CURRENCIES],
    };
  }

  async list(query: AdminServiceListQueryDto): Promise<AdminServicePageDto> {
    const em = this.em.fork();
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    let practices = await this.activePractices(em);
    if (query.practiceId !== undefined) {
      // Una práctica ajena (o inexistente) es 404, no una lista vacía.
      if (!practices.some((p) => p.id === query.practiceId)) {
        throw new ResourceNotFoundException(
          PRACTICE_NOT_FOUND.message,
          undefined,
          PRACTICE_NOT_FOUND.reason,
        );
      }
      practices = practices.filter((p) => p.id === query.practiceId);
    }
    if (query.practiceTypeConceptId !== undefined) {
      practices = practices.filter(
        (p) => p.typeConceptId === query.practiceTypeConceptId,
      );
    }
    if (practices.length === 0) {
      return { items: [], count: 0, limit, nextCursor: null };
    }

    const where: Record<string, unknown> = {
      practiceId: { $in: practices.map((p) => p.id) },
    };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
      where.$or = [
        { code: { $ilike: pattern } },
        { name: { $ilike: pattern } },
      ];
    }
    if (query.cursor) {
      const after = decodeKeysetCursor(query.cursor);
      if (typeof after.code !== 'string' || typeof after.id !== 'string') {
        // Un cursor que no es de esta lista no se interpreta a medias.
        throw new ResourceNotFoundException(
          'Cursor no válido',
          undefined,
          AdminCatalogsErrorReason.SERVICE_NOT_FOUND,
        );
      }
      // Orden determinista (code, id): el id desempata códigos repetidos entre prácticas.
      where.$and = [
        {
          $or: [
            { code: { $gt: after.code } },
            { code: after.code, id: { $gt: after.id } },
          ],
        },
      ];
    }

    // Una fila de más para saber si hay página siguiente sin un COUNT.
    const rows = await em.find(ServiceCatalog, where, {
      orderBy: { code: 'ASC', id: 'ASC' },
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const typeByPractice = new Map(
      practices.map((p) => [p.id, p.typeConceptId]),
    );
    const last = page.at(-1);
    return {
      items: page.map((row) =>
        toItemDto(row, typeByPractice.get(row.practiceId) ?? ''),
      ),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ code: last.code, id: last.id })
          : null,
    };
  }

  async get(id: string): Promise<AdminServiceItemDto> {
    const em = this.em.fork();
    const { item, practice } = await this.loadInTenant(em, id);
    return toItemDto(item, practice.typeConceptId);
  }

  /** Alta idempotente por `(practiceId, code)`: repetir el mismo contenido devuelve el mismo servicio. */
  async create(
    dto: AdminCreateServiceDto,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceCreateResult> {
    const tenantId = requireTenantId();
    assertPricePositive(dto.defaultPrice);
    const currencyConceptId = dto.currencyConceptId ?? CONCEPTS.CURRENCY_BOB;
    if (!CURRENCY_CODE_BY_CONCEPT.has(currencyConceptId)) {
      throw new PreconditionFailedException(
        'La moneda no está admitida para el catálogo',
        { currencyConceptId },
        AdminCatalogsErrorReason.SERVICE_CATALOG_CURRENCY_NOT_SUPPORTED,
      );
    }
    return this.em.transactional((tx) =>
      this.createInPractice(tx, tenantId, dto, currencyConceptId, actor),
    );
  }

  private async createInPractice(
    tx: EntityManager,
    tenantId: string,
    dto: AdminCreateServiceDto,
    currencyConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceCreateResult> {
    const practice = await tx.findOne(Practices, { id: dto.practiceId });
    const owned = assertResourceInTenant(
      practice,
      practice?.tenantId,
      tenantId,
      PRACTICE_NOT_FOUND,
    );
    const clash = await tx.findOne(ServiceCatalog, {
      practiceId: dto.practiceId,
      code: dto.code,
    });
    if (clash) {
      const identical =
        clash.name === dto.name &&
        price2(clash.defaultPrice) === price2(dto.defaultPrice) &&
        (clash.descriptionText ?? undefined) === dto.descriptionText &&
        clash.currencyConceptId === currencyConceptId;
      if (identical)
        return { item: toItemDto(clash, owned.typeConceptId), created: false };
      throw new ConflictException(
        'Ya existe un servicio con ese código en la práctica',
        { code: dto.code },
        AdminCatalogsErrorReason.SERVICE_CATALOG_CODE_ALREADY_EXISTS,
      );
    }
    const item = tx.create(
      ServiceCatalog,
      {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        descriptionText: dto.descriptionText,
        serviceConceptId: dto.serviceConceptId,
        defaultPrice: dto.defaultPrice,
        currencyConceptId,
        isActive: dto.isActive ?? true,
        ...createdBy(actor.id),
      },
      { partial: true },
    );
    await tx.flush();
    this.logger.info(
      {
        operation: 'admin-catalogs.service.create',
        serviceCatalogId: item.id,
        actorId: actor.id,
      },
      'Service created',
    );
    return { item: toItemDto(item, owned.typeConceptId), created: true };
  }

  async update(
    id: string,
    dto: AdminUpdateServiceDto,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    const editable = [
      dto.name,
      dto.descriptionText,
      dto.termsText,
      dto.serviceConceptId,
      dto.defaultPrice,
    ];
    if (editable.every((v) => v === undefined)) {
      throw new PreconditionFailedException(
        'La edición no trae ningún campo para cambiar',
        undefined,
        AdminCatalogsErrorReason.SERVICE_CATALOG_EMPTY_UPDATE,
      );
    }
    if (dto.defaultPrice !== undefined) assertPricePositive(dto.defaultPrice);
    if (
      dto.currencyConceptId !== undefined &&
      !CURRENCY_CODE_BY_CONCEPT.has(dto.currencyConceptId)
    ) {
      throw new PreconditionFailedException(
        'La moneda no está admitida para el catálogo',
        { currencyConceptId: dto.currencyConceptId },
        AdminCatalogsErrorReason.SERVICE_CATALOG_CURRENCY_NOT_SUPPORTED,
      );
    }
    return this.mutate(id, dto.expectedRowVersion, actor, (item) => {
      if (dto.name !== undefined) item.name = dto.name;
      if (dto.descriptionText !== undefined)
        item.descriptionText = cleared(dto.descriptionText);
      if (dto.termsText !== undefined) item.termsText = cleared(dto.termsText);
      if (dto.serviceConceptId !== undefined)
        item.serviceConceptId = dto.serviceConceptId;
      if (dto.defaultPrice !== undefined) {
        item.defaultPrice = dto.defaultPrice;
        // La moneda sólo viaja con el precio: cambiar una sin la otra cambiaría lo que vale el servicio.
        if (dto.currencyConceptId !== undefined)
          item.currencyConceptId = dto.currencyConceptId;
      }
    });
  }

  /** Desactivar/reactivar: idempotente, no sube la versión si ya está en ese estado. */
  async setActive(
    id: string,
    expectedRowVersion: number,
    active: boolean,
    actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.mutate(
      id,
      expectedRowVersion,
      actor,
      (item) => {
        item.isActive = active;
      },
      (item) => item.isActive === active,
    );
  }

  private async mutate(
    id: string,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
    apply: (item: ServiceCatalog) => void,
    isNoop: (item: ServiceCatalog) => boolean = () => false,
  ): Promise<AdminServiceItemDto> {
    try {
      return await this.em.transactional(async (tx) => {
        const { item, practice } = await this.loadInTenant(tx, id);
        if (item.rowVersion !== expectedRowVersion)
          throw versionMismatch(expectedRowVersion, item.rowVersion);
        if (isNoop(item)) return toItemDto(item, practice.typeConceptId);
        apply(item);
        touch(item, actor.id);
        await tx.flush();
        this.logger.info(
          {
            operation: 'admin-catalogs.service.mutate',
            serviceCatalogId: id,
            actorId: actor.id,
          },
          'Service updated',
        );
        return toItemDto(item, practice.typeConceptId);
      });
    } catch (error) {
      if (error instanceof OptimisticLockError)
        throw versionMismatch(expectedRowVersion, undefined);
      throw error;
    }
  }

  private async activePractices(em: EntityManager): Promise<Practices[]> {
    return em.find(Practices, {
      tenantId: requireTenantId(),
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
  }

  /** Carga el servicio y comprueba que su práctica es de la organización activa; si no, el mismo 404. */
  private async loadInTenant(
    em: EntityManager,
    id: string,
  ): Promise<{ item: ServiceCatalog; practice: Practices }> {
    const tenantId = requireTenantId();
    const found = await em.findOne(ServiceCatalog, { id });
    const practice = found
      ? await em.findOne(Practices, { id: found.practiceId })
      : null;
    const item = assertResourceInTenant(
      found,
      practice?.tenantId,
      tenantId,
      SERVICE_NOT_FOUND,
    );
    return { item, practice: practice! };
  }
}

/** Importe con exactamente dos decimales, sin pasar por `number` (`"150"` → `"150.00"`). */
export function price2(value: string): string {
  const [whole = '0', fraction = ''] = value.trim().split('.');
  return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

function versionMismatch(
  expected: number,
  actual: number | undefined,
): ConflictException {
  return new ConflictException(
    'Otra persona modificó este servicio mientras lo editaba',
    { expected, ...(actual === undefined ? {} : { actual }) },
    AdminCatalogsErrorReason.SERVICE_CATALOG_VERSION_MISMATCH,
  );
}

function toItemDto(
  row: ServiceCatalog,
  practiceTypeConceptId: string,
): AdminServiceItemDto {
  return {
    id: row.id,
    practiceId: row.practiceId,
    practiceTypeConceptId,
    code: row.code,
    name: row.name,
    descriptionText: row.descriptionText ?? null,
    termsText: row.termsText ?? null,
    serviceConceptId: row.serviceConceptId ?? null,
    defaultPrice: price2(row.defaultPrice),
    currencyConceptId: row.currencyConceptId ?? null,
    currencyCode: row.currencyConceptId
      ? (CURRENCY_CODE_BY_CONCEPT.get(row.currencyConceptId) ?? null)
      : null,
    isActive: row.isActive,
    rowVersion: row.rowVersion,
    updatedAt: row.updatedAt.toISOString(),
    updatedByUserId: row.updatedByUserId ?? null,
  };
}
