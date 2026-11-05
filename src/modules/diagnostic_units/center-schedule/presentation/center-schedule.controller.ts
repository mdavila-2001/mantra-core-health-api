import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AddEquipmentUseCase } from '../application/add-equipment.use-case';
import { GetCenterScheduleUseCase } from '../application/get-center-schedule.use-case';
import { ListCenterBookingsUseCase } from '../application/list-center-bookings.use-case';
import { RemoveEquipmentUseCase } from '../application/remove-equipment.use-case';
import { SaveCenterScheduleUseCase } from '../application/save-center-schedule.use-case';
import { SaveDeviceScheduleUseCase } from '../application/save-device-schedule.use-case';
import { UpdateEquipmentUseCase } from '../application/update-equipment.use-case';
import { EQUIPMENT_TYPES } from '../domain/equipment-types';
import {
  CenterBookingsDto,
  CenterBookingsQueryDto,
} from './dto/center-bookings.dto';
import { SaveCenterScheduleDto } from './dto/center-schedule.dto';
import { CenterScheduleViewDto } from './dto/center-schedule-view.dto';
import { SaveDeviceScheduleDto } from './dto/device-schedule.dto';
import {
  CreateCenterDeviceDto,
  EquipmentTypesDto,
  UpdateCenterDeviceDto,
} from './dto/device.dto';

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
    private readonly adder: AddEquipmentUseCase,
    private readonly updater: UpdateEquipmentUseCase,
    private readonly remover: RemoveEquipmentUseCase,
    private readonly deviceSchedule: SaveDeviceScheduleUseCase,
    private readonly bookings: ListCenterBookingsUseCase,
  ) {}

  @Get('me/schedule')
  @ApiOperation({ summary: 'Schedule, studies and equipment of my center' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  mySchedule(): Promise<CenterScheduleViewDto> {
    return this.reader.forMe();
  }

  @Get('me/equipment-types')
  @ApiOperation({
    summary: 'The catalog of equipment types a center picks from',
  })
  @ApiOkResponse({ type: EquipmentTypesDto })
  equipmentTypes(): EquipmentTypesDto {
    return {
      items: EQUIPMENT_TYPES.map(({ code, label, modalityCode }) => ({
        code,
        label,
        modalityCode,
      })),
    };
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

  @Post(':unitId/equipment')
  @HttpCode(HttpStatus.CREATED)
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_ADDED',
    entity: 'diagnostic_unit',
    entityId: 'param:unitId',
  })
  @ApiOperation({
    summary: 'Inventory a device of the center from the type catalog',
  })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  addEquipment(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: CreateCenterDeviceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.adder.execute(unitId, dto, actor);
  }

  @Patch(':unitId/equipment/:equipmentId')
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_STATUS_CHANGED',
    entity: 'diagnostic_equipment',
    entityId: 'param:equipmentId',
  })
  @ApiOperation({
    summary: 'Change a device: operational or not, make, model, serial',
  })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  updateEquipment(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body() dto: UpdateCenterDeviceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.updater.execute(unitId, equipmentId, dto, actor);
  }

  @Delete(':unitId/equipment/:equipmentId')
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_REMOVED',
    entity: 'diagnostic_equipment',
    entityId: 'param:equipmentId',
  })
  @ApiOperation({ summary: 'Retire a device the center no longer has' })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  @ApiConflictResponse({
    description:
      'The device attended bookings: mark it out of service instead.',
  })
  removeEquipment(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.remover.execute(unitId, equipmentId, actor);
  }

  @Put(':unitId/equipment/:equipmentId/schedule')
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_SCHEDULE_PUBLISHED',
    entity: 'diagnostic_equipment',
    entityId: 'param:equipmentId',
  })
  @ApiOperation({
    summary: 'The own hours of one device; `null` follows the general schedule',
  })
  @ApiOkResponse({ type: CenterScheduleViewDto })
  @ApiConflictResponse({
    description:
      '`details.affectedBookings`: booked appointments of the device left outside.',
  })
  saveDeviceSchedule(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body() dto: SaveDeviceScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.deviceSchedule.execute(
      unitId,
      equipmentId,
      dto.schedule ?? null,
      actor,
    );
  }
}
