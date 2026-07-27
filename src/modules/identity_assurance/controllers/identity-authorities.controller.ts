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
import { IdentityAuthoritiesService } from '../services';
import {
  RegisterAuthorityDto,
  CreateAuthorityEndpointDto,
  AuthorityResponseDto,
  AuthorityEndpointResponseDto,
} from '../dto';

/** Endpoints administrativos sobre `/identity/authorities` (UC-27-01). */
@ApiTags('identity-authorities')
@ApiBearerAuth()
@Controller('identity/authorities')
export class IdentityAuthoritiesController {
  constructor(
    private readonly authoritiesService: IdentityAuthoritiesService,
  ) {}

  /** UC-27-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una autoridad de identidad' })
  register(
    @Body() dto: RegisterAuthorityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthorityResponseDto> {
    return this.authoritiesService.registerAuthority(dto, actor);
  }

  /** UC-27-01. */
  @Post(':id/endpoints')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un endpoint de verificación de la autoridad',
  })
  addEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAuthorityEndpointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthorityEndpointResponseDto> {
    return this.authoritiesService.addEndpoint(id, dto, actor);
  }
}
