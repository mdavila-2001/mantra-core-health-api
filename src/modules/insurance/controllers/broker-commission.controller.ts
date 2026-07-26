import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { BrokerCommissionService } from '../services';
import { CreateCommissionStatementDto, CreatedResourceDto } from '../dto';

/**
 * Liquidaciones de comisión de broker (UC-26-14). Capa fina que delega en
 * `BrokerCommissionService`.
 */
@ApiTags('insurance-broker-commission')
@ApiBearerAuth()
@Controller('broker-commission-statements')
export class BrokerCommissionController {
  constructor(private readonly service: BrokerCommissionService) {}

  /** UC-26-14. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar liquidación de comisión de broker' })
  generate(
    @Body() dto: CreateCommissionStatementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.generate(dto, actor);
  }
}
