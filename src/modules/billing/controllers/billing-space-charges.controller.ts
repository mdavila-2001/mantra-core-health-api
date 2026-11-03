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
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Audited,
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { SpaceChargesService } from '../services/space-charges.service';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `POST /billing/space-tariffs`. */
export class CreateSpaceTariffDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() practiceId!: string;
  @ApiProperty({ enum: ['BED_DAY', 'OR_TIME'] })
  @IsIn(['BED_DAY', 'OR_TIME'])
  tariffKind!: 'BED_DAY' | 'OR_TIME';
  @ApiPropertyOptional({ description: 'BED_CAT_*' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bedCategoryCode?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() serviceCatalogId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) unitMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) minimumUnits?: number;
  @ApiProperty({ example: '350.00' })
  @IsNumberString()
  @MaxLength(24)
  unitPrice!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
  @ApiProperty({ example: '2026-11-01' }) @Matches(DATE) validFrom!: string;
  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsOptional()
  @Matches(DATE)
  validTo?: string;
}

/** `POST /billing/space-tariffs/:id/close`. */
export class CloseSpaceTariffDto {
  @ApiProperty({ example: '2026-12-01' }) @Matches(DATE) validTo!: string;
}

/** `POST /billing/charge-captures/:id/void`. */
export class VoidChargeDto {
  @ApiProperty() @IsString() @MaxLength(500) reason!: string;
}

/** `POST /internal/billing/bed-day-charges/run`. */
export class RunBedDayDto {
  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(DATE)
  date?: string;
}

/**
 * Cargos de espacio (F5e, CONTRATO-F2-F5 §F5e): tarifas, día-cama por
 * medianoche, quirófano por tiempo, pendientes y anulación.
 */
/** `GET /billing/bed-day/stays`. */
export class StaysQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() siteId!: string;
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;
  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

@ApiTags('billing-space-charges')
@ApiBearerAuth()
@Controller()
export class BillingSpaceChargesController {
  constructor(private readonly charges: SpaceChargesService) {}

  /** Tarifas de espacios de una práctica. */
  @Get('billing/space-tariffs')
  @ApiOperation({ summary: 'Tarifas de espacios' })
  list(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.listTariffs(practiceId, actor, requireTenantId());
  }

  /** Alta de tarifa (409 TARIFF_OVERLAP por EXCLUDE). */
  @Audited({
    action: 'SPACE_TARIFF_CREATED',
    entity: 'space_tariff',
    entityId: 'result.id',
  })
  @Post('billing/space-tariffs')
  @ApiOperation({ summary: 'Crear una tarifa de espacio' })
  create(
    @Body() dto: CreateSpaceTariffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.createTariff(dto, actor, requireTenantId());
  }

  /** Cierre de vigencia. */
  @Audited({
    action: 'SPACE_TARIFF_CLOSED',
    entity: 'space_tariff',
    entityId: 'param:id',
  })
  @Post('billing/space-tariffs/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la vigencia de una tarifa' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSpaceTariffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.closeTariff(id, dto.validTo, actor, requireTenantId());
  }

  /** Estancias de internación de la sede (de dónde elige Facturación). */
  @Get('billing/bed-day/stays')
  @ApiOperation({ summary: 'Estancias de internación de una sede (F5e)' })
  stays(@Query() q: StaysQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.charges.stays(q, actor, requireTenantId());
  }

  /** Cargos devengados pendientes de un encuentro. */
  @Get('billing/encounters/:encounterId/pending-charges')
  @ApiOperation({ summary: 'Cargos devengados pendientes' })
  pending(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.pending(encounterId, actor, requireTenantId());
  }

  /** Devengo de día-cama a pedido (idempotente). */
  @Audited({
    action: 'BED_DAY_CHARGES_RUN',
    entity: 'charge_capture',
    entityId: 'param:encounterId',
  })
  @Post('billing/encounters/:encounterId/bed-day-charges/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Devengar los días-cama de un encuentro' })
  run(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.runBedDays(encounterId, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Anular un cargo devengado. */
  @Audited({
    action: 'CHARGE_CAPTURE_VOIDED',
    entity: 'charge_capture',
    entityId: 'param:id',
  })
  @Post('billing/charge-captures/:id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular un cargo devengado' })
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidChargeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.charges.voidCharge(id, dto.reason, actor, requireTenantId());
  }

  /** Worker: día-cama y quirófano por tiempo. */
  @Audited({ action: 'BED_DAY_CHARGES_TICKED', entity: 'charge_capture' })
  @Post('internal/billing/bed-day-charges/run')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Devengar día-cama y quirófano (worker)' })
  runInternal(@Body() dto: RunBedDayDto) {
    return this.charges.runInternal(dto.date);
  }
}
