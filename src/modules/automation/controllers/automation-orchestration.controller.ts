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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  AutomationDefinitionService,
  AutomationExecutionService,
  RecordAutomationService,
} from '../services';
import {
  DefineWorkflowDto,
  WorkflowResponseDto,
  ConfigureTriggerDto,
  TriggerResponseDto,
  StartWorkflowRunDto,
  WorkflowRunResponseDto,
  StartAgentRunDto,
  AgentRunResponseDto,
  RecordAgentStepDto,
  AgentStepResponseDto,
  RequestApprovalDto,
  ApprovalResponseDto,
  DecideApprovalDto,
  DecideApprovalResponseDto,
  ExecuteRecordAutomationDto,
  ExecuteRecordAutomationResponseDto,
  FinalizeWorkflowRunDto,
  FinalizeWorkflowRunResponseDto,
  EvaluateCalendarTriggersDto,
  EvaluateCalendarTriggersResponseDto,
} from '../dto';

/** Definición y ejecución de la orquestación (UC-48-06 … 11, 13, 14). */
@ApiTags('automation')
@ApiBearerAuth()
@Controller('automation')
export class AutomationOrchestrationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param definitionService - Valor de definition service requerido por la operación.
   * @param executionService - Valor de execution service requerido por la operación.
   * @param recordService - Valor de record service requerido por la operación.
   */
  constructor(
    private readonly definitionService: AutomationDefinitionService,
    private readonly executionService: AutomationExecutionService,
    private readonly recordService: RecordAutomationService,
  ) {}

  /** UC-48-06. */
  @Post('workflows')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un workflow con sus pasos',
    description:
      'Los saltos entre pasos van por código; un salto a un paso no declarado se rechaza.',
  })
  defineWorkflow(
    @Body() dto: DefineWorkflowDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WorkflowResponseDto> {
    return this.definitionService.defineWorkflow(dto, actor);
  }

  /** UC-48-07. */
  @Post('triggers')
  @Roles('AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configurar un disparador de automatización',
    description:
      'Por evento exige el tipo de evento; por calendario, un cron de cinco campos.',
  })
  configureTrigger(
    @Body() dto: ConfigureTriggerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TriggerResponseDto> {
    return this.definitionService.configureTrigger(dto, actor);
  }

  /** Worker · UC-48-07 (evaluación periódica). */
  @Post('triggers/calendar/tick')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar los disparadores de calendario vencidos',
    description:
      'Toma con SKIP LOCKED: arranca un run por disparador vencido y avanza su marca.',
  })
  evaluateCalendarTriggers(
    @Body() dto: EvaluateCalendarTriggersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvaluateCalendarTriggersResponseDto> {
    return this.executionService.evaluateCalendarTriggers(dto, actor);
  }

  /** UC-48-08. */
  @Post('workflows/:id/runs')
  @Roles('SYSTEM', 'AUTOMATION_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Arrancar la ejecución de un workflow',
    description:
      'Si ya hay una ejecución viva sobre el mismo expediente, se devuelve ésa en lugar de arrancar otra.',
  })
  startWorkflowRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartWorkflowRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WorkflowRunResponseDto> {
    return this.executionService.startWorkflowRun(id, dto, actor);
  }

  /** UC-48-09 (arranque del agente). */
  @Post('runs/:workflowRunId/agent-runs')
  @Roles('SYSTEM', 'AGENT_RUNTIME', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Arrancar la ejecución de un agente dentro del run',
    description:
      'Sólo versiones publicadas: un borrador es una propuesta, no algo que actúe.',
  })
  startAgentRun(
    @Param('workflowRunId', ParseUUIDPipe) workflowRunId: string,
    @Body() dto: StartAgentRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentRunResponseDto> {
    return this.executionService.startAgentRun(workflowRunId, dto, actor);
  }

  /** UC-48-09 (traza) + UC-48-10 (pausa automática). */
  @Post('agent-runs/:id/steps')
  @Roles('SYSTEM', 'AGENT_RUNTIME', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un paso de la traza del agente',
    description:
      'Append-only. Si la herramienta exige aprobación o un guardrail bloquea, el paso queda a la espera y el run en pausa.',
  })
  recordAgentStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAgentStepDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentStepResponseDto> {
    return this.executionService.recordAgentStep(id, dto, actor);
  }

  /** UC-48-10. */
  @Post('agent-runs/:id/approvals')
  @Roles('SYSTEM', 'AGENT_RUNTIME', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar aprobación y pausar la ejecución',
    description:
      'Misma operación que dispara automáticamente el registro de un paso bloqueado.',
  })
  requestApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    return this.executionService.requestApproval(id, dto, actor);
  }

  /** UC-48-11. */
  @Post('approvals/:id/decide')
  @Roles('CLINICAL_APPROVER', 'OPERATIONAL_APPROVER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decidir la aprobación y reanudar o abortar el run',
    description: 'Una sola decisión vale; quien decide queda registrado.',
  })
  decideApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DecideApprovalResponseDto> {
    return this.executionService.decideApproval(id, dto, actor);
  }

  /** UC-48-13. */
  @Post('agent-runs/:id/record-automations/:recordAutomationId/execute')
  @Roles('SYSTEM', 'AGENT_RUNTIME', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar una automatización de registro con deduplicación',
    description:
      'Escribe en el esquema de destino con la identidad de servicio del agente; la clave de deduplicación evita el registro repetido.',
  })
  executeRecordAutomation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recordAutomationId', ParseUUIDPipe) recordAutomationId: string,
    @Body() dto: ExecuteRecordAutomationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExecuteRecordAutomationResponseDto> {
    return this.recordService.executeRecordAutomation(
      id,
      recordAutomationId,
      dto,
      actor,
    );
  }

  /** UC-48-14. */
  @Post('runs/:workflowRunId/finalize')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar la ejecución con el resumen de coste',
    description: 'Idempotente; no cierra si quedan aprobaciones pendientes.',
  })
  finalizeWorkflowRun(
    @Param('workflowRunId', ParseUUIDPipe) workflowRunId: string,
    @Body() dto: FinalizeWorkflowRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FinalizeWorkflowRunResponseDto> {
    return this.executionService.finalizeWorkflowRun(workflowRunId, dto, actor);
  }
}
