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
import { LiabilityService } from '../services';
import { PayLiabilityDto, LiabilityPaymentResponseDto } from '../dto';

/** Pasivos: liquidación de cuota principal+interés (UC-16-12). */
@ApiTags('accounting-liabilities')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingLiabilityController {
  constructor(private readonly liabilityService: LiabilityService) {}

  /** UC-16-12. */
  @Post('liabilities/:id/payments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Liquidar cuota de pasivo (principal + interés)' })
  pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayLiabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LiabilityPaymentResponseDto> {
    return this.liabilityService.payLiability(id, dto, actor);
  }
}
