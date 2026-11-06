import { ApiProperty } from '@nestjs/swagger';

/** A practitioner who may sign the reports of the active tenant. */
export class ReportSignerDto {
  @ApiProperty({ format: 'uuid' }) profileId!: string;
  @ApiProperty() name!: string;
  /** National registration (matrícula), if declared. */
  @ApiProperty({ type: String, nullable: true }) registration!: string | null;
  @ApiProperty() hasSignature!: boolean;
  @ApiProperty() hasSeal!: boolean;
}

export class ReportSignerListDto {
  @ApiProperty({ type: [ReportSignerDto] }) items!: ReportSignerDto[];
}
