import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import {
  DispatchMedicationRemindersDto,
  DispatchMedicationRemindersResultDto,
} from '../dto/medication-reminders.dto';
import { MedicationRemindersService } from '../services/medication-reminders.service';

/**
 * Endpoints internos de `clinical` que dispara el worker, no la interfaz.
 *
 * Mismo criterio que `SchedulingInternalController`: bajo `/clinical/internal`,
 * sólo `SYSTEM`/`SYSTEM_WORKER`, e idempotentes — reejecutar una pasada es
 * seguro porque cada toma se reclama una sola vez.
 */
@ApiTags('clinical-internal')
@ApiBearerAuth()
@Controller('clinical/internal')
export class ClinicalInternalController {
  /** @param remindersService - Despacho de recordatorios de toma. */
  constructor(private readonly remindersService: MedicationRemindersService) {}

  /** Recordatorios de toma de los próximos minutos (patch v4.2.35). */
  @Post('medication-reminders/dispatch')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Avisar las tomas de medicamento de los próximos minutos',
    description:
      'Emite un aviso in-app por toma dentro de la ventana, una sola vez por toma aunque se reejecute.',
  })
  dispatchMedicationReminders(
    @Body() dto: DispatchMedicationRemindersDto,
  ): Promise<DispatchMedicationRemindersResultDto> {
    return this.remindersService.dispatchDue({
      windowMinutes: dto.windowMinutes,
      limit: dto.limit,
    });
  }
}
