import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Query de `GET /pharmacy-erp/stock`. */
export class ErpStockQueryDto {
  @ApiProperty({
    description:
      'Código de la sucursal en el sistema externo (la plataforma manda el de su sede)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  siteCode!: string;

  @ApiPropertyOptional({
    description:
      'Código de la farmacia en la plataforma: dos farmacias con sedes del mismo código no comparten stock',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pharmacyCode?: string;
}

export class ErpProductDto {
  @ApiProperty({ example: 'ERP-0001' })
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  presentation!: string;

  @ApiProperty({ example: 'BOX' })
  unitCode!: string;
}

export class ErpProductsResponseDto {
  @ApiProperty({ type: [ErpProductDto] })
  items!: ErpProductDto[];
}

export class ErpStockLineDto {
  @ApiProperty({ example: 'ERP-0001' })
  code!: string;

  @ApiProperty({ description: 'Unidades para vender en la sucursal' })
  quantity!: number;
}

export class ErpStockResponseDto {
  @ApiProperty()
  siteCode!: string;

  @ApiPropertyOptional()
  pharmacyCode?: string;

  @ApiProperty({ format: 'date-time' })
  asOf!: string;

  @ApiProperty({ type: [ErpStockLineDto] })
  items!: ErpStockLineDto[];
}
