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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzCareRelationshipsService } from '../services';
import {
  CreateCareRelationshipDto,
  CreateLegalRepresentationDto,
  RequestCareRelationshipDto,
  RespondCareRelationshipDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
  CareRelationshipView,
  LegalRepresentationView,
} from '../dto';

/**
 * Relación asistencial (C-06 / CAN-AUTH-001) y representación legal del paciente
 * (C-07 / A-03): bases legítimas de acceso que consume el PDP.
 */
@ApiTags('authz-care-relationships')
@ApiBearerAuth()
@Controller('authz')
export class AuthzCareRelationshipsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: AuthzCareRelationshipsService) {}

  // --- Relación asistencial -------------------------------------------------

  /**
   * Ejecuta la operación establish care relationship.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de establish care relationship conforme al contrato `Promise<AuthzIdResponseDto>`.
   */
  @Post('care-relationships')
  @Roles('CLINICIAN', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Establecer una relación asistencial' })
  establishCareRelationship(
    @Body() dto: CreateCareRelationshipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.service.establishCareRelationship(dto, actor);
  }

  /**
   * Elimina o desactiva revoke care relationship.
   *
   * @param id - Identificador de id.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de revoke care relationship conforme al contrato `Promise<AuthzStatusResultDto>`.
   */
  @Post('care-relationships/:id/revoke')
  @Roles('CLINICIAN', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar o expirar una relación asistencial' })
  revokeCareRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.service.revokeCareRelationship(id, actor);
  }

  /**
   * Obtiene list care relationships.
   *
   * @param tenantId - Identificador de tenant.
   * @param patientProfileId - Identificador de patient profile.
   * @returns Resultado de list care relationships conforme al contrato `Promise<CareRelationshipView[]>`.
   */
  @Get('care-relationships')
  @Roles('CLINICIAN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar relaciones asistenciales de un paciente' })
  @ApiQuery({ name: 'tenantId', format: 'uuid' })
  @ApiQuery({ name: 'patientProfileId', format: 'uuid' })
  listCareRelationships(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('patientProfileId', ParseUUIDPipe) patientProfileId: string,
  ): Promise<CareRelationshipView[]> {
    return this.service.listCareRelationshipsByPatient(
      tenantId,
      patientProfileId,
    );
  }

  /**
   * FT-07-R06: la bandeja del paciente — sus solicitudes de vínculo que
   * siguen `PENDING`. El sujeto sale de la sesión, no de la ruta.
   *
   * @param actor - El paciente logueado.
   */
  @Get('care-relationships/requests/mine')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Mis solicitudes de relación asistencial pendientes de decidir',
  })
  listMyPendingCareRelationshipRequests(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareRelationshipView[]> {
    return this.service.listMyPendingCareRelationshipRequests(actor);
  }

  /**
   * FT-07-R05: un practicante que encontró al paciente por búsqueda pide su
   * autorización — la relación nace `PENDING` y no concede ningún acceso
   * hasta que el paciente responda.
   *
   * @param dto - Paciente, tenant y motivo de la solicitud.
   * @param actor - El practicante que la envía (debe tener perfil propio).
   */
  @Post('care-relationships/request')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Solicitar autorización del paciente para una relación asistencial',
  })
  requestCareRelationship(
    @Body() dto: RequestCareRelationshipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.service.requestCareRelationship(dto, actor);
  }

  /**
   * FT-07-R06/R07: sólo el paciente titular de la solicitud puede
   * responderla. `ACCEPT` la activa (con las especialidades que declare
   * autorizar); `REJECT` la cierra sin conceder acceso. Ambas quedan
   * auditadas.
   *
   * @param id - Solicitud a responder.
   * @param dto - Decisión del paciente.
   * @param actor - Debe ser el paciente titular (`actor.patientProfileId`).
   */
  @Post('care-relationships/:id/respond')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Responder (aceptar/rechazar) una solicitud de relación asistencial',
  })
  respondToCareRelationshipRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondCareRelationshipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.service.respondToCareRelationshipRequest(id, dto, actor);
  }

  // --- Representación legal --------------------------------------------------

  /**
   * Ejecuta la operación establish legal representation.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de establish legal representation conforme al contrato `Promise<AuthzIdResponseDto>`.
   */
  @Post('legal-representations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una representación legal del paciente' })
  establishLegalRepresentation(
    @Body() dto: CreateLegalRepresentationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.service.establishLegalRepresentation(dto, actor);
  }

  /**
   * Elimina o desactiva revoke legal representation.
   *
   * @param id - Identificador de id.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de revoke legal representation conforme al contrato `Promise<AuthzStatusResultDto>`.
   */
  @Post('legal-representations/:id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar o expirar una representación legal' })
  revokeLegalRepresentation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.service.revokeLegalRepresentation(id, actor);
  }

  /**
   * Obtiene list legal representations.
   *
   * @param tenantId - Identificador de tenant.
   * @param patientProfileId - Identificador de patient profile.
   * @returns Resultado de list legal representations conforme al contrato `Promise<LegalRepresentationView[]>`.
   */
  @Get('legal-representations')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar representaciones legales de un paciente' })
  @ApiQuery({ name: 'tenantId', format: 'uuid' })
  @ApiQuery({ name: 'patientProfileId', format: 'uuid' })
  listLegalRepresentations(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('patientProfileId', ParseUUIDPipe) patientProfileId: string,
  ): Promise<LegalRepresentationView[]> {
    return this.service.listLegalRepresentationsByPatient(
      tenantId,
      patientProfileId,
    );
  }
}
