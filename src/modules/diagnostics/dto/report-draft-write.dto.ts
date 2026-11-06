import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  REPORT_DRAFT_FILE_ROLES,
  REPORT_PATIENT_VISIBILITIES,
  type ReportDraftFileRole,
  type ReportPatientVisibility,
} from './report-draft.dto';

/** Body of `POST /diagnostics/report-drafts`. */
export class CreateReportDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceRequestId!: string;
}

/** Body of `PUT /diagnostics/report-drafts/:id`. */
export class UpdateReportDraftDto {
  /** `rowVersion` read last; a stale one answers 409. */
  @ApiProperty()
  @IsInt()
  @Min(1)
  rowVersion!: number;

  /** Validated by the server: at most 2000 blocks and 20000 characters. */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: '`{ version: 1, blocks: Block[] }`',
  })
  @IsObject()
  body!: Record<string, unknown>;

  /** One of `GET /diagnostics/report-drafts/signers`; `null` clears it. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  signerProfileId!: string | null;

  @ApiProperty({ enum: REPORT_PATIENT_VISIBILITIES })
  @IsIn(REPORT_PATIENT_VISIBILITIES)
  patientVisibility!: ReportPatientVisibility;
}

/** Body of `POST /diagnostics/report-drafts/:id/files`. */
export class AttachReportDraftFileDto {
  /** A file already stored in the active tenant. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;

  @ApiProperty({ enum: REPORT_DRAFT_FILE_ROLES })
  @IsIn(REPORT_DRAFT_FILE_ROLES)
  role!: ReportDraftFileRole;
}
