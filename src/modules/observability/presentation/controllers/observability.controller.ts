import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { Audited } from '../../../../common/audit-trail/audit-trail.decorators';
import { CurrentUser } from '../../../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../../common/auth/authenticated-user.interface';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { OPS_READ_ROLES } from '../../../ops_console/presentation/controllers/ops-console.controller';
import { ObservabilityReadService } from '../../application/observability-read.service';
import {
  ChangeErrorGroupStateDto,
  EndpointsQueryDto,
  ErrorEventsQueryDto,
  ErrorGroupsQueryDto,
  IntervalWindowQueryDto,
  PageQueryDto,
  SqlStatementsQueryDto,
  TimeseriesQueryDto,
  WindowQueryDto,
} from '../dto/observability-query.dto';

/**
 * Portal «Sistema»: lectura de la observabilidad persistida (módulo 70).
 *
 * ## `@PlatformScopeOptional()` va por MÉTODO, nunca en la clase
 *
 * Marca «sin `X-Tenant-Id` = alcance plataforma» para quien tiene un rol de
 * plataforma global. En una ruta de **sólo lectura** es lo que queremos; puesta
 * en la clase se heredaría en cualquier ruta que se agregue después, incluida
 * una que mute, y esa ruta dejaría de exigir una organización sin que nadie lo
 * haya decidido. Por eso cada `GET` lo declara y el `PATCH` de estado no.
 */
@ApiTags('observability')
@ApiBearerAuth()
@Controller('admin/observability')
export class ObservabilityController {
  constructor(private readonly service: ObservabilityReadService) {}

  @Get('summary')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Estado del sistema en la ventana: KPIs con null+reason',
  })
  summary(@Query() query: WindowQueryDto) {
    return this.service.summary(query);
  }

  @Get('timeseries')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Serie temporal de una métrica (un cubo sin fila es «sin dato»)',
  })
  timeseries(@Query() query: TimeseriesQueryDto) {
    return this.service.timeseries(query);
  }

  @Get('endpoints')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Operaciones por tráfico, fallos y latencia' })
  endpoints(@Query() query: EndpointsQueryDto) {
    return this.service.endpoints(query);
  }

  @Get('modules')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Errores y latencia por módulo' })
  modules(@Query() query: WindowQueryDto) {
    return this.service.modules(query);
  }

  @Get('coverage')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Qué se mide, qué no, y si la propia medición está sana',
  })
  coverage(@Query() query: WindowQueryDto) {
    return this.service.coverage(query);
  }

  @Get('errors/groups')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Grupos de errores (huella estable) con su actividad',
  })
  errorGroups(@Query() query: ErrorGroupsQueryDto) {
    return this.service.errorGroups(query);
  }

  @Get('errors/groups/:id')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Un grupo de errores con sus eventos recientes' })
  errorGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: IntervalWindowQueryDto,
  ) {
    return this.service.errorGroup(id, query);
  }

  @Get('errors/events')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Eventos de error (sin mensajes), paginados' })
  errorEvents(@Query() query: ErrorEventsQueryDto) {
    return this.service.errorEvents(query);
  }

  @Get('requests/:requestId')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary:
      'Qué se guardó de una petición (errores y muestra lenta) por su requestId',
  })
  request(@Param('requestId') requestId: string) {
    return this.service.request(requestId);
  }

  /**
   * Cambia el estado de un grupo. **Sin** `@PlatformScopeOptional`: muta, así
   * que exige una organización elegida (o un rol global con resolución propia,
   * como `SUPERADMIN`). Es la decisión conservadora; ver el README del módulo.
   */
  @Audited({
    action: 'ERROR_GROUP_STATE_CHANGED',
    entity: 'error_group',
    entityId: 'param:id',
  })
  @Patch('errors/groups/:id')
  @Roles('PLATFORM_ADMIN', 'SRE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Marcar un grupo como visto, resuelto o ignorado (con motivo y versión)',
  })
  changeErrorGroupState(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeErrorGroupStateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.changeGroupState(id, dto, actor.id);
  }

  @Get('sql/statements')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Consultas SQL por coste (huella, nunca parámetros)',
  })
  sqlStatements(@Query() query: SqlStatementsQueryDto) {
    return this.service.sqlStatements(query);
  }

  @Get('sql/statements/:hash')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Una consulta normalizada y quién la dispara' })
  sqlStatement(
    @Param('hash') hash: string,
    @Query() query: IntervalWindowQueryDto,
  ) {
    return this.service.sqlStatement(hash, query);
  }

  @Get('sql/slow')
  @Roles(...OPS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Peticiones lentas o con error muestreadas, con su SQL',
  })
  sqlSlow(@Query() query: PageQueryDto) {
    return this.service.sqlSlow(query);
  }
}
