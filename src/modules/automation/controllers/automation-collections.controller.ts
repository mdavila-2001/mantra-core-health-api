import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AutomationCollectionsService } from '../services';
import {
  AgentPageDto,
  AutomationTriggerPageDto,
  ListAgentsQueryDto,
  ListTriggersQueryDto,
  ListWorkflowsQueryDto,
  WorkflowPageDto,
} from '../dto';

/**
 * `GET` de colección de `automation` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('automation-collections')
@ApiBearerAuth()
@Controller()
export class AutomationCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: AutomationCollectionsService) {}

  /** V48-04: listar agentes de automatización del tenant. */
  @Get('automation/agents')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar agentes de automatización del tenant' })
  @ApiOkResponse({ type: AgentPageDto })
  listAgents(@Query() query: ListAgentsQueryDto): Promise<AgentPageDto> {
    return this.collections.listAgents(query);
  }

  /** V48-13: listar disparadores de automatización del tenant. */
  @Get('automation/triggers')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar disparadores de automatización del tenant' })
  @ApiOkResponse({ type: AutomationTriggerPageDto })
  listTriggers(
    @Query() query: ListTriggersQueryDto,
  ): Promise<AutomationTriggerPageDto> {
    return this.collections.listTriggers(query);
  }

  /** V48-15: listar flujos de automatización del tenant. */
  @Get('automation/workflows')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar flujos de automatización del tenant' })
  @ApiOkResponse({ type: WorkflowPageDto })
  listWorkflows(
    @Query() query: ListWorkflowsQueryDto,
  ): Promise<WorkflowPageDto> {
    return this.collections.listWorkflows(query);
  }
}
