import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CommunityReviewableCareService,
  CommunityReviewsService,
} from '../services';
import {
  CreateReviewDto,
  ReviewableCareDto,
  ReviewableCareQueryDto,
  ReviewResponseDto,
} from '../dto';

/**
 * Calificar la atención recibida, desde el portal del paciente (C.2).
 *
 * ## Por qué cuelga de `/patients/me` y no de `/community/profiles/:id`
 *
 * Porque la pregunta que responde es «quiero calificar **la atención que
 * recibí**», y el paciente identifica esa atención por el encuentro, no por el
 * uuid de la vitrina del profesional. La ficha pública se abre por slug y **no
 * publica su id** —un identificador interno regalado a un anónimo no se vuelve
 * a esconder—, así que pedirlo en la ruta obligaría a filtrarlo en la lectura
 * pública, que es justo lo que esa lectura evita.
 *
 * La ruta de `/community/profiles/:profileId/reviews` **sigue existiendo** y
 * hace lo mismo: es la que usa quien ya tiene el id en la mano. Las dos entran
 * al mismo caso de uso; acá sólo se resuelve a quién se está calificando.
 */
@ApiTags('community-reviews')
@ApiBearerAuth()
@Controller('patients/me')
export class PatientReviewsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de reseñas.
   * @param reviewableCare - Lectura de si una atención se puede reseñar.
   */
  constructor(
    private readonly service: CommunityReviewsService,
    private readonly reviewableCare: CommunityReviewableCareService,
  ) {}

  /**
   * ¿Puedo calificar la atención de esta reserva? Devuelve el encuentro que la
   * respalda y si la reseña sería aceptada.
   */
  @Get('reviewable-care')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Consultar si una atención recibida se puede calificar',
    description:
      'Parte de la reserva (la misma de la encuesta) y devuelve el encuentro que respalda la reseña pública, el nombre público del profesional, y `alreadyReviewed` / `canReview`. Una reserva ajena o inexistente responde 404 igual.',
  })
  getReviewableCare(
    @Query() query: ReviewableCareQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewableCareDto> {
    return this.reviewableCare.getReviewableCare(
      query.appointmentBookingId,
      actor,
    );
  }

  /**
   * Califico una atención que ya terminó.
   *
   * El servidor comprueba que el encuentro sea mío, que haya terminado y que
   * lo haya atendido el profesional que queda calificado; y que no lo haya
   * calificado ya. Quién califica sale del token, nunca del cuerpo.
   */
  @Audited({
    action: 'PATIENT_SERVICE_REVIEW_PUBLISHED',
    entity: 'service_review',
    entityId: 'result.id',
  })
  @Post('reviews')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Calificar una atención recibida',
    description:
      'El destinatario sale del encuentro declarado: no hace falta conocer el identificador de la vitrina del profesional.',
  })
  publishOwnReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    return this.service.publishOwnReview(dto, actor);
  }
}
