import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { AgentCatalogService } from '../services';
import {
  RegisterAgentDto,
  AgentResponseDto,
  PublishAgentVersionDto,
  AgentVersionResponseDto,
  RegisterToolDto,
  ToolResponseDto,
  BindToolsDto,
  BindToolsResponseDto,
  DefineGuardrailDto,
  GuardrailResponseDto,
  AttachGuardrailDto,
  AttachGuardrailResponseDto,
  UpsertAgentMemoryDto,
  AgentMemoryResponseDto,
} from '../dto';

/** Catálogo de agentes, herramientas, guardrails y memoria (UC-48-01 … 05, 12). */
@ApiTags('automation')
@ApiBearerAuth()
@Controller('automation')
export class AgentCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogService - Valor de catalog service requerido por la operación.
   */
  constructor(private readonly catalogService: AgentCatalogService) {}

  /** UC-48-01. */
  @Audited({
    action: 'AGENT_REGISTERED',
    entity: 'agent',
    entityId: 'result.id',
  })
  @Post('agents')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un agente con su primera versión',
    description:
      'Agente y versión 1 nacen en borrador, en la misma transacción.',
  })
  registerAgent(
    @Body() dto: RegisterAgentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    return this.catalogService.registerAgent(dto, actor);
  }

  /** UC-48-02. */
  @Audited({
    action: 'AGENT_VERSION_PUBLISHED',
    entity: 'agent_version',
    entityId: 'result.id',
  })
  @Post('agents/:id/versions/publish')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión del agente',
    description:
      'Publica una versión en borrador o crea la siguiente y la publica. `current_version` es derivado.',
  })
  publishAgentVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishAgentVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentVersionResponseDto> {
    return this.catalogService.publishAgentVersion(id, dto, actor);
  }

  /** UC-48-03. */
  @Audited({
    action: 'AGENT_TOOL_REGISTERED',
    entity: 'agent_tool',
    entityId: 'result.id',
  })
  @Post('tools')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una herramienta de agente',
    description:
      '`isWrite` y `requiresApproval` son lo que decide si su uso pausa la ejecución.',
  })
  registerTool(
    @Body() dto: RegisterToolDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ToolResponseDto> {
    return this.catalogService.registerTool(dto, actor);
  }

  /** UC-48-04. */
  @Audited({
    action: 'AGENT_TOOLS_BOUND',
    entity: 'agent_version',
    entityId: 'param:versionId',
  })
  @Post('agents/:id/versions/:versionId/tool-bindings')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enlazar herramientas a una versión del agente',
    description:
      'Lote atómico; sólo herramientas activas y sin enlaces repetidos.',
  })
  bindTools(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: BindToolsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BindToolsResponseDto> {
    return this.catalogService.bindTools(id, versionId, dto, actor);
  }

  /** UC-48-05 (política). */
  @Audited({
    action: 'GUARDRAIL_POLICY_DEFINED',
    entity: 'guardrail_policy',
    entityId: 'result.id',
  })
  @Post('guardrails')
  @Roles('AI_GOVERNANCE_OFFICER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una política de guardrail',
    description:
      'Una política de coste sin tope, o de PHI sin tratamiento declarado, se rechaza.',
  })
  defineGuardrail(
    @Body() dto: DefineGuardrailDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GuardrailResponseDto> {
    return this.catalogService.defineGuardrail(dto, actor);
  }

  /** UC-48-05 (adjunción). */
  @Audited({
    action: 'AGENT_GUARDRAIL_ATTACHED',
    entity: 'agent_guardrail',
    entityId: 'result.id',
  })
  @Post('agents/:id/guardrails')
  @Roles('AI_GOVERNANCE_OFFICER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar una política de guardrail a un agente' })
  attachGuardrail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachGuardrailDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttachGuardrailResponseDto> {
    return this.catalogService.attachGuardrail(id, dto, actor);
  }

  /** UC-48-12. */
  @Audited({
    action: 'AGENT_MEMORY_UPSERTED',
    entity: 'agent_memory',
    entityId: 'result.id',
  })
  @Post('agents/:id/memory')
  @Roles('SYSTEM', 'AGENT_RUNTIME', 'AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Persistir memoria del agente',
    description:
      'Upsert por (agente, ámbito, referencia, tipo); fuera del global la referencia es obligatoria.',
  })
  upsertMemory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertAgentMemoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentMemoryResponseDto> {
    return this.catalogService.upsertMemory(id, dto, actor);
  }
}
