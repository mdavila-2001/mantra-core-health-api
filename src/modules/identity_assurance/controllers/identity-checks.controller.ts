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
import { IdentityChecksService } from '../services';
import {
  RecordAttemptDto,
  RecordResultDto,
  AttemptResponseDto,
  CheckResultResponseDto,
} from '../dto';

/** Endpoints sobre `/identity/checks`: intentos (UC-27-05) y resultados (UC-27-06). */
@ApiTags('identity-checks')
@ApiBearerAuth()
@Controller('identity/checks')
export class IdentityChecksController {
  constructor(private readonly checksService: IdentityChecksService) {}

  /** UC-27-05. */
  @Post(':id/attempts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar un intento contra la autoridad externa (idempotente)',
  })
  recordAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    return this.checksService.recordAttempt(id, dto, actor);
  }

  /** UC-27-06. */
  @Post(':id/results')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el resultado inmutable del check (con supersede)',
  })
  recordResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckResultResponseDto> {
    return this.checksService.recordResult(id, dto, actor);
  }
}
