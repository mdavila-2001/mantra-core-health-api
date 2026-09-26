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
    const perfil = await this.perfilDeTipo(
      em,
      slug,
      COMM.PROFILE_TARGET_ORGANIZATION,
    );
    const limit = page.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT;
    const filas = await this.repo.findOfferedServices(
      em,
      perfil.tenantId,
      afterFromCursor(page.cursor),
      limit + 1,
    );
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map(toServiceDto),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({ k: ultima.code, i: ultima.id })
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
    const perfil = await this.perfilDeTipo(
      em,
      slug,
      COMM.PROFILE_TARGET_PHARMACY,
    );
    const limit = page.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT;
    const filas = await this.repo.findPharmacyProducts(
      em,
      perfil.tenantId,
      afterFromCursor(page.cursor),
      limit + 1,
    );
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map(toProductDto),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({ k: ultima.sortName, i: ultima.id })
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
   * @param tipo - Concepto de destino esperado (organización o farmacia).
   * @returns El perfil.
   * @throws ResourceNotFoundException con la misma forma en los tres casos:
   *   no existe, no es visible, o es de otro tipo.
   */
  private async perfilDeTipo(
    em: EntityManager,
    slug: string,
    tipo: string,
  ): Promise<PublicProfileRef> {
    const perfil = await this.repo.findVisibleProfileBySlug(em, slug);
    if (perfil === null || perfil.targetTypeConceptId !== tipo) {
      throw new ResourceNotFoundException('No encontrado', { slug });
    }
    return perfil;
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
  const clave = decodeKeysetCursor(cursor);
  const sortKey = clave.k;
  const id = clave.i;
  if (typeof sortKey !== 'string' || typeof id !== 'string' || !UUID.test(id)) {
    throw new BadRequestException('El cursor de paginación no es válido');
  }
  return { sortKey, id };
}

/** Proyección pública de un servicio: campo por campo, nada interno. */
function toServiceDto(fila: OfferedServiceRow): PublicOfferedServiceDto {
  const sinPrecio = ZERO_AMOUNT.test(fila.price);
  return {
    id: fila.id,
    code: fila.code,
    name: fila.name,
    description: fila.descriptionText,
    price: sinPrecio ? null : fila.price,
    currency: sinPrecio ? null : fila.currency,
    isActive: fila.isActive,
  };
}

/** Proyección pública de un producto: campo por campo, nada interno. */
function toProductDto(fila: PharmacyProductRow): PublicPharmacyProductDto {
  const presentacion = [fila.strengthText, fila.packageSizeText]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte))
    .join(' · ');
  return {
    id: fila.id,
    genericName: fila.sortName,
    brandName: fila.brandName,
    presentation: presentacion === '' ? null : presentacion,
    therapeuticGroup: null,
    price: fila.price,
    currency: fila.price === null ? null : fila.currency,
    inStock: Number(fila.availableQuantity) > 0,
    requiresPrescription: fila.requiresPrescription === true,
  };
}
