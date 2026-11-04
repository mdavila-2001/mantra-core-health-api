import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EQUIPMENT_STATUSES,
  MODALITY_CODES,
  type EquipmentStatus,
  type ModalityCode,
} from '../../domain/center-schedule.model';
import { SaveCenterScheduleDto } from './center-schedule.dto';

export class CenterStudyDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: MODALITY_CODES }) modalityCode!: ModalityCode;
  @ApiProperty({ type: Number, nullable: true }) price!: number | null;
  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currency!: string | null;
  @ApiProperty({ type: String, nullable: true }) preparation!: string | null;
}

export class CenterEquipmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) manufacturer!: string | null;
  @ApiProperty({ type: String, nullable: true }) model!: string | null;
  @ApiProperty({
    enum: MODALITY_CODES,
    nullable: true,
    description: '`null`: does not limit appointments (an analyzer).',
  })
  modalityCode!: ModalityCode | null;
  @ApiProperty({ enum: EQUIPMENT_STATUSES }) status!: EquipmentStatus;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Always `null` for now.',
  })
  glossaryConceptId!: string | null;
}

/** Response of `GET|PUT /diagnostic-units/{unitId}/schedule`. */
export class CenterScheduleViewDto {
  @ApiProperty({ format: 'uuid' }) unitId!: string;
  @ApiProperty() unitName!: string;
  @ApiProperty({ enum: ['LABORATORY', 'IMAGING'] })
  kind!: 'LABORATORY' | 'IMAGING';
  @ApiProperty({ type: SaveCenterScheduleDto })
  schedule!: SaveCenterScheduleDto;
  @ApiProperty({ type: [CenterStudyDto] }) studies!: CenterStudyDto[];
  @ApiProperty({ type: [CenterEquipmentDto] }) equipment!: CenterEquipmentDto[];
  @ApiProperty({
    type: String,
    nullable: true,
    description: '`null` while the center has never published a schedule.',
  })
  updatedAt!: string | null;
  @ApiPropertyOptional({
    description: 'Future bookings left without an operational device.',
  })
  bookingsWithoutEquipment?: number;
}
