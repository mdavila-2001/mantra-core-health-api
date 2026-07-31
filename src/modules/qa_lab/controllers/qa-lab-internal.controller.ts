import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { QaCatalogService } from '../services';
import { RunDueSchedulesDto, RunDueSchedulesResponseDto } from '../dto';

/**
 * Superficie interna de laboratorio de pruebas: la opera el worker que
 * evalúa `test_schedules`, no los clientes del laboratorio.
 *
 * Va en un controlador aparte por el mismo motivo que `messaging`: mezclarla
 * con las rutas de negocio invitaría a llamarla desde fuera del ciclo de vida
 * del worker.
 */
@ApiTags('qa-internal')
@ApiBearerAuth()
@Controller('internal/qa')
export class QaLabInternalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogService - Valor de catalog service requerido por la operación.
   */
  constructor(private readonly catalogService: QaCatalogService) {}

  /**
   * Fase 2 del plan de corrección de workers: cierra el "Disparo programado"
   * que el README documenta como pendiente ("`test_schedules` guarda cron y
   * `next_run_at`; el tick que las dispara...").
   */
  @Post('schedules/run-due')
  @Roles('SYSTEM', 'QA_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar programaciones vencidas y encolar sus corridas',
    description: '`SKIP LOCKED`: varios ticks corren a la vez sin estorbarse.',
  })
  runDueSchedules(
    @Body() dto: RunDueSchedulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunDueSchedulesResponseDto> {
    return this.catalogService.runDueSchedules(dto, actor);
  }
}
