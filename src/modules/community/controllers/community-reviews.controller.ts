import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { CommunityReviewsService } from '../services';
import { CreateReviewDto, ReviewResponseDto } from '../dto';

/** Endpoint de reviews verificadas de servicio. */
@ApiTags('community-reviews')
@ApiBearerAuth()
@Controller('community/profiles')
export class CommunityReviewsController {
  constructor(private readonly service: CommunityReviewsService) {}

  /** UC-19-11. */
  @Post(':profileId/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una review verificada de servicio' })
  publishReview(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    return this.service.publishReview(profileId, dto, actor);
  }
}
