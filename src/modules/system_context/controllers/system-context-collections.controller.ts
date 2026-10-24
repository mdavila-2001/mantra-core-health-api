import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { SystemContextCollectionsService } from '../services';
import {
  DynamicEnumDefinitionPageDto,
  ListContextsQueryDto,
  ListDynamicEnumDefinitionsQueryDto,
  SystemContextPageDto,
} from '../dto';

/**
 * `GET` de colección de `system_context` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('system-context-collections')
@ApiBearerAuth()
@Controller()
export class SystemContextCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: SystemContextCollectionsService) {}

  /** V45-01: listar contextos de sistema del tenant. */
  @Get('system-context/contexts')
  @Roles('PLATFORM_ADMIN', 'GOVERNANCE')
  @ApiOperation({ summary: 'Listar contextos de sistema del tenant' })
  @ApiOkResponse({ type: SystemContextPageDto })
  listContexts(
    @Query() query: ListContextsQueryDto,
  ): Promise<SystemContextPageDto> {
    return this.collections.listContexts(query);
  }

  /** V45-05: listar definiciones de catálogo dinámico del tenant. */
  @Get('system-context/dynamic-enums/definitions')
  @Roles('TERMINOLOGY_ENGINEER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar definiciones de catálogo dinámico del tenant',
  })
  @ApiOkResponse({ type: DynamicEnumDefinitionPageDto })
  listDynamicEnumDefinitions(
    @Query() query: ListDynamicEnumDefinitionsQueryDto,
  ): Promise<DynamicEnumDefinitionPageDto> {
    return this.collections.listDynamicEnumDefinitions(query);
  }
}
