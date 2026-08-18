import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import {
  CommunityReviewsService,
  CommunityReviewsReadService,
} from '../services';
import {
  CreateReviewDto,
  CreateReviewResponseDto,
  IdResponseDto,
  ReviewResponseDto,
  ServiceReviewPageDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Endpoint de reviews verificadas de servicio. */
@ApiTags('community-reviews')
@ApiBearerAuth()
@Controller('community/profiles')
export class CommunityReviewsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de reviews.
   * @param readService - Lecturas de reviews.
   */
  constructor(
    private readonly service: CommunityReviewsService,
    private readonly readService: CommunityReviewsReadService,
  ) {}

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

  /**
   * UC-19-11 (cara de lectura). Reviews publicadas de un perfil.
   *
   * La respuesta **no** incluye `verifiedEncounterId` ni el perfil del
   * paciente que escribió: ver `ServiceReviewDto`.
   */
  @Get(':profileId/reviews')
  @ApiOperation({ summary: 'Reviews publicadas de un perfil' })
  listProfileReviews(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ServiceReviewPageDto> {
    return this.readService.listProfileReviews(profileId, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /**
   * UC-19-11: el profesional contesta una reseña de su propia vitrina.
   *
   * `community.review_responses` existía como tabla y la lectura ya devolvía las
   * respuestas, pero no había forma de crear ninguna: un profesional podía ser
   * calificado en público sin poder contestar.
   */
  @Post(':profileId/reviews/:reviewId/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Responder una reseña de la propia vitrina' })
  respondToReview(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: CreateReviewResponseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.respondToReview(profileId, reviewId, dto, actor);
  }
}
