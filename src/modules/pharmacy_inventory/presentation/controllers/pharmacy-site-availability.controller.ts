import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
}
