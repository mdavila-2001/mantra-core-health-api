import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { COMM } from '../../community/community.concepts';
import {
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PublicCatalogPageQueryDto,
  PublicOfferedServiceDto,
  PublicOfferedServicePageDto,
  PublicPharmacyProductDto,
  PublicPharmacyProductPageDto,
} from '../dto/public-catalog.dto';
import {
  KeysetAfter,
  OfferedServiceRow,
  PharmacyProductRow,
  PublicCatalogRepository,
  PublicProfileRef,
} from '../repositories/public-catalog.repository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Un importe que es cero, con o sin decimales (`0`, `0.00`). */
const ZERO_AMOUNT = /^0+(\.0+)?$/;

/**
 * Lo que una clínica y una farmacia **ofrecen**, leído sin sesión desde su
 * ficha pública (M4 · H2; P30 y P31 de `PENDIENTES-BACKEND.md`).
 *
 * El front ya llamaba `GET /public/profiles/o/:slug/services` y
 * `GET /public/profiles/f/:slug/products` y contra la API real recibía 404.
 *
 * ## Qué se publica y qué no
 *
 * La proyección se arma **campo por campo** (nada de spread): ni el tenant, ni
 * la práctica, ni la cuenta de ingresos, ni el código impositivo salen de acá.
 * Un slug inexistente, oculto o **de otro tipo** responde el mismo 404, para
 * que la ruta no sirva para averiguar qué clase de ficha hay detrás de un slug.
 */
@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PublicCatalogRepository,
  ) {}

  /**
   * El catálogo de servicios de una organización.
   *
   * @param slug - Slug de su ficha pública.
   * @param page - Cursor y tope.
   * @returns Una página con la envoltura pública.
   * @throws ResourceNotFoundException si el slug no es de una organización visible.
   */
  async organizationServices(
    slug: string,
    page: PublicCatalogPageQueryDto,
  ): Promise<PublicOfferedServicePageDto> {
    const em = this.em.fork();
    const profile = await this.typeProfile(
      em,
      slug,
      COMM.PROFILE_TARGET_ORGANIZATION,
    );
    const limit = page.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT;
    const rows = await this.repo.findOfferedServices(
      em,
      profile.tenantId,
      afterFromCursor(page.cursor),
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];
    return {
      items: pageRows.map(toServiceDto),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ k: last.code, i: last.id })
          : null,
      totalHint: null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * El catálogo de productos de una farmacia.
   *
   * @param slug - Slug de su ficha pública.
   * @param page - Cursor y tope.
   * @returns Una página con la envoltura pública.
   * @throws ResourceNotFoundException si el slug no es de una farmacia visible.
   */
  async pharmacyProducts(
    slug: string,
    page: PublicCatalogPageQueryDto,
  ): Promise<PublicPharmacyProductPageDto> {
    const em = this.em.fork();
    const profile = await this.typeProfile(
      em,
      slug,
      COMM.PROFILE_TARGET_PHARMACY,
    );
    const limit = page.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT;
    const rows = await this.repo.findPharmacyProducts(
      em,
      profile.tenantId,
      afterFromCursor(page.cursor),
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];
    return {
      items: pageRows.map(toProductDto),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ k: last.sortName, i: last.id })
          : null,
      totalHint: null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * El perfil visible del slug, exigiendo que sea del tipo pedido.
   *
   * @param em - Contexto de persistencia.
   * @param slug - Slug de la ficha.
   * @param kind - Concepto de destino esperado (organización o farmacia).
   * @returns El perfil.
   * @throws ResourceNotFoundException con la misma forma en los tres casos:
   *   no existe, no es visible, o es de otro tipo.
   */
  private async typeProfile(
    em: EntityManager,
    slug: string,
    kind: string,
  ): Promise<PublicProfileRef> {
    const profile = await this.repo.findVisibleProfileBySlug(em, slug);
    if (profile === null || profile.targetTypeConceptId !== kind) {
      throw new ResourceNotFoundException('No encontrado', { slug });
    }
    return profile;
  }
}

/**
 * La posición de continuación de un cursor, validada.
 *
 * `decodeKeysetCursor` ya da 400 a un cursor que no es JSON de escalares; acá
 * se exige además la forma de ESTAS lecturas, para que un cursor ajeno no
 * llegue a la consulta como un `CAST(? AS uuid)` que reviente con 500.
 *
 * @param cursor - Cursor recibido, si lo hay.
 * @returns La posición, o `null` para la primera página.
 * @throws BadRequestException si el cursor no es de estas lecturas.
 */
function afterFromCursor(cursor: string | undefined): KeysetAfter | null {
  if (cursor === undefined || cursor === '') return null;
  const key = decodeKeysetCursor(cursor);
  const sortKey = key.k;
  const id = key.i;
  if (typeof sortKey !== 'string' || typeof id !== 'string' || !UUID.test(id)) {
    throw new BadRequestException('El cursor de paginación no es válido');
  }
  return { sortKey, id };
}

/** Proyección pública de un servicio: campo por campo, nada interno. */
function toServiceDto(row: OfferedServiceRow): PublicOfferedServiceDto {
  const withoutPrice = ZERO_AMOUNT.test(row.price);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.descriptionText,
    price: withoutPrice ? null : row.price,
    currency: withoutPrice ? null : row.currency,
    isActive: row.isActive,
  };
}

/** Proyección pública de un producto: campo por campo, nada interno. */
function toProductDto(row: PharmacyProductRow): PublicPharmacyProductDto {
  const presentation = [row.strengthText, row.packageSizeText]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  return {
    id: row.id,
    genericName: row.sortName,
    brandName: row.brandName,
    presentation: presentation === '' ? null : presentation,
    therapeuticGroup: null,
    price: row.price,
    currency: row.price === null ? null : row.currency,
    inStock: Number(row.availableQuantity) > 0,
    requiresPrescription: row.requiresPrescription === true,
  };
}
