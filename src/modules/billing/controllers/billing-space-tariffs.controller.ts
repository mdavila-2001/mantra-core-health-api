import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
  CloseSpaceTariffDto,
  CreateSpaceTariffDto,
  ListSpaceTariffsQueryDto,
  ListSpaceTariffsResponseDto,
  SpaceTariffResponseDto,
} from '../dto';
import { SpaceTariffsService } from '../services/space-tariffs.service';

/**
 * Tarifas de espacio versionadas (CONTRATO-F2-F5 F5e): día-cama por categoría de
 * cama y quirófano por tiempo.
 *
 * Sin `@Roles`: la regla es de **alcance** (Facturación en su sede, administración de
 * la organización) y la decide `BillingAccessService`. Una práctica de otro tenant
 * responde 404 igual que una inexistente.
 */
@ApiTags('billing-space-tariffs')
@ApiBearerAuth()
@Controller('billing/space-tariffs')
export class BillingSpaceTariffsController {
  /**
   * @param tariffs - Tarifas de espacio.
   */
  constructor(private readonly tariffs: SpaceTariffsService) {}

  /** Tarifas de la práctica con sus vigencias. */
  @Get()
  @ApiOperation({ summary: 'Tarifas de espacio de la práctica, con vigencias' })
  @ApiResponse({
    status: 404,
    description: 'Práctica de otro tenant o fuera de alcance',
  })
  list(
    @Query() query: ListSpaceTariffsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListSpaceTariffsResponseDto> {
    return this.tariffs.list(query, actor);
  }

  /** Alta de una tarifa. */
  @Audited({
    action: 'SPACE_TARIFF_CREATED',
    entity: 'space_tariff',
    entityId: 'result.id',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una tarifa de día-cama o de quirófano por tiempo',
  })
  @ApiResponse({ status: 409, description: 'TARIFF_OVERLAP' })
  @ApiResponse({
    status: 422,
    description: 'TARIFF_SERVICE_NOT_IN_PRACTICE, TARIFF_SHAPE_INVALID',
  })
  create(
    @Body() dto: CreateSpaceTariffDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<SpaceTariffResponseDto> {
    return this.tariffs.create(dto, actor, requestId);
  }

  /** Cierre de la vigencia (no se edita ni se borra). */
  @Audited({
    action: 'SPACE_TARIFF_CLOSED',
    entity: 'space_tariff',
    entityId: 'param:id',
  })
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar una tarifa: deja de regir desde la fecha indicada',
  })
  @ApiResponse({ status: 422, description: 'TARIFF_CLOSE_INVALID' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSpaceTariffDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<SpaceTariffResponseDto> {
    return this.tariffs.close(id, dto, actor, requestId);
  }
}
