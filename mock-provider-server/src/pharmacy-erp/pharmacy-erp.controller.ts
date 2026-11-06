import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/api-key.guard';
import { PharmacyErpService } from './pharmacy-erp.service';
import {
  ErpProductsResponseDto,
  ErpStockQueryDto,
  ErpStockResponseDto,
} from './pharmacy-erp.dto';

@ApiTags('pharmacy-erp')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('pharmacy-erp')
export class PharmacyErpController {
  constructor(private readonly service: PharmacyErpService) {}

  @Get('products')
  @ApiOperation({
    summary:
      'Catálogo de la farmacia externa, con sus propios códigos (emulado)',
  })
  products(): Promise<ErpProductsResponseDto> {
    return this.service.products();
  }

  @Get('stock')
  @ApiOperation({
    summary: 'Stock de una sucursal de la farmacia externa (emulado)',
    description:
      'Determinista por farmacia y sucursal: el mismo pharmacyCode y siteCode devuelven siempre las mismas cantidades; dos farmacias con sedes del mismo código no comparten stock.',
  })
  stock(@Query() query: ErpStockQueryDto): Promise<ErpStockResponseDto> {
    return this.service.stock(query.siteCode, query.pharmacyCode);
  }
}
