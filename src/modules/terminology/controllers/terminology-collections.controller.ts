import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { TerminologyCollectionsService } from '../services';
import {
  ListCatalogPoliciesQueryDto,
  TenantCatalogPolicyPageDto,
} from '../dto';

/**
 * `GET` de colección de `terminology` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('terminology-collections')
@ApiBearerAuth()
@Controller()
export class TerminologyCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: TerminologyCollectionsService) {}

  /** V03-12: listar las políticas de catálogo del tenant. */
  @Get('terminology/tenants/:tenantId/catalog-policies')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las políticas de catálogo del tenant' })
  @ApiOkResponse({ type: TenantCatalogPolicyPageDto })
  listCatalogPolicies(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: ListCatalogPoliciesQueryDto,
  ): Promise<TenantCatalogPolicyPageDto> {
    return this.collections.listCatalogPolicies(tenantId, query);
  }
}
