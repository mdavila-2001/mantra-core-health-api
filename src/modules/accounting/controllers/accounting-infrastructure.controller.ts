import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { CorrelationId } from '../../practice/http/request-decorators';
import {
  CostCenterUnitLinkDto,
  InfrastructureItemLocationDto,
  LinkCostCenterUnitDto,
  LocateInfrastructureItemDto,
} from '../dto';
import { AccountingInfrastructureService } from '../services/accounting-infrastructure.service';

/**
 * Contabilidad y espacios físicos (CONTRATO-F2-F5 F5f): dónde está cada activo y a
 * qué unidad corresponde cada centro de costo.
 *
 * Sin `@Roles`: la regla es de organización (`ORG_ADMIN` o `ACCOUNTING_APPROVER`) y la
 * decide el servicio. Un activo o un centro de costo de otro tenant responde 404.
 */
@ApiTags('accounting-infrastructure')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingInfrastructureController {
  /**
   * @param infrastructure - Ubicación de activos y centros de costo por unidad.
   */
  constructor(
    private readonly infrastructure: AccountingInfrastructureService,
  ) {}

  /** Ubica el activo en un espacio de su práctica. */
  @Audited({
    action: 'INFRASTRUCTURE_ITEM_LOCATED',
    entity: 'infrastructure_item',
    entityId: 'param:id',
  })
  @Patch('infrastructure-items/:id')
  @ApiOperation({
    summary: 'Ubicar un activo de infraestructura en un espacio',
  })
  @ApiResponse({
    status: 422,
    description: 'INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH',
  })
  locate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LocateInfrastructureItemDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<InfrastructureItemLocationDto> {
    return this.infrastructure.locateItem(id, dto, actor, requestId);
  }

  /** Vincula el centro de costo a una unidad clínica. */
  @Audited({
    action: 'COST_CENTER_UNIT_LINKED',
    entity: 'cost_center',
    entityId: 'param:id',
  })
  @Post('cost-centers/:id/unit-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vincular un centro de costo a una unidad clínica' })
  @ApiResponse({ status: 409, description: 'UNIT_ALREADY_HAS_COST_CENTER' })
  link(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkCostCenterUnitDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<CostCenterUnitLinkDto> {
    return this.infrastructure.linkCostCenterUnit(id, dto, actor, requestId);
  }
}
