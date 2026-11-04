import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  MODALITY_CODES,
  type ModalityCode,
} from '../../domain/center-schedule.model';
import { ScheduleBlockDto } from './schedule-block.dto';

/** Own schedule of a modality (all its studies). */
export class ModalityScheduleDto {
  @ApiProperty({ enum: MODALITY_CODES })
  @IsIn(MODALITY_CODES)
  modalityCode!: ModalityCode;

  @ApiProperty({ type: ScheduleBlockDto })
  @ValidateNested()
  @Type(() => ScheduleBlockDto)
  schedule!: ScheduleBlockDto;
}

/** Own schedule of one study, which wins over its modality's. */
export class StudyScheduleDto {
  @ApiProperty({ example: 'STUDY-ECO-OBSTETRICA', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  studyCode!: string;

  @ApiProperty({ type: ScheduleBlockDto })
  @ValidateNested()
  @Type(() => ScheduleBlockDto)
  schedule!: ScheduleBlockDto;
}

/** Body of `PUT /diagnostic-units/{unitId}/schedule`: the whole schedule. */
export class SaveCenterScheduleDto {
  @ApiProperty({ type: ScheduleBlockDto })
  @ValidateNested()
  @Type(() => ScheduleBlockDto)
  general!: ScheduleBlockDto;

  @ApiProperty({ type: [ModalityScheduleDto] })
  @IsArray()
  @ArrayMaxSize(MODALITY_CODES.length)
  @ValidateNested({ each: true })
  @Type(() => ModalityScheduleDto)
  modalities!: ModalityScheduleDto[];

  @ApiProperty({ type: [StudyScheduleDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => StudyScheduleDto)
  studies!: StudyScheduleDto[];
}
