import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ParseOptionalLimitPipe,
  Public,
  ResourceNotFoundException,
} from '../../../common';
import {
  CommunityPublicService,
  CommunityReviewsReadService,
  TARGET_CONCEPT_BY_SLUG_PREFIX,
} from '../services';
import type {
  PublicCommentPageDto,
  PublicProfileReviewsDto,
  PublicDirectoryProfileDto,
  PublicFeedPageDto,
  PublicNearbyPageDto,
  PublicPostReactionPageDto,
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

/** Tope por defecto de opiniones por página, igual que el resto de la API. */
const DEFAULT_REVIEW_PAGE_LIMIT = 50;

@ApiTags('community-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class CommunityPublicController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Buscador público.
   * @param reviews - Lecturas de reseñas, para las opiniones de la ficha (P31).
   */
  constructor(
    private readonly service: CommunityPublicService,
    private readonly reviews: CommunityReviewsReadService,
  ) {}

  /**
   * El feed de la portada: lo último de todas las vitrinas, mezclado.
   *
   * Va declarado **antes** que `public/search` por la misma razón que todo este
   * controlador va antes que `read_models`: Nest resuelve por orden, y una ruta
   * hermana con parámetro capturaría este segmento.
   */
  @Public()
  @Get('public/posts')
  @ApiOperation({
    summary: 'Últimas publicaciones de todos los profesionales',
  })
  feedPublico(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicFeedPageDto> {
    return this.service.feedPublico({ cursor, limit: this.toInt(limit) });
  }

  /**
   * Quién reaccionó a una publicación (AC-01-9).
   *
   * Va inmediatamente detrás de `public/posts` y comparte todo lo suyo: es
   * `@Public()`, cae bajo el mismo límite de 60 por minuto por IP que declara la
   * clase, se envuelve en `items`/`nextCursor`/`totalHint`/`generatedAt` y gana
   * su `ETag` y su `Cache-Control` de `PublicCacheInterceptor`, que actúa sobre
   * todo `GET` marcado `@Public()`.
   *
   * `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base
   * —igual que en `public/media/:id`—; el resto de los «no» son un 404
   * indistinguible del «no existe».
   */
  @Public()
  @Get('public/posts/:postId/reactions')
  @ApiOperation({ summary: 'Quiénes reaccionaron a una publicación pública' })
  postReactions(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicPostReactionPageDto> {
    return this.service.postReactions(postId, {
      cursor,
      limit: this.toInt(limit),
    });
  }

  /** El hilo de comentarios raíz de una publicación (AC-01-11, AC-01-12). */
  @Public()
  @Get('public/posts/:postId/comments')
  @ApiOperation({ summary: 'Comentarios raíz de una publicación pública' })
  postComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicCommentPageDto> {
    return this.service.postComments(postId, {
      cursor,
      limit: this.toInt(limit),
    });
  }

  /**
   * Las respuestas de un comentario (AC-01-12, «Ver N respuestas»).
   *
   * Ruta propia y no un parámetro de la anterior: son dos recursos paginados
   * distintos y el desplegable abre varios hilos a la vez. La justificación
   * larga está en `CommunityPublicService.commentReplies`.
   */
  @Public()
  @Get('public/comments/:commentId/replies')
  @ApiOperation({ summary: 'Respuestas de un comentario público' })
  commentReplies(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicCommentPageDto> {
    return this.service.commentReplies(commentId, {
      cursor,
      limit: this.toInt(limit),
    });
  }

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

  /**
   * Profesionales de la salud.
   *
   * `specialty` es el `concept_id` de una especialidad de `VS_MEDICAL_SPECIALTY`
   * —las 36 del patch v4.0.11—, **no** el nombre de la especialidad: el
   * directorio agrupa por catálogo, no por texto libre. El cliente ya lo
   * mandaba (`public-directory.client.ts`, `searchPractitioners`) y el
   * controlador no lo declaraba, así que hasta hoy se perdía entre los dos: la
   * pantalla dibujaba un filtro que no filtraba, que es peor que no dibujarlo.
   *
   * Un uuid que no pertenece al conjunto se rechaza con **422** —el mismo
   * `PreconditionFailedException` y el mismo `MedicalSpecialtyCatalogService`
   * que usa el alta de profesional—, nunca se ignora en silencio (AC-02-8).
   */
  @Public()
  @Get('public/search/practitioners')
  @ApiOperation({ summary: 'Profesionales en el directorio público' })
  @ApiQuery({
    name: 'specialty',
    required: false,
    description:
      'concept_id de VS_MEDICAL_SPECIALTY al que acotar; uno ajeno al ' +
      'conjunto da 422',
  })
  searchPractitioners(
    @Query('q') q?: string,
    @Query('verified') verified?: string,
    @Query('specialty') specialty?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'PRACTITIONER',
      verified: this.toBool(verified),
      specialtyConceptId: specialty,
      cursor,
      limit: this.toInt(limit),
    });
  }

  /**
   * Organizaciones de salud: hospitales, clínicas, centros.
   *
   * `city` acota por la ciudad de la dirección vigente, sin distinguir tildes
   * ni mayúsculas. Es el filtro que un directorio de **lugares** necesita antes
   * que ningún otro —a nadie le sirve una clínica excelente en otra ciudad—, y
   * está implementado en los dos caminos, el del índice y el de SQL: uno que
   * sólo funcionara con OpenSearch arriba dejaría de acotar sin avisar el día
   * que se cayera.
   */
  @Public()
  @Get('public/search/organizations')
  @ApiOperation({ summary: 'Organizaciones en el directorio público' })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Ciudad a la que acotar; sin tildes ni mayúsculas que valgan',
  })
  searchOrganizations(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicSearchPageDto> {
    return this.service.search({
      q,
      kind: 'ORGANIZATION',
      city,
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

  /**
   * Ficha pública por vertical, bajo el prefijo `/public`.
   *
   * ## Por qué existe además de las cinco rutas cortas
   *
   * Porque `/p/:slug` es a la vez **la URL de la página** y la de su dato. En
   * el navegador eso choca: el servidor de desarrollo enruta por prefijo de
   * texto, así que mandar `/p` a la API se come la ruta del router y abrir la
   * ficha devuelve JSON en vez de la pantalla; no mandarla deja al cliente
   * pidiendo `/p/:slug` al servidor de Angular, que responde el `index.html`
   * con **200** y el cliente recibe HTML donde espera JSON. Las dos salidas
   * rompen algo, y `check-client-prefixes.mjs` lo denuncia desde el 2026-08-17.
   *
   * Las cinco rutas cortas **se quedan**: son las que alguien pega en un
   * mensaje y las que un rastreador sigue, y su contrato no cambia. Esta es la
   * que llama el cliente, y no es ambigua porque cuelga de `/public`, que ya
   * está enrutado.
   *
   * El comportamiento es idéntico, incluido el 404 del tipo equivocado: es el
   * mismo servicio con el mismo concepto de sujeto, no una segunda
   * implementación que pueda separarse de la primera.
   *
   * @param prefijo - `p` · `o` · `f` · `l` · `s`, el mismo que la ruta corta.
   * @param slug - Slug estable del perfil.
   * @throws ResourceNotFoundException si el prefijo no es uno de los cinco.
   */
  @Public()
  @Get('public/profiles/:prefijo/:slug')
  @ApiOperation({ summary: 'Ficha pública por prefijo de vertical' })
  getProfileByPrefix(
    @Param('prefijo') prefijo: string,
    @Param('slug') slug: string,
  ): Promise<PublicDirectoryProfileDto> {
    const concepto = TARGET_CONCEPT_BY_SLUG_PREFIX[prefijo];
    // Un prefijo inventado da el **mismo** 404 que un slug que no existe: en
    // esta superficie nada distingue «no existe» de «no está publicado», y un
    // 400 acá abriría esa distinción por la puerta de al lado.
    if (concepto === undefined)
      throw new ResourceNotFoundException('No encontrado', { slug });

    return this.service.getBySlug(slug, concepto);
  }

  /**
   * P31 — las opiniones de una ficha pública, con su promedio.
   *
   * Cuelga del mismo `/public/profiles/:prefijo/:slug` que la ficha y no de
   * `/community/profiles/:profileId/reviews` por lo mismo que aquella ruta
   * existe: la abre un anónimo y lo único que lleva la URL es el slug. La
   * lectura con sesión sigue donde estaba y devuelve exactamente las mismas
   * reseñas — es el mismo servicio, no una segunda implementación.
   *
   * El promedio viaja acá y no sólo en la ficha porque la cabecera de las
   * opiniones y la lista se dibujan juntas: pedirlos por separado deja la
   * pantalla con «4,6 de 5» arriba y un hueco abajo.
   *
   * @param prefijo - `p` · `o` · `f` · `l` · `s`, el mismo que la ficha.
   * @param slug - Slug estable del perfil.
   * @param cursor - Cursor opaco de la página anterior.
   * @param limit - Tope de filas.
   * @throws ResourceNotFoundException si el prefijo no es uno de los cinco.
   */
  @Public()
  @Get('public/profiles/:prefijo/:slug/reviews')
  @ApiOperation({ summary: 'Opiniones publicadas de una ficha pública' })
  listPublicProfileReviews(
    @Param('prefijo') prefijo: string,
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PublicProfileReviewsDto> {
    const concepto = TARGET_CONCEPT_BY_SLUG_PREFIX[prefijo];
    // Mismo 404 que la ficha: un prefijo inventado no se distingue de un slug
    // que no existe.
    if (concepto === undefined)
      throw new ResourceNotFoundException('No encontrado', { slug });

    return this.reviews.listPublicReviewsBySlug(slug, concepto, {
      cursor,
      limit: limit ?? DEFAULT_REVIEW_PAGE_LIMIT,
    });
  }

  /**
   * Imagen de la superficie pública: el avatar o la portada de una vitrina, o
   * una foto de una de sus publicaciones.
   *
   * La ficha y el buscador devuelven la URL `/public/media/:id` en vez del id
   * de archivo pelado —un uuid interno regalado a un anónimo no se vuelve a
   * esconder—, así que esta ruta es la contraparte que sirve esos bytes. Lo
   * que autoriza es qué es el archivo, no quién lo pide: sin esto, cada foto
   * del directorio es un enlace roto.
   *
   * `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la
   * base; el resto de los «no» son un 404 indistinguible del «no existe».
   */
  @Public()
  @Get('public/media/:id')
  // El límite de la superficie pública son 60 peticiones por minuto, y se
  // dimensionó cuando la tarjeta del directorio no tenía foto: «una pantalla de
  // resultados con sus avatares no llega a diez». Con la grilla de centros de
  // salud una sola página son veinticinco portadas y veinticinco logos, así que
  // el navegador chocaba contra el tope **dentro de la primera pantalla** y las
  // fotos salían rotas —no en desarrollo, donde se abre una ficha por vez, sino
  // apenas se abre el directorio.
  //
  // Subirlo acá y no en todo `/public` es la diferencia que importa: esta ruta
  // devuelve bytes de una imagen ya cacheable una hora, no un resultado de
  // búsqueda. Raspar el directorio sigue costando 60 búsquedas por minuto; lo
  // que deja de costar es mirarlo.
  @Throttle({ default: { limit: 600, ttl: 60_000 } })
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({
    summary: 'Servir una imagen pública (avatar, portada o post)',
  })
  async getPublicMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const contenido = await this.service.getPublicMedia(id);
    res.setHeader('Content-Type', contenido.mimeType);
    res.send(contenido.buffer);
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
