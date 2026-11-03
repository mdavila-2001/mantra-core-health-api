import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SurveysCatalogService } from '../services';
import { SurveyCatalogEntryDto } from '../dto';

/** Survey catalog of the practitioner, on `/surveys/catalog`. */
@ApiTags('surveys-catalog')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('surveys/catalog')
export class SurveysCatalogController {
  constructor(private readonly catalog: SurveysCatalogService) {}

  /** Base surveys plus the practitioner's own, with their services. */
  @Get()
  @ApiOperation({ summary: 'Catálogo de encuestas con sus servicios' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SurveyCatalogEntryDto[]> {
    return this.catalog.list(actor);
  }
}
