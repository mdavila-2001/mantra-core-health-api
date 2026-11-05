import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ScheduleBlockDto } from './schedule-block.dto';

/**
 * Body of `PUT /diagnostic-units/{unitId}/equipment/{equipmentId}/schedule`.
 * `schedule: null` puts the device back on the center's general schedule.
 */
export class SaveDeviceScheduleDto {
  @ApiProperty({ type: ScheduleBlockDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleBlockDto)
  schedule!: ScheduleBlockDto | null;
}
