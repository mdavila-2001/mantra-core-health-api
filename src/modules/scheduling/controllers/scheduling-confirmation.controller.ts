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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: SchedulingConfirmationService) {}

  /**
   * Crea create.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create conforme al contrato `Promise<ConfirmationRuleResponseDto>`.
   */
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

  /**
   * Obtiene list.
   *
   * @param tenantId - Identificador de tenant.
   * @param includeDisabled - Valor de include disabled requerido por la operación.
   * @returns Resultado de list conforme al contrato `Promise<ConfirmationRuleResponseDto[]>`.
   */
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

  /**
   * Ejecuta la operación activate.
   *
   * @param id - Identificador de id.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de activate conforme al contrato `Promise<ConfirmationRuleResponseDto>`.
   */
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

  /**
   * Ejecuta la operación deactivate.
   *
   * @param id - Identificador de id.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de deactivate conforme al contrato `Promise<ConfirmationRuleResponseDto>`.
   */
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

  /**
   * Ejecuta la operación evaluate.
   *
   * @param dto - Datos validados de la operación.
   * @returns Resultado de evaluate conforme al contrato `Promise<EvaluateBookingResultDto>`.
   */
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
