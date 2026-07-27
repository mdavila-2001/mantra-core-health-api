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
import { CodeSystemVersionsService } from '../services';
import {
  ImportConceptsDto,
  ImportConceptsResponseDto,
  PublishVersionResponseDto,
} from '../dto';

/**
 * Endpoints de ciclo de vida de una versión de sistema de códigos: importación de
 * conceptos (UC-03-03) y publicación (UC-03-04). Reservados a `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/versions')
export class TerminologyVersionsController {
  constructor(private readonly versionsService: CodeSystemVersionsService) {}

  @Post(':versionId/import')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-03: importa conceptos en una versión en borrador',
  })
  importConcepts(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ImportConceptsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ImportConceptsResponseDto> {
    return this.versionsService.importConcepts(versionId, dto, user);
  }

  @Post(':versionId/publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-04: publica una versión (borrador → activa)',
  })
  publishVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublishVersionResponseDto> {
    return this.versionsService.publishVersion(versionId, user);
  }
}
