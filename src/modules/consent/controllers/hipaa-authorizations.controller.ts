import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { HipaaAuthorizationsService } from '../services';
import {
  CreateHipaaAuthorizationDto,
  HipaaAuthorizationResponseDto,
  StatusResultDto,
} from '../dto';

/** Endpoints sobre `/consent/hipaa-authorizations`. */
@ApiTags('consent-hipaa-authorizations')
@ApiBearerAuth()
@Controller('consent/hipaa-authorizations')
export class HipaaAuthorizationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param hipaaService - Valor de hipaa service requerido por la operación.
   */
  constructor(private readonly hipaaService: HipaaAuthorizationsService) {}

  /** UC-07-04. */
  @Audited({
    action: 'HIPAA_AUTHORIZATION_GRANTED',
    entity: 'hipaa_authorization',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar autorización HIPAA de divulgación' })
  grant(
    @Body() dto: CreateHipaaAuthorizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HipaaAuthorizationResponseDto> {
    return this.hipaaService.grant(dto, actor);
  }

  /** UC-07-05. */
  @Audited({
    action: 'HIPAA_AUTHORIZATION_REVOKED',
    entity: 'hipaa_authorization',
    entityId: 'param:id',
  })
  @Post(':id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar autorización HIPAA' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.hipaaService.revoke(id, actor);
  }
}
