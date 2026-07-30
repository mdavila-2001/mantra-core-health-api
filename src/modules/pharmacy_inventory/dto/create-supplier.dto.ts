import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /pharmacy/:pharmacyId/suppliers` (bootstrap de proveedor). */
export class CreateSupplierDto {
  /**
   * Identificador asociado a supplier tenant.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tenant del proveedor (directory.tenants)',
  })
  @IsUUID()
  supplierTenantId!: string;

  /**
   * Valor de supplier code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código interno del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  supplierCode?: string;

  /**
   * Identificador asociado a business partner.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Business partner ERP' })
  @IsOptional()
  @IsUUID()
  businessPartnerId?: string;
}
