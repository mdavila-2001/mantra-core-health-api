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
import { PermissionSetsService } from '../services';
import { CreatePermissionSetDto, PublishSetVersionDto, PermissionSetVersionDto } from '../dto';

/** Sets de permisos delegados y su versionado (UC-29-02). */
@ApiTags('delegated-access-permission-sets')
@ApiBearerAuth()
@Controller('delegated-permission-sets')
export class DelegatedPermissionSetsController {
  constructor(private readonly service: PermissionSetsService) {}

  /** UC-29-02: publica el set (versión 1). */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar set de permisos delegados (scoped)' })
  createSet(
    @Body() dto: CreatePermissionSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    return this.service.createSet(dto, actor);
  }

  /** UC-29-02: publica una nueva versión del set. */
  @Post(':id/versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Versionar set de permisos delegados' })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishSetVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    return this.service.publishVersion(id, dto, actor);
  }
}
