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
import { FiscalService } from '../services';
import {
  CreateFiscalYearDto,
  FiscalYearResponseDto,
  LockPeriodDto,
  AccountingStatusDto,
} from '../dto';

/** Calendario fiscal: apertura de ejercicio (UC-16-04) y bloqueo de periodo (UC-16-05). */
@ApiTags('accounting-fiscal')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingFiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  /** UC-16-04. */
  @Post('fiscal-years')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir un ejercicio fiscal y sus periodos' })
  openFiscalYear(
    @Body() dto: CreateFiscalYearDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FiscalYearResponseDto> {
    return this.fiscalService.openFiscalYear(dto, actor);
  }

  /** UC-16-05. */
  @Post('fiscal-periods/:id/lock')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar/bloquear un periodo fiscal' })
  lockPeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LockPeriodDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountingStatusDto> {
    return this.fiscalService.lockPeriod(id, dto, actor);
  }
}
