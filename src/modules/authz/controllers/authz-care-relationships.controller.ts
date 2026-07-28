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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  constructor(private readonly service: AuthzCareRelationshipsService) {}

  // --- Relación asistencial -------------------------------------------------

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
