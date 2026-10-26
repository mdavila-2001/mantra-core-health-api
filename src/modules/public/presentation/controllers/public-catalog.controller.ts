import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../../common';
import {
  PublicCatalogPageQueryDto,
  PublicOfferedServicePageDto,
  PublicPharmacyProductPageDto,
} from '../dto/public-catalog.dto';
import {
  PublicBranchAvailabilityResponseDto,
  PublicPharmacyBranchPageDto,
  PublicPrescriptionAvailabilityDto,
} from '../dto/public-pharmacy-branches.dto';
import { PublicCatalogService } from '../../application/services/public-catalog.service';
import { PublicPharmacyBranchesService } from '../../application/services/public-pharmacy-branches.service';

/** El mismo tope que el resto de la superficie pública (60 por minuto). */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * Lo que ofrece una ficha pública de organización o de farmacia (M4 · H2).
 *
 * Cuelgan de `/public/profiles/…` como el detalle de la ficha
 * (`CommunityPublicController`), con tres segmentos después de `profiles`: no
 * chocan con `public/profiles/:prefijo/:slug` (dos) ni con
 * `public/profiles/:prefijo/:slug/reviews`, cuyo último segmento es otro
 * literal.
 */
@ApiTags('public-catalog')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class PublicCatalogController {
  constructor(
    private readonly service: PublicCatalogService,
    private readonly branchesService: PublicPharmacyBranchesService,
  ) {}

  @Public()
  @Get('public/profiles/o/:slug/services')
  @ApiOperation({
    summary: 'Servicios que ofrece una organización, desde su ficha pública',
    description:
      'Sin sesión. Precio de referencia como texto, o null si no está definido. Un slug inexistente, oculto o de otro tipo responde 404.',
  })
  organizationServices(
    @Param('slug') slug: string,
    @Query() page: PublicCatalogPageQueryDto,
  ): Promise<PublicOfferedServicePageDto> {
    return this.service.organizationServices(slug, page);
  }

  @Public()
  @Get('public/profiles/f/:slug/products')
  @ApiOperation({
    summary: 'Productos que ofrece una farmacia, desde su ficha pública',
    description:
      'Sin sesión. Marca, presentación, precio vigente de lista pública como texto (o null) y si hay stock; un agotado se lista igual. Un slug inexistente, oculto o de otro tipo responde 404.',
  })
  pharmacyProducts(
    @Param('slug') slug: string,
    @Query() page: PublicCatalogPageQueryDto,
  ): Promise<PublicPharmacyProductPageDto> {
    return this.service.pharmacyProducts(slug, page);
  }

  /**
   * P37 — las sucursales de la farmacia del slug.
   *
   * Una farmacia con una sola sede devuelve una, con `isCurrent: true`; una
   * sin sedes publicadas devuelve la lista vacía (no 404: la ficha existe).
   */
  @Public()
  @Get('public/profiles/f/:slug/branches')
  @ApiOperation({
    summary: 'Sucursales de una farmacia, desde su ficha pública',
    description:
      'Sin sesión. Sedes activas de las farmacias activas y verificadas del tenant dueño de la ficha, por ciudad y nombre, con su punto si lo tiene. Un slug inexistente, oculto o de otro tipo responde 404.',
  })
  pharmacyBranches(
    @Param('slug') slug: string,
  ): Promise<PublicPharmacyBranchPageDto> {
    return this.branchesService.branches(slug);
  }

  /**
   * P37 — qué sucursal tiene lo de una receta escrita a mano.
   *
   * `POST` aunque sea una lectura: los renglones de una receta son datos de
   * salud y en la URL quedarían en historiales, proxies y logs de acceso. Nada
   * se guarda. Responde 200, no 201: no crea ningún recurso.
   */
  @Public()
  @Post('public/profiles/f/:slug/branch-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disponibilidad de una receta en las sucursales de una farmacia',
    description:
      'Sin sesión. Cuerpo { items: string[] (1-20, texto libre), lat?, lng? }. Sólo cuenta lo que está en stock; un agotado es faltante. Orden del servidor: primero las completas, después la más cercana en línea recta. No guarda nada. Un slug inexistente, oculto o de otro tipo responde 404.',
  })
  pharmacyBranchAvailability(
    @Param('slug') slug: string,
    @Body() body: PublicPrescriptionAvailabilityDto,
  ): Promise<PublicBranchAvailabilityResponseDto> {
    return this.branchesService.availability(slug, body);
  }
}
