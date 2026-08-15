import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import {
  CommunityPublicService,
  TARGET_CONCEPT_BY_SLUG_PREFIX,
} from '../services';
import type {
  PublicDirectoryProfileDto,
  PublicNearbyPageDto,
  PublicSearchPageDto,
} from '../dto';

/**
 * Superficie pública del buscador V65 (P2). Contrato en
 * `openapi/CONTRATO-PUBLICO.md`.
 *
 * ## Por qué este controlador tiene que registrarse antes que read_models
 *
 * `PublicProjectionsController` sirve `@Get(':slug')` bajo el mismo prefijo
 * `public`. Una ruta con parámetro captura **cualquier** segmento, así que
 * `/public/search` cae en ella si se evalúa primero, y el buscador entero
 * respondería la proyección de un slug llamado «search».
 *
 * Nest resuelve por orden de registro, y hoy funciona porque `CommunityModule`
 * va antes que `ReadModelsModule` en `app.module.ts`. Eso es una dependencia
 * invisible entre dos líneas de una lista de imports: nadie que reordene esa
 * lista —por orden alfabético, por ejemplo— sospecharía que rompe el buscador.
 *
 * Por eso el orden **no** se protege con este comentario sino con
 * `community-public.smoke.ts`, que pide `/public/search` y falla si lo que
 * vuelve es una proyección. El comentario explica; la prueba impide.
 */
/**
 * Límite por IP de toda la superficie pública (P3).
 *
 * 60 por minuto es holgado para una persona —una pantalla de resultados con sus
 * avatares no llega a diez— y estrecho para un raspador: recorrer un directorio
 * de diez mil fichas a este ritmo lleva casi tres horas en vez de los pocos
 * minutos que permite el backstop global de 300. Ese backstop sigue existiendo;
 * esto lo aprieta donde no hay token que atar a nadie.
 */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

@ApiTags('community-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class CommunityPublicController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Buscador público.
   */
  constructor(private readonly service: CommunityPublicService) {}

  /** Búsqueda unificada sobre todos los verticales. */
  @Public()
  @Get('public/search')
  @ApiOperation({ summary: 'Buscador público unificado' })
  search(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({ q, cursor, limit: this.toInt(limit) });
  }

  /** Profesionales de la salud. */
  @Public()
  @Get('public/search/practitioners')
  @ApiOperation({ summary: 'Profesionales en el directorio público' })
  searchPractitioners(
    @Query('q') q?: string,
    @Query('verified') verified?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'PRACTITIONER',
      verified: this.toBool(verified),
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Organizaciones de salud: hospitales, clínicas, centros. */
  @Public()
  @Get('public/search/organizations')
  @ApiOperation({ summary: 'Organizaciones en el directorio público' })
  searchOrganizations(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'ORGANIZATION',
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Unidades de diagnóstico: laboratorios y centros de imágenes. */
  @Public()
  @Get('public/search/diagnostic-units')
  @ApiOperation({ summary: 'Laboratorios y centros de diagnóstico' })
  searchDiagnosticUnits(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'DIAGNOSTIC_UNIT',
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Aseguradoras. */
  @Public()
  @Get('public/search/insurers')
  @ApiOperation({ summary: 'Aseguradoras en el directorio público' })
  searchInsurers(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'INSURER',
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Farmacias. */
  @Public()
  @Get('public/search/pharmacies')
  @ApiOperation({ summary: 'Farmacias en el directorio público' })
  searchPharmacies(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'PHARMACY',
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Medicamentos ofertados. */
  @Public()
  @Get('public/search/medications')
  @ApiOperation({ summary: 'Medicamentos ofertados públicamente' })
  searchMedications(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'MEDICATION',
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** Lo más cercano a un punto. */
  @Public()
  @Get('public/nearby')
  @ApiOperation({ summary: 'Prestadores cercanos, en línea recta' })
  nearby(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicNearbyPageDto> {
    return this.service.nearby({
      lat: this.toFloat(lat),
      lng: this.toFloat(lng),
      radiusKm: this.toFloat(radiusKm),
      limit: this.toInt(limit),
    });
  }

  /** Ficha pública de un profesional. */
  @Public()
  @Get('p/:slug')
  @ApiOperation({ summary: 'Ficha pública de un profesional' })
  getPractitioner(
    @Param('slug') slug: string,
  ): Promise<PublicDirectoryProfileDto> {
    return this.service.getBySlug(slug, TARGET_CONCEPT_BY_SLUG_PREFIX.p);
  }

  /** Ficha pública de una organización. */
  @Public()
  @Get('o/:slug')
  @ApiOperation({ summary: 'Ficha pública de una organización' })
  getOrganization(
    @Param('slug') slug: string,
  ): Promise<PublicDirectoryProfileDto> {
    return this.service.getBySlug(slug, TARGET_CONCEPT_BY_SLUG_PREFIX.o);
  }

  /** Ficha pública de una farmacia. */
  @Public()
  @Get('f/:slug')
  @ApiOperation({ summary: 'Ficha pública de una farmacia' })
  getPharmacy(@Param('slug') slug: string): Promise<PublicDirectoryProfileDto> {
    return this.service.getBySlug(slug, TARGET_CONCEPT_BY_SLUG_PREFIX.f);
  }

  /** Ficha pública de un laboratorio. */
  @Public()
  @Get('l/:slug')
  @ApiOperation({ summary: 'Ficha pública de un laboratorio' })
  getDiagnosticUnit(
    @Param('slug') slug: string,
  ): Promise<PublicDirectoryProfileDto> {
    return this.service.getBySlug(slug, TARGET_CONCEPT_BY_SLUG_PREFIX.l);
  }

  /** Ficha pública de una aseguradora. */
  @Public()
  @Get('s/:slug')
  @ApiOperation({ summary: 'Ficha pública de una aseguradora' })
  getInsurer(@Param('slug') slug: string): Promise<PublicDirectoryProfileDto> {
    return this.service.getBySlug(slug, TARGET_CONCEPT_BY_SLUG_PREFIX.s);
  }

  /**
   * Entero de un parámetro de consulta, o `undefined`.
   *
   * Un valor no numérico se ignora en vez de dar 400: el contrato promete que
   * `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como
   * 9999. La única excepción son las coordenadas de `nearby`, que sí fallan.
   */
  private toInt(valor?: string): number | undefined {
    if (valor === undefined) return undefined;
    const n = Number.parseInt(valor, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Decimal de un parámetro de consulta, o `undefined`. */
  private toFloat(valor?: string): number | undefined {
    if (valor === undefined) return undefined;
    const n = Number.parseFloat(valor);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Booleano de un parámetro; sólo `'true'` afirma. */
  private toBool(valor?: string): boolean | undefined {
    if (valor === undefined) return undefined;
    return valor === 'true';
  }
}
