import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import {
  BulkRequestDto,
  BulkResponseDto,
} from '../../../../common/dto/bulk-load.dto';
import { BulkSiteAvailabilityUseCase } from '../../application/site-availability/bulk-site-availability.use-case';
import { SetSiteProductAvailabilityUseCase } from '../../application/site-availability/set-site-product-availability.use-case';
import { SetSiteAvailabilityDto, SiteAvailabilityResponseDto } from '../dto';

/**
 * Stock por sucursal (FAR-06): la farmacia dice, sede por sede, si tiene cada
 * producto. Comparte el prefijo `/pharmacies` con el catálogo del módulo 24,
 * pero escribe por el libro de este módulo; el ámbito (farmacia del tenant →
 * sede → producto) lo resuelve el caso de uso.
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacies')
export class PharmacySiteAvailabilityController {
  constructor(
    private readonly setAvailability: SetSiteProductAvailabilityUseCase,
    private readonly bulkAvailability: BulkSiteAvailabilityUseCase,
  ) {}

  /** «Lo tengo / No lo tengo» de un producto en una sede. */
  @Audited({
    action: 'PHARMACY_SITE_AVAILABILITY_SET',
    entity: 'pharmacy_site_product',
    entityId: 'param:productId',
  })
  @Put(':pharmacyId/sites/:siteId/products/:productId/availability')
  @Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar si una sucursal tiene un producto, y cuántas unidades',
  })
  @ApiOkResponse({ type: SiteAvailabilityResponseDto })
  setSiteAvailability(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: SetSiteAvailabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteAvailabilityResponseDto> {
    return this.setAvailability.execute(
      { pharmacyId, siteId, productId },
      dto,
      actor,
    );
  }

  /**
   * El stock de una sucursal en lote, con el contrato de la carga masiva del
   * catálogo: `{ mode, dryRun, rows }`, hasta 1000 filas
   * `{ productCode, available, quantity? }`, una por producto de esa sede. La
   * vista previa (`dryRun`) responde lo mismo sin escribir. 200 aunque haya
   * filas rechazadas; cada una dice su motivo en `results`.
   */
  @Audited({
    action: 'PHARMACY_SITE_AVAILABILITY_BULK_LOADED',
    dryRunAction: 'PHARMACY_SITE_AVAILABILITY_BULK_PREVIEWED',
    entity: 'pharmacy_site',
    entityId: 'param:siteId',
  })
  @Post(':pharmacyId/sites/:siteId/availability/bulk')
  @Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Marcar en lote qué productos tiene una sucursal, y cuántos, con vista previa',
  })
  @ApiOkResponse({ type: BulkResponseDto })
  bulkSiteAvailability(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: BulkRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    return this.bulkAvailability.execute({ pharmacyId, siteId }, dto, actor);
  }
}
