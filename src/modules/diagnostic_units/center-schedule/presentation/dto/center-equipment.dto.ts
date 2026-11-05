import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MODALITY_CODES,
  type ModalityCode,
} from '../../domain/center-schedule.model';

/** Body of `POST|PUT /diagnostic-units/{unitId}/equipment[/{equipmentId}]`. */
export class CenterEquipmentInputDto {
  @ApiProperty({ example: 'Ecógrafo sala 2', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  serialNumber?: string | null;

  @ApiPropertyOptional({
    enum: MODALITY_CODES,
    nullable: true,
    description: '`null`: an analyzer, which never limits appointments.',
  })
  @IsOptional()
  @IsIn(MODALITY_CODES)
  modalityCode?: ModalityCode | null;
}
