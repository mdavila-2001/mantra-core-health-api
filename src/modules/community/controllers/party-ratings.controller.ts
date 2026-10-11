import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { PartyRatingsReadService, PartyRatingsService } from '../services';
import {
  MyRatingDto,
  PartyRatingResultDto,
  RATING_PARTY_TYPES,
  RatePartyDto,
  RatingListDto,
  RatingSummaryDto,
  RatingTargetQueryDto,
  MyRatingsQueryDto,
} from '../dto';

/**
 * Calificación en malla con estrellas: médico, paciente y organización se
 * califican entre sí (v4.2.42).
 *
 * No hay `@Roles`: quién puede calificar con qué identidad lo decide el servicio
 * contra la sesión (claims de paciente y de médico, administración de la
 * organización), y quién puede leer la nota de un paciente, también.
 */
@ApiTags('community-ratings')
@ApiBearerAuth()
@Controller('community/ratings')
export class PartyRatingsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras.
   * @param readService - Lecturas.
   */
  constructor(
    private readonly service: PartyRatingsService,
    private readonly readService: PartyRatingsReadService,
  ) {}

  /** Califico (o recalifico) a una parte. Idempotente por respaldo. */
  @Put()
  @ApiOperation({
    summary: 'Calificar con estrellas a un médico, paciente u organización',
    description:
      'Exige una atención terminada cuando hay un paciente de por medio, y el vínculo de trabajo entre médico y organización. Volver a calificar el mismo respaldo actualiza la calificación.',
  })
  rate(
    @Body() dto: RatePartyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PartyRatingResultDto> {
    return this.service.rate(dto, actor);
  }

  /** Nota media de una parte. */
  @Get('summary')
  @ApiOperation({ summary: 'Nota media de un médico, paciente u organización' })
  summary(
    @Query() query: RatingTargetQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RatingSummaryDto> {
    return this.readService.summary(
      { type: query.targetType, id: query.targetId },
      actor,
    );
  }

  /** Las calificaciones que hice, para precargar el formulario. */
  @Get('mine')
  @ApiOperation({ summary: 'Mis calificaciones' })
  @ApiQuery({ name: 'reviewerType', enum: RATING_PARTY_TYPES })
  mine(
    @Query() query: MyRatingsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyRatingDto[]> {
    return this.readService.mine(
      query.reviewerType,
      query.reviewerOrganizationId,
      actor,
    );
  }

  /** Nota media y calificaciones individuales de una parte. */
  @Get()
  @ApiOperation({
    summary: 'Calificaciones de un médico, paciente u organización',
  })
  list(
    @Query() query: RatingTargetQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RatingListDto> {
    return this.readService.list(
      { type: query.targetType, id: query.targetId },
      actor,
    );
  }
}
