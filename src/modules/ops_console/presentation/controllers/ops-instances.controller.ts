import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { OpsInstancesService } from '../../application/ops-instances.service';
import { OPS_READ_ROLES } from './ops-console.controller';

/**
 * Sonda de vida de instancias (API, workers, bases y servicios auxiliares).
 *
 * ## Contrato — `GET /admin/ops/instances/liveness`
 *
 * Roles: `OPS_READ_ROLES` (PLATFORM_ADMIN, SRE, SECURITY_ADMIN,
 * RELEASE_MANAGER, GOVERNANCE_ADMIN). Sólo lectura: no escribe en Redis ni en
 * la base. Responde **200 siempre que la API conteste**, incluso con Redis
 * caído (un 5xx impediría mostrar el motivo).
 *
 * ```jsonc
 * {
 *   "evaluatedAt": "ISO",                    // reloj de la API
 *   "thresholds": { "heartbeatIntervalSeconds": 15, "liveSeconds": 30, "degradedSeconds": 60 },
 *   "overall": "VIVA|DEGRADADA|CAIDA|SIN_DATO",
 *   "instances": [{
 *     "id": "worker-messaging",
 *     "type": "api|worker|database|service",
 *     "required": true,
 *     "state": "VIVA|DEGRADADA|CAIDA|SIN_DATO",
 *     "lastHeartbeatAt": "ISO|null",          // en bases/servicios: instante de la sonda
 *     "ageSeconds": 5,                        // entero (techo), null si nunca visto
 *     "thresholdSeconds": 60,                 // umbral que decide CAIDA; en sondas, su timeout
 *     "cause": "null|HEARTBEAT_LATE|HEARTBEAT_EXPIRED|NEVER_SEEN|STORE_UNAVAILABLE|CLOCK_INCONSISTENT|RECORD_CORRUPT|PROBE_FAILED|PROBE_TIMEOUT|PROBE_SLOW|PROBE_UNAVAILABLE",
 *     "evidence": "texto generado por el servidor, sin mensajes crudos de error"
 *   }],
 *   "notMeasured": [{ "id": "minio", "reason": "…" }]
 * }
 * ```
 *
 * Reglas de estado de un worker (edad = `evaluatedAt` − `receivedAt`, ambos del
 * reloj de la API; comparaciones en ms): edad ≤ 30 s `VIVA`; 30 s < edad ≤ 60 s
 * `DEGRADADA`; edad > 60 s `CAIDA`; nunca visto `SIN_DATO / NEVER_SEEN`.
 * Redis caído, registro corrupto o reloj incoherente (> 5 s en el futuro) son
 * `SIN_DATO`: **jamás `VIVA` sin evidencia**. `CAIDA` por latido vencido significa
 * «sin latido recibido», no «proceso muerto» (no se observó el proceso).
 *
 * `overall`: `CAIDA` si alguna instancia `required` está `CAIDA`; si no
 * `DEGRADADA` si alguna `required` está `DEGRADADA`; `SIN_DATO` si ninguna
 * `required` tiene evidencia; `DEGRADADA` si mezcla `VIVA` con `SIN_DATO`;
 * `VIVA` sólo si **todas** las `required` están `VIVA`.
 *
 * `required` de los workers sale del registro declarado (todos menos
 * `worker-files`, opt-in) y de `OPS_LIVENESS_REQUIRED_WORKERS`. `api` es
 * tautológico: sólo evidencia la instancia que respondió. Las dependencias
 * (`postgresql`, `mongodb`, `redis`, `opensearch`) se sondean en la petición
 * (timeout 3 s, resultado cacheado 10 s). Lo que no se mide se lista en
 * `notMeasured`; no se inventa.
 *
 * La ingesta de latidos está en {@link OpsHeartbeatController}.
 */
@ApiTags('ops-instances')
@ApiBearerAuth()
@Controller('admin/ops')
export class OpsInstancesController {
  constructor(private readonly instances: OpsInstancesService) {}

  @Get('instances/liveness')
  @Roles(...OPS_READ_ROLES)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Estado de vida de las instancias: VIVA / DEGRADADA / CAIDA / SIN_DATO con evidencia',
    description:
      'VIVA sólo con evidencia fresca medida con el reloj de la API; sin evidencia es SIN_DATO, nunca VIVA.',
  })
  liveness() {
    return this.instances.liveness();
  }
}
