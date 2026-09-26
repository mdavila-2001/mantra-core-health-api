import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import {
  PublicCatalogPageQueryDto,
  PublicOfferedServicePageDto,
  PublicPharmacyProductPageDto,
} from '../dto/public-catalog.dto';
import { PublicCatalogService } from '../services/public-catalog.service';

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
  constructor(private readonly service: PublicCatalogService) {}

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
}
