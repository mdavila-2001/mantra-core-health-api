import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsInt, Min } from 'class-validator';
import {
  REPORT_PATIENT_VISIBILITIES,
  type ReportPatientVisibility,
} from './report-draft.dto';

/** Body of `POST /diagnostics/report-drafts/:id/publish`. */
export class PublishReportDraftDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  rowVersion!: number;

  /** Publishing is irreversible: the client must say so explicitly. */
  @ApiProperty({ enum: [true] })
  @Equals(true, { message: 'Confirme que la publicación es irreversible' })
  confirmIrreversible!: true;
}

/** Result of publishing a draft. */
export class PublishedReportDto {
  @ApiProperty({ format: 'uuid' }) reportId!: string;
  @ApiProperty({ format: 'uuid' }) versionId!: string;
  @ApiProperty({ format: 'uuid' }) officialFileId!: string;
  @ApiProperty({ enum: ['PUBLISHED'] }) status!: 'PUBLISHED';
  @ApiProperty({ enum: REPORT_PATIENT_VISIBILITIES })
  patientVisibility!: ReportPatientVisibility;
}

/** Result of `POST /diagnostics/reports/:reportId/patient-release`. */
export class PatientReleaseResultDto {
  @ApiProperty({ format: 'uuid' }) reportId!: string;
  @ApiProperty({ format: 'uuid' }) versionId!: string;
  @ApiProperty({ enum: ['VISIBLE'] }) patientVisibility!: 'VISIBLE';
}

/** Public verification of an official report: no health data. */
export class ReportVerificationDto {
  @ApiProperty({ enum: ['PUBLISHED'] }) status!: 'PUBLISHED';
  @ApiProperty({ format: 'date-time' }) issuedAt!: string;
  @ApiProperty() issuerName!: string;
  @ApiProperty() studyName!: string;
  @ApiProperty() contentHash!: string;
}
