import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { InstanceLivenessService } from '../../application/instance-liveness.service';
import { HeartbeatAcceptedDto, HeartbeatDto } from '../dto/ops-heartbeat.dto';

/**
 * Ingesta de latidos de los workers. Sólo el rol `SYSTEM` (el que firma
 * `SystemApiClient`): un administrador no puede fabricar la vida de un
 * proceso. Sin `@Audited` a propósito: 27 workers × 4/min serían 108 filas de
 * auditoría por minuto sin valor. La ruta está excluida de la medición HTTP
 * (`EXCLUDED_HTTP_PATHS`).
 */
@ApiTags('ops-console')
@ApiBearerAuth()
@Controller('internal/ops')
export class OpsHeartbeatController {
  constructor(private readonly liveness: InstanceLivenessService) {}

  @Post('heartbeats')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Latido de un worker hacia la sonda de vida de instancias',
    description:
      'Idempotente: sobrescribe la entrada de la instancia. La edad se calcula con el reloj de la API (`receivedAt`), no con `sentAt`. `422 INSTANCE_UNKNOWN` si el id no está en el registro de instancias esperadas.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: HeartbeatAcceptedDto })
  record(@Body() dto: HeartbeatDto): Promise<HeartbeatAcceptedDto> {
    return this.liveness.recordHeartbeat(dto);
  }
}
