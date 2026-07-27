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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { OrgextAffiliationsService } from '../services';
import {
  CreateAffiliationDto,
  AffiliationResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de afiliaciones entre organizaciones (UC-22-07, 09). Capa fina:
 * valida parámetros y delega en el servicio de dominio.
 */
@ApiTags('orgext-affiliations')
@ApiBearerAuth()
@Controller('orgext/affiliations')
export class OrgextAffiliationsController {
  constructor(
    private readonly affiliationsService: OrgextAffiliationsService,
  ) {}

  /** UC-22-07. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Declarar afiliación entre organizaciones' })
  declare(
    @Body() dto: CreateAffiliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    return this.affiliationsService.declare(dto, actor);
  }

  /** UC-22-09. */
  @Post(':id/terminate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar afiliación y revocar acceso' })
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.affiliationsService.terminate(id, actor);
  }
}
