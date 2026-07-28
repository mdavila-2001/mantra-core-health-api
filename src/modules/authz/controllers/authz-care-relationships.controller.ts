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
