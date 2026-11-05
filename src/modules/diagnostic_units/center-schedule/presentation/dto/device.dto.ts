import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  EQUIPMENT_STATUSES,
  MODALITY_CODES,
  type EquipmentStatus,
  type ModalityCode,
} from '../../domain/center-schedule.model';
import {
  EQUIPMENT_TYPE_CODES,
  type EquipmentTypeCode,
} from '../../domain/equipment-types';

/** One entry of `GET /diagnostic-units/me/equipment-types`. */
export class EquipmentTypeDto {
  @ApiProperty({ enum: EQUIPMENT_TYPE_CODES }) code!: EquipmentTypeCode;
  @ApiProperty({ example: 'Ecógrafo' }) label!: string;
  @ApiProperty({
    enum: MODALITY_CODES,
    nullable: true,
    description: '`null`: the type never limits appointments.',
  })
  modalityCode!: ModalityCode | null;
}

export class EquipmentTypesDto {
  @ApiProperty({ type: [EquipmentTypeDto] }) items!: EquipmentTypeDto[];
}

/** Body of `POST /diagnostic-units/{unitId}/equipment`. */
export class CreateDeviceDto {
  @ApiProperty({ enum: EQUIPMENT_TYPE_CODES })
  @IsIn(EQUIPMENT_TYPE_CODES)
  typeCode!: EquipmentTypeCode;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  manufacturer?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  serialNumber?: string;
}

/** Body of `PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}`: any of its fields. */
export class UpdateDeviceDto {
  @ApiPropertyOptional({ enum: EQUIPMENT_STATUSES })
  @IsOptional()
  @IsIn(EQUIPMENT_STATUSES)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  manufacturer?: string | null;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string | null;

  @ApiPropertyOptional({ maxLength: 80, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  serialNumber?: string | null;
}
