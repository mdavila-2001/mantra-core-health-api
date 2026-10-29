import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, Roles } from '../../../common';
import {
  BedDayRunResultDto,
  OrTimeRunResultDto,
  RunBedDayChargesDto,
  RunOrTimeChargesDto,
} from '../dto';
import { BedDayChargesService } from '../services/bed-day-charges.service';
import { OrTimeChargesService } from '../services/or-time-charges.service';

/**
 * Procesos de devengo que dispara el scheduler, no la interfaz.
 *
 * Exigen el rol `SYSTEM` o `SYSTEM_WORKER` y son **idempotentes**: reejecutarlos
 * (o solaparlos) no duplica cargos.
 */
@ApiTags('billing-internal')
@ApiBearerAuth()
@Controller('internal/billing')
export class BillingChargesInternalController {
  /**
   * @param bedDays - Devengo del día-cama.
   * @param orTime - Devengo del quirófano por tiempo.
   */
  constructor(
    private readonly bedDays: BedDayChargesService,
    private readonly orTime: OrTimeChargesService,
  ) {}

  /** Día-cama por la regla de medianoche. */
  @Audited({
    action: 'BED_DAY_CHARGES_RUN',
    entity: 'charge_capture',
  })
  @Post('bed-day-charges/run')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Devenga los días-cama por la regla de medianoche (idempotente)',
  })
  runBedDays(
    @Body() dto: RunBedDayChargesDto = {},
  ): Promise<BedDayRunResultDto> {
    return this.bedDays.run({ date: dto.date, encounterId: dto.encounterId });
  }

  /** Quirófano por tiempo. */
  @Audited({
    action: 'OR_TIME_CHARGES_RUN',
    entity: 'charge_capture',
  })
  @Post('or-time-charges/run')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Devenga el uso de quirófano por tiempo de los casos completados (idempotente)',
  })
  runOrTime(
    @Body() dto: RunOrTimeChargesDto = {},
  ): Promise<OrTimeRunResultDto> {
    return this.orTime.run({ caseId: dto.caseId });
  }
}
