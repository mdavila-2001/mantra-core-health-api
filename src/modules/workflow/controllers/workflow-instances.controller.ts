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
import { WorkflowInstancesService } from '../services';
import {
  CreateWorkflowInstanceDto,
  WorkflowInstanceResponseDto,
  CompleteTaskDto,
  CompleteTaskResponseDto,
  SweepTimeoutsDto,
  SweepTimeoutsResponseDto,
} from '../dto';

/** Instancias de workflow y sus tareas (UC-32-10, 12, 13). */
@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowInstancesController {
  constructor(private readonly instancesService: WorkflowInstancesService) {}

  /**
   * UC-32-10. Declarada antes que `instances` para que el segmento literal se
   * resuelva antes que cualquier ruta paramétrica que se añada después.
   */
  @Post('instances/sweep-timeouts')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalar las instancias con el plazo vencido',
    description:
      'Toma un lote con SKIP LOCKED para que dos barridos concurrentes se repartan la cola. Escalar no cancela.',
  })
  sweepTimeouts(
    @Body() dto: SweepTimeoutsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SweepTimeoutsResponseDto> {
    return this.instancesService.sweepTimeouts(dto, actor);
  }

  /** UC-32-12. */
  @Post('instances')
  @Roles('CLINICIAN', 'BILLING_AGENT', 'SCHEDULER', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una instancia de workflow y sus tareas iniciales',
    description:
      'El estado inicial sale de la definición activa, no de la petición. Una sola instancia viva por (código, sujeto).',
  })
  createInstance(
    @Body() dto: CreateWorkflowInstanceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WorkflowInstanceResponseDto> {
    return this.instancesService.createInstance(dto, actor);
  }

  /** UC-32-13. */
  @Post('tasks/:id/complete')
  @Roles('CLINICIAN', 'BILLING_AGENT', 'SCHEDULER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar una tarea de workflow',
    description:
      'Fija en la tarea quién la completó y, si se envía un comando, dispara la transición asociada.',
  })
  completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CompleteTaskResponseDto> {
    return this.instancesService.completeTask(id, dto, actor);
  }
}
