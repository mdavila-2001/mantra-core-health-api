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
import { StateMachineDefinitionService } from '../services';
import {
  RegisterStateMachineDto,
  StateMachineResponseDto,
  DefineStatesDto,
  DefineStatesResponseDto,
  DefineTransitionDto,
  TransitionDefinitionResponseDto,
  PublishStateMachineDto,
  PublishStateMachineResponseDto,
} from '../dto';

/**
 * Catálogo de máquinas de estado (UC-32-01 … 04). Todo lo de aquí es gobierno:
 * lo escribe el arquitecto de workflow y nada de ello mueve un agregado.
 */
@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow/state-machines')
export class WorkflowDefinitionsController {
  constructor(
    private readonly definitionService: StateMachineDefinitionService,
  ) {}

  /** UC-32-01. */
  @Post()
  @Roles('WORKFLOW_ARCHITECT', 'GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una definición de máquina de estado',
    description:
      'Nace en borrador: todavía no tiene estados ni transiciones que recorrer.',
  })
  registerStateMachine(
    @Body() dto: RegisterStateMachineDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StateMachineResponseDto> {
    return this.definitionService.registerStateMachine(dto, actor);
  }

  /** UC-32-02. */
  @Post(':id/states')
  @Roles('WORKFLOW_ARCHITECT', 'GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Declarar los estados de la máquina',
    description:
      'Exactamente un estado inicial, contando los que ya estuvieran declarados.',
  })
  defineStates(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefineStatesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DefineStatesResponseDto> {
    return this.definitionService.defineStates(id, dto, actor);
  }

  /** UC-32-03. */
  @Post(':id/transitions')
  @Roles('WORKFLOW_ARCHITECT', 'GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Declarar una transición con sus guardas y efectos',
    description: 'El estado de origen no puede ser terminal.',
  })
  defineTransition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefineTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionDefinitionResponseDto> {
    return this.definitionService.defineTransition(id, dto, actor);
  }

  /** UC-32-04. */
  @Post(':id/publish')
  @Roles('WORKFLOW_ARCHITECT', 'GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar la versión de la definición',
    description:
      'Comprueba estado inicial, estado terminal y alcanzabilidad antes de dejar entrar agregados reales; retira la versión activa anterior.',
  })
  publishStateMachine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishStateMachineDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublishStateMachineResponseDto> {
    return this.definitionService.publishStateMachine(id, dto, actor);
  }
}
