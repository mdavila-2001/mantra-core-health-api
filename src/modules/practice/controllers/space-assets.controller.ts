import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { SpaceAssetsReadService } from '../services/space-assets-read.service';

/**
 * Lecturas de F5 que la ficha de espacio consume (Desvíos W-F4F5). Sin
 * `@Roles`: decide el evaluador de §0.3 (`f5.space.*.read`).
 */
@ApiTags('practice-infrastructure')
@ApiBearerAuth()
@Controller()
export class SpaceAssetsController {
  constructor(private readonly read: SpaceAssetsReadService) {}

  /** Pestaña «Stock»: ubicaciones de inventario del espacio y farmacias de la sede. */
  @Get('care-spaces/:id/stock')
  @ApiOperation({ summary: 'Stock ubicado en un espacio (F5c)' })
  stock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.read.stock(id, actor, requireTenantId());
  }

  /** Pestaña «Equipos»: equipos diagnósticos ubicados en el espacio. */
  @Get('care-spaces/:id/equipment')
  @ApiOperation({ summary: 'Equipos ubicados en un espacio (F5a)' })
  spaceEquipment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.read.spaceEquipment(id, actor, requireTenantId());
  }

  /** Equipos de las unidades diagnósticas de la sede, filtrados por alcance. */
  @Get('sites/:siteId/diagnostic-equipment')
  @ApiOperation({ summary: 'Equipos diagnósticos de una sede (F5a)' })
  siteEquipment(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.read.siteEquipment(siteId, actor, requireTenantId());
  }

  /** F5b: puntos de toma de muestra disponibles de la sede. */
  @Get('sites/:siteId/sample-collection-points')
  @ApiOperation({ summary: 'Puntos de toma de muestra de una sede (F5b)' })
  collectionPoints(@Param('siteId', ParseUUIDPipe) siteId: string) {
    return this.read.collectionPoints(siteId, requireTenantId());
  }
}
