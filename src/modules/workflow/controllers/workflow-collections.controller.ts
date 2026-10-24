import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { WorkflowCollectionsService } from '../services';
import { ListInstancesQueryDto, WorkflowInstancePageDto } from '../dto';

/**
 * `GET` de colección de `workflow` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('workflow-collections')
@ApiBearerAuth()
@Controller()
export class WorkflowCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: WorkflowCollectionsService) {}

  /** V32-05: listar instancias de flujo de trabajo del tenant. */
  @Get('workflow/instances')
  @Roles('CLINICIAN', 'BILLING_AGENT', 'SCHEDULER', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar instancias de flujo de trabajo del tenant' })
  @ApiOkResponse({ type: WorkflowInstancePageDto })
  listInstances(
    @Query() query: ListInstancesQueryDto,
  ): Promise<WorkflowInstancePageDto> {
    return this.collections.listInstances(query);
  }
}
