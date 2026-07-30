import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AccrualService } from '../services';
import {
  CreateAccrualObjectDto,
  AccrualObjectResponseDto,
  RunAccrualsDto,
  AccrualRunResponseDto,
} from '../dto';

/** Devengos: alta de objeto/cronograma (UC-16-06) y corrida periódica (UC-16-07). */
@ApiTags('accounting-accruals')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingAccrualController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param accrualService - Valor de accrual service requerido por la operación.
   */
  constructor(private readonly accrualService: AccrualService) {}

  /** UC-16-06. */
  @Post('accrual-objects')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear objeto de devengo y su cronograma' })
  createAccrualObject(
    @Body() dto: CreateAccrualObjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccrualObjectResponseDto> {
    return this.accrualService.createAccrualObject(dto, actor);
  }

  /** UC-16-07. */
  @Post('accruals/run')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Postear devengo periódico (accrual run)' })
  runAccruals(
    @Body() dto: RunAccrualsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccrualRunResponseDto> {
    return this.accrualService.runAccruals(dto, actor);
  }
}
