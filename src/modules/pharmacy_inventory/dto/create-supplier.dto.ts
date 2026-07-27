import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /pharmacy/:pharmacyId/suppliers` (bootstrap de proveedor). */
export class CreateSupplierDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Tenant del proveedor (directory.tenants)',
  })
  @IsUUID()
  supplierTenantId!: string;

  @ApiPropertyOptional({ description: 'Código interno del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  supplierCode?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Business partner ERP' })
  @IsOptional()
  @IsUUID()
  businessPartnerId?: string;
}
