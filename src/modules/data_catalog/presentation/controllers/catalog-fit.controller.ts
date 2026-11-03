import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common';
import {
  Audited,
  NotAudited,
} from '../../../../common/audit-trail/audit-trail.decorators';
import { TenantAgnostic } from '../../../../common/tenant/tenant-agnostic.decorator';
import { CatalogFitService } from '../../application/fit/catalog-fit.service';
import {
  CATALOG_WRITE_ROLES,
  PORTAL_READ_ROLES,
} from '../../data_catalog.constants';
import {
  CatalogFitDto,
  FitRunAcceptedDto,
  FitRunResultDto,
} from '../dto/catalog-fit.dto';
import { ValidationFailedHttp } from './admin-catalog.errors';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Sonda de ajuste de la catalogación: ¿sigue el catálogo ajustado a la realidad (rutas del código,
 * esquema de la base, inventario importado)? Lecturas para los roles de lectura del portal;
 * pedir una corrida sólo para `CATALOG_WRITE_ROLES`. Fuera de cualquier tenant.
 */
@ApiTags('admin-catalog')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/catalog/fit')
export class AdminCatalogFitController {
  constructor(private readonly fit: CatalogFitService) {}

  @Get()
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Último resultado de la sonda de ajuste de la catalogación',
    description:
      'Puntaje por dimensión con numerador y denominador (`null` cuando no hay base, nunca 0), comprobaciones con id estable, severidad, evidencia y cómo corregir, e historial resumido. El resultado vive en la memoria del proceso con TTL declarado (`retention`); `state` distingue VIGENTE, ATRASADO y SIN_RESULTADO.',
  })
  @ApiResponse({ status: 200, type: CatalogFitDto })
  latest(): CatalogFitDto {
    return this.fit.latest() as unknown as CatalogFitDto;
  }

  @Audited({
    action: 'DATA_CATALOG_FIT_RUN_REQUESTED',
    entity: 'catalog_fit_run',
    entityId: 'result.runId',
  })
  @Post('run')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      '8–128 caracteres; la misma clave devuelve la corrida ya aceptada. Con una corrida en vuelo también se devuelve esa, sin crear otra',
  })
  @ApiOperation({
    summary:
      'Pide una corrida de la sonda de ajuste (se ejecuta fuera de la petición)',
  })
  @ApiResponse({ status: 202, type: FitRunAcceptedDto })
  run(@Headers('idempotency-key') key: string | undefined): FitRunAcceptedDto {
    if (!key || !IDEMPOTENCY_KEY.test(key))
      throw ValidationFailedHttp(
        'Idempotency-Key',
        'La cabecera Idempotency-Key es obligatoria (8–128 caracteres: letras, números, . _ : -)',
      );
    const { run, created } = this.fit.request('MANUAL', key);
    return {
      runId: run.runId,
      status: run.status,
      created,
      acceptedAt: run.requestedAt,
      statusUrl: '/admin/catalog/fit',
    };
  }
}

/**
 * Plano de ejecución del tick de la sonda de ajuste. Sólo lo llama el worker `data_catalog` con su
 * identidad de servicio (`SYSTEM`). A diferencia del 202 de la consola, espera a que la corrida
 * termine: el worker necesita el desenlace para que un fallo de la sonda cuente como tick fallido
 * en su registro de salud (y se vea en «Instancias»).
 */
@ApiTags('data-catalog-internal')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('internal/catalog/fit')
export class InternalCatalogFitController {
  constructor(private readonly fit: CatalogFitService) {}

  @NotAudited(
    'Plomería del worker: la sonda no escribe en el catálogo; su resultado vive en memoria y el sello por tick sólo repetiría la hora.',
  )
  @Post('run')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Una clave por ventana de tick: un reintento dentro de la ventana no crea otra corrida',
  })
  @ApiOperation({
    summary: 'Corre la sonda de ajuste y espera su desenlace (worker)',
  })
  @ApiResponse({ status: 200, type: FitRunResultDto })
  async run(
    @Headers('idempotency-key') key: string | undefined,
  ): Promise<FitRunResultDto> {
    if (key !== undefined && !IDEMPOTENCY_KEY.test(key))
      throw ValidationFailedHttp(
        'Idempotency-Key',
        'La cabecera Idempotency-Key debe tener 8–128 caracteres: letras, números, . _ : -',
      );
    const { run, created, summary } = await this.fit.requestAndWait(
      'TICK',
      key ?? null,
    );
    return {
      runId: run.runId,
      status: run.status,
      created,
      ...(summary ?? {}),
      ...(run.errorCode ? { errorCode: run.errorCode } : {}),
    };
  }
}
