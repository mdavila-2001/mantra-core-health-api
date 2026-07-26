import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AssetService } from '../services';
import {
  CapitalizeAssetDto,
  AssetResponseDto,
  RunDepreciationDto,
  DepreciationRunResponseDto,
} from '../dto';

/** Activos fijos: capitalización (UC-16-10) y depreciación batch (UC-16-11). */
@ApiTags('accounting-assets')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingAssetController {
  constructor(private readonly assetService: AssetService) {}

  /** UC-16-10. */
  @Post('assets/capitalize')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capitalizar activo (alta y asignación)' })
  capitalize(
    @Body() dto: CapitalizeAssetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssetResponseDto> {
    return this.assetService.capitalize(dto, actor);
  }

  /** UC-16-11. */
  @Post('depreciation/run')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ejecutar depreciación de activos (batch)' })
  runDepreciation(
    @Body() dto: RunDepreciationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DepreciationRunResponseDto> {
    return this.assetService.runDepreciation(dto, actor);
  }
}
