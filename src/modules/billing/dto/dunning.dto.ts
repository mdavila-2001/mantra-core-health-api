import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ítem de morosidad: una factura vencida a incluir en la corrida (UC-17-10). */
export class DunningItemInputDto {
  /**
   * Identificador asociado a invoice.
   */
  @ApiProperty({
    description: 'Factura morosa (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  invoiceId!: string;

  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Saldo pendiente', example: '50.00' })
  @IsOptional()
  @IsNumberString()
  outstandingAmount?: string;

  /**
   * Valor de days overdue mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Días de mora', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  daysOverdue?: number;

  /**
   * Valor de dunning fee mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Recargo por mora', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  dunningFee?: string;

  /**
   * Identificador asociado a business partner.
   */
  @ApiPropertyOptional({
    description: 'Socio de negocio (erp.business_partners)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  businessPartnerId?: string;
}

/** Cuerpo de `POST /billing/dunning-runs:execute` (UC-17-10). */
export class ExecuteDunningRunDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant (directory.tenants)', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de corrida (único por tenant)' })
  @IsString()
  @MaxLength(60)
  runNumber!: string;

  /**
   * Valor de run date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha de la corrida (ISO); por defecto hoy',
  })
  @IsOptional()
  @IsDateString()
  runDate?: string;

  /**
   * Identificador asociado a dunning level concept.
   */
  @ApiPropertyOptional({
    description: 'Nivel de morosidad (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dunningLevelConceptId?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [DunningItemInputDto],
    description: 'Facturas morosas (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DunningItemInputDto)
  items!: DunningItemInputDto[];
}

/** Respuesta de una corrida de morosidad. */
export class DunningRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @ApiProperty()
  runNumber!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty()
  itemCount!: number;
}
