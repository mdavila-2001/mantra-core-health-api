import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PromotionsDiscountsService } from '../services';
import {
  CreatePromotionDto,
  PromotionResponseDto,
  IssueCouponsDto,
  IssueCouponsResponseDto,
  ValidateCouponDto,
  ValidateCouponResponseDto,
  CreateRedemptionDto,
  RedemptionResponseDto,
  ApplyDiscountDto,
  ApplyDiscountResponseDto,
  ReverseRedemptionDto,
  ReverseRedemptionResponseDto,
} from '../dto';

/** Endpoints de promociones, cupones y redenciones (UC-51-07 … 11). */
@ApiTags('promotions')
@ApiBearerAuth()
@Controller()
export class PromotionsController {
  constructor(private readonly discountsService: PromotionsDiscountsService) {}

  /** UC-51-07. */
  @Post('promotions')
  @Roles('PROMOTIONS_ADMIN', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una promoción con sus reglas de descuento' })
  createPromotion(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PromotionResponseDto> {
    return this.discountsService.createPromotion(dto, actor);
  }

  /** UC-51-08. */
  @Post('promotions/:id/coupons/batch')
  @Roles('PROMOTIONS_ADMIN', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir un lote de cupones',
    description:
      'Los códigos se generan aleatorios y únicos; la promoción debe estar activa.',
  })
  issueCoupons(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueCouponsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IssueCouponsResponseDto> {
    return this.discountsService.issueCoupons(id, dto, actor);
  }

  /** UC-51-09. */
  @Post('coupons/validate')
  @Roles('CASHIER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar un cupón contra una orden',
    description: 'No muta nada: informa si sirve y cuánto descontaría.',
  })
  validateCoupon(
    @Body() dto: ValidateCouponDto,
  ): Promise<ValidateCouponResponseDto> {
    return this.discountsService.validateCoupon(dto);
  }

  /** UC-51-09. */
  @Post('redemptions')
  @Roles('CASHIER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Redimir un cupón y registrar la redención' })
  redeemCoupon(
    @Body() dto: CreateRedemptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RedemptionResponseDto> {
    return this.discountsService.redeemCoupon(dto, actor);
  }

  /** UC-51-10. */
  @Post('checkout/:orderId/apply-discount')
  @Roles('CASHIER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar un descuento al intento de pago del checkout',
    description: 'Idempotente por el par intento-promoción.',
  })
  applyDiscount(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: ApplyDiscountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApplyDiscountResponseDto> {
    return this.discountsService.applyDiscount(orderId, dto, actor);
  }

  /** UC-51-11. */
  @Post('redemptions/:id/reverse')
  @Roles('CASHIER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revertir una redención por devolución o cancelación',
    description:
      'Libera el uso del cupón y compensa los puntos con una entrada de ajuste.',
  })
  reverseRedemption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseRedemptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReverseRedemptionResponseDto> {
    return this.discountsService.reverseRedemption(id, dto, actor);
  }
}
