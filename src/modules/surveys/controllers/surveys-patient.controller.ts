import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { SurveysResponsesService } from '../services';
import {
  IdResponseDto,
  PatientInvitationDto,
  PatientQuestionnaireDto,
  SubmitResponseDto,
} from '../dto';

/**
 * Autoservicio del paciente sobre `/surveys/me/invitations`.
 *
 * **Sin `@Roles` a propósito**, igual que las vistas de paciente de agenda: el
 * filtro real no es un rol —todas las cuentas de paciente comparten el mismo—
 * sino tener perfil de paciente, y el servidor lo toma del claim de la sesión.
 * El identificador del paciente no se acepta por parámetro en ninguna de estas
 * rutas: si se aceptara, cualquiera podría pedir los cuestionarios de otro.
 */
@ApiTags('surveys-patient')
@ApiBearerAuth()
@Controller('surveys/me/invitations')
export class SurveysPatientController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param responsesService - Lectura y envío de cuestionarios del paciente.
   */
  constructor(private readonly responsesService: SurveysResponsesService) {}

  /** Los cuestionarios del paciente de la sesión. */
  @Get()
  @ApiOperation({ summary: 'Ver mis cuestionarios' })
  listMyInvitations(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientInvitationDto[]> {
    return this.responsesService.listMyInvitations(actor);
  }

  /** El cuestionario a responder, con sus preguntas. */
  @Get(':id')
  @ApiOperation({ summary: 'Abrir un cuestionario para responderlo' })
  getMyQuestionnaire(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientQuestionnaireDto> {
    return this.responsesService.getMyQuestionnaire(id, actor);
  }

  /** Envía la respuesta. Una sola vez y completa. */
  @Post(':id/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Responder el cuestionario' })
  submitResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.responsesService.submitResponse(id, dto, actor);
  }
}
