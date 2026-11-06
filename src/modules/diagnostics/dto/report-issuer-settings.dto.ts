import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

const trimOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

/** Body of `PUT /diagnostics/report-issuer-settings`. */
export class UpdateReportIssuerSettingsDto {
  /** Signature image (PNG/JPEG) of the issuing organization; `null` removes it. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  signatureFileId!: string | null;

  /** Seal image (PNG/JPEG); `null` removes it. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  sealFileId!: string | null;

  @ApiProperty({ type: String, nullable: true, maxLength: 120 })
  @Transform(trimOrNull)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(120)
  responsibleName!: string | null;

  @ApiProperty({ type: String, nullable: true, maxLength: 120 })
  @Transform(trimOrNull)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(120)
  responsibleTitle!: string | null;
}

/** Signature, seal and responsible of the active tenant's reports. */
export class ReportIssuerSettingsDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  signatureFileId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  sealFileId!: string | null;
  @ApiProperty({ type: String, nullable: true }) responsibleName!:
    string | null;
  @ApiProperty({ type: String, nullable: true })
  responsibleTitle!: string | null;
}
