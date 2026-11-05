import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  type AuthenticatedUser,
} from '../../../../common';
import { LabStaffGuard } from '../../../diagnostics/guards';
import { GetCenterScheduleUseCase } from '../application/get-center-schedule.use-case';
import { ListCenterBookingsUseCase } from '../application/list-center-bookings.use-case';
import { SaveCenterScheduleUseCase } from '../application/save-center-schedule.use-case';
import { SetEquipmentStatusUseCase } from '../application/set-equipment-status.use-case';
import {
  CenterBookingsDto,
  CenterBookingsQueryDto,
} from './dto/center-bookings.dto';
import { SaveCenterScheduleDto } from './dto/center-schedule.dto';
import { CenterScheduleViewDto } from './dto/center-schedule-view.dto';
import { SetEquipmentStatusDto } from './dto/equipment-status.dto';

/**
 * «Horarios y equipos» of a diagnostic center, for its own staff
 * (`LabStaffGuard`: membership of the active DIAGNOSTIC_CENTER tenant). A unit
 * of another tenant answers 404, like a missing one.
 *
 * The `me/*` routes are declared BEFORE `:unitId/*` on purpose: Nest matches
 * in declaration order and `ParseUUIDPipe` would turn `me` into a 400.
 */
@ApiTags('diagnostic-units')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostic-units')
export class CenterScheduleController {
  constructor(
    private readonly reader: GetCenterScheduleUseCase,
    private readonly saver: SaveCenterScheduleUseCase,
    private readonly equipment: SetEquipmentStatusUseCase,
    private readonly bookings: ListCenterBookingsUseCase,
  ) {}

  @Get('me/schedule')
  @ApiOperation({ summary: 'Schedule, studies and equipment of my center' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  mySchedule(): Promise<CenterScheduleViewDto> {
    return this.reader.forMe();
  }

  @Get('me/bookings')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_CENTER_BOOKINGS' })
  @ApiOperation({ summary: 'Appointments booked at my center, by start' })
  @ApiOkResponse({ type: CenterBookingsDto })
  myBookings(
    @Query() query: CenterBookingsQueryDto,
  ): Promise<CenterBookingsDto> {
    return this.bookings.execute(query);
  }

  @Get(':unitId/schedule')
  @ApiOperation({ summary: 'Schedule, studies and equipment of a center' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  schedule(
    @Param('unitId', ParseUUIDPipe) unitId: string,
  ): Promise<CenterScheduleViewDto> {
    return this.reader.forUnit(unitId);
  }

  @Put(':unitId/schedule')
  @Audited({
    action: 'DIAGNOSTIC_UNIT_SCHEDULE_PUBLISHED',
    entity: 'diagnostic_unit',
    entityId: 'param:unitId',
  })
  @ApiOperation({ summary: 'Publish the whole schedule of a center' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  @ApiConflictResponse({
    description:
      '`details.affectedBookings`: booked appointments left outside.',
  })
  saveSchedule(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: SaveCenterScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.saver.execute(unitId, dto, actor);
  }

  @Patch(':unitId/equipment/:equipmentId')
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_STATUS_CHANGED',
    entity: 'diagnostic_equipment',
    entityId: 'param:equipmentId',
  })
  @ApiOperation({ summary: 'Mark a device operational or not' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  setEquipmentStatus(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body() dto: SetEquipmentStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.equipment.execute(unitId, equipmentId, dto.status, actor);
  }
}
