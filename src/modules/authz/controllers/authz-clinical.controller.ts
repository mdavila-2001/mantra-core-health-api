import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzClinicalService } from '../services';
import {
  CreateClinicalAccessGrantDto,
  BreakTheGlassDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
} from '../dto';

/** UC-06-06 (acceso clínico), UC-06-07 (break-the-glass), UC-06-10 (revocar). */
@ApiTags('authz-clinical')
@ApiBearerAuth()
@Roles('CLINICAL_APPROVER', 'SECURITY_ADMIN')
@Controller('authz')
export class AuthzClinicalController {
  constructor(private readonly clinicalService: AuthzClinicalService) {}

  /** UC-06-06 (clínico tratante o paciente que autoriza; autenticado). */
  @Post('patients/:patientProfileId/clinical-access-grants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar acceso clínico con propósito de uso' })
  grantClinicalAccess(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Body() dto: CreateClinicalAccessGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.clinicalService.grantClinicalAccess(
      patientProfileId,
      dto,
      actor,
    );
  }

  /** UC-06-07 (emergencia; el clínico invocante queda registrado). */
  @Post('patients/:patientProfileId/break-the-glass')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Break-the-glass / anulación de emergencia' })
  breakTheGlass(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Body() dto: BreakTheGlassDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.clinicalService.breakTheGlass(patientProfileId, dto, actor);
  }

  /** UC-06-10. */
  @Delete('clinical-access-grants/:grantId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar o expirar una concesión de acceso clínico',
  })
  revokeClinicalAccess(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.clinicalService.revokeClinicalAccess(grantId, actor);
  }
}
