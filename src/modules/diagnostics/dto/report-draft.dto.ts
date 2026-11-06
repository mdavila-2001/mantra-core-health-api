import { ApiProperty } from '@nestjs/swagger';

export const REPORT_DRAFT_FILE_ROLES = ['DOCUMENT', 'AUDIO', 'ANNEX'] as const;
export type ReportDraftFileRole = (typeof REPORT_DRAFT_FILE_ROLES)[number];

export const REPORT_PATIENT_VISIBILITIES = ['VISIBLE', 'HELD'] as const;
export type ReportPatientVisibility =
  (typeof REPORT_PATIENT_VISIBILITIES)[number];

/** A file attached to a report draft. */
export class ReportDraftFileDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) fileId!: string;
  @ApiProperty({ enum: REPORT_DRAFT_FILE_ROLES }) role!: ReportDraftFileRole;
  @ApiProperty() ordinal!: number;
}

/** The written report of one order, as its author edits it. */
export class ReportDraftDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) serviceRequestId!: string;
  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED'] })
  status!: 'DRAFT' | 'PUBLISHED';
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      '`{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks.',
  })
  body!: unknown;
  @ApiProperty({ type: String, nullable: true }) conclusionText!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  signerProfileId!: string | null;
  @ApiProperty({ enum: REPORT_PATIENT_VISIBILITIES })
  patientVisibility!: ReportPatientVisibility;
  @ApiProperty() rowVersion!: number;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  diagnosticReportId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  publishedVersionId!: string | null;
  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'File id of the official PDF; null until published.',
  })
  officialFileId!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty({ type: [ReportDraftFileDto] }) files!: ReportDraftFileDto[];
}
