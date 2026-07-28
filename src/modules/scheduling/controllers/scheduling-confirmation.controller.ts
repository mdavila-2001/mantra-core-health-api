import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SchedulingConfirmationService } from '../services';
import {
  CreateConfirmationRuleDto,
  ConfirmationRuleResponseDto,
  EvaluateBookingRequestDto,
  EvaluateBookingResultDto,
} from '../dto';

/**
 * Reglas del motor de confirmación automática de reservas (C-11). Sólo
 * administración de agenda las gestiona. No hay borrado duro: se activa/desactiva.
 */
@ApiTags('scheduling-confirmation')
@ApiBearerAuth()
@Controller('scheduling/confirmation-rules')
export class SchedulingConfirmationController {
  constructor(private readonly service: SchedulingConfirmationService) {}

  @Post()
  @Roles('SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una regla de confirmación' })
  create(
    @Body() dto: CreateConfirmationRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.service.createRule(dto, actor);
  }

  @Get()
  @Roles('SCHEDULING_ADMIN')
  @ApiOperation({ summary: 'Listar las reglas de un tenant' })
  @ApiQuery({ name: 'tenantId', format: 'uuid' })
  @ApiQuery({ name: 'includeDisabled', required: false, type: Boolean })
  list(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('includeDisabled') includeDisabled?: string,
  ): Promise<ConfirmationRuleResponseDto[]> {
    return this.service.listRules(tenantId, includeDisabled === 'true');
  }

  @Post(':id/activate')
  @Roles('SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar una regla desactivada' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.service.activateRule(id, actor);
  }

  @Post(':id/deactivate')
  @Roles('SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar una regla (sin borrado duro)' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.service.deactivateRule(id, actor);
  }

  @Post('evaluate')
  @Roles('SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar una solicitud de reserva contra las reglas vigentes',
  })
  evaluate(
    @Body() dto: EvaluateBookingRequestDto,
  ): Promise<EvaluateBookingResultDto> {
    return this.service.evaluateBookingRequest(dto.tenantId, dto.requestData, {
      practiceId: dto.practiceId,
      resourceId: dto.resourceId,
      serviceConceptId: dto.serviceConceptId,
    });
  }
}
