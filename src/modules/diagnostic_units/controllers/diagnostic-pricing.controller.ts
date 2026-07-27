import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  DiagnosticPricingService,
  DiagnosticStudiesService,
} from '../services';
import {
  CreateStudyPriceDto,
  StatusResultDto,
  StudyPriceResponseDto,
} from '../dto';

/**
 * Endpoints de precios y retiro de ofertas: versionado de precio de un cronograma
 * (UC-23-07), cierre de una versión de precio (UC-23-08) y retiro de una oferta
 * de estudio (UC-23-08). Se agrupan aquí porque comparten el prefijo de precios y
 * el catálogo de estudios sin colgar de `/diagnostic-units/{id}`.
 */
@ApiTags('diagnostic-pricing')
@ApiBearerAuth()
@Controller()
export class DiagnosticPricingController {
  constructor(
    private readonly pricingService: DiagnosticPricingService,
    private readonly studiesService: DiagnosticStudiesService,
  ) {}

  /** UC-23-07. */
  @Post('price-schedules/:scheduleId/study-prices')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Fijar/versionar el precio de un estudio (append-only)',
  })
  addStudyPrice(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: CreateStudyPriceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StudyPriceResponseDto> {
    return this.pricingService.addStudyPrice(scheduleId, dto, actor);
  }

  /** UC-23-08. */
  @Post('study-prices/:priceId/close')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una versión de precio vigente' })
  closePrice(
    @Param('priceId', ParseUUIDPipe) priceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.pricingService.closePrice(priceId, actor);
  }

  /** UC-23-08. */
  @Delete('diagnostic-study-offerings/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar (soft-delete) una oferta de estudio' })
  retireOffering(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.studiesService.retireOffering(id, actor);
  }
}
