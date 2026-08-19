import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { CommunitySearchIndexService } from '../services';
import {
  ReindexRequestDto,
  ReindexResponseDto,
  SearchIndexHealthDto,
} from '../dto';

/**
 * Superficie interna del índice del directorio público (P10).
 *
 * No es pública ni de usuario: la llaman el worker (`search-indexer`) y el
 * script de reindexado, ambos autenticados como `SYSTEM`. Vive en `community`
 * y no en `search_platform` porque quien sabe qué campos de un perfil son
 * publicables es este módulo, no la infraestructura de búsqueda.
 */
@ApiTags('community')
@ApiBearerAuth()
@Controller('internal/community/search')
export class CommunitySearchIndexController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Proyección del directorio hacia el índice.
   */
  constructor(private readonly service: CommunitySearchIndexService) {}

  /**
   * Reindexa el directorio público completo.
   *
   * Idempotente: correrlo dos veces deja el índice igual, porque el id del
   * documento es el id del perfil. Devuelve «indexados N de N» y lo que el
   * índice confirma tener, que es lo único que prueba que el barrido sirvió.
   *
   * @param dto - `recreate: false` para reutilizar el índice existente.
   * @returns Conteos del barrido.
   */
  @Post('reindex')
  @Roles('SYSTEM', 'SECURITY_ADMIN', 'SEARCH_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reindexar el directorio público',
    description:
      'Recrea el índice y proyecta todos los perfiles públicos. Idempotente.',
  })
  async reindex(@Body() dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    const outcome = await this.service.reindexAll({ recreate: dto.recreate });
    return {
      ...outcome,
      summary: `indexados ${outcome.indexed} de ${outcome.total}`,
    };
  }

  /**
   * Estado del índice frente a la base: cuántos perfiles hay y cuántos indexados.
   *
   * Es lo que mira el worker antes de decidir si hace falta un barrido, y lo
   * que responde «¿el buscador está sirviendo el índice o el SQL?» sin tener
   * que provocar una búsqueda.
   *
   * @returns Conteos y disponibilidad del índice.
   */
  @Get('health')
  @Roles('SYSTEM', 'SECURITY_ADMIN', 'SEARCH_ADMIN')
  @ApiOperation({ summary: 'Estado del índice del directorio público' })
  health(): Promise<SearchIndexHealthDto> {
    return this.service.health();
  }
}
