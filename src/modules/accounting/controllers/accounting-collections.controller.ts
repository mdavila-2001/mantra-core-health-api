import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AccountingCollectionsService } from '../services';
import { ClearingDocumentPageDto, ListClearingDocumentsQueryDto } from '../dto';

/**
 * `GET` de colección de `accounting` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('accounting-collections')
@ApiBearerAuth()
@Controller()
export class AccountingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: AccountingCollectionsService) {}

  /** V16-08: listar documentos de compensación del tenant. */
  @Get('accounting/clearing-documents')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar documentos de compensación del tenant' })
  @ApiOkResponse({ type: ClearingDocumentPageDto })
  listClearingDocuments(
    @Query() query: ListClearingDocumentsQueryDto,
  ): Promise<ClearingDocumentPageDto> {
    return this.collections.listClearingDocuments(query);
  }
}
