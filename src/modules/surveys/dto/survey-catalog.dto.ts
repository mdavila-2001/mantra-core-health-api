import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateAssignmentDto, TemplateSummaryDto } from './responses.dto';

/** Where a catalog survey comes from. */
export const SURVEY_CATALOG_ORIGINS = ['SYSTEM', 'PRACTITIONER'] as const;
export type SurveyCatalogOrigin = (typeof SURVEY_CATALOG_ORIGINS)[number];

/** What a system base survey is issued for. */
export const SURVEY_CATALOG_SCOPES = ['CONSULTATION', 'SERVICE'] as const;
export type SurveyCatalogScope = (typeof SURVEY_CATALOG_SCOPES)[number];

/** One row of the practitioner's survey catalog. */
export class SurveyCatalogEntryDto extends TemplateSummaryDto {
  /** `SYSTEM` for the base surveys, `PRACTITIONER` for the ones they wrote. */
  @ApiProperty({ enum: SURVEY_CATALOG_ORIGINS })
  origin!: SurveyCatalogOrigin;

  /**
   * Only for `SYSTEM`: `CONSULTATION` is issued for bookings without a
   * service, `SERVICE` for every booking of a service.
   */
  @ApiPropertyOptional({ enum: SURVEY_CATALOG_SCOPES })
  scope?: SurveyCatalogScope;

  /** Active associations (only the practitioner's own surveys have them). */
  @ApiProperty({ type: [TemplateAssignmentDto] })
  assignments!: TemplateAssignmentDto[];
}
