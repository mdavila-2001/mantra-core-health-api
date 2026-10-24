import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { IdentityCollectionsService } from '../services';
import { IdentityAuthorityPageDto, ListAuthoritiesQueryDto } from '../dto';

/**
 * `GET` de colección de `identity_assurance` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('identity-collections')
@ApiBearerAuth()
@Controller()
export class IdentityCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: IdentityCollectionsService) {}

  /** V27-09: listar las autoridades de verificación del tenant. */
  @Get('identity/authorities')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las autoridades de verificación del tenant',
  })
  @ApiOkResponse({ type: IdentityAuthorityPageDto })
  listAuthorities(
    @Query() query: ListAuthoritiesQueryDto,
  ): Promise<IdentityAuthorityPageDto> {
    return this.collections.listAuthorities(query);
  }
}
