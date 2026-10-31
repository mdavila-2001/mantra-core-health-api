import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { OpsInstancesService } from '../../application/ops-instances.service';
import { HeartbeatAcceptedDto, HeartbeatDto } from '../dto/ops-heartbeat.dto';

/**
 * Ingesta de latidos de los workers (sonda de vida de instancias).
 *
 * ## Contrato — `POST /internal/ops/heartbeats`
 *
 * - Rol: **sólo `SYSTEM`** (el principal que cada worker se firma, igual que el
 *   precedente `platform-ops.controller.ts` `health-checks/:id/runs`). Un
 *   administrador (`PLATFORM_ADMIN`, `SRE`…) recibe 403: no puede fabricar
 *   latidos. Sin token, 401.
 * - Cuerpo, lista blanca estricta: `{ instanceId: string, type:
 *   'api'|'worker'|'database'|'service', version?: string }`. Cualquier otro
 *   campo (incluido `receivedAt`/`sentAt`) se rechaza con 400.
 * - `instanceId` debe estar declarado en el registro de instancias y vivir de
 *   latidos (workers); si no, 422 con `reason: 'INSTANCE_UNKNOWN'` y no se
 *   guarda nada.
 * - Respuesta: **202** `{ accepted: true }`. El instante (`receivedAt`) lo fija
 *   el servidor con SU reloj; el cliente no participa.
 * - Idempotente: repetirlo sobrescribe el último latido de esa instancia.
 * - Almacén: Redis (hash `ops:heartbeat:v1`). Si falla, 503 y el worker
 *   reintenta en su siguiente intervalo.
 * - No lleva `@Audited` ni se mide en `/admin/ops/traffic`
 *   (`EXCLUDED_HTTP_PATHS`): 25 workers × 4/min no aportan valor ahí.
 *
 * La lectura está en {@link OpsInstancesController} (`GET
 * /admin/ops/instances/liveness`).
 */
@ApiTags('ops-instances')
@ApiBearerAuth()
@Controller('internal/ops')
export class OpsHeartbeatController {
  constructor(private readonly instances: OpsInstancesService) {}

  @Post('heartbeats')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Registrar el latido de una instancia (sólo workers, rol SYSTEM)',
    description:
      'El servidor guarda la hora de recepción con su propio reloj; el cliente no puede enviarla.',
  })
  @ApiAcceptedResponse({ type: HeartbeatAcceptedDto })
  async heartbeat(@Body() dto: HeartbeatDto): Promise<HeartbeatAcceptedDto> {
    await this.instances.recordHeartbeat(dto);
    return { accepted: true };
  }
}
