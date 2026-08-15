import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Imputación analítica de un asiento contable a las dimensiones del laboratorio
 * (UC-17-34).
 *
 * El asiento se crea con el módulo `accounting`; acá solo se le añaden los ejes
 * que ese módulo no tiene (producto farmacéutico, visitador, campaña).
 */
export class CreateCostAllocationDto {
  /**
   * Asiento contable ya registrado en `accounting`.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  journalTransactionId!: string;

  /**
   * Naturaleza del costo.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  costTypeConceptId!: string;

  /**
   * Importe imputado.
   */
  @ApiProperty({ example: '1500.00' })
  @IsNumberString()
  amount!: string;

  /**
   * Moneda.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyConceptId!: string;

  /**
   * Fecha contable.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  allocatedOn!: string;

  /**
   * Producto imputado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaProductId?: string;

  /**
   * Proyecto imputado.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectCode?: string;

  /**
   * Sede imputada.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Área imputada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  area?: string;

  /**
   * Visitador imputado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicalVisitorId?: string;

  /**
   * Campaña imputada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  campaignCode?: string;
}
