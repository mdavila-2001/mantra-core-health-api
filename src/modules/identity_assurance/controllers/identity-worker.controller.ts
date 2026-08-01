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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IdentityChecksService } from '../services';
import {
  AttemptResponseDto,
  CheckResultResponseDto,
  DispatchableChecksResponseDto,
  RecordAttemptDto,
  RecordResultDto,
} from '../dto';

/**
 * Superficie que consume el worker de `identity_assurance`.
 *
 * Va aparte de `IdentityChecksController` a propósito: aquéllas son operaciones
 * de gobierno que ejecuta un administrador con un veredicto ya decidido por una
 * persona; éstas las ejecuta un proceso automático que descubre trabajo y
 * asienta lo que dijo la autoridad externa. Compartir ruta obligaría a que el
 * rol `SYSTEM` heredara la superficie administrativa entera.
 */
@ApiTags('identity_assurance')
@ApiBearerAuth()
@Controller('internal/identity')
export class IdentityWorkerController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param checksService - Valor de checks service requerido por la operación.
   */
  constructor(private readonly checksService: IdentityChecksService) {}

  /** Descubrimiento: qué checks hay que despachar o seguir esperando. */
  @Get('checks/dispatchable')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar los checks que el worker debe atender en este tick',
  })
  listDispatchable(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<DispatchableChecksResponseDto> {
    return this.checksService.listDispatchable(limit);
  }

  /** Asienta el intento de despacho contra la autoridad externa. */
  @Post('checks/:id/attempts')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el intento del worker contra la autoridad externa',
  })
  recordAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    return this.checksService.recordAttempt(id, dto, actor);
  }

  /**
   * Asienta el veredicto de la autoridad. Es el punto que puede cerrar el caso
   * (verificarlo y emitir su aserción, o rechazarlo).
   */
  @Post('checks/:id/results')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el veredicto que devolvió la autoridad externa',
  })
  recordResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckResultResponseDto> {
    return this.checksService.recordResult(id, dto, actor);
  }
}
