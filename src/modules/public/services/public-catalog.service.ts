import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { COMM } from '../../community/community.concepts';
import {
  PUBLIC_BRANCH_AVAILABILITY_MAX_TERMS,
  PUBLIC_BRANCH_AVAILABILITY_MAX_TERM_LENGTH,
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PublicBranchAvailabilityDto,
  PublicBranchAvailabilityQueryDto,
  PublicBranchAvailabilityResponseDto,
  PublicBranchMatchDto,
  PublicCatalogPageQueryDto,
  PublicPharmacyBranchDto,
  PublicPharmacyBranchPageDto,
  PublicOfferedServiceDto,
  PublicOfferedServicePageDto,
  PublicPharmacyProductDto,
  PublicPharmacyProductPageDto,
} from '../dto/public-catalog.dto';
import {
  BranchStockRow,
  KeysetAfter,
  OfferedServiceRow,
  PharmacyBranchRow,
  PharmacyProductRow,
  PublicCatalogRepository,
  PublicProfileRef,
} from '../repositories/public-catalog.repository';
import { haversineKm } from '../../pharmacy_inventory/services/pharmacy-inventory-read.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Un importe que es cero, con o sin decimales (`0`, `0.00`). */
const ZERO_AMOUNT = /^0+(\.0+)?$/;
/** Cota de sucursales de una cadena: una cota, no una paginación (P37). */
const BRANCHES_MAX = 200;
/** Letras mínimas de un renglón: con menos, casaría con el catálogo entero. */
const MIN_TERM_LENGTH = 3;

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
   * Las sucursales de la cadena de una farmacia, con ella adentro (P37).
   *
   * Van todas en una página: una cadena boliviana tiene decenas de sedes, no
   * miles, y la pantalla las ordena por distancia del lado del cliente. El
   * tope ({@link BRANCHES_MAX}) es una cota, no una paginación.
   *
   * @param slug - Slug de la ficha de farmacia que se mira.
   * @returns Las sucursales: primero las de esta ficha, luego por ciudad y sede.
   * @throws ResourceNotFoundException si el slug no es de una farmacia visible.
   */
  async pharmacyBranches(slug: string): Promise<PublicPharmacyBranchPageDto> {
    const em = this.em.fork();
    const perfil = await this.perfilDeTipo(
      em,
      slug,
      COMM.PROFILE_TARGET_PHARMACY,
    );
    const items = await this.sucursales(em, perfil);
    return {
      items,
      nextCursor: null,
      totalHint: items.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Qué sucursal de la cadena tiene lo de una receta, y a cuánto (P37).
   *
   * Un renglón casa con un producto **con stock en esa sede** cuando todas sus
   * palabras aparecen —sin tildes ni mayúsculas— en el genérico, la marca o la
   * presentación. Entre varios candidatos gana el más barato con precio.
   * Una sucursal sin nada se lista igual, rotulada: esconderla dejaría a la
   * persona sin saber que existe.
   *
   * Orden: primero las completas; entre ellas, la más cercana; después, las
   * que tienen más renglones. Es el de `/pharmacy-inventory/availability`.
   *
   * @param slug - Slug de la ficha de farmacia.
   * @param query - Renglones y origen opcional.
   * @returns Una fila por sucursal, ya ordenada.
   * @throws ResourceNotFoundException si el slug no es de una farmacia visible.
   * @throws BadRequestException si hay demasiados renglones, alguno es
   *   demasiado largo o demasiado corto, o el origen llega a medias.
   */
  async branchAvailability(
    slug: string,
    query: PublicBranchAvailabilityQueryDto,
  ): Promise<PublicBranchAvailabilityResponseDto> {
    const renglones = renglonesDe(query.items);
    const origen = origenDe(query);

    const em = this.em.fork();
    const perfil = await this.perfilDeTipo(
      em,
      slug,
      COMM.PROFILE_TARGET_PHARMACY,
    );
    const sucursales = await this.sucursales(em, perfil);

    const palabrasPorRenglon = renglones.map((r) => palabrasDe(r));
    // La palabra más larga de cada renglón es la que más filtra en la base.
    const filtro = [
      ...new Set(
        palabrasPorRenglon.map((palabras) =>
          escaparLike(
            palabras.reduce((a, b) => (b.length > a.length ? b : a), ''),
          ),
        ),
      ),
    ];
    const filas = await this.repo.findBranchStockMatches(
      em,
      sucursales.map((s) => s.id),
      filtro,
    );
    const porSede = new Map<string, BranchStockRow[]>();
    for (const fila of filas) {
      const lista = porSede.get(fila.siteId) ?? [];
      lista.push(fila);
      porSede.set(fila.siteId, lista);
    }

    const items = sucursales
      .map((sucursal) =>
        disponibilidadDe(
          sucursal,
          renglones,
          palabrasPorRenglon,
          porSede.get(sucursal.id) ?? [],
          origen,
        ),
      )
      .sort(ordenDeDisponibilidad);
    return {
      items,
      count: items.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Las sucursales del perfil ya proyectadas y ordenadas. */
  private async sucursales(
    em: EntityManager,
    perfil: PublicProfileRef,
  ): Promise<PublicPharmacyBranchDto[]> {
    const filas = await this.repo.findPharmacyBranches(
      em,
      perfil.tenantId,
      BRANCHES_MAX,
    );
    return filas
      .map((fila) => toBranchDto(fila, perfil.tenantId))
      .sort(
        (a, b) =>
          Number(b.isCurrent) - Number(a.isCurrent) ||
          (a.city ?? '').localeCompare(b.city ?? '', 'es') ||
          a.siteName.localeCompare(b.siteName, 'es') ||
          a.id.localeCompare(b.id),
      );
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

/** Proyección pública de una sede: campo por campo, nada interno. */
function toBranchDto(
  fila: PharmacyBranchRow,
  tenantMirado: string,
): PublicPharmacyBranchDto {
  const direccion = [fila.lines, fila.city]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte))
    .join(', ');
  const lat = coordenada(fila.latitude);
  const lng = coordenada(fila.longitude);
  const sede = fila.siteName.trim();
  const farmacia = fila.pharmacyName.trim();
  return {
    id: fila.siteId,
    slug: fila.slug,
    name:
      sede === '' || sede.toLowerCase() === farmacia.toLowerCase()
        ? farmacia
        : `${farmacia} · ${sede}`,
    siteName: sede === '' ? farmacia : sede,
    city: fila.city?.trim() || null,
    addressText: direccion === '' ? null : direccion,
    phone: null,
    openingHours: null,
    location: lat === null || lng === null ? null : { lat, lng },
    locationAccuracy: null,
    isCurrent: fila.tenantId === tenantMirado,
  };
}

/** Una coordenada `numeric` (texto de la base) como número, o `null`. */
function coordenada(valor: string | null): number | null {
  if (valor === null || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Minúsculas, sin tildes y con los espacios colapsados. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Las palabras de un renglón, ya normalizadas. */
function palabrasDe(renglon: string): string[] {
  return normalizar(renglon)
    .split(' ')
    .filter((palabra) => palabra !== '');
}

/** Escapa `%`, `_` y `\` para usar el texto dentro de un `LIKE`. */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Los renglones de la receta, validados.
 *
 * @param items - Texto con renglones separados por `|`.
 * @returns Los renglones sin vacíos ni repetidos (sin distinguir tildes).
 * @throws BadRequestException si son demasiados, o alguno es demasiado largo
 *   o demasiado corto para buscar sin traer el catálogo entero.
 */
function renglonesDe(items: string | undefined): string[] {
  const vistos = new Set<string>();
  const renglones: string[] = [];
  for (const crudo of (items ?? '').split('|')) {
    const renglon = crudo.replace(/\s+/g, ' ').trim();
    if (renglon === '') continue;
    if (renglon.length > PUBLIC_BRANCH_AVAILABILITY_MAX_TERM_LENGTH) {
      throw new BadRequestException(
        `Cada renglón de la receta puede tener hasta ${PUBLIC_BRANCH_AVAILABILITY_MAX_TERM_LENGTH} caracteres`,
      );
    }
    if (normalizar(renglon).replace(/ /g, '').length < MIN_TERM_LENGTH) {
      throw new BadRequestException(
        `Cada renglón de la receta necesita al menos ${MIN_TERM_LENGTH} letras`,
      );
    }
    const clave = normalizar(renglon);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    renglones.push(renglon);
  }
  if (renglones.length > PUBLIC_BRANCH_AVAILABILITY_MAX_TERMS) {
    throw new BadRequestException(
      `La receta puede tener hasta ${PUBLIC_BRANCH_AVAILABILITY_MAX_TERMS} renglones`,
    );
  }
  return renglones;
}

/** El origen, sólo si llega completo. */
function origenDe(
  query: PublicBranchAvailabilityQueryDto,
): { lat: number; lng: number } | null {
  const tieneLat = query.lat !== undefined;
  const tieneLng = query.lng !== undefined;
  if (tieneLat !== tieneLng) {
    throw new BadRequestException('La ubicación de origen va con lat y lng');
  }
  return tieneLat && tieneLng ? { lat: query.lat!, lng: query.lng! } : null;
}

/** Importe texto → centavos enteros, para sumar sin error de coma flotante. */
function centavos(importe: string): number | null {
  const n = Number(importe);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** Lo que una sucursal tiene de la receta. */
function disponibilidadDe(
  sucursal: PublicPharmacyBranchDto,
  renglones: readonly string[],
  palabrasPorRenglon: readonly string[][],
  stock: readonly BranchStockRow[],
  origen: { lat: number; lng: number } | null,
): PublicBranchAvailabilityDto {
  const candidatos = stock.map((fila) => ({
    fila,
    texto: normalizar(
      [
        fila.genericName,
        fila.brandName ?? '',
        fila.strengthText ?? '',
        fila.packageSizeText ?? '',
      ].join(' '),
    ),
    precio: fila.price === null ? null : centavos(fila.price),
  }));

  const matches: PublicBranchMatchDto[] = [];
  const missing: string[] = [];
  renglones.forEach((renglon, i) => {
    const palabras = palabrasPorRenglon[i] ?? [];
    const elegido = candidatos
      .filter((c) => palabras.every((palabra) => c.texto.includes(palabra)))
      // El más barato con precio; sin precio, al final.
      .sort(
        (a, b) =>
          (a.precio ?? Number.MAX_SAFE_INTEGER) -
            (b.precio ?? Number.MAX_SAFE_INTEGER) ||
          a.fila.productId.localeCompare(b.fila.productId),
      )[0];
    if (elegido === undefined) {
      missing.push(renglon);
      return;
    }
    const presentacion = [
      elegido.fila.strengthText,
      elegido.fila.packageSizeText,
    ]
      .map((parte) => parte?.trim())
      .filter((parte): parte is string => Boolean(parte))
      .join(' · ');
    matches.push({
      term: renglon,
      genericName: elegido.fila.genericName,
      brandName: elegido.fila.brandName,
      presentation: presentacion === '' ? null : presentacion,
      price: elegido.fila.price,
      currency: elegido.fila.price === null ? null : elegido.fila.currency,
    });
  });

  const conPrecio = matches.filter((m) => m.price !== null);
  const total = conPrecio.reduce(
    (suma, m) => suma + (centavos(m.price!) ?? 0),
    0,
  );
  return {
    branch: sucursal,
    matches,
    missing,
    complete: renglones.length > 0 && missing.length === 0,
    totalAmount: conPrecio.length === 0 ? null : (total / 100).toFixed(2),
    currency: conPrecio[0]?.currency ?? null,
    distanceKm:
      origen === null || sucursal.location === null
        ? null
        : haversineKm(origen, sucursal.location),
  };
}

/** Completas primero; después la más cercana; después las que tienen más. */
function ordenDeDisponibilidad(
  a: PublicBranchAvailabilityDto,
  b: PublicBranchAvailabilityDto,
): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
  const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  if (a.matches.length !== b.matches.length) {
    return b.matches.length - a.matches.length;
  }
  return a.branch.siteName.localeCompare(b.branch.siteName, 'es');
}
