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
import { Roles } from '../../../common';
import {
  SchedulingBookingsService,
  SchedulingWaitlistService,
} from '../services';
import { WorkerBatchDto, WorkerBatchResultDto } from '../dto';

/**
 * Endpoints internos que dispara el scheduler, no la interfaz de usuario.
 *
 * Van bajo `/scheduling/internal` y exigen el rol `SYSTEM_WORKER`: son operaciones
 * de mantenimiento que recorren lotes y mutan estado sin actor humano detrás. Todas
 * son idempotentes, de modo que reejecutarlas es seguro.
 */
@ApiTags('scheduling-internal')
@ApiBearerAuth()
@Controller('scheduling/internal')
export class SchedulingInternalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param bookingsService - Valor de bookings service requerido por la operación.
   * @param waitlistService - Valor de waitlist service requerido por la operación.
   */
  constructor(
    private readonly bookingsService: SchedulingBookingsService,
    private readonly waitlistService: SchedulingWaitlistService,
  ) {}

  /** UC-41-07. */
  @Post('expire-holds')
  @Roles('SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liberar las reservas temporales vencidas',
    description:
      'Toma el lote con SKIP LOCKED para que varios workers no compitan.',
  })
  expireHolds(@Body() dto: WorkerBatchDto): Promise<WorkerBatchResultDto> {
    return this.bookingsService.expireHolds(dto.limit);
  }

  /** UC-41-12. */
  @Post('promote-waitlist/:slotId')
  @Roles('SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Promover candidatos de la lista de espera a un slot con cupo',
    description: 'Marca a los candidatos; la reserva la confirma el paciente.',
  })
  promoteWaitlist(
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @Body() dto: WorkerBatchDto,
  ): Promise<WorkerBatchResultDto> {
    return this.waitlistService.promoteWaitlist(slotId, dto.limit);
  }

  /** UC-41-14. */
  @Post('dispatch-reminders')
  @Roles('SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despachar los recordatorios cuya hora ya llegó' })
  dispatchReminders(
    @Body() dto: WorkerBatchDto,
  ): Promise<WorkerBatchResultDto> {
    return this.waitlistService.dispatchReminders(dto.limit);
  }
}
