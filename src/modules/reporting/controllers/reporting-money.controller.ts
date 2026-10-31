import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, requireTenantId } from '../../../common';
import { MoneyQueryDto, MoneyResponseDto } from '../dto/reporting-money.dto';
import { ReportingMoneyService } from '../services/reporting-money.service';

/** Dinero: más sensible que el uso. Plataforma, seguridad y finanzas. */
export const MONEY_READ_ROLES = [
  'PLATFORM_ADMIN',
  'SECURITY_ADMIN',
  'PAYMENTS_ADMIN',
  'ACCOUNTING_APPROVER',
] as const;

/**
 * CONTRATO — `GET /admin/analytics/money?from&to` (H2.S1.M2). Solo lectura.
 * Detalle completo: `mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H2-dinero-y-heatmap.md`.
 *
 * ```
 * 200 {
 *   window: { from: ISO-8601, to: ISO-8601 },          // [from, to) en UTC; por defecto 7 días; máx. 92
 *   items: [{
 *     module: 'billing' | 'quotations' | 'payments',   // módulo real de la fuente
 *     moduleLabel: string,
 *     kind: 'FACTURADO' | 'COBRADO' | 'COTIZADO' | 'OTRO',
 *     currency: string,                                // ISO-4217; un renglón por moneda, JAMÁS se suman monedas
 *     operations: number,                              // filas con importe y moneda que entraron
 *     amount: string                                   // decimal exacto, 2 decimales, cadena (nunca number)
 *   }],                                                // orden: module, moduleLabel, kind, currency
 *   notMeasured: [{ module: string, reason: string }]  // lo que no tiene fuente verificable o quedó fuera de la suma
 * }
 * 401 sin sesión · 403 ROLE_INSUFFICIENT · 422 TENANT_REQUIRED (sin tenant)
 * 422 VALIDATION_FAILED details.reason ∈ EMPTY_WINDOW | WINDOW_TOO_LARGE | INVALID_DATE
 * 400 VALIDATION_FAILED: from/to no ISO o parámetro no declarado
 * ```
 *
 * Los renglones son por fuente y NO son aditivos entre módulos: un cobro de
 * `billing` puede estar ligado a una transacción de `payments` (`transaction_id`).
 * Vacío honesto: sin operaciones, `items` es `[]` (no hay ceros inventados).
 * Solo agregados: ninguna fila lleva datos de personas.
 */
@ApiTags('reporting-money')
@ApiBearerAuth()
@Controller('admin/analytics')
export class ReportingMoneyController {
  constructor(private readonly service: ReportingMoneyService) {}

  @Get('money')
  @Roles(...MONEY_READ_ROLES)
  @ApiOperation({
    summary:
      'Dinero por módulo, tipo (facturado/cobrado/cotizado) y moneda; lo no medido se declara',
  })
  @ApiOkResponse({ type: MoneyResponseDto })
  money(@Query() query: MoneyQueryDto) {
    return this.service.money(query, requireTenantId());
  }
}
