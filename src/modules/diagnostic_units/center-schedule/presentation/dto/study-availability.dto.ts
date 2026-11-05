import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ScheduleOrigin } from '../../domain/center-schedule.model';

/** Query of `GET /diagnostic-units/{unitId}/study-availability`. */
export class StudyAvailabilityQueryDto {
  @ApiProperty({ example: 'STUDY-ECO-ABD', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  studyCode!: string;

  @ApiPropertyOptional({ description: 'ISO instant; defaults to now.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'ISO instant; defaults to from + 14 days.',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class StudyStartDto {
  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' }) startAt!: string;
  @ApiProperty({ example: '2026-11-05T12:30:00.000Z' }) endAt!: string;
  @ApiProperty({ description: 'Places left in this slot.' }) remaining!: number;
  @ApiProperty({ description: 'Patients per slot.' }) capacity!: number;
}

/** Response of `GET /diagnostic-units/{unitId}/study-availability`. */
export class StudyAvailabilityDto {
  @ApiProperty({ format: 'uuid' }) unitId!: string;
  @ApiProperty() studyCode!: string;
  @ApiProperty({ enum: ['STUDY', 'MODALITY', 'GENERAL'] })
  origin!: ScheduleOrigin;
  @ApiProperty({ type: [StudyStartDto] }) items!: StudyStartDto[];
}
