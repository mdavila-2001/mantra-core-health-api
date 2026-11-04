import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetStudyAvailabilityUseCase } from '../application/get-study-availability.use-case';
import {
  StudyAvailabilityDto,
  StudyAvailabilityQueryDto,
} from './dto/study-availability.dto';

/**
 * Free starts of a study in a center. Session only, no role: it is directory
 * data the patient needs to choose an appointment, like `GET /diagnostic-units/search`.
 */
@ApiTags('diagnostic-units')
@ApiBearerAuth()
@Controller('diagnostic-units')
export class StudyAvailabilityController {
  constructor(private readonly availability: GetStudyAvailabilityUseCase) {}

  @Get(':unitId/study-availability')
  @ApiOperation({ summary: 'Free starts of a study in a center' })
  @ApiOkResponse({ type: StudyAvailabilityDto })
  studyAvailability(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Query() query: StudyAvailabilityQueryDto,
  ): Promise<StudyAvailabilityDto> {
    return this.availability.execute(unitId, query);
  }
}
