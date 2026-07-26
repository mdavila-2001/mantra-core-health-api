import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common';
import { PublicProjectionsService } from '../services';
import { PublicProjectionResponseDto } from '../dto';

/**
 * UC-30-10: proyecciones públicas sin sesión. `@Public()` salta el guard global.
 * Solo se sirven campos aprobados de MV con `contains_phi=false`.
 */
@ApiTags('read-models-public')
@Controller('public')
export class PublicProjectionsController {
  constructor(private readonly service: PublicProjectionsService) {}

  /** UC-30-10: catálogo público de directorio (city/specialty). */
  @Public()
  @Get('directory')
  @ApiOperation({ summary: 'Servir el directorio público (solo campos aprobados)' })
  searchDirectory(
    @Query('city') city: string | undefined,
    @Query('specialty') specialty: string | undefined,
  ): Promise<PublicProjectionResponseDto> {
    return this.service.searchDirectory({ city, specialty });
  }

  /** UC-30-10: detalle público por slug. */
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Servir una proyección pública por slug' })
  getBySlug(@Param('slug') slug: string): Promise<PublicProjectionResponseDto> {
    return this.service.getBySlug(slug);
  }
}
