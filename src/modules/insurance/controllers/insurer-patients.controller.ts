import { Body, Controller, Get, Header, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPreconditionFailedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  InsurerPatientConversationDto,
  InsurerPatientConversationResponseDto,
  InsurerPatientListDto,
  InsurerPatientOptionsDto,
  InsurerPatientSearchQueryDto,
} from '../dto/insurer-patients.dto';
import { InsurerPatientsService } from '../services/insurer-patients.service';

/** El servicio valida plataforma o membresía vigente en la aseguradora activa. */
@ApiTags('insurer-patients')
@ApiBearerAuth()
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
@Controller('insurance/patients')
export class InsurerPatientsController {
  constructor(private readonly service: InsurerPatientsService) {}

  @Post('search')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Consultar directorio de pacientes autorizado',
    description:
      'Aseguradoras: cobertura vigente en el tenant activo. Administración: padrón autorizado. Filtros en el cuerpo; respuesta mínima, total exacto y cursor.',
  })
  @ApiOkResponse({ type: InsurerPatientListDto })
  @ApiBadRequestResponse({
    description: 'Filtro, rango de fechas o cursor inválido.',
  })
  @ApiForbiddenResponse({ description: 'Sin acceso al directorio.' })
  listPatients(
    @Body() query: InsurerPatientSearchQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsurerPatientListDto> {
    return this.service.list(query, actor);
  }

  @Get('options')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Aseguradoras disponibles en el alcance autorizado',
  })
  @ApiOkResponse({ type: InsurerPatientOptionsDto })
  @ApiForbiddenResponse({ description: 'Sin acceso al directorio.' })
  options(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsurerPatientOptionsDto> {
    return this.service.options(actor);
  }

  @Post('conversation')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary:
      'Abrir o reutilizar la conversación interna con un paciente autorizado',
  })
  @ApiOkResponse({ type: InsurerPatientConversationResponseDto })
  @ApiBadRequestResponse({ description: 'Paciente o canal inválido.' })
  @ApiForbiddenResponse({ description: 'Sin acceso al directorio.' })
  @ApiNotFoundResponse({
    description: 'Paciente fuera del alcance autorizado.',
  })
  @ApiPreconditionFailedResponse({
    description: 'Perfiles no disponibles para mensajería o bloqueados.',
  })
  openConversation(
    @Body() dto: InsurerPatientConversationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsurerPatientConversationResponseDto> {
    return this.service.openConversation(dto, actor);
  }
}
