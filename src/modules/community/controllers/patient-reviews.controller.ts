import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CommunityReviewsService } from '../services';
import { CreateReviewDto, ReviewResponseDto } from '../dto';

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
   */
  constructor(private readonly service: CommunityReviewsService) {}

  /**
   * Califico una atención que ya terminó.
   *
   * El servidor comprueba que el encuentro sea mío, que haya terminado y que
   * lo haya atendido el profesional que queda calificado; y que no lo haya
   * calificado ya. Quién califica sale del token, nunca del cuerpo.
   */
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
