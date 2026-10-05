import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  InsurerPatientListDto,
  InsurerPatientSearchQueryDto,
} from '../dto/insurer-patients.dto';
import { InsurerPatientsService } from '../services/insurer-patients.service';

/**
 * Directorio de pacientes de la aseguradora activa.
 *
 * **Sin `@Roles`**, igual que `InsurerReceivedClaimsController`: la barrera
 * depende de a QUÉ aseguradora pertenece la sesión y se evalúa en
 * `InsurerContextService`. Ninguna ruta recibe un id de aseguradora.
 */
@ApiTags('insurer-patients')
@ApiBearerAuth()
@Controller('insurance/patients')
export class InsurerPatientsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Lectura del directorio.
   */
  constructor(private readonly service: InsurerPatientsService) {}

  /**
   * Los pacientes con cobertura en un plan de la aseguradora activa o con un
   * reclamo presentado a ella, paginados por cursor.
   *
   * @param query - Filtros del directorio.
   * @param actor - La sesión que pregunta.
   * @returns Una página y el cursor de la siguiente.
   */
  @Get()
  @ApiOperation({
    summary: 'Directorio de pacientes de la aseguradora activa',
    description:
      'Sólo pacientes con cobertura en un plan de esta aseguradora o con un reclamo presentado a ella. Filiación y contacto, nada clínico. Paginado por cursor, sin total.',
  })
  @ApiOkResponse({ type: InsurerPatientListDto })
  @ApiBadRequestResponse({ description: 'Filtro o cursor inválido.' })
  @ApiForbiddenResponse({
    description:
      'La organización activa no es una aseguradora, o la sesión no tiene permiso sobre ella.',
  })
  listPatients(
    @Query() query: InsurerPatientSearchQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsurerPatientListDto> {
    return this.service.list(query, actor);
  }
}
