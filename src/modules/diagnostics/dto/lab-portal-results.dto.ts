import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  LAB_RESULT_KINDS,
  type LabResultKind,
} from '../services/lab-portal.projection';

/** Reads the raw query value: implicit conversion would turn 'false' into true. */
const toBoolean = ({
  obj,
  key,
}: {
  obj: Record<string, unknown>;
  key: string;
}) => {
  const raw = obj[key];
  if (raw === 'true' || raw === true) return true;
  if (raw === 'false' || raw === false) return false;
  return raw;
};

/**
 * Query of `GET /diagnostics/lab/result-files`. There is no free-text search
 * here on purpose: the text may be a patient name (PHI) and never travels in
 * the URL; it goes in the body of `POST /diagnostics/lab/result-files/search`.
 */
export class LabResultFileQueryDto {
  @ApiPropertyOptional({ enum: LAB_RESULT_KINDS })
  @IsOptional()
  @IsIn(LAB_RESULT_KINDS)
  kind?: LabResultKind;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  /** `true` also returns withdrawn files. */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeWithdrawn?: boolean;
}

/** Body of `POST /diagnostics/lab/result-files/search`. */
export class LabResultFileSearchDto extends LabResultFileQueryDto {
  /** File name, patient, order or note; accent and case insensitive. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

/** Body of `POST /diagnostics/lab/result-files/:id/withdrawal`. */
export class LabResultWithdrawalDto {
  @ApiProperty({ maxLength: 1000 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

/** A result file uploaded by the laboratory. */
export class LabResultFileDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() contentType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiProperty({ enum: LAB_RESULT_KINDS }) kind!: LabResultKind;
  @ApiProperty({ format: 'date-time' }) uploadedAt!: string;
  @ApiProperty() uploadedBy!: string;
  @ApiProperty({ type: String, nullable: true }) orderId!: string | null;
  @ApiProperty({ type: String, nullable: true }) orderLabel!: string | null;
  @ApiProperty({ type: String, nullable: true }) patientName!: string | null;
  @ApiProperty({ type: String, nullable: true }) note!: string | null;
  /** The API does not send notifications from this portal: always `false`. */
  @ApiProperty() notified!: boolean;
  @ApiProperty({ enum: ['AVAILABLE', 'WITHDRAWN'] })
  status!: 'AVAILABLE' | 'WITHDRAWN';
  @ApiProperty({ type: String, nullable: true })
  withdrawnReason!: string | null;
}

export class LabResultFilePageDto {
  @ApiProperty({ type: [LabResultFileDto] }) items!: LabResultFileDto[];
  @ApiProperty() count!: number;
  @ApiProperty() totalBytes!: number;
}
