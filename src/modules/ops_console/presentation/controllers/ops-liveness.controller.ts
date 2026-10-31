import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import {
  InstanceLivenessService,
  type InstanceLivenessResponse,
} from '../../application/instance-liveness.service';
import { OPS_READ_ROLES } from './ops-console.controller';

/**
 * Sonda de vida de instancias: API, 26 workers, bases y servicios auxiliares.
 * Sólo lectura; nunca escribe en Redis ni audita.
 */
@ApiTags('ops-console')
@ApiBearerAuth()
@Controller('admin/ops')
export class OpsLivenessController {
  constructor(private readonly liveness: InstanceLivenessService) {}

  @Get('instances/liveness')
  @Roles(...OPS_READ_ROLES)
  @ApiOperation({
    summary:
      'Vida de cada instancia (VIVA/DEGRADADA/CAIDA/SIN_DATO) con causa y evidencia',
    description:
      'Workers por latido guardado en Redis y evaluado con el reloj de la API; bases y servicios por sonda en la petición (la de `/readiness`, cacheada 10 s). Responde 200 también con Redis caído (`heartbeatStore.status=down`). `notMeasured` dice lo que no se mide.',
  })
  instancesLiveness(): Promise<InstanceLivenessResponse> {
    return this.liveness.liveness();
  }
}
