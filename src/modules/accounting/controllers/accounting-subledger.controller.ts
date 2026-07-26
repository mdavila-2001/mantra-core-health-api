import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SubledgerService } from '../services';
import {
  CreateOpenItemDto,
  OpenItemResponseDto,
  CreateClearingDto,
  ClearingResponseDto,
} from '../dto';

/** Subledgers AR/AP: partida abierta (UC-16-08) y clearing (UC-16-09). */
@ApiTags('accounting-subledger')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingSubledgerController {
  constructor(private readonly subledgerService: SubledgerService) {}

  /** UC-16-08. */
  @Post('open-items')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar partida abierta en subledger' })
  createOpenItem(
    @Body() dto: CreateOpenItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OpenItemResponseDto> {
    return this.subledgerService.createOpenItem(dto, actor);
  }

  /** UC-16-09. */
  @Post('clearing-documents')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Compensar/clearing de partidas abiertas' })
  clearOpenItems(
    @Body() dto: CreateClearingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClearingResponseDto> {
    return this.subledgerService.clearOpenItems(dto, actor);
  }
}
