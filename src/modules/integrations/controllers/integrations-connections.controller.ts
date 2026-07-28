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
import { IntegrationsConnectionsService } from '../services';
import {
  RotateCredentialDto,
  CredentialRotationResponseDto,
  PauseConnectionResultDto,
} from '../dto';

/**
 * Endpoints sobre conexiones de proveedor: rotación de credencial (ingeniería de
 * plataforma) y pausa por circuit breaker (ops/worker). Las rutas usan el sufijo
 * de acción con dos puntos (`credentials:rotate`, `:pause`); en Express 5 el `:`
 * literal se escapa con `\:` en el patrón de ruta.
 */
@ApiTags('integrations-connections')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsConnectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param connectionsService - Valor de connections service requerido por la operación.
   */
  constructor(
    private readonly connectionsService: IntegrationsConnectionsService,
  ) {}

  /** UC-12-03. */
  @Post('connections/:id/credentials\\:rotate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar/expirar la credencial de una conexión' })
  rotateCredential(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RotateCredentialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CredentialRotationResponseDto> {
    return this.connectionsService.rotateCredential(id, dto, actor);
  }

  /** UC-12-12. */
  @Post('connections/:id\\:pause')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pausar una conexión en fallo (circuit breaker)' })
  pauseConnection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PauseConnectionResultDto> {
    return this.connectionsService.pauseConnection(id, actor);
  }
}
