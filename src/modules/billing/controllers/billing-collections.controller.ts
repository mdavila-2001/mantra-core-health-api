import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { BillingCollectionsService } from '../services';
import { BillingDocumentLinkPageDto, ListDocumentsQueryDto } from '../dto';

/**
 * `GET` de colección de `billing` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('billing-collections')
@ApiBearerAuth()
@Controller()
export class BillingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: BillingCollectionsService) {}

  /** V17-02: listar vínculos documentales de facturación del tenant. */
  @Get('billing/documents')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar vínculos documentales de facturación del tenant',
  })
  @ApiOkResponse({ type: BillingDocumentLinkPageDto })
  listDocuments(
    @Query() query: ListDocumentsQueryDto,
  ): Promise<BillingDocumentLinkPageDto> {
    return this.collections.listDocuments(query);
  }
}
