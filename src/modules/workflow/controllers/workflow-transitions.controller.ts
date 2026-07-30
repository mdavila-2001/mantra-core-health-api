import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { TransitionExecutionService } from '../services';
import {
  TriggerTransitionDto,
  TransitionEventResponseDto,
  CompensateTransitionDto,
  CompensateTransitionResponseDto,
  RetryTransitionDto,
  RetryTransitionResponseDto,
  QueryTransitionHistoryDto,
  TransitionHistoryResponseDto,
} from '../dto';

/**
 * Ejecución de transiciones sobre agregados de dominio (UC-32-05, 06, 08, 09, 11).
 */
@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow/aggregates')
export class WorkflowTransitionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param executionService - Valor de execution service requerido por la operación.
   */
  constructor(private readonly executionService: TransitionExecutionService) {}

  /** UC-32-11. Va antes que la ruta de disparo para leerse en el mismo bloque. */
  @Get(':aggregateId/transitions')
  @Roles('AUDITOR', 'COMPLIANCE_OFFICER', 'CLINICIAN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Historial de transiciones del agregado',
    description:
      'Lectura sobre tabla append-only; devuelve además el estado actual de la instancia.',
  })
  getTransitionHistory(
    @Param('aggregateId', ParseUUIDPipe) aggregateId: string,
    @Query() query: QueryTransitionHistoryDto,
  ): Promise<TransitionHistoryResponseDto> {
    return this.executionService.getTransitionHistory(aggregateId, query);
  }

  /**
   * UC-32-05 (y UC-32-06 por la cabecera `Idempotency-Key`).
   *
   * El caso de uso escribe `transitions:{command_code}`; se publica como segmento
   * aparte porque `path-to-regexp` v8 trata `:` como inicio de parámetro en
   * cualquier posición del segmento.
   */
  @Post(':aggregateId/transitions/:commandCode')
  @Roles('CLINICIAN', 'BILLING_AGENT', 'SCHEDULER', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Obligatoria si la transición declara `idempotency_required`.',
  })
  @ApiOperation({
    summary: 'Disparar una transición validada',
    description:
      'Bloquea el agregado, evalúa las guardas en orden, mueve el estado y publica los efectos en el outbox, todo en la misma transacción.',
  })
  triggerTransition(
    @Param('aggregateId', ParseUUIDPipe) aggregateId: string,
    @Param('commandCode') commandCode: string,
    @Body() dto: TriggerTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransitionEventResponseDto> {
    return this.executionService.triggerTransition(
      aggregateId,
      commandCode,
      dto,
      actor,
      idempotencyKey,
    );
  }

  /** UC-32-08. */
  @Post(':aggregateId/transitions/:eventId/compensate')
  @Roles('SYSTEM', 'SAGA_ORCHESTRATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compensar una transición',
    description:
      'Sólo si algún efecto declara compensación; registra un evento nuevo, no borra el original.',
  })
  compensateTransition(
    @Param('aggregateId', ParseUUIDPipe) aggregateId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CompensateTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CompensateTransitionResponseDto> {
    return this.executionService.compensateTransition(
      aggregateId,
      eventId,
      dto,
      actor,
    );
  }

  /** UC-32-09. */
  @Post(':aggregateId/transitions/:eventId/retry')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reintentar una transición cuyo efecto falló',
    description:
      'Conserva la clave de idempotencia del original para no duplicar el efecto de negocio.',
  })
  retryTransition(
    @Param('aggregateId', ParseUUIDPipe) aggregateId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: RetryTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetryTransitionResponseDto> {
    return this.executionService.retryTransition(
      aggregateId,
      eventId,
      dto,
      actor,
    );
  }
}
