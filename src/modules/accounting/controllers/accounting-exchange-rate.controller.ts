import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ExchangeRateService } from '../services';
import { RegisterExchangeRateDto, ExchangeRateResponseDto } from '../dto';

/** Tipos de cambio: registro/upsert para conversión (UC-16-14). */
@ApiTags('accounting-fx')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingExchangeRateController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param exchangeRateService - Valor de exchange rate service requerido por la operación.
   */
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /** UC-16-14. */
  @Post('exchange-rates')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar tipo de cambio para conversión' })
  register(
    @Body() dto: RegisterExchangeRateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExchangeRateResponseDto> {
    return this.exchangeRateService.registerRate(dto, actor);
  }
}
