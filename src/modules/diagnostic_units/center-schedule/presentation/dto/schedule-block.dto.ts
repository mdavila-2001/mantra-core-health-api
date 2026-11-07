import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A window of one day: ISO weekday (1 = Monday … 7 = Sunday), `HH:MM` local times. */
export class ScheduleWindowDto {
  @ApiProperty({ minimum: 1, maximum: 7, example: 1 })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ example: '08:00', pattern: HH_MM.source })
  @Matches(HH_MM)
  startTime!: string;

  @ApiProperty({ example: '12:00', pattern: HH_MM.source })
  @Matches(HH_MM)
  endTime!: string;

  @ApiPropertyOptional({
    minimum: 5,
    maximum: 240,
    description: "This window's appointment length; absent, the block's.",
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  slotMinutes?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 120,
    description: 'Rest after each appointment; absent, none.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  gapMinutes?: number;
}

/** A schedule: its windows and how long each appointment lasts. */
export class ScheduleBlockDto {
  @ApiProperty({ type: [ScheduleWindowDto] })
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => ScheduleWindowDto)
  windows!: ScheduleWindowDto[];

  @ApiProperty({ minimum: 5, maximum: 240, example: 30 })
  @IsInt()
  @Min(5)
  @Max(240)
  slotMinutes!: number;
}
