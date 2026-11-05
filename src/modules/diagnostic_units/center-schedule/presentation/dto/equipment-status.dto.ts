import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  EQUIPMENT_STATUSES,
  type EquipmentStatus,
} from '../../domain/center-schedule.model';

/** Body of `PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}`. */
export class SetEquipmentStatusDto {
  @ApiProperty({ enum: EQUIPMENT_STATUSES })
  @IsIn(EQUIPMENT_STATUSES)
  status!: EquipmentStatus;
}
