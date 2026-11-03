import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  LinkCostCenterUnitDto,
  LocateInfrastructureItemDto,
  PracticeQueryDto,
} from '../dto/space-accounting.dto';
import { SpaceAccountingService } from '../services/space-accounting.service';

/**
 * Contabilidad por espacio y por unidad (CONTRATO-F2-F5 §F5f). Sin `@Roles`:
 * decide el evaluador de §0.3 a nivel práctica (`f5f.accounting.*`).
 */
@ApiTags('accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingSpaceController {
  constructor(private readonly service: SpaceAccountingService) {}

  /** Activos de infraestructura de la práctica con su espacio. */
  @Get('infrastructure-items')
  @ApiOperation({ summary: 'Activos de infraestructura con su espacio (F5f)' })
  listItems(
    @Query() q: PracticeQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.listItems(q.practiceId, actor, requireTenantId());
  }

  /** Ubicar (o desubicar) un activo en un espacio de la misma práctica. */
  @Audited({
    action: 'INFRASTRUCTURE_ITEM_LOCATED',
    entity: 'infrastructure_item',
    entityId: 'param:id',
  })
  @Patch('infrastructure-items/:id')
  @ApiHeader({ name: 'If-Match', required: false })
  @ApiOperation({ summary: 'Ubicar un activo en un espacio (F5f)' })
  locateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LocateInfrastructureItemDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.locateItem(
      id,
      dto.careSpaceId,
      ifMatch,
      actor,
      requireTenantId(),
    );
  }

  /** Centros de costo de la práctica con su unidad. */
  @Get('cost-centers')
  @ApiOperation({ summary: 'Centros de costo con su unidad (F5f)' })
  listCostCenters(
    @Query() q: PracticeQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.listCostCenters(q.practiceId, actor, requireTenantId());
  }

  /** Ligar un centro de costo a una unidad clínica (uno activo por unidad). */
  @Audited({
    action: 'COST_CENTER_UNIT_LINKED',
    entity: 'cost_center',
    entityId: 'param:id',
  })
  @Post('cost-centers/:id/unit-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ligar un centro de costo a una unidad (F5f)' })
  linkUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkCostCenterUnitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.linkUnit(
      id,
      dto.clinicalUnitId,
      actor,
      requireTenantId(),
    );
  }
}
