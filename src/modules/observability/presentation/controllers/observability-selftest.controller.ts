import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Roles } from '../../../../common';

class SelftestFailQuery {
  @IsOptional()
  @IsIn(['throw', 'type'])
  kind?: 'throw' | 'type';
}

/**
 * Ruta de falla controlada para probar el panel (D-06 del plan).
 *
 * - **Sólo existe fuera de producción**: el módulo no la registra con
 *   `NODE_ENV=production` y, por si el entorno se leyó tarde, el handler
 *   responde 404 también.
 * - Rol `SYSTEM` (`SUPERADMIN` pasa por el comodín del guard).
 * - **Excluida de la medición HTTP** (`/internal/observability/` no entra en el
 *   sink ni en las series) para que las cuentas de una carga conocida sean
 *   exactas; el error SÍ se captura, porque es justo lo que se quiere ver.
 */
@ApiExcludeController()
@Controller('internal/observability/selftest')
export class ObservabilitySelftestController {
  @Get('fail')
  @Roles('SYSTEM')
  @HttpCode(500)
  fail(@Query() query: SelftestFailQuery): never {
    if (process.env.NODE_ENV === 'production') throw new NotFoundException();
    if (query.kind === 'type') {
      const holder = undefined as unknown as { value: { deep: string } };
      // TypeError real, como el de un bug de verdad.
      throw new TypeError(`no se puede leer ${String(holder.value.deep)}`);
    }
    throw new Error('selftest: falla controlada');
  }
}
