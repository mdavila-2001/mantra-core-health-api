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
import { CodeSystemsService } from '../services';
import {
  CreateCodeSystemDto,
  CodeSystemResponseDto,
  CreateCodeSystemVersionDto,
  CodeSystemVersionResponseDto,
} from '../dto';

/**
 * Endpoints de administración de sistemas de códigos y sus versiones (UC-03-01,
 * UC-03-02). Reservados a `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/code-systems')
export class TerminologyCodeSystemsController {
  constructor(private readonly codeSystemsService: CodeSystemsService) {}

  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-03-01: crea un sistema de códigos y su fuente' })
  createCodeSystem(
    @Body() dto: CreateCodeSystemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CodeSystemResponseDto> {
    return this.codeSystemsService.createCodeSystem(dto, user);
  }

  @Post(':id/versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-02: crea una versión (borrador) de un sistema de códigos',
  })
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCodeSystemVersionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CodeSystemVersionResponseDto> {
    return this.codeSystemsService.createVersion(id, dto, user);
  }
}
