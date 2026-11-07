import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { FaqsService } from '../services';
import { PublicFaqListResponseDto } from '../dto';

/** Same per-IP limit as the rest of the public surface (60 per minute). */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * A practitioner's published FAQ, read without a session from their public
 * profile. It hangs from `/public/profiles/p/:slug/…` like the services and
 * products of the other public profiles (`PublicCatalogController`): the slug
 * is the only practitioner identifier the public surface exposes. A missing,
 * hidden or non-practitioner slug answers the same 404.
 */
@ApiTags('forms-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class FormsFaqsPublicController {
  constructor(private readonly service: FaqsService) {}

  @Public()
  @Get('public/profiles/p/:slug/faqs')
  @ApiOperation({
    summary: 'Preguntas frecuentes publicadas de un profesional',
    description:
      'Sin sesión. Sólo las publicadas, por posición. Un slug inexistente, oculto o que no es de profesional responde 404.',
  })
  list(@Param('slug') slug: string): Promise<PublicFaqListResponseDto> {
    return this.service.listPublic(slug);
  }
}
