import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ImagingDetailDto } from '../../clinical/dto/service-request-detail.dto';

const NOT_BLANK = /\S/;

/** What a laboratory / imaging center performs. */
export const LAB_ORDER_CATEGORIES = ['LAB', 'IMAGING'] as const;
export type LabOrderCategory = (typeof LAB_ORDER_CATEGORIES)[number];

/**
 * Editable part of an order the center registers itself: the study, its
 * detail and who signed the paper order. The patient is fixed at creation.
 */
export class LabOrderIntakeFieldsDto {
  /** Study from the requestable catalog (`service-request-code`). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  codeConceptId!: string;

  /** The study's family, as the catalog lists it; checked against the catalog. */
  @ApiProperty({ enum: LAB_ORDER_CATEGORIES })
  @IsIn(LAB_ORDER_CATEGORIES)
  category!: LabOrderCategory;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  /** Laboratory only: the specimen the study needs. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specimenTypeConceptId?: string;

  /** Imaging only: modality, body site, laterality and contrast. */
  @ApiPropertyOptional({ type: () => ImagingDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagingDetailDto)
  imaging?: ImagingDetailDto;

  /** Who signed the paper order. Absent for a study the patient asks for. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK)
  @MaxLength(200)
  externalRequesterName?: string;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK)
  @MaxLength(64)
  externalRequesterLicense?: string;
}

/** Body of `POST /diagnostics/lab/orders`. */
export class CreateLabOrderDto extends LabOrderIntakeFieldsDto {
  /** From `POST /diagnostics/lab/patients/lookup`. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;
}

/** Body of `PUT /diagnostics/lab/orders/:orderId`: replaces every editable field. */
export class UpdateLabOrderDto extends LabOrderIntakeFieldsDto {}

/** Body of `POST /diagnostics/lab/patients/lookup`. In the body: a national id is PHI. */
export class LabPatientLookupDto {
  @ApiProperty({ maxLength: 40, description: 'Exact national id number' })
  @IsString()
  @Matches(NOT_BLANK)
  @MaxLength(40)
  nationalId!: string;
}

/** The patient that holds that national id, enough to confirm at the counter. */
export class LabPatientMatchDto {
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ type: String, nullable: true }) patientCode!: string | null;
}
