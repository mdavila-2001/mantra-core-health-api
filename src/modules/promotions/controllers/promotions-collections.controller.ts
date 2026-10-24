import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PromotionsCollectionsService } from '../services';
import { ListPromotionsQueryDto, PromotionPageDto } from '../dto';

/**
 * `GET` de colección de `promotions` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('promotions-collections')
@ApiBearerAuth()
@Controller()
export class PromotionsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: PromotionsCollectionsService) {}

  /** V51-08: listar promociones del tenant. */
  @Get('promotions')
  @Roles('PROMOTIONS_ADMIN', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Listar promociones del tenant' })
  @ApiOkResponse({ type: PromotionPageDto })
  listPromotions(
    @Query() query: ListPromotionsQueryDto,
  ): Promise<PromotionPageDto> {
    return this.collections.listPromotions(query);
  }
}
