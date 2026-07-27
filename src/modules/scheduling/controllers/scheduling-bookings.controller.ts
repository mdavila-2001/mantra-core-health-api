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
  SchedulingBookingsService,
  SchedulingWaitlistService,
} from '../services';
import {
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
} from '../dto';

/** Operaciones sobre una cita ya confirmada. */
@ApiTags('scheduling-bookings')
@ApiBearerAuth()
@Controller('scheduling/bookings')
export class SchedulingBookingsController {
  constructor(
    private readonly bookingsService: SchedulingBookingsService,
    private readonly waitlistService: SchedulingWaitlistService,
  ) {}

  /** UC-41-08. */
  @Post(':id/reschedule')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogramar la cita a otro slot' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    return this.bookingsService.reschedule(id, dto, actor);
  }

  /** UC-41-09. */
  @Post(':id/cancel')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar la cita y liberar el cupo',
    description:
      'El cargo por inasistencia solo aplica si la política lo define y es un no-show.',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.bookingsService.cancel(id, dto, actor);
  }

  /** UC-41-10. */
  @Post(':id/check-in')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar la llegada del paciente' })
  checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    return this.bookingsService.checkIn(id, actor);
  }

  /** UC-41-13. */
  @Post(':id/reminders')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar recordatorios para la cita' })
  scheduleReminders(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleRemindersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScheduleRemindersResponseDto> {
    return this.waitlistService.scheduleReminders(id, dto, actor);
  }
}
