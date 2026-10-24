import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { CommunityCollectionsService } from '../services';
import { ListPublicProfilesQueryDto, PublicProfilePageDto } from '../dto';

/**
 * `GET` de colección de `community` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('community-collections')
@ApiBearerAuth()
@Controller()
export class CommunityCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: CommunityCollectionsService) {}

  /** V19-15: listar perfiles públicos del tenant. */
  @Get('community/public-profiles')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar perfiles públicos del tenant' })
  @ApiOkResponse({ type: PublicProfilePageDto })
  listPublicProfiles(
    @Query() query: ListPublicProfilesQueryDto,
  ): Promise<PublicProfilePageDto> {
    return this.collections.listPublicProfiles(query);
  }
}
